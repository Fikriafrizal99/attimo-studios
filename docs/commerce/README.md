# Commerce Foundation Documentation

Dokumentasi resmi untuk transformasi `attimo-studios` menjadi platform bisnis undangan digital ENDRIYA.

## Authoritative Project Sequencing

**`IMPLEMENTATION_TESTING_MASTER_PLAN.md` adalah acuan utama urutan fase, definisi status, strategi testing, dan launch gate.**

Keputusan aktif proyek:

- selesaikan implementation phases utama terlebih dahulu,
- tetap wajib menjaga CI/build/database/security/Docker smoke hijau pada setiap fase,
- kumpulkan real-domain deployment, cross-module integration test, full E2E, dan device QA pada Phase 9,
- Phase 10 menjadi final launch-readiness gate.

Jika percakapan, catatan lama, atau dokumen fase tampak bertentangan dengan urutan ini, perbarui dokumentasi dan gunakan master plan sebagai sequencing reference terbaru.

## Document Order

Baca dalam urutan berikut:

1. **`IMPLEMENTATION_TESTING_MASTER_PLAN.md`**  
   Master roadmap Phase 1–10, status vocabulary, implementation-vs-verification rule, Phase 9 E2E test matrix, and Phase 10 launch gate.

2. **`PRD_V1.md`**  
   Product requirements, business flow, modules, launch criteria, and product roadmap baseline.

3. **`TECHNICAL_ARCHITECTURE_V1.md`**  
   Target system architecture, domain model, security, template engine, routing, and migration phases.

4. **`TEMPLATE_EXPERIENCE_STRATEGY.md`**  
   How one shared core can produce substantially different 2D, motion 2D, 2.5D/parallax, and immersive 3D invitations.

5. **`ADR_001_TEMPLATE_EXPERIENCE_MODEL.md`**  
   Accepted decision: **shared semantic core, independent visual experience**.

6. **`P0_IMPLEMENTATION_STATUS.md`**  
   Technical foundation/CI/deployment status for launch-blocking P0 requirements.

7. **`PHASE3_WEDDING_ENGINE.md`**  
   Phase 3 canonical Wedding Engine implementation record.

8. **`PHASE4_PUBLIC_DELIVERY.md`**  
   Phase 4 public delivery/publishing implementation record. Repository work is implemented; real-host verification is intentionally deferred to Phase 9.

9. **`PHASE5_COMMERCE_OPERATIONS.md`**  
   Phase 5 customers, orders, payment status, RSVP analytics, wishes moderation, tenant boundaries, API/UI, and verification record.

10. **`PRODUCTION_P0_RUNBOOK.md`**  
   Supabase, Better Auth, tenant-isolation, storage, domain, and device verification baseline.

11. **`SELF_HOST_DOCKER.md`**  
   Self-host deployment on a single Ubuntu/Docker server.

12. **`UPSTREAM_LICENSE_STATUS.md`**  
   Tracks the commercial-use/license blocker inherited from the upstream repository.

## Current Product Decisions

- One platform manages many weddings.
- V1 is admin-managed; customers do not need an editor account.
- Customer/order commercial records are operator-owner scoped.
- A linked order may reference only a wedding owned by that same operator.
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
- Initial hosting uses a self-managed Docker server while PostgreSQL and assets remain on Supabase Cloud.
- Full deployment/E2E acceptance is centralized in Phase 9 after the main implementation phases.
- Upstream commercial license status remains a commercial launch blocker until resolved or upstream-derived implementation is replaced.

## Current Phase Position

```text
Phase 1  Foundation / Security              IMPLEMENTED
Phase 2  Multi-tenant Operational Base      IMPLEMENTED
Phase 3  Wedding Engine                     IMPLEMENTED
Phase 4  Public Delivery & Publishing       IMPLEMENTED
                                             Deployment verification deferred to Phase 9
Phase 5  Commerce Operations                IMPLEMENTED
Phase 6  Commercial/Admin Workflow          NEXT
Phase 7  Template Catalog Scaling           PLANNED
Phase 8  Production Hardening               PLANNED
Phase 9  Full Integration & E2E Testing      PLANNED
Phase 10 Launch Readiness                   PLANNED
```

## Technical Verification Rule

Deferring full E2E does **not** mean deferring engineering quality checks.

During Phases 6–8, each meaningful implementation must keep the relevant verification chain green:

- environment preflight where applicable,
- service-role/security boundary verification,
- focused phase verifier,
- Next.js production build / TypeScript,
- migration/database smoke for DB changes,
- Docker build,
- container health smoke.

A red CI result must be fixed before moving to the next major phase.

## Documentation Status

| Document | Status |
|---|---|
| Implementation & Testing Master Plan | **Active authoritative sequencing reference** |
| PRD V1 | Baseline / evolving |
| Technical Architecture V1 | Baseline / evolving |
| Template Experience Strategy | Approved direction |
| ADR-001 Template Experience Model | Accepted |
| P0 Implementation Status | Repository/Supabase verified; environment gates tracked separately |
| Phase 3 Wedding Engine | Implemented |
| Phase 4 Public Delivery | Implemented; deployment verification deferred to Phase 9 |
| Phase 5 Commerce Operations | **Implemented; production application deferred to Phase 9** |
| Production P0 Runbook | Ready for Phase 9/production verification work |
| Self-Host Docker Runbook | Ready |
| Upstream License Status | External launch blocker |

## Change Rule

Before implementation changes alter any product/architecture/sequencing decision above, update the relevant documentation or add a new ADR first.

In particular, changes to phase numbering, scope boundaries, testing strategy, deferred environment work, or launch gates must update `IMPLEMENTATION_TESTING_MASTER_PLAN.md` in the same change.
