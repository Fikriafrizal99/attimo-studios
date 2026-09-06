import { notFound, redirect } from "next/navigation";
import { withTenantDb } from "@/lib/db";
import { getSessionUser, getWeddingRole } from "@/lib/commerce/access";
import { CollaboratorManager, type CollaborationData } from "./CollaboratorManager";

export default async function CollaboratorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const data = await withTenantDb(user.id, async (db) => {
    const role = await getWeddingRole(db, id, user.id);
    if (!role) return { status: "missing" as const };
    if (role !== "owner") return { status: "forbidden" as const };

    const result = await db.query<{ collaboration: CollaborationData }>(
      `SELECT app_private.list_wedding_collaboration($1::uuid) AS collaboration`,
      [id]
    );
    return {
      status: "ok" as const,
      collaboration: result.rows[0]?.collaboration ?? { members: [], pending: [] },
    };
  });

  if (data.status === "missing") notFound();
  if (data.status === "forbidden") redirect(`/dashboard/weddings/${id}`);

  return <CollaboratorManager weddingId={id} initialData={data.collaboration} />;
}
