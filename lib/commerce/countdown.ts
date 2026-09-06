import {
  DEFAULT_EVENT_TIME_ZONE,
  type WeddingContent,
  type WeddingEventContent,
} from "@/lib/wedding-contract";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type CountdownTarget = {
  event: WeddingEventContent | null;
  date: Date;
  timeZone: string;
  source: "event" | "legacy";
};

export type CountdownRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  completed: boolean;
};

export function isValidIanaTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

function zonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = zonedParts(date, timeZone);
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  const wholeSecondEpoch = Math.trunc(date.getTime() / 1000) * 1000;
  return representedAsUtc - wholeSecondEpoch;
}

export function zonedLocalDateTimeToUtc(
  dateText: string,
  timeText: string,
  timeZone: string
): Date | null {
  const dateMatch = DATE_RE.exec(dateText);
  const timeMatch = TIME_RE.exec(timeText);
  if (!dateMatch || !timeMatch || !isValidIanaTimeZone(timeZone)) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);

  const initialGuess = new Date(localAsUtc);
  const firstOffset = timeZoneOffsetMs(initialGuess, timeZone);
  let result = new Date(localAsUtc - firstOffset);

  const secondOffset = timeZoneOffsetMs(result, timeZone);
  if (secondOffset !== firstOffset) result = new Date(localAsUtc - secondOffset);

  const verification = zonedParts(result, timeZone);
  if (
    verification.year !== year ||
    verification.month !== month ||
    verification.day !== day ||
    verification.hour !== hour ||
    verification.minute !== minute
  ) {
    return null;
  }

  return result;
}

export function resolveCountdownEvent(content: WeddingContent): WeddingEventContent | null {
  const events = content.events ?? [];
  const requestedId = content.hero?.countdownEventId;
  return (
    (requestedId ? events.find((event) => event.id === requestedId) : undefined) ??
    events.find((event) => event.isPrimary) ??
    events[0] ??
    null
  );
}

export function getCountdownTarget(content: WeddingContent): CountdownTarget | null {
  const event = resolveCountdownEvent(content);
  if (event?.date) {
    const timeZone = isValidIanaTimeZone(event.timezone)
      ? event.timezone
      : DEFAULT_EVENT_TIME_ZONE;
    const date = zonedLocalDateTimeToUtc(event.date, event.time || "00:00", timeZone);
    if (date) return { event, date, timeZone, source: "event" };
  }

  if (content.mainEventDate) {
    const legacy = new Date(content.mainEventDate);
    if (!Number.isNaN(legacy.getTime())) {
      return {
        event: null,
        date: legacy,
        timeZone: DEFAULT_EVENT_TIME_ZONE,
        source: "legacy",
      };
    }
  }

  return null;
}

export function getCountdownTargetDate(content: WeddingContent): Date | null {
  return getCountdownTarget(content)?.date ?? null;
}

export function calculateCountdownRemaining(
  targetEpochMs: number,
  nowEpochMs = Date.now()
): CountdownRemaining {
  const distance = Math.max(0, targetEpochMs - nowEpochMs);
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance % 86_400_000) / 3_600_000),
    minutes: Math.floor((distance % 3_600_000) / 60_000),
    seconds: Math.floor((distance % 60_000) / 1000),
    completed: distance === 0,
  };
}

export function formatWeddingEventDate(
  target: CountdownTarget,
  locale = "id-ID"
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: target.timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(target.date);
}

function googleUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildGoogleCalendarUrl(
  content: WeddingContent,
  target: CountdownTarget
): string {
  const bride = content.couple?.bride?.shortName || content.couple?.bride?.name || "Bride";
  const groom = content.couple?.groom?.shortName || content.couple?.groom?.name || "Groom";
  const event = target.event;

  let end = new Date(target.date.getTime() + 4 * 60 * 60 * 1000);
  if (event?.date && event.endTime) {
    const explicitEnd = zonedLocalDateTimeToUtc(event.date, event.endTime, target.timeZone);
    if (explicitEnd && explicitEnd.getTime() > target.date.getTime()) end = explicitEnd;
  }

  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", event?.title || `Wedding ${bride} & ${groom}`);
  url.searchParams.set("dates", `${googleUtcStamp(target.date)}/${googleUtcStamp(end)}`);
  url.searchParams.set("ctz", target.timeZone);
  if (event?.location || event?.address) {
    url.searchParams.set(
      "location",
      [event.location, event.address].filter(Boolean).join(", ")
    );
  }
  return url.toString();
}
