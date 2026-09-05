# Product Requirements Document (PRD) — Undangan Digital Commerce Platform V1

**Status:** Draft / Baseline
**Branch:** `develop/commerce-foundation`
**Version:** 1.1
**Date:** 2026-09-05

## 1. Product Summary

Platform ini mengubah basis project Attimo Studios dari wedding SaaS self-service menjadi **platform operasional penjualan undangan pernikahan digital** dengan model awal **admin-managed service**.

Customer tidak perlu membuat akun atau mengedit undangan sendiri pada V1. Customer memilih template, mengirim data, melakukan pembayaran, lalu admin mengelola konten, preview, revisi, dan publikasi undangan.

Satu aplikasi harus mampu mengelola banyak customer/wedding dan katalog template yang dapat terus bertambah tanpa membuat aplikasi terpisah untuk setiap pasangan.

## 2. Product Vision

Membangun mesin undangan digital yang:

- mudah dioperasikan oleh admin,
- bisa melayani banyak wedding secara paralel,
- aman secara multi-tenant,
- mempunyai template engine yang **extensible tanpa hard cap jumlah template di core system**,
- memungkinkan template baru ditambahkan tanpa mengubah renderer inti,
- mempunyai guest management dan URL tamu terpersonalisasi,
- mendukung RSVP, wishes, galeri, lokasi, countdown, musik, dan amplop digital,
- bisa berkembang menjadi self-service, reseller, white-label, dan marketplace template tanpa rewrite total.

> Jumlah template adalah target pertumbuhan bisnis, bukan batas teknis. Angka seperti 20, 100, atau 500 template hanya boleh dipakai sebagai milestone operasional, bukan asumsi desain sistem.

## 3. Business Model V1

### Core flow

1. Calon customer melihat landing page dan katalog template.
2. Customer memilih template/paket.
3. Customer mengirim data wedding melalui form/order intake.
4. Admin membuat order dan wedding project.
5. Admin mengisi/mengedit konten menggunakan dashboard.
6. Admin mengirim preview ke customer.
7. Customer meminta revisi jika perlu.
8. Setelah final dan pembayaran sesuai aturan, admin publish.
9. Customer menerima URL undangan dan dapat mengirim personalized link ke tamu.
10. Admin memonitor RSVP dan wishes.

### V1 principle

**Admin owns the editor. Customer consumes the result.**

Self-service customer editor bukan kebutuhan launch V1.

## 4. Target Users

### Primary

**Admin / operator**

Orang yang menjalankan bisnis undangan, menerima order, memasukkan data customer, memilih template, mengelola revisi, dan publish.

### Secondary

**Customer / pasangan pengantin**

Memilih produk, menyerahkan data, melihat preview, meminta revisi, dan menggunakan URL final.

### End user

**Tamu undangan**

Membuka personalized invitation, melihat detail acara, navigasi lokasi, mengisi RSVP, mengirim ucapan, dan melihat informasi amplop digital.

## 5. Goals V1

V1 dianggap berhasil jika platform dapat:

- menyimpan dan mengelola banyak wedding secara terpisah,
- membuat wedding baru dari admin dashboard,
- memilih template dari template catalog,
- menggunakan satu content schema untuk banyak template,
- menambahkan template baru melalui kontrak/registry template tanpa mengubah core invitation renderer,
- edit data pasangan, acara, galeri, story, quote, lokasi, musik, gift, dan pengaturan umum,
- upload asset wedding,
- preview sebelum publish,
- publish ke URL publik yang stabil,
- mengelola guest list,
- membuat personalized guest URL,
- mencatat RSVP dan wishes per wedding,
- memoderasi wishes,
- melihat ringkasan RSVP,
- menjaga data antar wedding tidak bocor,
- menyediakan fondasi katalog template yang dapat terus berkembang tanpa batas numerik buatan.

## 6. Non-Goals V1

Tidak wajib pada launch pertama:

- customer self-service editor,
- Canva-like drag-and-drop editor,
- reseller dashboard,
- white-label domain per reseller,
- marketplace designer,
- AI content generation,
- automatic WhatsApp blast,
- live-stream hosting,
- full accounting system,
- native Android/iOS application.

Fitur tersebut harus tetap memungkinkan ditambahkan pada versi berikutnya tanpa merusak arsitektur inti.

## 7. Product Modules

### 7.1 Public Website

Minimum pages:

- Home / landing page
- Template catalog
- Template detail/demo
- Pricing / packages
- Order/contact CTA
- FAQ

### 7.2 Admin Dashboard

Minimum modules:

- Dashboard overview
- Orders
- Customers
- Weddings
- Templates
- Guests
- RSVP
- Wishes
- Assets
- Settings

### 7.3 Order Management

Order minimum fields:

- order ID
- customer name
- phone / WhatsApp
- email optional
- selected package
- selected template
- price
- payment status
- production status
- wedding ID
- revision count
- notes
- created/updated timestamps

Suggested production status:

