"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { TemplateRenderProps } from "@/templates/types";

function LoadingTemplate() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-center text-sm text-neutral-400"
      role="status"
      aria-live="polite"
    >
      Membuka undangan…
    </div>
  );
}

/**
 * Every importer is deliberately explicit so Next can emit a separate client
 * chunk for each experience. Never replace these imports with a dynamic path
 * such as import(`@/templates/${templateId}`), which prevents static bundler
 * analysis and can accidentally collapse performance isolation.
 */
const TEMPLATE_RUNTIME: Readonly<Record<string, ComponentType<TemplateRenderProps>>> = {
  "classic-001": dynamic(
    () => import("@/templates/classic-001/Classic001Template").then((module) => module.Classic001Template),
    { loading: LoadingTemplate }
  ),
  "editorial-001": dynamic(
    () => import("@/templates/editorial-001/EditorialIvoryTemplate").then((module) => module.EditorialIvoryTemplate),
    { loading: LoadingTemplate }
  ),
  "cartoon-001": dynamic(
    () => import("@/templates/cartoon-001/CartoonLoveStoryTemplate").then((module) => module.CartoonLoveStoryTemplate),
    { loading: LoadingTemplate }
  ),
  "storybook-001": dynamic(
    () => import("@/templates/storybook-001/StorybookRomanceTemplate").then((module) => module.StorybookRomanceTemplate),
    { loading: LoadingTemplate }
  ),
  "paper-cut-001": dynamic(
    () => import("@/templates/paper-cut-001/PaperCutGardenTemplate").then((module) => module.PaperCutGardenTemplate),
    { loading: LoadingTemplate }
  ),
  "pasundan-001": dynamic(
    () => import("@/templates/pasundan-001/PasundanStorylandTemplate").then((module) => module.PasundanStorylandTemplate),
    { loading: LoadingTemplate }
  ),
  "clay-001": dynamic(
    () => import("@/templates/clay-001/ClayCoupleTemplate").then((module) => module.ClayCoupleTemplate),
    { loading: LoadingTemplate }
  ),
};

export function TemplateRuntime({
  templateId,
  ...props
}: TemplateRenderProps & { templateId: string }) {
  const Template = TEMPLATE_RUNTIME[templateId];
  if (!Template) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-center text-neutral-200">
        Template undangan tidak tersedia.
      </main>
    );
  }

  return <Template {...props} />;
}
