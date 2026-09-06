import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { getSessionUser, getWeddingRole } from "@/lib/commerce/access";
import { buildInvitationUrl } from "@/lib/commerce/url";
import { getActiveTemplates } from "@/templates/registry";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Settings | Wedding" };

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const supabase = createServerClient();
  const role = await getWeddingRole(supabase, id, user.id);
  if (!role) redirect("/dashboard");
  if (role !== "owner") redirect(`/dashboard/weddings/${id}/content`);

  const { data: wedding, error } = await supabase
    .from("weddings")
    .select("slug, status, template_id")
    .eq("id", id)
    .maybeSingle();
  if (error || !wedding) notFound();

  const templates = getActiveTemplates().map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    experienceLevel: item.experienceLevel,
  }));

  return (
    <div className="space-y-6">
      <SettingsForm
        weddingId={id}
        initialSlug={wedding.slug}
        initialStatus={wedding.status}
        initialTemplateId={wedding.template_id}
        initialPublicUrl={wedding.slug ? buildInvitationUrl({ slug: wedding.slug }) : null}
        templates={templates}
      />
    </div>
  );
}
