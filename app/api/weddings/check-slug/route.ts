import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getSessionUser } from "@/lib/commerce/access";
import { validateSlug } from "@/lib/commerce/validation";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const validated = validateSlug(request.nextUrl.searchParams.get("slug"));
    if (!validated.ok) {
      return NextResponse.json({ available: false, error: validated.error }, { status: 400 });
    }
    const excludeWeddingId = request.nextUrl.searchParams.get("weddingId") ?? undefined;
    const supabase = createServerClient();
    let query = supabase.from("weddings").select("id").eq("slug", validated.value);
    if (excludeWeddingId) query = query.neq("id", excludeWeddingId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return NextResponse.json({ available: !data });
  } catch (error) {
    console.error("GET /api/weddings/check-slug failed", error);
    return NextResponse.json({ available: false, error: "Check failed" }, { status: 500 });
  }
}
