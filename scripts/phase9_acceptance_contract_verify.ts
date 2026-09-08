import { existsSync, readFileSync } from "node:fs";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(path: string) {
  assert(existsSync(path), `Phase 9 required artifact missing: ${path}`);
  return readFileSync(path, "utf8");
}

const requiredRoutes = [
  "app/api/health/route.ts",
  "app/api/ready/route.ts",
  "app/api/customers/route.ts",
  "app/api/orders/route.ts",
  "app/api/weddings/route.ts",
  "app/api/weddings/[id]/route.ts",
  "app/api/weddings/[id]/guests/route.ts",
  "app/api/weddings/[id]/upload/route.ts",
  "app/api/weddings/[id]/rsvp/summary/route.ts",
  "app/api/weddings/[id]/wishes/route.ts",
  "app/api/rsvp/route.ts",
  "app/api/wishes/route.ts",
  "app/invite/[slug]/page.tsx",
  "app/preview/[id]/page.tsx",
];
for (const route of requiredRoutes) assert(existsSync(route), `Phase 9 route missing: ${route}`);

const canonicalMigrations = [
  "supabase/migrations/20260906000800_storage_isolation.sql",
  "supabase/migrations/20260907000100_phase5_commerce_operations.sql",
  "supabase/migrations/20260907000200_phase6_order_activity.sql",
  "supabase/migrations/20260907000300_phase8_security_rate_limits.sql",
];
for (const migration of canonicalMigrations) {
  assert(existsSync(migration), `Canonical migration missing: ${migration}`);
}

const stagingEnv = read(".env.staging.example");
for (const marker of [
  "APP_ENV=staging",
  "P0_PREFLIGHT_STRICT=true",
  "P0_PREFLIGHT_ALLOW_PLACEHOLDERS=false",
  "ALLOW_PUBLIC_SIGNUP=false",
  "PUBLIC_INVITATION_MODE=path",
  "NEXT_PUBLIC_SUPABASE_URL=https://itgpywqrbvgsrjtibdle.supabase.co",
  "Private runtime credentials. Fill these only in .env.staging on the server.",
]) {
  assert(stagingEnv.includes(marker), `Staging environment contract missing: ${marker}`);
}

const phase9 = read("docs/commerce/PHASE9_E2E_ACCEPTANCE.md");
for (const marker of [
  "Customer → Order → Wedding",
  "Publish → Public Invitation",
  "Personalized Guest → RSVP → Wish",
  "Cross-Tenant Negative Acceptance",
  "Asset Boundary Acceptance",
  "Path Routing Acceptance",
  "Device / Network Acceptance",
  "0 cross-tenant incidents",
  "Commercial rights remain a Phase 10 blocker",
]) {
  assert(phase9.includes(marker), `Phase 9 acceptance plan missing: ${marker}`);
}

const publicInvite = read("lib/commerce/public-invitation.ts");
assert(publicInvite.includes("resolve"), "Public invitation resolver contract missing");

const readiness = read("lib/commerce/publish-readiness.ts");
assert(readiness.includes("evaluatePublishReadiness"), "Central publish readiness contract missing");

const rateLimit = read("lib/commerce/rate-limit.ts");
assert(rateLimit.includes("consume_public_rate_limit"), "Public database rate-limit contract missing");

const storage = read("lib/commerce/storage.ts");
assert(storage.includes("wedding-assets"), "Wedding storage boundary missing");

console.log("Phase 9 acceptance contract verification passed.");
