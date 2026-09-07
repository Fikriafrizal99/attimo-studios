# ENDRIYA — Phase 7 Template Catalog Scaling

**Status:** IN PROGRESS  
**Branch:** `develop/commerce-foundation`  
**Phase:** 7 — Template Catalog Scaling

## 1. Product Direction

Phase 7 proves that the same canonical wedding data and business blocks can render into substantially different visual experiences.

The agreed initial experience set is:

1. **Editorial Ivory** — Standard 2D
2. **Cartoon Love Story** — Motion 2D — **IMPLEMENTED**
3. **Storybook Romance** — Motion 2D — **IMPLEMENTED**
4. **Paper Cut Garden** — 2.5D — **IMPLEMENTED**
5. **Pasundan Storyland** — 2.5D — **IMPLEMENTED**
6. **Clay Couple** — 3D / WebGL progressive enhancement — **IMPLEMENTED**

These are experience references, not color-only variants. Theme/color variants must not be counted as separate sellable templates unless the experience is substantively different.

## 2. Canonical Section Contract

Every active template must preserve the complete wedding section contract:

```text
hero
→ couple
→ date
→ location
→ story
→ gallery
→ rsvp
→ wishes
→ gift
→ music
```

A template may alter visual composition, motion, typography, storytelling, depth, and interaction, but must not duplicate tenant-sensitive or public business logic.

## 3. Wedding Typography System

Typography is a first-class template identity instead of forcing every invitation to use the global platform pair.

Semantic roles:

```text
display → couple names / hero statement
heading → section titles / important labels
body    → paragraphs / event data / forms
accent  → optional short decorative text
```

Global platform fallback remains:

```text
display → Playfair Display
heading → Playfair Display
body    → Inter
```

Templates may override these through curated wedding fonts.

## 4. Curated Font Registry

Initial registry:

### Platform / fallback
- Inter
- Playfair Display

### Elegant serif
- Cormorant Garamond
- DM Serif Display
- Lora

### Wedding script
- Allura
- Parisienne
- Sacramento

### Friendly / illustrated
- Nunito

### Heritage / decorative
- Cinzel Decorative

All registry entries must record their source and commercial-use license status. The current registry accepts only reviewed `OFL-1.1` entries from Google Fonts.

## 5. Production Pairing Direction

| Experience | Display | Heading | Body |
|---|---|---|---|
| Editorial Ivory | Cormorant Garamond | DM Serif Display | Inter |
| Cartoon Love Story | Parisienne | Nunito | Nunito |
| Storybook Romance | Parisienne | Cormorant Garamond | Lora |
| Paper Cut Garden | Allura | DM Serif Display | Inter |
| Pasundan Storyland | Cinzel Decorative | Cormorant Garamond | Lora |
| Clay Couple | Sacramento | Nunito | Nunito |

Exact pairing may still be adjusted after real-device visual QA, but each experience must retain a distinct typography identity.

## 6. Readability Rules

1. Script/decorative fonts are for display or short accent use only.
2. RSVP, wishes, event details, maps, gift information, and other functional text must use a readable body font.
3. Typography must remain readable on small mobile screens.
4. Font choice must not change the wedding data contract.
5. Font failure must gracefully fall back to Playfair Display / Inter.
6. Unknown or unreviewed fonts must not be accepted by the template registry.
7. User-uploaded arbitrary font files are not supported in Phase 7.

## 7. Loading Architecture

Font metadata belongs to the Template Registry.

Actual `next/font` loaders belong to the invitation rendering boundary, not the registry module itself. This keeps repository verification scripts pure and allows Next.js to process font assets correctly.

Current semantic CSS variables:

```text
--font-wedding-display
--font-wedding-heading
--font-wedding-body
--font-wedding-accent
```

Shared invitation blocks inherit these variables, so business components such as RSVP, wishes, date, gift, and location do not need separate implementations per template.

The invitation boundary now loads the curated fonts needed by the active experience set, including Cinzel Decorative for heritage display use and Sacramento for Clay Couple display use.

## 8. Phase 7.1 — Typography Foundation

**Status:** IMPLEMENTED

Implemented:

- curated Wedding Font Registry,
- typography metadata added to `TemplateDefinition`,
- registry-level typography validation,
- semantic wedding typography CSS variables,
- invitation-level font loading boundary,
- shared Hero uses the semantic display font,
- `classic-001` pairing: Allura + Cormorant Garamond + Lora,
- `minimal-001` direction: Cormorant Garamond + DM Serif Display + Inter,
- loaders for the curated Phase 7 experience fonts,
- Phase 7 typography verifier added to CI.

## 9. Phase 7.2 — Cartoon Love Story

**Status:** IMPLEMENTED

Template ID: `cartoon-001`

```text
family       → cartoon-love-story
category     → Illustrated
visual tier  → 2d
motion       → rich
mobile       → full
```

Typography: Parisienne + Nunito + Nunito.

Experience characteristics include a custom illustrated/cartoon hero, animated bride/groom scene, playful landscape composition, chapter framing, mobile-first responsive treatment, reduced-motion fallback, and reuse of the canonical shared business sections.

