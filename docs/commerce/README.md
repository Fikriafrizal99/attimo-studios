# Commerce Foundation Documentation

Dokumentasi resmi untuk transformasi `attimo-studios` menjadi platform bisnis undangan digital.

## Document Order

Baca dalam urutan berikut:

1. **`PRD_V1.md`**  
   Product requirements, business flow, modules, launch criteria, and roadmap.

2. **`TECHNICAL_ARCHITECTURE_V1.md`**  
   Target system architecture, domain model, security, template engine, routing, and migration phases.

3. **`TEMPLATE_EXPERIENCE_STRATEGY.md`**  
   How one shared core can produce substantially different 2D, motion 2D, 2.5D/parallax, and immersive 3D invitations.

4. **`ADR_001_TEMPLATE_EXPERIENCE_MODEL.md`**  
   Accepted decision: **shared semantic core, independent visual experience**.

5. **`P0_IMPLEMENTATION_STATUS.md`**  
   Current implementation/CI/deployment status for launch-blocking P0 requirements.

6. **`PRODUCTION_P0_RUNBOOK.md`**  
   Exact Supabase, Better Auth, domain, tenant-isolation, storage, and device verification steps for a real deployment.

7. **`UPSTREAM_LICENSE_STATUS.md`**  
   Tracks the commercial-use/license blocker inherited from the upstream repository.

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
- Color/font-only changes are theme variants, not fake additional templates.
- RSVP, guest, wishes, security, and publishing logic remain shared across templates.
- Package capability and template capability are resolved independently.
- Upstream commercial license status remains a commercial launch blocker until resolved.

## P0 Technical State

Repository-level P0 is verified by `Commerce P0 CI` with two required jobs:

- production Next.js build + TypeScript + environment preflight,
- PostgreSQL database smoke test with bootstrap idempotency, tenant-scope protection, and RSVP guest quota verification.

Real Supabase/auth/domain/device execution is tracked separately in `PRODUCTION_P0_RUNBOOK.md`.

## Documentation Status

| Document | Status |
|---|---|
| PRD V1 | Baseline / evolving |
| Technical Architecture V1 | Baseline / evolving |
| Template Experience Strategy | Approved direction |
| ADR-001 Template Experience Model | Accepted |
| P0 Implementation Status | Verified in repository / production execution pending |
| Production P0 Runbook | Ready |
| Upstream License Status | External blocker |

## Change Rule

Before implementation changes alter any product/architecture decision above, update the relevant documentation or add a new ADR first.
