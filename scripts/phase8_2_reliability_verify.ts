import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function requireIncludes(source: string, needles: string[], label: string) {
  for (const needle of needles) {
    if (!source.includes(needle)) {
      throw new Error(`${label} missing reliability marker: ${needle}`);
    }
  }
}

const health = read("app/api/health/route.ts");
requireIncludes(health, ['service: "endriya"', 'check: "liveness"', '"Cache-Control"'], "liveness endpoint");

const ready = read("app/api/ready/route.ts");
requireIncludes(
  ready,
  [
    "requireDbPool",
    "database_schema_incomplete",
    "database_unavailable",
    'status: "ready"',
    "public_rate_limit_table",
    "requestId",
  ],
  "readiness endpoint"
);

const observability = read("lib/commerce/observability.ts");
requireIncludes(
  observability,
  [
    "createRequestId",
    "requestIdFrom",
    "logServerError",
    "crypto.randomUUID",
    'level: "error"',
  ],
  "observability helper"
);

const proxy = read("proxy.ts");
requireIncludes(
  proxy,
  [
    "createRequestId",
    'requestHeaders.set("x-request-id"',
    'response.headers.set("x-request-id"',
    'pathname.startsWith("/api/")',
  ],
  "request correlation proxy"
);

const preflight = read("scripts/p0-preflight.mjs");
requireIncludes(
  preflight,
  [
    "PUBLIC_WEDDING_BURST_RATE_LIMIT",
    "PUBLIC_RESOLUTION_RATE_LIMIT",
    "PUBLIC_READ_RATE_LIMIT",
    "DATABASE_URL must use postgres:// or postgresql://",
    "BETTER_AUTH_URL and NEXT_PUBLIC_APP_URL must share the same origin",
  ],
  "strict environment preflight"
);

for (const path of [
  "app/api/rsvp/route.ts",
  "app/api/wishes/route.ts",
  "app/api/weddings/[id]/upload/route.ts",
]) {
  const source = read(path);
  if (!source.includes("logServerError")) {
    throw new Error(`${path} must use structured server error logging`);
  }
}

const runbook = read("docs/commerce/PRODUCTION_OPERATIONS_RUNBOOK.md");
requireIncludes(
  runbook,
  [
    "/api/health",
    "/api/ready",
    "pg_dump",
    "pg_restore",
    "migration repair",
    "Do **not** blindly run `supabase db push`",
    "Application code rollback",
    "Supabase Storage backup boundary",
  ],
  "production operations runbook"
);

console.log("Phase 8.2 reliability baseline verification passed");
