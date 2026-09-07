import { CartoonLoveStoryTemplate } from "@/templates/cartoon-001/CartoonLoveStoryTemplate";
import { Classic001Template } from "@/templates/classic-001/Classic001Template";
import { ClayCoupleTemplate } from "@/templates/clay-001/ClayCoupleTemplate";
import { EditorialIvoryTemplate } from "@/templates/editorial-001/EditorialIvoryTemplate";
import { Minimal001Template } from "@/templates/minimal-001/Minimal001Template";
import { PaperCutGardenTemplate } from "@/templates/paper-cut-001/PaperCutGardenTemplate";
import { PasundanStorylandTemplate } from "@/templates/pasundan-001/PasundanStorylandTemplate";
import { StorybookRomanceTemplate } from "@/templates/storybook-001/StorybookRomanceTemplate";
import { WEDDING_SECTION_IDS, type WeddingSectionId } from "@/lib/wedding-contract";
import { validateTemplateTypography } from "@/templates/typography/catalog";
import type { TemplateDefinition, TemplateVisualTier } from "@/templates/types";

const TEMPLATE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*-\d{3}$/;
const FULL_SECTION_CONTRACT = [...WEDDING_SECTION_IDS] as const;

function hasFullSectionContract(sectionContract: readonly WeddingSectionId[]): boolean {
  return sectionContract.length === WEDDING_SECTION_IDS.length && WEDDING_SECTION_IDS.every((sectionId) => sectionContract.includes(sectionId));
}

function defineTemplate(definition: TemplateDefinition): TemplateDefinition {
  if (!TEMPLATE_ID_PATTERN.test(definition.id)) throw new Error(`Invalid template id: ${definition.id}`);
  if (!Number.isInteger(definition.version) || definition.version < 1) throw new Error(`Invalid template version: ${definition.id}`);
  if (definition.contentSchemaVersion !== 1) throw new Error(`Unsupported content schema for template: ${definition.id}`);
  if (definition.status === "active" && !hasFullSectionContract(definition.sectionContract)) throw new Error(`Active template must implement the full wedding section contract: ${definition.id}`);
  if (!definition.performance.reducedMotionFallback) throw new Error(`Template must provide a reduced-motion fallback: ${definition.id}`);
  validateTemplateTypography(definition.typography);

  return Object.freeze({
    ...definition,
    thumbnail: definition.thumbnail ?? `/api/template-thumbnails/${definition.id}`,
    previewPath: definition.previewPath ?? `/dashboard/templates/${definition.id}/preview`,
  });
}

const FALLBACK = { display: "playfair-display", heading: "playfair-display", body: "inter" } as const;

