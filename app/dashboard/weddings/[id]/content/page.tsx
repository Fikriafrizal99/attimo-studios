import { redirect, notFound } from "next/navigation";
import { withTenantDb } from "@/lib/db";
import { getSessionUser, hasWeddingAccess } from "@/lib/commerce/access";
import { normalizeWeddingContent } from "@/lib/commerce/content";
import { ContentForm } from "./ContentForm";

export const metadata = { title: "Content | Wedding" };

export default async function ContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const wedding = await withTenantDb(user.id, async (db) => {
    if (!(await hasWeddingAccess(db, id, user.id))) return null;
    const result = await db.query<{ content: unknown }>(
      `SELECT content FROM public.weddings WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0] ?? null;
  });

  if (!wedding) notFound();

  return (
    <div className="space-y-6">
      <ContentForm weddingId={id} initialContent={normalizeWeddingContent(wedding.content)} />
    </div>
  );
}
