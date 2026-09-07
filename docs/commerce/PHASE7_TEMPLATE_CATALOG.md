# ENDRIYA — Phase 7 Template Catalog Scaling

**Status:** IMPLEMENTED  
**Branch:** `develop/commerce-foundation`  
**Phase:** 7 — Template Catalog Scaling

## 1. Outcome

Phase 7 proves that the same canonical wedding data and shared business blocks can render into substantially different production experiences without changing wedding/customer/order schemas, guest logic, RSVP/wishes logic, public routing, or publish lifecycle.

Active production experiences:

```text
classic-001      → Classic / Motion 2D
editorial-001    → Elegant / Editorial 2D
cartoon-001      → Illustrated / Motion 2D
storybook-001    → Illustrated / Motion 2D
paper-cut-001    → Whimsical / 2.5D
pasundan-001     → Heritage Nusantara / 2.5D
clay-001         → Whimsical / WebGL 3D
```

`minimal-001` remains `draft` as an older incomplete experiment and is intentionally not exposed as an active production template.

## 2. Canonical Contract

Every active renderer implements:

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

The public route remains template-neutral and delegates presentation through the canonical `InvitationRenderer` / Template Registry. No public-route template special cases were added.

## 3. Typography Foundation

Typography is a template identity with semantic roles:

```text
display
heading
body
accent
```

Curated Phase 7 fonts:

- Inter
- Playfair Display
- Cormorant Garamond
- DM Serif Display
- Lora
- Nunito
- Parisienne
- Allura
- Sacramento
- Cinzel Decorative

Fonts are loaded at the invitation boundary through `next/font`; registry metadata remains pure/verifiable. Playfair Display + Inter remain the platform fallback. Script/decorative fonts are limited to display/accent roles.

Production pairings:

| Template | Display | Heading | Body |
|---|---|---|---|
| Classic | Allura | Cormorant Garamond | Lora |
| Editorial Ivory | Cormorant Garamond | DM Serif Display | Inter |
| Cartoon Love Story | Parisienne | Nunito | Nunito |
| Storybook Romance | Parisienne | Cormorant Garamond | Lora |
| Paper Cut Garden | Allura | DM Serif Display | Inter |
| Pasundan Storyland | Cinzel Decorative | Cormorant Garamond | Lora |
| Clay Couple | Sacramento | Nunito | Nunito |

## 4. Experience Implementations

### Cartoon Love Story — `cartoon-001`

Illustrated bride/groom opening, playful scene/micro-motion, chapter framing, responsive mobile composition, and reduced-motion fallback. Uses shared Couple/Date/Location/Story/Gallery/RSVP/Wishes/Gift/Music blocks.

### Storybook Romance — `storybook-001`

Two-page illustrated book hero on desktop, single-page mobile adaptation, paper/book visual language, chapter framing, subtle motion, and reduced-motion fallback.

### Paper Cut Garden — `paper-cut-001`

First 2.5D experience. Layered DOM/CSS foreground/midground/background, perspective, pointer/scroll parallax, `requestAnimationFrame` throttling, `translate3d`, adaptive mobile profile, no WebGL dependency.

### Pasundan Storyland — `pasundan-001`

Heritage Nusantara 2.5D composition with Priangan landscape, layered mountain ranges, gate, bamboo/foliage and woven treatment, Sundanese-oriented opening language, parallax, adaptive mobile behavior, and reduced-motion fallback. It is a distinct composition, not a Paper Cut recolor.

### Clay Couple — `clay-001`

First active WebGL/3D architecture proof. Native WebGL renders clay-like couple forms with custom shaders, subtle camera movement and pointer steering. Important information remains DOM content. WebGL failure/reduced-motion paths retain usable static/fallback presentation. This is the architecture proof, not the final custom-avatar/rigging pipeline.

### Editorial Ivory — `editorial-001`

Elegant Standard 2D baseline with split editorial hero, ivory/ink visual system, strong typographic hierarchy, restrained motion, full canonical section framing, and shared business blocks. This provides a low-complexity premium baseline alongside illustrated, 2.5D, heritage, and WebGL experiences.

## 5. Metadata and Catalog

Template Registry now exposes stable metadata for every entry:

- ID,
- name,
- family,
- category,
- tags,
- version,
- lifecycle status,
- visual tier,
- typography,
- canonical section contract,
- performance profile,
- thumbnail,
- preview path.

Default stable catalog assets are derived centrally:

```text
thumbnail   → /api/template-thumbnails/{templateId}
previewPath → /dashboard/templates/{templateId}/preview
```

Operator catalog:

```text
/dashboard/templates
```

Catalog supports:

- keyword/tag search,
- category filter,
- visual-tier filter,
- active/draft/archive lifecycle filter,
- typography/performance metadata visibility,
- generated thumbnail cards,
- full internal preview navigation.

The main Commerce Studio navigation now includes **Templates**.

## 6. Shared Preview Fixture

All catalog previews use one canonical wedding fixture:

```text
lib/commerce/template-preview-fixture.ts
```

Full preview route:

```text
/dashboard/templates/{templateId}/preview
```

The route renders through the same `InvitationRenderer` used by the product rather than maintaining separate demo-specific renderer logic. RSVP remains non-submittable without a real personalized public guest context.

## 7. Repeatable Authoring Contract

Future template contributors must follow:

```text
docs/commerce/TEMPLATE_AUTHORING_GUIDE.md
```

The guide documents canonical sections, metadata requirements, typography roles, 2D/2.5D/3D rules, mobile/reduced-motion requirements, anti-duplicate rules, activation sequence, CI requirements, and the prohibition on changing core business schemas/logic merely to add a visual template.

## 8. Verification

Final Phase 7 compatibility gate:

```text
scripts/phase7_catalog_completion_verify.ts
```

It verifies:

- at least seven active production experiences,
- family/category diversity,
- 2D + 2.5D + 3D coverage,
- metadata completeness,
- performance/mobile/motion declarations,
- canonical fixture compatibility across every active template,
- Editorial Ivory production identity,
- catalog/thumbnail/preview artifacts,
- authoring guide existence/content,
- template-neutral public invitation route,
- legacy incomplete Minimal template remains draft.

Completion CI passed:

```text
Phase 7.1 typography verifier       PASS
Phase 7.2 Cartoon verifier          PASS
Phase 7.3 Storybook verifier        PASS
Phase 7.4 Paper Cut verifier        PASS
Phase 7.5 Pasundan verifier         PASS
Phase 7.6 Clay 3D verifier          PASS
Phase 7 catalog completion          PASS
Production Next.js build            PASS
Canonical DB migration chain        PASS
Tenant / integrity database smoke   PASS
Docker image build                  PASS
Container health smoke              PASS
```

## 9. Deferred Acceptance / Hardening

Phase 7 is repository-level `IMPLEMENTED`, not production `VERIFIED`.

Deferred to Phase 8/9:

- numeric bundle/performance budgets and deeper performance hardening,
- final image optimization and heavy-asset strategy,
- custom Clay avatar modeling/rigging pipeline,
- cultural asset/content rights review,
- real-device visual QA,
- low-end/mobile WebGL capability testing,
- reduced-motion real-device verification,
- slow-network testing,
- final production domain/deployment acceptance.

**Next phase:** Phase 8 — Production Hardening.
