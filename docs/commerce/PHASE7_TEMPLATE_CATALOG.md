# ENDRIYA — Phase 7 Template Catalog Scaling

**Status:** IN PROGRESS  
**Branch:** `develop/commerce-foundation`  
**Phase:** 7 — Template Catalog Scaling

## 1. Product Direction

Phase 7 proves that the same canonical wedding data and business blocks can render into substantially different visual experiences.

The agreed initial experience set is:

1. **Editorial Ivory** — Standard 2D
2. **Cartoon Love Story** — Motion 2D
3. **Storybook Romance** — Motion 2D
4. **Paper Cut Garden** — 2.5D
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
| Cartoon Love Story | playful script/accent | Nunito | Nunito |
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

## 8. Current Implementation

Implemented foundation:

- curated Wedding Font Registry,
- typography metadata added to `TemplateDefinition`,
- registry-level typography validation,
- semantic wedding typography CSS variables,
- invitation-level font loading boundary,
- shared Hero uses the semantic display font,
- `classic-001` pairing: Allura + Cormorant Garamond + Lora,
- `minimal-001` direction: Cormorant Garamond + DM Serif Display + Inter,
- Phase 7 typography verifier added to CI.

## 9. Remaining Phase 7 Work

- build the agreed Cartoon Love Story renderer,
- build Storybook Romance renderer,
- build Paper Cut Garden 2.5D renderer,
- build Pasundan Storyland 2.5D renderer,
- build Clay Couple 3D/fallback architecture,
- complete Editorial Ivory full canonical contract and activate it,
- add catalog discovery metadata/filtering,
- add template thumbnails/demo paths,
- add performance budgets per experience level,
- verify one wedding fixture across multiple active templates,
- verify reduced-motion and low-capability fallbacks.

Phase 7 must not be marked `IMPLEMENTED` until the agreed template diversity has been demonstrated with the shared canonical wedding data.
