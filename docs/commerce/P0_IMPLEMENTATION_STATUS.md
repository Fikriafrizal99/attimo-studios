# Commerce P0 Implementation Status

**Branch:** `develop/commerce-foundation`  
**Date:** 2026-09-05  
**Goal:** close all technical P0 work that can be completed in-repository and explicitly track external deployment/legal blockers.

## Status legend

- ✅ Implemented in branch
- 🧪 Implemented; CI/deployment verification required
- ⚠️ External action required
- ❌ Not implemented

## P0 matrix

| P0 requirement | Status | Implementation / next gate |
|---|---|---|
| Upstream commercial usage status resolved | ⚠️ | Not legally resolved. See `UPSTREAM_LICENSE_STATUS.md`. Commercial release remains blocked. |
| Production auth configured | 🧪 | Better Auth requires production DB/secret, public signup disabled by default, trusted origins + auth rate limit configured. Real deployment secrets still required. |
| Multi-tenant isolation verified | 🧪 | SQL migration enforces wedding-scoped guests/RSVP/wishes and removes anon policies. Must be applied to the real Supabase project and cross-tenant tests executed. |
| RSVP/wishes cannot return all weddings accidentally | ✅ | Both APIs require a valid `wedding_id`; RSVP public GET returns aggregate only; wishes returns visible rows for one released wedding only. |
| Template registry implemented | ✅ | Registry/resolver/contract implemented with `classic-001` and `minimal-001`. |
| One production-quality template through registry | 🧪 | Classic renderer migrated through registry and core placeholder components replaced; final build/device QA still required. |
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
- public sign-up disabled in auth config and middleware by default,
- central slug/UUID/text validation,
- new wedding creation rejects unavailable template IDs,
- release gate validates slug/template/content/event/section compatibility,
- storage upload requires wedding membership and uses tenant-scoped paths,
- unauthorized default commercial music fallback removed,
- legacy `classic` template IDs migrate to `classic-001`,
- old section arrays are normalized so new shared sections can be introduced safely,
- GitHub Actions build CI workflow is committed for this branch.

## CI state

The `Commerce P0 CI` workflow is present in `.github/workflows/commerce-p0-ci.yml`, but GitHub reported **zero workflow runs** after two pushes to this fork. Therefore CI is **not considered passed**.

For a GitHub fork this normally requires Actions/workflows to be explicitly enabled in the repository UI before the first workflow can execute. Once Actions are enabled, a new push (or rerun) must execute `bun run build`; any TypeScript/Next.js failures must be fixed before technical P0 is marked verified.

## External steps before P0 can be called production-verified

1. Resolve upstream commercial license/permission.
2. Enable GitHub Actions for the fork and obtain a passing `Commerce P0 CI` build.
3. Create/configure the real Supabase project.
4. Apply `supabase/run-weddings-migrations.sql`.
5. Create `wedding-assets` Storage bucket.
6. Run Better Auth migration.
7. Create/bootstrap the admin account, then keep `ALLOW_PUBLIC_SIGNUP=false`.
8. Configure real secrets and public domain env values.
9. Run cross-tenant security tests against deployed Supabase.
10. Validate the invitation on low/mid/high-end mobile devices.
11. Replace the in-memory public submission limiter with a shared/edge limiter before horizontal/high-volume scaling.

## P0 completion rule

Technical implementation can be marked complete after CI passes. Production P0 is only complete after the external steps above are verified; commercial release additionally requires the license blocker to be resolved.
