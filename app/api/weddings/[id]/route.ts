import { NextRequest, NextResponse } from "next/server";
import { withTenantDb, type TenantDbClient } from "@/lib/db";
import { getSessionUser, getWeddingRole } from "@/lib/commerce/access";
import { evaluatePublishReadiness } from "@/lib/commerce/publish-readiness";
import { validateSlug } from "@/lib/commerce/validation";
import {
  validateWeddingContentInput,
  validateWeddingSectionsInput,
} from "@/lib/commerce/wedding-validation";
import { buildInvitationUrl } from "@/lib/commerce/url";
import { resolveTemplate } from "@/templates/registry";

const OWNER_ONLY_PATCH_FIELDS = ["theme", "template_id", "slug", "status"] as const;
const PATCH_FIELDS = new Set(["content", "theme", "sections", "template_id", "slug", "status"]);

type WeddingRow = {
  id: string;
  slug: string | null;
  status: string;
  template_id: string;
  sections: unknown;
  content: unknown;
  theme: unknown;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

async function loadWedding(db: TenantDbClient, id: string): Promise<WeddingRow | null> {
  const result = await db.query<WeddingRow>(
    `SELECT id, slug, status, template_id, sections, content, theme,
            published_at, created_at, updated_at
       FROM public.weddings
      WHERE id = $1
      LIMIT 1`,
    [id]
  );
  return result.rows[0] ?? null;
}

async function updateWedding(
  db: TenantDbClient,
  id: string,
  updates: Record<string, unknown>
): Promise<WeddingRow | null> {
  const allowed = new Set([
    "content",
    "theme",
    "sections",
    "template_id",
    "slug",
    "status",
    "published_at",
    "updated_at",
  ]);
  const entries = Object.entries(updates).filter(([key]) => allowed.has(key));
  if (!entries.length) return loadWedding(db, id);

  const values = entries.map(([, value]) => value);
  const setClause = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
  values.push(id);

  const result = await db.query<WeddingRow>(
    `UPDATE public.weddings
        SET ${setClause}
      WHERE id = $${values.length}
      RETURNING id, slug, status, template_id, sections, content, theme,
                published_at, created_at, updated_at`,
    values
  );
  return result.rows[0] ?? null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;

    return await withTenantDb(user.id, async (db) => {
      const role = await getWeddingRole(db, id, user.id);
      if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const wedding = await loadWedding(db, id);
      if (!wedding) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({
        ...wedding,
        role,
        public_url: wedding.slug ? buildInvitationUrl({ slug: wedding.slug }) : null,
      });
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
    const body = await request.json().catch(() => ({}));
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const requestBody = body as Record<string, unknown>;
    const unknownFields = Object.keys(requestBody).filter((key) => !PATCH_FIELDS.has(key));
    if (unknownFields.length) {
      return NextResponse.json(
        { error: "Unsupported wedding fields", fields: unknownFields },
        { status: 400 }
      );
    }

    return await withTenantDb(user.id, async (db) => {
      const role = await getWeddingRole(db, id, user.id);
      if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const wedding = await loadWedding(db, id);
      if (!wedding) return NextResponse.json({ error: "Not found" }, { status: 404 });

      if (role === "collaborator") {
        const forbiddenFields = OWNER_ONLY_PATCH_FIELDS.filter(
          (field) => requestBody[field] !== undefined
        );
        if (forbiddenFields.length > 0) {
          return NextResponse.json(
            {
              error: "Only the owner can change wedding settings or publish state",
              fields: forbiddenFields,
            },
            { status: 403 }
          );
        }
      }

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      let publishReadiness: ReturnType<typeof evaluatePublishReadiness> | null = null;

      if (requestBody.content !== undefined) {
        const validation = validateWeddingContentInput(requestBody.content);
        if (!validation.ok) {
          return NextResponse.json(
            { error: "Invalid wedding content", details: validation.errors },
            { status: 400 }
          );
        }
        updates.content = validation.value;
      }

      if (requestBody.theme !== undefined) {
        if (!requestBody.theme || typeof requestBody.theme !== "object" || Array.isArray(requestBody.theme)) {
          return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
        }
        updates.theme = requestBody.theme;
      }

      if (requestBody.sections !== undefined) {
        const validation = validateWeddingSectionsInput(requestBody.sections);
        if (!validation.ok) {
          return NextResponse.json(
            { error: "Invalid sections", details: validation.errors },
            { status: 400 }
          );
        }
        updates.sections = validation.value;
      }

      if (requestBody.template_id !== undefined) {
        if (typeof requestBody.template_id !== "string") {
          return NextResponse.json({ error: "Invalid template" }, { status: 400 });
        }
        try {
          resolveTemplate(requestBody.template_id);
        } catch {
          return NextResponse.json({ error: "Template is not available" }, { status: 400 });
        }
        updates.template_id = requestBody.template_id;
      }

      if (requestBody.slug !== undefined) {
        const validated = validateSlug(requestBody.slug);
        if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });

        const availability = await db.query<{ available: boolean }>(
          `SELECT app_private.is_wedding_slug_available($1, $2::uuid) AS available`,
          [validated.value, id]
        );
        if (availability.rows[0]?.available !== true) {
          return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
        }
        updates.slug = validated.value;
      }

      if (requestBody.status !== undefined) {
        if (requestBody.status !== "draft" && requestBody.status !== "released") {
          return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }
        if (requestBody.status === "released") {
          publishReadiness = evaluatePublishReadiness({
            slug: (updates.slug as string | undefined) ?? wedding.slug,
            templateId: (updates.template_id as string | undefined) ?? wedding.template_id,
            content: updates.content ?? wedding.content,
            sections: updates.sections ?? wedding.sections,
          });
          if (!publishReadiness.ready) {
            return NextResponse.json(
              {
                error: "Wedding is not ready to release",
                details: publishReadiness.errors,
                warnings: publishReadiness.warnings,
                checks: publishReadiness.checks,
              },
              { status: 422 }
            );
          }
          updates.published_at = wedding.published_at ?? new Date().toISOString();
        }
        updates.status = requestBody.status;
      }

      const updated = await updateWedding(db, id, updates);
      if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

      return NextResponse.json({
        ...updated,
        role,
        public_url: updated.slug ? buildInvitationUrl({ slug: updated.slug }) : null,
        ...(publishReadiness ? { readiness: publishReadiness } : {}),
      });
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
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

    return await withTenantDb(user.id, async (db) => {
      const role = await getWeddingRole(db, id, user.id);
      if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (role !== "owner") {
        return NextResponse.json({ error: "Only the owner can delete this wedding" }, { status: 403 });
      }

      const result = await db.query(`DELETE FROM public.weddings WHERE id = $1`, [id]);
      if ((result.rowCount ?? 0) === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ success: true });
    });
  } catch (error) {
    console.error("DELETE /api/weddings/[id] failed", error);
    return NextResponse.json({ error: "Failed to delete wedding" }, { status: 500 });
  }
}
