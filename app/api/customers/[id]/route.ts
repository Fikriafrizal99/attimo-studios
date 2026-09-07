import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/commerce/access";
import { parseCustomerInput } from "@/lib/commerce/operations";
import { isUuid } from "@/lib/commerce/validation";
import { withTenantDb } from "@/lib/db";

const CUSTOMER_PATCH_FIELDS = new Set(["name", "phone", "email", "notes"]);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });

    const data = await withTenantDb(user.id, async (db) => {
      const customerResult = await db.query(
        `SELECT id, name, phone, email, notes, created_at, updated_at
           FROM public.customers
          WHERE id = $1
          LIMIT 1`,
        [id]
      );
      const customer = customerResult.rows[0];
      if (!customer) return null;

      const orders = await db.query(
        `SELECT id, wedding_id, package_name, template_id, price_amount, currency,
                payment_status, production_status, revision_count, created_at, updated_at
           FROM public.orders
          WHERE customer_id = $1
          ORDER BY updated_at DESC`,
        [id]
      );
      return { ...customer, orders: orders.rows };
    });

    if (!data) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/customers/[id] failed", error);
    return NextResponse.json({ error: "Failed to load customer" }, { status: 500 });
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
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const requestBody = body as Record<string, unknown>;
    const unknownFields = Object.keys(requestBody).filter((key) => !CUSTOMER_PATCH_FIELDS.has(key));
    if (unknownFields.length) {
      return NextResponse.json({ error: "Unsupported customer fields", fields: unknownFields }, { status: 400 });
    }

    const customer = await withTenantDb(user.id, async (db) => {
      const existingResult = await db.query(
        `SELECT name, phone, email, notes FROM public.customers WHERE id = $1 LIMIT 1`,
        [id]
      );
      const existing = existingResult.rows[0];
      if (!existing) return null;

      const parsed = parseCustomerInput({ ...existing, ...requestBody });
      if (!parsed.ok) return { validationError: parsed.error } as const;

      const result = await db.query(
        `UPDATE public.customers
            SET name = $1, phone = $2, email = $3, notes = $4
          WHERE id = $5
          RETURNING id, name, phone, email, notes, created_at, updated_at`,
        [parsed.value.name, parsed.value.phone, parsed.value.email, parsed.value.notes, id]
      );
      return result.rows[0] ?? null;
    });

    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    if ("validationError" in customer) {
      return NextResponse.json({ error: customer.validationError }, { status: 400 });
    }
    return NextResponse.json({ data: customer });
  } catch (error) {
    console.error("PATCH /api/customers/[id] failed", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
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
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });

    const deleted = await withTenantDb(user.id, async (db) => {
      const result = await db.query(`DELETE FROM public.customers WHERE id = $1 RETURNING id`, [id]);
      return result.rows[0] ?? null;
    });
    if (!deleted) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23503") {
      return NextResponse.json(
        { error: "Customer cannot be deleted while orders still reference it" },
        { status: 409 }
      );
    }
    console.error("DELETE /api/customers/[id] failed", error);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
