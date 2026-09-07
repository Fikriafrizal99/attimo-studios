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

const clay = resolveTemplate("clay-001");
assert(clay.status === "active", "clay-001 must be active");
assert(clay.family === "clay-couple", "clay family mismatch");
assert(clay.category === "Whimsical", "clay category mismatch");
assert(clay.visualTier === "3d", "clay must declare 3d visual tier");
assert(clay.performance.renderingMode === "webgl", "clay must declare WebGL rendering");
assert(clay.performance.motionLevel === "immersive", "clay must declare immersive motion");
assert(clay.performance.mobileProfile === "adaptive", "clay must adapt on mobile");
assert(clay.performance.reducedMotionFallback, "clay needs reduced-motion fallback");
assert(clay.typography.display === "sacramento", "clay display font mismatch");
assert(clay.typography.heading === "nunito", "clay heading font mismatch");
assert(clay.typography.body === "nunito", "clay body font mismatch");

const sections = new Set(clay.sectionContract);
assert(sections.size === WEDDING_SECTION_IDS.length, "clay section contract size mismatch");
for (const sectionId of WEDDING_SECTION_IDS) {
  assert(sections.has(sectionId), `clay missing canonical section: ${sectionId}`);
}
assert(validateTemplateCompatibility("clay-001", [...WEDDING_SECTION_IDS]).ok, "clay canonical compatibility failed");
assert(getActiveTemplatesByTier("3d").some((item) => item.id === "clay-001"), "3d tier must expose clay-001");
assert(getActiveTemplates().length >= 6, "Phase 7.6 requires six active production experiences");

const source = readFileSync("templates/clay-001/ClayCoupleTemplate.tsx", "utf8");
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
  assert(source.includes(sharedComponent), `clay renderer must reuse shared ${sharedComponent}`);
}
assert(!source.includes('fetch("/api/'), "clay must not duplicate public business API logic");
assert(source.includes('data-endriya-experience="clay-couple-webgl"'), "clay experience marker missing");
assert(source.includes('data-endriya-progressive-enhancement="dom-core-webgl-scene"'), "clay progressive enhancement marker missing");
assert(source.includes('getContext("webgl"'), "clay must create a WebGL context");
assert(source.includes("VERTEX_SHADER"), "clay must compile a vertex shader");
assert(source.includes("FRAGMENT_SHADER"), "clay must compile a fragment shader");
assert(source.includes("gl.drawArrays(gl.POINTS"), "clay must render the 3d character scene");
assert(source.includes("requestAnimationFrame"), "clay immersive orbit must use requestAnimationFrame");
assert(source.includes("prefers-reduced-motion: reduce"), "clay runtime must detect reduced motion");
assert(source.includes("clayFallback"), "clay must keep a DOM fallback if WebGL is unavailable");
assert(source.includes("pointerRef"), "clay pointer orbit must not recreate the WebGL context");

const css = readFileSync("templates/clay-001/ClayCoupleTemplate.module.css", "utf8");
assert(css.includes(".webglCanvas"), "clay WebGL canvas styling missing");
assert(css.includes(".clayFallback"), "clay fallback styling missing");
assert(css.includes("perspective: 1100px"), "clay scene shell needs depth perspective");
assert(css.includes("prefers-reduced-motion: reduce"), "clay CSS must honor reduced motion");
assert(css.includes("@media (max-width: 640px)"), "clay needs explicit mobile adaptation");

const typographyLoader = readFileSync("components/invitation/InvitationTypography.tsx", "utf8");
assert(typographyLoader.includes("Sacramento"), "Sacramento must be loaded at invitation boundary");
assert(typographyLoader.includes("--font-endriya-sacramento"), "Sacramento CSS variable mapping missing");

for (const tag of ["clay", "character", "3d", "webgl", "whimsical", "immersive"]) {
  assert(clay.tags.includes(tag), `clay catalog tag missing: ${tag}`);
}

console.log(`Phase 7.6 Clay Couple verification passed (${getActiveTemplates().length} active templates).`);
