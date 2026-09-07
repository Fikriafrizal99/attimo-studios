"use client";

import type { ComponentType } from "react";
import CoupleSection from "@/components/CoupleSection";
import DateSection from "@/components/DateSection";
import GallerySection from "@/components/GallerySection";
import GiftSection from "@/components/GiftSection";
import { InvitationProvider, useInvitation } from "@/components/InvitationContext";
import LocationSection from "@/components/LocationSection";
import MusicPlayer from "@/components/MusicPlayer";
import RSVPSection from "@/components/RSVPSection";
import StorySection from "@/components/StorySection";
import WishesSection from "@/components/WishesSection";
import type { WeddingSectionId } from "@/lib/wedding-contract";
import type { TemplateRenderProps } from "@/templates/types";
import styles from "./CartoonLoveStoryTemplate.module.css";

const CHAPTER_COPY: Partial<Record<WeddingSectionId, string>> = {
  couple: "Chapter 01 · Meet the Couple",
  date: "Chapter 02 · Save the Date",
  location: "Chapter 03 · The Wedding Day",
  story: "Chapter 04 · Our Little Story",
  gallery: "Chapter 05 · Memory Book",
  rsvp: "Chapter 06 · Will You Join Us?",
  wishes: "Chapter 07 · Send Some Love",
  gift: "Chapter 08 · Wedding Gift",
};

const SECTION_COMPONENTS: Partial<Record<WeddingSectionId, ComponentType>> = {
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

function CartoonCharacter({ bride = false }: { bride?: boolean }) {
  return (
    <div className={`${styles.character} ${bride ? styles.characterBride : ""}`} aria-hidden="true">
      <div className={styles.hair} />
      <div className={styles.head}>
        <span className={styles.eyeLeft} />
        <span className={styles.eyeRight} />
        <span className={styles.smile} />
      </div>
      <div className={styles.body} />
    </div>
  );
}

function CartoonHero() {
  const invitation = useInvitation();
  const bride = invitation?.content?.couple?.bride;
  const groom = invitation?.content?.couple?.groom;
  const hero = invitation?.content?.hero;
  const guest = invitation?.guest;

  const brideName = bride?.shortName || bride?.name || "Bride";
  const groomName = groom?.shortName || groom?.name || "Groom";

  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.hill} aria-hidden="true" />
      <div className={styles.hillBack} aria-hidden="true" />
      <div className={`${styles.flower} ${styles.flowerOne}`} aria-hidden="true" />
      <div className={`${styles.flower} ${styles.flowerTwo}`} aria-hidden="true" />

      <div className={styles.heroInner}>
        {guest?.displayName && (
          <div className={styles.guest}>
            Kepada Yth.&nbsp;<strong>{guest.displayName}</strong>
          </div>
        )}
        <p className={styles.kicker}>{hero?.greeting || "Cartoon Love Story"}</p>
        <h1 className={styles.names}>
          {brideName}
          <span className={styles.ampersand}>&amp;</span>
          {groomName}
        </h1>
        <p className={styles.subtitle}>
          {hero?.subtitle || "Dari cerita kecil yang sederhana, sekarang kami siap memulai chapter baru bersama."}
        </p>

        <div className={styles.scene} aria-label="Ilustrasi pasangan pengantin bergaya kartun">
          <div className={`${styles.cloud} ${styles.cloudLeft}`} aria-hidden="true" />
          <div className={`${styles.cloud} ${styles.cloudRight}`} aria-hidden="true" />
          <div className={styles.characters}>
            <CartoonCharacter />
            <div className={styles.heart} aria-hidden="true">❤</div>
            <CartoonCharacter bride />
          </div>
        </div>

        <button
          type="button"
          className={styles.openButton}
          onClick={() => document.getElementById("couple")?.scrollIntoView({ behavior: "smooth" })}
        >
          Mulai Cerita
        </button>
      </div>
    </section>
  );
}

export function CartoonLoveStoryTemplate({
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
    <InvitationProvider value={{ weddingId, publicSlug, content, sections, theme, guest }}>
      <main
        className={styles.root}
        data-endriya-template="cartoon-001"
        data-endriya-visual-tier="2d"
        data-endriya-experience="illustrated-motion"
        data-endriya-typography="parisienne+nunito"
      >
        {sorted.map((section) => {
          if (section.id === "hero") return <CartoonHero key={section.id} />;
          const Component = SECTION_COMPONENTS[section.id];
          if (!Component) return null;
          if (section.id === "music") return <Component key={section.id} />;

          return (
            <div className={styles.chapter} key={section.id} data-cartoon-chapter={section.id}>
              <div className={styles.chapterLabel}>{CHAPTER_COPY[section.id] || section.id}</div>
              <Component />
            </div>
          );
        })}
      </main>
    </InvitationProvider>
  );
}
