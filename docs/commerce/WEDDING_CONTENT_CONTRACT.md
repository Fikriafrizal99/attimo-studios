# ENDRIYA Wedding Content Contract

Status: canonical v1

This document defines the stable data contract shared by every ENDRIYA invitation renderer.

## Core rule

A wedding owns one canonical `WeddingContent` object. Changing visual experience from 2D to 2.5D or 3D must not require re-entering wedding data.

Presentation configuration is separate:

- `weddings.template_id` chooses the renderer.
- `weddings.theme` stores renderer/theme presentation settings.
- `weddings.sections` controls shared section visibility and order.
- `weddings.content` stores the canonical wedding content defined here.

Operational tenant data is also separate from content JSON:

- guests
- RSVP responses
- wishes
- collaborator membership/invites

A template must never create its own incompatible copy of those features.

## Schema version

Current content schema version: `1`.

Every normalized content object has `schemaVersion: 1`. Future incompatible changes require an explicit schema version and migration/normalization path.

## Canonical content groups

`WeddingContent` contains:

- `couple.bride` / `couple.groom`: name, short name, username, parent information, origin/location, image.
- `hero`: greeting, title, subtitle, quote, cover image/video, countdown event reference.
- `events[]`: stable id, title, date/time, venue, address, maps URL, coordinates, primary-event flag.
- `story[]`: stable id, date/year, title, description, image.
- `gallery[]`: stable id, URL, alt text.
- `gifts`: intro, bank accounts, QRIS image, shipping address.
- `music[]`: stable id, title, artist, URL, cover.
- `musicSettings`: playback request settings.
- `blessingMessage`: Arabic text, translation, source.
- `galleryQuote`: title and text.

`mainEventDate` remains compatibility-only. New code resolves the countdown from `events[]`.

## Shared section contract

Canonical section IDs are:

1. `hero`
2. `couple`
3. `date`
4. `location`
5. `story`
6. `gallery`
7. `rsvp`
8. `wishes`
9. `gift`
10. `music`

Each section config contains only:

```ts
{
  id: WeddingSectionId;
  enabled: boolean;
  order: number;
}
```

Templates may render these sections differently, but they must consume the same semantic data and must not redefine feature availability by pricing or visual tier.

## Visual tiers

ENDRIYA visual tiers are presentation choices only:

- 2D
- 2.5D
- 3D

All tiers receive the same product features and canonical content. A higher visual tier can introduce depth, motion, WebGL scenes, camera movement, or richer transitions, but it cannot require a separate wedding data model.

## Normalization boundary

Persisted/legacy JSON is passed through `normalizeWeddingContent()` before being used by the editor or renderer. The normalized result is `CanonicalWeddingContent`, which always includes `schemaVersion: 1` and all canonical groups.

The existing editor-facing `WeddingContent` type keeps only a narrow compatibility allowance for `schemaVersion` while old editor code is migrated. Renderers should consume normalized content, not arbitrary persisted JSON.

Server-side validation is a separate Phase 3.2 concern. The content contract in this document defines shape and ownership boundaries; validation defines what input is accepted.
