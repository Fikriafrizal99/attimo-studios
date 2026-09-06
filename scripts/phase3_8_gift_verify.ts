import assert from "node:assert/strict";
import { getGiftPresentation, giftDraftIssues } from "@/lib/commerce/gift";
import { defaultContent } from "@/lib/wedding-defaults";

const base = structuredClone(defaultContent);
base.gifts.enabled = true;
base.gifts.bankAccounts = [
  {
    id: "bank-1",
    bankName: "BCA",
    accountNumber: "1234567890",
    accountHolder: "Heni Endriyani",
  },
  {
    id: "bank-incomplete",
    bankName: "Mandiri",
    accountNumber: "",
    accountHolder: "",
  },
];
base.gifts.qrisImageUrl = "https://example.com/qris.png";
base.gifts.shippingAddress = "Cianjur, Jawa Barat";

const view = getGiftPresentation(base);
assert.equal(view.enabled, true);
assert.equal(view.bankAccounts.length, 1);
assert.equal(view.bankAccounts[0].label, "BCA · Heni Endriyani");
assert.equal(view.qrisImageUrl, "https://example.com/qris.png");
assert.equal(view.shippingAddress, "Cianjur, Jawa Barat");
assert.equal(view.methodCount, 3);
assert.equal(view.hasContent, true);
assert.deepEqual(giftDraftIssues(base.gifts), ["Bank account 2 is incomplete."]);

const disabled = structuredClone(base);
disabled.gifts.enabled = false;
assert.equal(getGiftPresentation(disabled).hasContent, false);
assert.deepEqual(giftDraftIssues(disabled.gifts), []);

console.log("Phase 3.8 digital gift verification passed.");
