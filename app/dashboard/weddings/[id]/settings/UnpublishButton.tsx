"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function UnpublishButton({ weddingId }: { weddingId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function unpublish() {
    if (!window.confirm("Unpublish this wedding? The public invitation will return 404 until released again.")) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/weddings/${weddingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Failed to unpublish wedding");

      toast.success("Wedding returned to draft. Public access is disabled.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unpublish wedding");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-md border border-amber-500/25 bg-amber-500/5 p-4">
      <h3 className="text-sm font-semibold text-amber-200">Publication control</h3>
      <p className="mt-1 text-xs leading-5 text-neutral-400">
        Returning to draft immediately removes the invitation from the public resolver while preserving wedding data, guests, RSVP, wishes, and the slug.
      </p>
      <button
        type="button"
        onClick={unpublish}
        disabled={saving}
        className="mt-4 rounded-md border border-amber-500/30 px-4 py-2 text-xs font-semibold text-amber-200 disabled:opacity-50"
      >
        {saving ? "Unpublishing…" : "Unpublish wedding"}
      </button>
    </section>
  );
}