- `new`
- `waiting_data`
- `in_progress`
- `preview_ready`
- `revision`
- `approved`
- `published`
- `completed`
- `cancelled`

Suggested payment status:

- `unpaid`
- `partial`
- `paid`
- `refunded`

### 7.4 Wedding Project

Each wedding must have:

- unique ID
- owner/admin relationship
- customer relationship
- order relationship
- slug
- status
- selected template ID
- content
- section configuration
- theme overrides
- event date/time
- published timestamp
- expiry/archive status if later needed

### 7.5 Content Editor

Admin editor must support at least:

#### Couple

- bride name
- groom name
- short name
- parent information
- social handle optional
- location/origin optional
- bride photo
- groom photo

#### Hero / opening

- greeting
- couple names
- opening cover image/video
- opening quote
- optional guest-name greeting

#### Events

Multiple events, such as:

- akad
- resepsi
- ngunduh mantu
- additional ceremony

Each event:

- title
- date
- start time
- end time optional
- venue
- address
- Google Maps URL
- optional embed coordinates

#### Story

- multiple timeline entries
- date/year
- title
- description
- photo optional

#### Gallery

- image upload
- ordering
- alt text
- optional video URL later

#### Gift / amplop digital

- intro text
- multiple bank accounts
- bank name
- account number
- account holder
- copy-account action
- QRIS image optional
- gift delivery address optional

#### Music

- optional track
- admin-controlled source
- title / artist metadata
- autoplay preference subject to browser policy

#### Quotes / religious message

- text
- translation optional
- source optional

### 7.6 Section Manager

Admin can:

- enable/disable sections,
- reorder supported sections,
- see template compatibility.

Template may define required sections and optional sections.

### 7.7 Template Catalog

Each template must expose metadata:

- template ID
- name
- category
- culture/style tags
- thumbnail
- preview/demo URL
- supported sections
- status (`draft`, `active`, `archived`)
- version

Initial category examples:

- Sunda
- Jawa
- Minang
- Batak
- Bali
- Islamic
- Modern
- Minimalist
- Floral
- Luxury

The category list itself must also remain extensible.

### 7.8 Guest Management

Each wedding can have guest records:

- guest ID
- display name
- phone optional
- group/family label optional
- max guest quota optional
- RSVP status
- guest token / public key
- personalized URL

Example public URL model:

`https://domain.id/fikri-aluna?to=Pak+Ridwan`

The display name must preferably be derived from a guest record/token instead of trusting arbitrary query text for private fields.

### 7.9 RSVP

Guest can submit:

- attendance: yes / no / maybe
- guest count within quota
- message optional

Admin can see:

- total invitations
- total RSVP responses
- attending
- not attending
- maybe
- total expected guests
- pending response

### 7.10 Wishes

Guest can send:

- name
- message
- location optional

Admin can:

- view per wedding
- hide/unhide
- delete abusive/spam entries

Public invitation only displays approved/visible wishes.

### 7.11 Publish & URL

V1 must support one canonical public URL pattern.

Preferred initial options:

1. path-based: `https://domain.id/fikri-aluna`
2. subdomain-based: `https://fikri-aluna.domain.id`

Recommendation for launch simplicity: implement **path-based routing first**, then enable wildcard subdomain after routing and DNS are proven stable.

The architecture must not hard-code `localhost` or derive production base domains from `window.location.hostname`.

Use explicit environment configuration such as:

- `NEXT_PUBLIC_APP_URL`
- `PUBLIC_INVITATION_BASE_URL`
- `PUBLIC_INVITATION_MODE=path|subdomain`

## 8. Template Engine Requirement

The platform must not import `ClassicTemplate` directly from every invitation route.

Introduce a template registry/manifest with a stable contract:

```ts
export const templateRegistry = {
  "classic-001": Classic001Template,
  "sunda-001": Sunda001Template,
  "modern-001": Modern001Template,
};
```

Renderer behavior:

```text
Wedding.template_id
      ↓
Template Registry / Manifest
      ↓
Resolved Template Component
      ↓
Wedding Content + Section Config + Theme
      ↓
Rendered Invitation
```

### Extensibility rule

Menambah template baru hanya boleh membutuhkan pekerjaan pada layer template, contohnya:

1. buat folder/component template baru,
2. isi metadata/manifest,
3. register template,
4. sediakan thumbnail/demo,
5. jalankan compatibility test.

Tidak boleh membutuhkan perubahan pada wedding database schema, invitation route, RSVP logic, guest logic, atau renderer inti hanya karena jumlah template bertambah.

A missing or inactive template must fail safely to an admin-visible error/fallback, not silently select an unrelated design.

## 9. Security Requirements

Security is a launch blocker.

### Tenant isolation

- Every RSVP belongs to exactly one wedding.
- Every wish belongs to exactly one wedding.
- Every guest belongs to exactly one wedding.
- Every asset path belongs to exactly one wedding.
- Every admin query must verify authorization.

### Public API rules

Public endpoints may only expose data needed to render one released wedding.

Do not provide endpoints where omitting `wedding_id` returns data for all tenants.

