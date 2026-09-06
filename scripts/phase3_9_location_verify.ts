import assert from "node:assert/strict";
import {
  buildDirectionsUrl,
  buildMapEmbedUrl,
  formatLocationSchedule,
  getLocationEntries,
  locationQuery,
} from "@/lib/commerce/location";
import { DEFAULT_EVENT_TIME_ZONE } from "@/lib/wedding-contract";
import { defaultContent } from "@/lib/wedding-defaults";

const content = structuredClone(defaultContent);
content.events = [
  {
    id: "event-1",
    title: "Akad",
    date: "2026-12-12",
    time: "09:00",
    endTime: "11:00",
    timezone: DEFAULT_EVENT_TIME_ZONE,
    location: "Gedung Endriya",
    address: "Cianjur, Jawa Barat",
    mapsUrl: "",
    latitude: -6.816,
    longitude: 107.142,
    isPrimary: true,
  },
  {
    id: "event-2",
    title: "Resepsi",
    date: "2026-12-12",
    time: "12:00",
    endTime: "",
    timezone: DEFAULT_EVENT_TIME_ZONE,
    location: "Venue B",
    address: "Bandung",
    mapsUrl: "https://maps.google.com/?q=Bandung",
    isPrimary: false,
  },
];

assert.equal(locationQuery(content.events[0]), "-6.816,107.142");
assert.match(buildMapEmbedUrl(content.events[0]) ?? "", /google\.com\/maps\?q=/);
assert.match(buildDirectionsUrl(content.events[0]) ?? "", /maps\/search\/\?api=1/);
assert.equal(buildDirectionsUrl(content.events[1]), "https://maps.google.com/?q=Bandung");
assert.match(formatLocationSchedule(content.events[0]), /2026|Desember/);
assert.equal(getLocationEntries(content).length, 2);

const blank = structuredClone(defaultContent);
blank.events = [];
assert.deepEqual(getLocationEntries(blank), []);

console.log("Phase 3.9 maps/location verification passed.");
