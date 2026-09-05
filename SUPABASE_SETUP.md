# Supabase Setup — Commerce P0

This branch uses Supabase PostgreSQL + Storage behind server-side Next.js routes.

For the complete production sequence, see `docs/commerce/PRODUCTION_P0_RUNBOOK.md`.

## 1. Environment

Copy `.env.example` to `.env.local` and configure real values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://yourdomain.id
NEXT_PUBLIC_APP_URL=https://yourdomain.id
PUBLIC_INVITATION_BASE_URL=https://yourdomain.id
PUBLIC_INVITATION_MODE=path
ALLOW_PUBLIC_SIGNUP=false
P0_PREFLIGHT_STRICT=true
```

`SUPABASE_SERVICE_ROLE_KEY` is required by server routes and must never be exposed to browser code.

Validate configuration before deploying:

```bash
bun run p0:preflight
```

Production deployment must not continue while preflight fails.

## 2. Run database bootstrap / migration

In Supabase Dashboard -> SQL Editor, run:

```text
supabase/run-weddings-migrations.sql
```

The consolidated script supports both a previous Attimo schema and a fresh commerce database. It:

- creates/updates `weddings`,
- migrates `classic` -> `classic-001`,
- creates `wedding_collaborators`,
- creates `guests` with opaque tokens,
- wedding-scopes RSVP and wishes,
- makes `wedding_id` mandatory,
- adds wishes moderation status,
- removes legacy unscoped RSVP/wishes rows,
- removes permissive public policies,
- enables RLS on tenant tables,
- adds database-level guest/wedding scope protection,
- adds database-level RSVP guest-quota protection,
- configures the public `wedding-assets` bucket when the Supabase storage schema is available,
- restricts that bucket to 5 MB JPEG/PNG/WebP/GIF assets.

The script is tested in CI by applying it twice to the same clean PostgreSQL database to verify idempotency.

> Back up a real production database before schema changes. The script deletes only legacy RSVP/wishes rows where `wedding_id IS NULL`, because those rows cannot be safely assigned to a tenant.

Incremental migrations live in `supabase/migrations/`.

## 3. Verify the real Supabase project

After bootstrap, run in SQL Editor:

```text
supabase/verify-production.sql
```

Required result:

```text
Commerce P0 Supabase production verification passed
```

If an exception is raised, do not proceed to public deployment.

CI also runs:

```text
supabase/tests/p0_core_verify.sql
```

against PostgreSQL and verifies tenant-scope and guest-quota guards.

## 4. Better Auth tables

After the real `DATABASE_URL` is configured:

```bash
bunx @better-auth/cli migrate
```

For V1 admin-managed operation:

```env
ALLOW_PUBLIC_SIGNUP=false
```

Bootstrap the first operator account only in a controlled/private environment. Temporarily enable signup, create the account, then immediately disable signup and redeploy before public exposure.

## 5. Storage

The consolidated bootstrap creates/updates the Supabase bucket:

```text
wedding-assets
```

when the `storage` schema is available.

The bucket is public for invitation asset delivery; uploads still go only through authenticated server routes.

Storage path:

```text
weddings/{weddingId}/assets/...
```

Allowed types:

- JPEG
- PNG
- WebP
- GIF

Maximum size: 5 MB.

## 6. Public invitation URL

Recommended V1 production mode:

```env
PUBLIC_INVITATION_MODE=path
PUBLIC_INVITATION_BASE_URL=https://yourdomain.id
```

Result:

```text
https://yourdomain.id/invite/{slug}?guest={opaque-token}
```

Optional subdomain mode is supported by Next.js `proxy.ts` after wildcard DNS/TLS is configured:

```env
PUBLIC_INVITATION_MODE=subdomain
```

## 7. Security verification before launch

Confirm in the deployed environment:

- service-role key exists only server-side,
- public signup is disabled,
- `/api/rsvp` rejects missing/invalid wedding scope,
- `/api/wishes` rejects missing/invalid wedding scope,
- Guest A token cannot be used against Wedding B,
- RSVP count above guest quota is rejected,
- draft weddings are not public,
- released invitations expose only their own data,
- unrelated admins cannot edit/upload to another wedding,
- storage uploads require wedding membership.

Use the exact smoke-test sequence in `docs/commerce/PRODUCTION_P0_RUNBOOK.md`.

## 8. Rate limiting

P0 includes an in-memory per-runtime limiter for RSVP/wishes. This is adequate as a baseline abuse guard for early single-runtime operation.

Before horizontal/high-volume scaling, move to shared/edge rate limiting such as Redis/Upstash or hosting-provider WAF/edge controls.
