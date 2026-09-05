import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { getSessionUser, hasWeddingAccess } from "@/lib/commerce/access";
import { InvitationRenderer } from "@/components/invitation/InvitationRenderer";
import { resolveTemplate } from "@/templates/registry";
import type { SectionConfig } from "@/lib/wedding-defaults";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const supabase = createServerClient();
  if (!(await hasWeddingAccess(supabase, id, user.id))) notFound();

  const { data: wedding, error } = await supabase
    .from("weddings")
    .select("id, template_id, sections, content, theme")
    .eq("id", id)
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
      templateId={wedding.template_id}
      content={wedding.content}
      sections={Array.isArray(wedding.sections) ? (wedding.sections as SectionConfig[]) : []}
      theme={(wedding.theme ?? {}) as Record<string, unknown>}
    />
  );
}
