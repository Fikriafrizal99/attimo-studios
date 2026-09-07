import { readFileSync } from "node:fs";
import { WEDDING_SECTION_IDS } from "@/lib/wedding-contract";
import {
  getActiveTemplates,
  getActiveTemplatesByTier,
  resolveTemplate,
  validateTemplateCompatibility,
} from "@/templates/registry";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const paper = resolveTemplate("paper-cut-001");

assert(paper.status === "active", "paper-cut-001 must be active");
assert(paper.family === "paper-cut-garden", "paper cut family mismatch");
assert(paper.category === "Whimsical", "paper cut category mismatch");
assert(paper.visualTier === "2.5d", "paper cut must be the first 2.5d production template");
assert(paper.performance.renderingMode === "hybrid", "paper cut must declare hybrid DOM/CSS rendering");
assert(paper.performance.motionLevel === "rich", "paper cut must declare rich motion");
assert(paper.performance.mobileProfile === "adaptive", "paper cut must adapt its depth treatment on mobile");
assert(paper.performance.reducedMotionFallback, "paper cut needs reduced-motion fallback");
assert(paper.typography.display === "allura", "paper cut display font should be Allura");
assert(paper.typography.heading === "dm-serif-display", "paper cut heading font should be DM Serif Display");
assert(paper.typography.body === "inter", "paper cut body font should remain Inter");

const sections = new Set(paper.sectionContract);
assert(sections.size === WEDDING_SECTION_IDS.length, "paper cut section contract size mismatch");
for (const sectionId of WEDDING_SECTION_IDS) {
  assert(sections.has(sectionId), `paper cut template missing canonical section: ${sectionId}`);
}

const compatibility = validateTemplateCompatibility("paper-cut-001", [...WEDDING_SECTION_IDS]);
assert(compatibility.ok, "paper cut must accept the canonical wedding section set");
assert(compatibility.unsupported.length === 0, "paper cut cannot reject canonical sections");

const active25d = getActiveTemplatesByTier("2.5d");
assert(active25d.some((item) => item.id === "paper-cut-001"), "2.5d tier query must expose paper-cut-001");
assert(getActiveTemplates().length >= 4, "Phase 7.4 requires four active production experiences");

const source = readFileSync("templates/paper-cut-001/PaperCutGardenTemplate.tsx", "utf8");
for (const sharedComponent of [
  "CoupleSection",
  "DateSection",
  "LocationSection",
  "StorySection",
  "GallerySection",
  "RSVPSection",
  "WishesSection",
  "GiftSection",
  "MusicPlayer",
]) {
  assert(source.includes(sharedComponent), `paper cut renderer must reuse shared ${sharedComponent}`);
}
assert(!source.includes('fetch("/api/'), "paper cut renderer must not duplicate public business API logic");
assert(source.includes('data-endriya-experience="layered-paper-parallax"'), "paper cut experience marker missing");
assert(source.includes('data-endriya-visual-tier="2.5d"'), "paper cut visual tier marker missing");
assert(source.includes("requestAnimationFrame"), "paper cut scroll parallax should be animation-frame throttled");
assert(source.includes("onPointerMove"), "paper cut should support pointer-based depth interaction");
assert(source.includes("DEPTH_FACTORS"), "paper cut should define explicit depth factors");

const css = readFileSync("templates/paper-cut-001/PaperCutGardenTemplate.module.css", "utf8");
assert(css.includes("perspective: 1200px"), "paper cut hero needs perspective depth");
assert(css.includes("translate3d"), "paper cut layers must use compositor-friendly 3d transforms");
assert(css.includes('data-paper-depth="8"'), "paper cut needs a foreground depth layer");
assert(css.includes("prefers-reduced-motion: reduce"), "paper cut CSS must honor reduced motion");
assert(css.includes("@media (max-width: 640px)"), "paper cut needs explicit mobile adaptation");

for (const tag of ["paper-cut", "layered", "parallax", "2.5d", "whimsical"]) {
  assert(paper.tags.includes(tag), `paper cut catalog tag missing: ${tag}`);
}

console.log(`Phase 7.4 Paper Cut Garden verification passed (${getActiveTemplates().length} active templates).`);
