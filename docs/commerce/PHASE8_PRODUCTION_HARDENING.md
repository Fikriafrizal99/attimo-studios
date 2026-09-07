# ENDRIYA — Phase 8 Production Hardening

**Status:** IN PROGRESS  
**Branch:** `develop/commerce-foundation`  
**Phase:** 8 — Production Hardening

## Objective

Close repository-level security, reliability, performance, product, and rights-control gaps before the full environment and end-to-end acceptance work in Phase 9.

Phase 8 does not deploy ENDRIYA or claim production verification. Real domain/TLS, staging/production secrets, migration reconciliation, device QA, load acceptance, and the complete business journey remain Phase 9.

## 8.1 Security Baseline

Implemented in the repository:

- Better Auth database-backed rate limiting,
- production signup gate through `ALLOW_PUBLIC_SIGNUP`,
- production auth-secret preflight,
- shared PostgreSQL-backed abuse limits for public RSVP and wishes routes,
- per-resolution, per-submission, guest/IP, and wedding-burst controls,
- fail-closed production rate-limit behavior,
- released-wedding and personalized-guest scope enforcement,
- tenant-authorized server upload boundary,
- upload size, file-signature, and MIME/content validation,
- service-role storage operations remain server-only,
- CSP and baseline browser security headers,
- Phase 8 security verifier and database rate-limit verifier in CI.

Canonical migration:

```text
supabase/migrations/20260907000300_phase8_security_rate_limits.sql
```

## 8.2 Reliability / Operations Baseline

Implemented in the repository:

- liveness endpoint `/api/health`,
- readiness endpoint `/api/ready`,
- database/schema readiness checks,
- request correlation IDs,
- structured server error logging with sensitive-value restrictions,
- strict environment preflight,
- database backup/restore guidance,
- migration reconciliation guidance,
- application rollback guidance,
- Supabase Storage backup boundary documentation.

Reference:

```text
docs/commerce/PRODUCTION_OPERATIONS_RUNBOOK.md
```

## 8.3 Performance Hardening

Implemented / being verified:

- template metadata registry remains renderer-free,
- every active renderer is explicitly code-split with `next/dynamic`,
- 2D invitations do not statically reference 2.5D/3D renderer modules,
- performance budgets are declared per experience class,
- gallery media uses lazy loading, async decoding, and low fetch priority,
- Paper Cut and Pasundan parallax work is animation-frame throttled,
- reduced-motion fallbacks remain mandatory,
- Clay WebGL DPR is capped to `1.5`,
- Clay continues to retain a DOM fallback when WebGL is unavailable.

Budget classes:

```text
2D light → 90 KB experience JS / 6.5 MB wedding media
2D rich  → 150 KB experience JS / 7.5 MB wedding media
2.5D     → 190 KB experience JS / 8 MB wedding media
3D       → 240 KB experience JS / 9 MB wedding media / DPR cap 1.5
```

These are repository/operator targets, not yet measured real-device acceptance results. Phase 9 must validate actual production bundles/network behavior on representative devices.

## 8.4 Product / Legal Baseline

Implemented / being verified:

- public `/privacy` guest-data notice,
- public `/terms` baseline,
- public landing links to privacy and terms,
- asset-rights register,
- music-usage policy,
- Google Fonts provenance and OFL-1.1 metadata in the curated font registry,
- CI branding gate for remaining `Attimo` references in public/product source surfaces.

References:

```text
docs/commerce/ASSET_RIGHTS_REGISTER.md
docs/commerce/MUSIC_USAGE_POLICY.md
docs/commerce/UPSTREAM_LICENSE_STATUS.md
```

## External Commercial Rights Blocker

**Commercial release remains BLOCKED.**

The upstream source-code rights issue is not a technical defect that CI can make disappear. ENDRIYA must not be called commercially launch-ready until one of the resolution paths in `UPSTREAM_LICENSE_STATUS.md` is completed:

1. valid upstream license terms granting the required commercial rights,
2. explicit written permission from the rights holder, or
3. replacement of upstream-derived implementation/assets with independently implemented, clear-rights equivalents.

Upstream code rights and individual asset rights remain separate checks.

## Current Acceptance Position

Repository implementation work for 8.1 and 8.2 is present and previously gated. 8.3 and 8.4 have been added and are passing through the full CI chain. Phase 8 must remain `IN PROGRESS` until the final HEAD passes:

```text
Phase 8.1 security verifier
Phase 8.2 reliability verifier
Phase 8.3 performance verifier
Phase 8.4 product/legal verifier
Production Next.js build
Canonical database migration chain
Tenant/integrity database smoke
Phase 8 rate-limit database test
Docker image build
Container health smoke
```

A GitHub runner/setup download failure is infrastructure noise, not acceptance evidence; a clean completion run is still required before Phase 8 is marked `IMPLEMENTED`.
