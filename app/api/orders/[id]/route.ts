import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/commerce/access";
import { parseOrderInput } from "@/lib/commerce/operations";
import { isUuid } from "@/lib/commerce/validation";
import { withTenantDb } from "@/lib/db";
import { resolveTemplate } from "@/templates/registry";

const ORDER_PATCH_FIELDS = new Set([
  "customer_id",
  "wedding_id",
  "package_name",
  "template_id",
  "price_amount",
  "currency",
  "payment_status",
  "production_status",
  "revision_count",
  "notes",
]);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

    const order = await withTenantDb(user.id, async (db) => {
      const result = await db.query(
        `SELECT
           o.id,
           o.customer_id,
           o.wedding_id,
           o.package_name,
           o.template_id,
           o.price_amount,
           o.currency,
           o.payment_status,
           o.production_status,
           o.revision_count,
           o.notes,
           o.created_at,
           o.updated_at,
           c.name AS customer_name,
           c.phone AS customer_phone,
           c.email AS customer_email,
           w.slug AS wedding_slug,
           w.status AS wedding_status,
           w.content AS wedding_content
         FROM public.orders o
         JOIN public.customers c ON c.id = o.customer_id
         LEFT JOIN public.weddings w ON w.id = o.wedding_id
        WHERE o.id = $1
        LIMIT 1`,
        [id]
      );
      return result.rows[0] ?? null;
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ data: order });
  } catch (error) {
    console.error("GET /api/orders/[id] failed", error);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
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
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const requestBody = body as Record<string, unknown>;
    const unknownFields = Object.keys(requestBody).filter((key) => !ORDER_PATCH_FIELDS.has(key));
    if (unknownFields.length) {
      return NextResponse.json({ error: "Unsupported order fields", fields: unknownFields }, { status: 400 });
    }

    const result = await withTenantDb(user.id, async (db) => {
      const existingResult = await db.query(
        `SELECT customer_id, wedding_id, package_name, template_id, price_amount, currency,
                payment_status, production_status, revision_count, notes
           FROM public.orders
          WHERE id = $1
          LIMIT 1`,
        [id]
      );
      const existing = existingResult.rows[0];
      if (!existing) return { kind: "missing" } as const;

      const parsed = parseOrderInput({ ...existing, ...requestBody });
      if (!parsed.ok) return { kind: "invalid", error: parsed.error } as const;

      try {
        resolveTemplate(parsed.value.templateId);
      } catch {
        return { kind: "invalid", error: "Template is not available" } as const;
      }

      const updateResult = await db.query(
        `UPDATE public.orders
            SET customer_id = $1,
                wedding_id = $2,
                package_name = $3,
                template_id = $4,
                price_amount = $5,
                currency = $6,
                payment_status = $7,
                production_status = $8,
                revision_count = $9,
                notes = $10
          WHERE id = $11
          RETURNING id, customer_id, wedding_id, package_name, template_id, price_amount,
                    currency, payment_status, production_status, revision_count, notes,
                    created_at, updated_at`,
        [
          parsed.value.customerId,
          parsed.value.weddingId,
          parsed.value.packageName,
          parsed.value.templateId,
          parsed.value.priceAmount,
          parsed.value.currency,
          parsed.value.paymentStatus,
          parsed.value.productionStatus,
          parsed.value.revisionCount,
          parsed.value.notes,
          id,
        ]
      );
      return { kind: "ok", data: updateResult.rows[0] } as const;
    });

    if (result.kind === "missing") return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (result.kind === "invalid") return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ data: result.data });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "This wedding is already linked to another order" }, { status: 409 });
      }
      if (error.code === "23514" || error.code === "23503") {
        return NextResponse.json({ error: "Customer or wedding relation is not allowed" }, { status: 400 });
      }
    }
    console.error("PATCH /api/orders/[id] failed", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
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
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

    const deleted = await withTenantDb(user.id, async (db) => {
      const result = await db.query(`DELETE FROM public.orders WHERE id = $1 RETURNING id`, [id]);
      return result.rows[0] ?? null;
    });
    if (!deleted) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/orders/[id] failed", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
