import assert from "node:assert/strict";
import { evaluatePublishReadiness } from "@/lib/commerce/publish-readiness";
import { DEFAULT_EVENT_TIME_ZONE } from "@/lib/wedding-contract";
import { defaultContent, defaultSections } from "@/lib/wedding-defaults";

const content = structuredClone(defaultContent);
content.couple.bride.name = "Heni";
content.couple.groom.name = "Fikri";
content.events = [
  {
    id: "event-primary",
    title: "Akad & Resepsi",
    date: "2026-12-12",
    time: "09:00",
    endTime: "13:00",
    timezone: DEFAULT_EVENT_TIME_ZONE,
    location: "Gedung Endriya",
    address: "Cianjur, Jawa Barat",
    mapsUrl: "",
    latitude: -6.816,
    longitude: 107.142,
    isPrimary: true,
  },
];
content.hero.countdownEventId = "event-primary";

const ready = evaluatePublishReadiness({
  slug: "heni-fikri",
  templateId: "classic-001",
  content,
  sections: defaultSections,
});
assert.equal(ready.ready, true);
assert.equal(ready.errors.length, 0);
assert.ok(ready.warnings.length >= 1);
assert.ok(ready.checks.some((check) => check.id === "countdown" && check.status === "pass"));
assert.ok(ready.checks.some((check) => check.id === "location" && check.status === "pass"));

const invalid = structuredClone(content);
invalid.couple.groom.name = "";
invalid.gifts.bankAccounts = [
  { id: "bad-bank", bankName: "BCA", accountNumber: "", accountHolder: "" },
];
const blocked = evaluatePublishReadiness({
  slug: "admin",
  templateId: "classic-001",
  content: invalid,
  sections: defaultSections,
});
assert.equal(blocked.ready, false);
assert.ok(blocked.errors.some((error) => /reserved/i.test(error)));
assert.ok(blocked.errors.some((error) => /Bride and groom/i.test(error)));
assert.ok(blocked.errors.some((error) => /Bank account/i.test(error)));

const missingTemplate = evaluatePublishReadiness({
  slug: "heni-fikri",
  templateId: "minimal-001",
  content,
  sections: defaultSections,
});
assert.equal(missingTemplate.ready, false);
assert.ok(missingTemplate.errors.some((error) => /template/i.test(error)));

console.log("Phase 3.11 publish readiness verification passed.");
