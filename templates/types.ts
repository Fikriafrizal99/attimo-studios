import type { ComponentType } from "react";
import type {
  InvitationExperienceLevel,
  SectionConfig,
  WeddingContent,
} from "@/lib/wedding-defaults";

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
  content: WeddingContent;
  sections: SectionConfig[];
  theme?: ThemeConfig;
  guest?: PublicGuestContext;
};

export type TemplateDefinition = {
  id: string;
  name: string;
  family: string;
  category: string;
  tags: string[];
  version: number;
  status: "draft" | "active" | "archived";
  experienceLevel: InvitationExperienceLevel;
  supportedSections: string[];
  requiredSections?: string[];
  thumbnail?: string;
  render: ComponentType<TemplateRenderProps>;
};
