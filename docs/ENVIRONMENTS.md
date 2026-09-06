# Environment Strategy

This project uses three application environments. Keep credentials, URLs, and database access isolated between them.

## 1. Development

Use for local coding only.

- `APP_ENV=development`
- Next.js runs with `NODE_ENV=development` via `bun dev`.
- Local file: `.env.local` (gitignored).
- Template: `.env.example`.
- HTTP localhost is allowed.
- Prefer a dedicated development Supabase project/database.

Setup:

```bash
cp .env.example .env.local
# edit .env.local with development-only values
bun run p0:preflight
bun dev
```

Do not copy `.env.production` into `.env.local`.

## 2. Staging

Use for production-like verification before release.

- `APP_ENV=staging`
- The built Next.js application still runs with `NODE_ENV=production`.
- Local/operator file: `.env.staging` (gitignored).
- Template: `.env.staging.example`.
- Use HTTPS and `P0_PREFLIGHT_STRICT=true`.
- Use staging-only Supabase/Postgres credentials. Do not reuse the production service-role key or Better Auth secret.

Setup:

```bash
cp .env.staging.example .env.staging
# edit .env.staging with staging-only values
set -a; source .env.staging; set +a
bun run p0:preflight
APP_ENV_FILE=.env.staging docker compose --env-file .env.staging up -d --build
```

## 3. Production

Use only for live customer traffic.

- `APP_ENV=production`
- Runtime uses `NODE_ENV=production`.
- Local/operator file: `.env.production` (gitignored).
- Template: `.env.docker.example`.
- `P0_PREFLIGHT_STRICT=true` is mandatory.
- URLs must use HTTPS.
- Public signup remains disabled for the admin-managed V1 baseline.
- Use production-only Supabase/Postgres credentials and a unique Better Auth secret.

Setup:

```bash
cp .env.docker.example .env.production
# edit .env.production with production-only values
set -a; source .env.production; set +a
bun run p0:preflight
APP_ENV_FILE=.env.production docker compose --env-file .env.production up -d --build
```

## Environment boundary rules

1. Never commit `.env`, `.env.local`, `.env.staging`, `.env.production`, or other real env files.
2. Never paste service-role keys, database passwords, or Better Auth secrets into issues, docs, logs, or chat transcripts.
3. Development, staging, and production should use separate secrets. Separate Supabase projects/databases are strongly preferred.
4. `NEXT_PUBLIC_*` values are exposed to the browser. Never put privileged secrets in a `NEXT_PUBLIC_*` variable.
5. `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, and `BETTER_AUTH_SECRET` are server-only.
6. Promotion means moving code between environments, not copying production secrets backward into development.
7. Run `bun run p0:preflight` with the target environment loaded before every staging or production deployment.

## Docker environment selection

`docker-compose.yml` no longer hard-codes `.env.production`. The selected runtime env file is controlled by `APP_ENV_FILE`, with `.env.production` as the safe default.

Examples:

```bash
APP_ENV_FILE=.env.staging docker compose --env-file .env.staging up -d --build
APP_ENV_FILE=.env.production docker compose --env-file .env.production up -d --build
```

This prevents a staging deployment from silently loading production runtime credentials.
