const RESERVED_SLUGS = new Set([
  "www",
  "api",
  "app",
  "admin",
  "dashboard",
  "login",
  "signup",
  "preview",
  "invite",
  "invitation",
  "pricing",
  "templates",
  "assets",
]);

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const SLUG_REGEX = /^[a-z0-9-]+$/;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

export function validateSlug(value: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string") return { ok: false, error: "Slug is required" };
  const slug = value.trim().toLowerCase();
  if (slug.length < 2 || slug.length > 63) {
    return { ok: false, error: "Slug must be 2–63 characters" };
  }
  if (!SLUG_REGEX.test(slug)) {
    return { ok: false, error: "Slug can only use lowercase letters, numbers, and hyphens" };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, error: "This slug is reserved" };
  }
  return { ok: true, value: slug };
}

export function cleanText(value: unknown, maxLength: number, required = false): string | null {
  if (typeof value !== "string") return required ? null : "";
  const cleaned = value.trim().replace(/\u0000/g, "");
  if (required && cleaned.length === 0) return null;
  return cleaned.slice(0, maxLength);
}

export function isAttendance(value: unknown): value is "yes" | "no" | "maybe" {
  return value === "yes" || value === "no" || value === "maybe";
}

export function parseGuestCount(value: unknown, max = 20): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > max) return null;
  return parsed;
}

export function parseOptionalUrl(value: unknown): string | null {
  if (value == null || value === "") return "";
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function getReservedSlugs(): string[] {
  return [...RESERVED_SLUGS];
}
