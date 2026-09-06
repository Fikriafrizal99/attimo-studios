import { cache } from "react";
import { createServiceRoleClient } from "@/lib/supabase";
import { normalizeWeddingContent } from "@/lib/commerce/content";
import { validateSlug } from "@/lib/commerce/validation";
import { resolveTemplate } from "@/templates/registry";
import type { CanonicalWeddingContent, SectionConfig } from "@/lib/wedding-contract";
import type { PublicGuestContext } from "@/templates/types";

export type PublicWeddingData = {
  id: string;
  slug: string;
  templateId: string;
  content: CanonicalWeddingContent;
  sections: SectionConfig[];
  theme: Record<string, unknown>;
};

export type PublicInvitationData = PublicWeddingData & {
  guest?: PublicGuestContext;
};

const loadReleasedWedding = cache(async (slug: string): Promise<PublicWeddingData | null> => {
  const supabase = createServiceRoleClient();
  const { data: wedding, error } = await supabase
    .from("weddings")
    .select("id, slug, template_id, sections, content, theme")
    .eq("slug", slug)
    .eq("status", "released")
    .maybeSingle();

  if (error || !wedding?.slug) return null;

  try {
    resolveTemplate(wedding.template_id);
  } catch {
    return null;
  }

  return {
    id: wedding.id,
    slug: wedding.slug,
    templateId: wedding.template_id,
    content: normalizeWeddingContent(wedding.content),
    sections: Array.isArray(wedding.sections) ? (wedding.sections as SectionConfig[]) : [],
    theme:
      wedding.theme && typeof wedding.theme === "object" && !Array.isArray(wedding.theme)
        ? (wedding.theme as Record<string, unknown>)
        : {},
  };
});

export async function loadReleasedWeddingBySlug(rawSlug: string): Promise<PublicWeddingData | null> {
  const validated = validateSlug(rawSlug);
  if (!validated.ok) return null;
  return loadReleasedWedding(validated.value);
}

export async function resolvePublicGuest(
  weddingId: string,
  rawGuestToken?: string | null
): Promise<PublicGuestContext | undefined> {
  const guestToken = typeof rawGuestToken === "string" ? rawGuestToken.trim() : "";
  if (!guestToken || guestToken.length > 128) return undefined;

  const supabase = createServiceRoleClient();
  const { data: guestRow, error } = await supabase
    .from("guests")
    .select("id, token, display_name, max_guests")
    .eq("wedding_id", weddingId)
    .eq("token", guestToken)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !guestRow) return undefined;

  return {
    id: guestRow.id,
    token: guestRow.token,
    displayName: guestRow.display_name,
    maxGuests: guestRow.max_guests,
  };
}

export async function loadPublicInvitation(
  rawSlug: string,
  rawGuestToken?: string | null
): Promise<PublicInvitationData | null> {
  const wedding = await loadReleasedWeddingBySlug(rawSlug);
  if (!wedding) return null;

  const guest = await resolvePublicGuest(wedding.id, rawGuestToken);
  return guest ? { ...wedding, guest } : wedding;
}
