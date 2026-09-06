import type {
  WeddingContent,
  WeddingGalleryImageContent,
} from "@/lib/wedding-contract";

export type GalleryDisplayItem = WeddingGalleryImageContent & {
  displayIndex: number;
};

/**
 * Gallery order is the array order stored in canonical WeddingContent.gallery.
 * No template may maintain a separate ordering model.
 */
export function getGalleryItems(content: WeddingContent | null | undefined): GalleryDisplayItem[] {
  return (content?.gallery ?? [])
    .filter((image) => image.url.trim().length > 0)
    .map((image, index) => ({
      ...image,
      alt: image.alt.trim() || `Wedding gallery photo ${index + 1}`,
      displayIndex: index,
    }));
}

export function reorderGalleryItems<T>(items: readonly T[], fromIndex: number, toIndex: number): T[] {
  const next = [...items];
  if (
    fromIndex < 0 ||
    fromIndex >= next.length ||
    toIndex < 0 ||
    toIndex >= next.length ||
    fromIndex === toIndex
  ) {
    return next;
  }

  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function previousGalleryIndex(currentIndex: number, length: number): number {
  if (length <= 0) return -1;
  return (currentIndex - 1 + length) % length;
}

export function nextGalleryIndex(currentIndex: number, length: number): number {
  if (length <= 0) return -1;
  return (currentIndex + 1) % length;
}
