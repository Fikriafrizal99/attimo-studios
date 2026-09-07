import { readFileSync } from "node:fs";
import { WEDDING_SECTION_IDS } from "@/lib/wedding-contract";
import {
  TEMPLATE_REGISTRY,
  getActiveTemplates,
  resolveTemplate,
  validateTemplateCompatibility,
} from "@/templates/registry";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const cartoon = resolveTemplate("cartoon-001");
const classic = resolveTemplate("classic-001");

assert(cartoon.status === "active", "cartoon-001 must be active");
assert(cartoon.category === "Illustrated", "cartoon-001 must be in Illustrated category");
assert(cartoon.family === "cartoon-love-story", "cartoon-001 family mismatch");
assert(cartoon.visualTier === "2d", "cartoon-001 must be Motion 2D");
assert(cartoon.performance.renderingMode === "dom", "cartoon-001 should remain DOM based");
assert(cartoon.performance.motionLevel === "rich", "cartoon-001 must declare rich motion");
assert(cartoon.performance.mobileProfile === "full", "cartoon-001 should be fully supported on mobile");
assert(cartoon.performance.reducedMotionFallback, "cartoon-001 needs reduced-motion fallback");
assert(cartoon.typography.display === "parisienne", "cartoon display font should be Parisienne");
assert(cartoon.typography.heading === "nunito", "cartoon heading font should be Nunito");
assert(cartoon.typography.body === "nunito", "cartoon body font should be Nunito");
assert(cartoon.render !== classic.render, "cartoon renderer must be independent from classic renderer");

const sections = new Set(cartoon.sectionContract);
assert(sections.size === WEDDING_SECTION_IDS.length, "cartoon section contract size mismatch");
for (const sectionId of WEDDING_SECTION_IDS) {
  assert(sections.has(sectionId), `cartoon template missing canonical section: ${sectionId}`);
}

const compatibility = validateTemplateCompatibility("cartoon-001", [...WEDDING_SECTION_IDS]);
assert(compatibility.ok, "cartoon template must accept the canonical wedding section set");
assert(compatibility.unsupported.length === 0, "canonical sections must not be unsupported");

const active = getActiveTemplates();
assert(active.length >= 2, "Phase 7.2 requires at least two active template experiences");
assert(
  active.some((item) => item.id === "classic-001") && active.some((item) => item.id === "cartoon-001"),
  "classic and cartoon templates must both be active"
);

const source = readFileSync("templates/cartoon-001/CartoonLoveStoryTemplate.tsx", "utf8");
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
  assert(source.includes(sharedComponent), `cartoon renderer must reuse shared ${sharedComponent}`);
}
assert(!source.includes('fetch("/api/'), "cartoon renderer must not duplicate public business API logic");
assert(source.includes('data-endriya-experience="illustrated-motion"'), "cartoon experience marker missing");

const css = readFileSync("templates/cartoon-001/CartoonLoveStoryTemplate.module.css", "utf8");
assert(css.includes("prefers-reduced-motion: reduce"), "cartoon CSS must honor reduced motion");
assert(css.includes("character-bob"), "cartoon template should have character motion");
assert(css.includes("heart-pulse"), "cartoon template should have playful micro-motion");

const registryEntry = TEMPLATE_REGISTRY["cartoon-001"];
assert(registryEntry.tags.includes("cartoon"), "cartoon catalog tag missing");
assert(registryEntry.tags.includes("illustrated"), "illustrated catalog tag missing");
assert(registryEntry.tags.includes("love-story"), "love-story catalog tag missing");

console.log(`Phase 7.2 Cartoon Love Story verification passed (${active.length} active templates).`);
