import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/commerce/access";
import {
  formatPaymentStatus,
  formatProductionStatus,
  type PaymentStatus,
  type ProductionStatus,
} from "@/lib/commerce/operations";
import { withTenantDb } from "@/lib/db";

export const metadata = { title: "Customer | ENDRIYA" };

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

type OrderRow = {
  id: string;
  wedding_id: string | null;
  package_name: string;
  price_amount: string;
  payment_status: PaymentStatus;
  production_status: ProductionStatus;
  revision_count: number;
  wedding_slug: string | null;
  updated_at: string;
};

function idr(value: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default async function CustomerWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const data = await withTenantDb(user.id, async (db) => {
    const customerResult = await db.query<CustomerRow>(
      `SELECT id, name, phone, email, notes, created_at, updated_at
         FROM public.customers
        WHERE id = $1
        LIMIT 1`,
      [id]
    );
    const customer = customerResult.rows[0];
    if (!customer) return null;

    const ordersResult = await db.query<OrderRow>(
      `SELECT
         o.id,
         o.wedding_id,
         o.package_name,
         o.price_amount,
         o.payment_status,
         o.production_status,
         o.revision_count,
         w.slug AS wedding_slug,
         o.updated_at
       FROM public.orders o
       LEFT JOIN public.weddings w ON w.id = o.wedding_id
      WHERE o.customer_id = $1
      ORDER BY o.updated_at DESC`,
      [id]
    );
    return { customer, orders: ordersResult.rows };
  });

  if (!data) notFound();

  const totalValue = data.orders.reduce((sum, order) => sum + (Number(order.price_amount) || 0), 0);
  const paidOrders = data.orders.filter((order) => order.payment_status === "paid").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#BFA14A]">Customer workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-50">{data.customer.name}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400">
            <span>{data.customer.phone}</span>
            <span>{data.customer.email ?? "No email"}</span>
          </div>
        </div>
        <Link href="/dashboard/customers" className="rounded-md border border-white/10 px-3 py-2 text-xs text-neutral-300 hover:bg-white/5">
          ← Customers
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-white/10 bg-[#141416] px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-neutral-500">Orders</p>
          <p className="mt-1 text-xl font-semibold text-neutral-50">{data.orders.length}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-[#141416] px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-neutral-500">Paid orders</p>
          <p className="mt-1 text-xl font-semibold text-neutral-50">{paidOrders}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-[#141416] px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-neutral-500">Order value</p>
          <p className="mt-1 text-xl font-semibold text-neutral-50">{idr(String(totalValue))}</p>
        </div>
      </div>

      {data.customer.notes && (
        <section className="rounded-md border border-white/10 bg-[#141416] p-4">
          <h2 className="text-sm font-semibold text-neutral-100">Customer notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-300">{data.customer.notes}</p>
        </section>
      )}

      <section className="overflow-hidden rounded-md border border-white/10 bg-[#141416]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Orders</h2>
            <p className="mt-1 text-xs text-neutral-500">Commercial history and active work for this customer.</p>
          </div>
          <Link href="/dashboard/orders" className="text-xs text-[#BFA14A] hover:underline">Open orders →</Link>
        </div>

        {data.orders.length === 0 ? (
          <div className="p-8 text-sm text-neutral-500">This customer has no orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-neutral-200">
              <thead className="border-b border-white/10 bg-black/20 text-[11px] uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left">Package</th>
                  <th className="px-4 py-3 text-left">Value</th>
                  <th className="px-4 py-3 text-left">Payment</th>
                  <th className="px-4 py-3 text-left">Production</th>
                  <th className="px-4 py-3 text-left">Wedding</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.025]">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/orders/${order.id}`} className="font-medium text-neutral-50 hover:underline">
                        {order.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-4 py-3">{order.package_name}</td>
                    <td className="px-4 py-3">{idr(order.price_amount)}</td>
                    <td className="px-4 py-3">{formatPaymentStatus(order.payment_status)}</td>
                    <td className="px-4 py-3">{formatProductionStatus(order.production_status)}</td>
                    <td className="px-4 py-3">
                      {order.wedding_id ? (
                        <Link href={`/dashboard/weddings/${order.wedding_id}`} className="font-mono text-[11px] text-[#BFA14A] hover:underline">
                          {order.wedding_slug ?? "Open wedding"}
                        </Link>
                      ) : (
                        <span className="text-neutral-600">Not linked</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{new Date(order.updated_at).toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
