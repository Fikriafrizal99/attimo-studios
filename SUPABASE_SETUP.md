# Supabase Setup — Commerce P0

This branch uses Supabase PostgreSQL + Storage behind server-side Next.js routes.

## 1. Environment

Copy `.env.example` to `.env.local` and configure:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
PUBLIC_INVITATION_BASE_URL=http://localhost:3000
PUBLIC_INVITATION_MODE=path
ALLOW_PUBLIC_SIGNUP=false
```

`SUPABASE_SERVICE_ROLE_KEY` is intentionally required by server routes. Do not expose it in browser/client code.

## 2. Run database bootstrap / migration

In Supabase Dashboard -> SQL Editor, run the complete file:

```text
supabase/run-weddings-migrations.sql
```

The script is designed for both the previous Attimo schema and a fresh commerce database. It:

- creates/updates `weddings`,
- migrates legacy template ID `classic` -> `classic-001`,
- creates `wedding_collaborators`,
- creates `guests` with opaque invitation tokens,
- wedding-scopes RSVP and wishes,
- adds wishes moderation status,
- removes legacy unscoped RSVP/wishes rows,
- makes `wedding_id` mandatory,
- removes globally permissive anon policies,
- enables RLS on tenant tables.

> Backup a real production database before running schema migrations. The P0 script deletes only legacy RSVP/wishes rows where `wedding_id IS NULL`, because those rows cannot safely be assigned to a tenant.

The timestamped migration is also available at:

```text
supabase/migrations/20260905000100_commerce_p0.sql
```

## 3. Better Auth tables

After `DATABASE_URL` is set:

```bash
bunx @better-auth/cli migrate
```

For admin-managed V1, public email signup is disabled when:

```env
ALLOW_PUBLIC_SIGNUP=false
```

To bootstrap the first admin account in a controlled environment, temporarily enable signup, create the account, then disable it again before production exposure.

## 4. Storage

Create a Supabase Storage bucket named:

```text
wedding-assets
```

Current P0 returns public asset URLs, so the bucket must be configured to serve invitation images publicly. Uploads themselves go through authenticated server routes and are stored under:

```text
weddings/{weddingId}/assets/...
```

Allowed upload types:

- JPEG
- PNG
- WebP
- GIF

Maximum image size: 5 MB.

## 5. Public invitation URL

P0 default:

```env
PUBLIC_INVITATION_MODE=path
PUBLIC_INVITATION_BASE_URL=https://yourdomain.id
```

Result:

```text
https://yourdomain.id/invite/{slug}?guest={opaque-token}
```

Optional future/subdomain mode is already supported by middleware:

```env
PUBLIC_INVITATION_MODE=subdomain
```

with wildcard DNS/TLS configured by the hosting provider.

## 6. Security verification before launch

Confirm all of the following in the deployed environment:

- service-role key exists only server-side,
- public signup is disabled,
- `/api/rsvp` rejects missing `wedding_id`,
- `/api/wishes` rejects missing `wedding_id`,
- a guest token from Wedding A does not resolve in Wedding B,
- draft weddings return 404 publicly,
- only released weddings render from `/invite/[slug]`,
- admin cannot access an unrelated wedding ID,
- storage uploads require wedding membership.

## 7. Rate limiting

P0 includes an in-memory per-runtime limiter for RSVP/wishes. This is a baseline abuse guard, not the final distributed solution.

Before horizontally scaled/high-volume production, replace or augment it with a shared limiter such as Redis/Upstash or the hosting provider's edge/WAF rate limiting.
