import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, getWeddingRole } from "@/lib/commerce/access";
import { isUuid } from "@/lib/commerce/validation";
import { withTenantDb } from "@/lib/db";

const WISH_STATUSES = new Set(["visible", "hidden", "spam"]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid wedding id" }, { status: 400 });

    const status = request.nextUrl.searchParams.get("status") ?? "";
    if (status && !WISH_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid wish status" }, { status: 400 });
    }

    const result = await withTenantDb(user.id, async (db) => {
      const role = await getWeddingRole(db, id, user.id);
      if (role !== "owner") return null;

      const wishes = await db.query(
        `SELECT id, guest_id, name, location, message, status, created_at
           FROM public.wishes
          WHERE wedding_id = $1
            AND ($2 = '' OR status = $2)
          ORDER BY created_at DESC
          LIMIT 300`,
        [id, status]
      );
      return wishes.rows;
    });

    if (!result) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ data: result, count: result.length });
  } catch (error) {
    console.error("GET /api/weddings/[id]/wishes failed", error);
    return NextResponse.json({ error: "Failed to load wishes" }, { status: 500 });
  }
}
