# ENDRIYA — Implementation & Testing Master Plan

**Status:** ACTIVE PROJECT REFERENCE  
**Branch:** `develop/commerce-foundation`  
**Decision date:** 2026-09-07  
**Purpose:** menjadi acuan urutan implementasi, definisi status fase, dan strategi pengujian sampai launch.

---

## 1. Project Decision

ENDRIYA akan menggunakan strategi berikut:

> **Selesaikan seluruh fase implementasi utama terlebih dahulu, sambil tetap menjaga CI/unit/database smoke test tetap hijau. Deployment penuh, integration testing lintas modul, real-domain test, real-device QA, dan end-to-end business acceptance dikumpulkan menjadi satu fase testing khusus setelah implementasi produk utama selesai.**

Keputusan ini dibuat supaya pekerjaan tidak bolak-balik antara development, deployment, dan konfigurasi server setiap selesai satu fitur.

Ini **bukan berarti testing ditunda seluruhnya**.

Selama implementasi setiap fase, hal berikut tetap wajib:

- production build harus lulus,
- TypeScript harus lulus,
- security boundary check harus lulus,
- database migration/smoke test harus lulus,
- phase-specific verification script harus lulus bila tersedia,
- Docker image harus tetap dapat dibangun,
- container health smoke tetap dijaga.

Yang sengaja ditunda ke fase testing akhir adalah pengujian yang membutuhkan environment produk secara utuh, domain nyata, browser/device nyata, dan alur bisnis lintas modul.

---

## 2. Status Vocabulary

Agar tidak ada kebingungan antara "sudah dibuat" dan "sudah benar-benar terbukti di production", seluruh fase menggunakan status berikut.

### `PLANNED`
Scope sudah disepakati tetapi implementasi belum dimulai.

### `IN PROGRESS`
Implementasi sedang dikerjakan.

### `IMPLEMENTED`
Kode utama sudah selesai dan repository-level verification yang relevan sudah lulus.

Status ini **tidak otomatis berarti production verified**.

### `DEPLOYMENT VERIFICATION PENDING`
Kode sudah implemented tetapi masih membutuhkan pengujian di environment nyata seperti domain, HTTPS, server, Supabase production, browser, atau device.

### `VERIFIED`
Integration/E2E test yang relevan sudah dijalankan di environment target dan hasilnya memenuhi acceptance criteria.

### `BLOCKED`
Tidak boleh dianggap launch-ready karena ada dependency eksternal atau masalah yang belum selesai.

---

## 3. Master Phase Roadmap

| Phase | Scope | Current Direction |
|---|---|---|
| Phase 1 | Foundation, database integrity, auth/security baseline, tenant boundary | Implemented / technically verified |
| Phase 2 | Multi-wedding operational foundation, ownership/collaboration and tenant-safe management | Implemented / technically verified |
| Phase 3 | Wedding Engine | Implemented |
| Phase 4 | Public Delivery & Publishing | Implemented; deployment verification deferred |
| Phase 5 | Orders, Customers, Payment Status, RSVP Analytics, Wishes Moderation | Next implementation phase |
| Phase 6 | Commercial/Admin Workflow | Planned |
| Phase 7 | Template Catalog Scaling | Planned |
| Phase 8 | Production Hardening | Planned |
| Phase 9 | Full Integration & End-to-End Acceptance Testing | Planned after implementation phases |
| Phase 10 | Launch Readiness & Release Gate | Planned |

Phase numbering after Phase 4 is the working master roadmap. If scope materially changes, update this document before implementation.

---

# Phase 3 — Wedding Engine

## Objective

Membangun satu canonical wedding engine yang dapat dipakai oleh seluruh template visual tanpa menggandakan business logic.

## Implemented Scope

- canonical wedding content contract,
- server validation schema,
- template registry,
- reference Template 001,
- timezone-safe countdown,
- real gallery engine,
- wedding-scoped storage isolation,
- digital gift/bank/QRIS,
- maps/location engine,
- owner guest management,
- personalized guest URLs,
- centralized publish readiness validator.

## Current Status

`IMPLEMENTED`

Repository-level verification dan migration terkait sudah tersedia. Environment/device acceptance tetap dapat diuji ulang secara menyeluruh pada Phase 9.

Reference: `PHASE3_WEDDING_ENGINE.md`.

---

# Phase 4 — Public Delivery & Publishing

## Objective

Mengubah Wedding Engine menjadi public invitation delivery surface yang memiliki lifecycle publish yang aman dan URL yang stabil.

## Implemented Scope

