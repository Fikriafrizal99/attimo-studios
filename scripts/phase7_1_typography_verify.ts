import { TEMPLATE_REGISTRY } from "@/templates/registry";
import {
  DEFAULT_TEMPLATE_TYPOGRAPHY,
  WEDDING_FONT_IDS,
  WEDDING_FONT_REGISTRY,
  validateTemplateTypography,
} from "@/templates/typography/catalog";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(WEDDING_FONT_IDS.length >= 8, "wedding font registry should contain the curated Phase 7 set");

for (const fontId of WEDDING_FONT_IDS) {
  const font = WEDDING_FONT_REGISTRY[fontId];
  assert(font.id === fontId, `font registry key mismatch: ${fontId}`);
  assert(font.source === "Google Fonts", `font source must be explicit: ${fontId}`);
  assert(font.license === "OFL-1.1", `font license must be commercially reviewable: ${fontId}`);
  assert(font.roles.length > 0, `font must have at least one approved role: ${fontId}`);
}

validateTemplateTypography(DEFAULT_TEMPLATE_TYPOGRAPHY);

for (const template of Object.values(TEMPLATE_REGISTRY)) {
  validateTemplateTypography(template.typography);
  assert(template.typography.fallback.display === "playfair-display", `display fallback must be Playfair: ${template.id}`);
  assert(template.typography.fallback.heading === "playfair-display", `heading fallback must be Playfair: ${template.id}`);
  assert(template.typography.fallback.body === "inter", `body fallback must be Inter: ${template.id}`);
}

const classic = TEMPLATE_REGISTRY["classic-001"];
assert(classic.typography.display === "allura", "classic display font should be Allura");
assert(classic.typography.heading === "cormorant-garamond", "classic heading font should be Cormorant Garamond");
assert(classic.typography.body === "lora", "classic body font should be Lora");

const editorial = TEMPLATE_REGISTRY["minimal-001"];
assert(editorial.typography.display === "cormorant-garamond", "editorial display font should be Cormorant Garamond");
assert(editorial.typography.heading === "dm-serif-display", "editorial heading font should be DM Serif Display");
assert(editorial.typography.body === "inter", "editorial body font should remain Inter");

console.log(`Phase 7.1 wedding typography verification passed (${WEDDING_FONT_IDS.length} curated fonts).`);
