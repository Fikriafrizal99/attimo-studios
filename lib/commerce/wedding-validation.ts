import {
  WEDDING_CONTENT_SCHEMA_VERSION,
  WEDDING_SECTION_IDS,
  type CanonicalWeddingContent,
  type SectionConfig,
  type WeddingSectionId,
} from "@/lib/wedding-contract";
import { normalizeWeddingContent } from "@/lib/commerce/content";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

const MAX_CONTENT_BYTES = 512_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function rejectUnknownKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  errors: string[]
) {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) errors.push(`${path}.${key} is not part of the wedding content contract`);
  }
}

function validateString(
  value: unknown,
  path: string,
  errors: string[],
  maxLength: number,
  options: { allowEmpty?: boolean } = {}
) {
  if (value === undefined) return;
  if (typeof value !== "string") {
    errors.push(`${path} must be a string`);
    return;
  }
  if (!options.allowEmpty && value.trim().length === 0) errors.push(`${path} cannot be empty`);
  if (value.length > maxLength) errors.push(`${path} exceeds ${maxLength} characters`);
  if (value.includes("\u0000")) errors.push(`${path} contains an invalid null character`);
}

function validateBoolean(value: unknown, path: string, errors: string[]) {
  if (value !== undefined && typeof value !== "boolean") errors.push(`${path} must be a boolean`);
}

function validateAssetUrl(value: unknown, path: string, errors: string[]) {
  if (value === undefined || value === "") return;
  validateString(value, path, errors, 2048, { allowEmpty: true });
  if (typeof value !== "string") return;
  if (value.startsWith("/")) return;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      errors.push(`${path} must use http or https`);
    }
  } catch {
    errors.push(`${path} must be a valid URL or app-relative path`);
  }
}

function validateHttpUrl(value: unknown, path: string, errors: string[]) {
  if (value === undefined || value === "") return;
  validateString(value, path, errors, 2048, { allowEmpty: true });
  if (typeof value !== "string") return;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      errors.push(`${path} must use http or https`);
    }
  } catch {
    errors.push(`${path} must be a valid http(s) URL`);
  }
}

function validateDate(value: unknown, path: string, errors: string[]) {
  if (value === undefined || value === "") return;
  if (typeof value !== "string" || !DATE_RE.test(value)) {
    errors.push(`${path} must use YYYY-MM-DD`);
    return;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    errors.push(`${path} is not a valid calendar date`);
  }
}

function validateTime(value: unknown, path: string, errors: string[]) {
  if (value === undefined || value === "") return;
  if (typeof value !== "string" || !TIME_RE.test(value)) errors.push(`${path} must use HH:MM`);
}

function validateNumberRange(
  value: unknown,
  path: string,
  errors: string[],
  min: number,
  max: number
) {
  if (value === undefined) return;
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    errors.push(`${path} must be a number between ${min} and ${max}`);
  }
}

function validatePerson(value: unknown, path: string, errors: string[]) {
  if (value === undefined) return;
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  rejectUnknownKeys(value, ["name", "shortName", "username", "parentInfo", "location", "image"], path, errors);
  validateString(value.name, `${path}.name`, errors, 160, { allowEmpty: true });
  validateString(value.shortName, `${path}.shortName`, errors, 80, { allowEmpty: true });
  validateString(value.username, `${path}.username`, errors, 120, { allowEmpty: true });
  validateString(value.parentInfo, `${path}.parentInfo`, errors, 1200, { allowEmpty: true });
  validateString(value.location, `${path}.location`, errors, 240, { allowEmpty: true });
  validateAssetUrl(value.image, `${path}.image`, errors);
}

function validateId(value: unknown, path: string, errors: string[]) {
  validateString(value, path, errors, 160);
}

function validateObjectArray(
  value: unknown,
  path: string,
  errors: string[],
  maxItems: number,
  callback: (item: Record<string, unknown>, itemPath: string, errors: string[]) => void
) {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }
  if (value.length > maxItems) errors.push(`${path} cannot contain more than ${maxItems} items`);
  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(item)) {
      errors.push(`${itemPath} must be an object`);
      return;
    }
    callback(item, itemPath, errors);
  });
}

