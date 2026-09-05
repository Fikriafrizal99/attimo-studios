# Production P0 Runbook

This runbook closes the remaining environment-side work after the repository P0 implementation and CI are green.

## 1. Create the Supabase project

Create one Supabase project for the commerce environment. Keep the database password and service-role key private.

Required values:

- Project URL
- anon/public key
- service-role key
- direct PostgreSQL connection string for Better Auth migration

## 2. Configure environment

Copy `.env.example` to `.env.local` and set real values.

Production must use:

```env
ALLOW_PUBLIC_SIGNUP=false
PUBLIC_INVITATION_MODE=path
P0_PREFLIGHT_STRICT=true
```

Then run:

```bash
bun run p0:preflight
```

Do not deploy while this command fails.

## 3. Apply the commerce database bootstrap

In Supabase SQL Editor run:

```text
supabase/run-weddings-migrations.sql
```

The script is idempotent and CI runs it twice against a clean PostgreSQL database.

It configures:

- weddings
- collaborators
- guests
- RSVP
- wishes
- RLS
- tenant-scope triggers
- RSVP quota trigger
- template ID migration
- `wedding-assets` storage bucket when the Supabase `storage` schema is present

## 4. Verify the database

In Supabase SQL Editor run:

```text
supabase/verify-production.sql
```

It must end with:

```text
Commerce P0 Supabase production verification passed
```

Do not continue if it raises an exception.

## 5. Better Auth migration

With the real `DATABASE_URL` configured:

```bash
bunx @better-auth/cli migrate
```

Do this before starting the production app.

## 6. Bootstrap the first operator account

The V1 product is admin-managed and public signup must stay disabled in production.

Recommended bootstrap flow:

1. use a local/private deployment,
2. temporarily set `ALLOW_PUBLIC_SIGNUP=true`,
3. create the operator account,
4. set `ALLOW_PUBLIC_SIGNUP=false` immediately,
5. restart/redeploy,
6. confirm `/signup` redirects to `/login` and `/api/auth/sign-up/*` is blocked.

Do not leave public signup enabled on the public production deployment.

## 7. Storage smoke test

From the dashboard:

1. create a draft wedding,
2. upload a JPEG/WebP image under 5 MB,
3. confirm the returned URL is public,
4. confirm the path starts with `weddings/{weddingId}/assets/`,
5. attempt upload from an unrelated account/wedding and confirm it is rejected.

## 8. Tenant-isolation smoke test

Create Wedding A and Wedding B.

Verify:

- Guest A token does not resolve on Wedding B.
- Guest A cannot RSVP to Wedding B.
- Guest A cannot submit a token-linked wish to Wedding B.
- RSVP quota over `max_guests` is rejected.
- an authenticated user without membership cannot edit/upload to the other wedding.
- draft invitations return 404 publicly.
- released invitations render only their own RSVP/wishes data.

Database triggers provide an additional defense even if a server route accidentally sends mismatched wedding/guest IDs.

## 9. Domain and release URL

V1 recommendation:

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

## 10. Final device QA

At minimum test:

- iPhone Safari
- Android Chrome mid-range device
- desktop Chrome
- slow network throttling
- reduced-motion preference

Check opening, gallery, maps, countdown, RSVP, wishes, gift copy action, QRIS, music controls, and personalized guest greeting.

## 11. Commercial release gate

Technical P0 completion does not remove the upstream license blocker.

Do not sell/distribute the fork as a commercial product until upstream commercial-use permission/license is clearly established, or the inherited implementation has been replaced with independently licensed/owned code.
