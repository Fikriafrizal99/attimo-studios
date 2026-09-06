import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getSessionUser } from "@/lib/commerce/access";
import { normalizeWeddingContent } from "@/lib/commerce/content";
import { defaultContent, defaultSections } from "@/lib/wedding-defaults";
import { resolveTemplate } from "@/templates/registry";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const content = normalizeWeddingContent(body.content ?? defaultContent);
    const templateId = typeof body.template_id === "string" ? body.template_id : "classic-001";

    try {
      resolveTemplate(templateId);
    } catch {
      return NextResponse.json({ error: "Template is not available" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase.rpc("create_wedding_with_owner", {
      p_owner_user_id: user.id,
      p_template_id: templateId,
      p_sections: defaultSections,
      p_content: content,
      p_theme: {},
    });

    if (error || !data) throw error ?? new Error("Atomic wedding creation failed");

    const wedding = data as {
      id: string;
      slug: string | null;
      template_id: string;
    };

    return NextResponse.json(wedding, { status: 201 });
  } catch (error) {
    console.error("POST /api/weddings failed", error);
    return NextResponse.json({ error: "Failed to create wedding" }, { status: 500 });
  }
}
