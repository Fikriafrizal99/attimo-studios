"use client";

import { Studio2DTemplate } from "@/templates/studio-2d/Studio2DTemplate";
import type { TemplateRenderProps } from "@/templates/types";

const CONFIG = {
  variant: "cartoon",
  templateId: "cartoon-001",
  experience: "studio-illustrated-photo",
  typography: "parisienne+nunito",
} as const;

export function CartoonLoveStoryTemplate(props: TemplateRenderProps) {
  return <Studio2DTemplate {...props} config={CONFIG} />;
}
