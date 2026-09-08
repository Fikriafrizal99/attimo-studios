# ENDRIYA — Phase 9 Full Integration & E2E Acceptance

**Status:** IN PROGRESS  
**Branch:** `develop/commerce-foundation`  
**Phase:** 9 — Full Integration & End-to-End Acceptance Testing

## Objective

Verify ENDRIYA as one integrated product in an isolated staging or production-like environment. Repository-level `IMPLEMENTED` status from earlier phases is necessary but is not equivalent to environment-level `VERIFIED` status.

## Phase 9 Rules

- Use an isolated staging Supabase project/branch for destructive E2E fixtures.
- Do not seed destructive E2E data into the primary connected project merely for convenience.
- Path routing is the baseline acceptance mode before optional wildcard subdomain acceptance.
- Keep every previous repository verifier green while Phase 9 defects are fixed.
- Record evidence by environment, commit SHA, migration state, device/browser, and acceptance family.
- Commercial rights remain a Phase 10 blocker even if all technical Phase 9 acceptance passes.

## Environment Reconciliation — Completed Checkpoint

The primary connected Supabase project was audited before E2E data creation.

Completed:

- storage-isolation schema verified equivalent to the canonical repository migration,
- remote storage migration history reconciled to `20260906000800`,
- Phase 5 commerce schema applied,
- Phase 6 order activity schema applied,
- Phase 8 security/rate-limit schema applied,
- remote migration history reconciled to canonical repository versions:

```text
20260906000800 storage_isolation
20260907000100 phase5_commerce_operations
20260907000200 phase6_order_activity
20260907000300 phase8_security_rate_limits
```

Remote non-destructive smoke confirmed:

- customers/orders/order_activity tables exist,
- Better Auth and public rate-limit tables exist,
- required private functions exist,
- RLS is enabled on Phase 5/6/8 public tables,
- order activity/scope/update triggers exist,
- database-backed public rate limiter rejects the request beyond the configured test limit inside a rolled-back transaction.

A rolled-back integrated database journey was also executed against the primary connected Supabase project and passed:

```text
Tenant A user
→ Wedding
→ Customer
→ Order
→ Guest
→ Order activity
→ Payment/production/revision transitions
→ Cross-tenant visibility denial
→ Cross-tenant customer linkage denial
```

No Phase 9 test fixture from these checks was committed to the primary database.

## Isolated Staging Supabase — Completed Database Checkpoint

A second Free-plan Supabase project was created specifically for Phase 9:

```text
Name: ENDRIYA Staging
Project ref: itgpywqrbvgsrjtibdle
Region: ap-south-1
```

The complete canonical repository migration chain was applied to this project. Migration history was then reconciled to the repository timestamps from:

```text
20250225000000 rsvp_wishes_baseline
...
20260906000800 storage_isolation
20260907000100 phase5_commerce_operations
20260907000200 phase6_order_activity
20260907000300 phase8_security_rate_limits
```

A staging-only rolled-back acceptance smoke passed for:

```text
Tenant A / Tenant B isolation
Wedding creation
Customer creation
Order linkage
Guest linkage
Order activity
Payment / production transitions
Cross-tenant visibility denial
Cross-tenant linkage denial
Shared database rate limiting
```

No smoke fixture was committed by this staging DB acceptance run.

## Repository Acceptance Gate — Completed Checkpoint

Repository artifacts include:

```text
scripts/phase9_acceptance_contract_verify.ts
scripts/phase9_3_staging_deployment_verify.ts
supabase/tests/phase9_1_integration_journey_verify.sql
scripts/deploy-staging.sh
docs/commerce/PHASE9_STAGING_DEPLOYMENT.md
```

The CI acceptance contract verifies the expected API/public routes, strict staging environment contract, canonical migrations, centralized publish-readiness/public-resolver/rate-limit/storage boundaries, and the required Phase 9 acceptance families.

The integrated database test creates two temporary tenants inside one transaction and verifies Customer → Order → Wedding → Guest integration, order-activity transitions, and cross-tenant negative cases before rolling everything back.

The staging deployment profile adds:

```text
Compose project: endriya-staging
Image: endriya-wedding:staging
Host bind: 127.0.0.1
Port: 3100
Supabase project: itgpywqrbvgsrjtibdle
Strict environment preflight
Container health gate
/api/ready database readiness gate
```

Private runtime credentials remain server-only and are intentionally absent from GitHub.

GitHub Actions run `#369` on commit `c89d4dd638482e1135982038a2bbd68fbafcbadc` completed successfully with the initial Phase 9 contract and DB integration gate. Later Phase 9 staging-profile commits continue to require the same previous-phase build/database/Docker gates.

