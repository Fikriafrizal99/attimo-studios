import { NextRequest, NextResponse } from "next/server";
import { withTenantDb } from "@/lib/db";
import { getSessionUser } from "@/lib/commerce/access";
import { isUuid } from "@/lib/commerce/validation";

type PgLikeError = Error & { code?: string };

function errorResponse(error: unknown, fallback: string) {
  const pgError = error as PgLikeError;
  if (pgError?.code === "42501") {
    return NextResponse.json({ error: pgError.message || "Forbidden" }, { status: 403 });
  }
  if (pgError?.code === "22023") {
    return NextResponse.json({ error: pgError.message || "Invalid request" }, { status: 400 });
  }
  if (pgError?.code === "23505") {
    return NextResponse.json({ error: pgError.message || "Collaborator already exists" }, { status: 409 });
  }
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid wedding id" }, { status: 400 });

    const data = await withTenantDb(user.id, async (db) => {
      const result = await db.query<{ collaboration: unknown }>(
        `SELECT app_private.list_wedding_collaboration($1::uuid) AS collaboration`,
        [id]
      );
      return result.rows[0]?.collaboration;
    });

    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error, "Failed to load collaborators");
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid wedding id" }, { status: 400 });

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().slice(0, 254) : "";
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const data = await withTenantDb(user.id, async (db) => {
      const result = await db.query<{ invitation: unknown }>(
        `SELECT app_private.invite_wedding_collaborator($1::uuid, $2::text) AS invitation`,
        [id, email]
      );
      return result.rows[0]?.invitation;
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Failed to invite collaborator");
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid wedding id" }, { status: 400 });

    const body = await request.json().catch(() => null);
    const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
    const inviteId = typeof body?.inviteId === "string" ? body.inviteId.trim() : "";

    if ((userId && inviteId) || (!userId && !inviteId)) {
      return NextResponse.json({ error: "Provide exactly one userId or inviteId" }, { status: 400 });
    }
    if (inviteId && !isUuid(inviteId)) {
      return NextResponse.json({ error: "Invalid invite id" }, { status: 400 });
    }

    const removed = await withTenantDb(user.id, async (db) => {
      if (userId) {
        const result = await db.query<{ removed: boolean }>(
          `SELECT app_private.remove_wedding_collaborator($1::uuid, $2::text) AS removed`,
          [id, userId]
        );
        return Boolean(result.rows[0]?.removed);
      }

      const result = await db.query<{ removed: boolean }>(
        `SELECT app_private.revoke_wedding_collaborator_invite($1::uuid, $2::uuid) AS removed`,
        [id, inviteId]
      );
      return Boolean(result.rows[0]?.removed);
    });

    if (!removed) return NextResponse.json({ error: "Collaborator or invite not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Failed to remove collaborator");
  }
}
