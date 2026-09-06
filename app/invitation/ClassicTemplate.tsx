"use client";

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
import type { TemplateRenderProps } from "@/templates/types";

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
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

export function ClassicTemplate({
  weddingId,
  publicSlug,
  content,
  sections,
  guest,
}: TemplateRenderProps) {
  const sorted = [...sections]
    .filter((section) => section.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <InvitationProvider value={{ weddingId, publicSlug, content, sections, guest }}>
      <div className="min-h-screen bg-white">
        {sorted.map((section) => {
          const Component = SECTION_COMPONENTS[section.id];
          return Component ? <Component key={section.id} /> : null;
        })}
      </div>
    </InvitationProvider>
  );
}
