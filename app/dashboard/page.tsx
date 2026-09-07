import Link from "next/link";
import { redirect } from "next/navigation";
import { withTenantDb } from "@/lib/db";
import { getSessionUser } from "@/lib/commerce/access";
import {
  formatPaymentStatus,
  formatProductionStatus,
  type PaymentStatus,
  type ProductionStatus,
} from "@/lib/commerce/operations";
import { buildInvitationUrl } from "@/lib/commerce/url";
import { CreateWeddingButton } from "./CreateWeddingButton";

type WeddingListRow = {
  id: string;
  slug: string | null;
  status: "draft" | "released";
  template_id: string;
  content: unknown;
  updated_at: string | null;
  created_at: string | null;
  role: "owner" | "collaborator";
};

type RecentOrder = {
  id: string;
  customer_name: string;
  package_name: string;
  payment_status: PaymentStatus;
  production_status: ProductionStatus;
  revision_count: number;
  wedding_id: string | null;
  wedding_slug: string | null;
  updated_at: string;
};

type OpsSummary = {
  total_orders: number;
  active_orders: number;
  payment_attention: number;
  waiting_data: number;
  in_progress: number;
  preview_queue: number;
  revision_queue: number;
  approved_queue: number;
};

function weddingTitle(content: unknown) {
  const value = content as
    | { couple?: { bride?: { name?: string }; groom?: { name?: string } } }
    | null;
  const bride = value?.couple?.bride?.name?.trim();
  const groom = value?.couple?.groom?.name?.trim();
  if (bride && groom) return `${bride} & ${groom}`;
  return bride || groom || "Untitled wedding";
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const data = await withTenantDb(user.id, async (db) => {
    await db.query(`SELECT app_private.claim_pending_collaborator_invites_for_current_user()`);

    const [weddingsResult, summaryResult, recentOrdersResult, customerCountResult] = await Promise.all([
      db.query<WeddingListRow>(
        `SELECT
           w.id,
           w.slug,
           w.status,
           w.template_id,
           w.content,
           w.updated_at,
           w.created_at,
           wc.role
         FROM public.weddings AS w
         JOIN public.wedding_collaborators AS wc
           ON wc.wedding_id = w.id
          AND wc.user_id = $1
         ORDER BY COALESCE(w.updated_at, w.created_at) DESC, w.created_at DESC`,
        [user.id]
      ),
      db.query<OpsSummary>(
        `SELECT
           COUNT(*)::int AS total_orders,
           COUNT(*) FILTER (WHERE production_status NOT IN ('completed', 'cancelled'))::int AS active_orders,
           COUNT(*) FILTER (WHERE payment_status IN ('unpaid', 'partial') AND production_status <> 'cancelled')::int AS payment_attention,
           COUNT(*) FILTER (WHERE production_status = 'waiting_data')::int AS waiting_data,
           COUNT(*) FILTER (WHERE production_status = 'in_progress')::int AS in_progress,
           COUNT(*) FILTER (WHERE production_status = 'preview_ready')::int AS preview_queue,
           COUNT(*) FILTER (WHERE production_status = 'revision')::int AS revision_queue,
           COUNT(*) FILTER (WHERE production_status = 'approved')::int AS approved_queue
         FROM public.orders`
      ),
      db.query<RecentOrder>(
        `SELECT
           o.id,
           c.name AS customer_name,
           o.package_name,
           o.payment_status,
           o.production_status,
           o.revision_count,
           o.wedding_id,
           w.slug AS wedding_slug,
           o.updated_at
         FROM public.orders o
         JOIN public.customers c ON c.id = o.customer_id
         LEFT JOIN public.weddings w ON w.id = o.wedding_id
         WHERE o.production_status NOT IN ('completed', 'cancelled')
         ORDER BY o.updated_at DESC
         LIMIT 8`
      ),
      db.query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM public.customers`),
    ]);

    return {
      weddings: weddingsResult.rows,
      summary: summaryResult.rows[0] ?? {
        total_orders: 0,
        active_orders: 0,
        payment_attention: 0,
        waiting_data: 0,
        in_progress: 0,
        preview_queue: 0,
        revision_queue: 0,
        approved_queue: 0,
      },
      recentOrders: recentOrdersResult.rows,
      customerCount: customerCountResult.rows[0]?.count ?? 0,
    };
  });

  const ownerProjects = data.weddings.filter((item) => item.role === "owner");
  const draftCount = ownerProjects.filter((item) => item.status === "draft").length;
  const releasedCount = ownerProjects.filter((item) => item.status === "released").length;

  const kpis = [
    ["Active orders", data.summary.active_orders, "/dashboard/pipeline"],
    ["Payment attention", data.summary.payment_attention, "/dashboard/orders"],
    ["Waiting data", data.summary.waiting_data, "/dashboard/pipeline"],
    ["Revision queue", data.summary.revision_queue, "/dashboard/pipeline"],
    ["Preview queue", data.summary.preview_queue, "/dashboard/pipeline"],
    ["Approved", data.summary.approved_queue, "/dashboard/pipeline"],
    ["Customers", data.customerCount, "/dashboard/customers"],
    ["Released weddings", releasedCount, "/dashboard"],
  ] as const;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#BFA14A]">ENDRIYA Operations</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-50">Operations Overview</h1>
          <p className="mt-1 text-xs text-neutral-500">Orders, payments, production queue, and wedding projects in one operator view.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/orders" className="rounded-md border border-white/10 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-white/5">Manage orders</Link>
          <Link href="/dashboard/pipeline" className="rounded-md border border-white/10 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-white/5">Open pipeline</Link>
          <CreateWeddingButton className="bg-neutral-100 text-neutral-950 hover:bg-neutral-200" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(([label, value, href]) => (
          <Link key={label} href={href} className="rounded-md border border-white/10 bg-[#141416] px-4 py-3 transition hover:border-[#BFA14A]/25 hover:bg-[#18181B]">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</p>
            <p className="mt-1 text-xl font-semibold text-neutral-50">{value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <section className="overflow-hidden rounded-md border border-white/10 bg-[#141416]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">Active order queue</h2>
              <p className="mt-1 text-xs text-neutral-500">Most recently touched active commercial work.</p>
            </div>
            <Link href="/dashboard/pipeline" className="text-xs text-[#BFA14A] hover:underline">Pipeline →</Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <div className="p-8 text-sm text-neutral-500">No active orders yet. Create a customer and order to start the commercial workflow.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {data.recentOrders.map((order) => (
                <Link key={order.id} href={`/dashboard/orders/${order.id}`} className="flex flex-col gap-2 p-4 transition hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-100">{order.customer_name} · {order.package_name}</p>
                    <p className="mt-1 truncate font-mono text-[10px] text-neutral-600">{order.wedding_slug ?? "No wedding linked"}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3 text-[11px]">
                    <span className={order.payment_status === "paid" ? "text-emerald-300" : order.payment_status === "partial" ? "text-amber-300" : "text-red-300"}>{formatPaymentStatus(order.payment_status)}</span>
                    <span className="text-neutral-400">{formatProductionStatus(order.production_status)}</span>
                    {order.revision_count > 0 && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-300">R{order.revision_count}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-md border border-white/10 bg-[#141416] p-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Production pulse</h2>
            <p className="mt-1 text-xs text-neutral-500">Current queue distribution.</p>
          </div>
          <div className="mt-4 space-y-3">
            {[
              ["Waiting customer data", data.summary.waiting_data],
              ["In progress", data.summary.in_progress],
              ["Preview ready", data.summary.preview_queue],
              ["Revision", data.summary.revision_queue],
              ["Approved / ready for release flow", data.summary.approved_queue],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between rounded-md border border-white/8 bg-black/10 px-3 py-2.5">
                <span className="text-xs text-neutral-400">{label}</span>
                <span className="text-sm font-semibold text-neutral-100">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-md border border-white/10 bg-[#141416]">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Wedding projects</h2>
            <p className="mt-1 text-xs text-neutral-500">{ownerProjects.length} owned · {draftCount} draft · {releasedCount} released · {data.weddings.length - ownerProjects.length} collaborator</p>
          </div>
          <CreateWeddingButton label="New wedding" className="border border-white/10 text-neutral-200 hover:bg-white/5" />
        </div>

        {data.weddings.length === 0 ? (
          <div className="p-8 text-sm text-neutral-500">No wedding projects yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-neutral-200">
              <thead className="border-b border-white/10 bg-black/20 text-[11px] uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-3 text-left">Project</th>
                  <th className="px-4 py-3 text-left">Access</th>
                  <th className="px-4 py-3 text-left">Template</th>
                  <th className="px-4 py-3 text-left">Slug</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.weddings.map((wedding) => (
                  <tr key={wedding.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.025]">
                    <td className="px-4 py-3"><Link href={`/dashboard/weddings/${wedding.id}`} className="font-medium text-neutral-50 hover:underline">{weddingTitle(wedding.content)}</Link></td>
                    <td className="px-4 py-3"><span className={wedding.role === "owner" ? "inline-flex rounded-full border border-[#BFA14A]/40 bg-[#BFA14A]/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#BFA14A]" : "inline-flex rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-400"}>{wedding.role}</span></td>
                    <td className="px-4 py-3 font-mono text-[11px] text-neutral-400">{wedding.template_id}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-neutral-400">{wedding.slug ?? "—"}</td>
                    <td className="px-4 py-3"><span className={wedding.status === "released" ? "text-[#BFA14A]" : "text-neutral-400"}>{wedding.status === "released" ? "Released" : "Draft"}</span></td>
                    <td className="px-4 py-3 text-neutral-500">{wedding.updated_at || wedding.created_at ? new Date(wedding.updated_at ?? wedding.created_at ?? "").toLocaleString("id-ID") : "—"}</td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-3"><Link href={`/dashboard/weddings/${wedding.id}`} className="hover:underline">Edit</Link><Link href={`/preview/${wedding.id}`} className="hover:underline">Preview</Link>{wedding.status === "released" && wedding.slug && <a href={buildInvitationUrl({ slug: wedding.slug })} target="_blank" rel="noopener noreferrer" className="font-medium text-neutral-50 hover:underline">Live</a>}</div></td>
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
