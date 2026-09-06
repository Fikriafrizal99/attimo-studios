# ENDRIYA Brand Direction

## Working brand

**ENDRIYA** is the customer-facing brand for the digital wedding invitation platform built from this repository.

Customer-facing descriptor:

> Digital Wedding Experience

## Product model

ENDRIYA uses one complete feature set for every wedding. Product differentiation is visual, not functional.

Visual experience classes:

- **2D** — clean layouts, lightweight motion, editorial and decorative themes.
- **2.5D** — layered scenes, depth, parallax, richer transitions, and cinematic scrolling.
- **3D** — immersive real-time scenes and interactions, with mobile/performance fallbacks.

Core wedding capabilities remain shared across all visual classes, including wedding content, events, countdown, gallery, maps, gifts, guest links, RSVP, wishes, preview, and publishing.

## Architecture implication

Wedding content must remain independent from template presentation. A wedding stores semantic content once; templates render that content through different visual experiences.

The expected direction is:

```text
Wedding Content + Guest Data
            |
            v
      Template Registry
       /      |      \
     2D      2.5D     3D
```

## Branding boundary

The name **Attimo** belongs to the upstream/fork history and must not be used as the customer-facing product brand.

Upstream provenance and licensing references must remain intact in provenance/license documentation. Rebranding does not remove or rewrite upstream attribution/history.

Customer-facing surfaces should use **ENDRIYA**.

## Current Phase 2 usage

During Phase 2, ENDRIYA branding applies to:

- dashboard shell and metadata;
- authentication screens;
- landing page and product messaging;
- wedding studio wording;
- future template catalog and preview surfaces.

Repository/internal migration history may continue to preserve historic Attimo references where changing them would damage provenance or migration integrity.
