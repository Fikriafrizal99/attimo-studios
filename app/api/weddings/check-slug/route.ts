import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
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

    const supabase = createServerClient();
    const role = await getWeddingRole(supabase, weddingId, user.id);
    if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (role !== "owner") {
      return NextResponse.json({ error: "Only the owner can change the public slug" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("weddings")
      .select("id")
      .eq("slug", validated.value)
      .neq("id", weddingId)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ available: !data });
  } catch (error) {
    console.error("GET /api/weddings/check-slug failed", error);
    return NextResponse.json({ available: false, error: "Check failed" }, { status: 500 });
  }
}
