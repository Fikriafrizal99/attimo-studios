# Technical Architecture V1 — Undangan Digital Commerce Platform

**Status:** Draft / Baseline
**Branch:** `develop/commerce-foundation`
**Version:** 1.0
**Date:** 2026-09-05

## 1. Architecture Objective

Dokumen ini mendefinisikan arsitektur target untuk mengubah fork `attimo-studios` menjadi platform penjualan undangan digital multi-wedding yang aman, scalable, dan mempunyai katalog template yang dapat terus bertambah tanpa hard cap di core system.

Prioritas V1:

1. tenant isolation,
2. admin-managed workflow,
3. extensible template engine,
4. stable public routing,
5. reusable/versioned content schema,
6. incremental migration from existing code,
7. no rewrite requirement when template count grows.

## 2. Architecture Principles

### 2.1 One application, many weddings

Jangan membuat deployment/repository terpisah per customer.

```text
One Application
      │
      ├── Wedding A
      ├── Wedding B
      ├── Wedding C
      └── ...
```

### 2.2 Content and visual design are separate

Wedding data belongs to domain/content model. Template only decides how that data is rendered.

```text
Wedding Content ─────────┐
Section Config ──────────┼──> Template Renderer ──> Invitation
Theme Overrides ─────────┘
```

### 2.3 Template count is not a schema concern

Adding a template must not require:

- database schema changes,
- new RSVP implementation,
- new guest implementation,
- new publish endpoint,
- new wedding table,
- modification of invitation core route.

### 2.4 Security before scale

Every mutable/public tenant dataset must always be scoped to a wedding.

### 2.5 Incremental migration

Existing components can be reused while responsibilities are gradually extracted into domain modules.

## 3. Current Baseline

Useful current foundations:

- Next.js App Router
- React + TypeScript
- Supabase/PostgreSQL
- Better Auth
- `weddings`
- `wedding_collaborators`
- `rsvp`
- `wishes`
- dashboard shell
- content editor baseline
- section configuration
- upload endpoint
- preview route
- invitation components

Known technical debt:

- `template_id` is stored but not used to select renderer,
- public/preview routes directly render `ClassicTemplate`,
- subdomain middleware is disabled,
- domain construction is not production-safe,
- RSVP/wishes can be queried without strict tenant requirement,
- public Supabase policies are too broad,
- gallery does not render actual images correctly,
- map and gift are incomplete,
- countdown has hard-coded fallback data,
- content editor does not cover full V1 content,
- documentation is partially stale.

## 4. Target System Context

```text
                   ┌─────────────────────┐
                   │      Customer       │
                   └─────────┬───────────┘
                             │
                    Browse / Order / View
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                    │
│                                                             │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │ Marketing UI │  │ Admin Console │  │ Public Invite UI│  │
│  └──────────────┘  └───────┬───────┘  └────────┬────────┘  │
│                              │                   │           │
│                      Application Services   Template Engine  │
│                              │                   │           │
└──────────────────────────────┼───────────────────┼───────────┘
                               │                   │
                        ┌──────▼───────┐    ┌─────▼─────┐
                        │ PostgreSQL   │    │  Storage   │
                        │  Supabase    │    │  Supabase  │
                        └──────────────┘    └───────────┘
```

## 5. Recommended Deployment Model

### Application

- one Next.js deployment,
- Vercel or equivalent Node-compatible platform,
- environment-driven production URLs.

### Database

- Supabase PostgreSQL.

### Storage

- Supabase Storage initially,
- abstraction should allow future move to S3-compatible storage if needed.

### Public invitation routing

Recommended rollout:

**Phase A — path-based**

```text
https://domain.id/{weddingSlug}
```

**Phase B — optional wildcard subdomain**

```text
https://{weddingSlug}.domain.id
```

Path-based routing is the preferred V1 production baseline because deployment, cache, preview, SSL, and debugging are simpler.

## 6. Target Application Structure

Target direction, migrated incrementally:

