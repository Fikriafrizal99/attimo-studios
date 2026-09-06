import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { withTenantDb } from "@/lib/db";
import { getSessionUser, hasWeddingAccess } from "@/lib/commerce/access";
import {
  WEDDING_ASSET_BUCKET,
  WEDDING_ASSET_MAX_BYTES,
  buildWeddingAssetPath,
  detectWeddingImageType,
  isValidWeddingId,
} from "@/lib/commerce/storage";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: weddingId } = await context.params;
    if (!isValidWeddingId(weddingId)) {
      return NextResponse.json({ error: "Invalid wedding id" }, { status: 400 });
    }

    const allowed = await withTenantDb(user.id, (db) => hasWeddingAccess(db, weddingId, user.id));
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    if (file.size <= 0 || file.size > WEDDING_ASSET_MAX_BYTES) {
      return NextResponse.json({ error: "Image must be between 1 byte and 5MB" }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const detected = detectWeddingImageType(bytes);
    if (!detected) {
      return NextResponse.json(
        { error: "Only valid JPEG, PNG, WebP, or GIF images are allowed" },
        { status: 400 }
      );
    }
    if (file.type !== detected.mimeType) {
      return NextResponse.json(
        { error: "Image MIME type does not match the uploaded file contents" },
        { status: 400 }
      );
    }

    // Service-role is intentionally used only after Better Auth + tenant membership
    // authorization. The object path itself is generated server-side and cannot be
    // supplied by the browser.
    const path = buildWeddingAssetPath({
      weddingId,
      extension: detected.extension,
      token: randomBytes(12).toString("hex"),
      timestamp: Date.now(),
    });

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.storage
      .from(WEDDING_ASSET_BUCKET)
      .upload(path, bytes, {
        contentType: detected.mimeType,
        upsert: false,
        cacheControl: "31536000",
      });

    if (error) {
      if (/bucket/i.test(error.message)) {
        return NextResponse.json(
          { error: "Create the wedding-assets bucket in Supabase Storage first" },
          { status: 503 }
        );
      }
      throw error;
    }

    const { data: publicData } = supabase.storage
      .from(WEDDING_ASSET_BUCKET)
      .getPublicUrl(data.path);

    return NextResponse.json({
      url: publicData.publicUrl,
      path: data.path,
      mime_type: detected.mimeType,
      size: bytes.byteLength,
    });
  } catch (error) {
    console.error("POST wedding asset upload failed", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
