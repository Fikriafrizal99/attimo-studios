import { WEDDING_SECTION_IDS } from "@/lib/wedding-contract";
import { resolveTemplate } from "@/templates/registry";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const template = resolveTemplate("classic-001");

assert(template.id === "classic-001", "Template 001 id must stay stable");
assert(template.name === "Endriya Classic 001", "Template 001 public name changed unexpectedly");
assert(template.status === "active", "Template 001 must remain active");
assert(template.visualTier === "2d", "Template 001 must remain in the 2D visual tier");
assert(template.contentSchemaVersion === 1, "Template 001 must consume wedding content schema v1");
assert(template.performance.renderingMode === "dom", "Template 001 must use DOM rendering");
assert(template.performance.mobileProfile === "full", "Template 001 must support the full mobile profile");
assert(template.performance.reducedMotionFallback === true, "Template 001 must keep reduced-motion fallback");
assert(template.render.name === "Classic001Template", "Template 001 must resolve the packaged Classic001Template renderer");

const sections = new Set(template.sectionContract);
assert(sections.size === WEDDING_SECTION_IDS.length, "Template 001 section contract size is invalid");
for (const sectionId of WEDDING_SECTION_IDS) {
  assert(sections.has(sectionId), `Template 001 is missing canonical section: ${sectionId}`);
}

console.log("Phase 3.4 Endriya Classic 001 verification passed.");
