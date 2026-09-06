import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { withTenantDb } from "@/lib/db";
import { getSessionUser, hasWeddingAccess } from "@/lib/commerce/access";

const BUCKET = "wedding-assets";
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id: weddingId } = await context.params;

    const allowed = await withTenantDb(user.id, (db) => hasWeddingAccess(db, weddingId, user.id));
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "File is required" }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, or GIF images are allowed" }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Image must be between 1 byte and 5MB" }, { status: 400 });
    }

    // Storage isolation policies are Phase 3.7. Until then, the service-role
    // client is intentionally scoped to the upload itself, after tenant authz.
    const supabase = createServiceRoleClient();
    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1] || "img";
    const path = `weddings/${weddingId}/assets/${Date.now()}-${randomBytes(8).toString("hex")}.${extension}`;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" });
    if (error) {
      if (/bucket/i.test(error.message)) {
        return NextResponse.json({ error: "Create the wedding-assets bucket in Supabase Storage first" }, { status: 503 });
      }
      throw error;
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return NextResponse.json({ url: publicData.publicUrl, path: data.path });
  } catch (error) {
    console.error("POST wedding asset upload failed", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
