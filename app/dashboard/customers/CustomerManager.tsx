"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string;
  order_count: number;
  created_at: string;
  updated_at: string;
};

type CustomerForm = {
  name: string;
  phone: string;
  email: string;
  notes: string;
};

const EMPTY_FORM: CustomerForm = { name: "", phone: "", email: "", notes: "" };

export function CustomerManager({ initialCustomers }: { initialCustomers: CustomerRow[] }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const visibleCustomers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter((item) =>
      [item.name, item.phone, item.email ?? ""].some((value) => value.toLowerCase().includes(needle))
    );
  }, [customers, query]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function edit(customer: CustomerRow) {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? "",
      notes: customer.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(editingId ? `/api/customers/${editingId}` : "/api/customers", {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Failed to save customer");

      const saved = payload.data as Omit<CustomerRow, "order_count">;
      setCustomers((current) => {
        if (editingId) {
          return current.map((item) =>
            item.id === editingId ? { ...item, ...saved } : item
          );
        }
        return [{ ...saved, order_count: 0 }, ...current];
      });
      toast.success(editingId ? "Customer updated." : "Customer created.");
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save customer");
    } finally {
      setSaving(false);
    }
  }

  async function remove(customer: CustomerRow) {
    if (!window.confirm(`Delete customer ${customer.name}?`)) return;
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Failed to delete customer");
      setCustomers((current) => current.filter((item) => item.id !== customer.id));
      if (editingId === customer.id) resetForm();
      toast.success("Customer deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete customer");
    }
  }

  const input = "min-h-[42px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-[#BFA14A]";

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <form onSubmit={submit} className="h-fit space-y-4 rounded-md border border-white/10 bg-[#141416] p-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#BFA14A]">
            {editingId ? "Edit customer" : "New customer"}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-neutral-50">
            {editingId ? "Update customer record" : "Add customer"}
          </h2>
        </div>

        <label className="block space-y-1.5 text-xs text-neutral-400">
          <span>Name</span>
          <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={input} placeholder="Nama customer" />
        </label>
        <label className="block space-y-1.5 text-xs text-neutral-400">
          <span>WhatsApp / phone</span>
          <input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={input} placeholder="08xxxxxxxxxx" />
        </label>
        <label className="block space-y-1.5 text-xs text-neutral-400">
          <span>Email (optional)</span>
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={input} placeholder="nama@email.com" />
        </label>
        <label className="block space-y-1.5 text-xs text-neutral-400">
          <span>Notes</span>
          <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={`${input} min-h-24 resize-y`} placeholder="Catatan customer…" />
        </label>

        <div className="flex gap-2">
          <button disabled={saving} className="rounded-md bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-950 disabled:opacity-50">
            {saving ? "Saving…" : editingId ? "Save changes" : "Create customer"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-md border border-white/10 px-4 py-2 text-xs font-medium text-neutral-300">
              Cancel
            </button>
          )}
        </div>
      </form>

      <section className="overflow-hidden rounded-md border border-white/10 bg-[#141416]">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Customers</h2>
            <p className="mt-1 text-xs text-neutral-500">{customers.length} customer record(s)</p>
          </div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} className={`${input} sm:max-w-xs`} placeholder="Search name, phone, email…" />
        </div>

        {visibleCustomers.length === 0 ? (
          <div className="p-8 text-sm text-neutral-500">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-neutral-200">
              <thead className="border-b border-white/10 bg-black/20 text-[11px] uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Orders</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.025]">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/customers/${customer.id}`} className="font-medium text-neutral-50 hover:underline">{customer.name}</Link>
                      {customer.notes && <p className="mt-1 max-w-xs truncate text-[11px] text-neutral-500">{customer.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      <p>{customer.phone}</p>
                      <p className="mt-1 text-[11px] text-neutral-500">{customer.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">{customer.order_count}</td>
                    <td className="px-4 py-3 text-neutral-500">{new Date(customer.updated_at).toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <Link href={`/dashboard/customers/${customer.id}`} className="text-[#BFA14A] hover:underline">Open</Link>
                        <button type="button" onClick={() => edit(customer)} className="hover:underline">Edit</button>
                        <button type="button" onClick={() => remove(customer)} className="text-red-300 hover:underline">Delete</button>
                      </div>
                    </td>
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