```text
app/
├── (marketing)/
│   ├── templates/
│   ├── pricing/
│   └── order/
│
├── admin/
│   ├── dashboard/
│   ├── orders/
│   ├── customers/
│   ├── weddings/
│   ├── templates/
│   └── settings/
│
├── invite/
│   └── [slug]/
│       └── page.tsx
│
├── preview/
│   └── [id]/
│       └── page.tsx
│
└── api/
    ├── admin/
    └── public/

components/
├── admin/
├── invitation/
│   ├── blocks/
│   └── shared/
└── ui/

features/
├── orders/
├── customers/
├── weddings/
├── guests/
├── rsvp/
├── wishes/
├── templates/
└── publishing/

lib/
├── auth/
├── db/
├── validation/
├── routing/
└── storage/

templates/
├── registry.ts
├── types.ts
├── classic-001/
├── sunda-001/
├── modern-001/
└── ...
```

## 7. Domain Model

### 7.1 Customers

```text
customers
- id UUID PK
- name TEXT NOT NULL
- phone TEXT
- email TEXT nullable
- notes TEXT nullable
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

### 7.2 Orders

```text
orders
- id UUID PK
- customer_id UUID FK
- wedding_id UUID FK nullable
- package_code TEXT
- template_id TEXT
- price_amount NUMERIC
- payment_status TEXT
- production_status TEXT
- revision_count INTEGER
- notes TEXT nullable
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

Suggested production statuses:

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

Suggested payment statuses:

```text
unpaid
partial
paid
refunded
```

### 7.3 Weddings

Extend existing table:

```text
weddings
- id UUID PK
- customer_id UUID nullable FK
- slug TEXT UNIQUE
- status TEXT
- template_id TEXT NOT NULL
- content JSONB NOT NULL
- sections JSONB NOT NULL
- theme JSONB NOT NULL DEFAULT '{}'
- published_at TIMESTAMPTZ nullable
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

Suggested wedding statuses:

```text
draft
preview
released
archived
```

### 7.4 Guests

```text
guests
- id UUID PK
- wedding_id UUID FK NOT NULL
- display_name TEXT NOT NULL
- phone TEXT nullable
- group_name TEXT nullable
- max_guests INTEGER NOT NULL DEFAULT 1
- token TEXT UNIQUE NOT NULL
- is_active BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

Guest token must be random/opaque enough to prevent simple sequential enumeration.

### 7.5 RSVP

Target:

```text
rsvp
- id UUID PK
- wedding_id UUID FK NOT NULL
- guest_id UUID FK nullable
- name TEXT NOT NULL
- attendance TEXT NOT NULL
- guest_count INTEGER NOT NULL
- message TEXT nullable
- submitted_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

Rules:

- `wedding_id` becomes mandatory,
- public submission resolves wedding server-side,
- if guest token exists, validate quota,
- GET all RSVP is admin-only and wedding-scoped.

### 7.6 Wishes

```text
wishes
- id UUID PK
- wedding_id UUID FK NOT NULL
- guest_id UUID FK nullable
- name TEXT NOT NULL
- location TEXT nullable
- message TEXT NOT NULL
- status TEXT NOT NULL DEFAULT 'visible'
- created_at TIMESTAMPTZ
```

Statuses:

```text
visible
hidden
spam
```

## 8. Canonical Wedding Content Schema

Introduce an explicit schema version immediately.

```ts
export interface WeddingContentV1 {
  schemaVersion: 1;
  couple: CoupleContent;
  hero: HeroContent;
  events: EventContent[];
  story: StoryItem[];
  gallery: GalleryItem[];
  gifts: GiftContent;
  music?: MusicContent;
  blessing?: BlessingContent;
  footer?: FooterContent;
}
```

Example semantic structure:

```ts
interface CoupleContent {
  bride: PersonContent;
  groom: PersonContent;
}

interface PersonContent {
  name: string;
  shortName?: string;
  parentInfo?: string;
  origin?: string;
  socialHandle?: string;
  photoUrl?: string;
}

