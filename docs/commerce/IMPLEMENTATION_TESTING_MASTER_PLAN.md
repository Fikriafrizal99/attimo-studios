# ENDRIYA — Implementation & Testing Master Plan

**Status:** ACTIVE PROJECT REFERENCE  
**Branch:** `develop/commerce-foundation`  
**Decision date:** 2026-09-07  
**Last roadmap update:** Phase 5 completed; Phase 6 is next.  
**Purpose:** authoritative reference for implementation order, phase status, deferred testing, and launch gates.

---

## 1. Project Decision

ENDRIYA uses the following delivery strategy:

> **Complete the main implementation phases first while keeping repository-level verification green. Full deployment, cross-module integration testing, real-domain testing, real-device QA, and end-to-end business acceptance are consolidated into Phase 9.**

This avoids repeatedly switching between development and production-environment work after every feature.

Testing is **not** deferred completely. Every implementation phase must still keep the relevant engineering gates green:

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
| Phase 6 | Commercial/Admin Workflow | **NEXT — PLANNED** |
| Phase 7 | Template Catalog Scaling | `PLANNED` |
| Phase 8 | Production Hardening | `PLANNED` |
| Phase 9 | Full Integration & End-to-End Acceptance Testing | `PLANNED` |
| Phase 10 | Launch Readiness & Release Gate | `PLANNED` |

If scope or sequencing materially changes, update this document before implementation.

---

# Phase 1 — Foundation & Security

## Objective

Establish a reproducible database/auth foundation with explicit tenant boundaries.

## Status

`IMPLEMENTED / TECHNICALLY VERIFIED`

Key outcomes include Better Auth integration, RLS strategy, private authorization helpers, wedding ownership, database integrity, storage boundary foundations, and CI/database-smoke coverage.

---

# Phase 2 — Multi-Wedding Operations Foundation

## Objective

Allow authenticated operators to safely manage multiple wedding projects and collaborators.

## Status

`IMPLEMENTED / TECHNICALLY VERIFIED`

Key outcomes include owner/collaborator roles, tenant-scoped project access, collaborator invitations, owner-only settings boundaries, and database verification.

---

# Phase 3 — Wedding Engine

## Objective

Provide one canonical wedding product engine shared by all visual templates.

## Implemented Scope

- canonical wedding content contract,
- server validation schema,
- template registry,
- reference production renderer,
- timezone-safe countdown,
- gallery engine,
- wedding-scoped storage isolation,
- digital gift / bank / QRIS,
- maps/location engine,
- guest management,
- personalized guest URLs,
- centralized publish readiness validator.

## Status

`IMPLEMENTED`

Reference: `PHASE3_WEDDING_ENGINE.md`.

---

# Phase 4 — Public Delivery & Publishing

## Objective

Turn the wedding engine into a stable released-invitation delivery surface.

## Implemented Scope

- shared released-wedding resolver,
- released-only public access,
- wedding-scoped guest-token resolution,
- canonical path routing,
- optional subdomain routing,
- reverse-proxy host support,
- canonical/OG/social metadata,
- guest tokens excluded from canonical URLs,
- unpublish lifecycle,
- released-wedding mutation lock,
- path/subdomain routing verifier.

## Status

`IMPLEMENTED — DEPLOYMENT VERIFICATION PENDING`

Deferred to Phase 9:

- final `.env.production`,
- real deployment,
- HTTPS/domain,
- path-mode public smoke,
- wildcard DNS/TLS and subdomain verification,
- real social preview,
- mobile/device QA.

Reference: `PHASE4_PUBLIC_DELIVERY.md`.

---

# Phase 5 — Commerce Operations

## Objective

Turn ENDRIYA into an admin-managed wedding-invitation business operation, not only a wedding editor.

## Implemented Scope

### Customers

- owner-scoped customer records,
- name,
- WhatsApp/phone,
- optional email,
- notes,
- timestamps,
- CRUD API and dashboard,
- search and order count.

