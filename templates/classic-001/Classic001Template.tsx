"use client";

import type { ComponentType } from "react";
import { InvitationProvider } from "@/components/InvitationContext";
import Hero from "@/components/Hero";
import CoupleSection from "@/components/CoupleSection";
import DateSection from "@/components/DateSection";
import LocationSection from "@/components/LocationSection";
import StorySection from "@/components/StorySection";
import GallerySection from "@/components/GallerySection";
import RSVPSection from "@/components/RSVPSection";
import WishesSection from "@/components/WishesSection";
import GiftSection from "@/components/GiftSection";
import MusicPlayer from "@/components/MusicPlayer";
import type { WeddingSectionId } from "@/lib/wedding-contract";
import type { TemplateRenderProps } from "@/templates/types";

const SECTION_COMPONENTS: Record<WeddingSectionId, ComponentType> = {
  hero: Hero,
  couple: CoupleSection,
  date: DateSection,
  location: LocationSection,
  story: StorySection,
  gallery: GallerySection,
  rsvp: RSVPSection,
  wishes: WishesSection,
  gift: GiftSection,
  music: MusicPlayer,
};

export function Classic001Template({
  weddingId,
  publicSlug,
  content,
  sections,
  theme,
  guest,
}: TemplateRenderProps) {
  const sorted = [...sections]
    .filter((section) => section.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <InvitationProvider
      value={{ weddingId, publicSlug, content, sections, theme, guest }}
    >
      <main
        className="min-h-screen bg-white"
        data-endriya-template="classic-001"
        data-endriya-visual-tier="2d"
      >
        {sorted.map((section) => {
          const Component = SECTION_COMPONENTS[section.id];
          return <Component key={section.id} />;
        })}
      </main>
    </InvitationProvider>
  );
}
