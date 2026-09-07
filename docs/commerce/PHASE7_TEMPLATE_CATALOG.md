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
5. **Pasundan Storyland** — 2.5D
6. **Clay Couple** — 3D / immersive progression

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

Typography is now a first-class template identity instead of forcing every invitation to use the global platform pair.

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

## 5. Agreed Pairing Direction

| Experience | Display | Heading | Body |
|---|---|---|---|
| Editorial Ivory | Cormorant Garamond | DM Serif Display | Inter |
| Cartoon Love Story | Parisienne | Nunito | Nunito |
| Storybook Romance | Parisienne | Cormorant Garamond | Lora |
| Paper Cut Garden | Allura | DM Serif Display | Inter |
| Pasundan Storyland | heritage display/accent | Cormorant Garamond | Lora |
| Clay Couple | Sacramento | Nunito | Nunito |

Exact production pairing may be adjusted after mobile visual QA, but each experience must retain a distinct typography identity.

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

## 8. Phase 7.1 — Typography Foundation

Implemented:

- curated Wedding Font Registry,
- typography metadata added to `TemplateDefinition`,
- registry-level typography validation,
- semantic wedding typography CSS variables,
- invitation-level font loading boundary,
- shared Hero uses the semantic display font,
- `classic-001` pairing: Allura + Cormorant Garamond + Lora,
- `minimal-001` direction: Cormorant Garamond + DM Serif Display + Inter,
- Nunito + Parisienne loaders for illustrated experiences,
- Phase 7 typography verifier added to CI.

## 9. Phase 7.2 — Cartoon Love Story

**Status:** IMPLEMENTED

Template ID:

```text
cartoon-001
```

Catalog identity:

```text
family       → cartoon-love-story
category     → Illustrated
visual tier  → 2d
motion       → rich
mobile       → full
```

Typography:

```text
display → Parisienne
heading → Nunito
body    → Nunito
accent  → Parisienne
```

Experience characteristics:

- custom illustrated/cartoon hero rather than the Classic hero,
- animated bride/groom character scene,
- clouds, flowers, heart micro-motion and playful landscape composition,
- chapter framing around the canonical sections,
- mobile-first responsive composition,
- `prefers-reduced-motion` CSS fallback,
- distinct `illustrated-motion` experience marker.

Business-boundary rule remains intact. Cartoon reuses the shared Couple, Date/countdown, Location/maps, Story, Gallery, RSVP, Wishes, Gift, and Music components. It does not implement separate public business API logic.

## 10. Phase 7.3 — Storybook Romance

**Status:** IMPLEMENTED

Template ID:

```text
storybook-001
```

Catalog identity:

```text
family       → storybook-romance
category     → Illustrated
visual tier  → 2d
motion       → rich
mobile       → full
```

Typography:

```text
display → Parisienne
heading → Cormorant Garamond
body    → Lora
accent  → Parisienne
```

Experience characteristics:

- two-page illustrated book spread for the desktop hero,
- responsive single-page/story composition on mobile,
- paper texture, page edge, central book-spine and botanical decoration,
- custom wedding-story cover page with guest personalization,
- landscape illustration page with layered hills, trees and couple silhouette,
- canonical sections framed as Chapters I–VIII,
- page/chapter reveal motion and subtle environmental motion,
- `prefers-reduced-motion` fallback,
- distinct `storybook-motion` experience marker.

Storybook reuses the same shared Couple, Date/countdown, Location/maps, Story, Gallery, RSVP, Wishes, Gift, and Music components as the other active experiences. It introduces no new wedding schema and no duplicate RSVP/wishes/gift API logic.

With Phase 7.3, one canonical wedding contract supports three substantially different active visual experiences.

## 11. Phase 7.4 — Paper Cut Garden 2.5D

**Status:** IMPLEMENTED

Template ID:

```text
paper-cut-001
```

Catalog identity:

```text
family         → paper-cut-garden
category       → Whimsical
visual tier    → 2.5d
rendering mode → hybrid
motion         → rich
mobile         → adaptive
```

Typography:

```text
display → Allura
heading → DM Serif Display
body    → Inter
accent  → Allura
```

Experience characteristics:

- first active ENDRIYA template classified as `2.5d`,
- layered paper-cut hero composed from sky, hills, arch, foliage, floral foreground and wedding-name planes,
- explicit foreground/midground/background depth factors,
- pointer-based parallax on capable desktop pointers,
- scroll-driven depth movement throttled through `requestAnimationFrame`,
- compositor-friendly `translate3d` transforms and CSS perspective,
- paper-shadow treatment and layered section framing across the canonical wedding experience,
- adaptive mobile profile that reduces visual scale/depth complexity,
- touch input does not depend on pointer parallax,
- `prefers-reduced-motion` removes the depth transforms and motion while preserving all content,
- no WebGL runtime required.

Paper Cut Garden still reuses the shared Couple, Date/countdown, Location/maps, Story, Gallery, RSVP, Wishes, Gift, and Music components. The 2.5D layer changes presentation only; there is no new wedding schema and no duplicated public business API logic.

Phase 7.4 verification requires:

- `paper-cut-001` active and discoverable through the `2.5d` tier filter,
- four active production experiences in total,
- full canonical section compatibility,
- `hybrid` rendering declaration,
- adaptive mobile profile,
- pointer and scroll depth mechanics,
- explicit layered depth markers,
- browser-safe pixel-based transform variables,
- shared business-section reuse,
- reduced-motion fallback,
- production Next.js build success,
- database smoke success,
- Docker image and container health success.

With Phase 7.4, the shared wedding contract is proven across both conventional Motion 2D and layered 2.5D experiences.

## 12. Remaining Phase 7 Work

- build Pasundan Storyland 2.5D renderer — **NEXT**,
- build Clay Couple 3D/fallback architecture,
- complete Editorial Ivory full canonical contract and activate it,
- add catalog discovery metadata/filtering,
- add template thumbnails/demo paths,
- add performance budgets per experience level,
- verify one wedding fixture across all active templates,
- verify reduced-motion and low-capability fallbacks in Phase 9 device testing.

Phase 7 must not be marked `IMPLEMENTED` until the agreed template diversity has been demonstrated with the shared canonical wedding data.
