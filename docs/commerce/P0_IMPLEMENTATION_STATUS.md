# Commerce P0 Implementation Status

**Branch:** `develop/commerce-foundation`  
**Date:** 2026-09-06

## Status legend

- ✅ implemented and verified
- 🧪 implementation complete; deployed/device verification still required
- ⚠️ external/legal action required

## P0 matrix

| Requirement | Status | Current state |
|---|---|---|
| Upstream commercial-use rights | ⚠️ | Still unresolved; commercial release remains blocked. |
| Repository build / TypeScript | ✅ | Commerce P0 CI passes. |
| Database bootstrap idempotency | ✅ | CI applies consolidated bootstrap twice successfully. |
| Real Supabase commerce migration | ✅ | Applied to connected production Supabase. |
| Real Supabase production verifier | ✅ | `supabase/verify-production.sql` passed. |
| RLS / server-only tenant posture | ✅ | Tenant tables have RLS enabled; public permissive policies removed. |
| Cross-wedding guest defense | ✅ | Database triggers installed and CI smoke-tested. |
| RSVP invitation quota defense | ✅ | Database trigger installed and CI smoke-tested. |
| `wedding-assets` storage bucket | ✅ | Public bucket exists with 5 MB image limit and allowed image MIME types. |
| Better Auth schema | ✅ | Better Auth 1.4.19 core schema applied to production and checked into repo. |
| Better Auth production verifier | ✅ | `supabase/verify-better-auth.sql` passed on the production database. |
| Better Auth direct browser access | ✅ | Auth tables use RLS and direct `anon`/`authenticated` read privileges are revoked. |
| Safe operator bootstrap mechanism | ✅ | `bun run admin:bootstrap` prompts for credentials locally with hidden password input; no public HTTP signup is required. |
| First operator/admin account | 🧪 | Bootstrap command is ready; operator account still needs to be created from a trusted terminal. |
| Real deployment secrets/env | 🧪 | Project public values are available; service role, DB credential, and auth secret must remain in deployment secrets. |
| Domain/HTTPS | 🧪 | Requires chosen production hostname/provider. |
| End-to-end deployed tenant/storage test | 🧪 | Requires authenticated deployed app. |
| Real-device visual QA | 🧪 | Requires deployed app. |
| Shared/edge rate limiter for scale | 🧪 | In-memory baseline is acceptable for P0/single runtime; upgrade before horizontal/high-volume operation. |

## Repository P0 features complete

- extensible template registry with `classic-001` and `minimal-001`,
- shared public/preview renderer,
- real content editor, gallery, maps, countdown, gifts/QRIS and music,
- guest management with opaque personalized links,
- wedding-scoped RSVP and wishes,
- publish/release gate,
- tenant-scoped uploads,
- central URL and input validation,
- public signup disabled by default,
- private interactive operator bootstrap CLI,
- Next.js 16 `proxy.ts`,
- environment preflight,
- CI build + PostgreSQL database-smoke,
- production commerce/auth verifiers and runbook.

## CI state — PASS

The P0 branch is protected by `Commerce P0 CI`, including:

- dependency installation,
- environment preflight,
- Next.js production build,
- strict TypeScript,
- PostgreSQL database-smoke,
- idempotent commerce bootstrap,
- tenant/quota integrity verification.

Production-state commits must remain CI-green before merge.

## Production Supabase verification

Completed on 2026-09-06:

1. commerce P0 migration applied,
2. production commerce verifier passed,
3. storage bucket verified,
4. Better Auth 1.4.19 schema applied,
5. Better Auth production verifier passed,
6. auth tables verified with RLS,
7. browser roles verified without direct auth-table read privilege,
8. Supabase security advisor reviewed — only intentional INFO notices for RLS-without-policy,
9. performance advisor reviewed — only unused-index INFO notices on a fresh/empty database.

## Remaining production gates

1. Run `bun run admin:bootstrap` from a trusted terminal to create the first operator.
2. Configure service-role key, database connection, and `BETTER_AUTH_SECRET` directly in the deployment provider; never commit or paste them into chat.
3. Choose/configure production domain and HTTPS.
4. Run `bun run p0:preflight` against the real deployment env.
5. Execute authenticated storage and tenant-isolation end-to-end smoke tests.
6. Complete mobile/device QA.
7. Resolve upstream licensing before any commercial sale/distribution.

## Completion state

**In-repository technical P0:** COMPLETE.  
**Supabase database P0:** COMPLETE.  
**Auth schema/verifier P0:** COMPLETE.  
**Operator bootstrap tooling:** COMPLETE.  
**Production application P0:** pending operator execution + deployment/domain/device gates.  
**Commercial release:** blocked by upstream commercial-use rights.
