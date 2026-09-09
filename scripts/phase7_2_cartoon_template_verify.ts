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

assert(cartoon.status === "active", "cartoon-001 must be active");
assert(cartoon.category === "Illustrated", "cartoon-001 must be in Illustrated category");
assert(cartoon.family === "cartoon-love-story", "cartoon-001 family mismatch");
assert(cartoon.visualTier === "2d", "cartoon-001 must remain 2D");
assert(cartoon.performance.renderingMode === "dom", "cartoon-001 should remain DOM based");
assert(cartoon.performance.mobileProfile === "full", "cartoon-001 should be fully supported on mobile");
assert(cartoon.performance.reducedMotionFallback, "cartoon-001 needs reduced-motion fallback");
assert(cartoon.typography.display === "parisienne", "cartoon display font should be Parisienne");
assert(cartoon.typography.heading === "nunito", "cartoon heading font should be Nunito");
assert(cartoon.typography.body === "nunito", "cartoon body font should be Nunito");
assert(cartoon.performance.budget.experienceJsKb > 0, "cartoon must declare a performance budget");

const runtime = readFileSync("components/invitation/TemplateRuntime.tsx", "utf8");
assert(runtime.includes('"cartoon-001": dynamic('), "cartoon renderer must be independently code-split");
assert(runtime.includes("CartoonLoveStoryTemplate"), "cartoon runtime mapping missing");

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
assert(source.includes("Studio2DTemplate"), "cartoon renderer must use the shared Studio2D renderer");
assert(source.includes('variant: "cartoon"'), "cartoon studio variant missing");
assert(source.includes('experience: "studio-illustrated-photo"'), "cartoon experience marker missing");
assert(!source.includes('fetch("/api/'), "cartoon renderer must not duplicate public business API logic");

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
assert(sharedSource.includes("hero?.coverImage"), "Studio2D hero must support customer cover photos");
assert(sharedSource.includes("guest?.displayName"), "Studio2D hero must preserve guest personalization");

const css = readFileSync("templates/studio-2d/Studio2DTemplate.module.css", "utf8");
assert(css.includes("prefers-reduced-motion:reduce"), "Studio2D CSS must honor reduced motion");
assert(css.includes('[data-studio-variant="cartoon"]'), "Studio2D CSS must preserve a cartoon-specific art direction");
assert(css.includes("object-fit:cover"), "Studio2D cover photos must use cover framing");

const registryEntry = TEMPLATE_REGISTRY["cartoon-001"];
assert(registryEntry.tags.includes("cartoon"), "cartoon catalog tag missing");
assert(registryEntry.tags.includes("illustrated"), "illustrated catalog tag missing");
assert(registryEntry.tags.includes("love-story"), "love-story catalog tag missing");

console.log(`Phase 7.2 Cartoon Love Story verification passed (${active.length} active templates).`);
