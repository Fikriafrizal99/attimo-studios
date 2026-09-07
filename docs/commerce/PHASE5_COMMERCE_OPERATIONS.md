# ENDRIYA Phase 5 — Commerce Operations

**Status:** IMPLEMENTED  
**Branch:** `develop/commerce-foundation`  
**Repository verification:** PASS  
**Deployment / production verification:** deferred to Phase 9 by project decision.

## Objective

Phase 5 turns ENDRIYA from a wedding-project editor into an admin-managed commerce operation. The platform can now keep customer records, create and update orders, track manual payment status, view wedding-scoped RSVP analytics, and moderate wishes.

V1 remains an **admin-managed service**. A customer account, payment gateway, or self-service editor is not required in this phase.

---

## 5.1 Customers — implemented

### Data model

`public.customers` stores:

- customer ID,
- owner/operator Better Auth user ID,
- customer name,
- WhatsApp / phone,
- optional email,
- notes,
- created/updated timestamps.

### Tenant rule

Customer records are private to the operator that created them.

```text
Better Auth user
      ↓
owner_user_id
      ↓
customers
```

RLS only allows the current authenticated operator to select, insert, update, or delete rows where:

```sql
owner_user_id = app_private.current_better_auth_user_id()
```

`anon` and `PUBLIC` receive no direct table access.

### API

Implemented routes:

```text
GET    /api/customers
POST   /api/customers
GET    /api/customers/{id}
PATCH  /api/customers/{id}
DELETE /api/customers/{id}
```

Customer deletion is rejected while orders still reference that customer.

### Dashboard

Implemented:

```text
/dashboard/customers
```

Capabilities:

- create,
- edit,
- search by name / phone / email,
- view order count,
- delete when safe.

---

## 5.2 Orders — implemented

### Data model

`public.orders` stores:

- order ID,
- owner/operator user ID,
- customer ID,
- optional wedding ID,
- package name,
- template ID,
- price,
- currency,
- payment status,
- production status,
- revision count,
- notes,
- created/updated timestamps.

One wedding may be linked to at most one order in the current managed-service model.

### Production status contract

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

### Payment status contract

```text
unpaid
partial
paid
refunded
```

The canonical TypeScript contract is defined in:

```text
lib/commerce/operations.ts
```

Database constraints, server validation, and UI controls use the same values.

### Relationship integrity

A database trigger prevents an order from linking commercial data across operators.

An order is valid only when:

1. the customer belongs to the same `owner_user_id`, and
2. when `wedding_id` is present, that operator is the actual `owner` of the wedding.

A collaborator cannot attach another owner's wedding to their commercial order.

### API

Implemented routes:

```text
GET    /api/orders
POST   /api/orders
GET    /api/orders/{id}
PATCH  /api/orders/{id}
DELETE /api/orders/{id}
```

Filtering is supported for:

- payment status,
- production status,
- search text.

Only active registered templates are accepted by order create/update APIs.

### Dashboard

Implemented:

```text
/dashboard/orders
```

Capabilities:

- create order,
- edit order,
- delete order,
- select customer,
- optionally link an owned wedding,
- set package,
- set template,
- set IDR price,
- track payment status,
- track production status,
- track revision count,
- notes,
- search/filter,
- payment summary cards.

---

## 5.3 Payment Status — implemented

V1 uses **manual operational payment tracking**.

A payment gateway is intentionally not required yet.

Supported state:

```text
unpaid → partial → paid
```

`refunded` is available for reversal cases.

Automatic payment settlement remains a later product enhancement and must not be required for the initial managed-service workflow.

---

## 5.4 RSVP Analytics — implemented

Owner-only wedding analytics are available at:

```text
/dashboard/weddings/{weddingId}/rsvp
```

and through:

```text
GET /api/weddings/{weddingId}/rsvp/summary
```

Metrics:

- active invitation count,
- RSVP response rows,
- attending,
- not attending,
- maybe,
- expected attending guest count,
- pending personalized guest responses,
- dashboard response rate.

All queries explicitly scope to one wedding and run through the tenant-aware database boundary.

Collaborators do not receive access to the owner operational analytics view in V1.

---

## 5.5 Wishes Moderation — implemented

Owner-only moderation is available at:

```text
/dashboard/weddings/{weddingId}/wishes
```

Supported moderation states:

```text
visible
hidden
spam
```

Admin actions:

- view all wishes for the wedding,
- filter by moderation state,
- show / restore,
- hide,
- mark spam,
- delete.

Mutation routes always require both `weddingId` and `wishId`, preventing a wish from another wedding from being mutated through the current wedding route.

The existing public wishes API continues to expose only:

```text
status = visible
```

for a released wedding.

---

## Dashboard navigation

Top-level commerce navigation now provides:

```text
Projects
Orders
Customers
```

Wedding Studio owner tabs now include:

```text
Overview
Content
Layout
Guests
RSVP
Wishes
Collaborators
Settings
```

RSVP and Wishes remain owner-only operational tabs.

---

## Migration

Phase 5 introduces:

```text
supabase/migrations/20260907000100_phase5_commerce_operations.sql
```

It creates:

- `public.customers`,
- `public.orders`,
- owner-scoped RLS policies,
- updated-at triggers,
- customer/order relationship integrity trigger,
- supporting indexes and constraints.

Per the master implementation/testing strategy, this migration is **checked into the canonical migration chain and CI-tested, but production deployment is deferred to Phase 9**.

Do not manually apply individual production migrations merely to mark Phase 5 complete.

---

## Verification

### TypeScript / contract verification

CI runs:

```text
bun scripts/phase5_1_operations_verify.ts
```

It checks customer/order validation, status contracts, IDs, price/revision rules, and invalid status rejection.

### Database verification

CI runs:

```text
supabase/tests/phase5_1_commerce_operations_verify.sql
```

The rollback-only test verifies:

- owner can access their own customer,
- owner can access their own order,
- another owner's customers do not leak,
- another owner's orders do not leak,
- an operator cannot create a customer under another owner,
- an order cannot use another owner's customer,
- an order cannot use another owner's wedding,
- valid payment / production / revision updates work.

### Final Phase 5 CI state

The Phase 5 completion run passed:

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

---

## Current status

**Phase 5 repository implementation: `IMPLEMENTED`.**

Production schema application, full user-journey verification, real server/domain testing, and device/browser acceptance remain intentionally deferred to Phase 9.

## Next phase

**Phase 6 — Commercial/Admin Workflow**

Phase 6 should connect the modules into a faster daily operator workflow, including order pipeline visibility, customer → order → wedding navigation, revision/approval workflow, readiness visibility, payment visibility, and stronger operational dashboard behavior.
