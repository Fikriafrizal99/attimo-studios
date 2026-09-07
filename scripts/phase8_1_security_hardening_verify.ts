import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function requireText(source: string, expected: string, label: string) {
  if (!source.includes(expected)) throw new Error(`Missing ${label}: ${expected}`);
}

const auth = read("lib/auth.ts");
const rateLimit = read("lib/commerce/rate-limit.ts");
const rsvp = read("app/api/rsvp/route.ts");
const wishes = read("app/api/wishes/route.ts");
const upload = read("app/api/weddings/[id]/upload/route.ts");
const headers = read("next.config.ts");
const license = read("docs/commerce/UPSTREAM_LICENSE_STATUS.md");
const migration = read("supabase/migrations/20260907000300_public_rate_limits.sql");

requireText(auth, "disableSignUp: !allowPublicSignup", "public-signup gate");
requireText(auth, "storage: \"database\"", "Better Auth shared rate-limit storage");
requireText(auth, "minPasswordLength: 8", "minimum password length");
requireText(auth, "BETTER_AUTH_SECRET must be configured", "production auth secret preflight");

requireText(rateLimit, "consume_public_rate_limit", "database-backed public limiter");
requireText(rateLimit, "fails closed", "rate-limit fail-closed policy");
requireText(rsvp, "PUBLIC_WEDDING_BURST_LIMIT", "RSVP wedding burst protection");
requireText(rsvp, "guest_token", "RSVP personal guest scope");
requireText(wishes, "PUBLIC_WEDDING_BURST_LIMIT", "wishes wedding burst protection");
requireText(wishes, ".eq(\"status\", \"released\")", "released-only wishes boundary");

requireText(upload, "hasWeddingAccess", "tenant-aware upload authorization");
requireText(upload, "detectWeddingImageType", "file signature validation");
requireText(upload, "file.type !== detected.mimeType", "MIME/signature matching");
requireText(upload, "WEDDING_ASSET_MAX_BYTES", "upload size limit");

for (const expected of [
  "X-Content-Type-Options",
  "X-Frame-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Content-Security-Policy",
  "Strict-Transport-Security",
]) {
  requireText(headers, expected, `security header ${expected}`);
}

requireText(migration, "app_private.public_rate_limits", "private shared limiter table");
requireText(migration, "SECURITY DEFINER", "controlled limiter function");
requireText(migration, "REVOKE ALL", "rate limiter privilege revocation");

requireText(license, "BLOCKED FOR COMMERCIAL RELEASE", "commercial release blocker");
requireText(license, "Do **not** add an MIT `LICENSE`", "upstream rights safety rule");

console.log("Phase 8.1 security hardening verification passed.");
