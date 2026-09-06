import assert from "node:assert/strict";
import {
  filterGuests,
  guestStats,
  normalizeGuestPhone,
  validateGuestInput,
  validateGuestPatch,
} from "@/lib/commerce/guest-management";

assert.equal(normalizeGuestPhone("+62 812-3456-7890"), "+6281234567890");
assert.equal(normalizeGuestPhone("0812 345 678"), "0812345678");

const created = validateGuestInput({
  displayName: "  Keluarga Budi  ",
  phone: "+62 812-0000",
  groupName: "Keluarga",
  maxGuests: 4,
});
assert.equal(created.ok, true);
if (created.ok) {
  assert.equal(created.value.displayName, "Keluarga Budi");
  assert.equal(created.value.phone, "+628120000");
  assert.equal(created.value.maxGuests, 4);
}
assert.equal(validateGuestInput({ displayName: "", maxGuests: 1 }).ok, false);
assert.equal(validateGuestInput({ displayName: "A", maxGuests: 21 }).ok, false);
assert.equal(validateGuestInput({ displayName: "A", maxGuests: 1, role: "owner" }).ok, false);

const patch = validateGuestPatch({
  guestId: "00000000-0000-4000-8000-000000000001",
  displayName: "Budi",
  isActive: false,
  regenerateToken: true,
});
assert.equal(patch.ok, true);
assert.equal(validateGuestPatch({ guestId: "x", unknown: true }).ok, false);
assert.equal(validateGuestPatch({ guestId: "x" }).ok, false);

const guests = [
  { displayName: "Budi", phone: "0812", groupName: "VIP", isActive: true, maxGuests: 2 },
  { displayName: "Siti", phone: null, groupName: "Family", isActive: false, maxGuests: 4 },
];
assert.equal(filterGuests(guests, "vip", "all").length, 1);
assert.equal(filterGuests(guests, "", "active").length, 1);
assert.deepEqual(guestStats(guests), { total: 2, active: 1, inactive: 1, totalQuota: 6 });

console.log("Phase 3.10 guest management verification passed.");
