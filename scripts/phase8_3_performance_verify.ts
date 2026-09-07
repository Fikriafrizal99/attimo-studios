import { readFileSync } from "node:fs";
import { getActiveTemplates } from "../templates/registry";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function expect(source: string, marker: string, label: string) {
  if (!source.includes(marker)) throw new Error(`${label} missing marker: ${marker}`);
}

const active = getActiveTemplates();
if (active.length < 7) throw new Error("Phase 8 performance verification expects the Phase 7 active catalog");

for (const template of active) {
  const budget = template.performance.budget;
  if (!(budget.experienceJsKb > 0 && budget.experienceJsKb <= 250)) {
    throw new Error(`${template.id} has invalid experience JS budget`);
  }
  if (!(budget.mediaKb >= 1000 && budget.mediaKb <= 10000)) {
    throw new Error(`${template.id} has invalid media budget`);
  }
  if (!(budget.maxDevicePixelRatio >= 1 && budget.maxDevicePixelRatio <= 2)) {
    throw new Error(`${template.id} has invalid DPR budget`);
  }
  if (template.visualTier === "3d" && template.performance.renderingMode !== "webgl") {
    throw new Error(`${template.id} 3D template must explicitly declare webgl rendering`);
  }
  if (template.visualTier !== "2d" && template.performance.mobileProfile !== "adaptive") {
    throw new Error(`${template.id} non-2D template must use adaptive mobile profile`);
  }
  if (!template.performance.reducedMotionFallback) {
    throw new Error(`${template.id} must retain reduced-motion fallback`);
  }
}

const runtime = read("components/invitation/TemplateRuntime.tsx");
expect(runtime, 'import dynamic from "next/dynamic"', "template runtime");
for (const id of active.map((item) => item.id)) {
  expect(runtime, `"${id}": dynamic(`, `code-split runtime ${id}`);
}
expect(runtime, "Never replace these imports with a dynamic path", "static bundler analysis rule");

const registry = read("templates/registry.tsx");
if (/from \"@\/templates\/.+Template/.test(registry)) {
  throw new Error("Template metadata registry must not statically import renderer modules");
}
expect(registry, "BUDGET_2D_LIGHT", "2D performance budget");
expect(registry, "BUDGET_25D", "2.5D performance budget");
expect(registry, "BUDGET_3D", "3D performance budget");

const gallery = read("components/GallerySection.tsx");
expect(gallery, 'loading="lazy"', "gallery lazy loading");
expect(gallery, 'decoding="async"', "gallery async decoding");
expect(gallery, 'fetchPriority="low"', "gallery low fetch priority");

const clay = read("templates/clay-001/ClayCoupleTemplate.tsx");
expect(clay, "CLAY_MAX_DEVICE_PIXEL_RATIO = 1.5", "Clay DPR cap");
expect(clay, "prefers-reduced-motion: reduce", "Clay reduced motion");
expect(clay, "requestAnimationFrame", "Clay controlled animation frame");
expect(clay, "fallbackHidden", "Clay WebGL fallback");

for (const path of [
  "templates/paper-cut-001/PaperCutGardenTemplate.tsx",
  "templates/pasundan-001/PasundanStorylandTemplate.tsx",
]) {
  const source = read(path);
  expect(source, "requestAnimationFrame", `${path} frame throttling`);
  expect(source, "prefers-reduced-motion", `${path} reduced motion`);
}

console.log("Phase 8.3 performance hardening verification passed");
