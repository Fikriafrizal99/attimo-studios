import { ClassicTemplate } from "@/app/invitation/ClassicTemplate";
import { Minimal001Template } from "@/templates/minimal-001/Minimal001Template";
import type { TemplateDefinition } from "@/templates/types";

export const TEMPLATE_REGISTRY: Record<string, TemplateDefinition> = {
  "classic-001": {
    id: "classic-001",
    name: "Classic 001",
    family: "classic",
    category: "Classic",
    tags: ["classic", "romantic", "motion"],
    version: 1,
    status: "active",
    experienceLevel: "motion-2d",
    supportedSections: [
      "hero",
      "couple",
      "date",
      "location",
      "story",
      "gallery",
      "rsvp",
      "wishes",
      "gift",
      "music",
    ],
    requiredSections: ["hero", "couple", "location"],
    render: ClassicTemplate,
  },
  "minimal-001": {
    id: "minimal-001",
    name: "Minimal Editorial 001",
    family: "minimal-editorial",
    category: "Modern",
    tags: ["modern", "editorial", "minimal"],
    version: 1,
    status: "active",
    experienceLevel: "standard-2d",
    supportedSections: [
      "hero",
      "couple",
      "location",
      "story",
      "gallery",
      "rsvp",
      "wishes",
      "gift",
      "music",
    ],
    requiredSections: ["hero", "couple", "location"],
    render: Minimal001Template,
  },
};

export class TemplateNotAvailableError extends Error {
  constructor(public readonly templateId: string) {
    super(`Template is not available: ${templateId}`);
    this.name = "TemplateNotAvailableError";
  }
}

export function resolveTemplate(templateId: string): TemplateDefinition {
  const definition = TEMPLATE_REGISTRY[templateId];
  if (!definition || definition.status !== "active") {
    throw new TemplateNotAvailableError(templateId);
  }
  return definition;
}

export function getActiveTemplates(): TemplateDefinition[] {
  return Object.values(TEMPLATE_REGISTRY).filter((item) => item.status === "active");
}

export function validateTemplateCompatibility(templateId: string, sectionIds: string[]) {
  const template = resolveTemplate(templateId);
  const supported = new Set(template.supportedSections);
  const unsupported = sectionIds.filter((id) => !supported.has(id));
  const missingRequired = (template.requiredSections ?? []).filter(
    (id) => !sectionIds.includes(id)
  );
  return { template, unsupported, missingRequired, ok: unsupported.length === 0 && missingRequired.length === 0 };
}
