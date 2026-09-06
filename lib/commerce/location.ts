import type { WeddingContent, WeddingEventContent } from "@/lib/wedding-contract";

export type LocationEntry = {
  event: WeddingEventContent;
  query: string;
  embedUrl: string | null;
  directionsUrl: string | null;
  scheduleLabel: string;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function locationQuery(event: WeddingEventContent): string {
  if (typeof event.latitude === "number" && typeof event.longitude === "number") {
    return `${event.latitude},${event.longitude}`;
  }
  return text(event.address) || text(event.location);
}

export function buildMapEmbedUrl(event: WeddingEventContent): string | null {
  const query = locationQuery(event);
  return query
    ? `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
    : null;
}

export function buildDirectionsUrl(event: WeddingEventContent): string | null {
  const explicit = text(event.mapsUrl);
  if (explicit) {
    try {
      const url = new URL(explicit);
      if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
    } catch {
      // Fall back to a generated Google Maps search link.
    }
  }

  const query = locationQuery(event);
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function formatLocationSchedule(event: WeddingEventContent, locale = "id-ID"): string {
  let dateLabel = text(event.date);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateLabel)) {
    const date = new Date(`${dateLabel}T00:00:00Z`);
    if (!Number.isNaN(date.getTime())) {
      dateLabel = new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
    }
  }
  const timeLabel = [text(event.time), text(event.endTime)].filter(Boolean).join(" – ");
  return [dateLabel, timeLabel, text(event.timezone)].filter(Boolean).join(" · ");
}

export function getLocationEntries(
  content: Pick<WeddingContent, "events"> | null | undefined
): LocationEntry[] {
  return (content?.events ?? [])
    .filter((event) => Boolean(text(event.location) || text(event.address) || locationQuery(event)))
    .map((event) => ({
      event,
      query: locationQuery(event),
      embedUrl: buildMapEmbedUrl(event),
      directionsUrl: buildDirectionsUrl(event),
      scheduleLabel: formatLocationSchedule(event),
    }));
}