interface EventContent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  venue: string;
  address: string;
  mapsUrl?: string;
  latitude?: number;
  longitude?: number;
}
```

### Rule

Templates consume semantic data.

Avoid template-specific fields such as:

```text
sundaHeroTitle
classicBrideImage
modernGoldAccentText
```

Prefer:

```text
hero.title
couple.bride.photoUrl
theme.accent
```

## 9. Content Normalization and Versioning

Create:

```ts
normalizeWeddingContent(rawContent): WeddingContentV1
```

Responsibilities:

- identify schema version,
- apply safe defaults,
- migrate legacy content shape,
- validate normalized data,
- prevent old published weddings from breaking after content schema evolves.

Future schema updates can add:

```text
V1 -> V2 -> V3
```

without requiring immediate manual migration of every existing wedding.

## 10. Template Engine

### 10.1 Template contract

```ts
export type TemplateRenderProps = {
  weddingId: string;
  content: WeddingContentV1;
  sections: SectionConfig[];
  theme: ThemeConfig;
  guest?: PublicGuestContext;
};

export type TemplateDefinition = {
  id: string;
  name: string;
  version: number;
  category: string;
  tags: string[];
  thumbnail: string;
  status: "draft" | "active" | "archived";
  supportedSections: SectionId[];
  requiredSections?: SectionId[];
  render: React.ComponentType<TemplateRenderProps>;
};
```

### 10.2 Registry

```ts
import { Classic001 } from "./classic-001";
import { Sunda001 } from "./sunda-001";
import { Modern001 } from "./modern-001";

export const TEMPLATE_REGISTRY: Record<string, TemplateDefinition> = {
  "classic-001": {
    id: "classic-001",
    name: "Classic 001",
    version: 1,
    category: "Classic",
    tags: ["classic", "elegant"],
    thumbnail: "/templates/classic-001/thumbnail.webp",
    status: "active",
    supportedSections: ["hero", "couple", "events", "gallery", "rsvp", "wishes", "gift", "music"],
    render: Classic001,
  },
  "sunda-001": {
    id: "sunda-001",
    name: "Sunda 001",
    version: 1,
    category: "Sunda",
    tags: ["sunda", "traditional"],
    thumbnail: "/templates/sunda-001/thumbnail.webp",
    status: "active",
    supportedSections: ["hero", "couple", "events", "story", "gallery", "rsvp", "wishes", "gift", "music"],
    render: Sunda001,
  },
  "modern-001": {
    id: "modern-001",
    name: "Modern 001",
    version: 1,
    category: "Modern",
    tags: ["modern", "minimal"],
    thumbnail: "/templates/modern-001/thumbnail.webp",
    status: "active",
    supportedSections: ["hero", "couple", "events", "gallery", "rsvp", "gift"],
    render: Modern001,
  },
};
```

### 10.3 Resolver

```ts
export function resolveTemplate(templateId: string) {
  const definition = TEMPLATE_REGISTRY[templateId];
  if (!definition || definition.status !== "active") {
    throw new TemplateNotAvailableError(templateId);
  }
  return definition;
}
```

### 10.4 Rendering flow

```text
Request invitation
       │
       ▼
Resolve wedding by slug
       │
       ▼
Normalize Wedding Content
       │
       ▼
Resolve template_id
       │
       ▼
Template Registry
       │
       ▼
Validate supported sections
       │
       ▼
Render Template Component
```

### 10.5 No artificial template cap

Core architecture must not contain logic such as:

```ts
if (templates.length >= 100) ...
```

or fixed database columns per template.

Adding template number 5, 100, 500, or beyond follows the same contract.

Practical limits may eventually come from repository size, bundle strategy, deployment/runtime resources, or marketplace architecture—not from a hard-coded product limit.

### 10.6 Future scaling of the registry

When the catalog becomes large, migrate from eager static imports to controlled lazy loading / grouped manifests.

Example direction:

```text
Template metadata index
       │
       ├── category manifest
       ├── lazy import map
       └── versioned template module
