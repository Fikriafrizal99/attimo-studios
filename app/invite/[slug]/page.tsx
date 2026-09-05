import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { InvitationRenderer } from "@/components/invitation/InvitationRenderer";
import { resolveTemplate } from "@/templates/registry";
import type { SectionConfig } from "@/lib/wedding-defaults";
import type { PublicGuestContext } from "@/templates/types";

export default async function PublicInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ guest?: string | string[] }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const guestToken = typeof query.guest === "string" ? query.guest.trim() : "";

  const supabase = createServerClient();
  const { data: wedding, error } = await supabase
    .from("weddings")
    .select("id, slug, status, template_id, sections, content, theme")
    .eq("slug", slug.toLowerCase())
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

  const sections = Array.isArray(wedding.sections)
    ? (wedding.sections as SectionConfig[])
    : [];

  return (
    <InvitationRenderer
      weddingId={wedding.id}
      templateId={wedding.template_id}
      content={wedding.content}
      sections={sections}
      theme={(wedding.theme ?? {}) as Record<string, unknown>}
      guest={guest}
    />
  );
}
