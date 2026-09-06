# ENDRIYA Phase 4 — Public Delivery & Publishing

Status: implementation in progress on `develop/commerce-foundation`

Phase 4 turns the Phase 3 wedding engine into a stable public delivery surface. It defines one released-wedding resolver shared by path and subdomain delivery, canonical public URLs, personalized guest resolution, publication lifecycle rules, and deployment/domain verification.

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

## Remaining Phase 4 deployment gates

These require the real deployed hostname rather than repository-only work:

1. choose/configure the production domain,
2. configure HTTPS,
3. keep `PUBLIC_INVITATION_MODE=path` for the first production smoke test,
4. verify released and draft behavior through the real deployed application,
5. verify personalized guest links end-to-end,
6. if subdomain mode is enabled, configure wildcard DNS and wildcard TLS,
7. test `slug.domain.id` behind the actual reverse proxy/CDN,
8. verify canonical metadata in the deployed HTML/social preview,
9. run mobile/device QA on a real released invitation.

## Phase boundary

Phase 4 is about delivery and publication, not commerce operations. Orders, customer records, payment status, RSVP analytics, and wishes moderation remain the next operational/commercial phase after public delivery is stable.