export const TEMPLATE_REGISTRY: Readonly<Record<string, TemplateDefinition>> = Object.freeze({
  "classic-001": defineTemplate({
    id: "classic-001", name: "Endriya Classic 001", family: "classic", category: "Classic",
    tags: ["classic", "romantic", "motion"], version: 1, status: "active", visualTier: "2d",
    typography: { display: "allura", heading: "cormorant-garamond", body: "lora", accent: "allura", fallback: FALLBACK },
    contentSchemaVersion: 1, sectionContract: FULL_SECTION_CONTRACT,
    performance: { renderingMode: "dom", motionLevel: "rich", mobileProfile: "full", reducedMotionFallback: true },
    render: Classic001Template,
  }),
  "editorial-001": defineTemplate({
    id: "editorial-001", name: "Endriya Editorial Ivory 001", family: "editorial-ivory", category: "Elegant",
    tags: ["editorial", "ivory", "elegant", "luxury", "minimal", "2d"], version: 1, status: "active", visualTier: "2d",
    typography: { display: "cormorant-garamond", heading: "dm-serif-display", body: "inter", accent: "cormorant-garamond", fallback: FALLBACK },
    contentSchemaVersion: 1, sectionContract: FULL_SECTION_CONTRACT,
    performance: { renderingMode: "dom", motionLevel: "light", mobileProfile: "full", reducedMotionFallback: true },
    render: EditorialIvoryTemplate,
  }),
  "cartoon-001": defineTemplate({
    id: "cartoon-001", name: "Endriya Cartoon Love Story 001", family: "cartoon-love-story", category: "Illustrated",
    tags: ["cartoon", "illustrated", "playful", "motion", "love-story"], version: 1, status: "active", visualTier: "2d",
    typography: { display: "parisienne", heading: "nunito", body: "nunito", accent: "parisienne", fallback: FALLBACK },
    contentSchemaVersion: 1, sectionContract: FULL_SECTION_CONTRACT,
    performance: { renderingMode: "dom", motionLevel: "rich", mobileProfile: "full", reducedMotionFallback: true },
    render: CartoonLoveStoryTemplate,
  }),
  "storybook-001": defineTemplate({
    id: "storybook-001", name: "Endriya Storybook Romance 001", family: "storybook-romance", category: "Illustrated",
    tags: ["storybook", "romance", "illustrated", "chapter", "motion"], version: 1, status: "active", visualTier: "2d",
    typography: { display: "parisienne", heading: "cormorant-garamond", body: "lora", accent: "parisienne", fallback: FALLBACK },
    contentSchemaVersion: 1, sectionContract: FULL_SECTION_CONTRACT,
    performance: { renderingMode: "dom", motionLevel: "rich", mobileProfile: "full", reducedMotionFallback: true },
    render: StorybookRomanceTemplate,
  }),
  "paper-cut-001": defineTemplate({
    id: "paper-cut-001", name: "Endriya Paper Cut Garden 001", family: "paper-cut-garden", category: "Whimsical",
    tags: ["paper-cut", "garden", "layered", "parallax", "2.5d", "whimsical"], version: 1, status: "active", visualTier: "2.5d",
    typography: { display: "allura", heading: "dm-serif-display", body: "inter", accent: "allura", fallback: FALLBACK },
    contentSchemaVersion: 1, sectionContract: FULL_SECTION_CONTRACT,
    performance: { renderingMode: "hybrid", motionLevel: "rich", mobileProfile: "adaptive", reducedMotionFallback: true },
    render: PaperCutGardenTemplate,
  }),
  "pasundan-001": defineTemplate({
    id: "pasundan-001", name: "Endriya Pasundan Storyland 001", family: "pasundan-storyland", category: "Heritage Nusantara",
    tags: ["sunda", "pasundan", "heritage", "priangan", "parallax", "2.5d", "nusantara"], version: 1, status: "active", visualTier: "2.5d",
    typography: { display: "cinzel-decorative", heading: "cormorant-garamond", body: "lora", accent: "cinzel-decorative", fallback: FALLBACK },
    contentSchemaVersion: 1, sectionContract: FULL_SECTION_CONTRACT,
    performance: { renderingMode: "hybrid", motionLevel: "rich", mobileProfile: "adaptive", reducedMotionFallback: true },
    render: PasundanStorylandTemplate,
  }),
  "clay-001": defineTemplate({
    id: "clay-001", name: "Endriya Clay Couple 001", family: "clay-couple", category: "Whimsical",
    tags: ["clay", "character", "3d", "webgl", "whimsical", "immersive"], version: 1, status: "active", visualTier: "3d",
    typography: { display: "sacramento", heading: "nunito", body: "nunito", accent: "sacramento", fallback: FALLBACK },
    contentSchemaVersion: 1, sectionContract: FULL_SECTION_CONTRACT,
    performance: { renderingMode: "webgl", motionLevel: "immersive", mobileProfile: "adaptive", reducedMotionFallback: true },
    render: ClayCoupleTemplate,
  }),
  "minimal-001": defineTemplate({
    id: "minimal-001", name: "Endriya Minimal 001", family: "minimal-editorial", category: "Modern",
    tags: ["modern", "editorial", "minimal"], version: 1, status: "draft", visualTier: "2d",
    typography: { display: "cormorant-garamond", heading: "dm-serif-display", body: "inter", fallback: FALLBACK },
    contentSchemaVersion: 1,
    sectionContract: ["hero", "couple", "location", "story", "gallery", "rsvp", "wishes", "gift", "music"],
    performance: { renderingMode: "dom", motionLevel: "light", mobileProfile: "full", reducedMotionFallback: true },
    render: Minimal001Template,
  }),
});

export class TemplateNotAvailableError extends Error {
  constructor(public readonly templateId: string) {
    super(`Template is not available: ${templateId}`);
    this.name = "TemplateNotAvailableError";
  }
}

export function resolveTemplate(templateId: string): TemplateDefinition {
  const definition = TEMPLATE_REGISTRY[templateId];
  if (!definition || definition.status !== "active") throw new TemplateNotAvailableError(templateId);
  return definition;
}

export function getActiveTemplates(): TemplateDefinition[] {
  return Object.values(TEMPLATE_REGISTRY).filter((item) => item.status === "active");
}

export function getActiveTemplatesByTier(visualTier: TemplateVisualTier): TemplateDefinition[] {
  return getActiveTemplates().filter((item) => item.visualTier === visualTier);
}

export function validateTemplateCompatibility(templateId: string, sectionIds: string[]) {
  const template = resolveTemplate(templateId);
  const canonical = new Set<string>(WEDDING_SECTION_IDS);
  const unsupported = sectionIds.filter((id) => !canonical.has(id));
  return { template, unsupported, missingRequired: [] as string[], ok: unsupported.length === 0 };
}

export function getTemplateRegistrySnapshot() {
  return Object.values(TEMPLATE_REGISTRY).map(({ render: _render, ...definition }) => definition);
}