- shared released-wedding resolver,
- released-only public access,
- wedding-scoped guest token resolution,
- canonical path routing,
- optional subdomain routing,
- reverse-proxy host support,
- canonical metadata,
- Open Graph/social metadata,
- personalized URL tidak menjadi canonical page,
- unpublish lifecycle,
- released wedding mutation lock,
- public URL hanya tersedia untuk released wedding,
- CI verification untuk routing/public URL behavior.

## Repository Verification

Current implementation has passed:

- service-role boundary verification,
- Phase 3 verification chain,
- Phase 4 routing verification,
- production Next.js build,
- database smoke,
- Docker build,
- container health smoke.

## Deferred Environment Verification

Pengujian berikut **sengaja dipindahkan ke Phase 9**:

- real `.env.production` composition,
- actual production/staging deployment,
- HTTPS verification,
- released invitation through real hostname,
- draft/unpublish returning non-public result,
- personalized guest link end-to-end,
- wildcard DNS,
- wildcard TLS,
- `{slug}.domain.id` routing through real proxy/CDN,
- social preview against real public URL,
- mobile/device visual QA.

## Current Status

`IMPLEMENTED — DEPLOYMENT VERIFICATION PENDING`

Ini adalah keputusan proyek, bukan pekerjaan Phase 4 yang terlupakan.

Reference: `PHASE4_PUBLIC_DELIVERY.md`.

---

# Phase 5 — Commerce Operations

## Objective

Membuat platform dapat mengelola customer dan order sebagai bisnis undangan digital, bukan hanya wedding editor.

## Required Scope

### 5.1 Customers

Minimum customer record:

- customer ID,
- name,
- WhatsApp/phone,
- email optional,
- notes,
- created/updated timestamps.

### 5.2 Orders

Minimum order record:

- order ID,
- customer,
- wedding,
- package,
- template,
- price,
- payment status,
- production status,
- revision count,
- notes,
- created/updated timestamps.

Recommended production states:

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

Recommended payment states:

```text
unpaid
partial
paid
refunded
```

### 5.3 Payment Status

V1 requires operational payment tracking first. Automatic payment gateway is not required for initial managed-service flow.

### 5.4 RSVP Analytics

Admin must be able to see per wedding:

- invitation count,
- RSVP responses,
- attending,
- not attending,
- maybe,
- expected guest count,
- pending response.

### 5.5 Wishes Moderation

Admin must be able to:

- view wishes per wedding,
- hide/unhide,
- delete abusive/spam entries,
- ensure public invitation only displays allowed wishes.

## Acceptance Before Leaving Phase 5

- data model/migrations are safe and tenant-aware,
- APIs enforce owner/operator access,
- customer/order/payment relations are consistent,
- RSVP analytics never cross wedding boundaries,
- wishes moderation never crosses wedding boundaries,
- build + DB smoke + relevant verification scripts pass.

**Full user journey deployment testing remains Phase 9.**

---

# Phase 6 — Commercial/Admin Workflow

## Objective

Menyatukan modul menjadi workflow operasional yang nyaman dipakai admin sehari-hari.

## Planned Scope

- admin dashboard overview,
- order pipeline view,
- production status workflow,
- customer-to-order-to-wedding navigation,
- revision tracking,
- preview approval state,
- publish readiness visibility from order workflow,
- payment status visibility,
- operator action history/audit where useful,
- search/filter/sort for operational lists,
- clear empty/error/loading states.

## Principle

V1 remains **admin-managed service**.

Customer self-service editor is not required for launch V1.

---

# Phase 7 — Template Catalog Scaling

## Objective

Membuktikan bahwa template engine benar-benar dapat berkembang tanpa mengubah core wedding logic.

## Planned Scope

- activate multiple production-quality templates,
- at least more than one visual/category family,
- template metadata completeness,
- thumbnail/demo preview,
- categories/tags,
- template lifecycle (`draft`, `active`, `archived`),
- compatibility validation,
- mobile performance rules,
- reduced-motion fallback,
- reusable template authoring checklist.

## Architecture Rule

Adding a new template must not require changes to:

- wedding DB schema,
- guest logic,
- RSVP logic,
- wishes logic,
- public invitation resolver,
- core routing.

The template count has no artificial platform cap.

---

# Phase 8 — Production Hardening

## Objective

Menutup technical and operational risks before full acceptance testing.

## Planned Scope

### Security

- review auth/session settings,
- rate limiting upgrade where required,
- public RSVP/wishes spam controls,
- tenant authorization audit,
- storage mutation audit,
- secret/config review,
- CSP/security headers where appropriate.

