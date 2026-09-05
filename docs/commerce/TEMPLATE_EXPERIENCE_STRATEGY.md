# Template Experience Strategy — Undangan Digital Commerce Platform

**Status:** Approved Direction
**Branch:** `develop/commerce-foundation`
**Version:** 1.0
**Date:** 2026-09-05

## 1. Purpose

Dokumen ini menetapkan strategi pengalaman visual untuk katalog undangan digital.

Keputusan utamanya:

> **Semua undangan memakai core platform dan semantic wedding data yang sama, tetapi setiap template boleh memiliki komposisi visual, motion language, storytelling, layout, interaction, dan level immersive yang sangat berbeda.**

Satu core tidak berarti semua undangan harus terlihat sama.

## 2. Shared Core vs Unique Experience

### Shared Core

Semua template menggunakan domain/business logic yang sama untuk:

- wedding project,
- couple data,
- event data,
- guest management,
- personalized guest URL,
- RSVP,
- wishes,
- gallery data,
- digital gift data,
- music metadata,
- publishing,
- security/tenant isolation,
- analytics dan entitlement di masa depan.

```text
                    SHARED PLATFORM CORE
                           │
      ┌────────────────────┼─────────────────────┐
      │                    │                     │
Wedding Content        Guest/RSVP            Publishing
      │                    │                     │
      └────────────────────┼─────────────────────┘
                           │
                           ▼
                     TEMPLATE ENGINE
                           │
       ┌───────────────────┼────────────────────┐
       ▼                   ▼                    ▼
  Sunda Royal         Modern Editorial     Immersive 3D
       │                   │                    │
  Unique visual        Unique visual        Unique visual
  composition          composition          experience
```

### Unique Template Experience

Template bebas menentukan:

- opening/cover experience,
- section composition,
- typography,
- visual hierarchy,
- color system,
- ornamental language,
- spacing and rhythm,
- image treatment,
- transitions,
- scroll behavior,
- parallax/depth,
- motion choreography,
- navigation style,
- section framing,
- cultural visual references,
- 3D scene when supported.

Business logic seperti RSVP tidak boleh di-copy menjadi implementasi independen hanya demi membuat tampilan berbeda.

## 3. Experience Levels

Template memiliki `experienceLevel` agar katalog, pricing, performance, dan implementation rules dapat dibedakan secara eksplisit.

### Level A — Standard 2D

Karakteristik:

- HTML/CSS-first,
- lightweight,
- responsive,
- limited motion,
- fastest loading profile,
- suitable for broad device compatibility.

Contoh:

- Minimal Editorial,
- Floral Classic,
- Islamic Clean,
- Modern Monochrome.

### Level B — Motion 2D

Karakteristik:

- GSAP/CSS animation,
- animated reveal,
- transition choreography,
- decorative movement,
- richer opening experience,
- tetap tidak bergantung pada WebGL.

Contoh:

- animated flower opening,
- cinematic text reveal,
- curtain/card opening,
- moving ornamental frame.

### Level C — 2.5D / Parallax

Karakteristik:

- layered depth,
- foreground/background separation,
- scroll-linked parallax,
- simulated camera movement,
- perspective transforms,
- richer premium feel without requiring full 3D for the whole site.

Contoh Sunda:

- layered traditional gate,
- floating foliage,
- foreground ornament moving at different depth,
- camera-like entrance into the wedding scene.

### Level D — Immersive 3D

Karakteristik:

- WebGL/Three.js or equivalent,
- actual 3D scene or object,
- interactive/cinematic camera,
- must gracefully transition into the normal invitation experience,
- reserved for devices capable of running the experience safely.

Contoh:

- 3D traditional gate entrance,
- 3D garden walkthrough,
- 3D ballroom/pelaminan intro,
- interactive cultural centerpiece.

## 4. Progressive Enhancement Rule

**3D is an enhancement, not a dependency for accessing wedding information.**

Semua informasi penting harus tetap tersedia jika:

- WebGL unavailable,
- low-end device detected,
- `prefers-reduced-motion` enabled,
- asset fails to load,
- user skips intro,
- browser blocks advanced capability.

Recommended flow:

```text
Open invitation
      │
      ▼
Capability / preference check
      │
 ┌────┴───────────────┐
 │                    │
High capability     Fallback
 │                    │
 ▼                    ▼
3D / 2.5D intro    Static/motion cover
 │                    │
 └─────────┬──────────┘
           ▼
    Core invitation content
```

A guest must never be unable to see event details just because a 3D experience fails.

## 5. Template Families

Templates should be organized into **families**, not just flat numbered variants.

Example:

```text
Sunda
├── Floral Priangan
├── Royal Sunda
├── Modern Priangan
├── Rustic Bamboo
├── Garden Sunda
└── Immersive Sunda

Jawa
├── Keraton Classic
├── Batik Editorial
├── Royal Java
├── Modern Java
└── Immersive Pendopo

Modern
├── Editorial
├── Minimal
├── Photography
├── Cinematic
└── Luxury
```

Family/category taxonomy must remain extensible.

## 6. Anti-Duplicate Design Rule

A new sellable template should not exist only because of:

- different primary color,
- different font,
- different background image,
- minor ornament replacement,
- trivial section reorder.

Those differences should preferably be handled as **theme variants/configuration**, not marketed as completely separate templates.

A distinct template should meaningfully change at least several dimensions such as:

- opening experience,
- page composition,
- section layout,
- visual language,
- motion language,
- image treatment,
- cultural expression,
- navigation/interaction,
- depth/immersive behavior.

