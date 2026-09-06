# Upstream Provenance and License Gate

Last reviewed: 2026-09-06

## Upstream source

- Repository: `heulaulab-dev/attimo-studios`
- This repository (`Fikriafrizal99/attimo-studios`) is being developed from that upstream codebase.

## License evidence found

The upstream README contains a `License` section stating:

> MIT License - feel free to use this for your wedding!

At the time of this review, the upstream repository does **not** contain a standalone `LICENSE` file at the repository root.

## Current decision

License/provenance is **not considered fully cleared for commercial launch yet**.

Internal development may continue, but before selling or publicly launching the derived product we should obtain one of the following:

1. A standalone MIT `LICENSE` file added by the upstream owner, or
2. Explicit written confirmation from the upstream owner that the repository code is released under the MIT License, including the applicable copyright holder/year.

Once confirmed, preserve the upstream copyright/license notice in this repository and document any material modifications made by this project.

## Additional asset/dependency checks

The upstream code license does not automatically prove that every bundled image, font, music file, icon, or other third-party asset is covered by the same terms. Before commercial launch:

- audit files under `public/` and any bundled media;
- keep third-party dependency licenses intact;
- replace any asset whose commercial-use provenance is unclear.

## Roadmap status

- P0 — Upstream provenance identified: **DONE**
- P0 — Commercial license clearance: **BLOCKED pending explicit license artifact/confirmation**
