import assert from "node:assert/strict";
import {
  PAYMENT_STATUSES,
  PRODUCTION_STATUSES,
  parseCustomerInput,
  parseOrderInput,
} from "@/lib/commerce/operations";

const customer = parseCustomerInput({
  name: "Fikri Customer",
  phone: "081234567890",
  email: "customer@example.com",
  notes: "Phase 5 test",
});
assert.equal(customer.ok, true);

assert.equal(parseCustomerInput({ name: "", phone: "08123" }).ok, false);
assert.equal(parseCustomerInput({ name: "Customer", phone: "1" }).ok, false);
assert.equal(parseCustomerInput({ name: "Customer", phone: "08123", email: "invalid" }).ok, false);

const order = parseOrderInput({
  customer_id: "11111111-1111-4111-8111-111111111111",
  wedding_id: "22222222-2222-4222-8222-222222222222",
  package_name: "Premium",
  template_id: "classic-001",
  price_amount: 250000,
  payment_status: "partial",
  production_status: "in_progress",
  revision_count: 1,
});
assert.equal(order.ok, true);

assert.equal(parseOrderInput({
  customer_id: "invalid",
  package_name: "Basic",
  template_id: "classic-001",
}).ok, false);

assert.equal(parseOrderInput({
  customer_id: "11111111-1111-4111-8111-111111111111",
  package_name: "Basic",
  template_id: "classic-001",
  price_amount: -1,
}).ok, false);

for (const status of PAYMENT_STATUSES) {
  assert.equal(parseOrderInput({
    customer_id: "11111111-1111-4111-8111-111111111111",
    package_name: "Basic",
    template_id: "classic-001",
    payment_status: status,
  }).ok, true);
}

for (const status of PRODUCTION_STATUSES) {
  assert.equal(parseOrderInput({
    customer_id: "11111111-1111-4111-8111-111111111111",
    package_name: "Basic",
    template_id: "classic-001",
    production_status: status,
  }).ok, true);
}

assert.equal(parseOrderInput({
  customer_id: "11111111-1111-4111-8111-111111111111",
  package_name: "Basic",
  template_id: "classic-001",
  payment_status: "unknown",
}).ok, false);

assert.equal(parseOrderInput({
  customer_id: "11111111-1111-4111-8111-111111111111",
  package_name: "Basic",
  template_id: "classic-001",
  production_status: "unknown",
}).ok, false);

console.log("Phase 5.1 operation contracts verification passed");
