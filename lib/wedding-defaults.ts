export interface SectionConfig {
  id: string;
  enabled: boolean;
  order: number;
}

export type InvitationExperienceLevel =
  | "standard-2d"
  | "motion-2d"
  | "2.5d"
  | "immersive-3d";

export interface WeddingContentCouple {
  name: string;
  username: string;
  parentInfo: string;
  location: string;
  shortName?: string;
  image?: string;
}

export interface WeddingContentHero {
  greeting?: string;
  title?: string;
  subtitle?: string;
  quote?: string;
  coverImage?: string;
  coverVideo?: string;
  countdownEventId?: string;
}

export interface WeddingContentEvent {
  id?: string;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  address: string;
  mapsUrl?: string;
  latitude?: number;
  longitude?: number;
  isPrimary?: boolean;
}

export interface WeddingContentStoryItem {
  id: string;
  date?: string;
  title: string;
  description: string;
  image?: string;
}

export interface WeddingContentGalleryImage {
  id: string;
  url: string;
  alt: string;
}

export interface WeddingContentSong {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover?: string;
}

export interface WeddingGiftAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface WeddingGiftContent {
  enabled: boolean;
  intro?: string;
  bankAccounts: WeddingGiftAccount[];
  qrisImageUrl?: string;
  shippingAddress?: string;
}

export interface WeddingContent {
  schemaVersion?: 1;
  couple?: {
    bride: WeddingContentCouple;
    groom: WeddingContentCouple;
  };
  hero?: WeddingContentHero;
  events?: WeddingContentEvent[];
  story?: WeddingContentStoryItem[];
  gallery?: WeddingContentGalleryImage[];
  gifts?: WeddingGiftContent;
  music?: WeddingContentSong[];
  musicSettings?: {
    autoplayRequested?: boolean;
  };
  /** Legacy field; normalizer keeps compatibility but new UI uses event references. */
  mainEventDate?: string;
  blessingMessage?: { arabic?: string; translation: string; source?: string };
  galleryQuote?: { title: string; text: string };
}

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
  schemaVersion: 1,
  couple: {
    bride: {
      name: "",
      username: "",
      parentInfo: "",
      location: "",
      image: "",
    },
    groom: {
      name: "",
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
