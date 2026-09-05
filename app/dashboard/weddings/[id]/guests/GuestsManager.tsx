"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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

export function GuestsManager({ weddingId }: { weddingId: string }) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ displayName: "", phone: "", groupName: "", maxGuests: 1 });

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

  async function addGuest(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(`/api/weddings/${weddingId}/guests`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      toast.error(payload.error ?? "Failed to create guest");
      return;
    }
    setForm({ displayName: "", phone: "", groupName: "", maxGuests: 1 });
    toast.success("Guest added.");
    await load();
  }

  async function toggleGuest(guest: Guest) {
    const response = await fetch(`/api/weddings/${weddingId}/guests`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId: guest.id, isActive: !guest.isActive }),
    });
    if (!response.ok) return toast.error("Failed to update guest");
    await load();
  }

  async function removeGuest(guest: Guest) {
    if (!window.confirm(`Delete guest “${guest.displayName}”?`)) return;
    const response = await fetch(`/api/weddings/${weddingId}/guests`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId: guest.id }),
    });
    if (!response.ok) return toast.error("Failed to delete guest");
    toast.success("Guest deleted.");
    await load();
  }

  async function copyUrl(url: string | null) {
    if (!url) return toast.error("Set and release a wedding slug first.");
    await navigator.clipboard.writeText(url);
    toast.success("Personalized invitation URL copied.");
  }

  const inputClass = "min-h-[42px] rounded-md border border-white/10 bg-white/5 px-3 text-sm text-neutral-100 outline-none focus:border-[#BFA14A]";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-neutral-50">Guests</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Setiap tamu mendapat token dan link personal yang terikat ke wedding ini.
        </p>
      </div>

      <form onSubmit={addGuest} className="grid gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4 md:grid-cols-4">
        <input
          required
          placeholder="Nama tamu / keluarga"
          value={form.displayName}
          onChange={(event) => setForm({ ...form, displayName: event.target.value })}
          className={inputClass}
        />
        <input
          placeholder="WhatsApp (opsional)"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
          className={inputClass}
        />
        <input
          placeholder="Grup (opsional)"
          value={form.groupName}
          onChange={(event) => setForm({ ...form, groupName: event.target.value })}
          className={inputClass}
        />
        <div className="flex gap-2">
          <input
            aria-label="Maksimum tamu"
            type="number"
            min={1}
            max={20}
            value={form.maxGuests}
            onChange={(event) => setForm({ ...form, maxGuests: Number(event.target.value) || 1 })}
            className={`${inputClass} w-20`}
          />
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-md bg-neutral-100 px-4 text-sm font-medium text-neutral-950 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add guest"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-md border border-white/10">
        <div className="grid grid-cols-[1.5fr_.7fr_.5fr_auto] gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs uppercase tracking-wider text-neutral-500">
          <span>Guest</span><span>Group</span><span>Quota</span><span>Actions</span>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-neutral-400">Loading guests…</p>
        ) : guests.length === 0 ? (
          <p className="p-4 text-sm text-neutral-400">Belum ada tamu.</p>
        ) : (
          guests.map((guest) => (
            <div key={guest.id} className="grid grid-cols-[1.5fr_.7fr_.5fr_auto] items-center gap-3 border-b border-white/5 px-4 py-3 text-sm last:border-0">
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-100">{guest.displayName}</p>
                <p className="truncate text-xs text-neutral-500">{guest.phone || (guest.isActive ? "Active" : "Inactive")}</p>
              </div>
              <span className="truncate text-neutral-400">{guest.groupName || "—"}</span>
              <span className="text-neutral-300">{guest.maxGuests}</span>
              <div className="flex flex-wrap justify-end gap-2">
                <button onClick={() => copyUrl(guest.url)} className="rounded border border-white/10 px-2 py-1 text-xs hover:bg-white/5">Copy link</button>
                <button onClick={() => toggleGuest(guest)} className="rounded border border-white/10 px-2 py-1 text-xs hover:bg-white/5">{guest.isActive ? "Disable" : "Enable"}</button>
                <button onClick={() => removeGuest(guest)} className="rounded border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
