# ENDRIYA — Implementation & Testing Master Plan

**Status:** ACTIVE PROJECT REFERENCE  
**Branch:** `develop/commerce-foundation`  
**Decision date:** 2026-09-07  
**Last roadmap update:** Phase 7 completed; Phase 8 is next.  
**Purpose:** authoritative reference for implementation order, phase status, deferred testing, and launch gates.

---

## 1. Project Decision

ENDRIYA uses the following delivery strategy:

> **Complete the main implementation phases first while keeping repository-level verification green. Full deployment, cross-module integration testing, real-domain testing, real-device QA, and end-to-end business acceptance are consolidated into Phase 9.**

Testing is **not** deferred completely. Every implementation phase must keep the relevant engineering gates green:

- production Next.js build,
- TypeScript/build validation,
- service-role/security boundary checks,
- canonical database migration chain,
- database smoke tests,
- tenant/integrity verification,
- phase-specific verification scripts,
- Docker image build,
- container health smoke.

Environment-dependent verification is intentionally deferred to Phase 9 unless a blocking issue requires earlier investigation.

---

## 2. Status Vocabulary

### `PLANNED`
Scope is agreed but implementation has not started.

### `IN PROGRESS`
Implementation is actively being developed.

### `IMPLEMENTED`
Main code is complete and relevant repository-level verification has passed.

`IMPLEMENTED` does **not** mean production verified.

### `DEPLOYMENT VERIFICATION PENDING`
Repository implementation is complete but requires target-environment verification.

### `VERIFIED`
Relevant integration/E2E acceptance has passed in the target environment.

### `BLOCKED`
The phase/product cannot be considered launch-ready because a dependency or issue remains unresolved.

---

## 3. Master Roadmap

| Phase | Scope | Current Status |
|---|---|---|
| Phase 1 | Foundation, database integrity, auth/security baseline, tenant boundary | `IMPLEMENTED / technically verified` |
| Phase 2 | Multi-wedding ownership/collaboration and tenant-safe management | `IMPLEMENTED / technically verified` |
| Phase 3 | Wedding Engine | `IMPLEMENTED` |
| Phase 4 | Public Delivery & Publishing | `IMPLEMENTED — DEPLOYMENT VERIFICATION PENDING` |
| Phase 5 | Customers, Orders, Payment Status, RSVP Analytics, Wishes Moderation | `IMPLEMENTED` |
| Phase 6 | Commercial/Admin Workflow | `IMPLEMENTED` |
| Phase 7 | Template Catalog Scaling | `IMPLEMENTED` |
| Phase 8 | Production Hardening | **NEXT — PLANNED** |
| Phase 9 | Full Integration & End-to-End Acceptance Testing | `PLANNED` |
| Phase 10 | Launch Readiness & Release Gate | `PLANNED` |

If scope or sequencing materially changes, update this document before implementation.

---

# Phase 1 — Foundation & Security

**Status:** `IMPLEMENTED / TECHNICALLY VERIFIED`

Established the reproducible database/auth/security foundation: Better Auth, RLS strategy, private authorization helpers, wedding ownership, integrity guards, storage boundary foundations, and CI/database-smoke coverage.

---

# Phase 2 — Multi-Wedding Operations Foundation

**Status:** `IMPLEMENTED / TECHNICALLY VERIFIED`

Established owner/collaborator roles, tenant-scoped wedding access, collaborator invites, owner-only settings boundaries, and database verification.

---

# Phase 3 — Wedding Engine

**Status:** `IMPLEMENTED`

Implemented:

- canonical wedding content contract,
- server validation,
- template registry,
- reference renderer,
- timezone-safe countdown,
- gallery,
- wedding-scoped storage isolation,
- digital gift/bank/QRIS,
- maps/location,
- guest management,
- personalized guest URLs,
- centralized publish-readiness validator.

Reference: `PHASE3_WEDDING_ENGINE.md`.

---

# Phase 4 — Public Delivery & Publishing

**Status:** `IMPLEMENTED — DEPLOYMENT VERIFICATION PENDING`

Implemented:

- shared released-wedding resolver,
- released-only public access,
- wedding-scoped guest-token resolution,
- path/subdomain routing,
- reverse-proxy host support,
- canonical/OG/social metadata,
- guest-token exclusion from canonical URLs,
- unpublish lifecycle,
- released-wedding mutation lock,
- routing verification.

Deferred to Phase 9:

- final production env,
- real deployment,
- HTTPS/domain,
- wildcard DNS/TLS/subdomain test,
- real social preview,
- mobile/device QA.

Reference: `PHASE4_PUBLIC_DELIVERY.md`.

---

# Phase 5 — Commerce Operations

**Status:** `IMPLEMENTED`

Implemented:

