# Commerce Foundation Documentation

Dokumentasi resmi untuk transformasi `attimo-studios` menjadi platform bisnis undangan digital.

## Document Order

Baca dalam urutan berikut:

1. **`PRD_V1.md`**  
   Product requirements, business flow, modules, launch criteria, and roadmap.

2. **`TECHNICAL_ARCHITECTURE_V1.md`**  
   Target system architecture, domain model, security, template engine, routing, and migration phases.

3. **`TEMPLATE_EXPERIENCE_STRATEGY.md`**  
   Defines how one shared platform/core can produce substantially different invitation experiences across 2D, motion 2D, 2.5D/parallax, and immersive 3D templates.

4. **`ADR_001_TEMPLATE_EXPERIENCE_MODEL.md`**  
   Accepted architecture decision: **shared semantic core, independent visual experience**.

## Current Product Decisions

- One platform manages many weddings.
- V1 is admin-managed; customers do not need an editor account.
- Wedding data is separated from visual template implementation.
- Template catalog has no artificial numeric cap.
- Templates are not required to look structurally identical.
- Template families may contain meaningfully different visual experiences.
- Supported experience levels:
  - Standard 2D
  - Motion 2D
  - 2.5D / Parallax
  - Immersive 3D
- 3D is progressive enhancement, never a requirement to access wedding information.
- Mobile-first performance remains mandatory.
- Color/font-only changes should be theme variants, not fake additional templates.
- RSVP, guest, wishes, security, and publishing logic remain shared across templates.
- Package capability and template capability are resolved independently.
- Upstream commercial license status remains a launch blocker until resolved.

## Documentation Status

| Document | Status |
|---|---|
| PRD V1 | Baseline / evolving |
| Technical Architecture V1 | Baseline / evolving |
| Template Experience Strategy | Approved direction |
| ADR-001 Template Experience Model | Accepted |

## Change Rule

Before implementation changes alter any of these product/architecture decisions, update the relevant documentation or add a new ADR first.
