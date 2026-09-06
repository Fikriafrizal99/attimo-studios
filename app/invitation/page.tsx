import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase";
import { InvitationRenderer } from "@/components/invitation/InvitationRenderer";
import { resolveTemplate } from "@/templates/registry";
import type { SectionConfig } from "@/lib/wedding-defaults";

/**
 * Compatibility route used by optional subdomain middleware.
 * Path-based production invitations use /invite/[slug].
 */
export default async function InvitationPage() {
  const requestHeaders = await headers();
  const slug = requestHeaders.get("x-wedding-slug")?.trim().toLowerCase();
  if (!slug) notFound();

  const supabase = createServerClient();
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

  return (
    <InvitationRenderer
      weddingId={wedding.id}
      publicSlug={wedding.slug}
      templateId={wedding.template_id}
      content={wedding.content}
      sections={Array.isArray(wedding.sections) ? (wedding.sections as SectionConfig[]) : []}
      theme={(wedding.theme ?? {}) as Record<string, unknown>}
    />
  );
}
