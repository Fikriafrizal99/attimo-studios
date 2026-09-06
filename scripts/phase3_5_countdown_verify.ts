import { defaultContent } from "../lib/wedding-defaults";
import {
  buildGoogleCalendarUrl,
  calculateCountdownRemaining,
  getCountdownTarget,
  isValidIanaTimeZone,
  resolveCountdownEvent,
  zonedLocalDateTimeToUtc,
} from "../lib/commerce/countdown";
import { validateWeddingContentInput } from "../lib/commerce/wedding-validation";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(isValidIanaTimeZone("Asia/Jakarta"), "Asia/Jakarta must be a valid IANA timezone");
assert(isValidIanaTimeZone("Asia/Makassar"), "Asia/Makassar must be a valid IANA timezone");
assert(!isValidIanaTimeZone("Asia/Ngasal"), "invalid timezone must be rejected");

const jakarta = zonedLocalDateTimeToUtc("2026-12-20", "10:00", "Asia/Jakarta");
assert(jakarta?.toISOString() === "2026-12-20T03:00:00.000Z", "WIB conversion must be UTC+7");

const makassar = zonedLocalDateTimeToUtc("2026-12-20", "10:00", "Asia/Makassar");
assert(makassar?.toISOString() === "2026-12-20T02:00:00.000Z", "WITA conversion must be UTC+8");

const jayapura = zonedLocalDateTimeToUtc("2026-12-20", "10:00", "Asia/Jayapura");
assert(jayapura?.toISOString() === "2026-12-20T01:00:00.000Z", "WIT conversion must be UTC+9");

const events = [
  {
    id: "akad",
    title: "Akad",
    date: "2026-12-20",
    time: "08:00",
    timezone: "Asia/Jakarta",
    location: "Venue A",
    address: "Address A",
    isPrimary: true,
  },
  {
    id: "resepsi",
    title: "Resepsi",
    date: "2026-12-20",
    time: "11:00",
    endTime: "14:00",
    timezone: "Asia/Jakarta",
    location: "Venue B",
    address: "Address B",
    isPrimary: false,
  },
];

const content = {
  ...defaultContent,
  couple: {
    bride: { ...defaultContent.couple.bride, name: "Heni" },
    groom: { ...defaultContent.couple.groom, name: "Fikri" },
  },
  hero: { ...defaultContent.hero, countdownEventId: "resepsi" },
  events,
};

assert(resolveCountdownEvent(content)?.id === "resepsi", "explicit countdownEventId must win");
const target = getCountdownTarget(content);
assert(target?.event?.id === "resepsi", "countdown target must use selected event");
assert(target?.date.toISOString() === "2026-12-20T04:00:00.000Z", "selected WIB event conversion is wrong");
assert(target?.timeZone === "Asia/Jakarta", "countdown target timezone is wrong");

const remaining = calculateCountdownRemaining(
  Date.parse("2026-12-21T00:00:00.000Z"),
  Date.parse("2026-12-20T00:00:00.000Z")
);
assert(remaining.days === 1 && remaining.hours === 0, "24 hour countdown calculation is wrong");
assert(!remaining.completed, "future countdown must not be completed");
assert(
  calculateCountdownRemaining(1000, 2000).completed,
  "past countdown must clamp to completed zero"
);

assert(target, "target is required for calendar verification");
const calendarUrl = new URL(buildGoogleCalendarUrl(content, target));
assert(calendarUrl.searchParams.get("ctz") === "Asia/Jakarta", "calendar timezone missing");
assert(
  calendarUrl.searchParams.get("dates") === "20261220T040000Z/20261220T070000Z",
  "calendar start/end must use actual event times"
);

const invalidTimezone = validateWeddingContentInput({
  ...defaultContent,
  events: [
    {
      id: "bad-zone",
      title: "Event",
      date: "2026-12-20",
      time: "10:00",
      timezone: "Asia/Ngasal",
      location: "Venue",
      address: "Address",
      isPrimary: true,
    },
  ],
});
assert(!invalidTimezone.ok, "invalid timezone must fail server validation");
assert(
  invalidTimezone.errors.some((error) => error.includes("valid IANA time zone")),
  "invalid timezone error message missing"
);

const legacyCompatible = validateWeddingContentInput({
  ...defaultContent,
  events: [
    {
      id: "legacy",
      title: "Legacy event",
      date: "2026-12-20",
      time: "10:00",
      location: "Venue",
      address: "Address",
      isPrimary: true,
    },
  ],
});
assert(legacyCompatible.ok, "legacy events without timezone must remain compatible");
assert(
  legacyCompatible.value.events[0].timezone === "Asia/Jakarta",
  "legacy events must normalize to Asia/Jakarta"
);

console.log("Phase 3.5 timezone-safe countdown verification passed.");