- operator-owner-scoped customers,
- customer CRUD/search/order count,
- operator-owner-scoped orders,
- package/template/price/payment/production/revision tracking,
- manual payment states,
- customer/order/wedding relationship integrity,
- owner-only RSVP analytics,
- owner-only wishes moderation,
- commerce dashboard navigation,
- tenant-aware API and DB verification.

Production statuses:

```text
new
waiting_data
in_progress
preview_ready
revision
approved
published
completed
cancelled
```

Payment statuses:

```text
unpaid
partial
paid
refunded
```

Reference: `PHASE5_COMMERCE_OPERATIONS.md`.

---

# Phase 6 — Commercial/Admin Workflow

**Status:** `IMPLEMENTED`

## Objective

Connect Phase 3–5 modules into a practical daily operator workflow without introducing a second publish validator or autonomous state machine.

## Implemented Scope

### Operations Overview

`/dashboard` now shows:

- active orders,
- payment attention,
- waiting data,
- in-progress/preview/revision/approval queues,
- customer count,
- released wedding count,
- active order queue,
- production pulse,
- wedding projects.

### Order Pipeline

`/dashboard/pipeline` exposes explicit columns:

```text
new
waiting_data
in_progress
preview_ready
revision
approved
published
completed
```

Cancelled orders remain outside the active board.

### Customer → Order → Wedding Navigation

Implemented contextual workspaces:

```text
/dashboard/customers/{customerId}
/dashboard/orders/{orderId}
```

Operators can navigate directly:

```text
Customer ↔ Order ↔ Wedding ↔ Preview / Settings / Wedding Studio
```

### Revision / Approval Controls

Order workspace provides explicit controls for production status, payment status, revision count, and suggested next production states. The helper does not mutate states automatically.

### Publish Readiness Visibility

Order workspace consumes the existing centralized `evaluatePublishReadiness()` result and shows readiness checks in commerce context. No duplicate publish validator was added.

### Operational Attention

Warnings surface mismatches such as unpaid/partial payment, progressing order without wedding, approved order with blocked readiness, order marked published while wedding is draft, or released wedding while order is not published/completed.

### Activity / Audit Baseline

Migration/table:

```text
supabase/migrations/20260907000200_phase6_order_activity.sql
public.order_activity
```

Recorded activity:

```text
created
customer_changed
wedding_changed
payment_status_changed
production_status_changed
revision_count_changed
```

Browser roles receive read-only owner-scoped access. Activity rows are emitted by the database trigger and cannot be fabricated directly by the authenticated browser role.

### Phase 6 Verification

```text
Environment preflight       PASS
Service-role boundary       PASS
Phase 3 verifier chain      PASS
Phase 4 routing verifier    PASS
Phase 5 verifier            PASS
Phase 6 workflow verifier   PASS
Production Next.js build    PASS
Canonical migration chain   PASS
Database smoke              PASS
Docker image build          PASS
Container health smoke      PASS
```

Reference: `PHASE6_ADMIN_WORKFLOW.md`.

---

# Phase 7 — Template Catalog Scaling

**Status:** `IMPLEMENTED`

## Objective

Prove that the template engine can scale to multiple production-quality visual families without changes to core wedding/business logic.

## Implemented Scope

### Multiple Active Production Templates

Seven active production experiences now span Classic, Elegant, Illustrated, Whimsical, Heritage Nusantara, Motion 2D, 2.5D, and WebGL 3D directions:

```text
classic-001
editorial-001
cartoon-001
storybook-001
paper-cut-001
pasundan-001
clay-001
```

`minimal-001` remains draft because its older renderer does not implement the complete canonical section contract.

### Metadata Completeness

Every registry entry exposes stable metadata including ID, name, family, category, tags, version, lifecycle status, visual tier, curated typography, thumbnail, preview path, performance profile, and canonical section contract.

### Catalog Experience

Operator catalog:

```text
/dashboard/templates
```

It supports keyword/tag search, category, visual-tier and lifecycle filters, thumbnail cards, typography/performance visibility, and full internal preview navigation.

Preview route:

```text
/dashboard/templates/{templateId}/preview
```

All previews use one canonical wedding fixture and render through the normal `InvitationRenderer`.

### Compatibility Verification

Every active template implements the complete canonical contract:

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

The final catalog verifier checks every active template against the same canonical preview fixture and verifies that the public invitation route remains template-neutral.

### Mobile / Motion Baseline

Every active template declares rendering mode, motion level, mobile profile, and reduced-motion fallback. 2.5D templates use adaptive layered depth; the 3D Clay experience uses progressive enhancement with DOM fallback.

### Repeatable Template Authoring

Authoring contract:

```text
docs/commerce/TEMPLATE_AUTHORING_GUIDE.md
```

It prohibits changing core wedding/business schemas or routing merely to add a template and documents the required activation/verification sequence.

## Architecture Rule

