import { requireDbPool } from "@/lib/db";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

declare global {
  // Development-only fallback when DATABASE_URL is intentionally absent.
  // eslint-disable-next-line no-var
  var __commerceRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const store = globalThis.__commerceRateLimitStore ?? new Map<string, RateLimitEntry>();
if (!globalThis.__commerceRateLimitStore) globalThis.__commerceRateLimitStore = store;

export type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Process-local fallback for development environments without PostgreSQL.
 * Production/public endpoints should use checkSharedRateLimit().
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return {
      allowed: true,
      remaining: Math.max(options.limit - 1, 0),
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  if (current.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
    };
  }

  current.count += 1;
  store.set(key, current);
  return {
    allowed: true,
    remaining: Math.max(options.limit - current.count, 0),
    retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
  };
}

/**
 * Database-backed limiter shared by all application instances.
 * In production this fails closed if PostgreSQL/rate-limit infrastructure is
 * unavailable rather than silently dropping abuse protection.
 */
export async function checkSharedRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
    return checkRateLimit(key, options);
  }

  const windowSeconds = Math.max(Math.ceil(options.windowMs / 1000), 1);
  const result = await requireDbPool().query<{
    allowed: boolean;
    remaining: number;
    retry_after_seconds: number;
  }>(
    `SELECT allowed, remaining, retry_after_seconds
       FROM app_private.consume_public_rate_limit($1, $2, $3)`,
    [`endriya:public:v1:${key}`, options.limit, windowSeconds]
  );

  const row = result.rows[0];
  if (!row) throw new Error("Shared rate limiter returned no result");

  return {
    allowed: row.allowed,
    remaining: Number(row.remaining),
    retryAfterSeconds: Number(row.retry_after_seconds),
  };
}

function normalizeIp(value: string | null): string | null {
  if (!value) return null;
  const candidate = value.split(",")[0]?.trim();
  if (!candidate) return null;
  return candidate.slice(0, 128);
}

/**
 * The deployment proxy must overwrite forwarding headers rather than append
 * untrusted client values. Phase 9 verifies the final reverse-proxy behavior.
 */
export function getClientIp(request: Request): string {
  return (
    normalizeIp(request.headers.get("cf-connecting-ip")) ||
    normalizeIp(request.headers.get("x-real-ip")) ||
    normalizeIp(request.headers.get("x-forwarded-for")) ||
    "unknown"
  );
}

function positiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const defaultWindowMs = positiveNumber(
  process.env.PUBLIC_SUBMISSION_RATE_WINDOW_MS,
  10 * 60 * 1000
);

export const PUBLIC_SUBMISSION_LIMIT: RateLimitOptions = {
  limit: positiveNumber(process.env.PUBLIC_SUBMISSION_RATE_LIMIT, 10),
  windowMs: defaultWindowMs,
};

/** Caps total writes against one wedding even when source IPs rotate/spoof. */
export const PUBLIC_WEDDING_BURST_LIMIT: RateLimitOptions = {
  limit: positiveNumber(process.env.PUBLIC_WEDDING_BURST_RATE_LIMIT, 300),
  windowMs: defaultWindowMs,
};

/** Protects guest-token/wedding resolution before tenant data is queried. */
export const PUBLIC_RESOLUTION_LIMIT: RateLimitOptions = {
  limit: positiveNumber(process.env.PUBLIC_RESOLUTION_RATE_LIMIT, 60),
  windowMs: defaultWindowMs,
};

/** Protects public read endpoints such as wishes/RSVP hydration. */
export const PUBLIC_READ_LIMIT: RateLimitOptions = {
  limit: positiveNumber(process.env.PUBLIC_READ_RATE_LIMIT, 180),
  windowMs: defaultWindowMs,
};
