"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  PAYMENT_STATUSES,
  PRODUCTION_STATUSES,
  formatPaymentStatus,
  formatProductionStatus,
  type PaymentStatus,
  type ProductionStatus,
} from "@/lib/commerce/operations";

type CustomerOption = { id: string; name: string; phone: string };
type WeddingOption = { id: string; title: string; templateId: string; status: string };
type TemplateOption = { id: string; name: string };

type OrderRow = {
  id: string;
  customer_id: string;
  wedding_id: string | null;
  package_name: string;
  template_id: string;
  price_amount: number | string;
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
};

type OrderForm = {
  customerId: string;
  weddingId: string;
  packageName: string;
  templateId: string;
  priceAmount: string;
  paymentStatus: PaymentStatus;
  productionStatus: ProductionStatus;
  revisionCount: string;
  notes: string;
};

function emptyForm(defaultTemplateId: string): OrderForm {
  return {
    customerId: "",
    weddingId: "",
    packageName: "Basic",
    templateId: defaultTemplateId,
    priceAmount: "0",
    paymentStatus: "unpaid",
    productionStatus: "new",
    revisionCount: "0",
    notes: "",
  };
}

function idr(value: number | string) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export function OrderManager({
  initialOrders,
  customers,
  weddings,
  templates,
}: {
  initialOrders: OrderRow[];
  customers: CustomerOption[];
  weddings: WeddingOption[];
  templates: TemplateOption[];
}) {
  const defaultTemplateId = templates[0]?.id ?? "classic-001";
  const [orders, setOrders] = useState(initialOrders);
  const [form, setForm] = useState<OrderForm>(emptyForm(defaultTemplateId));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"" | PaymentStatus>("");
  const [productionFilter, setProductionFilter] = useState<"" | ProductionStatus>("");

  const visibleOrders = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (paymentFilter && order.payment_status !== paymentFilter) return false;
      if (productionFilter && order.production_status !== productionFilter) return false;
      if (!needle) return true;
      return [order.customer_name, order.customer_phone, order.package_name, order.wedding_slug ?? ""]
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [orders, paymentFilter, productionFilter, query]);

  const totals = useMemo(() => ({
    total: orders.length,
    unpaid: orders.filter((item) => item.payment_status === "unpaid").length,
    partial: orders.filter((item) => item.payment_status === "partial").length,
    paid: orders.filter((item) => item.payment_status === "paid").length,
  }), [orders]);

  function reset() {
    setEditingId(null);
    setForm(emptyForm(defaultTemplateId));
  }

  function edit(order: OrderRow) {
    setEditingId(order.id);
    setForm({
      customerId: order.customer_id,
      weddingId: order.wedding_id ?? "",
      packageName: order.package_name,
      templateId: order.template_id,
      priceAmount: String(order.price_amount),
      paymentStatus: order.payment_status,
      productionStatus: order.production_status,
      revisionCount: String(order.revision_count),
      notes: order.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function refreshOrders() {
    const response = await fetch("/api/orders", { credentials: "include" });
    const payload = await response.json().catch(() => ({}));
    if (response.ok && Array.isArray(payload.data)) setOrders(payload.data);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.customerId) return toast.error("Choose a customer first.");
    setSaving(true);
    try {
      const response = await fetch(editingId ? `/api/orders/${editingId}` : "/api/orders", {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: form.customerId,
          wedding_id: form.weddingId || null,
          package_name: form.packageName,
          template_id: form.templateId,
          price_amount: Number(form.priceAmount || 0),
          currency: "IDR",
          payment_status: form.paymentStatus,
          production_status: form.productionStatus,
          revision_count: Number(form.revisionCount || 0),
          notes: form.notes,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Failed to save order");
      await refreshOrders();
      toast.success(editingId ? "Order updated." : "Order created.");
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save order");
    } finally {
      setSaving(false);
    }
  }

  async function remove(order: OrderRow) {
    if (!window.confirm(`Delete order for ${order.customer_name}?`)) return;
    try {
      const response = await fetch(`/api/orders/${order.id}`, { method: "DELETE", credentials: "include" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Failed to delete order");
      setOrders((current) => current.filter((item) => item.id !== order.id));
      if (editingId === order.id) reset();
      toast.success("Order deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete order");
    }
  }

  function selectWedding(weddingId: string) {
    const wedding = weddings.find((item) => item.id === weddingId);
    setForm((current) => ({
      ...current,
      weddingId,
      templateId: wedding?.templateId ?? current.templateId,
    }));
  }

  const input = "min-h-[42px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-[#BFA14A]";

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Orders", totals.total],
          ["Unpaid", totals.unpaid],
          ["Partial", totals.partial],
          ["Paid", totals.paid],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-md border border-white/10 bg-[#141416] px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</p>
            <p className="mt-1 text-xl font-semibold text-neutral-50">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <form onSubmit={submit} className="h-fit space-y-4 rounded-md border border-white/10 bg-[#141416] p-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#BFA14A]">{editingId ? "Edit order" : "New order"}</p>
            <h2 className="mt-1 text-lg font-semibold text-neutral-50">{editingId ? "Update commercial record" : "Create order"}</h2>
          </div>

          {customers.length === 0 && (
            <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">
              Create a customer first before creating an order.
            </div>
          )}

          <label className="block space-y-1.5 text-xs text-neutral-400">
            <span>Customer</span>
            <select required value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })} className={input}>
              <option value="" className="bg-neutral-900">Choose customer</option>
              {customers.map((item) => <option key={item.id} value={item.id} className="bg-neutral-900">{item.name} · {item.phone}</option>)}
            </select>
          </label>

          <label className="block space-y-1.5 text-xs text-neutral-400">
            <span>Wedding project (optional)</span>
            <select value={form.weddingId} onChange={(event) => selectWedding(event.target.value)} className={input}>
              <option value="" className="bg-neutral-900">Not linked yet</option>
              {weddings.map((item) => <option key={item.id} value={item.id} className="bg-neutral-900">{item.title} · {item.status}</option>)}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <label className="block space-y-1.5 text-xs text-neutral-400">
              <span>Package</span>
              <input required value={form.packageName} onChange={(event) => setForm({ ...form, packageName: event.target.value })} className={input} placeholder="Basic / Premium" />
            </label>
            <label className="block space-y-1.5 text-xs text-neutral-400">
              <span>Price (IDR)</span>
              <input type="number" min="0" step="1" value={form.priceAmount} onChange={(event) => setForm({ ...form, priceAmount: event.target.value })} className={input} />
            </label>
          </div>

          <label className="block space-y-1.5 text-xs text-neutral-400">
            <span>Template</span>
            <select value={form.templateId} onChange={(event) => setForm({ ...form, templateId: event.target.value })} className={input}>
              {templates.map((item) => <option key={item.id} value={item.id} className="bg-neutral-900">{item.name}</option>)}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <label className="block space-y-1.5 text-xs text-neutral-400">
              <span>Payment</span>
              <select value={form.paymentStatus} onChange={(event) => setForm({ ...form, paymentStatus: event.target.value as PaymentStatus })} className={input}>
                {PAYMENT_STATUSES.map((status) => <option key={status} value={status} className="bg-neutral-900">{formatPaymentStatus(status)}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5 text-xs text-neutral-400">
              <span>Production</span>
              <select value={form.productionStatus} onChange={(event) => setForm({ ...form, productionStatus: event.target.value as ProductionStatus })} className={input}>
                {PRODUCTION_STATUSES.map((status) => <option key={status} value={status} className="bg-neutral-900">{formatProductionStatus(status)}</option>)}
              </select>
            </label>
          </div>

          <label className="block space-y-1.5 text-xs text-neutral-400">
            <span>Revision count</span>
            <input type="number" min="0" step="1" value={form.revisionCount} onChange={(event) => setForm({ ...form, revisionCount: event.target.value })} className={input} />
          </label>

          <label className="block space-y-1.5 text-xs text-neutral-400">
            <span>Notes</span>
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={`${input} min-h-24 resize-y`} placeholder="Catatan order, pembayaran, revisi…" />
          </label>

          <div className="flex gap-2">
            <button disabled={saving || customers.length === 0} className="rounded-md bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-950 disabled:opacity-50">
              {saving ? "Saving…" : editingId ? "Save changes" : "Create order"}
            </button>
            {editingId && <button type="button" onClick={reset} className="rounded-md border border-white/10 px-4 py-2 text-xs font-medium text-neutral-300">Cancel</button>}
          </div>
        </form>

        <section className="overflow-hidden rounded-md border border-white/10 bg-[#141416]">
          <div className="grid gap-3 border-b border-white/10 p-4 md:grid-cols-[minmax(0,1fr)_160px_180px]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} className={input} placeholder="Search customer, package, slug…" />
            <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value as "" | PaymentStatus)} className={input}>
              <option value="" className="bg-neutral-900">All payments</option>
              {PAYMENT_STATUSES.map((status) => <option key={status} value={status} className="bg-neutral-900">{formatPaymentStatus(status)}</option>)}
            </select>
            <select value={productionFilter} onChange={(event) => setProductionFilter(event.target.value as "" | ProductionStatus)} className={input}>
              <option value="" className="bg-neutral-900">All production</option>
              {PRODUCTION_STATUSES.map((status) => <option key={status} value={status} className="bg-neutral-900">{formatProductionStatus(status)}</option>)}
            </select>
          </div>

          {visibleOrders.length === 0 ? (
            <div className="p-8 text-sm text-neutral-500">No orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-neutral-200">
                <thead className="border-b border-white/10 bg-black/20 text-[11px] uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Package</th>
                    <th className="px-4 py-3 text-left">Price</th>
                    <th className="px-4 py-3 text-left">Payment</th>
                    <th className="px-4 py-3 text-left">Production</th>
                    <th className="px-4 py-3 text-left">Wedding</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((order) => (
                    <tr key={order.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.025]">
                      <td className="px-4 py-3"><p className="font-medium text-neutral-50">{order.customer_name}</p><p className="mt-1 text-[11px] text-neutral-500">{order.customer_phone}</p></td>
                      <td className="px-4 py-3">{order.package_name}<p className="mt-1 font-mono text-[10px] text-neutral-500">{order.template_id}</p></td>
                      <td className="px-4 py-3">{idr(order.price_amount)}</td>
                      <td className="px-4 py-3"><span className={order.payment_status === "paid" ? "text-emerald-300" : order.payment_status === "partial" ? "text-amber-300" : order.payment_status === "refunded" ? "text-sky-300" : "text-neutral-400"}>{formatPaymentStatus(order.payment_status)}</span></td>
                      <td className="px-4 py-3 text-neutral-300">{formatProductionStatus(order.production_status)}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-neutral-500">{order.wedding_slug ?? "Not linked"}</td>
                      <td className="px-4 py-3"><div className="flex justify-end gap-3"><button type="button" onClick={() => edit(order)} className="hover:underline">Edit</button><button type="button" onClick={() => remove(order)} className="text-red-300 hover:underline">Delete</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
