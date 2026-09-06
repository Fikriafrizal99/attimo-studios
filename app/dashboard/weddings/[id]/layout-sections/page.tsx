import { redirect, notFound } from "next/navigation";
import { withTenantDb } from "@/lib/db";
import { getSessionUser, hasWeddingAccess } from "@/lib/commerce/access";
import { normalizeSections } from "@/lib/commerce/sections";
import { SectionsForm } from "./SectionsForm";

export const metadata = { title: "Layout | Wedding" };

export default async function LayoutSectionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const wedding = await withTenantDb(user.id, async (db) => {
    if (!(await hasWeddingAccess(db, id, user.id))) return null;
    const result = await db.query<{ sections: unknown }>(
      `SELECT sections FROM public.weddings WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0] ?? null;
  });

  if (!wedding) notFound();

  return (
    <div className="space-y-6">
      <SectionsForm weddingId={id} initialSections={normalizeSections(wedding.sections)} />
    </div>
  );
}
