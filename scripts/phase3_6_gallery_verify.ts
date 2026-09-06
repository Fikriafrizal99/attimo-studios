import { normalizeWeddingContent } from "../lib/commerce/content";
import {
  getGalleryItems,
  nextGalleryIndex,
  previousGalleryIndex,
  reorderGalleryItems,
} from "../lib/commerce/gallery";
import { defaultContent } from "../lib/wedding-defaults";
import { validateWeddingContentInput } from "../lib/commerce/wedding-validation";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const raw = {
  ...defaultContent,
  gallery: [
    { id: "gallery-a", url: "https://example.com/a.jpg", alt: "  Foto pertama  " },
    { id: "gallery-b", url: "https://example.com/b.jpg", alt: "" },
    { id: "gallery-empty", url: "", alt: "Tidak boleh tampil" },
  ],
};

const validation = validateWeddingContentInput(raw);
assert(validation.ok, "gallery content must pass canonical validation");
assert(validation.value.gallery.length === 2, "empty gallery URLs must be removed during normalization");
assert(validation.value.gallery[0]?.id === "gallery-a", "normalization must preserve gallery array order");
assert(validation.value.gallery[0]?.alt === "Foto pertama", "normalization must trim gallery alt text");
assert(
  validation.value.gallery[1]?.alt === "Wedding gallery photo 2",
  "normalization must provide deterministic fallback alt text"
);

const display = getGalleryItems(validation.value);
assert(display.length === 2, "display gallery must expose canonical images");
assert(display[0]?.displayIndex === 0 && display[1]?.displayIndex === 1, "display indexes must follow canonical array order");

const originalIds = validation.value.gallery.map((item) => item.id).join(",");
const reordered = reorderGalleryItems(validation.value.gallery, 1, 0);
assert(reordered[0]?.id === "gallery-b", "reorder must move the requested gallery item");
assert(reordered[1]?.id === "gallery-a", "reorder must preserve the remaining gallery item");
assert(
  validation.value.gallery.map((item) => item.id).join(",") === originalIds,
  "reorder must not mutate canonical input"
);

const unchanged = reorderGalleryItems(validation.value.gallery, 0, -1);
assert(unchanged.map((item) => item.id).join(",") === originalIds, "out-of-range reorder must be a safe no-op");

assert(previousGalleryIndex(0, 3) === 2, "previous navigation must wrap to the last image");
assert(nextGalleryIndex(2, 3) === 0, "next navigation must wrap to the first image");
assert(previousGalleryIndex(0, 0) === -1, "empty gallery previous index must be -1");
assert(nextGalleryIndex(0, 0) === -1, "empty gallery next index must be -1");

const normalized = normalizeWeddingContent(raw);
assert(normalized.gallery.map((item) => item.id).join(",") === originalIds, "canonical normalization order changed unexpectedly");

console.log("Phase 3.6 canonical gallery verification passed.");
