import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getSessionUser, getWeddingRole, hasWeddingAccess } from "@/lib/commerce/access";
import { normalizeWeddingContent } from "@/lib/commerce/content";
import { validateSlug } from "@/lib/commerce/validation";
import { buildInvitationUrl } from "@/lib/commerce/url";
import { resolveTemplate, validateTemplateCompatibility } from "@/templates/registry";
import type { SectionConfig } from "@/lib/wedding-defaults";

function parseSections(value: unknown): SectionConfig[] | null {
  if (!Array.isArray(value)) return null;
  const parsed = value.map((item) => {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.enabled !== "boolean" || typeof row.order !== "number") return null;
    return { id: row.id, enabled: row.enabled, order: row.order };
  });
  return parsed.every(Boolean) ? (parsed as SectionConfig[]) : null;
}

function releaseErrors(input: {
  slug: string | null;
  templateId: string;
  content: unknown;
  sections: SectionConfig[];
}): string[] {
  const errors: string[] = [];
  if (!input.slug) errors.push("Set a public slug before release.");
  const normalized = normalizeWeddingContent(input.content);
  if (!normalized.couple?.bride.name || !normalized.couple?.groom.name) {
    errors.push("Bride and groom names are required before release.");
  }
  const completeEvent = normalized.events?.find(
    (event) => event.title && event.date && event.time && event.location && event.address
  );
  if (!completeEvent) errors.push("At least one complete wedding event is required before release.");
  try {
    resolveTemplate(input.templateId);
    const enabledIds = input.sections.filter((section) => section.enabled).map((section) => section.id);
    const compatibility = validateTemplateCompatibility(input.templateId, enabledIds);
    if (compatibility.unsupported.length) {
      errors.push(`Template does not support enabled sections: ${compatibility.unsupported.join(", ")}`);
    }
    if (compatibility.missingRequired.length) {
      errors.push(`Required template sections are disabled: ${compatibility.missingRequired.join(", ")}`);
    }
  } catch {
    errors.push("Selected template is not available.");
  }
  return errors;
}

async function loadWedding(supabase: ReturnType<typeof createServerClient>, id: string) {
  return supabase
    .from("weddings")
    .select("id, slug, status, template_id, sections, content, theme, published_at, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const supabase = createServerClient();
    if (!(await hasWeddingAccess(supabase, id, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { data, error } = await loadWedding(supabase, id);
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      ...data,
      public_url: data.slug ? buildInvitationUrl({ slug: data.slug }) : null,
    });
  } catch (error) {
    console.error("GET /api/weddings/[id] failed", error);
    return NextResponse.json({ error: "Failed to load wedding" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const supabase = createServerClient();
    if (!(await hasWeddingAccess(supabase, id, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { data: wedding, error: loadError } = await loadWedding(supabase, id);
    if (loadError || !wedding) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.content !== undefined) updates.content = normalizeWeddingContent(body.content);
    if (body.theme !== undefined) {
      if (!body.theme || typeof body.theme !== "object" || Array.isArray(body.theme)) {
        return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
      }
      updates.theme = body.theme;
    }
    if (body.sections !== undefined) {
      const sections = parseSections(body.sections);
      if (!sections) return NextResponse.json({ error: "Invalid sections" }, { status: 400 });
      updates.sections = sections;
    }
    if (body.template_id !== undefined) {
      if (typeof body.template_id !== "string") return NextResponse.json({ error: "Invalid template" }, { status: 400 });
      try {
        resolveTemplate(body.template_id);
      } catch {
        return NextResponse.json({ error: "Template is not available" }, { status: 400 });
      }
      updates.template_id = body.template_id;
    }
    if (body.slug !== undefined) {
      const validated = validateSlug(body.slug);
      if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });
      const { data: existing } = await supabase
        .from("weddings")
        .select("id")
        .eq("slug", validated.value)
        .neq("id", id)
        .maybeSingle();
      if (existing) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
      updates.slug = validated.value;
    }

    if (body.status !== undefined) {
      if (body.status !== "draft" && body.status !== "released") {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      if (body.status === "released") {
        const targetSlug = (updates.slug as string | undefined) ?? wedding.slug;
        const targetTemplate = (updates.template_id as string | undefined) ?? wedding.template_id;
        const targetContent = updates.content ?? wedding.content;
        const targetSections = (updates.sections as SectionConfig[] | undefined) ?? (Array.isArray(wedding.sections) ? (wedding.sections as SectionConfig[]) : []);
        const errors = releaseErrors({ slug: targetSlug, templateId: targetTemplate, content: targetContent, sections: targetSections });
        if (errors.length) {
          return NextResponse.json({ error: "Wedding is not ready to release", details: errors }, { status: 422 });
        }
        updates.published_at = wedding.published_at ?? new Date().toISOString();
      }
      updates.status = body.status;
    }

    const { data: updated, error: updateError } = await supabase
      .from("weddings")
      .update(updates)
      .eq("id", id)
      .select("id, slug, status, template_id, sections, content, theme, published_at, created_at, updated_at")
      .single();
    if (updateError) throw updateError;

    return NextResponse.json({
      ...updated,
      public_url: updated.slug ? buildInvitationUrl({ slug: updated.slug }) : null,
    });
  } catch (error) {
    console.error("PATCH /api/weddings/[id] failed", error);
    return NextResponse.json({ error: "Failed to update wedding" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const supabase = createServerClient();
    const role = await getWeddingRole(supabase, id, user.id);
    if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (role !== "owner") return NextResponse.json({ error: "Only the owner can delete this wedding" }, { status: 403 });

    const { error } = await supabase.from("weddings").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/weddings/[id] failed", error);
    return NextResponse.json({ error: "Failed to delete wedding" }, { status: 500 });
  }
}
