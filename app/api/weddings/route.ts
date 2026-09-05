import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getSessionUser } from "@/lib/commerce/access";
import { normalizeWeddingContent } from "@/lib/commerce/content";
import { defaultContent, defaultSections } from "@/lib/wedding-defaults";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const content = normalizeWeddingContent(body.content ?? defaultContent);
    const templateId = typeof body.template_id === "string" ? body.template_id : "classic-001";

    const supabase = createServerClient();
    const { data: wedding, error: weddingError } = await supabase
      .from("weddings")
      .insert({
        status: "draft",
        template_id: templateId,
        sections: defaultSections,
        content,
        theme: {},
      })
      .select("id, slug, template_id")
      .single();
    if (weddingError || !wedding) throw weddingError ?? new Error("Wedding insert failed");

    const { error: collaboratorError } = await supabase
      .from("wedding_collaborators")
      .insert({ wedding_id: wedding.id, user_id: user.id, role: "owner" });
    if (collaboratorError) {
      await supabase.from("weddings").delete().eq("id", wedding.id);
      throw collaboratorError;
    }

    return NextResponse.json(wedding, { status: 201 });
  } catch (error) {
    console.error("POST /api/weddings failed", error);
    return NextResponse.json({ error: "Failed to create wedding" }, { status: 500 });
  }
}
