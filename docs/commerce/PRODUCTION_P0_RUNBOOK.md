# Production P0 Runbook

This runbook closes the environment-side work after repository P0 and CI are green.

## Current verified state — 2026-09-06

The connected production Supabase project has already passed these gates:

- commerce P0 migration applied,
- `weddings`, `wedding_collaborators`, `guests`, `rsvp`, and `wishes` created,
- tenant tables have RLS enabled and no browser-facing policies,
- cross-wedding guest integrity triggers installed,
- RSVP invitation quota trigger installed,
- `wedding-assets` public bucket created with 5 MB image limit,
- `supabase/verify-production.sql` passed,
- Better Auth 1.4.19 core schema applied,
- `supabase/verify-better-auth.sql` passed,
- Better Auth tables have RLS enabled,
- `anon` and `authenticated` direct read privileges are revoked from auth/credential tables.

Do not commit project-specific keys, database passwords, service-role keys, or `BETTER_AUTH_SECRET` to this repository.

## 1. Environment

Configure these values only in the local/deployment environment:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://your-domain.id
NEXT_PUBLIC_APP_URL=https://your-domain.id
PUBLIC_INVITATION_BASE_URL=https://your-domain.id
PUBLIC_INVITATION_MODE=path
ALLOW_PUBLIC_SIGNUP=false
P0_PREFLIGHT_STRICT=true
```

Then run:

```bash
bun run p0:preflight
```

Never expose `SUPABASE_SERVICE_ROLE_KEY`, database credentials, or `BETTER_AUTH_SECRET` in browser code or a public repository.

## 2. Commerce database

Canonical bootstrap:

```text
supabase/run-weddings-migrations.sql
```

Production verifier:

```text
supabase/verify-production.sql
```

Required result:

```text
Commerce P0 Supabase production verification passed
```

The CI database-smoke job also applies the commerce bootstrap twice to verify idempotency and executes cross-tenant/quota checks.

## 3. Better Auth database

The application is pinned to Better Auth `1.4.19`. Its checked-in production schema is:

```text
supabase/migrations/20260905180003_better_auth_1_4_19_core.sql
```

Verify it with:

```text
supabase/verify-better-auth.sql
```

Required result:

```text
Better Auth 1.4.19 production verification passed
```

When upgrading Better Auth, generate/review the new migration first. Do not assume a newer Better Auth schema is backward-compatible with 1.4.19.

## 4. Bootstrap the first operator

V1 is admin-managed and public HTTP signup must stay disabled.

The repository includes a private one-shot bootstrap command:

```bash
bun run admin:bootstrap
```

Requirements before running it:

- `DATABASE_URL` points to the production database,
- `BETTER_AUTH_SECRET` is configured with at least 32 characters,
- run it from a trusted local/private terminal.

The command prompts for operator email/name and requests the password twice using hidden terminal input. It sets `ALLOW_PUBLIC_SIGNUP=true` only inside that one-shot CLI process so Better Auth can create the credential account; it does **not** change the deployment setting and never prints the password.

Optional non-secret convenience values may be supplied as environment variables:

```text
BOOTSTRAP_ADMIN_EMAIL
BOOTSTRAP_ADMIN_NAME
```

Do not supply the password as a command-line argument, commit it to `.env`, or paste it into chat/tickets.

After bootstrap:

1. keep deployment `ALLOW_PUBLIC_SIGNUP=false`,
2. confirm `/signup` redirects to `/login`,
3. confirm `/api/auth/sign-up/*` is blocked publicly,
4. sign in with the new operator account.

## 5. Storage smoke test

From the authenticated dashboard:

1. create a draft wedding,
2. upload JPEG/PNG/WebP/GIF under 5 MB,
3. confirm the URL is public,
4. confirm object path begins with `weddings/{weddingId}/assets/`,
5. confirm a user without wedding membership cannot upload to that wedding.

## 6. Tenant-isolation smoke test

Create Wedding A and Wedding B and verify:

- Guest A token cannot resolve on Wedding B,
- Guest A cannot RSVP to Wedding B,
- Guest A cannot submit a token-linked wish to Wedding B,
- RSVP above `max_guests` is rejected,
- an authenticated user without membership cannot edit/upload to another wedding,
- draft invitations return 404 publicly,
- released invitations render only their own wedding data.

Database triggers are defense-in-depth if an application route ever sends mismatched IDs.

## 7. Domain and release URL

Recommended V1:

```env
PUBLIC_INVITATION_MODE=path
PUBLIC_INVITATION_BASE_URL=https://your-domain.id
NEXT_PUBLIC_APP_URL=https://your-domain.id
BETTER_AUTH_URL=https://your-domain.id
```

Canonical invitation:

```text
https://your-domain.id/invite/{slug}?guest={opaque-token}
```

Subdomain mode remains optional after wildcard DNS/TLS is configured.

## 8. Final device QA

At minimum test:

- iPhone Safari,
- Android Chrome on a mid-range device,
- desktop Chrome,
- slow network throttling,
- reduced-motion preference.

Verify opening, gallery, maps, countdown, personalized guest greeting, RSVP, wishes, gift copy action, QRIS, and music controls.

## 9. Advisors

Supabase security/performance advisors should be reviewed after schema changes. For this server-only P0 architecture, `RLS enabled with no policy` INFO notices on tenant/auth tables are intentional. `Unused index` notices are expected while the database has no traffic; do not remove planned indexes based solely on a fresh-project advisory.

## 10. Commercial release gate

Technical readiness does not resolve upstream licensing.

Do not sell or distribute the inherited fork commercially until commercial-use rights are clearly established, or inherited implementation has been replaced with independently owned/licensed code.