## Acceptance Journey

### Customer → Order → Wedding

Verify the operator can:

1. authenticate with production-like Better Auth settings,
2. create a customer,
3. create an order tied to that customer,
4. create/attach a wedding project,
5. select an active template,
6. save canonical content and sections,
7. upload permitted wedding assets,
8. create personalized guests,
9. observe order activity and operational state transitions.

### Publish → Public Invitation

Verify:

1. incomplete wedding cannot be released,
2. publish-readiness passes only when canonical requirements are met,
3. approved wedding can be released,
4. released wedding resolves through the path URL,
5. canonical/social metadata is correct,
6. released content is mutation-locked where required,
7. unpublish hides public delivery,
8. re-release restores delivery without corrupting guest state.

### Personalized Guest → RSVP → Wish

Verify:

1. valid personalized token resolves the correct guest,
2. invalid/rotated token does not expose another guest,
3. RSVP obeys wedding/guest scope and quota,
4. RSVP analytics reflects accepted submissions,
5. wish submission obeys scope/rate limits,
6. moderation changes public visibility correctly,
7. public reads never expose private operator or unrelated guest data.

## Security Acceptance Families

### Cross-Tenant Negative Acceptance

Create at least two isolated operator tenants and prove tenant A cannot read or mutate tenant B resources across:

- customers,
- orders,
- weddings,
- collaborators,
- guests,
- RSVP,
- wishes,
- assets,
- order activity.

Target: **0 cross-tenant incidents**.

### Asset Boundary Acceptance

Verify:

- allowed JPEG/PNG/WebP/GIF upload,
- size limit enforcement,
- MIME/signature mismatch rejection,
- wedding namespace isolation,
- direct browser storage mutation rejection,
- unrelated tenant asset mutation rejection.

### Abuse / Rate-Limit Acceptance

Verify shared database-backed limits across multiple application instances or equivalent concurrent requests for:

- public invitation resolution,
- RSVP submissions,
- wish submissions,
- wedding burst controls.

## Routing / Metadata Acceptance

### Path Routing Acceptance

Path routing is mandatory baseline:

```text
/invite/{slug}
```

Verify canonical URL behavior, guest query/token handling, redirects, 404 behavior, and social metadata.

### Optional Subdomain Acceptance

Only after path acceptance passes, test wildcard DNS/TLS and reverse-proxy host behavior for supported subdomain mode. Failure of optional subdomain mode must not invalidate an otherwise supported path-only deployment unless subdomain launch is explicitly required.

## Device / Network Acceptance

Test representative environments:

- current Android Chrome,
- current iPhone Safari,
- desktop Chromium,
- desktop Firefox/Safari where available,
- reduced-motion preference,
- constrained/slow network,
- lower-end mobile GPU for 2.5D/3D degradation,
- WebGL unavailable fallback for Clay.

Record visual/layout defects per active production template, with special focus on public invitation completion rather than screenshot-only fidelity.

## Reliability Acceptance

Verify:

- `/api/health` liveness,
- `/api/ready` readiness against final schema,
- structured failure logging/correlation IDs,
- restart behavior,
- backup/restore rehearsal or documented staging restore evidence,
- application rollback procedure,
- migration history remains canonical after deployment.

## Evidence Matrix

Each acceptance run should record:

```text
Environment / project ref
Application commit SHA
Migration versions
Deployment identifier
Browser/device
Acceptance family
PASS / FAIL
Defect reference
Resolution commit
Retest result
```

Phase 9 may only move to `VERIFIED` when critical/high defects are fixed or explicitly accepted and the primary business journey passes in a staging/production-like deployment.

## Current Position

```text
9.1 Environment + migration reconciliation     ✅
9.2 Acceptance contract + CI/DB integration     ✅
9.3 Isolated staging deployment                ▶ IN PROGRESS
    Supabase staging project + schema/history  ✅
    Staging DB acceptance smoke                ✅
    App deployment profile + readiness runner  ✅ IMPLEMENTED
    Real server secrets + HTTPS runtime         ⏳
    /api/ready through deployed staging app     ⏳
9.4 Primary business journey E2E               ⏳
9.5 Cross-tenant / asset / abuse negatives     ⏳
9.6 Routing / metadata acceptance              ⏳
9.7 Device / slow-network / 2.5D-3D QA         ⏳
9.8 Reliability / rollback / evidence closeout ⏳
```

Commercial rights remain a Phase 10 blocker and are not waived by Phase 9 technical acceptance.