### Orders

- owner-scoped order records,
- customer relationship,
- optional owned-wedding relationship,
- package,
- template,
- price/currency,
- payment status,
- production status,
- revision count,
- notes/timestamps,
- CRUD API and dashboard,
- filters and summary cards.

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

### Relationship Integrity

Database safeguards require:

- customer and order to belong to the same operator,
- linked wedding to be owned by the same operator,
- collaborators cannot attach another owner's wedding to commerce records,
- one wedding can be linked to at most one order in the current managed-service model.

### RSVP Analytics

Owner-only per-wedding analytics now include:

- active invitation count,
- RSVP responses,
- attending,
- not attending,
- maybe,
- expected guest count,
- pending personalized responses,
- response rate in the dashboard.

### Wishes Moderation

Owner-only moderation supports:

- list per wedding,
- visible / hidden / spam states,
- show/restore,
- hide,
- mark spam,
- delete.

The public wishes API continues to expose only `visible` wishes for released weddings.

## Repository Verification

Phase 5 completion passed:

```text
Service-role boundary       PASS
Phase 3 verification chain  PASS
Phase 4 routing verifier    PASS
Phase 5 contract verifier   PASS
Production Next.js build    PASS
Canonical migration chain   PASS
Phase 5 DB tenant verifier  PASS
Database smoke              PASS
Docker image build          PASS
Container health smoke      PASS
```

## Status

`IMPLEMENTED`

Production migration application and full business-journey verification remain deferred to Phase 9 by project decision.

Reference: `PHASE5_COMMERCE_OPERATIONS.md`.

---

# Phase 6 — Commercial/Admin Workflow

## Objective

Connect the existing modules into a fast, understandable daily workflow for the ENDRIYA operator.

## Planned Scope

### 6.1 Admin Overview

Create a commerce-oriented overview containing useful operational indicators, for example:

- active orders,
- unpaid / partial payments,
- orders waiting for customer data,
- work in progress,
- preview/revision/approval queue,
- published/completed orders,
- upcoming wedding projects where useful.

### 6.2 Order Pipeline

Provide an operational pipeline across production states:

```text
new
→ waiting_data
→ in_progress
→ preview_ready
→ revision
→ approved
→ published
→ completed
```

`cancelled` remains a terminal exception path.

The workflow must remain explicit rather than silently changing states from unrelated UI actions.

### 6.3 Customer → Order → Wedding Navigation

Operators must be able to move quickly between:

```text
Customer
   ↓
Order
   ↓
Wedding Project
   ↓
Preview / Guests / RSVP / Wishes / Settings
```

Avoid duplicated business records and avoid forcing operators to manually copy IDs.

### 6.4 Revision / Approval Workflow

Improve operational handling of:

- revision count,
- preview-ready state,
- revision state,
- approved state,
- clear next actions.

### 6.5 Publish Readiness in Commerce Workflow

Order/wedding workflow should surface publish readiness without bypassing the existing Phase 3/4 readiness gate.

The order module must **not** implement a second conflicting publish validator.

### 6.6 Payment Visibility

Payment status should be visible where an operator decides whether to proceed, publish, or complete an order.

Payment automation is still optional; the source of truth remains the Phase 5 operational payment status.

### 6.7 Operational Search / Filter / Sort

Improve operational lists where useful:

- search,
- status filters,
- payment filters,
- sorting,
- useful empty states,
- loading/error feedback.

### 6.8 Activity / Audit Baseline

Add an operator-action/activity history only where it materially improves operational traceability. Do not build a complex enterprise audit system unless justified.

## Phase 6 Acceptance

Before leaving Phase 6:

- operator can understand current workload from dashboard,
- order pipeline is practical to operate,
- customer/order/wedding navigation is direct,
- revision/approval state is clear,
- payment and readiness information are visible in context,
- no workflow bypasses existing tenant/security/publish rules,
- repository CI remains green.

