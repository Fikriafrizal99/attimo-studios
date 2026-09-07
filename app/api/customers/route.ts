import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/commerce/access";
import { parseCustomerInput } from "@/lib/commerce/operations";
import { withTenantDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 120) ?? "";
    const customers = await withTenantDb(user.id, async (db) => {
      const result = await db.query(
        `SELECT
           c.id,
           c.name,
           c.phone,
           c.email,
           c.notes,
           c.created_at,
           c.updated_at,
           COUNT(o.id)::int AS order_count
         FROM public.customers c
         LEFT JOIN public.orders o ON o.customer_id = c.id
        WHERE ($1 = '' OR c.name ILIKE '%' || $1 || '%' OR c.phone ILIKE '%' || $1 || '%' OR COALESCE(c.email, '') ILIKE '%' || $1 || '%')
        GROUP BY c.id
        ORDER BY c.updated_at DESC
        LIMIT 200`,
        [query]
      );
      return result.rows;
    });

    return NextResponse.json({ data: customers, count: customers.length });
  } catch (error) {
    console.error("GET /api/customers failed", error);
    return NextResponse.json({ error: "Failed to load customers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const parsed = parseCustomerInput(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const customer = await withTenantDb(user.id, async (db) => {
      const result = await db.query(
        `INSERT INTO public.customers (owner_user_id, name, phone, email, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, phone, email, notes, created_at, updated_at`,
        [
          user.id,
          parsed.value.name,
          parsed.value.phone,
          parsed.value.email,
          parsed.value.notes,
        ]
      );
      return result.rows[0];
    });

    return NextResponse.json({ data: customer }, { status: 201 });
  } catch (error) {
    console.error("POST /api/customers failed", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
