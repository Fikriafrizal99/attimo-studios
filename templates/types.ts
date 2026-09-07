import type {
  CanonicalWeddingContent,
  SectionConfig,
  WeddingSectionId,
} from "@/lib/wedding-contract";
import type { TemplateTypography } from "@/templates/typography/catalog";

export const TEMPLATE_VISUAL_TIERS = ["2d", "2.5d", "3d"] as const;
export type TemplateVisualTier = (typeof TEMPLATE_VISUAL_TIERS)[number];

export type TemplateStatus = "draft" | "active" | "archived";
export type TemplateRenderingMode = "dom" | "hybrid" | "webgl";
export type TemplateMotionLevel = "light" | "rich" | "immersive";
export type TemplateMobileProfile = "full" | "adaptive";

export type PublicGuestContext = {
  id: string;
  token: string;
  displayName: string;
  maxGuests: number;
};

export type ThemeConfig = Record<string, unknown>;

export type TemplateRenderProps = {
  weddingId: string;
  publicSlug?: string;
  content: CanonicalWeddingContent;
  sections: SectionConfig[];
  theme?: ThemeConfig;
  guest?: PublicGuestContext;
};

export type TemplatePerformanceBudget = {
  /** Target client-side JS attributable to the experience chunk, excluding shared framework runtime. */
  experienceJsKb: number;
  /** Recommended aggregate wedding-controlled media budget before operator warning. */
  mediaKb: number;
  /** Rendering DPR cap for custom canvas/WebGL code. DOM templates keep this at 1. */
  maxDevicePixelRatio: number;
};

export type TemplatePerformanceProfile = {
  renderingMode: TemplateRenderingMode;
  motionLevel: TemplateMotionLevel;
  mobileProfile: TemplateMobileProfile;
  reducedMotionFallback: boolean;
  budget: TemplatePerformanceBudget;
};

/**
 * Pure catalog metadata. Runtime renderer modules are intentionally kept out
 * of this type/registry so a 2D invitation never has to statically reference
 * 2.5D/3D client implementations merely to resolve template metadata.
 */
export type TemplateDefinition = {
  /** Stable database-facing identifier. Never rename after release. */
  id: string;
  /** Customer-facing template name. */
  name: string;
  family: string;
  category: string;
  tags: readonly string[];
  version: number;
  status: TemplateStatus;
  /** Commercial visual class. Features are identical across all tiers. */
  visualTier: TemplateVisualTier;
  /** Curated typography identity. Font files/loaders remain invitation-scoped. */
  typography: TemplateTypography;
  /** Wedding content schema consumed by the renderer. */
  contentSchemaVersion: 1;
  /** Every active template must implement the complete canonical section contract. */
  sectionContract: readonly WeddingSectionId[];
  thumbnail?: string;
  previewPath?: string;
  performance: TemplatePerformanceProfile;
};
