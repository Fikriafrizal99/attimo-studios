import type { ComponentType } from "react";
import type {
  CanonicalWeddingContent,
  SectionConfig,
  WeddingSectionId,
} from "@/lib/wedding-contract";

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

export type TemplatePerformanceProfile = {
  renderingMode: TemplateRenderingMode;
  motionLevel: TemplateMotionLevel;
  mobileProfile: TemplateMobileProfile;
  reducedMotionFallback: boolean;
};

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
  /** Wedding content schema consumed by the renderer. */
  contentSchemaVersion: 1;
  /** Every active template must implement the complete canonical section contract. */
  sectionContract: readonly WeddingSectionId[];
  thumbnail?: string;
  previewPath?: string;
  performance: TemplatePerformanceProfile;
  render: ComponentType<TemplateRenderProps>;
};
