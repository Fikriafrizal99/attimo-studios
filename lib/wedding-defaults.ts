import {
  WEDDING_CONTENT_SCHEMA_VERSION,
  type SectionConfig,
  type WeddingContent,
} from "@/lib/wedding-contract";

export type InvitationExperienceLevel =
  | "standard-2d"
  | "motion-2d"
  | "2.5d"
  | "immersive-3d";

export type {
  SectionConfig,
  WeddingContent,
  WeddingContentCouple,
  WeddingContentHero,
  WeddingContentEvent,
  WeddingContentStoryItem,
  WeddingContentGalleryImage,
  WeddingContentSong,
  WeddingGiftAccount,
  WeddingGiftContent,
  WeddingSectionId,
} from "@/lib/wedding-contract";

export const defaultSections: SectionConfig[] = [
  { id: "hero", enabled: true, order: 0 },
  { id: "couple", enabled: true, order: 1 },
  { id: "date", enabled: true, order: 2 },
  { id: "location", enabled: true, order: 3 },
  { id: "story", enabled: true, order: 4 },
  { id: "gallery", enabled: true, order: 5 },
  { id: "rsvp", enabled: true, order: 6 },
  { id: "wishes", enabled: true, order: 7 },
  { id: "gift", enabled: true, order: 8 },
  { id: "music", enabled: true, order: 9 },
];

export const defaultContent: WeddingContent = {
  schemaVersion: WEDDING_CONTENT_SCHEMA_VERSION,
  couple: {
    bride: {
      name: "",
      shortName: "",
      username: "",
      parentInfo: "",
      location: "",
      image: "",
    },
    groom: {
      name: "",
      shortName: "",
      username: "",
      parentInfo: "",
      location: "",
      image: "",
    },
  },
  hero: {
    greeting: "The Wedding of",
    title: "",
    subtitle: "",
    quote: "",
    coverImage: "",
    coverVideo: "",
    countdownEventId: "",
  },
  events: [],
  story: [],
  gallery: [],
  gifts: {
    enabled: true,
    intro: "Doa restu Anda merupakan hadiah terindah bagi kami.",
    bankAccounts: [],
    qrisImageUrl: "",
    shippingAddress: "",
  },
  music: [],
  musicSettings: { autoplayRequested: false },
  blessingMessage: {
    arabic: "",
    translation: "",
    source: "",
  },
  galleryQuote: {
    title: "Gallery",
    text: "",
  },
};
