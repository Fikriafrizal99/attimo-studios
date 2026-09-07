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
import styles from "./EditorialIvoryTemplate.module.css";

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

const EDITORIAL_LABELS: Partial<Record<WeddingSectionId, string>> = {
  couple: "The Couple",
  date: "Save the Date",
  location: "Ceremony & Reception",
  story: "Our Story",
  gallery: "Selected Frames",
  rsvp: "Attendance",
  wishes: "Notes & Wishes",
  gift: "Wedding Gift",
};

function EditorialHero() {
  const invitation = useInvitation();
  const bride = invitation?.content?.couple?.bride;
  const groom = invitation?.content?.couple?.groom;
  const hero = invitation?.content?.hero;
  const guest = invitation?.guest;
  const brideName = bride?.shortName || bride?.name || "Bride";
  const groomName = groom?.shortName || groom?.name || "Groom";

  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.copy}>
        <div>
          {guest?.displayName && <p className={styles.guest}>Prepared for {guest.displayName}</p>}
          <p className={styles.kicker}>{hero?.greeting || "The Wedding of"}</p>
          <h1 className={styles.names}>
            <span>{brideName}</span>
            <em>&amp;</em>
            <span>{groomName}</span>
          </h1>
        </div>
        <div className={styles.heroFooter}>
          <p>{hero?.subtitle || "A considered celebration of two lives becoming one."}</p>
          <button type="button" onClick={() => document.getElementById("couple")?.scrollIntoView({ behavior: "smooth" })}>
            View invitation
          </button>
        </div>
      </div>
      <div className={styles.cover}>
        {hero?.coverImage ? <img src={hero.coverImage} alt={`${brideName} & ${groomName}`} /> : <div className={styles.coverFallback} aria-hidden="true"><span>E</span><i>&amp;</i><span>I</span></div>}
        <div className={styles.coverFrame} aria-hidden="true" />
        <p className={styles.coverCaption}>ENDRIYA · EDITORIAL IVORY</p>
      </div>
    </section>
  );
}

function EditorialFrame({ sectionId, children }: { sectionId: WeddingSectionId; children: React.ReactNode }) {
  return (
    <section className={styles.editorialFrame} data-editorial-section={sectionId}>
      <aside className={styles.marginLabel}>{EDITORIAL_LABELS[sectionId] || sectionId}</aside>
      <div className={styles.sectionRule} aria-hidden="true" />
      <div className={styles.sharedSection}>{children}</div>
    </section>
  );
}

export function EditorialIvoryTemplate({ weddingId, publicSlug, content, sections, theme, guest }: TemplateRenderProps) {
  const sorted = [...sections].filter((section) => section.enabled).sort((a, b) => a.order - b.order);

  return (
    <InvitationProvider value={{ weddingId, publicSlug, content, sections, theme, guest }}>
      <main
        className={styles.root}
        data-endriya-template="editorial-001"
        data-endriya-visual-tier="2d"
        data-endriya-experience="editorial-ivory"
        data-endriya-typography="cormorant-garamond+dm-serif-display+inter"
      >
        {sorted.map((section) => {
          if (section.id === "hero") return <EditorialHero key={section.id} />;
          const Component = SECTION_COMPONENTS[section.id];
          if (!Component) return null;
          if (section.id === "music") return <Component key={section.id} />;
          return <EditorialFrame key={section.id} sectionId={section.id}><Component /></EditorialFrame>;
        })}
      </main>
    </InvitationProvider>
  );
}
