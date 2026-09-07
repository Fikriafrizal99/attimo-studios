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

const classic = resolveTemplate("classic-001");
const cartoon = resolveTemplate("cartoon-001");
const storybook = resolveTemplate("storybook-001");

assert(storybook.status === "active", "storybook-001 must be active");
assert(storybook.category === "Illustrated", "storybook-001 must be in Illustrated category");
assert(storybook.family === "storybook-romance", "storybook-001 family mismatch");
assert(storybook.visualTier === "2d", "storybook-001 must be Motion 2D");
assert(storybook.performance.renderingMode === "dom", "storybook-001 should remain DOM based");
assert(storybook.performance.motionLevel === "rich", "storybook-001 must declare rich motion");
assert(storybook.performance.mobileProfile === "full", "storybook-001 should be fully supported on mobile");
assert(storybook.performance.reducedMotionFallback, "storybook-001 needs reduced-motion fallback");
assert(storybook.typography.display === "parisienne", "storybook display font should be Parisienne");
assert(storybook.typography.heading === "cormorant-garamond", "storybook heading font should be Cormorant Garamond");
assert(storybook.typography.body === "lora", "storybook body font should be Lora");
assert(storybook.render !== classic.render, "storybook renderer must differ from classic renderer");
assert(storybook.render !== cartoon.render, "storybook renderer must differ from cartoon renderer");

const sections = new Set(storybook.sectionContract);
assert(sections.size === WEDDING_SECTION_IDS.length, "storybook section contract size mismatch");
for (const sectionId of WEDDING_SECTION_IDS) {
  assert(sections.has(sectionId), `storybook template missing canonical section: ${sectionId}`);
}

const compatibility = validateTemplateCompatibility("storybook-001", [...WEDDING_SECTION_IDS]);
assert(compatibility.ok, "storybook template must accept the canonical wedding section set");
assert(compatibility.unsupported.length === 0, "canonical sections must not be unsupported");

const active = getActiveTemplates();
assert(active.length >= 3, "Phase 7.3 requires at least three active template experiences");
for (const required of ["classic-001", "cartoon-001", "storybook-001"]) {
  assert(active.some((item) => item.id === required), `${required} must remain active`);
}

const source = readFileSync("templates/storybook-001/StorybookRomanceTemplate.tsx", "utf8");
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
  assert(source.includes(sharedComponent), `storybook renderer must reuse shared ${sharedComponent}`);
}
assert(!source.includes('fetch("/api/'), "storybook renderer must not duplicate public business API logic");
assert(source.includes('data-endriya-experience="storybook-motion"'), "storybook experience marker missing");
assert(source.includes("ChapterFrame"), "storybook must provide chapter framing");
assert(source.includes("heroBook"), "storybook must provide a book-based hero composition");

const css = readFileSync("templates/storybook-001/StorybookRomanceTemplate.module.css", "utf8");
assert(css.includes("prefers-reduced-motion: reduce"), "storybook CSS must honor reduced motion");
assert(css.includes("bookArrive"), "storybook should define book entrance motion");
assert(css.includes("pageReveal"), "storybook should define chapter/page reveal motion");
assert(css.includes("bookSpine"), "storybook should include a desktop book-spread treatment");

const registryEntry = TEMPLATE_REGISTRY["storybook-001"];
for (const tag of ["storybook", "romance", "illustrated", "chapter", "motion"]) {
  assert(registryEntry.tags.includes(tag), `storybook catalog tag missing: ${tag}`);
}

console.log(`Phase 7.3 Storybook Romance verification passed (${active.length} active templates).`);
