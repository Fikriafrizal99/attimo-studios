import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { createServerClient } from "@/lib/supabase";

export type WeddingRole = "owner" | "collaborator";

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function hasWeddingAccess(
  supabase: ReturnType<typeof createServerClient>,
  weddingId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("wedding_collaborators")
    .select("wedding_id")
    .eq("wedding_id", weddingId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function getWeddingRole(
  supabase: ReturnType<typeof createServerClient>,
  weddingId: string,
  userId: string
): Promise<WeddingRole | null> {
  const { data } = await supabase
    .from("wedding_collaborators")
    .select("role")
    .eq("wedding_id", weddingId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role === "owner" || data?.role === "collaborator" ? data.role : null;
}