function validateUniqueIds(value: unknown, path: string, errors: string[]) {
  if (!Array.isArray(value)) return;
  const seen = new Set<string>();
  value.forEach((item, index) => {
    if (!isRecord(item) || typeof item.id !== "string" || !item.id.trim()) return;
    if (seen.has(item.id)) errors.push(`${path}[${index}].id duplicates ${item.id}`);
    seen.add(item.id);
  });
}

export function validateWeddingContentInput(raw: unknown): ValidationResult<CanonicalWeddingContent> {
  const errors: string[] = [];
  if (!isRecord(raw)) return { ok: false, errors: ["content must be an object"] };

  let serialized = "";
  try {
    serialized = JSON.stringify(raw);
  } catch {
    return { ok: false, errors: ["content must be JSON serializable"] };
  }
  if (Buffer.byteLength(serialized, "utf8") > MAX_CONTENT_BYTES) {
    errors.push(`content exceeds ${MAX_CONTENT_BYTES} bytes`);
  }

  rejectUnknownKeys(
    raw,
    [
      "schemaVersion",
      "couple",
      "hero",
      "events",
      "story",
      "gallery",
      "gifts",
      "music",
      "musicSettings",
      "blessingMessage",
      "galleryQuote",
      "mainEventDate",
    ],
    "content",
    errors
  );

  if (raw.schemaVersion !== undefined && raw.schemaVersion !== WEDDING_CONTENT_SCHEMA_VERSION) {
    errors.push(`content.schemaVersion must be ${WEDDING_CONTENT_SCHEMA_VERSION}`);
  }

  if (raw.couple !== undefined) {
    if (!isRecord(raw.couple)) errors.push("content.couple must be an object");
    else {
      rejectUnknownKeys(raw.couple, ["bride", "groom"], "content.couple", errors);
      validatePerson(raw.couple.bride, "content.couple.bride", errors);
      validatePerson(raw.couple.groom, "content.couple.groom", errors);
    }
  }

  if (raw.hero !== undefined) {
    if (!isRecord(raw.hero)) errors.push("content.hero must be an object");
    else {
      rejectUnknownKeys(
        raw.hero,
        ["greeting", "title", "subtitle", "quote", "coverImage", "coverVideo", "countdownEventId"],
        "content.hero",
        errors
      );
      validateString(raw.hero.greeting, "content.hero.greeting", errors, 120, { allowEmpty: true });
      validateString(raw.hero.title, "content.hero.title", errors, 200, { allowEmpty: true });
      validateString(raw.hero.subtitle, "content.hero.subtitle", errors, 300, { allowEmpty: true });
      validateString(raw.hero.quote, "content.hero.quote", errors, 2000, { allowEmpty: true });
      validateAssetUrl(raw.hero.coverImage, "content.hero.coverImage", errors);
      validateAssetUrl(raw.hero.coverVideo, "content.hero.coverVideo", errors);
      validateString(raw.hero.countdownEventId, "content.hero.countdownEventId", errors, 160, { allowEmpty: true });
    }
  }

  validateObjectArray(raw.events, "content.events", errors, 20, (item, path) => {
    rejectUnknownKeys(
      item,
      ["id", "title", "date", "time", "endTime", "location", "address", "mapsUrl", "latitude", "longitude", "isPrimary"],
      path,
      errors
    );
    validateId(item.id, `${path}.id`, errors);
    validateString(item.title, `${path}.title`, errors, 200, { allowEmpty: true });
    validateDate(item.date, `${path}.date`, errors);
    validateTime(item.time, `${path}.time`, errors);
    validateTime(item.endTime, `${path}.endTime`, errors);
    validateString(item.location, `${path}.location`, errors, 240, { allowEmpty: true });
    validateString(item.address, `${path}.address`, errors, 1200, { allowEmpty: true });
    validateHttpUrl(item.mapsUrl, `${path}.mapsUrl`, errors);
    validateNumberRange(item.latitude, `${path}.latitude`, errors, -90, 90);
    validateNumberRange(item.longitude, `${path}.longitude`, errors, -180, 180);
    validateBoolean(item.isPrimary, `${path}.isPrimary`, errors);
  });
  validateUniqueIds(raw.events, "content.events", errors);

  validateObjectArray(raw.story, "content.story", errors, 50, (item, path) => {
    rejectUnknownKeys(item, ["id", "date", "title", "description", "image"], path, errors);
    validateId(item.id, `${path}.id`, errors);
    validateString(item.date, `${path}.date`, errors, 80, { allowEmpty: true });
    validateString(item.title, `${path}.title`, errors, 200, { allowEmpty: true });
    validateString(item.description, `${path}.description`, errors, 4000, { allowEmpty: true });
    validateAssetUrl(item.image, `${path}.image`, errors);
  });
  validateUniqueIds(raw.story, "content.story", errors);

  validateObjectArray(raw.gallery, "content.gallery", errors, 100, (item, path) => {
    rejectUnknownKeys(item, ["id", "url", "alt"], path, errors);
    validateId(item.id, `${path}.id`, errors);
    validateAssetUrl(item.url, `${path}.url`, errors);
    validateString(item.alt, `${path}.alt`, errors, 300, { allowEmpty: true });
  });
  validateUniqueIds(raw.gallery, "content.gallery", errors);

  if (raw.gifts !== undefined) {
    if (!isRecord(raw.gifts)) errors.push("content.gifts must be an object");
    else {
      rejectUnknownKeys(raw.gifts, ["enabled", "intro", "bankAccounts", "qrisImageUrl", "shippingAddress"], "content.gifts", errors);
      validateBoolean(raw.gifts.enabled, "content.gifts.enabled", errors);
      validateString(raw.gifts.intro, "content.gifts.intro", errors, 2000, { allowEmpty: true });
      validateAssetUrl(raw.gifts.qrisImageUrl, "content.gifts.qrisImageUrl", errors);
      validateString(raw.gifts.shippingAddress, "content.gifts.shippingAddress", errors, 1200, { allowEmpty: true });
      validateObjectArray(raw.gifts.bankAccounts, "content.gifts.bankAccounts", errors, 20, (item, path) => {
        rejectUnknownKeys(item, ["id", "bankName", "accountNumber", "accountHolder"], path, errors);
        validateId(item.id, `${path}.id`, errors);
        validateString(item.bankName, `${path}.bankName`, errors, 120, { allowEmpty: true });
        validateString(item.accountNumber, `${path}.accountNumber`, errors, 80, { allowEmpty: true });
        validateString(item.accountHolder, `${path}.accountHolder`, errors, 160, { allowEmpty: true });
      });
      validateUniqueIds(raw.gifts.bankAccounts, "content.gifts.bankAccounts", errors);
    }
  }

  validateObjectArray(raw.music, "content.music", errors, 20, (item, path) => {
    rejectUnknownKeys(item, ["id", "title", "artist", "url", "cover"], path, errors);
    validateId(item.id, `${path}.id`, errors);
    validateString(item.title, `${path}.title`, errors, 200, { allowEmpty: true });
    validateString(item.artist, `${path}.artist`, errors, 200, { allowEmpty: true });
    validateAssetUrl(item.url, `${path}.url`, errors);
    validateAssetUrl(item.cover, `${path}.cover`, errors);
  });
  validateUniqueIds(raw.music, "content.music", errors);

  if (raw.musicSettings !== undefined) {
    if (!isRecord(raw.musicSettings)) errors.push("content.musicSettings must be an object");
    else {
      rejectUnknownKeys(raw.musicSettings, ["autoplayRequested"], "content.musicSettings", errors);
      validateBoolean(raw.musicSettings.autoplayRequested, "content.musicSettings.autoplayRequested", errors);
    }
  }

  if (raw.blessingMessage !== undefined) {
    if (!isRecord(raw.blessingMessage)) errors.push("content.blessingMessage must be an object");
    else {
      rejectUnknownKeys(raw.blessingMessage, ["arabic", "translation", "source"], "content.blessingMessage", errors);
      validateString(raw.blessingMessage.arabic, "content.blessingMessage.arabic", errors, 4000, { allowEmpty: true });
      validateString(raw.blessingMessage.translation, "content.blessingMessage.translation", errors, 4000, { allowEmpty: true });
      validateString(raw.blessingMessage.source, "content.blessingMessage.source", errors, 300, { allowEmpty: true });
    }
  }

  if (raw.galleryQuote !== undefined) {
    if (!isRecord(raw.galleryQuote)) errors.push("content.galleryQuote must be an object");
    else {
      rejectUnknownKeys(raw.galleryQuote, ["title", "text"], "content.galleryQuote", errors);
      validateString(raw.galleryQuote.title, "content.galleryQuote.title", errors, 200, { allowEmpty: true });
      validateString(raw.galleryQuote.text, "content.galleryQuote.text", errors, 2000, { allowEmpty: true });
    }
  }

  validateString(raw.mainEventDate, "content.mainEventDate", errors, 100, { allowEmpty: true });

  const normalized = normalizeWeddingContent(raw);
  const primaryEvents = normalized.events.filter((event) => event.isPrimary);
  if (primaryEvents.length > 1) errors.push("content.events can contain only one primary event");
  if (
    normalized.hero.countdownEventId &&
    !normalized.events.some((event) => event.id === normalized.hero.countdownEventId)
  ) {
    errors.push("content.hero.countdownEventId must reference an existing event id");
  }

  return errors.length ? { ok: false, errors } : { ok: true, value: normalized };
}

