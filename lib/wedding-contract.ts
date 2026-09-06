export const WEDDING_CONTENT_SCHEMA_VERSION = 1 as const;
export const DEFAULT_EVENT_TIME_ZONE = "Asia/Jakarta" as const;

export const WEDDING_SECTION_IDS = [
  "hero",
  "couple",
  "date",
  "location",
  "story",
  "gallery",
  "rsvp",
  "wishes",
  "gift",
  "music",
] as const;

export type WeddingSectionId = (typeof WEDDING_SECTION_IDS)[number];

export interface SectionConfig {
  id: WeddingSectionId;
  enabled: boolean;
  order: number;
}

export interface WeddingPersonContent {
  name: string;
  shortName?: string;
  username: string;
  parentInfo: string;
  location: string;
  image?: string;
}

export interface WeddingHeroContent {
  greeting: string;
  title: string;
  subtitle: string;
  quote: string;
  coverImage: string;
  coverVideo: string;
  countdownEventId: string;
}

export interface WeddingEventContent {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  /** IANA time-zone identifier for the physical event, e.g. Asia/Jakarta. */
  timezone: string;
  location: string;
  address: string;
  mapsUrl?: string;
  latitude?: number;
  longitude?: number;
  isPrimary: boolean;
}

export interface WeddingStoryItemContent {
  id: string;
  date?: string;
  title: string;
  description: string;
  image?: string;
}

export interface WeddingGalleryImageContent {
  id: string;
  url: string;
  alt: string;
}

export interface WeddingSongContent {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover?: string;
}

export interface WeddingGiftAccountContent {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface WeddingGiftContent {
  enabled: boolean;
  intro: string;
  bankAccounts: WeddingGiftAccountContent[];
  qrisImageUrl: string;
  shippingAddress: string;
}

export interface WeddingContent {
  /** Compatibility surface for existing editor state. Normalized content always has version 1. */
  schemaVersion?: typeof WEDDING_CONTENT_SCHEMA_VERSION;
  couple: {
    bride: WeddingPersonContent;
    groom: WeddingPersonContent;
  };
  hero: WeddingHeroContent;
  events: WeddingEventContent[];
  story: WeddingStoryItemContent[];
  gallery: WeddingGalleryImageContent[];
  gifts: WeddingGiftContent;
  music: WeddingSongContent[];
  musicSettings: {
    autoplayRequested: boolean;
  };
  blessingMessage: {
    arabic: string;
    translation: string;
    source: string;
  };
  galleryQuote: {
    title: string;
    text: string;
  };
  /** Legacy compatibility only. New code should resolve countdown from events. */
  mainEventDate?: string;
}

/** Canonical result emitted by normalization and consumed by renderers. */
export type CanonicalWeddingContent = Omit<WeddingContent, "schemaVersion"> & {
  schemaVersion: typeof WEDDING_CONTENT_SCHEMA_VERSION;
};

/**
 * Product-level invariant:
 * - canonical wedding content is shared by every visual tier/template.
 * - template_id/theme are presentation config and must not be embedded here.
 * - RSVP, wishes and guests are operational tenant data, not content JSON.
 */

// Backward-compatible aliases while existing editor/renderer imports are migrated.
export type WeddingContentCouple = WeddingPersonContent;
export type WeddingContentHero = WeddingHeroContent;
export type WeddingContentEvent = WeddingEventContent;
export type WeddingContentStoryItem = WeddingStoryItemContent;
export type WeddingContentGalleryImage = WeddingGalleryImageContent;
export type WeddingContentSong = WeddingSongContent;
export type WeddingGiftAccount = WeddingGiftAccountContent;
