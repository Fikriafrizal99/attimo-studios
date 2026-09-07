import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/commerce/access";
import {
  isPaymentStatus,
  isProductionStatus,
  parseOrderInput,
} from "@/lib/commerce/operations";
import { withTenantDb } from "@/lib/db";
import { resolveTemplate } from "@/templates/registry";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payment = request.nextUrl.searchParams.get("payment_status") ?? "";
    const production = request.nextUrl.searchParams.get("production_status") ?? "";
    const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 120) ?? "";

    if (payment && !isPaymentStatus(payment)) {
      return NextResponse.json({ error: "Invalid payment_status" }, { status: 400 });
    }
    if (production && !isProductionStatus(production)) {
      return NextResponse.json({ error: "Invalid production_status" }, { status: 400 });
    }

    const orders = await withTenantDb(user.id, async (db) => {
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
           w.slug AS wedding_slug,
           w.status AS wedding_status
         FROM public.orders o
         JOIN public.customers c ON c.id = o.customer_id
         LEFT JOIN public.weddings w ON w.id = o.wedding_id
        WHERE ($1 = '' OR o.payment_status = $1)
          AND ($2 = '' OR o.production_status = $2)
          AND (
            $3 = ''
            OR c.name ILIKE '%' || $3 || '%'
            OR c.phone ILIKE '%' || $3 || '%'
            OR o.package_name ILIKE '%' || $3 || '%'
          )
        ORDER BY o.updated_at DESC
        LIMIT 250`,
        [payment, production, query]
      );
      return result.rows;
    });

    return NextResponse.json({ data: orders, count: orders.length });
  } catch (error) {
    console.error("GET /api/orders failed", error);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const parsed = parseOrderInput(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    try {
      resolveTemplate(parsed.value.templateId);
    } catch {
      return NextResponse.json({ error: "Template is not available" }, { status: 400 });
    }

    const order = await withTenantDb(user.id, async (db) => {
      const result = await db.query(
        `INSERT INTO public.orders (
           owner_user_id,
           customer_id,
           wedding_id,
           package_name,
           template_id,
           price_amount,
           currency,
           payment_status,
           production_status,
           revision_count,
           notes
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id, customer_id, wedding_id, package_name, template_id, price_amount,
                   currency, payment_status, production_status, revision_count, notes,
                   created_at, updated_at`,
        [
          user.id,
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
        ]
      );
      return result.rows[0];
    });

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "This wedding is already linked to another order" }, { status: 409 });
      }
      if (error.code === "23514" || error.code === "23503") {
        return NextResponse.json({ error: "Customer or wedding relation is not allowed" }, { status: 400 });
      }
    }
    console.error("POST /api/orders failed", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
