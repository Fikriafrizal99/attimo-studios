import { getCountdownTarget } from "@/lib/commerce/countdown";
import { normalizeWeddingContent } from "@/lib/commerce/content";
import { getGiftPresentation, giftDraftIssues } from "@/lib/commerce/gift";
import { getLocationEntries } from "@/lib/commerce/location";
import { normalizeSections } from "@/lib/commerce/sections";
import { validateSlug } from "@/lib/commerce/validation";
import {
  validateWeddingContentInput,
  validateWeddingSectionsInput,
} from "@/lib/commerce/wedding-validation";
import { resolveTemplate, validateTemplateCompatibility } from "@/templates/registry";
import type { SectionConfig } from "@/lib/wedding-contract";

export type ReadinessCheck = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  message: string;
};

export type PublishReadiness = {
  ready: boolean;
  errors: string[];
  warnings: string[];
  checks: ReadinessCheck[];
};

export type PublishReadinessInput = {
  slug: string | null;
  templateId: string;
  content: unknown;
  sections: unknown;
};

function push(
  checks: ReadinessCheck[],
  input: ReadinessCheck
) {
  checks.push(input);
}

function enabled(sections: SectionConfig[], id: SectionConfig["id"]): boolean {
  return sections.some((section) => section.id === id && section.enabled);
}

export function evaluatePublishReadiness(input: PublishReadinessInput): PublishReadiness {
  const checks: ReadinessCheck[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  const slug = validateSlug(input.slug);
  if (!slug.ok) {
    errors.push(slug.error);
    push(checks, { id: "slug", label: "Public slug", status: "fail", message: slug.error });
  } else {
    push(checks, { id: "slug", label: "Public slug", status: "pass", message: slug.value });
  }

  try {
    const template = resolveTemplate(input.templateId);
    push(checks, {
      id: "template",
      label: "Template",
      status: "pass",
      message: `${template.name} · ${template.visualTier.toUpperCase()}`,
    });
  } catch {
    const message = "Selected template is not available.";
    errors.push(message);
    push(checks, { id: "template", label: "Template", status: "fail", message });
  }

  const content = normalizeWeddingContent(input.content);
  const contentValidation = validateWeddingContentInput(content);
  if (!contentValidation.ok) {
    const message = "Wedding content contains invalid fields.";
    errors.push(message, ...contentValidation.errors);
    push(checks, { id: "content", label: "Content schema", status: "fail", message });
  } else {
    push(checks, { id: "content", label: "Content schema", status: "pass", message: "Canonical schema v1 is valid." });
  }

  const sections = normalizeSections(input.sections);
  const sectionValidation = validateWeddingSectionsInput(sections);
  if (!sectionValidation.ok) {
    const message = "Wedding section configuration is invalid.";
    errors.push(message, ...sectionValidation.errors);
    push(checks, { id: "sections", label: "Section configuration", status: "fail", message });
  } else {
    push(checks, { id: "sections", label: "Section configuration", status: "pass", message: "Canonical section order is valid." });
  }

  try {
    const enabledIds = sections.filter((section) => section.enabled).map((section) => section.id);
    const compatibility = validateTemplateCompatibility(input.templateId, enabledIds);
    if (!compatibility.ok) {
      const message = `Template does not support: ${compatibility.unsupported.join(", ")}`;
      errors.push(message);
      push(checks, { id: "compatibility", label: "Template compatibility", status: "fail", message });
    } else {
      push(checks, { id: "compatibility", label: "Template compatibility", status: "pass", message: "Enabled sections use the shared ENDRIYA contract." });
    }
  } catch {
    // Template availability is already reported above.
  }

  const bride = content.couple.bride.name.trim();
  const groom = content.couple.groom.name.trim();
  if (!bride || !groom) {
    const message = "Bride and groom names are required before release.";
    errors.push(message);
    push(checks, { id: "couple", label: "Couple", status: "fail", message });
  } else {
    push(checks, { id: "couple", label: "Couple", status: "pass", message: `${bride} & ${groom}` });
  }

  const completeEvent = content.events.find(
    (event) =>
      event.title.trim() &&
      event.date.trim() &&
      event.time.trim() &&
      event.timezone.trim() &&
      event.location.trim() &&
      event.address.trim()
  );
  if (!completeEvent) {
    const message = "At least one complete wedding event is required before release.";
    errors.push(message);
    push(checks, { id: "event", label: "Wedding event", status: "fail", message });
  } else {
    push(checks, { id: "event", label: "Wedding event", status: "pass", message: completeEvent.title });
  }

  if (enabled(sections, "date")) {
    if (!getCountdownTarget(content)) {
      const message = "Countdown section needs a valid event date/time.";
      errors.push(message);
      push(checks, { id: "countdown", label: "Countdown", status: "fail", message });
    } else {
      push(checks, { id: "countdown", label: "Countdown", status: "pass", message: "Countdown target resolves successfully." });
    }
  }

  if (enabled(sections, "location")) {
    const locations = getLocationEntries(content);
    if (locations.length === 0) {
      const message = "Location section needs at least one venue/address or coordinate.";
      errors.push(message);
      push(checks, { id: "location", label: "Location", status: "fail", message });
    } else {
      push(checks, { id: "location", label: "Location", status: "pass", message: `${locations.length} location entr${locations.length === 1 ? "y" : "ies"} ready.` });
    }
  }

  if (enabled(sections, "gallery")) {
    if (content.gallery.length === 0) {
      const message = "Gallery is enabled but has no photos.";
      warnings.push(message);
      push(checks, { id: "gallery", label: "Gallery", status: "warn", message });
    } else {
      push(checks, { id: "gallery", label: "Gallery", status: "pass", message: `${content.gallery.length} photo(s) ready.` });
    }
  }

  if (enabled(sections, "gift") && content.gifts.enabled) {
    const giftIssues = giftDraftIssues(content.gifts);
    if (giftIssues.length) {
      errors.push(...giftIssues);
      push(checks, { id: "gift", label: "Digital gift", status: "fail", message: giftIssues.join(" ") });
    } else {
      const gift = getGiftPresentation(content);
      if (!gift.hasContent) {
        const message = "Digital gift is enabled but no bank, QRIS, or shipping method is configured.";
        warnings.push(message);
        push(checks, { id: "gift", label: "Digital gift", status: "warn", message });
      } else {
        push(checks, { id: "gift", label: "Digital gift", status: "pass", message: `${gift.methodCount} gift method(s) ready.` });
      }
    }
  }

  if (enabled(sections, "music") && content.music.length === 0) {
    const message = "Music section is enabled but no track is configured.";
    warnings.push(message);
    push(checks, { id: "music", label: "Music", status: "warn", message });
  }

  if (!content.hero.coverImage && !content.hero.coverVideo) {
    const message = "Hero has no cover image or video.";
    warnings.push(message);
    push(checks, { id: "hero-media", label: "Hero media", status: "warn", message });
  } else {
    push(checks, { id: "hero-media", label: "Hero media", status: "pass", message: "Hero media is configured." });
  }

  return {
    ready: errors.length === 0,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    checks,
  };
}
