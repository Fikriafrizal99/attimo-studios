import { NextRequest, NextResponse } from "next/server";
import { withTenantDb } from "@/lib/db";
import { getSessionUser, getWeddingRole } from "@/lib/commerce/access";
import { isUuid, validateSlug } from "@/lib/commerce/validation";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const weddingId = request.nextUrl.searchParams.get("weddingId");
    if (!isUuid(weddingId)) {
      return NextResponse.json({ available: false, error: "Valid weddingId is required" }, { status: 400 });
    }

    const validated = validateSlug(request.nextUrl.searchParams.get("slug"));
    if (!validated.ok) {
      return NextResponse.json({ available: false, error: validated.error }, { status: 400 });
    }

    const result = await withTenantDb(user.id, async (db) => {
      const role = await getWeddingRole(db, weddingId, user.id);
      if (!role) return { status: 403, error: "Forbidden" } as const;
      if (role !== "owner") {
        return { status: 403, error: "Only the owner can change the public slug" } as const;
      }

      const query = await db.query<{ available: boolean }>(
        `SELECT app_private.is_wedding_slug_available($1, $2::uuid) AS available`,
        [validated.value, weddingId]
      );
      return { status: 200, available: query.rows[0]?.available === true } as const;
    });

    if (result.status !== 200) {
      return NextResponse.json({ available: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({ available: result.available });
  } catch (error) {
    console.error("GET /api/weddings/check-slug failed", error);
    return NextResponse.json({ available: false, error: "Check failed" }, { status: 500 });
  }
}
