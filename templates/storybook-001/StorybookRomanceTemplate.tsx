"use client";

import { Studio2DTemplate } from "@/templates/studio-2d/Studio2DTemplate";
import type { TemplateRenderProps } from "@/templates/types";

const CONFIG = {
  variant: "storybook",
  templateId: "storybook-001",
  experience: "studio-storybook-photo",
  typography: "parisienne+cormorant-garamond+lora",
} as const;

export function StorybookRomanceTemplate(props: TemplateRenderProps) {
  return <Studio2DTemplate {...props} config={CONFIG} />;
}
