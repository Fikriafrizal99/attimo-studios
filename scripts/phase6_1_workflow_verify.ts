import assert from "node:assert/strict";
import {
  PIPELINE_STATUSES,
  activityLabel,
  getOperationalAttention,
  getSuggestedProductionTransitions,
} from "@/lib/commerce/workflow";

assert.deepEqual(PIPELINE_STATUSES, [
  "new",
  "waiting_data",
  "in_progress",
  "preview_ready",
  "revision",
  "approved",
  "published",
  "completed",
]);

assert.deepEqual(
  getSuggestedProductionTransitions("preview_ready"),
  ["revision", "approved", "in_progress", "cancelled"]
);
assert.deepEqual(getSuggestedProductionTransitions("completed"), []);

assert.deepEqual(
  getOperationalAttention({
    productionStatus: "in_progress",
    paymentStatus: "unpaid",
    weddingId: null,
    weddingReleased: false,
    publishReady: null,
  }),
  [
    "Payment is still unpaid.",
    "Order is progressing but no wedding project is linked.",
  ]
);

assert.deepEqual(
  getOperationalAttention({
    productionStatus: "approved",
    paymentStatus: "paid",
    weddingId: "11111111-1111-4111-8111-111111111111",
    weddingReleased: false,
    publishReady: false,
  }),
  ["Order is approved but the wedding still has blocking publish-readiness issues."]
);

assert.deepEqual(
  getOperationalAttention({
    productionStatus: "published",
    paymentStatus: "paid",
    weddingId: "11111111-1111-4111-8111-111111111111",
    weddingReleased: false,
    publishReady: true,
  }),
  ["Order is marked published but the linked wedding is not released."]
);

assert.deepEqual(
  getOperationalAttention({
    productionStatus: "approved",
    paymentStatus: "paid",
    weddingId: "11111111-1111-4111-8111-111111111111",
    weddingReleased: true,
    publishReady: true,
  }),
  ["Wedding is released but the order production status is not published/completed."]
);

assert.equal(activityLabel("payment_status_changed"), "Payment status changed");
assert.equal(activityLabel("unknown"), "Order activity");

console.log("Phase 6.1 workflow verification passed");
