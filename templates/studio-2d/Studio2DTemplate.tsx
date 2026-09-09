"use client";

import type { ComponentType, ReactNode } from "react";
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
import styles from "./Studio2DTemplate.module.css";

export type Studio2DVariant = "classic" | "editorial" | "cartoon" | "storybook" | "minimal";

type Studio2DConfig = {
  variant: Studio2DVariant;
  templateId: string;
  experience: string;
  typography: string;
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

const SECTION_LABELS: Record<Studio2DVariant, Partial<Record<WeddingSectionId, string>>> = {
  classic: {
    couple: "Mempelai",
    date: "Save the Date",
    location: "Hari Bahagia",
    story: "Kisah Kami",
    gallery: "Galeri Kami",
    rsvp: "Konfirmasi Kehadiran",
    wishes: "Ucapan & Doa",
    gift: "Wedding Gift",
  },
  editorial: {
    couple: "The Couple",
    date: "Save the Date",
    location: "Ceremony & Reception",
    story: "Our Story",
    gallery: "Selected Frames",
    rsvp: "Attendance",
    wishes: "Notes & Wishes",
    gift: "Wedding Gift",
  },
  cartoon: {
    couple: "Meet the Couple",
    date: "Save the Date",
    location: "The Wedding Day",
    story: "Our Little Story",
    gallery: "Memory Book",
    rsvp: "Will You Join Us?",
    wishes: "Send Some Love",
    gift: "Wedding Gift",
  },
  storybook: {
    couple: "Chapter I · The Two of Us",
    date: "Chapter II · The Day We Chose",
    location: "Chapter III · Where It Begins",
    story: "Chapter IV · Once Upon Our Time",
    gallery: "Chapter V · Favorite Pages",
    rsvp: "Chapter VI · Be Part of the Story",
    wishes: "Chapter VII · Words for Tomorrow",
    gift: "Chapter VIII · A Thoughtful Gesture",
  },
  minimal: {
    couple: "Mempelai",
    date: "Tanggal",
    location: "Acara",
    story: "Cerita",
    gallery: "Galeri",
    rsvp: "RSVP",
    wishes: "Ucapan",
    gift: "Hadiah",
  },
};

function formatEventDate(value?: string, timeZone?: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: timeZone || "Asia/Jakarta",
    })
      .format(date)
      .replaceAll("/", " . ");
  } catch {
    return value;
  }
}

function StudioHero({ variant }: { variant: Studio2DVariant }) {
  const invitation = useInvitation();
  const content = invitation?.content;
  const bride = content?.couple?.bride;
  const groom = content?.couple?.groom;
  const hero = content?.hero;
  const guest = invitation?.guest;
  const primaryEvent = content?.events?.find((event) => event.isPrimary) || content?.events?.[0];

  const brideName = bride?.shortName || bride?.name || "Bride";
  const groomName = groom?.shortName || groom?.name || "Groom";
  const eventDate = formatEventDate(primaryEvent?.date, primaryEvent?.timezone);
  const greeting = hero?.greeting || "The Wedding of";
  const invitationCopy = hero?.subtitle || "Dengan penuh rasa hormat, kami mengundang Anda untuk hadir dalam hari bahagia kami.";

  return (
    <section id="hero" className={styles.hero}>
      {hero?.coverImage ? (
        <img className={styles.heroMedia} src={hero.coverImage} alt={`${brideName} & ${groomName}`} />
      ) : (
        <div className={styles.heroFallback} aria-hidden="true" />
      )}
      <div className={styles.heroOverlay} aria-hidden="true" />
      <div className={styles.heroTop}>
        <span className={styles.brand}>ENDRIYA</span>
        <span className={styles.heroIndex}>{variant === "storybook" ? "A Wedding Story" : "Wedding Invitation"}</span>
      </div>

      <div className={styles.heroContent}>
        <p className={styles.kicker}>{greeting}</p>
        <h1 className={styles.names}>
          <span>{brideName}</span>
          <em>&amp;</em>
          <span>{groomName}</span>
        </h1>
        {eventDate && <div className={styles.dateLine}>{eventDate}</div>}

        <div className={styles.guestBlock}>
          {guest?.displayName && (
            <>
              <p className={styles.guestLabel}>Yth.</p>
              <p className={styles.guestName}>{guest.displayName}</p>
            </>
          )}
          <p className={styles.subtitle}>{invitationCopy}</p>
          <button
            type="button"
            className={styles.openButton}
            onClick={() => document.getElementById("couple")?.scrollIntoView({ behavior: "smooth" })}
          >
            Buka Undangan&nbsp;&nbsp;→
          </button>
        </div>
      </div>
      <div className={styles.scrollHint} aria-hidden="true">Scroll</div>
    </section>
  );
}

function SectionFrame({ variant, sectionId, children }: { variant: Studio2DVariant; sectionId: WeddingSectionId; children: ReactNode }) {
  const label = SECTION_LABELS[variant][sectionId] || sectionId;
  return (
    <div className={styles.sectionFrame} data-studio-section={sectionId}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionEyebrow}>{label}</span>
        <span className={styles.sectionRule} aria-hidden="true" />
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}

function ClosingPanel() {
  const invitation = useInvitation();
  const content = invitation?.content;
  const bride = content?.couple?.bride;
  const groom = content?.couple?.groom;
  const hero = content?.hero;
  const brideName = bride?.shortName || bride?.name || "Bride";
  const groomName = groom?.shortName || groom?.name || "Groom";

  return (
    <section className={styles.closing} aria-label="Penutup undangan">
      {hero?.coverImage ? (
        <img className={styles.closingMedia} src={hero.coverImage} alt="" loading="lazy" />
      ) : (
        <div className={styles.closingFallback} aria-hidden="true" />
      )}
      <div className={styles.closingOverlay} aria-hidden="true" />
      <div className={styles.closingCopy}>
        <small>Terima Kasih</small>
        <h2>{brideName} &amp; {groomName}</h2>
        <p>Atas doa, perhatian, dan kehadiran Anda. Semoga hari yang kami rayakan menjadi awal dari cerita yang penuh kebaikan.</p>
        <small className={styles.closingBrand}>ENDRIYA · MORE THAN AN INVITATION</small>
      </div>
    </section>
  );
}

export function Studio2DTemplate({ config, ...props }: TemplateRenderProps & { config: Studio2DConfig }) {
  const sorted = [...props.sections].filter((section) => section.enabled).sort((a, b) => a.order - b.order);
  const hasHero = sorted.some((section) => section.id === "hero");

  return (
    <InvitationProvider value={{
      weddingId: props.weddingId,
      publicSlug: props.publicSlug,
      content: props.content,
      sections: props.sections,
      theme: props.theme,
      guest: props.guest,
    }}>
      <main
        className={styles.root}
        data-studio-variant={config.variant}
        data-endriya-template={config.templateId}
        data-endriya-visual-tier="2d"
        data-endriya-experience={config.experience}
        data-endriya-typography={config.typography}
      >
        {sorted.map((section) => {
          if (section.id === "hero") return <StudioHero key={section.id} variant={config.variant} />;
          const Component = SECTION_COMPONENTS[section.id];
          if (!Component) return null;
          if (section.id === "music") return <Component key={section.id} />;
          return (
            <SectionFrame key={section.id} variant={config.variant} sectionId={section.id}>
              <Component />
            </SectionFrame>
          );
        })}
        {hasHero && <ClosingPanel />}
      </main>
    </InvitationProvider>
  );
}
