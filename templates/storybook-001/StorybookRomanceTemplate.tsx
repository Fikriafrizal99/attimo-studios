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
import styles from "./StorybookRomanceTemplate.module.css";

const CHAPTERS: Partial<Record<WeddingSectionId, { number: string; title: string; note: string }>> = {
  couple: { number: "I", title: "The Two Characters", note: "Where two different journeys meet." },
  date: { number: "II", title: "The Day We Chose", note: "A date written into our favorite chapter." },
  location: { number: "III", title: "Where the Chapter Begins", note: "Meet us where our new story starts." },
  story: { number: "IV", title: "Once Upon Our Time", note: "Little moments that brought us here." },
  gallery: { number: "V", title: "Illustrated Memories", note: "Fragments from the pages behind us." },
  rsvp: { number: "VI", title: "Will You Be There?", note: "We would love to write your name into this day." },
  wishes: { number: "VII", title: "Words for the Next Chapter", note: "Leave a wish for the story ahead." },
  gift: { number: "VIII", title: "A Thoughtful Gesture", note: "Your presence and prayers are already a gift." },
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

function BotanicalCorner({ side }: { side: "left" | "right" }) {
  return (
    <div className={`${styles.botanical} ${side === "left" ? styles.botanicalLeft : styles.botanicalRight}`} aria-hidden="true">
      <span className={styles.stem} />
      <span className={`${styles.leaf} ${styles.leafOne}`} />
      <span className={`${styles.leaf} ${styles.leafTwo}`} />
      <span className={`${styles.leaf} ${styles.leafThree}`} />
      <span className={styles.flower} />
    </div>
  );
}

function StorybookHero() {
  const invitation = useInvitation();
  const bride = invitation?.content?.couple?.bride;
  const groom = invitation?.content?.couple?.groom;
  const hero = invitation?.content?.hero;
  const guest = invitation?.guest;

  const brideName = bride?.shortName || bride?.name || "Bride";
  const groomName = groom?.shortName || groom?.name || "Groom";

  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.heroBook}>
        <div className={styles.bookSpine} aria-hidden="true" />
        <BotanicalCorner side="left" />
        <BotanicalCorner side="right" />

        <div className={styles.coverPage}>
          {guest?.displayName && (
            <p className={styles.guest}>A special chapter for <strong>{guest.displayName}</strong></p>
          )}
          <p className={styles.kicker}>{hero?.greeting || "The Wedding Story of"}</p>
          <h1 className={styles.names}>
            <span>{brideName}</span>
            <em>&amp;</em>
            <span>{groomName}</span>
          </h1>
          <p className={styles.subtitle}>
            {hero?.subtitle || "Once upon a time, two paths crossed. This is the chapter where they become one."}
          </p>
          <div className={styles.ornament} aria-hidden="true">✦ ❦ ✦</div>
          <button
            type="button"
            className={styles.turnButton}
            onClick={() => document.getElementById("couple")?.scrollIntoView({ behavior: "smooth" })}
          >
            Turn the page
          </button>
        </div>

        <div className={styles.illustrationPage} aria-hidden="true">
          <div className={styles.sun} />
          <div className={styles.hillBack} />
          <div className={styles.hillFront} />
          <div className={styles.treeLeft} />
          <div className={styles.treeRight} />
          <div className={styles.coupleSilhouette}>
            <span className={styles.person} />
            <span className={`${styles.person} ${styles.personTwo}`} />
          </div>
          <p className={styles.pageCaption}>Chapter One · Forever begins here</p>
        </div>
      </div>
    </section>
  );
}

function ChapterFrame({ sectionId, children }: { sectionId: WeddingSectionId; children: React.ReactNode }) {
  const chapter = CHAPTERS[sectionId];
  if (!chapter) return <>{children}</>;

  return (
    <section className={styles.chapterFrame} data-storybook-chapter={sectionId}>
      <div className={styles.pageEdge} aria-hidden="true" />
      <header className={styles.chapterHeader}>
        <span className={styles.chapterNumber}>Chapter {chapter.number}</span>
        <h2>{chapter.title}</h2>
        <p>{chapter.note}</p>
      </header>
      <div className={styles.sharedSection}>{children}</div>
      <div className={styles.pageNumber} aria-hidden="true">ENDRIYA · {chapter.number}</div>
    </section>
  );
}

export function StorybookRomanceTemplate({
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
        data-endriya-template="storybook-001"
        data-endriya-visual-tier="2d"
        data-endriya-experience="storybook-motion"
        data-endriya-typography="parisienne+cormorant-garamond+lora"
      >
        {sorted.map((section) => {
          if (section.id === "hero") return <StorybookHero key={section.id} />;
          const Component = SECTION_COMPONENTS[section.id];
          if (!Component) return null;
          if (section.id === "music") return <Component key={section.id} />;

          return (
            <ChapterFrame key={section.id} sectionId={section.id}>
              <Component />
            </ChapterFrame>
          );
        })}
      </main>
    </InvitationProvider>
  );
}