### Reliability

- production environment preflight,
- error handling review,
- observability/logging baseline,
- backup/recovery documentation,
- database migration procedure,
- deployment rollback procedure.

### Performance

- image optimization,
- mobile invitation performance,
- template bundle/performance checks,
- heavy animation degradation/fallback,
- basic load/concurrency checks for public forms.

### Product/Legal

- remove remaining upstream branding,
- review bundled assets,
- music rights policy,
- privacy policy,
- terms/basic guest-data notice,
- commercial source-code rights resolved or upstream-derived implementation replaced.

## Important External Blocker

Upstream commercial usage/license status remains a launch blocker until resolved according to `UPSTREAM_LICENSE_STATUS.md`.

---

# Phase 9 — Full Integration & End-to-End Acceptance Testing

## Objective

Menguji ENDRIYA sebagai **satu produk utuh**, bukan sebagai kumpulan fitur terpisah.

No phase may be marked fully production `VERIFIED` merely because its implementation passed repository CI.

## 9.1 Environment Preparation

Create/reconcile the final staging/production-like environment:

- complete environment file/secrets,
- Supabase production schema verification,
- Better Auth config,
- Docker deployment,
- HTTPS,
- domain,
- path routing first,
- optional wildcard DNS/TLS after path-mode baseline passes.

Secrets must never be committed to Git.

## 9.2 Primary Business Journey

Test one complete order from start to finish:

```text
Customer inquiry
   ↓
Customer record
   ↓
Order created
   ↓
Package + price + payment status
   ↓
Wedding project created
   ↓
Template selected
   ↓
Wedding content entered
   ↓
Assets uploaded
   ↓
Guest list created/imported
   ↓
Preview generated
   ↓
Revision / approval
   ↓
Publish readiness passes
   ↓
Wedding released
   ↓
Public invitation URL
   ↓
Personalized guest URL
   ↓
Guest opens invitation
   ↓
RSVP submitted
   ↓
Wish submitted
   ↓
Admin sees RSVP analytics
   ↓
Admin moderates wishes
   ↓
Order completed
```

## 9.3 Publish Lifecycle Test

Required sequence:

```text
Draft → public URL must not expose wedding
Release → public URL works
Released → direct content/settings mutation must be blocked
Unpublish → public URL no longer resolves
Edit draft → allowed
Release again → readiness gate runs again
```

## 9.4 Personalized Guest Test

Verify:

- valid guest token resolves correct name/quota,
- invalid token does not expose another guest,
- token from Wedding A never resolves in Wedding B,
- rotated token invalidates previous personalized URL,
- inactive guest is not personalized,
- canonical metadata excludes guest token.

## 9.5 RSVP Test

Verify:

- guest attendance values,
- guest quota enforcement,
- wedding scope,
- duplicate/repeat behavior according to product rule,
- analytics totals,
- public form failure states,
- rate-limit/spam baseline.

## 9.6 Wishes Test

Verify:

- submission,
- wedding scope,
- moderation,
- hide/unhide,
- delete,
- only allowed wishes render publicly,
- rate-limit/spam behavior.

## 9.7 Cross-Tenant Security Test

Create at least two separate weddings/accounts/tenants where applicable and attempt unauthorized access.

Must verify:

- wedding A data cannot be read through wedding B,
- guests do not leak,
- RSVP does not leak,
- wishes do not leak,
- assets cannot be mutated across wedding scope,
- collaborator cannot use owner-only actions,
- public endpoints cannot enumerate all weddings by omitting an identifier.

**Target cross-tenant incident count: 0.**

## 9.8 Asset Test

Verify:

- allowed image types work,
- unsupported file type rejected,
- >5 MB image rejected,
- file signature validation,
- asset namespace uses correct wedding ID,
- replaced/deleted asset behavior,
- public released media loads without admin authentication.

## 9.9 URL / Domain Test

Path mode first:

```text
https://domain.id/invite/{slug}
```

Then, if subdomain mode is enabled:

```text
https://{slug}.domain.id/
```

Verify:

- canonical redirect,
- reserved slugs,
- nested subdomain rejection,
- `x-forwarded-host` behavior,
- wildcard certificate,
- wildcard DNS,
- no localhost hard-code,
- guest token preserved only where valid.

## 9.10 SEO / Social Preview Test

Verify on the deployed invitation:

- page title,
- description,
- canonical URL,
- OG image,
- OG title/description,
- no guest token in canonical,
- no draft wedding indexing.

## 9.11 Device & Browser QA

Minimum target:

