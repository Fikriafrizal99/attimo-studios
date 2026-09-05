# Commerce P0 Implementation Status

**Branch:** `develop/commerce-foundation`  
**Date:** 2026-09-06  
**Goal:** close all technical P0 work that can be completed in-repository and explicitly track external deployment/legal blockers.

## Status legend

- ✅ Implemented and verified in branch
- 🧪 Implemented; deployment/device verification required
- ⚠️ External action required
- ❌ Not implemented

## P0 matrix

| P0 requirement | Status | Implementation / next gate |
|---|---|---|
| Upstream commercial usage status resolved | ⚠️ | Not legally resolved. See `UPSTREAM_LICENSE_STATUS.md`. Commercial release remains blocked. |
| Production auth configured | 🧪 | Better Auth configuration builds successfully; production DB/secrets and admin bootstrap still required. Public signup remains disabled by default. |
| Multi-tenant isolation verified | 🧪 | SQL migration enforces wedding-scoped guests/RSVP/wishes and removes anon policies. Must be applied to the real Supabase project and cross-tenant tests executed there. |
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
- public sign-up disabled in auth config and middleware by default,
- central slug/UUID/text validation,
- new wedding creation rejects unavailable template IDs,
- release gate validates slug/template/content/event/section compatibility,
- storage upload requires wedding membership and uses tenant-scoped paths,
- unauthorized default commercial music fallback removed,
- legacy `classic` template IDs migrate to `classic-001`,
- old section arrays are normalized so new shared sections can be introduced safely,
- GitHub Actions build CI is active for this branch.

## CI state — PASS

`Commerce P0 CI` is now active and the latest verification run passed.

### CI fixes found during activation

1. `app/demo/page.tsx` still used the old `MusicPlayer` props (`songs` / `autoPlay`). The demo was updated to the new context-driven `MusicPlayer` contract.
2. Strict TypeScript did not preserve the top-level Supabase environment narrowing inside `createServerClient()`. `lib/supabase.ts` now copies validated env values into explicitly typed constants.

### Verified run

- Workflow: `Commerce P0 CI`
- Run: `#5`
- Commit: `c3b9f12ae0f971fd6feaaa32914a21ceaa6a952c`
- Result: **success**
- Install dependencies: success
- Next.js production compile: success
- TypeScript: success
- Overall build job: success

The build still reports a non-blocking Next.js warning that the `middleware` file convention is deprecated in favor of `proxy`; this does not fail the current P0 build and can be migrated separately.

## External steps before P0 can be called production-verified

1. Resolve upstream commercial license/permission.
2. Create/configure the real Supabase project.
3. Apply `supabase/run-weddings-migrations.sql`.
4. Create `wedding-assets` Storage bucket.
5. Run Better Auth migration.
6. Create/bootstrap the admin account, then keep `ALLOW_PUBLIC_SIGNUP=false`.
7. Configure real secrets and public domain env values.
8. Run cross-tenant security tests against deployed Supabase.
9. Validate the invitation on low/mid/high-end mobile devices.
10. Replace the in-memory public submission limiter with a shared/edge limiter before horizontal/high-volume scaling.

## P0 completion rule

**In-repository technical P0 is complete because CI now passes.**

Production P0 is only complete after the external infrastructure/security/device steps above are verified. Commercial release additionally requires the upstream license blocker to be resolved.
