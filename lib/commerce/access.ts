import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { TenantDbClient } from "@/lib/db";

export type WeddingRole = "owner" | "collaborator";

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function hasWeddingAccess(
  db: TenantDbClient,
  weddingId: string,
  userId: string
): Promise<boolean> {
  const result = await db.query(
    `SELECT 1
       FROM public.wedding_collaborators
      WHERE wedding_id = $1
        AND user_id = $2
      LIMIT 1`,
    [weddingId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getWeddingRole(
  db: TenantDbClient,
  weddingId: string,
  userId: string
): Promise<WeddingRole | null> {
  const result = await db.query<{ role: string }>(
    `SELECT role
       FROM public.wedding_collaborators
      WHERE wedding_id = $1
        AND user_id = $2
      LIMIT 1`,
    [weddingId, userId]
  );
  const role = result.rows[0]?.role;
  return role === "owner" || role === "collaborator" ? role : null;
}