**Full deployed user-journey testing remains Phase 9.**

---

# Phase 7 — Template Catalog Scaling

## Objective

Prove that the template engine can scale without changing core wedding logic.

## Planned Scope

- multiple production-quality active templates,
- more than one visual/category family,
- complete metadata,
- thumbnails/demo previews,
- categories/tags,
- lifecycle (`draft`, `active`, `archived`),
- compatibility verification,
- mobile performance expectations,
- reduced-motion fallback,
- repeatable template-authoring checklist.

## Architecture Rule

Adding a template must not require changes to:

- wedding DB schema,
- guest logic,
- RSVP logic,
- wishes logic,
- public invitation resolver,
- core routing.

There is no artificial platform template-count cap.

---

# Phase 8 — Production Hardening

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

## 9.1 Environment Preparation

Prepare/reconcile:

- final environment/secrets,
- Supabase migration history and final schema,
- Better Auth production settings,
- Docker deployment,
- HTTPS/domain,
- path routing first,
- optional wildcard DNS/TLS after path baseline passes.

Secrets must never be committed to Git.

## 9.2 Primary Business Journey

Test one complete managed-service journey:

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

## 9.3 Required Acceptance Families

### Publish lifecycle

```text
Draft → not public
Release → public
Released mutation → blocked
Unpublish → not public
Edit draft → allowed
Re-release → readiness re-evaluated
```

### Personalized guest

Verify valid/invalid/inactive/rotated tokens, wedding isolation, quota context, and canonical metadata without guest token.

### RSVP

Verify attendance options, quota enforcement, repeat behavior, analytics totals, wedding scope, failure states, and rate limiting.

### Wishes

Verify submission, wedding scope, moderation, hide/unhide/delete, public visible-only behavior, and spam/rate-limit baseline.

### Cross-tenant security

Use at least two isolated tenants/weddings and verify no leakage or unauthorized mutation across:

- weddings,
- customers,
- orders,
- guests,
- RSVP,
- wishes,
- assets,
- owner-only actions.

Target cross-tenant incidents: **0**.

### Assets

Verify file type/size/signature, wedding namespace, replacement/deletion behavior, and released-media loading.

### URL/domain

Verify path mode first, then optional subdomain mode, canonical redirects, reserved slugs, forwarded host, wildcard DNS/TLS, and absence of localhost hard-coding.

### SEO/social

Verify title, description, canonical URL, OG metadata, guest-token exclusion, and no draft indexing.

### Device/browser

At minimum:

- Android Chrome,
- iPhone Safari where available,
- desktop Chrome/Edge,
- common mobile viewports,
- slower network simulation,
- reduced-motion mode.

### Negative scenarios

Include nonexistent/draft slug, inactive template, duplicate/reserved slug, invalid/inactive guest, over-quota RSVP, malformed message, oversized/unsupported upload, unauthorized API/dashboard access, collaborator owner-action attempt, and released-wedding direct mutation.

## 9.4 Evidence

Keep appropriate evidence:

- acceptance checklist,
- screenshots for important flows,
- CI/commit SHA,
- migration verifier results,
- browser/device notes,
- defects and resolution commits.

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
- [ ] tenant isolation passes,
- [ ] customer/order isolation passes,
- [ ] RSVP/wishes behavior passes,
- [ ] mobile/device QA passes,
- [ ] backup/rollback documented.

## Operational Gate

- [ ] operator account ready,
- [ ] customer intake workflow ready,
- [ ] order workflow understood,
- [ ] payment tracking process ready,
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
Phase 6  ▶ NEXT
Phase 7  ⏳
Phase 8  ⏳
Phase 9  ⏳ full integration/E2E
Phase 10 ⏳ launch gate
```

**Next implementation reference: Phase 6 — Commercial/Admin Workflow.**
