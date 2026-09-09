"use client";

import { Studio2DTemplate } from "@/templates/studio-2d/Studio2DTemplate";
import type { TemplateRenderProps } from "@/templates/types";

const CONFIG = {
  variant: "classic",
  templateId: "classic-001",
  experience: "studio-classic-photo",
  typography: "allura+cormorant-garamond+lora",
} as const;

export function Classic001Template(props: TemplateRenderProps) {
  return <Studio2DTemplate {...props} config={CONFIG} />;
}
