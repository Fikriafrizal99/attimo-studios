import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/commerce/access";
import {
  formatPaymentStatus,
  formatProductionStatus,
  type PaymentStatus,
  type ProductionStatus,
} from "@/lib/commerce/operations";
import { evaluatePublishReadiness, type PublishReadiness } from "@/lib/commerce/publish-readiness";
import { activityLabel, getOperationalAttention } from "@/lib/commerce/workflow";
import { withTenantDb } from "@/lib/db";
import { OrderWorkflowPanel } from "./OrderWorkflowPanel";

export const metadata = { title: "Order Workspace | ENDRIYA" };

type OrderRow = {
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
  customer_email: string | null;
  wedding_slug: string | null;
  wedding_status: "draft" | "released" | null;
  wedding_template_id: string | null;
  wedding_sections: unknown;
  wedding_content: unknown;
};

type ActivityRow = {
  id: string;
  event_type: string;
  from_value: string | null;
  to_value: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_name: string | null;
};

function idr(value: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function activityDescription(activity: ActivityRow): string {
  if (activity.event_type === "created") {
    return "Order entered the operational pipeline.";
  }
  if (activity.from_value != null || activity.to_value != null) {
    return `${activity.from_value ?? "—"} → ${activity.to_value ?? "—"}`;
  }
  return "Order record changed.";
}

export default async function OrderWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const data = await withTenantDb(user.id, async (db) => {
    const orderResult = await db.query<OrderRow>(
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
         w.template_id AS wedding_template_id,
         w.sections AS wedding_sections,
         w.content AS wedding_content
       FROM public.orders o
       JOIN public.customers c ON c.id = o.customer_id
       LEFT JOIN public.weddings w ON w.id = o.wedding_id
      WHERE o.id = $1
      LIMIT 1`,
      [id]
    );
    const order = orderResult.rows[0];
    if (!order) return null;

    const activityResult = await db.query<ActivityRow>(
      `SELECT
         oa.id,
         oa.event_type,
         oa.from_value,
         oa.to_value,
         oa.metadata,
         oa.created_at,
         u.name AS actor_name
       FROM public.order_activity oa
       LEFT JOIN public."user" u ON u.id = oa.actor_user_id
      WHERE oa.order_id = $1
      ORDER BY oa.created_at DESC
      LIMIT 100`,
      [id]
    );

    return { order, activity: activityResult.rows };
  });

  if (!data) notFound();
  const order = data.order;

  let readiness: PublishReadiness | null = null;
  if (
    order.wedding_id &&
    order.wedding_template_id &&
    order.wedding_content != null &&
    order.wedding_sections != null
  ) {
    readiness = evaluatePublishReadiness({
      slug: order.wedding_slug,
      templateId: order.wedding_template_id,
      content: order.wedding_content,
      sections: order.wedding_sections,
    });
  }

  const attention = getOperationalAttention({
    productionStatus: order.production_status,
    paymentStatus: order.payment_status,
    weddingId: order.wedding_id,
    weddingReleased: order.wedding_status === "released",
    publishReady: readiness?.ready ?? null,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#BFA14A]">Order workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-50">
            {order.customer_name} · {order.package_name}
          </h1>
          <p className="mt-1 font-mono text-[11px] text-neutral-600">{order.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/orders" className="rounded-md border border-white/10 px-3 py-2 text-xs text-neutral-300 hover:bg-white/5">
            ← Orders
          </Link>
          {order.wedding_id && (
            <Link href={`/dashboard/weddings/${order.wedding_id}`} className="rounded-md bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-950">
              Open wedding →
            </Link>
          )}
        </div>
      </div>

      {attention.length > 0 && (
        <section className="rounded-md border border-amber-500/25 bg-amber-500/5 p-4">
          <h2 className="text-sm font-semibold text-amber-200">Needs attention</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-amber-100/80">
            {attention.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-white/10 bg-[#141416] px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-neutral-500">Production</p>
          <p className="mt-1 text-base font-semibold text-neutral-50">{formatProductionStatus(order.production_status)}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-[#141416] px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-neutral-500">Payment</p>
          <p className="mt-1 text-base font-semibold text-neutral-50">{formatPaymentStatus(order.payment_status)}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-[#141416] px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-neutral-500">Price</p>
          <p className="mt-1 text-base font-semibold text-neutral-50">{idr(order.price_amount)}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-[#141416] px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-neutral-500">Revisions</p>
          <p className="mt-1 text-base font-semibold text-neutral-50">{order.revision_count}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-md border border-white/10 bg-[#141416] p-4">
            <h2 className="text-sm font-semibold text-neutral-100">Commercial context</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-white/8 bg-black/10 p-3">
                <p className="text-[11px] uppercase tracking-wider text-neutral-600">Customer</p>
                <p className="mt-2 font-medium text-neutral-50">{order.customer_name}</p>
                <p className="mt-1 text-xs text-neutral-400">{order.customer_phone}</p>
                <p className="mt-1 text-xs text-neutral-500">{order.customer_email ?? "No email"}</p>
                <Link href={`/dashboard/customers/${order.customer_id}`} className="mt-3 inline-block text-xs text-[#BFA14A] hover:underline">
                  View customer →
                </Link>
              </div>
              <div className="rounded-md border border-white/8 bg-black/10 p-3">
                <p className="text-[11px] uppercase tracking-wider text-neutral-600">Wedding project</p>
                {order.wedding_id ? (
                  <>
                    <p className="mt-2 font-medium text-neutral-50">{order.wedding_slug ?? "Slug not set"}</p>
                    <p className="mt-1 text-xs text-neutral-400">Wedding status: {order.wedding_status ?? "—"}</p>
                    <p className="mt-1 font-mono text-[11px] text-neutral-600">{order.wedding_template_id}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      <Link href={`/dashboard/weddings/${order.wedding_id}`} className="text-[#BFA14A] hover:underline">Edit wedding</Link>
                      <Link href={`/preview/${order.wedding_id}`} className="text-neutral-300 hover:underline">Preview</Link>
                      <Link href={`/dashboard/weddings/${order.wedding_id}/settings`} className="text-neutral-300 hover:underline">Publish settings</Link>
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-neutral-500">No wedding project linked yet.</p>
                )}
              </div>
            </div>
            {order.notes && (
              <div className="mt-4 rounded-md border border-white/8 bg-black/10 p-3">
                <p className="text-[11px] uppercase tracking-wider text-neutral-600">Order notes</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-300">{order.notes}</p>
              </div>
            )}
          </section>

          <section className="rounded-md border border-white/10 bg-[#141416] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-neutral-100">Publish readiness</h2>
                <p className="mt-1 text-xs text-neutral-500">Uses the same centralized wedding readiness validator as release settings.</p>
              </div>
              {readiness ? (
                <span className={readiness.ready ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300" : "rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300"}>
                  {readiness.ready ? "Ready" : `${readiness.errors.length} blocking issue(s)`}
                </span>
              ) : (
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-neutral-500">No linked wedding</span>
              )}
            </div>

            {readiness && (
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {readiness.checks.map((check) => (
                  <div key={check.id} className="rounded-md border border-white/8 bg-black/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium text-neutral-200">{check.label}</p>
                      <span className={check.status === "pass" ? "text-[10px] font-semibold uppercase text-emerald-300" : check.status === "warn" ? "text-[10px] font-semibold uppercase text-amber-300" : "text-[10px] font-semibold uppercase text-red-300"}>{check.status}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-neutral-500">{check.message}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-md border border-white/10 bg-[#141416]">
            <div className="border-b border-white/10 p-4">
              <h2 className="text-sm font-semibold text-neutral-100">Activity history</h2>
              <p className="mt-1 text-xs text-neutral-500">Lightweight audit trail for meaningful workflow changes.</p>
            </div>
            {data.activity.length === 0 ? (
              <div className="p-6 text-sm text-neutral-500">No activity recorded yet.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {data.activity.map((activity) => (
                  <div key={activity.id} className="flex gap-3 p-4">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#BFA14A]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-200">{activityLabel(activity.event_type)}</p>
                      <p className="mt-1 text-xs text-neutral-500">{activityDescription(activity)}</p>
                      <p className="mt-1 text-[11px] text-neutral-600">
                        {activity.actor_name ?? "Operator"} · {new Date(activity.created_at).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <OrderWorkflowPanel
          orderId={order.id}
          initialProductionStatus={order.production_status}
          initialPaymentStatus={order.payment_status}
          initialRevisionCount={order.revision_count}
        />
      </div>
    </div>
  );
}
