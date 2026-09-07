import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, getWeddingRole } from "@/lib/commerce/access";
import { isUuid } from "@/lib/commerce/validation";
import { withTenantDb } from "@/lib/db";

const WISH_STATUSES = new Set(["visible", "hidden", "spam"]);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; wishId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, wishId } = await context.params;
    if (!isUuid(id) || !isUuid(wishId)) {
      return NextResponse.json({ error: "Invalid wedding or wish id" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const status = body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).status
      : null;
    if (typeof status !== "string" || !WISH_STATUSES.has(status)) {
      return NextResponse.json({ error: "status must be visible, hidden, or spam" }, { status: 400 });
    }

    const result = await withTenantDb(user.id, async (db) => {
      const role = await getWeddingRole(db, id, user.id);
      if (role !== "owner") return { kind: "forbidden" } as const;

      const updated = await db.query(
        `UPDATE public.wishes
            SET status = $1
          WHERE id = $2
            AND wedding_id = $3
          RETURNING id, name, location, message, status, created_at`,
        [status, wishId, id]
      );
      if (!updated.rows[0]) return { kind: "missing" } as const;
      return { kind: "ok", data: updated.rows[0] } as const;
    });

    if (result.kind === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (result.kind === "missing") return NextResponse.json({ error: "Wish not found" }, { status: 404 });
    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("PATCH /api/weddings/[id]/wishes/[wishId] failed", error);
    return NextResponse.json({ error: "Failed to moderate wish" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; wishId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, wishId } = await context.params;
    if (!isUuid(id) || !isUuid(wishId)) {
      return NextResponse.json({ error: "Invalid wedding or wish id" }, { status: 400 });
    }

    const result = await withTenantDb(user.id, async (db) => {
      const role = await getWeddingRole(db, id, user.id);
      if (role !== "owner") return { kind: "forbidden" } as const;

      const deleted = await db.query(
        `DELETE FROM public.wishes
          WHERE id = $1
            AND wedding_id = $2
          RETURNING id`,
        [wishId, id]
      );
      return deleted.rows[0]
        ? ({ kind: "ok" } as const)
        : ({ kind: "missing" } as const);
    });

    if (result.kind === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (result.kind === "missing") return NextResponse.json({ error: "Wish not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/weddings/[id]/wishes/[wishId] failed", error);
    return NextResponse.json({ error: "Failed to delete wish" }, { status: 500 });
  }
}