```

A future marketplace may store metadata in PostgreSQL while executable template modules remain deployment-controlled.

This keeps arbitrary uploaded code out of the runtime unless a sandboxed plugin architecture is intentionally designed later.

## 11. Shared Invitation Blocks

Reusable blocks should live outside individual templates where appropriate:

```text
components/invitation/blocks/
├── RSVPForm.tsx
├── WishesForm.tsx
├── GiftAccount.tsx
├── Countdown.tsx
├── MapsButton.tsx
├── MusicControl.tsx
└── GuestGreeting.tsx
```

Template authors may style/wrap them differently but should not reimplement tenant-sensitive business logic.

### Rule

**Business logic shared, visual composition customizable.**

For example:

- RSVP submission API is shared.
- A Sunda template can display RSVP inside a traditional card.
- A Modern template can display the same RSVP logic in a minimal layout.

## 12. Template Compatibility

Each template declares supported sections.

Before preview/publish:

```text
Wedding enabled sections
        │
        ▼
Template supported sections
        │
        ▼
Compatibility validation
```

If incompatible:

- admin sees which section is unsupported,
- publish is blocked only when required/critical compatibility fails,
- do not silently remove critical content without warning.

## 13. Template Versioning

A template ID identifies a design family/variant. Template definition also has a version.

Example:

```text
sunda-001 version 1
sunda-001 version 2
```

For initial V1, current deployed version can render all weddings using the ID.

Before marketplace/reseller scale, consider pinning published weddings to a template version or storing compatibility metadata to prevent visual regressions.

## 14. Public Invitation Service

Create a single server-side loader concept:

```ts
getPublicInvitationBySlug(slug, guestToken?)
```

It returns only public-safe data:

```ts
{
  weddingId,
  slug,
  templateId,
  content,
  sections,
  theme,
  guest
}
```

Requirements:

- wedding must be `released`,
- slug must match exactly,
- no customer/internal notes exposed,
- no admin membership information exposed,
- guest data limited to the guest context needed for the invitation.

## 15. Preview Service

Preview remains authenticated.

```ts
getAdminPreviewWedding(weddingId, userId)
```

Requirements:

- validate session,
- validate access/role,
- allow draft/preview wedding,
- use the exact same template engine as production public rendering.

Critical rule:

**Preview and public invitation must share the renderer.**

Otherwise designs can differ between preview and production.

## 16. Routing

### V1 recommended

```text
/invite/[slug]
```

Optionally expose nicer route:

```text
/[slug]
```

with reserved slug protection.

### Reserved slugs

Centralize them in one module:

```text
admin
api
login
signup
preview
invite
pricing
templates
assets
```

Do not duplicate reserved slug lists across multiple routes/components.

### URL configuration

Use explicit server configuration:

```env
NEXT_PUBLIC_APP_URL=https://admin.domain.id
PUBLIC_INVITATION_BASE_URL=https://domain.id
PUBLIC_INVITATION_MODE=path
```

Provide helper:

```ts
buildInvitationUrl({ slug, guestToken })
```

No component should hand-build production URLs.

## 17. Guest Personalization

Recommended URL:

```text
https://domain.id/fikri-aluna?guest=<opaque-token>
```

The server resolves token to:

```ts
{
  guestId,
  displayName,
  maxGuests
}
```

Readable `?to=Pak+Ridwan` can be supported for display/share convenience, but it should not be authoritative for quota or private guest records.

## 18. API Boundary

Separate APIs conceptually:

```text
/api/admin/*
/api/public/*
```

### Admin examples

```text
POST   /api/admin/weddings
PATCH  /api/admin/weddings/:id
POST   /api/admin/weddings/:id/assets
GET    /api/admin/weddings/:id/rsvp
GET    /api/admin/weddings/:id/wishes
POST   /api/admin/weddings/:id/guests
```

All require authentication and authorization.

### Public examples

```text
POST /api/public/weddings/:slug/rsvp
GET  /api/public/weddings/:slug/wishes
POST /api/public/weddings/:slug/wishes
```

No public endpoint should return all tenants when a scope parameter is missing.

## 19. Validation Layer

Add Zod or equivalent.

Suggested modules:

```text
lib/validation/
├── wedding.ts
├── guest.ts
├── rsvp.ts
├── wishes.ts
├── order.ts
└── asset.ts
```

Validate server-side:

- UUID
- slug
- status enums
- dates
- URL
- guest count
- max message length
- account number strings
- QRIS image URL
- uploaded file MIME and size

Client validation improves UX but does not replace server validation.

## 20. Authorization

Centralize helpers such as:

```ts
requireSession()
requireWeddingAccess(weddingId, userId)
requireWeddingOwner(weddingId, userId)
```

Avoid copying authorization queries into every route.

Future roles can become:

```text
owner
admin
editor
viewer
```

V1 can keep owner/collaborator compatibility while application service layer is introduced.

## 21. Supabase Security / RLS

### Immediate objective

Remove dependence on policies that allow unrestricted global reads.

### Recommended model

- server routes handle privileged operations using service role,
- service role is never exposed client-side,
- public data is loaded through scoped server endpoints,
- admin data is authorized server-side,
- RLS remains defense-in-depth where direct anon access is needed.

### RSVP/wishes migration

Before production:

1. clean legacy null `wedding_id`,
2. make `wedding_id NOT NULL`,
3. ensure foreign keys cascade correctly,
4. remove unrestricted global read policies,
5. add scoped indexes,
6. test cross-wedding access attempts.

## 22. Spam and Abuse Protection

Public RSVP and wishes require baseline protection:

- per-IP/request rate limiting,
- max payload lengths,
- optional lightweight challenge later,
- duplicate RSVP handling per guest token,
- wishes moderation,
- logging of rejected requests.

## 23. Asset Storage Architecture

Recommended paths:

```text
weddings/{weddingId}/hero/
weddings/{weddingId}/couple/
weddings/{weddingId}/story/
weddings/{weddingId}/gallery/
weddings/{weddingId}/gift/
weddings/{weddingId}/music/
```

Requirements:

- image MIME validation,
- file size limit,
- unique generated filename,
- metadata storage if necessary,
- optional optimization pipeline,
- cleanup orphan assets later.

Template assets are separate:

```text
public/templates/{templateId}/...
```

Customer/wedding assets must never be stored inside template source folders.

## 24. Gallery Fix

Current gallery logic must be replaced so actual `image.url` is rendered.

Target block behavior:

- responsive image,
- lazy loading,
- alt text,
- modal/lightbox,
- ordering from content schema,
- no fallback emoji when a valid image exists.

## 25. Countdown Fix

Remove hard-coded fallback event date.

Canonical countdown date:

```text
hero/countdown event reference
or
first primary event date/time
```

Recommended content field:

```ts
hero.countdownEventId?: string
```

If missing, select primary event by explicit rule, not a demo date.

## 26. Maps

V1 does not require paid Google Maps API.

Baseline:

- Maps URL button,
- optional coordinates,
- embed using safe supported map URL when possible.

Paid Maps API can be introduced later if required.

## 27. Gift / Digital Envelope

Content model example:

```ts
interface GiftContent {
  enabled: boolean;
  intro?: string;
  bankAccounts: Array<{
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }>;
  qrisImageUrl?: string;
  shippingAddress?: string;
}
```

Public block supports copy-to-clipboard for account number.

No payment gateway is required merely to display recipient bank/QRIS information.

## 28. Music

Do not bundle unauthorized copyrighted tracks.

Architecture should support:

```ts
interface MusicContent {
  sourceType: "uploaded" | "licensed-library" | "external";
  title?: string;
  artist?: string;
  url: string;
  autoplayRequested?: boolean;
}
```

Browser autoplay restrictions must be respected.

## 29. Packages and Feature Entitlements

Do not scatter checks such as:

```ts
if (package === "premium")
```

across every component.

Use feature configuration:

```ts
interface PackageCapabilities {
  galleryLimit: number;
  wishes: boolean;
  music: boolean;
  digitalGift: boolean;
  customTheme: boolean;
  templateTier: string[];
}
```

Then resolve capabilities centrally.

## 30. Template Catalog Scalability

For a growing catalog, metadata should support:

- categories,
- tags,
- search,
- tier,
- active/archive status,
- thumbnail,
- demo wedding,
- template version,
- supported sections.

The UI should paginate/filter as the catalog grows instead of loading every preview asset eagerly.

### Important

There is **no fixed maximum template count** in the architecture.

As scale grows, optimization strategy changes, while the template contract remains stable.

## 31. Testing Strategy

### Unit tests

- content normalization
- slug validation
- URL builder
- template resolver
- template compatibility
- package capability resolution
- RSVP validation
- guest quota validation

### Integration tests

- user cannot edit unrelated wedding
- wedding A cannot read wedding B RSVP
- wedding A cannot read wedding B wishes
- released wedding renders by slug
- draft wedding is not public
- preview works for collaborator
- unsupported template fails safely

### Template contract tests

Every active template should pass the same fixture suite:

```text
minimal content
full content
missing optional fields
multiple events
long couple names
empty gallery
large gallery within package limit
mobile viewport
```

This becomes essential as template count grows.

## 32. Observability

Minimum production logging:

- failed auth attempts (without sensitive payloads),
- publish errors,
- template resolution errors,
- upload failures,
- RSVP/wishes submission failures,
- server exceptions.

Never log:

- passwords,
- auth secrets,
- service role keys,
- full sensitive payment data.

## 33. Migration Phases

### Phase 0 — Documentation / Safety

- resolve commercial license status,
- preserve `main`,
- work in `develop/commerce-foundation`.

### Phase 1 — Core Safety

- validation layer,
- centralized auth helpers,
- strict wedding scope for RSVP/wishes,
- schema migration for tenant isolation.

### Phase 2 — Template Foundation

- canonical content schema V1,
- content normalizer,
- template types,
- template registry,
- template resolver,
- migrate existing Classic design to `classic-001`.

### Phase 3 — Public Rendering

- unified preview/public renderer,
- path-based slug route,
- production URL helper,
- reserved slug module.

### Phase 4 — Complete Wedding Content

- real gallery,
- event-driven countdown,
- map,
- story,
- gift/QRIS,
- music model.

### Phase 5 — Guests

- guest table,
- token URLs,
- personalized greeting,
- quota-aware RSVP.

### Phase 6 — Commerce Operations

- customers,
- orders,
- payment status,
- production workflow,
- admin summaries.

### Phase 7 — Catalog Growth

- additional templates,
- category/filter UI,
- compatibility tests,
- lazy loading strategy when needed.

## 34. Definition of Done for Commerce Foundation

Commerce foundation is ready for feature acceleration when:

- tenant data isolation is tested,
- public API has no unscoped tenant list endpoint,
- canonical content schema exists,
- template registry/resolver exists,
- existing Classic template works through the registry,
- a second template can be added without touching invitation core route,
- preview and public renderer share the same engine,
- production URL building is centralized,
- no localhost hard-code remains in publish/view flow,
- template count has no artificial limit in domain or renderer architecture.

## 35. Architecture Decision Summary

1. Keep one multi-wedding application.
2. V1 is admin-managed.
3. Use path-based public routing first.
4. Separate business logic from template visuals.
5. Introduce versioned canonical content schema.
6. Resolve templates through an extensible registry/manifest.
7. No fixed template-count cap.
8. Keep tenant-sensitive RSVP/wishes/guest logic shared outside templates.
9. Use one renderer for preview and production.
10. Centralize validation, authorization, and URL generation.
11. Treat upstream commercial license resolution as a release blocker.
12. Scale template loading strategy as the catalog grows without changing the core template contract.
