"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

type WishStatus = "visible" | "hidden" | "spam";

type WishRow = {
  id: string;
  guest_id: string | null;
  name: string;
  location: string | null;
  message: string;
  status: WishStatus;
  created_at: string;
};

export function WishesManager({
  weddingId,
  initialWishes,
}: {
  weddingId: string;
  initialWishes: WishRow[];
}) {
  const [wishes, setWishes] = useState(initialWishes);
  const [filter, setFilter] = useState<"all" | WishStatus>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible = useMemo(
    () => filter === "all" ? wishes : wishes.filter((item) => item.status === filter),
    [filter, wishes]
  );

  const counts = useMemo(() => ({
    all: wishes.length,
    visible: wishes.filter((item) => item.status === "visible").length,
    hidden: wishes.filter((item) => item.status === "hidden").length,
    spam: wishes.filter((item) => item.status === "spam").length,
  }), [wishes]);

  async function setStatus(wish: WishRow, status: WishStatus) {
    setBusyId(wish.id);
    try {
      const response = await fetch(`/api/weddings/${weddingId}/wishes/${wish.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Failed to moderate wish");
      setWishes((current) => current.map((item) => item.id === wish.id ? { ...item, status } : item));
      toast.success(`Wish marked ${status}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to moderate wish");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(wish: WishRow) {
    if (!window.confirm(`Delete wish from ${wish.name}?`)) return;
    setBusyId(wish.id);
    try {
      const response = await fetch(`/api/weddings/${weddingId}/wishes/${wish.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Failed to delete wish");
      setWishes((current) => current.filter((item) => item.id !== wish.id));
      toast.success("Wish deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete wish");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        {([
          ["all", counts.all],
          ["visible", counts.visible],
          ["hidden", counts.hidden],
          ["spam", counts.spam],
        ] as const).map(([status, count]) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={
              filter === status
                ? "rounded-md border border-[#BFA14A]/40 bg-[#BFA14A]/5 px-4 py-3 text-left"
                : "rounded-md border border-white/10 bg-[#141416] px-4 py-3 text-left hover:bg-white/[0.025]"
            }
          >
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">{status}</p>
            <p className="mt-1 text-xl font-semibold text-neutral-50">{count}</p>
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-md border border-white/10 bg-[#141416]">
        <div className="border-b border-white/10 p-4">
          <h3 className="text-sm font-semibold text-neutral-100">Wish moderation</h3>
          <p className="mt-1 text-xs text-neutral-500">Only wishes marked visible are returned by the public invitation API.</p>
        </div>

        {visible.length === 0 ? (
          <div className="p-8 text-sm text-neutral-500">No wishes in this filter.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {visible.map((wish) => (
              <article key={wish.id} className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-neutral-50">{wish.name}</p>
                      {wish.location && <span className="text-xs text-neutral-500">· {wish.location}</span>}
                      <span className={
                        wish.status === "visible"
                          ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300"
                          : wish.status === "hidden"
                            ? "rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-300"
                            : "rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-red-300"
                      }>{wish.status}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-300">{wish.message}</p>
                    <p className="mt-2 text-[11px] text-neutral-600">{new Date(wish.created_at).toLocaleString("id-ID")}{wish.guest_id ? " · personalized guest" : " · public entry"}</p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {wish.status !== "visible" && <button type="button" disabled={busyId === wish.id} onClick={() => setStatus(wish, "visible")} className="rounded-md border border-emerald-500/20 px-3 py-2 text-xs text-emerald-300 disabled:opacity-50">Show</button>}
                    {wish.status !== "hidden" && <button type="button" disabled={busyId === wish.id} onClick={() => setStatus(wish, "hidden")} className="rounded-md border border-amber-500/20 px-3 py-2 text-xs text-amber-300 disabled:opacity-50">Hide</button>}
                    {wish.status !== "spam" && <button type="button" disabled={busyId === wish.id} onClick={() => setStatus(wish, "spam")} className="rounded-md border border-red-500/20 px-3 py-2 text-xs text-red-300 disabled:opacity-50">Spam</button>}
                    <button type="button" disabled={busyId === wish.id} onClick={() => remove(wish)} className="rounded-md border border-white/10 px-3 py-2 text-xs text-neutral-400 disabled:opacity-50">Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
