"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { filterGuests, guestStats } from "@/lib/commerce/guest-management";

type Guest = {
  id: string;
  displayName: string;
  phone: string | null;
  groupName: string | null;
  maxGuests: number;
  token: string;
  isActive: boolean;
  url: string | null;
};

type GuestDraft = {
  displayName: string;
  phone: string;
  groupName: string;
  maxGuests: number;
};

const EMPTY_FORM: GuestDraft = {
  displayName: "",
  phone: "",
  groupName: "",
  maxGuests: 1,
};

export function GuestsManager({ weddingId }: { weddingId: string }) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<GuestDraft>(EMPTY_FORM);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<GuestDraft>(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/weddings/${weddingId}/guests`, { credentials: "include" });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      toast.error(payload.error ?? "Failed to load guests");
      return;
    }
    setGuests(payload.data ?? []);
  }, [weddingId]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => guestStats(guests), [guests]);
  const visibleGuests = useMemo(() => filterGuests(guests, query, status), [guests, query, status]);

  async function request(method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>) {
    const response = await fetch(`/api/weddings/${weddingId}/guests`, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error ?? "Guest update failed");
    return payload;
  }

  async function addGuest(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await request("POST", form);
      setForm(EMPTY_FORM);
      toast.success("Guest added.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create guest");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(guest: Guest) {
    setEditingId(guest.id);
    setEditForm({
      displayName: guest.displayName,
      phone: guest.phone ?? "",
      groupName: guest.groupName ?? "",
      maxGuests: guest.maxGuests,
    });
  }

  async function saveEdit(guest: Guest) {
    setSaving(true);
    try {
      await request("PATCH", { guestId: guest.id, ...editForm });
      setEditingId(null);
      toast.success("Guest updated.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update guest");
    } finally {
      setSaving(false);
    }
  }

  async function toggleGuest(guest: Guest) {
    try {
      await request("PATCH", { guestId: guest.id, isActive: !guest.isActive });
      toast.success(guest.isActive ? "Guest disabled." : "Guest enabled.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update guest");
    }
  }

  async function regenerateLink(guest: Guest) {
    if (!window.confirm(`Regenerate link untuk “${guest.displayName}”? Link lama akan berhenti berlaku.`)) return;
    try {
      const payload = await request("PATCH", { guestId: guest.id, regenerateToken: true });
      toast.success("Personalized link regenerated.");
      if (payload.data?.url && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload.data.url);
        toast.success("Link baru disalin.");
      }
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to regenerate link");
    }
  }

  async function removeGuest(guest: Guest) {
    if (!window.confirm(`Delete guest “${guest.displayName}”?`)) return;
    try {
      await request("DELETE", { guestId: guest.id });
      toast.success("Guest deleted.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete guest");
    }
  }

  async function copyUrl(url: string | null) {
    if (!url) return toast.error("Set dan release wedding slug terlebih dahulu.");
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Personalized invitation URL copied.");
    } catch {
      toast.error("Browser tidak mengizinkan copy otomatis.");
    }
  }

  const inputClass = "min-h-[42px] rounded-md border border-white/10 bg-white/5 px-3 text-sm text-neutral-100 outline-none focus:border-[#BFA14A]";
  const actionClass = "rounded border border-white/10 px-2 py-1 text-xs hover:bg-white/5 disabled:opacity-50";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-neutral-50">Guests</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Kelola identitas tamu, kuota, status, dan link personal yang terikat ke wedding ini.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Total", stats.total],
          ["Active", stats.active],
          ["Inactive", stats.inactive],
          ["Total quota", stats.totalQuota],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-md border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wider text-neutral-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-neutral-100">{value}</p>
          </div>
        ))}
      </div>

      <form onSubmit={addGuest} className="grid gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4 md:grid-cols-4">
        <input required placeholder="Nama tamu / keluarga" value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} className={inputClass} />
        <input placeholder="WhatsApp (opsional)" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={inputClass} />
        <input placeholder="Grup (opsional)" value={form.groupName} onChange={(event) => setForm({ ...form, groupName: event.target.value })} className={inputClass} />
        <div className="flex gap-2">
          <input aria-label="Maksimum tamu" type="number" min={1} max={20} value={form.maxGuests} onChange={(event) => setForm({ ...form, maxGuests: Number(event.target.value) || 1 })} className={`${inputClass} w-20`} />
          <button type="submit" disabled={saving} className="flex-1 rounded-md bg-neutral-100 px-4 text-sm font-medium text-neutral-950 disabled:opacity-50">
            {saving ? "Saving…" : "Add guest"}
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, grup, atau WhatsApp…" className={`${inputClass} flex-1`} />
        <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className={inputClass}>
          <option value="all" className="bg-neutral-900">All guests</option>
          <option value="active" className="bg-neutral-900">Active</option>
          <option value="inactive" className="bg-neutral-900">Inactive</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-md border border-white/10">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[1.5fr_.7fr_.5fr_auto] gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs uppercase tracking-wider text-neutral-500">
            <span>Guest</span><span>Group</span><span>Quota</span><span>Actions</span>
          </div>
          {loading ? (
            <p className="p-4 text-sm text-neutral-400">Loading guests…</p>
          ) : visibleGuests.length === 0 ? (
            <p className="p-4 text-sm text-neutral-400">Tidak ada tamu yang cocok.</p>
          ) : (
            visibleGuests.map((guest) => (
              <div key={guest.id} className="border-b border-white/5 px-4 py-3 text-sm last:border-0">
                {editingId === guest.id ? (
                  <div className="grid grid-cols-[1.5fr_.7fr_.5fr_auto] items-center gap-3">
                    <div className="grid gap-2">
                      <input className={inputClass} value={editForm.displayName} onChange={(event) => setEditForm({ ...editForm, displayName: event.target.value })} />
                      <input className={inputClass} value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} placeholder="WhatsApp" />
                    </div>
                    <input className={inputClass} value={editForm.groupName} onChange={(event) => setEditForm({ ...editForm, groupName: event.target.value })} />
                    <input type="number" min={1} max={20} className={`${inputClass} w-20`} value={editForm.maxGuests} onChange={(event) => setEditForm({ ...editForm, maxGuests: Number(event.target.value) || 1 })} />
                    <div className="flex justify-end gap-2">
                      <button type="button" disabled={saving} onClick={() => saveEdit(guest)} className={actionClass}>Save</button>
                      <button type="button" onClick={() => setEditingId(null)} className={actionClass}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-[1.5fr_.7fr_.5fr_auto] items-center gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-100">{guest.displayName}</p>
                      <p className="truncate text-xs text-neutral-500">{guest.phone || (guest.isActive ? "Active" : "Inactive")}</p>
                    </div>
                    <span className="truncate text-neutral-400">{guest.groupName || "—"}</span>
                    <span className="text-neutral-300">{guest.maxGuests}</span>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button type="button" onClick={() => copyUrl(guest.url)} className={actionClass}>Copy link</button>
                      <button type="button" onClick={() => startEdit(guest)} className={actionClass}>Edit</button>
                      <button type="button" onClick={() => toggleGuest(guest)} className={actionClass}>{guest.isActive ? "Disable" : "Enable"}</button>
                      <button type="button" onClick={() => regenerateLink(guest)} className={actionClass}>New link</button>
                      <button type="button" onClick={() => removeGuest(guest)} className="rounded border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
