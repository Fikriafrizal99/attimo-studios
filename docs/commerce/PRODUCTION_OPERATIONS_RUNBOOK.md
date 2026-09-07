# ENDRIYA — Production Operations Runbook

**Status:** Phase 8 baseline  
**Applies to:** staging and production-like environments  
**Important:** Phase 9 performs the first full environment acceptance. This runbook does not authorize commercial launch.

## 1. Health model

Two separate endpoints exist:

```text
/api/health → liveness only
/api/ready  → readiness / PostgreSQL + required schema
```

Use `/api/health` for container/process liveness. A temporary database outage should not automatically kill a healthy process.

Use `/api/ready` for load-balancer/readiness decisions. It returns HTTP `503` when PostgreSQL is unavailable or required Phase 8 schema is missing.

## 2. Environment preflight

Before a staging/production deployment:

```bash
P0_PREFLIGHT_STRICT=true bun run p0:preflight
```

Strict mode requires:

- HTTPS application/auth/public URLs,
- non-local PostgreSQL host,
- `ALLOW_PUBLIC_SIGNUP=false`,
- explicit public-form rate-limit settings,
- separate anon and service-role keys,
- valid Better Auth secret,
- Better Auth and application URL on the same origin.

Never print secret values in CI logs or support tickets.

## 3. Database migration procedure

Repository migrations under `supabase/migrations/` are the canonical schema source.

Before applying migrations:

1. take a database backup,
2. record current app image/commit SHA,
3. inspect `supabase migration list --linked`,
4. compare linked migration history with repository filenames,
5. run repository DB smoke tests against an isolated database,
6. review the exact SQL migration being introduced,
7. only then apply/reconcile migrations in the target environment.

### Existing history drift

Storage isolation was previously applied to production using history version:

```text
20260906110201 storage_isolation
```

while the repository canonical file is:

```text
20260906000800_storage_isolation.sql
```

Do **not** blindly run `supabase db push` while this remains unreconciled.

Phase 9 must reconcile history using supported Supabase migration-repair tooling. Do not manually edit `supabase_migrations.schema_migrations`.

## 4. PostgreSQL backup

Use a timestamped custom-format dump from a trusted machine with restricted filesystem permissions:

```bash
pg_dump \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="endriya-$(date +%Y%m%d-%H%M%S).dump" \
  "$DATABASE_URL"
```

Store backups outside the application container and protect them as sensitive customer data.

Recommended minimum operational policy before launch:

- backup before every production migration,
- scheduled recurring database backup,
- documented retention window,
- periodic restore test into an isolated staging database.

## 5. Restore rehearsal

Restore only into an isolated/empty target during rehearsal:

```bash
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname="$RESTORE_DATABASE_URL" \
  endriya-backup.dump
```

After restore:

1. run canonical DB verification scripts,
2. start the application against the restored database,
3. verify `/api/ready`,
4. verify an owner login and tenant-scoped read,
5. record restore duration and defects.

Never rehearse restore against the live production database.

## 6. Supabase Storage backup boundary

PostgreSQL backup does not contain the binary objects in the `wedding-assets` bucket.

Before launch, define a separate storage-object backup/export policy covering:

- object path,
- wedding ownership namespace,
- content type,
- file size,
- object bytes,
- restore destination.

Storage backup/restore acceptance is completed in Phase 9 against the actual Supabase project.

## 7. Application rollback

Application code rollback should prefer redeploying the previously known-good image/commit.

Record for every production deployment:

```text
commit SHA
container image/tag/digest
database migration versions
release timestamp
operator
```

A code rollback does not imply a database rollback.

## 8. Database rollback rule

Database migrations are treated as forward-moving changes.

If a migration has already received production writes:

- do not restore an old schema blindly,
- do not delete migration-history rows manually,
- prefer a reviewed compensating migration,
- restore from backup only as an incident/recovery decision with known data-loss implications.

Destructive schema changes require explicit backup and rollback planning before execution.

## 9. Rate-limit maintenance

Public RSVP/wishes protection uses `app_private.public_rate_limits`.

Expired rows can be pruned server-side with:

```sql
SELECT app_private.prune_public_rate_limits(INTERVAL '1 day');
```

The function is intentionally unavailable to browser roles. Schedule pruning only from trusted server/DB operations after Phase 9 deployment topology is known.

Better Auth uses its own `public."rateLimit"` table and manages those rows through Better Auth.

## 10. Incident minimum evidence

For production incidents capture:

- UTC/WIB timestamp,
- deployed commit/image,
- affected route/function,
- HTTP status,
- request/correlation identifier if available,
- sanitized logs,
- database/readiness state,
- whether issue is tenant-specific or global,
- mitigation performed,
- follow-up fix/commit.

Do not record passwords, guest tokens, service-role keys, auth session tokens, database credentials, or full payment-sensitive data in incident notes.

## 11. Launch blocker reminder

Technical readiness does not override the upstream commercial-rights blocker. Commercial release remains blocked until source-code and asset rights are resolved according to `UPSTREAM_LICENSE_STATUS.md`.
