# ENDRIYA Template Registry

Status: canonical registry v1

ENDRIYA templates are presentation renderers over one shared wedding engine. A template never owns a separate wedding data model and never unlocks or removes product features by visual tier.

## Product invariant

Every active template must be capable of rendering the complete canonical wedding section contract:

- hero
- couple
- date
- location
- story
- gallery
- rsvp
- wishes
- gift
- music

A wedding may disable sections in its own layout configuration, but that is a wedding-level choice. It is not a template entitlement.

## Visual tiers

The only commercial visual classes are:

- `2d`
- `2.5d`
- `3d`

These describe presentation complexity, not feature access.

Examples:

- 2D: DOM/CSS layouts, illustration, editorial design, light/rich motion.
- 2.5D: layered depth, parallax, camera-like movement, richer compositing.
- 3D: WebGL/hybrid scenes, 3D objects, camera movement, immersive interaction.

## Registry definition

Each template is registered in `templates/registry.tsx` using the contract in `templates/types.ts`.

Required metadata:

```ts
{
  id: "classic-001",
  name: "Endriya Classic 001",
  family: "classic",
  category: "Classic",
  tags: ["classic", "romantic"],
  version: 1,
  status: "active",
  visualTier: "2d",
  contentSchemaVersion: 1,
  sectionContract: WEDDING_SECTION_IDS,
  performance: {
    renderingMode: "dom",
    motionLevel: "rich",
    mobileProfile: "full",
    reducedMotionFallback: true,
  },
  render: ClassicTemplate,
}
```

Optional catalog metadata includes `thumbnail` and `previewPath`.

## Stable IDs

`template_id` is stored in `public.weddings`. Once a template ID has been used by released customer data, do not rename or recycle it. Change customer-facing names freely while preserving the stable ID.

IDs use lowercase kebab-case with a three-digit version suffix, for example:

- `ivory-001`
- `bloom-001`
- `evergarden-001`

## Status lifecycle

- `draft`: development/QA only; cannot be selected for a live wedding through `resolveTemplate()`.
- `active`: available to weddings and must implement the complete wedding section contract.
- `archived`: retained for history/migration but unavailable for new resolution.

Do not mark a renderer active before every canonical section is implemented.

## Performance contract

Every template declares a performance profile:

- `renderingMode`: `dom`, `hybrid`, or `webgl`
- `motionLevel`: `light`, `rich`, or `immersive`
- `mobileProfile`: `full` or `adaptive`
- `reducedMotionFallback`: must be `true`

2.5D/3D templates may use adaptive quality or fallback rendering on weaker/mobile devices. The wedding content contract remains identical.

## Adding a template

1. Create a renderer folder under `templates/<template-id>/`.
2. Consume `TemplateRenderProps`; do not introduce a template-specific wedding content schema.
3. Implement all canonical sections before status becomes `active`.
4. Register metadata in `templates/registry.tsx`.
5. Verify mobile behavior and reduced-motion fallback.
6. Run the full CI build before activation.

The current `minimal-001` renderer is intentionally `draft` until it implements the complete canonical section contract.
