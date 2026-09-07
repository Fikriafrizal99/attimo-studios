import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function requireIncludes(source: string, needles: string[], label: string) {
  for (const needle of needles) {
    if (!source.includes(needle)) {
      throw new Error(`${label} missing required security marker: ${needle}`);
    }
  }
}

const auth = read("lib/auth.ts");
requireIncludes(
  auth,
  [
    'storage: "database"',
    'modelName: "rateLimit"',
    '"/sign-in/email"',
    "expiresIn: 60 * 60 * 24 * 7",
    "freshAge: 60 * 60",
    "disableSignUp: !allowPublicSignup",
  ],
  "Better Auth"
);

const rateLimit = read("lib/commerce/rate-limit.ts");
requireIncludes(
  rateLimit,
  [
    "checkSharedRateLimit",
    "app_private.consume_public_rate_limit",
    "PUBLIC_WEDDING_BURST_LIMIT",
    "PUBLIC_RESOLUTION_LIMIT",
    "PUBLIC_READ_LIMIT",
    "requireDbPool",
  ],
  "public rate limiter"
);

const rsvp = read("app/api/rsvp/route.ts");
requireIncludes(
  rsvp,
  [
    "checkSharedRateLimit",
    "PUBLIC_RESOLUTION_LIMIT",
    "PUBLIC_SUBMISSION_LIMIT",
    "PUBLIC_WEDDING_BURST_LIMIT",
    "guest:${guest.id}",
    '"Retry-After"',
  ],
  "RSVP route"
);

const wishes = read("app/api/wishes/route.ts");
requireIncludes(
  wishes,
  [
    "checkSharedRateLimit",
    "PUBLIC_RESOLUTION_LIMIT",
    "PUBLIC_SUBMISSION_LIMIT",
    "PUBLIC_WEDDING_BURST_LIMIT",
    "PUBLIC_READ_LIMIT",
    '"Retry-After"',
  ],
  "wishes route"
);

const nextConfig = read("next.config.ts");
requireIncludes(
  nextConfig,
  [
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "Content-Security-Policy",
    "frame-ancestors 'none'",
    "Strict-Transport-Security",
  ],
  "Next security headers"
);

const upload = read("app/api/weddings/[id]/upload/route.ts");
requireIncludes(
  upload,
  [
    "getSessionUser",
    "hasWeddingAccess",
    "detectWeddingImageType",
    "buildWeddingAssetPath",
    "createServiceRoleClient",
    "file.type !== detected.mimeType",
  ],
  "storage upload boundary"
);

const migration = read("supabase/migrations/20260907000300_phase8_security_rate_limits.sql");
requireIncludes(
  migration,
  [
    'public."rateLimit"',
    "app_private.public_rate_limits",
    "app_private.consume_public_rate_limit",
    "SECURITY DEFINER",
    "REVOKE ALL",
  ],
  "Phase 8 rate-limit migration"
);

console.log("Phase 8.1 security baseline verification passed");
