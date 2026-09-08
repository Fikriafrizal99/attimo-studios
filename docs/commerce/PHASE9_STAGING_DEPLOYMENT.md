# ENDRIYA — Phase 9 Staging Application Deployment

**Status:** READY FOR SERVER RUNTIME CONFIGURATION  
**Branch:** `develop/commerce-foundation`  
**Supabase staging project ref:** `itgpywqrbvgsrjtibdle`  
**Supabase region:** `ap-south-1`

## Purpose

Run a production-mode ENDRIYA application against the isolated Supabase staging project without touching the main ENDRIYA container or primary database.

## Isolation Contract

```text
Main application
Compose project: existing/default
Published port: 3000
Database: primary Supabase project

Staging application
Compose project: endriya-staging
Image: endriya-wedding:staging
Host bind: 127.0.0.1
Published port: 3100
Database: ENDRIYA Staging / itgpywqrbvgsrjtibdle
```

The staging deployment script does not use `--remove-orphans`, so it must not remove the main deployment containers.

## 1. Update Server Repository

```bash
cd ~/attimo-studios
git switch develop/commerce-foundation
git pull --ff-only
```

## 2. Create Runtime Environment

```bash
cp .env.staging.example .env.staging
chmod 600 .env.staging
```

The public staging Supabase URL and publishable key are already represented in the example file. Replace only the runtime/private placeholders and the staging HTTPS host.

Required private/runtime values:

```text
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL / NEXT_PUBLIC_APP_URL / PUBLIC_INVITATION_BASE_URL
```

Use the same real HTTPS staging origin for the three URL variables.

Never commit `.env.staging`.

## 3. Reverse Proxy / HTTPS

Route the chosen staging hostname to:

```text
127.0.0.1:3100
```

Path routing is the Phase 9 baseline:

```text
PUBLIC_INVITATION_MODE=path
https://<staging-host>/invite/{slug}
```

Do not enable wildcard/subdomain routing until the path-mode acceptance journey passes.

## 4. Deploy

```bash
bash scripts/deploy-staging.sh
```

The script performs:

```text
Compose validation
→ staging-only image build
→ staging-only container start
→ Docker health check (/api/health)
→ application readiness check (/api/ready)
```

The deployment is considered successful only when `/api/ready` returns `status=ready`, which proves the runtime can reach the staging database and see the required schema.

## 5. Manual Verification

Local server checks:

```bash
curl -fsS http://127.0.0.1:3100/api/health
curl -fsS http://127.0.0.1:3100/api/ready
```

Expected state:

```text
/api/health → status: ok
/api/ready  → status: ready, database: ok
```

Then verify the real HTTPS staging host from a browser.

## 6. Failure Safety

Inspect only the staging Compose project:

```bash
docker compose --project-name endriya-staging --env-file .env.staging ps
docker compose --project-name endriya-staging --env-file .env.staging logs --tail=150 wedding-app
```

Stop staging without touching main:

```bash
docker compose --project-name endriya-staging --env-file .env.staging down
```

## Phase 9 Gate

Database staging creation, canonical migrations, migration-history reconciliation, and rolled-back DB acceptance smoke are already complete.

Application deployment becomes `VERIFIED` only after:

- real private staging credentials are present on the server,
- a real HTTPS staging hostname routes to port 3100,
- `scripts/deploy-staging.sh` succeeds,
- `/api/ready` succeeds through the deployed application,
- browser/API E2E acceptance begins against that staging origin.