## 10. Phase 7.3 — Storybook Romance

**Status:** IMPLEMENTED

Template ID: `storybook-001`

```text
family       → storybook-romance
category     → Illustrated
visual tier  → 2d
motion       → rich
mobile       → full
```

Typography: Parisienne + Cormorant Garamond + Lora.

Experience characteristics include a two-page illustrated book spread, responsive single-page mobile composition, paper/page treatment, chapter framing, subtle motion, reduced-motion fallback, and reuse of the same canonical business sections.

## 11. Phase 7.4 — Paper Cut Garden 2.5D

**Status:** IMPLEMENTED

Template ID: `paper-cut-001`

```text
family         → paper-cut-garden
category       → Whimsical
visual tier    → 2.5d
rendering mode → hybrid
motion         → rich
mobile         → adaptive
```

Typography: Allura + DM Serif Display + Inter.

Paper Cut Garden introduced layered foreground/midground/background depth, pointer and scroll parallax, `requestAnimationFrame` throttling, compositor-friendly `translate3d`, adaptive mobile depth, touch-safe behavior, and reduced-motion fallback without requiring WebGL.

## 12. Phase 7.5 — Pasundan Storyland 2.5D

**Status:** IMPLEMENTED

Template ID:

```text
pasundan-001
```

Catalog identity:

```text
family         → pasundan-storyland
category       → Heritage Nusantara
visual tier    → 2.5d
rendering mode → hybrid
motion         → rich
mobile         → adaptive
```

Typography:

```text
display → Cinzel Decorative
heading → Cormorant Garamond
body    → Lora
accent  → Cinzel Decorative
```

Experience characteristics:

- distinct heritage-inspired Priangan world rather than a reskin of Paper Cut Garden,
- layered sky, sun, mountain ranges, terraced green landscape, gate, bamboo foliage and woven texture,
- `Wilujeng Sumping` opening language and Sunda-oriented section labels,
- pointer-based and scroll-driven layered depth,
- `requestAnimationFrame` throttling for scroll updates,
- adaptive depth treatment on mobile and no dependence on pointer interaction for touch users,
- `prefers-reduced-motion` fallback that removes transforms while preserving all invitation content,
- no changes to wedding schema, public resolver, guest logic, RSVP, wishes, gift, maps, or publishing lifecycle.

The heritage composition is intentionally presentation-only. Cultural assets and wording remain subject to Phase 8 rights/content review and Phase 9 real-device/visual acceptance before commercial release.

## 13. Phase 7.6 — Clay Couple 3D

**Status:** IMPLEMENTED

Template ID:

```text
clay-001
```

Catalog identity:

```text
family         → clay-couple
category       → Whimsical
visual tier    → 3d
rendering mode → webgl
motion         → immersive
mobile         → adaptive
```

Typography:

```text
display → Sacramento
heading → Nunito
body    → Nunito
accent  → Sacramento
```

Experience architecture:

- first active ENDRIYA template using an actual WebGL runtime,
- dependency-free native WebGL enhancement; no Three.js bundle is added to normal templates,
- bride/groom clay characters are built from depth-positioned shaded point-spheres rendered by custom vertex/fragment shaders,
- subtle idle camera orbit plus pointer steering on capable desktop devices,
- the WebGL context is created once and pointer state is passed through a stable ref,
- device pixel ratio is capped for rendering cost control,
- `prefers-reduced-motion` disables the continuous orbit and leaves a static scene,
- a DOM/CSS clay-couple fallback remains available when WebGL cannot initialize,
- all names, guest personalization, opening CTA, and core wedding information remain DOM content and do not depend on WebGL,
- canonical Couple, Date/countdown, Location/maps, Story, Gallery, RSVP, Wishes, Gift, and Music components remain shared.

This is the production architecture proof for the 3D tier, not yet the final custom-avatar production pipeline. Custom couple modeling, clothing/heritage variants, advanced rigging, heavier scene assets, and final low-end-device tuning remain later premium/hardening work.

## 14. Current Active Experience Proof

One canonical wedding contract now supports at least six active production experiences:

```text
classic-001      → Classic / Motion 2D
cartoon-001      → Illustrated / Motion 2D
storybook-001    → Illustrated / Motion 2D
paper-cut-001    → Whimsical / 2.5D
pasundan-001     → Heritage Nusantara / 2.5D
clay-001         → Whimsical / WebGL 3D
```

All six preserve the complete canonical section contract and reuse the shared business blocks.

## 15. Remaining Phase 7 Work

- complete Editorial Ivory full canonical contract and activate it,
- add catalog discovery metadata/filtering surfaces,
- add template thumbnails and dedicated preview/demo paths,
- add performance budgets per experience level,
- verify one canonical wedding fixture across every active template in a single compatibility gate,
- prepare explicit authoring checklist for future template contributors,
- defer reduced-motion/low-capability real-device acceptance to Phase 9.

Phase 7 remains `IN PROGRESS` until the catalog/discovery/compatibility work and agreed Editorial baseline are complete.
