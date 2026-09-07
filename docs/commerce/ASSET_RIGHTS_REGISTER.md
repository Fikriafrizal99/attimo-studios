# ENDRIYA — Asset Rights Register

**Status:** ACTIVE PRE-LAUNCH REGISTER  
**Last updated:** 2026-09-07

This register separates source-code rights from asset/content rights. Passing technical CI does not grant commercial rights.

| Asset family | Current source | Current status | Commercial release rule |
|---|---|---|---|
| ENDRIYA brand mark / wordmark | Independently created in fork | REVIEWED IN REPO | Keep source/provenance record |
| Curated Google Fonts | Google Fonts, OFL-1.1 entries recorded in font registry | ALLOWED SUBJECT TO LICENSE NOTICE | Do not add unreviewed font files |
| Template CSS shapes / DOM illustrations created in Phase 7 | Independently implemented in fork | REVIEWED IN REPO | Keep independent implementation history |
| Customer couple/event photos | Customer supplied | CUSTOMER-RIGHTS REQUIRED | Customer must confirm right to use |
| Customer-uploaded illustrations/logos | Customer supplied | CUSTOMER-RIGHTS REQUIRED | Reject obvious third-party infringement risk |
| Music/audio uploaded or linked by customer | Customer supplied / third party | RIGHTS NOT PROVIDED BY PLATFORM | Require customer permission or approved licensed library |
| Upstream bundled images/decorative assets | `heulaulab-dev/attimo-studios` provenance | UNRESOLVED | Must be reviewed/replaced before commercial release |
| Upstream source implementation | `heulaulab-dev/attimo-studios` | BLOCKED FOR COMMERCIAL RELEASE | Resolve according to `UPSTREAM_LICENSE_STATUS.md` |
| Generated template thumbnails | Server-generated from registry metadata | INTERNAL/DERIVED | No external asset dependency by default |

## Operating rules

1. Never infer image/music rights from the fact that a file is technically accessible online.
2. Never add a third-party font, illustration, photo, music track, icon pack, or 3D model without recording source and license/permission.
3. Customer-supplied content remains a separate rights category from platform-supplied assets.
4. Upstream code rights and upstream asset rights must be resolved independently.
5. Phase 9 acceptance should sample actual production wedding assets and confirm they match this register/policy.
6. Phase 10 commercial release remains blocked while `UPSTREAM_LICENSE_STATUS.md` is blocked.
