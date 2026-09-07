import type { PaymentStatus, ProductionStatus } from "@/lib/commerce/operations";

export const ACTIVE_PRODUCTION_STATUSES: readonly ProductionStatus[] = [
  "new",
  "waiting_data",
  "in_progress",
  "preview_ready",
  "revision",
  "approved",
  "published",
];

export const PIPELINE_STATUSES: readonly ProductionStatus[] = [
  "new",
  "waiting_data",
  "in_progress",
  "preview_ready",
  "revision",
  "approved",
  "published",
  "completed",
];

const NEXT_STATUS: Partial<Record<ProductionStatus, readonly ProductionStatus[]>> = {
  new: ["waiting_data", "in_progress", "cancelled"],
  waiting_data: ["in_progress", "cancelled"],
  in_progress: ["preview_ready", "waiting_data", "cancelled"],
  preview_ready: ["revision", "approved", "in_progress", "cancelled"],
  revision: ["in_progress", "preview_ready", "cancelled"],
  approved: ["published", "revision", "cancelled"],
  published: ["completed", "approved"],
  completed: [],
  cancelled: ["new"],
};

export function getSuggestedProductionTransitions(
  status: ProductionStatus
): readonly ProductionStatus[] {
  return NEXT_STATUS[status] ?? [];
}

export function getOperationalAttention(options: {
  productionStatus: ProductionStatus;
  paymentStatus: PaymentStatus;
  weddingId?: string | null;
  weddingReleased?: boolean;
  publishReady?: boolean | null;
}): string[] {
  const issues: string[] = [];

  if (options.paymentStatus === "unpaid") {
    issues.push("Payment is still unpaid.");
  } else if (options.paymentStatus === "partial") {
    issues.push("Payment is only partially received.");
  }

  if (!options.weddingId && !["new", "waiting_data", "cancelled"].includes(options.productionStatus)) {
    issues.push("Order is progressing but no wedding project is linked.");
  }

  if (
    options.productionStatus === "approved" &&
    options.weddingId &&
    options.publishReady === false
  ) {
    issues.push("Order is approved but the wedding still has blocking publish-readiness issues.");
  }

  if (options.productionStatus === "published" && options.weddingId && !options.weddingReleased) {
    issues.push("Order is marked published but the linked wedding is not released.");
  }

  if (
    options.weddingReleased &&
    !["published", "completed"].includes(options.productionStatus)
  ) {
    issues.push("Wedding is released but the order production status is not published/completed.");
  }

  return issues;
}

export function activityLabel(eventType: string): string {
  switch (eventType) {
    case "created":
      return "Order created";
    case "customer_changed":
      return "Customer changed";
    case "wedding_changed":
      return "Wedding link changed";
    case "payment_status_changed":
      return "Payment status changed";
    case "production_status_changed":
      return "Production status changed";
    case "revision_count_changed":
      return "Revision count changed";
    default:
      return "Order activity";
  }
}
