import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase";
import { InvitationRenderer } from "@/components/invitation/InvitationRenderer";
import { resolveTemplate } from "@/templates/registry";
import type { SectionConfig } from "@/lib/wedding-defaults";
import type { PublicGuestContext } from "@/templates/types";

/**
 * Compatibility route used by optional subdomain middleware.
 * Path-based production invitations use /invite/[slug].
 */
export default async function InvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ guest?: string | string[] }>;
}) {
  const requestHeaders = await headers();
  const slug = requestHeaders.get("x-wedding-slug")?.trim().toLowerCase();
  if (!slug) notFound();

  const query = await searchParams;
  const guestToken = typeof query.guest === "string" ? query.guest.trim() : "";

  const supabase = createServiceRoleClient();
  const { data: wedding, error } = await supabase
    .from("weddings")
    .select("id, slug, template_id, sections, content, theme")
    .eq("slug", slug)
    .eq("status", "released")
    .maybeSingle();
  if (error || !wedding) notFound();

  try {
    resolveTemplate(wedding.template_id);
  } catch {
    notFound();
  }

  let guest: PublicGuestContext | undefined;
  if (guestToken && guestToken.length <= 128) {
    const { data: guestRow } = await supabase
      .from("guests")
      .select("id, token, display_name, max_guests")
      .eq("wedding_id", wedding.id)
      .eq("token", guestToken)
      .eq("is_active", true)
      .maybeSingle();

    if (guestRow) {
      guest = {
        id: guestRow.id,
        token: guestRow.token,
        displayName: guestRow.display_name,
        maxGuests: guestRow.max_guests,
      };
    }
  }

  return (
    <InvitationRenderer
      weddingId={wedding.id}
      publicSlug={wedding.slug}
      templateId={wedding.template_id}
      content={wedding.content}
      sections={Array.isArray(wedding.sections) ? (wedding.sections as SectionConfig[]) : []}
      theme={(wedding.theme ?? {}) as Record<string, unknown>}
      guest={guest}
    />
  );
}
