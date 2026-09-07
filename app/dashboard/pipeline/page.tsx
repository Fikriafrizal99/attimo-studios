import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/commerce/access";
import {
  formatPaymentStatus,
  formatProductionStatus,
  type PaymentStatus,
  type ProductionStatus,
} from "@/lib/commerce/operations";
import { PIPELINE_STATUSES } from "@/lib/commerce/workflow";
import { withTenantDb } from "@/lib/db";

export const metadata = { title: "Order Pipeline | ENDRIYA" };

type OrderRow = {
  id: string;
  customer_id: string;
  customer_name: string;
  wedding_id: string | null;
  wedding_slug: string | null;
  package_name: string;
  price_amount: string;
  payment_status: PaymentStatus;
  production_status: ProductionStatus;
  revision_count: number;
  updated_at: string;
};

function idr(value: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default async function PipelinePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const orders = await withTenantDb(user.id, async (db) => {
    const result = await db.query<OrderRow>(
      `SELECT
         o.id,
         o.customer_id,
         c.name AS customer_name,
         o.wedding_id,
         w.slug AS wedding_slug,
         o.package_name,
         o.price_amount,
         o.payment_status,
         o.production_status,
         o.revision_count,
         o.updated_at
       FROM public.orders o
       JOIN public.customers c ON c.id = o.customer_id
       LEFT JOIN public.weddings w ON w.id = o.wedding_id
      WHERE o.production_status <> 'cancelled'
      ORDER BY o.updated_at DESC`
    );
    return result.rows;
  });

  const cancelled = await withTenantDb(user.id, async (db) => {
    const result = await db.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count
         FROM public.orders
        WHERE production_status = 'cancelled'`
    );
    return result.rows[0]?.count ?? 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#BFA14A]">Commercial workflow</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-50">Order Pipeline</h1>
          <p className="mt-1 text-xs text-neutral-500">
            Explicit production stages. Open an order card to change status, payment, revision, or inspect readiness.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-neutral-400">Active {orders.length}</span>
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-neutral-500">Cancelled {cancelled}</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-3">
        <div className="grid min-w-[1900px] grid-cols-8 gap-3">
          {PIPELINE_STATUSES.map((status) => {
            const stageOrders = orders.filter((order) => order.production_status === status);
            return (
              <section key={status} className="min-h-[420px] rounded-md border border-white/10 bg-[#111113]">
                <div className="sticky top-0 border-b border-white/10 bg-[#141416] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xs font-semibold text-neutral-200">{formatProductionStatus(status)}</h2>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-neutral-500">{stageOrders.length}</span>
                  </div>
                </div>

                <div className="space-y-2 p-2">
                  {stageOrders.length === 0 ? (
                    <div className="rounded-md border border-dashed border-white/8 p-4 text-center text-[11px] text-neutral-600">Empty</div>
                  ) : (
                    stageOrders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/dashboard/orders/${order.id}`}
                        className="block rounded-md border border-white/8 bg-[#18181B] p-3 transition hover:border-[#BFA14A]/30 hover:bg-[#1C1C1F]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-neutral-100">{order.customer_name}</p>
                          {order.revision_count > 0 && (
                            <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">R{order.revision_count}</span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-neutral-500">{order.package_name} · {idr(order.price_amount)}</p>
                        <p className={
                          order.payment_status === "paid"
                            ? "mt-2 text-[10px] font-medium text-emerald-300"
                            : order.payment_status === "partial"
                              ? "mt-2 text-[10px] font-medium text-amber-300"
                              : "mt-2 text-[10px] font-medium text-red-300"
                        }>
                          {formatPaymentStatus(order.payment_status)}
                        </p>
                        <p className="mt-2 truncate font-mono text-[10px] text-neutral-600">{order.wedding_slug ?? "No wedding linked"}</p>
                        <p className="mt-2 text-[9px] text-neutral-700">{new Date(order.updated_at).toLocaleString("id-ID")}</p>
                      </Link>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
