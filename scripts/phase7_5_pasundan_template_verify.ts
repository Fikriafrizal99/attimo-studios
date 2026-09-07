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

const pasundan = resolveTemplate("pasundan-001");
assert(pasundan.status === "active", "pasundan-001 must be active");
assert(pasundan.family === "pasundan-storyland", "pasundan family mismatch");
assert(pasundan.category === "Heritage Nusantara", "pasundan category mismatch");
assert(pasundan.visualTier === "2.5d", "pasundan must declare 2.5d visual tier");
assert(pasundan.performance.renderingMode === "hybrid", "pasundan must use hybrid rendering");
assert(pasundan.performance.motionLevel === "rich", "pasundan must declare rich motion");
assert(pasundan.performance.mobileProfile === "adaptive", "pasundan must adapt depth on mobile");
assert(pasundan.performance.reducedMotionFallback, "pasundan needs reduced-motion fallback");
assert(pasundan.typography.display === "cinzel-decorative", "pasundan display font mismatch");
assert(pasundan.typography.heading === "cormorant-garamond", "pasundan heading font mismatch");
assert(pasundan.typography.body === "lora", "pasundan body font mismatch");

const sections = new Set(pasundan.sectionContract);
assert(sections.size === WEDDING_SECTION_IDS.length, "pasundan section contract size mismatch");
for (const sectionId of WEDDING_SECTION_IDS) {
  assert(sections.has(sectionId), `pasundan missing canonical section: ${sectionId}`);
}
assert(validateTemplateCompatibility("pasundan-001", [...WEDDING_SECTION_IDS]).ok, "pasundan canonical compatibility failed");
assert(getActiveTemplatesByTier("2.5d").some((item) => item.id === "pasundan-001"), "2.5d tier must expose pasundan-001");
assert(getActiveTemplates().length >= 5, "Phase 7.5 requires five active production experiences");

const source = readFileSync("templates/pasundan-001/PasundanStorylandTemplate.tsx", "utf8");
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
  assert(source.includes(sharedComponent), `pasundan renderer must reuse shared ${sharedComponent}`);
}
assert(!source.includes('fetch("/api/'), "pasundan must not duplicate public business API logic");
assert(source.includes('data-endriya-experience="pasundan-storyland-parallax"'), "pasundan experience marker missing");
assert(source.includes('data-endriya-visual-tier="2.5d"'), "pasundan visual tier marker missing");
assert(source.includes("requestAnimationFrame"), "pasundan scroll depth should be animation-frame throttled");
assert(source.includes("onPointerMove"), "pasundan should support pointer depth");
assert(source.includes("Wilujeng Sumping"), "pasundan hero cultural welcome marker missing");

const css = readFileSync("templates/pasundan-001/PasundanStorylandTemplate.module.css", "utf8");
assert(css.includes("perspective: 1200px"), "pasundan hero needs perspective depth");
assert(css.includes("translate3d"), "pasundan must use compositor-friendly 3d transforms");
assert(css.includes(".gateRoof"), "pasundan needs a distinct heritage gate composition");
assert(css.includes(".mountainBack"), "pasundan needs Priangan landscape depth");
assert(css.includes(".wovenPanel"), "pasundan needs woven cultural texture");
assert(css.includes("prefers-reduced-motion: reduce"), "pasundan CSS must honor reduced motion");
assert(css.includes("@media (max-width: 800px)"), "pasundan needs explicit mobile adaptation");

const typographyLoader = readFileSync("components/invitation/InvitationTypography.tsx", "utf8");
assert(typographyLoader.includes("Cinzel_Decorative"), "Cinzel Decorative must be loaded at invitation boundary");
assert(typographyLoader.includes('"cinzel-decorative"'), "Cinzel Decorative variable mapping missing");

for (const tag of ["sunda", "pasundan", "heritage", "priangan", "2.5d", "nusantara"]) {
  assert(pasundan.tags.includes(tag), `pasundan catalog tag missing: ${tag}`);
}

console.log(`Phase 7.5 Pasundan Storyland verification passed (${getActiveTemplates().length} active templates).`);
