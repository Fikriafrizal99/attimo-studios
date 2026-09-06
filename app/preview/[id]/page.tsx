import { redirect, notFound } from "next/navigation";
import { withTenantDb } from "@/lib/db";
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

  const wedding = await withTenantDb(user.id, async (db) => {
    if (!(await hasWeddingAccess(db, id, user.id))) return null;
    const result = await db.query<{
      id: string;
      template_id: string;
      sections: unknown;
      content: unknown;
      theme: unknown;
    }>(
      `SELECT id, template_id, sections, content, theme
         FROM public.weddings
        WHERE id = $1
        LIMIT 1`,
      [id]
    );
    return result.rows[0] ?? null;
  });

  if (!wedding) notFound();

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
