# ENDRIYA Phase 4 — Public Delivery & Publishing

**Status:** IMPLEMENTED — DEPLOYMENT VERIFICATION DEFERRED TO PHASE 9  
**Branch:** `develop/commerce-foundation`

Phase 4 turns the Phase 3 wedding engine into a stable public delivery surface. It defines one released-wedding resolver shared by path and subdomain delivery, canonical public URLs, personalized guest resolution, publication lifecycle rules, and deployment/domain verification.

## Project sequencing decision

Repository implementation and focused technical verification for Phase 4 are complete.

Per `IMPLEMENTATION_TESTING_MASTER_PLAN.md`, real-host deployment verification is intentionally deferred until **Phase 9 — Full Integration & End-to-End Acceptance Testing** so Phases 5–8 can be implemented first without repeatedly switching between feature development and environment setup.

This does **not** remove CI requirements. Build, database smoke, security boundary checks, focused verification scripts, Docker build, and health smoke must remain green while later phases are implemented.

## Scope

### 4.1 Shared released-wedding resolver — implemented

`lib/commerce/public-invitation.ts` is the single public data boundary for invitation rendering.

Rules:

- slug must pass the canonical slug validator,
- only `status = released` weddings resolve,
- template must be active in the registry,
- wedding content is normalized to the canonical content contract,
- guest tokens are resolved only inside the target wedding,
- inactive/invalid guest tokens degrade to a non-personalized invitation rather than exposing unrelated data.

Both `/invite/[slug]` and the internal subdomain rewrite route now consume this resolver.

### 4.2 Canonical path/subdomain routing — implemented

Canonical URL generation remains centralized in `lib/commerce/url.ts`.

Path mode:

```text
https://domain.id/invite/{slug}?guest={opaque-token}
```

Subdomain mode:

```text
https://{slug}.domain.id/?guest={opaque-token}
```

When subdomain mode is enabled, a valid released path invitation redirects to its canonical subdomain URL. Personalized guest tokens are preserved only when they resolve for that wedding.

`proxy.ts` now:

- resolves the wedding slug from the configured base hostname,
- accepts `x-forwarded-host` for reverse-proxy deployments,
- rejects nested or reserved subdomain labels,
- rewrites only the canonical subdomain root to the internal invitation route,
- redirects non-root subdomain paths back to `/` to avoid duplicate public URLs.

### 4.3 Public metadata / social sharing — implemented

Released invitations generate wedding-specific metadata from canonical content:

- title from couple names,
- description from hero/event content,
- canonical URL without a guest token,
- Open Graph URL/title/description/image,
- Twitter card metadata,
- index/follow only for valid released invitations.

Personalized guest URLs therefore do not become separate canonical pages.

### 4.4 Publication lifecycle — implemented

A released wedding is immutable through the wedding PATCH API except for one owner action:

```json
{"status":"draft"}
```

Required editing flow:

```text
released
  ↓ unpublish
 draft
  ↓ edit content/template/slug/sections/theme
 readiness validator
  ↓ release
released
```

This prevents post-release edits from bypassing the readiness gate.

The Settings page exposes an owner-only **Unpublish wedding** control. Returning to draft immediately removes the wedding from the public resolver while preserving wedding data, guests, RSVP, wishes, assets, and slug.

`public_url` is returned/displayed only while the wedding is actually released.

### 4.5 Routing verification — implemented

CI runs:

```text
scripts/phase4_2_public_routing_verify.ts
```

It verifies:

- path URL generation,
- subdomain URL generation,
- personalized token encoding,
- canonical metadata without guest token,
- reverse-proxy host parsing,
- nested-subdomain rejection,
- reserved-subdomain rejection,
- apex-host rejection.

## Repository verification result

The Phase 4 implementation has passed the repository verification chain including:

- service-role boundary verification,
- Phase 3 focused verification scripts,
- Phase 4 public routing verification,
- production Next.js build,
- database smoke,
- Docker image build,
- container health smoke.

## Deferred Phase 9 environment gates

The following are **recorded, not forgotten**. They will be executed during Phase 9 against the integrated product:

1. create/reconcile final deployment environment/secrets,
2. choose/configure the real staging/production hostname,
3. configure HTTPS,
4. keep `PUBLIC_INVITATION_MODE=path` for the first real-host smoke test,
5. verify released and draft/unpublish behavior through the deployed application,
6. verify personalized guest links end-to-end,
7. if subdomain mode is enabled, configure wildcard DNS and wildcard TLS,
8. test `slug.domain.id` behind the actual reverse proxy/CDN,
9. verify canonical metadata and social preview against the real public URL,
10. run mobile/device QA on real released invitations.

## Phase boundary

Phase 4 is about delivery and publication, not commerce operations.

The immediate next implementation phase is **Phase 5 — Commerce Operations**, covering Orders, Customers, Payment Status, RSVP Analytics, and Wishes Moderation.

The authoritative cross-phase sequencing and final testing plan is `IMPLEMENTATION_TESTING_MASTER_PLAN.md`.
