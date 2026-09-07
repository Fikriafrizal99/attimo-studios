# ENDRIYA — Template Authoring Guide

**Applies to:** Phase 7+ template development  
**Architecture:** shared canonical wedding core, independent visual experience

## 1. Non-negotiable rule

A new template changes presentation only. Adding a template must not require changes to:

- wedding database schema,
- customer/order schema,
- guest-token logic,
- RSVP API/data model,
- wishes API/data model,
- public invitation resolver,
- public routing,
- publish/unpublish lifecycle.

If a template request requires one of those changes, treat it as a platform feature request first, not a template implementation.

## 2. Canonical section contract

Every active production template must support all canonical sections:

```text
hero
couple
date
location
story
gallery
rsvp
wishes
gift
music
```

Use the shared components for business-sensitive sections. A template may wrap, frame, position, animate, theme, or compose them differently, but must not fork their API/business behavior.

## 3. Required registry metadata

Every registry entry must define:

- stable `id` (`family-001` pattern),
- customer-facing `name`,
- `family`,
- `category`,
- meaningful `tags`,
- integer `version`,
- lifecycle `status`,
- `visualTier` (`2d`, `2.5d`, or `3d`),
- curated `typography`,
- `contentSchemaVersion`,
- canonical `sectionContract`,
- `performance` profile,
- renderer component.

The registry automatically exposes a stable catalog thumbnail and internal preview route when a custom one is not provided:

```text
/api/template-thumbnails/{templateId}
/dashboard/templates/{templateId}/preview
```

## 4. Typography

Use fonts from the curated Wedding Font Registry only.

Roles:

```text
display → couple names / hero statements
heading → section headings
body    → functional text / forms / details
accent  → optional decorative short text
```

Script/decorative fonts must not be used as body fonts. All fonts must retain Playfair Display / Inter fallbacks through template typography metadata.

## 5. Experience tiers

### Standard / Motion 2D

Use DOM/CSS/GSAP where appropriate. Keep meaningful content in semantic HTML.

### 2.5D

Use layered DOM/CSS depth, perspective, pointer/scroll parallax, and compositor-friendly transforms. Touch/mobile must not require pointer movement.

### 3D

3D is progressive enhancement. Important wedding information must remain accessible in DOM even when WebGL is unavailable. Provide a visual fallback and honor reduced motion.

Do not ship a 3D runtime to templates that do not need it.

## 6. Mobile and motion requirements

Every active template must explicitly declare:

- rendering mode,
- motion level,
- mobile profile,
- reduced-motion fallback.

Mobile is the primary invitation consumption surface. Decorative complexity may reduce on smaller devices, but wedding information and business features must remain complete.

## 7. Visual differentiation rule

Do not create a new sellable template for color/font/background-only changes.

A distinct template should materially change several of:

- opening experience,
- composition,
- section layout/framing,
- typography identity,
- illustration/image treatment,
- motion language,
- cultural expression,
- interaction,
- depth model.

Small variations belong in a theme/variant system.

## 8. Implementation sequence

1. Define experience concept and family/category/tags.
2. Choose visual tier and performance profile.
3. Choose approved typography pairing.
4. Implement a distinct hero/opening.
5. Map every canonical section using shared business components.
6. Implement mobile adaptation.
7. Implement reduced-motion/failure fallback.
8. Register as `draft` first if the canonical contract is incomplete.
9. Add/extend a phase verifier.
10. Activate only after the verifier and production build pass.
11. Verify thumbnail/catalog metadata and internal full preview.
12. Run full CI: build, database smoke, Docker image, container health.

## 9. Required verification before `active`

For each new active template verify:

- stable ID and metadata,
- full canonical section contract,
- compatibility with the shared wedding fixture,
- correct typography roles,
- shared Couple/Date/Location/Story/Gallery/RSVP/Wishes/Gift/Music reuse where applicable,
- no duplicated public RSVP/wishes/gift API implementation,
- declared performance/mobile/motion profile,
- reduced-motion fallback,
- usable catalog thumbnail,
- usable internal preview path,
- production Next.js build success,
- database smoke success,
- Docker image and health smoke success.

## 10. Phase 9 deferred visual acceptance

Repository-level implementation is not real-device acceptance. Phase 9 remains responsible for final Android/iPhone/desktop visual QA, slow-network behavior, real WebGL capability/failure testing, reduced-motion device testing, and final production-domain validation.
