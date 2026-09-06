# ENDRIYA Phase 3 — Wedding Engine

Status: implemented on `develop/commerce-foundation`

Phase 3 establishes one wedding engine shared by every ENDRIYA visual tier. 2D, 2.5D, and 3D templates consume the same canonical wedding data and product features.

## Completed scope

- 3.1 Wedding Content Contract
- 3.2 Server Validation Schema
- 3.3 Template Registry
- 3.4 Endriya Classic 001 reference renderer
- 3.5 Timezone-safe real countdown
- 3.6 Canonical gallery engine
- 3.7 Wedding-scoped storage isolation
- 3.8 Digital gift / bank / QRIS engine
- 3.9 Maps / location engine
- 3.10 Owner guest management
- 3.11 Publish readiness validator

## Core boundaries

`weddings.content` stores semantic wedding content only. `template_id` and `theme` remain presentation configuration. Guests, RSVP, wishes, collaborators, and invites remain operational tenant data outside the content JSON.

Every active template must implement the complete canonical section contract. Feature availability is not determined by visual tier.

## Public asset boundary

Wedding assets use the `wedding-assets` bucket and a server-generated object namespace:

```text
weddings/<wedding_id>/assets/<timestamp>-<random-token>.<ext>
```

Browser roles cannot directly mutate that bucket. The upload route first authorizes the Better Auth user against tenant membership, validates image size and file signature, then performs the storage mutation with the service role.

The bucket remains publicly readable because released invitation media must load without visitor authentication.

## Gift engine

The canonical gift group supports:

- bank accounts
- QRIS image
- physical gift shipping address

Draft accounts may be edited incrementally, but incomplete accounts are not rendered. Publish readiness blocks incomplete bank-account entries when the gift feature is enabled.

## Location engine

Location rendering consumes canonical wedding events. Navigation resolves in this order:

1. explicit validated `mapsUrl`
2. latitude/longitude
3. address
4. venue/location name

No paid maps API is required for the current Google Maps embed/search fallback.

## Guest management

Guest management is owner-only. The dashboard supports create, edit, search/filter, active/inactive state, quota, personalized link copy, link-token rotation, and delete.

A regenerated guest token invalidates the previous personalized URL.

## Publish readiness

Release is now gated by one centralized readiness validator. Blocking failures include invalid/reserved slug, inactive template, invalid canonical content or sections, missing couple names, incomplete event data, broken countdown/location requirements, and incomplete bank-account data.

Non-blocking warnings include optional presentation/content gaps such as empty gallery, empty music, missing hero media, or a gift section with no configured method.

The Settings page renders the same readiness result used by the release API, preventing UI/server rule drift.

## Migration note

Phase 3.7 adds:

```text
20260906000800_storage_isolation.sql
```

When syncing a linked Supabase project, dry-run first and confirm this is the only pending migration before `supabase db push`.
