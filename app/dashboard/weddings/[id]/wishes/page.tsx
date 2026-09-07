import { notFound, redirect } from "next/navigation";
import { getSessionUser, getWeddingRole } from "@/lib/commerce/access";
import { withTenantDb } from "@/lib/db";
import { WishesManager } from "./WishesManager";

export const metadata = { title: "Wishes Moderation | ENDRIYA" };

export default async function WishesPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const result = await withTenantDb(user.id, async (db) => {
    const role = await getWeddingRole(db, id, user.id);
    if (!role) return { kind: "missing" } as const;
    if (role !== "owner") return { kind: "forbidden" } as const;

    const wishes = await db.query<{
      id: string;
      guest_id: string | null;
      name: string;
      location: string | null;
      message: string;
      status: "visible" | "hidden" | "spam";
      created_at: string;
    }>(
      `SELECT id, guest_id, name, location, message, status, created_at
         FROM public.wishes
        WHERE wedding_id = $1
        ORDER BY created_at DESC
        LIMIT 300`,
      [id]
    );

    return { kind: "ok", wishes: wishes.rows } as const;
  });

  if (result.kind === "missing") notFound();
  if (result.kind === "forbidden") redirect(`/dashboard/weddings/${id}`);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-50">Wishes Moderation</h2>
        <p className="mt-1 text-xs text-neutral-500">Review, hide, restore, mark spam, or delete wishes for this wedding.</p>
      </div>
      <WishesManager weddingId={id} initialWishes={result.wishes} />
    </div>
  );
}