- Android Chrome,
- iPhone Safari where available,
- desktop Chrome/Edge,
- common mobile viewport sizes,
- slow network simulation,
- reduced-motion mode.

Verify:

- opening interaction,
- typography,
- images,
- countdown,
- maps,
- gallery,
- music behavior,
- gift copy actions,
- QRIS display,
- RSVP,
- wishes,
- scroll/performance,
- no horizontal overflow,
- no unusable controls.

## 9.12 Failure / Negative Scenarios

At minimum test:

- nonexistent slug,
- draft slug,
- inactive template,
- reserved slug,
- duplicate slug,
- invalid guest token,
- inactive guest,
- over-quota RSVP,
- malformed public message,
- oversized upload,
- unsupported MIME type,
- unauthorized dashboard/API request,
- collaborator attempting owner-only action,
- released wedding direct mutation attempt,
- unavailable database/storage response where practical.

## 9.13 Acceptance Evidence

Store testing evidence as appropriate:

- test checklist/result document,
- screenshots for major flows,
- CI links/commit SHA,
- migration verifier result,
- browser/device notes,
- discovered defects and resolution commits.

Phase 9 ends only when critical and high-severity defects are resolved or explicitly accepted.

---

# Phase 10 — Launch Readiness

## Objective

Make the final go/no-go decision for real commercial operation.

## Launch Gate

### Technical

- [ ] all required migrations applied,
- [ ] production verification passes,
- [ ] app deploys cleanly,
- [ ] HTTPS/domain stable,
- [ ] E2E primary business journey passes,
- [ ] tenant isolation passes,
- [ ] RSVP/wishes public behavior passes,
- [ ] mobile/device QA passes,
- [ ] backup and rollback procedure documented.

### Operational

- [ ] admin/operator account ready,
- [ ] customer intake workflow ready,
- [ ] order statuses understood,
- [ ] payment tracking process ready,
- [ ] revision/publish SOP ready,
- [ ] support/contact process ready.

### Commercial / Legal

- [ ] upstream commercial-use rights resolved **or upstream-derived code replaced**,
- [ ] branding cleared,
- [ ] bundled asset rights checked,
- [ ] music policy defined,
- [ ] privacy policy available,
- [ ] terms/basic data notice available.

If a launch-blocking item remains unchecked, the product must not be described as commercially launch-ready.

---

## 4. Testing Rule During Phases 5–8

The decision to postpone full E2E testing must never be interpreted as permission to merge broken code.

For every meaningful implementation increment:

```text
Implement
   ↓
Validate input/security boundary
   ↓
Add/update focused verifier where useful
   ↓
Build
   ↓
Database smoke/migration verification if applicable
   ↓
Docker/health smoke remains green
   ↓
Document phase status
   ↓
Continue to next scope
```

If CI is red, fix it before continuing to the next major phase.

---

## 5. Current Project Position

As of this decision:

```text
Phase 1  Foundation / Security              IMPLEMENTED
Phase 2  Multi-tenant Operational Base      IMPLEMENTED
Phase 3  Wedding Engine                     IMPLEMENTED
Phase 4  Public Delivery & Publishing       IMPLEMENTED
                                             Deployment verification deferred to Phase 9
Phase 5  Commerce Operations                NEXT
Phase 6  Commercial/Admin Workflow          PLANNED
Phase 7  Template Catalog Scaling           PLANNED
Phase 8  Production Hardening               PLANNED
Phase 9  Full Integration & E2E Testing      PLANNED
Phase 10 Launch Readiness                   PLANNED
```

The immediate next development target is **Phase 5 — Commerce Operations**.

---

## 6. Change Control

This document is the master sequencing reference.

When a future decision changes:

- phase numbering,
- scope boundaries,
- testing strategy,
- launch gate,
- what is deferred vs required immediately,

update this document first or in the same commit as the implementation change.

Do not silently redefine a phase only in chat or source code.

---

## 7. Related Documents

- `README.md` — documentation index
- `PRD_V1.md` — product requirements
- `TECHNICAL_ARCHITECTURE_V1.md` — architecture baseline
- `P0_IMPLEMENTATION_STATUS.md` — technical foundation status
- `PHASE3_WEDDING_ENGINE.md` — Phase 3 implementation record
- `PHASE4_PUBLIC_DELIVERY.md` — Phase 4 implementation record
- `PRODUCTION_P0_RUNBOOK.md` — production verification baseline
- `SELF_HOST_DOCKER.md` — Docker/self-host runbook
- `UPSTREAM_LICENSE_STATUS.md` — commercial license blocker
