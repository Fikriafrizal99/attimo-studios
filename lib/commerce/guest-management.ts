export type GuestInput = {
  displayName: string;
  phone: string | null;
  groupName: string | null;
  maxGuests: number;
};

export type GuestValidationResult =
  | { ok: true; value: GuestInput }
  | { ok: false; error: string };

function clean(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim().slice(0, maxLength);
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
  const displayName = clean(input.displayName, 120);
  const groupName = clean(input.groupName, 80) || null;
  const phone = normalizeGuestPhone(input.phone);
  const numericQuota =
    typeof input.maxGuests === "number"
      ? input.maxGuests
      : typeof input.maxGuests === "string"
        ? Number(input.maxGuests)
        : 1;
  const maxGuests = Number.isInteger(numericQuota) ? numericQuota : NaN;

  if (!displayName) return { ok: false, error: "Display name is required" };
  if (!Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 20) {
    return { ok: false, error: "Guest quota must be between 1 and 20" };
  }

  return {
    ok: true,
    value: { displayName, phone, groupName, maxGuests },
  };
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
