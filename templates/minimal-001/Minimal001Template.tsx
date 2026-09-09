"use client";

import { Studio2DTemplate } from "@/templates/studio-2d/Studio2DTemplate";
import type { TemplateRenderProps } from "@/templates/types";

const CONFIG = {
  variant: "minimal",
  templateId: "minimal-001",
  experience: "studio-minimal-photo",
  typography: "cormorant-garamond+dm-serif-display+inter",
} as const;

export function Minimal001Template(props: TemplateRenderProps) {
  return <Studio2DTemplate {...props} config={CONFIG} />;
}
