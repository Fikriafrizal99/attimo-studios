# Commerce P0 Implementation Status

**Branch:** `develop/commerce-foundation`  
**Date:** 2026-09-06  
**Goal:** close all technical P0 work that can be completed in-repository and explicitly track external deployment/legal blockers.

## Status legend

- ✅ Implemented and verified in branch/CI
- 🧪 Implemented; real deployment/device verification required
- ⚠️ External action required
- ❌ Not implemented

## P0 matrix

| P0 requirement | Status | Implementation / next gate |
|---|---|---|
| Upstream commercial usage status resolved | ⚠️ | Not legally resolved. See `UPSTREAM_LICENSE_STATUS.md`. Commercial release remains blocked. |
| Production auth configured | 🧪 | Better Auth config/preflight/build pass; real DB migration, secrets, and first operator bootstrap still require the production environment. Public signup is disabled by default. |
| Multi-tenant isolation verified | ✅ | CI database-smoke verifies schema bootstrap, RLS posture, cross-wedding guest blocking, and RSVP quota enforcement. Repeat verification is still required after applying it to the real Supabase project. |
| RSVP/wishes cannot return all weddings accidentally | ✅ | Both APIs require a valid `wedding_id`; RSVP public GET returns aggregate only; wishes returns visible rows for one released wedding only. |
| Template registry implemented | ✅ | Registry/resolver/contract implemented with `classic-001` and `minimal-001`. |
| One production-quality template through registry | 🧪 | Classic renderer builds through registry and core placeholders are replaced; final real-device visual QA remains. |
| Adding second template does not change core route | ✅ | `minimal-001` is registered without changes to public/preview route logic. |
| Content editor covers required V1 fields | ✅ | Hero, couple, events, primary countdown event, story, gallery, gift/bank/QRIS, music and blessing supported. |
| Real gallery rendering | ✅ | Actual uploaded image URLs + lazy loading + lightbox. |
| Event date drives countdown | ✅ | Countdown resolves explicit event, primary event, then first event; no demo hard-coded date. |
| Maps link/embed works | ✅ | Navigation URL plus address/coordinate Google Maps embed. |
| Gift/bank/QRIS works | ✅ | Multiple bank accounts, copy account number, QRIS, physical gift address. |
| Guest management works | ✅ | Admin CRUD, opaque tokens, quota, active/inactive, personalized URL copy. |
| Personalized invitation URL works | ✅ | `/invite/{slug}?guest={opaque-token}`; token is resolved server-side and scoped to wedding. |
| Preview works | ✅ | Preview and public route share `InvitationRenderer`. |
| Publish routing has no localhost hard-code | ✅ | Central `buildInvitationUrl()` uses explicit env; path baseline + optional subdomain mode. |
| Rate limiting / spam baseline | ✅ | Public RSVP/wishes per-IP+wedding limiter, payload limits, guest RSVP deduplication, wishes moderation status. |

## Additional P0 hardening included

- server Supabase client no longer falls back to anon key,
- production Better Auth fails closed when DB/secret are absent,
- public sign-up disabled in auth config and Next.js `proxy.ts` by default,
- Next.js 16 middleware deprecation removed by migrating `middleware.ts` -> `proxy.ts`,
- central slug/UUID/text validation,
- new wedding creation rejects unavailable template IDs,
- release gate validates slug/template/content/event/section compatibility,
- storage upload requires wedding membership and tenant-scoped paths,
- `wedding-assets` bucket is configured by the consolidated Supabase bootstrap when the storage schema exists,
- bucket file size/MIME configuration is aligned with the upload endpoint,
- database triggers reject cross-wedding guest references even if application code makes a mistake,
- database trigger enforces RSVP guest quota,
- unauthorized default commercial music fallback removed,
- legacy `classic` template IDs migrate to `classic-001`,
- legacy permissive `supabase/schema.sql` policies removed,
- environment preflight command added: `bun run p0:preflight`,
- production SQL verifier added: `supabase/verify-production.sql`,
- production runbook added: `docs/commerce/PRODUCTION_P0_RUNBOOK.md`.

## CI state — PASS

Latest P0 verification:

- Workflow: `Commerce P0 CI`
- Run: `#7`
- Commit: `8731ad252811ec7645d40b9d09e9d6eec73221a6`
- Build job: **success**
- Environment preflight: **success**
- Next.js production build + TypeScript: **success**
- Database-smoke job: **success**
- Consolidated bootstrap first application: **success**
- Consolidated bootstrap second application/idempotency: **success**
- Tenant-scope + guest quota SQL verification: **success**

The repository-level P0 foundation is therefore technically verified.

## External steps before production P0 is verified

These require the real hosting/Supabase environment and cannot be completed from repository CI alone:

1. Create/configure the real Supabase project.
2. Configure real application/database/auth secrets.
3. Run `bun run p0:preflight` with `P0_PREFLIGHT_STRICT=true`.
4. Apply `supabase/run-weddings-migrations.sql` to real Supabase.
5. Run `supabase/verify-production.sql` and require a passing result.
6. Run `bunx @better-auth/cli migrate` against the production database.
7. Bootstrap the first operator account in a controlled/private environment, then keep `ALLOW_PUBLIC_SIGNUP=false`.
8. Configure production domain/HTTPS values.
9. Perform deployed tenant-isolation/storage smoke tests from `PRODUCTION_P0_RUNBOOK.md`.
10. Validate the invitation on low/mid/high-end mobile devices.
11. Before horizontal/high-volume scaling, replace the in-memory limiter with a shared/edge limiter.
12. Resolve upstream commercial license/permission before selling/distributing the product.

## P0 completion rule

**In-repository technical P0: COMPLETE.**

**Production-environment P0:** pending real Supabase/auth/domain/device execution.

**Commercial release:** blocked until upstream commercial-use rights are resolved.