Adding a template must not require changes to wedding DB schema, customer/order schema, guest logic, RSVP logic, wishes logic, public invitation resolver, core routing, or publish lifecycle.

There is no artificial template-count cap.

## Phase 7 Completion Verification

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

Numeric bundle/performance budgets and deeper performance hardening are intentionally part of Phase 8. Full real-device visual acceptance remains Phase 9.

Reference: `PHASE7_TEMPLATE_CATALOG.md` and `TEMPLATE_AUTHORING_GUIDE.md`.

---

# Phase 8 — Production Hardening

**Status:** `NEXT — PLANNED`

## Objective

Close technical, operational, performance, and legal risks before full acceptance testing.

## Planned Scope

### Security

- auth/session review,
- stronger/shared rate limiting where needed,
- RSVP/wishes spam-control review,
- tenant authorization audit,
- storage mutation audit,
- secret/config review,
- security headers/CSP where appropriate.

### Reliability

- production environment preflight,
- error-handling review,
- observability/logging baseline,
- backup/recovery runbook,
- canonical migration procedure,
- deployment rollback procedure.

### Performance

- image optimization,
- mobile invitation performance,
- template bundle/performance checks,
- animation degradation/fallback,
- basic public-form concurrency/load checks.

### Product / Legal

- remove remaining upstream branding,
- review bundled asset rights,
- music-rights policy,
- privacy policy,
- terms/basic guest-data notice,
- resolve commercial source-code rights or replace upstream-derived implementation.

## External Launch Blocker

Upstream commercial-use/license status remains a launch blocker until resolved according to `UPSTREAM_LICENSE_STATUS.md`.

---

# Phase 9 — Full Integration & End-to-End Acceptance Testing

## Objective

Verify ENDRIYA as one complete product in a staging/production-like environment.

Repository `IMPLEMENTED` status alone is insufficient for production `VERIFIED` status.

## Environment Preparation

Prepare/reconcile:

- final environment/secrets,
- Supabase migration history and final schema,
- Better Auth production settings,
- Docker deployment,
- HTTPS/domain,
- path routing first,
- optional wildcard DNS/TLS after path baseline passes.

## Primary Business Journey

```text
Customer inquiry
→ Customer record
→ Order
→ Package / price / payment
→ Wedding project
→ Template
→ Content
→ Assets
→ Guests
→ Preview
→ Revision / approval
→ Publish readiness
→ Release
→ Public invitation
→ Personalized guest URL
→ RSVP
→ Wish
→ RSVP analytics
→ Wishes moderation
→ Order completed
```

## Required Acceptance Families

Test:

- publish/unpublish/re-release lifecycle,
- personalized guest tokens and rotation,
- RSVP quota/scope/analytics,
- wishes moderation/public visibility,
- cross-tenant customer/order/wedding/guest/RSVP/wishes/assets security,
- asset type/size/signature/namespace,
- path then optional subdomain routing,
- SEO/social metadata,
- Android/iPhone/desktop browsers,
- reduced-motion/slow-network/mobile layout,
- negative and unauthorized scenarios.

Target cross-tenant incidents: **0**.

## Evidence

Keep acceptance checklist, screenshots, CI/commit SHAs, migration verifier results, device notes, defects, and resolution commits.

Phase 9 ends only when critical/high-severity defects are fixed or explicitly accepted.

---

# Phase 10 — Launch Readiness

## Objective

Make the final commercial go/no-go decision.

## Technical Gate

- [ ] final migrations applied and reconciled,
- [ ] production verification passes,
- [ ] clean deployment,
- [ ] HTTPS/domain stable,
- [ ] primary E2E journey passes,
- [ ] tenant/customer/order isolation passes,
- [ ] RSVP/wishes behavior passes,
- [ ] mobile/device QA passes,
- [ ] backup/rollback documented.

## Operational Gate

- [ ] operator account ready,
- [ ] customer intake workflow ready,
- [ ] order workflow understood,
- [ ] payment tracking ready,
- [ ] revision/approval/publish SOP ready,
- [ ] support/contact process ready.

## Commercial / Legal Gate

- [ ] upstream commercial-use rights resolved or upstream-derived implementation replaced,
- [ ] bundled assets reviewed,
- [ ] music usage policy ready,
- [ ] privacy/terms/guest-data notice ready.

No commercial launch should be marked ready while the upstream source-code rights blocker remains unresolved.

---

## Current Project Position

```text
Phase 1  ✅
Phase 2  ✅
Phase 3  ✅
Phase 4  ✅ code / ⏳ environment verification deferred
Phase 5  ✅
Phase 6  ✅
Phase 7  ✅
Phase 8  ▶ NEXT
Phase 9  ⏳ full integration/E2E
Phase 10 ⏳ launch gate
```

**Next implementation reference: Phase 8 — Production Hardening.**
