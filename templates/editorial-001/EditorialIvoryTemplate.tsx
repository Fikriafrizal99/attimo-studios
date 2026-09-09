"use client";

import { Studio2DTemplate } from "@/templates/studio-2d/Studio2DTemplate";
import type { TemplateRenderProps } from "@/templates/types";

const CONFIG = {
  variant: "editorial",
  templateId: "editorial-001",
  experience: "studio-editorial-photo",
  typography: "cormorant-garamond+dm-serif-display+inter",
} as const;

export function EditorialIvoryTemplate(props: TemplateRenderProps) {
  return <Studio2DTemplate {...props} config={CONFIG} />;
}
