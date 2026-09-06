# ENDRIYA Gallery Engine

Status: Phase 3.6 canonical gallery baseline

ENDRIYA stores gallery content in `WeddingContent.gallery` and treats array order as the canonical display order for every visual tier.

## Canonical item

```ts
{
  id: string;
  url: string;
  alt: string;
}
```

No template-specific `position`, gallery table, or alternate ordering model is allowed. Reordering the array in the dashboard changes the order consumed by 2D, 2.5D, and 3D renderers.

## Normalization

`normalizeWeddingContent()`:

- preserves gallery array order;
- trims text values;
- removes items with an empty image URL;
- supplies deterministic fallback alt text when alt is blank.

Server-side validation still applies the canonical content limits and unique-id rules before persistence.

## Dashboard behavior

The content editor supports:

- adding a gallery item;
- uploading/replacing the image;
- editing alt text;
- moving an item up/down in canonical order;
- removing an item.

Storage authorization and object-path isolation remain a separate Phase 3.7 concern.

## Public renderer behavior

The reference `classic-001` gallery:

- reads only canonical gallery data;
- lazy-loads grid images;
- decodes images asynchronously;
- supports a modal/lightbox;
- supports Escape, Arrow Left, and Arrow Right keyboard controls;
- wraps previous/next navigation;
- locks page scrolling while the lightbox is open;
- skips GSAP reveal animation when `prefers-reduced-motion: reduce` is enabled.

Other templates may present the gallery differently, but they must preserve the same semantic content and canonical ordering.