### Admin API rules

Admin actions require authenticated session plus permission check.

### Supabase

- production RLS strategy must be explicit,
- service role key remains server-only,
- public anon access must not allow cross-wedding enumeration,
- rate limiting/spam protection required for RSVP and wishes before high-volume launch.

### Input validation

Use schema validation for server mutations. Recommended: Zod or equivalent.

Validate:

- UUIDs
- slugs
- URL fields
- guest count
- lengths of public messages
- file type and size
- enum/status fields

## 10. Asset Requirements

Wedding assets should use Supabase Storage or compatible object storage.

Suggested path convention:

```text
weddings/{weddingId}/hero/
weddings/{weddingId}/couple/
weddings/{weddingId}/gallery/
weddings/{weddingId}/gift/
weddings/{weddingId}/music/
```

Requirements:

- image type validation
- size limit
- image optimization
- delete unused/replaced assets eventually
- unique filename generation

## 11. Commercial/Legal Requirements

Before commercial launch:

- confirm source-code license/permission from upstream,
- replace/remove upstream branding,
- review bundled assets for commercial usage,
- do not ship copyrighted commercial music without appropriate rights,
- publish basic privacy policy and terms for stored guest data.

The current repository README saying “MIT” is not enough if a valid upstream license grant cannot be established.

## 12. Suggested V1 Packages

Pricing is not locked in this PRD, but product architecture should support package-based feature access.

Example capability model:

### Basic

- one template tier
- couple + event
- gallery
- countdown
- map
- guest personalization
- RSVP

### Premium

Everything in Basic plus:

- premium template tier
- wishes
- love story
- music
- digital envelope
- more gallery quota
- revisions/additional options

Package data must be configuration-driven rather than spread across UI conditionals.

## 13. Success Metrics

Operational metrics:

- time from complete customer data to first preview
- number of active wedding projects
- average revisions/order
- publish success rate
- failed upload rate
- RSVP submission success rate
- cross-tenant data incidents: target 0

Business metrics later:

- order conversion rate
- average order value
- template popularity
- repeat/referral rate
- gross margin per order
- active template count and template adoption distribution

## 14. Launch Acceptance Criteria

V1 cannot be considered launch-ready until all P0 items pass.

### P0 — blockers

- [ ] upstream commercial usage status resolved
- [ ] production auth configured
- [ ] multi-tenant isolation verified
- [ ] RSVP/wishes API cannot return all weddings accidentally
- [ ] template registry implemented
- [ ] one production-quality template implemented through registry
- [ ] adding a second template does not require changing core invitation route
- [ ] wedding content editor covers required V1 fields
- [ ] real gallery rendering works
- [ ] event date drives countdown
- [ ] maps link/embed works
- [ ] gift/bank/QRIS data works
- [ ] guest management works
- [ ] personalized invitation URL works
- [ ] preview works
- [ ] publish routing works without localhost hard-code
- [ ] rate limiting/spam baseline implemented

### P1 — commercial readiness

- [ ] order management
- [ ] customer records
- [ ] payment status
- [ ] wishes moderation
- [ ] admin RSVP analytics
- [ ] multiple production templates across more than one category
- [ ] mobile performance validation
- [ ] basic SEO/social metadata per wedding

## 15. Product Roadmap

### V1 — Managed Service

Admin creates, edits, previews, and publishes customer invitations.

### V1.5 — Operational Scale

- payment automation
- standardized order form
- automated reminders
- template analytics
- continuous expansion of template catalog

### V2 — Customer Self-Service

- customer account
- controlled editor
- revision workflow
- billing/subscription or per-event entitlement

### V3 — Template Marketplace / Catalog Scale

- continuously growing template catalog
- designer workflow
- template versioning
- categories/tags/search
- template lifecycle management
- compatibility validation

No fixed maximum number of templates is part of the architecture contract.

### V4 — Reseller / WO / White Label

- organization tenants
- reseller dashboard
- custom branding
- custom domains
- commission/wholesale pricing

## 16. Product Decisions Locked for V1

1. Multi-wedding remains core.
2. Admin-managed editing is the V1 business workflow.
3. Customer login is not required for V1.
4. Content data is separated from visual template implementation.
5. One content schema should power many templates.
6. `template_id` must resolve through a real template registry/manifest.
7. Template count has no artificial hard cap in core architecture.
8. Adding templates must not require modifications to unrelated business/domain logic.
9. Security/tenant isolation precedes feature expansion.
10. Path-based URL is preferred for first production release unless subdomain routing is proven before launch.
11. Main branch remains untouched until the commerce foundation passes review.

## 17. Open Decisions

To be resolved during implementation planning:

- final brand/product name
- final domain
- exact V1 pricing
- Midtrans/Xendit/manual transfer strategy for customer payment
- storage quotas by package
- invitation expiry/archival policy
- whether wishes are pre-moderated or post-moderated
- whether guest URLs use readable query names, opaque tokens, or both
- whether future template marketplace uses code-deployed templates only or supports separately versioned template packages
