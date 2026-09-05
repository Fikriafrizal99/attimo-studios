import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { getSessionUser, hasWeddingAccess } from "@/lib/commerce/access";
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
  if (!(await hasWeddingAccess(supabase, id, user.id))) notFound();
  return <GuestsManager weddingId={id} />;
}
