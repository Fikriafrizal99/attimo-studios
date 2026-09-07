import { existsSync, readFileSync } from "node:fs";
import { WEDDING_SECTION_IDS } from "@/lib/wedding-contract";
import { TEMPLATE_PREVIEW_SECTIONS } from "@/lib/commerce/template-preview-fixture";
import {
  getActiveTemplates,
  getTemplateRegistrySnapshot,
  resolveTemplate,
  validateTemplateCompatibility,
} from "@/templates/registry";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const active = getActiveTemplates();
const snapshot = getTemplateRegistrySnapshot();
assert(active.length >= 7, `Phase 7 completion requires at least 7 active experiences, got ${active.length}`);
assert(new Set(active.map((item) => item.family)).size >= 6, "Active templates must span multiple distinct families");
assert(new Set(active.map((item) => item.category)).size >= 5, "Active templates must span multiple categories");

for (const tier of ["2d", "2.5d", "3d"] as const) {
  assert(active.some((item) => item.visualTier === tier), `Active catalog must include visual tier ${tier}`);
}

for (const template of active) {
  assert(template.thumbnail?.startsWith("/api/template-thumbnails/"), `${template.id} thumbnail metadata missing`);
  assert(template.previewPath === `/dashboard/templates/${template.id}/preview`, `${template.id} preview metadata mismatch`);
  assert(template.performance.reducedMotionFallback, `${template.id} missing reduced-motion fallback`);
  assert(["full", "adaptive"].includes(template.performance.mobileProfile), `${template.id} missing mobile profile`);
  assert(["light", "rich", "immersive"].includes(template.performance.motionLevel), `${template.id} missing motion level`);
  assert(["dom", "hybrid", "webgl"].includes(template.performance.renderingMode), `${template.id} missing rendering mode`);

  const compatibility = validateTemplateCompatibility(template.id, TEMPLATE_PREVIEW_SECTIONS.map((section) => section.id));
  assert(compatibility.ok, `${template.id} rejected canonical preview fixture`);
  assert(template.sectionContract.length === WEDDING_SECTION_IDS.length, `${template.id} section count mismatch`);
  for (const sectionId of WEDDING_SECTION_IDS) {
    assert(template.sectionContract.includes(sectionId), `${template.id} missing canonical section ${sectionId}`);
  }
}

const editorial = resolveTemplate("editorial-001");
assert(editorial.family === "editorial-ivory", "Editorial Ivory family mismatch");
assert(editorial.category === "Elegant", "Editorial Ivory category mismatch");
assert(editorial.visualTier === "2d", "Editorial Ivory must remain 2d");
assert(editorial.performance.motionLevel === "light", "Editorial Ivory should use light motion");
assert(editorial.typography.display === "cormorant-garamond", "Editorial display typography mismatch");
assert(editorial.typography.heading === "dm-serif-display", "Editorial heading typography mismatch");
assert(editorial.typography.body === "inter", "Editorial body typography mismatch");

for (const path of [
  "app/dashboard/templates/page.tsx",
  "app/dashboard/templates/[templateId]/preview/page.tsx",
  "app/api/template-thumbnails/[templateId]/route.ts",
  "docs/commerce/TEMPLATE_AUTHORING_GUIDE.md",
]) {
  assert(existsSync(path), `Phase 7 required artifact missing: ${path}`);
}

const catalogSource = readFileSync("app/dashboard/templates/page.tsx", "utf8");
for (const feature of ["category", "tier", "status", "Full preview", "template.tags", "template.performance"]) {
  assert(catalogSource.includes(feature), `Template catalog missing feature marker: ${feature}`);
}

const previewSource = readFileSync("app/dashboard/templates/[templateId]/preview/page.tsx", "utf8");
assert(previewSource.includes("TEMPLATE_PREVIEW_CONTENT"), "Preview route must use shared canonical fixture");
assert(previewSource.includes("InvitationRenderer"), "Preview route must use canonical InvitationRenderer");

const publicRoute = readFileSync("app/invite/[slug]/page.tsx", "utf8");
assert(publicRoute.includes("InvitationRenderer"), "Public route must remain renderer-driven");
for (const templateId of ["cartoon-001", "storybook-001", "paper-cut-001", "pasundan-001", "clay-001", "editorial-001"]) {
  assert(!publicRoute.includes(templateId), `Public route must not special-case ${templateId}`);
}

const authoring = readFileSync("docs/commerce/TEMPLATE_AUTHORING_GUIDE.md", "utf8");
for (const rule of ["wedding database schema", "RSVP API/data model", "reduced-motion", "canonical section contract", "visualTier"]) {
  assert(authoring.includes(rule), `Template authoring guide missing rule: ${rule}`);
}

const draft = snapshot.find((item) => item.id === "minimal-001");
assert(draft?.status === "draft", "Legacy minimal experiment should remain draft until its canonical contract is completed or archived");

console.log(`Phase 7 catalog completion verification passed (${active.length} active templates, ${snapshot.length} registry entries).`);
