import {
  defaultContent,
  type WeddingContent,
  type WeddingContentEvent,
  type WeddingContentGalleryImage,
  type WeddingContentSong,
  type WeddingContentStoryItem,
  type WeddingGiftAccount,
} from "@/lib/wedding-defaults";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function optionalText(value: unknown): string | undefined {
  const valueText = text(value);
  return valueText || undefined;
}

function numberOrUndefined(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function booleanValue(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizePerson(raw: unknown) {
  const value = record(raw);
  return {
    name: text(value.name),
    shortName: optionalText(value.shortName),
    username: text(value.username),
    parentInfo: text(value.parentInfo),
    location: text(value.location),
    image: optionalText(value.image),
  };
}

function normalizeEvents(raw: unknown): WeddingContentEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const value = record(item);
    return {
      id: text(value.id) || `event-${index + 1}`,
      title: text(value.title),
      date: text(value.date),
      time: text(value.time),
      endTime: optionalText(value.endTime),
      location: text(value.location),
      address: text(value.address),
      mapsUrl: optionalText(value.mapsUrl),
      latitude: numberOrUndefined(value.latitude),
      longitude: numberOrUndefined(value.longitude),
      isPrimary: booleanValue(value.isPrimary, index === 0),
    };
  });
}

function normalizeStory(raw: unknown): WeddingContentStoryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const value = record(item);
    return {
      id: text(value.id) || `story-${index + 1}`,
      date: optionalText(value.date),
      title: text(value.title),
      description: text(value.description),
      image: optionalText(value.image),
    };
  });
}

function normalizeGallery(raw: unknown): WeddingContentGalleryImage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      const value = record(item);
      return {
        id: text(value.id) || `gallery-${index + 1}`,
        url: text(value.url),
        alt: text(value.alt) || `Wedding gallery photo ${index + 1}`,
      };
    })
    .filter((item) => item.url.length > 0);
}

function normalizeMusic(raw: unknown): WeddingContentSong[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      const value = record(item);
      return {
        id: text(value.id) || `music-${index + 1}`,
        title: text(value.title),
        artist: text(value.artist),
        url: text(value.url),
        cover: optionalText(value.cover),
      };
    })
    .filter((item) => item.url.length > 0);
}

function normalizeGiftAccounts(raw: unknown): WeddingGiftAccount[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const value = record(item);
    return {
      id: text(value.id) || `account-${index + 1}`,
      bankName: text(value.bankName),
      accountNumber: text(value.accountNumber),
      accountHolder: text(value.accountHolder),
    };
  });
}

export function normalizeWeddingContent(raw: unknown): WeddingContent {
  const source = record(raw);
  const couple = record(source.couple);
  const hero = record(source.hero);
  const gifts = record(source.gifts);
  const musicSettings = record(source.musicSettings);
  const blessing = record(source.blessingMessage);
  const galleryQuote = record(source.galleryQuote);

  return {
    schemaVersion: 1,
    couple: {
      bride: normalizePerson(couple.bride),
      groom: normalizePerson(couple.groom),
    },
    hero: {
      greeting: text(hero.greeting, defaultContent.hero?.greeting ?? "The Wedding of"),
      title: text(hero.title),
      subtitle: text(hero.subtitle),
      quote: text(hero.quote),
      coverImage: text(hero.coverImage),
      coverVideo: text(hero.coverVideo),
      countdownEventId: text(hero.countdownEventId),
    },
    events: normalizeEvents(source.events),
    story: normalizeStory(source.story),
    gallery: normalizeGallery(source.gallery),
    gifts: {
      enabled: booleanValue(gifts.enabled, true),
      intro: text(gifts.intro, defaultContent.gifts?.intro ?? ""),
      bankAccounts: normalizeGiftAccounts(gifts.bankAccounts),
      qrisImageUrl: text(gifts.qrisImageUrl),
      shippingAddress: text(gifts.shippingAddress),
    },
    music: normalizeMusic(source.music),
    musicSettings: {
      autoplayRequested: booleanValue(musicSettings.autoplayRequested, false),
    },
    mainEventDate: optionalText(source.mainEventDate),
    blessingMessage: {
      arabic: text(blessing.arabic),
      translation: text(blessing.translation),
      source: text(blessing.source),
    },
    galleryQuote: {
      title: text(galleryQuote.title, "Gallery"),
      text: text(galleryQuote.text),
    },
  };
}

export function getCountdownDate(content: WeddingContent): Date | null {
  const events = content.events ?? [];
  const requestedId = content.hero?.countdownEventId;
  const selected =
    (requestedId ? events.find((event) => event.id === requestedId) : undefined) ??
    events.find((event) => event.isPrimary) ??
    events[0];

  if (selected?.date) {
    const time = selected.time?.match(/^(\d{1,2}):(\d{2})/);
    const date = new Date(`${selected.date}T${time ? `${time[1].padStart(2, "0")}:${time[2]}:00` : "00:00:00"}`);
    if (!Number.isNaN(date.getTime())) return date;
  }

  if (content.mainEventDate) {
    const legacy = new Date(content.mainEventDate);
    if (!Number.isNaN(legacy.getTime())) return legacy;
  }

  return null;
}
