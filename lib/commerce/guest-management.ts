export type GuestInput = {
  displayName: string;
  phone: string | null;
  groupName: string | null;
  maxGuests: number;
};

export type GuestPatch = Partial<GuestInput> & {
  isActive?: boolean;
  regenerateToken?: boolean;
};

export type GuestValidationResult =
  | { ok: true; value: GuestInput }
  | { ok: false; error: string };

export type GuestPatchValidationResult =
  | { ok: true; value: GuestPatch }
  | { ok: false; error: string };

const CREATE_FIELDS = new Set(["displayName", "phone", "groupName", "maxGuests"]);
const PATCH_FIELDS = new Set([
  "guestId",
  "displayName",
  "phone",
  "groupName",
  "maxGuests",
  "isActive",
  "regenerateToken",
]);

function clean(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim().slice(0, maxLength);
}

function parseQuota(value: unknown, fallback: number | null): number | null {
  if (value === undefined) return fallback;
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 20) return null;
  return numeric;
}

function unknownFields(input: Record<string, unknown>, allowed: Set<string>): string[] {
  return Object.keys(input).filter((key) => !allowed.has(key));
}

export function normalizeGuestPhone(value: unknown): string | null {
  const raw = clean(value, 40);
  if (!raw) return null;
  const normalized = raw.replace(/[^0-9+]/g, "");
  if (!normalized) return null;
  if (normalized.startsWith("+")) return `+${normalized.slice(1).replace(/\+/g, "")}`;
  return normalized.replace(/\+/g, "");
}

export function validateGuestInput(raw: unknown): GuestValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Guest payload must be an object" };
  }

  const input = raw as Record<string, unknown>;
  const extra = unknownFields(input, CREATE_FIELDS);
  if (extra.length) return { ok: false, error: `Unsupported guest fields: ${extra.join(", ")}` };

  const displayName = clean(input.displayName, 120);
  const groupName = clean(input.groupName, 80) || null;
  const phone = normalizeGuestPhone(input.phone);
  const maxGuests = parseQuota(input.maxGuests, 1);

  if (!displayName) return { ok: false, error: "Display name is required" };
  if (maxGuests === null) return { ok: false, error: "Guest quota must be between 1 and 20" };

  return {
    ok: true,
    value: { displayName, phone, groupName, maxGuests },
  };
}

export function validateGuestPatch(raw: unknown): GuestPatchValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Guest patch must be an object" };
  }

  const input = raw as Record<string, unknown>;
  const extra = unknownFields(input, PATCH_FIELDS);
  if (extra.length) return { ok: false, error: `Unsupported guest fields: ${extra.join(", ")}` };

  const value: GuestPatch = {};
  if (input.displayName !== undefined) {
    const displayName = clean(input.displayName, 120);
    if (!displayName) return { ok: false, error: "Display name is required" };
    value.displayName = displayName;
  }
  if (input.phone !== undefined) value.phone = normalizeGuestPhone(input.phone);
  if (input.groupName !== undefined) value.groupName = clean(input.groupName, 80) || null;
  if (input.maxGuests !== undefined) {
    const maxGuests = parseQuota(input.maxGuests, null);
    if (maxGuests === null) return { ok: false, error: "Guest quota must be between 1 and 20" };
    value.maxGuests = maxGuests;
  }
  if (input.isActive !== undefined) {
    if (typeof input.isActive !== "boolean") return { ok: false, error: "isActive must be boolean" };
    value.isActive = input.isActive;
  }
  if (input.regenerateToken !== undefined) {
    if (typeof input.regenerateToken !== "boolean") {
      return { ok: false, error: "regenerateToken must be boolean" };
    }
    value.regenerateToken = input.regenerateToken;
  }

  if (Object.keys(value).length === 0) {
    return { ok: false, error: "At least one guest field must be updated" };
  }
  return { ok: true, value };
}

export function filterGuests<T extends {
  displayName: string;
  phone: string | null;
  groupName: string | null;
  isActive: boolean;
}>(
  guests: T[],
  query: string,
  status: "all" | "active" | "inactive" = "all"
): T[] {
  const needle = query.trim().toLowerCase();
  return guests.filter((guest) => {
    if (status === "active" && !guest.isActive) return false;
    if (status === "inactive" && guest.isActive) return false;
    if (!needle) return true;
    return [guest.displayName, guest.phone ?? "", guest.groupName ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
}

export function guestStats(guests: Array<{ isActive: boolean; maxGuests: number }>) {
  return guests.reduce(
    (stats, guest) => {
      stats.total += 1;
      stats.totalQuota += guest.maxGuests;
      if (guest.isActive) stats.active += 1;
      else stats.inactive += 1;
      return stats;
    },
    { total: 0, active: 0, inactive: 0, totalQuota: 0 }
  );
}
