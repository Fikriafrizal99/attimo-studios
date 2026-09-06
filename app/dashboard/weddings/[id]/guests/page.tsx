import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { getSessionUser, getWeddingRole } from "@/lib/commerce/access";
import { GuestsManager } from "./GuestsManager";

export const metadata = { title: "Guests | Wedding" };

export default async function GuestsPage({
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
  return <GuestsManager weddingId={id} />;
}
