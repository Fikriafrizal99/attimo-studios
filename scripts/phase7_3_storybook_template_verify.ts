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

const storybook = resolveTemplate("storybook-001");

assert(storybook.status === "active", "storybook-001 must be active");
assert(storybook.category === "Illustrated", "storybook-001 must be in Illustrated category");
assert(storybook.family === "storybook-romance", "storybook-001 family mismatch");
assert(storybook.visualTier === "2d", "storybook-001 must remain 2D");
assert(storybook.performance.renderingMode === "dom", "storybook-001 should remain DOM based");
assert(storybook.performance.mobileProfile === "full", "storybook-001 should be fully supported on mobile");
assert(storybook.performance.reducedMotionFallback, "storybook-001 needs reduced-motion fallback");
assert(storybook.typography.display === "parisienne", "storybook display font should be Parisienne");
assert(storybook.typography.heading === "cormorant-garamond", "storybook heading font should be Cormorant Garamond");
assert(storybook.typography.body === "lora", "storybook body font should be Lora");
assert(storybook.performance.budget.experienceJsKb > 0, "storybook must declare a performance budget");

const runtime = readFileSync("components/invitation/TemplateRuntime.tsx", "utf8");
assert(runtime.includes('"storybook-001": dynamic('), "storybook renderer must be independently code-split");
assert(runtime.includes("StorybookRomanceTemplate"), "storybook runtime mapping missing");

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
assert(source.includes("Studio2DTemplate"), "storybook renderer must use the shared Studio2D renderer");
assert(source.includes('variant: "storybook"'), "storybook studio variant missing");
assert(source.includes('experience: "studio-storybook-photo"'), "storybook experience marker missing");
assert(!source.includes('fetch("/api/'), "storybook renderer must not duplicate public business API logic");

const sharedSource = readFileSync("templates/studio-2d/Studio2DTemplate.tsx", "utf8");
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
  assert(sharedSource.includes(sharedComponent), `Studio2D renderer must reuse shared ${sharedComponent}`);
}
assert(sharedSource.includes("Chapter I · The Two of Us"), "storybook variant must preserve chapter language");
assert(sharedSource.includes("ClosingPanel"), "Studio2D story must include a closing composition");

const css = readFileSync("templates/studio-2d/Studio2DTemplate.module.css", "utf8");
assert(css.includes("prefers-reduced-motion:reduce"), "Studio2D CSS must honor reduced motion");
assert(css.includes('[data-studio-variant="storybook"]'), "Studio2D CSS must preserve a storybook-specific art direction");
assert(css.includes("❦"), "storybook treatment should retain a restrained botanical/book accent");

const registryEntry = TEMPLATE_REGISTRY["storybook-001"];
for (const tag of ["storybook", "romance", "illustrated", "chapter", "motion"]) {
  assert(registryEntry.tags.includes(tag), `storybook catalog tag missing: ${tag}`);
}

console.log(`Phase 7.3 Storybook Romance verification passed (${active.length} active templates).`);
