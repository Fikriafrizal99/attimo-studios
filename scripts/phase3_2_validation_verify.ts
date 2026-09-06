import { defaultContent, defaultSections } from "../lib/wedding-defaults";
import {
  validateWeddingContentInput,
  validateWeddingSectionsInput,
} from "../lib/commerce/wedding-validation";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectContentFailure(value: unknown, expected: string) {
  const result = validateWeddingContentInput(value);
  assert(!result.ok, `expected content validation failure containing: ${expected}`);
  assert(
    result.errors.some((error) => error.includes(expected)),
    `expected error containing '${expected}', got: ${result.errors.join(" | ")}`
  );
}

const valid = validateWeddingContentInput(defaultContent);
assert(valid.ok, "defaultContent must satisfy canonical validation");
assert(valid.value.schemaVersion === 1, "normalized content must use schemaVersion 1");

expectContentFailure({ ...defaultContent, schemaVersion: 2 }, "schemaVersion must be 1");
expectContentFailure({ ...defaultContent, surprise: true }, "surprise is not part");
expectContentFailure(
  {
    ...defaultContent,
    hero: { ...defaultContent.hero, coverImage: "javascript:alert(1)" },
  },
  "coverImage must use http or https"
);
expectContentFailure(
  {
    ...defaultContent,
    events: [
      { id: "same", title: "A", date: "2026-10-10", time: "10:00", location: "X", address: "Y", isPrimary: true },
      { id: "same", title: "B", date: "2026-10-11", time: "11:00", location: "X", address: "Y", isPrimary: false },
    ],
  },
  "duplicates same"
);
expectContentFailure(
  {
    ...defaultContent,
    events: [
      { id: "a", title: "A", date: "2026-10-10", time: "10:00", location: "X", address: "Y", isPrimary: true },
      { id: "b", title: "B", date: "2026-10-11", time: "11:00", location: "X", address: "Y", isPrimary: true },
    ],
  },
  "only one primary event"
);
expectContentFailure(
  {
    ...defaultContent,
    hero: { ...defaultContent.hero, countdownEventId: "missing" },
    events: [{ id: "real", title: "A", date: "2026-10-10", time: "10:00", location: "X", address: "Y", isPrimary: true }],
  },
  "countdownEventId must reference"
);
expectContentFailure(
  {
    ...defaultContent,
    events: [{ id: "real", title: "A", date: "2026-10-10", time: "10:00", location: "X", address: "Y", latitude: 120, isPrimary: true }],
  },
  "latitude must be a number between -90 and 90"
);

const validSections = validateWeddingSectionsInput(defaultSections);
assert(validSections.ok, "defaultSections must satisfy canonical validation");
assert(validSections.value.length === 10, "canonical sections must contain 10 sections");

const duplicateOrder = defaultSections.map((section, index) => ({
  ...section,
  order: index === 1 ? 0 : section.order,
}));
const badOrder = validateWeddingSectionsInput(duplicateOrder);
assert(!badOrder.ok, "duplicate section order must fail");
assert(badOrder.errors.some((error) => error.includes("order duplicates 0")), "duplicate order error missing");

const missingSection = validateWeddingSectionsInput(defaultSections.slice(0, -1));
assert(!missingSection.ok, "missing canonical section must fail");
assert(missingSection.errors.some((error) => error.includes("missing canonical section music")), "missing section error missing");

console.log("Phase 3.2 wedding validation verification passed.");
