import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
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
  const supabase = createServerClient();
  if (!(await hasWeddingAccess(supabase, id, user.id))) redirect("/dashboard");

  const { data: wedding, error } = await supabase
    .from("weddings")
    .select("content")
    .eq("id", id)
    .maybeSingle();
  if (error || !wedding) notFound();

  return (
    <div className="space-y-6">
      <ContentForm weddingId={id} initialContent={normalizeWeddingContent(wedding.content)} />
    </div>
  );
}
