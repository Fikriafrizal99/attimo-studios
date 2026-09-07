import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/commerce/access";
import type { PaymentStatus, ProductionStatus } from "@/lib/commerce/operations";
import { withTenantDb } from "@/lib/db";
import { getActiveTemplates } from "@/templates/registry";
import { OrderManager } from "./OrderManager";

export const metadata = { title: "Orders | ENDRIYA" };

function weddingTitle(content: unknown) {
  const value = content as
    | { couple?: { bride?: { name?: string }; groom?: { name?: string } } }
    | null;
  const bride = value?.couple?.bride?.name?.trim();
  const groom = value?.couple?.groom?.name?.trim();
  if (bride && groom) return `${bride} & ${groom}`;
  return bride || groom || "Untitled wedding";
}

export default async function OrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const data = await withTenantDb(user.id, async (db) => {
    const [ordersResult, customersResult, weddingsResult] = await Promise.all([
      db.query<{
        id: string;
        customer_id: string;
        wedding_id: string | null;
        package_name: string;
        template_id: string;
        price_amount: string;
        currency: string;
        payment_status: PaymentStatus;
        production_status: ProductionStatus;
        revision_count: number;
        notes: string;
        created_at: string;
        updated_at: string;
        customer_name: string;
        customer_phone: string;
        wedding_slug: string | null;
        wedding_status: string | null;
      }>(
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
         ORDER BY o.updated_at DESC`
      ),
      db.query<{ id: string; name: string; phone: string }>(
        `SELECT id, name, phone FROM public.customers ORDER BY name ASC`
      ),
      db.query<{ id: string; status: string; template_id: string; content: unknown }>(
        `SELECT w.id, w.status, w.template_id, w.content
           FROM public.weddings w
           JOIN public.wedding_collaborators wc
             ON wc.wedding_id = w.id
            AND wc.user_id = $1
            AND wc.role = 'owner'
          ORDER BY COALESCE(w.updated_at, w.created_at) DESC`,
        [user.id]
      ),
    ]);

    return {
      orders: ordersResult.rows,
      customers: customersResult.rows,
      weddings: weddingsResult.rows.map((item) => ({
        id: item.id,
        title: weddingTitle(item.content),
        templateId: item.template_id,
        status: item.status,
      })),
    };
  });

  const templates = getActiveTemplates().map((item) => ({ id: item.id, name: item.name }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#BFA14A]">Commerce Operations</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-50">Orders</h1>
          <p className="mt-1 text-xs text-neutral-500">
            Track package, price, payment, production status, revision count, and optional wedding linkage.
          </p>
        </div>
        <Link href="/dashboard/pipeline" className="rounded-md border border-white/10 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-white/5">
          View pipeline →
        </Link>
      </div>
      <OrderManager
        initialOrders={data.orders}
        customers={data.customers}
        weddings={data.weddings}
        templates={templates}
      />
    </div>
  );
}