### Example

Bad catalog expansion:

```text
Sunda 001 Pink
Sunda 002 Blue
Sunda 003 Green
```

Better:

```text
Sunda Floral Priangan
Sunda Royal
Sunda Modern Editorial
Sunda Rustic Bamboo
Sunda Immersive Gate
```

Each may still support multiple color/theme variants internally.

## 7. Template Metadata Extension

Template definition should eventually expose experience metadata.

```ts
export type TemplateExperienceLevel =
  | "standard-2d"
  | "motion-2d"
  | "2.5d"
  | "immersive-3d";

export type TemplateDefinition = {
  id: string;
  name: string;
  family: string;
  category: string;
  version: number;
  tags: string[];
  experienceLevel: TemplateExperienceLevel;
  supportedSections: SectionId[];
  requiredSections?: SectionId[];
  thumbnail: string;
  demoUrl?: string;
  status: "draft" | "active" | "archived";
  render: React.ComponentType<TemplateRenderProps>;
  performanceProfile: "light" | "balanced" | "heavy";
};
```

Future metadata can include:

- `supportsWebGL`,
- `hasFallbackExperience`,
- `estimatedAssetWeight`,
- `minDeviceProfile`,
- `themeVariants`,
- `commercialTier`.

## 8. Feature Capability vs Visual Template

Visual template and package capabilities are related but not identical.

Example:

```text
Template: Sunda Royal 2.5D
Package: Basic
```

may disable certain product features if package entitlement does not include them.

Conversely:

```text
Template: Modern Minimal 2D
Package: Premium
```

can still provide premium business features such as:

- larger gallery quota,
- digital gift,
- wishes,
- guest personalization,
- analytics,
- more revisions.

Therefore:

```text
Final Experience = Template Capability ∩ Package Capability ∩ Wedding Configuration
```

Do not hard-code all commercial tiers into template visual components.

## 9. Performance Policy

Mobile-first remains mandatory for every level.

### Standard/Motion templates

Goals:

- minimal blocking JS,
- optimized responsive images,
- lazy-load non-critical sections,
- avoid unnecessary animation libraries per template.

### 2.5D templates

Additional rules:

- layered assets optimized as WebP/AVIF where appropriate,
- avoid excessive simultaneous animated layers,
- pause offscreen animation,
- honor reduced-motion preference.

### Immersive 3D templates

Additional rules:

- lazy-load 3D runtime only for templates that need it,
- do not ship Three.js/WebGL payload to normal 2D templates,
- compress models/textures,
- use adaptive quality,
- support skip intro,
- provide non-WebGL fallback,
- dispose scene resources after intro where practical,
- invitation content must remain usable independently from the 3D scene.

No global dependency should force every invitation to download 3D libraries.

## 10. Asset Separation

Wedding/customer assets remain separate from template assets.

```text
Wedding assets
weddings/{weddingId}/...

Template assets
/templates/{templateId}/...
```

For 3D templates:

```text
/templates/{templateId}/models/
/templates/{templateId}/textures/
/templates/{templateId}/audio/
```

Commercial rights for all template assets must be verified before sale.

## 11. Shared Blocks, Custom Presentation

Reusable business blocks include:

- RSVP,
- wishes,
- guest greeting,
- countdown logic,
- gift/account logic,
- maps action,
- music control.

A template may:

- wrap them,
- change layout,
- change typography,
- animate them,
- place them inside a themed scene,

but should not create a separate unsafe data/API implementation.

Example:

```text
Shared RSVP Logic
       │
 ┌─────┼─────────────────┐
 ▼     ▼                 ▼
Sunda card        Modern sheet       3D themed panel
```

## 12. Catalog UX

Customers should be able to filter templates by attributes such as:

- family/culture,
- style,
- experience level,
- commercial tier,
- color/theme variant,
- feature compatibility.

Example filter:

```text
Adat: Sunda
Experience: 2.5D
Style: Luxury
```

This gives the catalog meaningful discovery instead of presenting hundreds of near-identical thumbnails.

## 13. Initial Product Direction

The first reference family should prove that the engine supports meaningful diversity.

Recommended early set:

1. one lightweight 2D reference template,
2. one Motion 2D template,
3. one Sunda 2.5D premium template,
4. later one experimental Immersive 3D template.

This is not a fixed catalog target. It is a validation sequence for the engine.

## 14. Acceptance Criteria for Template Architecture

Before template production scales:

- [ ] one wedding data fixture renders correctly in multiple visibly different templates,
- [ ] changing template does not duplicate wedding content,
- [ ] RSVP/guest/wishes logic remains shared,
- [ ] template family and experience level exist in metadata,
- [ ] 3D runtime is not loaded for 2D templates,
- [ ] immersive templates provide fallback/skip path,
- [ ] reduced-motion preference is respected,
- [ ] template catalog can distinguish family/style/experience level,
- [ ] theme variants are not falsely counted as distinct templates,
- [ ] adding a template does not modify core business/domain logic.

## 15. Product Decision Summary

1. Core platform and wedding data are shared.
2. Invitation visual experiences are intentionally not uniform.
3. Templates may range from lightweight 2D to true immersive 3D.
4. Full 3D is optional and progressive-enhancement based.
5. Mobile usability has priority over visual complexity.
6. Template families organize meaningful design diversity.
7. Color/font-only variants should be theme variants, not fake new templates.
8. Business logic remains shared even when visual composition changes dramatically.
9. Package capability and template capability are resolved independently.
10. The catalog has no artificial maximum template count.
