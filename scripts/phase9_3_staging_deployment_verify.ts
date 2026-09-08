import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const env = read(".env.staging.example");
const compose = read("docker-compose.yml");
const deploy = read("scripts/deploy-staging.sh");
const preflight = read("scripts/p0-preflight.mjs");

expect(env.includes("APP_ENV=staging"), "staging profile must declare APP_ENV=staging");
expect(env.includes("APP_IMAGE=endriya-wedding:staging"), "staging must use a dedicated image tag");
expect(env.includes("APP_BIND=127.0.0.1"), "staging must default to loopback binding behind a reverse proxy");
expect(env.includes("APP_PORT=3100"), "staging must not collide with the main port 3000");
expect(env.includes("P0_PREFLIGHT_STRICT=true"), "staging must use strict preflight");
expect(env.includes("P0_PREFLIGHT_ALLOW_PLACEHOLDERS=false"), "staging must reject placeholders");
expect(env.includes("NEXT_PUBLIC_SUPABASE_URL=https://itgpywqrbvgsrjtibdle.supabase.co"), "staging profile must target the isolated Supabase project");
expect(env.includes("PUBLIC_INVITATION_MODE=path"), "Phase 9 staging baseline must use path routing");
expect(env.includes("ALLOW_PUBLIC_SIGNUP=false"), "staging must keep public signup disabled");
expect(!env.includes("SUPABASE_SERVICE_ROLE_KEY=sb_secret_"), "private Supabase secret must never be committed to the staging example");

expect(compose.includes("image: ${APP_IMAGE:-attimo-wedding:local}"), "Compose image must be configurable per environment");
expect(compose.includes("${APP_PORT:-3000}:3000"), "Compose must retain configurable published port");

expect(deploy.includes("ENV_FILE=\"${ENV_FILE:-.env.staging}\""), "staging deploy must default to .env.staging");
expect(deploy.includes("PROJECT_NAME=\"${COMPOSE_PROJECT_NAME:-endriya-staging}\""), "staging deploy must use an isolated Compose project");
expect(deploy.includes("--project-name \"$PROJECT_NAME\""), "staging deploy must explicitly scope Docker resources");
expect(deploy.includes("/api/ready"), "staging deployment must verify readiness, not liveness only");
expect(!deploy.includes(".env.production"), "staging deploy must never default to production env");
expect(!deploy.includes("--remove-orphans"), "staging deploy must not risk removing unrelated deployment containers");

expect(preflight.includes("looksLikePlaceholder"), "strict preflight must detect placeholder credentials");
expect(preflight.includes("isPlaceholderHostname"), "strict preflight must detect placeholder hostnames");
expect(preflight.includes("normalized.endsWith('.example.com')"), "strict preflight must reject example.com staging hosts");

console.log("Phase 9.3 isolated staging deployment profile verification passed.");
