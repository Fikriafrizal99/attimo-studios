import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
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
  const supabase = createServerClient();
  if (!(await hasWeddingAccess(supabase, id, user.id))) redirect("/dashboard");

  const { data: wedding, error } = await supabase
    .from("weddings")
    .select("sections")
    .eq("id", id)
    .maybeSingle();
  if (error || !wedding) notFound();

  return (
    <div className="space-y-6">
      <SectionsForm weddingId={id} initialSections={normalizeSections(wedding.sections)} />
    </div>
  );
}