export function validateWeddingSectionsInput(raw: unknown): ValidationResult<SectionConfig[]> {
  const errors: string[] = [];
  if (!Array.isArray(raw)) return { ok: false, errors: ["sections must be an array"] };

  if (raw.length !== WEDDING_SECTION_IDS.length) {
    errors.push(`sections must contain exactly ${WEDDING_SECTION_IDS.length} canonical sections`);
  }

  const allowedIds = new Set<string>(WEDDING_SECTION_IDS);
  const seenIds = new Set<string>();
  const seenOrders = new Set<number>();
  const sections: SectionConfig[] = [];

  raw.forEach((item, index) => {
    const path = `sections[${index}]`;
    if (!isRecord(item)) {
      errors.push(`${path} must be an object`);
      return;
    }
    rejectUnknownKeys(item, ["id", "enabled", "order"], path, errors);

    if (typeof item.id !== "string" || !allowedIds.has(item.id)) {
      errors.push(`${path}.id must be a canonical section id`);
    } else {
      if (seenIds.has(item.id)) errors.push(`${path}.id duplicates ${item.id}`);
      seenIds.add(item.id);
    }

    if (typeof item.enabled !== "boolean") errors.push(`${path}.enabled must be a boolean`);

    if (!Number.isInteger(item.order) || (item.order as number) < 0 || (item.order as number) >= WEDDING_SECTION_IDS.length) {
      errors.push(`${path}.order must be an integer from 0 to ${WEDDING_SECTION_IDS.length - 1}`);
    } else {
      const order = item.order as number;
      if (seenOrders.has(order)) errors.push(`${path}.order duplicates ${order}`);
      seenOrders.add(order);
    }

    if (
      typeof item.id === "string" &&
      allowedIds.has(item.id) &&
      typeof item.enabled === "boolean" &&
      Number.isInteger(item.order)
    ) {
      sections.push({ id: item.id as WeddingSectionId, enabled: item.enabled, order: item.order as number });
    }
  });

  for (const id of WEDDING_SECTION_IDS) {
    if (!seenIds.has(id)) errors.push(`sections is missing canonical section ${id}`);
  }

  return errors.length
    ? { ok: false, errors }
    : { ok: true, value: sections.sort((a, b) => a.order - b.order) };
}
