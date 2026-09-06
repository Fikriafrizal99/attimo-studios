import { redirect, notFound } from "next/navigation";
import { withTenantDb } from "@/lib/db";
import { getSessionUser, getWeddingRole } from "@/lib/commerce/access";
import { evaluatePublishReadiness } from "@/lib/commerce/publish-readiness";
import { buildInvitationUrl } from "@/lib/commerce/url";
import { getActiveTemplates } from "@/templates/registry";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Settings | ENDRIYA" };

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const result = await withTenantDb(user.id, async (db) => {
    const role = await getWeddingRole(db, id, user.id);
    if (!role) return { kind: "forbidden" } as const;
    if (role !== "owner") return { kind: "collaborator" } as const;

    const query = await db.query<{
      slug: string | null;
      status: string;
      template_id: string;
      sections: unknown;
      content: unknown;
    }>(
      `SELECT slug, status, template_id, sections, content
         FROM public.weddings
        WHERE id = $1
        LIMIT 1`,
      [id]
    );
    return query.rows[0]
      ? { kind: "ok", wedding: query.rows[0] } as const
      : { kind: "missing" } as const;
  });

  if (result.kind === "forbidden") redirect("/dashboard");
  if (result.kind === "collaborator") redirect(`/dashboard/weddings/${id}/content`);
  if (result.kind === "missing") notFound();

  const wedding = result.wedding;
  const templates = getActiveTemplates().map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    visualTier: item.visualTier,
    motionLevel: item.performance.motionLevel,
  }));
  const readiness = evaluatePublishReadiness({
    slug: wedding.slug,
    templateId: wedding.template_id,
    content: wedding.content,
    sections: wedding.sections,
  });

  return (
    <div className="space-y-6">
      <SettingsForm
        weddingId={id}
        initialSlug={wedding.slug}
        initialStatus={wedding.status}
        initialTemplateId={wedding.template_id}
        initialPublicUrl={
          wedding.status === "released" && wedding.slug
            ? buildInvitationUrl({ slug: wedding.slug })
            : null
        }
        initialReadiness={readiness}
        templates={templates}
      />
    </div>
  );
}
