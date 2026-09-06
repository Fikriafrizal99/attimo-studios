# ENDRIYA Template 001 — Classic

Status: active reference renderer

`classic-001` is the first production reference template for the ENDRIYA wedding engine. It is intentionally a 2D DOM renderer and acts as the structural baseline for future 2D, 2.5D, and 3D templates.

## Stable identity

- Template ID: `classic-001`
- Customer-facing name: `Endriya Classic 001`
- Visual tier: `2d`
- Content schema: `1`
- Rendering mode: `dom`
- Mobile profile: `full`

The database-facing template ID must not be renamed after customer data uses it.

## Renderer location

Canonical implementation:

`templates/classic-001/Classic001Template.tsx`

The old `app/invitation/ClassicTemplate.tsx` path is compatibility-only and re-exports the canonical renderer.

## Renderer contract

The renderer receives `TemplateRenderProps` only. It does not own a separate wedding data schema.

It receives:

- `weddingId`
- optional `publicSlug`
- canonical `WeddingContent` v1
- canonical ordered section configuration
- optional theme configuration
- optional personalized guest context

The shared `InvitationRenderer` normalizes persisted content before invoking the template.

## Full feature contract

Classic 001 implements every canonical wedding section:

1. hero
2. couple
3. date
4. location
5. story
6. gallery
7. rsvp
8. wishes
9. gift
10. music

Wedding-level section configuration controls visibility and order. The template does not decide which product features a customer is entitled to.

## Reference rule for future templates

Every new renderer should follow the same ownership boundary:

`Wedding Engine -> canonical content/sections -> Template Registry -> renderer`

2.5D or 3D templates may radically change presentation, motion, depth, and rendering technology, but must not fork the wedding content model or remove shared product features.
