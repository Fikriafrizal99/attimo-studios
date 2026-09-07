"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PAYMENT_STATUSES,
  PRODUCTION_STATUSES,
  formatPaymentStatus,
  formatProductionStatus,
  type PaymentStatus,
  type ProductionStatus,
} from "@/lib/commerce/operations";
import { getSuggestedProductionTransitions } from "@/lib/commerce/workflow";

export function OrderWorkflowPanel({
  orderId,
  initialProductionStatus,
  initialPaymentStatus,
  initialRevisionCount,
}: {
  orderId: string;
  initialProductionStatus: ProductionStatus;
  initialPaymentStatus: PaymentStatus;
  initialRevisionCount: number;
}) {
  const router = useRouter();
  const [productionStatus, setProductionStatus] = useState(initialProductionStatus);
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const [revisionCount, setRevisionCount] = useState(initialRevisionCount);
  const [saving, setSaving] = useState(false);

  async function patch(body: Record<string, unknown>, successMessage: string) {
    setSaving(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Failed to update order");
      toast.success(successMessage);
      router.refresh();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update order");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveProduction(status: ProductionStatus) {
    const previous = productionStatus;
    setProductionStatus(status);
    const ok = await patch({ production_status: status }, `Production moved to ${formatProductionStatus(status)}.`);
    if (!ok) setProductionStatus(previous);
  }

  async function savePayment(status: PaymentStatus) {
    const previous = paymentStatus;
    setPaymentStatus(status);
    const ok = await patch({ payment_status: status }, `Payment marked ${formatPaymentStatus(status)}.`);
    if (!ok) setPaymentStatus(previous);
  }

  async function changeRevision(next: number) {
    const previous = revisionCount;
    setRevisionCount(next);
    const ok = await patch({ revision_count: next }, `Revision count updated to ${next}.`);
    if (!ok) setRevisionCount(previous);
  }

  const suggested = getSuggestedProductionTransitions(productionStatus);
  const input = "min-h-[42px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-[#BFA14A] disabled:opacity-50";

  return (
    <section className="space-y-5 rounded-md border border-white/10 bg-[#141416] p-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#BFA14A]">Operator controls</p>
        <h2 className="mt-1 text-base font-semibold text-neutral-50">Order workflow</h2>
        <p className="mt-1 text-xs leading-5 text-neutral-500">
          Status changes are explicit. They do not publish or edit the wedding automatically.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-neutral-400" htmlFor="production-status">Production status</label>
        <select
          id="production-status"
          disabled={saving}
          value={productionStatus}
          onChange={(event) => saveProduction(event.target.value as ProductionStatus)}
          className={input}
        >
          {PRODUCTION_STATUSES.map((status) => (
            <option key={status} value={status} className="bg-neutral-900">
              {formatProductionStatus(status)}
            </option>
          ))}
        </select>
        {suggested.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="py-1 text-[11px] text-neutral-600">Suggested next:</span>
            {suggested.map((status) => (
              <button
                key={status}
                type="button"
                disabled={saving}
                onClick={() => saveProduction(status)}
                className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-neutral-300 hover:border-[#BFA14A]/40 hover:text-[#BFA14A] disabled:opacity-50"
              >
                {formatProductionStatus(status)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs text-neutral-400" htmlFor="payment-status">Payment status</label>
        <select
          id="payment-status"
          disabled={saving}
          value={paymentStatus}
          onChange={(event) => savePayment(event.target.value as PaymentStatus)}
          className={input}
        >
          {PAYMENT_STATUSES.map((status) => (
            <option key={status} value={status} className="bg-neutral-900">
              {formatPaymentStatus(status)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <span className="text-xs text-neutral-400">Revision count</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saving || revisionCount === 0}
            onClick={() => changeRevision(Math.max(0, revisionCount - 1))}
            className="h-10 w-10 rounded-md border border-white/10 text-neutral-300 disabled:opacity-40"
            aria-label="Decrease revision count"
          >
            −
          </button>
          <div className="flex h-10 min-w-16 items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 text-sm font-semibold text-neutral-100">
            {revisionCount}
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => changeRevision(revisionCount + 1)}
            className="h-10 w-10 rounded-md border border-white/10 text-neutral-300 disabled:opacity-40"
            aria-label="Increase revision count"
          >
            +
          </button>
        </div>
      </div>
    </section>
  );
}
