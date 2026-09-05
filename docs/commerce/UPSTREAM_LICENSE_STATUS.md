# Upstream Commercial License Status

**Status:** BLOCKED FOR COMMERCIAL RELEASE  
**Checked:** 2026-09-05  
**Upstream:** `heulaulab-dev/attimo-studios`

## Current evidence

At the time of the commerce audit:

- the upstream GitHub repository metadata reports no detected license (`license: null`),
- no root `LICENSE` file is present,
- the README contains wording that refers to an MIT License.

The README wording alone is not being treated by this project as sufficient evidence to authorize commercial redistribution of the upstream source code.

## P0 decision

Commercial launch remains blocked until one of these conditions is satisfied:

1. upstream publishes a valid license file that grants the required commercial rights, or
2. the upstream copyright holder provides explicit written permission/license terms covering the intended commercial use, or
3. upstream-derived implementation is replaced with independently implemented code/assets whose rights are clear.

## Important rule

Do **not** add an MIT `LICENSE` file to this fork and assume that grants rights over upstream code. A fork owner cannot retroactively grant permissions they did not receive from the upstream copyright holder.

## Assets

Code permission and asset permission are separate. Before commercial launch, also verify rights for:

- logos/branding,
- photos and illustrations,
- fonts,
- audio/music,
- template decorative assets.

## Release gate

This item must remain visible as an external P0 blocker even if all technical P0 tasks pass CI.
