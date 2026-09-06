import { NextRequest, NextResponse } from "next/server";
import { withTenantDb } from "@/lib/db";
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

    const wedding = await withTenantDb(user.id, async (db) => {
      const result = await db.query<{ wedding: { id: string; slug: string | null; template_id: string } }>(
        `SELECT app_private.create_wedding_for_current_user(
           $1,
           $2::jsonb,
           $3::jsonb,
           $4::jsonb
         ) AS wedding`,
        [
          templateId,
          JSON.stringify(defaultSections),
          JSON.stringify(content),
          JSON.stringify({}),
        ]
      );
      return result.rows[0]?.wedding;
    });

    if (!wedding) throw new Error("Atomic wedding creation failed");
    return NextResponse.json(wedding, { status: 201 });
  } catch (error) {
    console.error("POST /api/weddings failed", error);
    return NextResponse.json({ error: "Failed to create wedding" }, { status: 500 });
  }
}
