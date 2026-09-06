import { WEDDING_SECTION_IDS } from "@/lib/wedding-contract";
import {
  TEMPLATE_REGISTRY,
  getActiveTemplates,
  getActiveTemplatesByTier,
  resolveTemplate,
} from "@/templates/registry";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const entries = Object.entries(TEMPLATE_REGISTRY);
assert(entries.length > 0, "template registry must not be empty");

for (const [registryKey, template] of entries) {
  assert(registryKey === template.id, `registry key must equal template id: ${registryKey}`);
  assert(template.contentSchemaVersion === 1, `template must use content schema v1: ${template.id}`);
  assert(template.performance.reducedMotionFallback === true, `template needs reduced motion fallback: ${template.id}`);

  const uniqueSections = new Set(template.sectionContract);
  assert(uniqueSections.size === template.sectionContract.length, `template section contract has duplicates: ${template.id}`);

  if (template.status === "active") {
    assert(
      template.sectionContract.length === WEDDING_SECTION_IDS.length &&
        WEDDING_SECTION_IDS.every((sectionId) => uniqueSections.has(sectionId)),
      `active template must implement every canonical section: ${template.id}`
    );
  }
}

const active = getActiveTemplates();
assert(active.length > 0, "at least one active template is required");
assert(active.every((template) => template.status === "active"), "getActiveTemplates returned a non-active template");
assert(getActiveTemplatesByTier("2d").every((template) => template.visualTier === "2d"), "2d tier filter is invalid");
assert(getActiveTemplatesByTier("2.5d").every((template) => template.visualTier === "2.5d"), "2.5d tier filter is invalid");
assert(getActiveTemplatesByTier("3d").every((template) => template.visualTier === "3d"), "3d tier filter is invalid");

assert(resolveTemplate("classic-001").id === "classic-001", "classic-001 must resolve while active");

let draftRejected = false;
try {
  resolveTemplate("minimal-001");
} catch {
  draftRejected = true;
}
assert(draftRejected, "draft templates must not resolve as active templates");

console.log(`Phase 3.3 template registry verification passed (${active.length} active template).`);
