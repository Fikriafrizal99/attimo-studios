"use client";

import { useEffect, useRef, type ComponentType, type PointerEvent as ReactPointerEvent } from "react";
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
import styles from "./PasundanStorylandTemplate.module.css";

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

const SECTION_LABELS: Partial<Record<WeddingSectionId, string>> = {
  couple: "Panganten",
  date: "Waktos Nu Dipihormat",
  location: "Tempat Rarangkén",
  story: "Lalampahan Urang",
  gallery: "Galeri Carita",
  rsvp: "Konfirmasi Rawuh",
  wishes: "Doa & Pangharepan",
  gift: "Tanda Asih",
};

function PasundanHero() {
  const invitation = useInvitation();
  const bride = invitation?.content?.couple?.bride;
  const groom = invitation?.content?.couple?.groom;
  const hero = invitation?.content?.hero;
  const guest = invitation?.guest;

  const brideName = bride?.shortName || bride?.name || "Bride";
  const groomName = groom?.shortName || groom?.name || "Groom";

  return (
    <section id="hero" className={styles.hero}>
      <div className={`${styles.layer} ${styles.sky}`} data-pas-depth="1" aria-hidden="true" />
      <div className={`${styles.layer} ${styles.sun}`} data-pas-depth="2" aria-hidden="true" />
      <div className={`${styles.layer} ${styles.mountainBack}`} data-pas-depth="3" aria-hidden="true" />
      <div className={`${styles.layer} ${styles.mountainFront}`} data-pas-depth="4" aria-hidden="true" />
      <div className={`${styles.layer} ${styles.terrace}`} data-pas-depth="5" aria-hidden="true" />
      <div className={`${styles.layer} ${styles.gateLayer}`} data-pas-depth="6" aria-hidden="true">
        <div className={styles.gate}>
          <span className={styles.gateRoof} />
          <span className={`${styles.gatePillar} ${styles.leftPillar}`} />
          <span className={`${styles.gatePillar} ${styles.rightPillar}`} />
          <span className={styles.gateBeam} />
        </div>
      </div>

      <div className={styles.heroContent} data-pas-depth="7">
        {guest?.displayName && (
          <div className={styles.guest}>Ka Yth. <strong>{guest.displayName}</strong></div>
        )}
        <p className={styles.kicker}>Wilujeng Sumping</p>
        <h1 className={styles.names}>
          <span>{brideName}</span>
          <em>&amp;</em>
          <span>{groomName}</span>
        </h1>
        <p className={styles.subtitle}>
          {hero?.subtitle || "Kalayan rasa sukur, kami ngahaturkeun uleman pikeun nyaksian hiji carita anyar di antara gunung, taman, sareng kahaneutan kulawarga."}
        </p>
        <button
          type="button"
          className={styles.openButton}
          onClick={() => document.getElementById("couple")?.scrollIntoView({ behavior: "smooth" })}
        >
          Lebet Ka Undangan
        </button>
      </div>

      <div className={`${styles.layer} ${styles.foreground}`} data-pas-depth="9" aria-hidden="true">
        <span className={`${styles.bambooLeaf} ${styles.leafOne}`} />
        <span className={`${styles.bambooLeaf} ${styles.leafTwo}`} />
        <span className={`${styles.bambooLeaf} ${styles.leafThree}`} />
        <span className={styles.wovenPanel} />
      </div>
    </section>
  );
}

export function PasundanStorylandTemplate({
  weddingId,
  publicSlug,
  content,
  sections,
  theme,
  guest,
}: TemplateRenderProps) {
  const rootRef = useRef<HTMLElement>(null);
  const sorted = [...sections].filter((section) => section.enabled).sort((a, b) => a.order - b.order);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;

    const updateScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const p = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1.6);
        root.style.setProperty("--pas-scroll-near", `${(-34 * p).toFixed(2)}px`);
        root.style.setProperty("--pas-scroll-mid", `${(-20 * p).toFixed(2)}px`);
        root.style.setProperty("--pas-scroll-far", `${(-9 * p).toFixed(2)}px`);
        frame = 0;
      });
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2;
    const y = ((event.clientY / Math.max(window.innerHeight, 1)) - 0.5) * 2;
    root.style.setProperty("--pas-x-far", `${(-3 * x).toFixed(2)}px`);
    root.style.setProperty("--pas-y-far", `${(-2 * y).toFixed(2)}px`);
    root.style.setProperty("--pas-x-mid", `${(-9 * x).toFixed(2)}px`);
    root.style.setProperty("--pas-y-mid", `${(-6 * y).toFixed(2)}px`);
    root.style.setProperty("--pas-x-near", `${(-19 * x).toFixed(2)}px`);
    root.style.setProperty("--pas-y-near", `${(-12 * y).toFixed(2)}px`);
  };

  const resetPointer = () => {
    const root = rootRef.current;
    if (!root) return;
    ["--pas-x-far", "--pas-y-far", "--pas-x-mid", "--pas-y-mid", "--pas-x-near", "--pas-y-near"].forEach((name) => root.style.setProperty(name, "0px"));
  };

  return (
    <InvitationProvider value={{ weddingId, publicSlug, content, sections, theme, guest }}>
      <main
        ref={rootRef}
        className={styles.root}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointer}
        data-endriya-template="pasundan-001"
        data-endriya-visual-tier="2.5d"
        data-endriya-experience="pasundan-storyland-parallax"
        data-endriya-typography="cinzel-decorative+cormorant-garamond+lora"
      >
        {sorted.map((section) => {
          if (section.id === "hero") return <PasundanHero key={section.id} />;
          const Component = SECTION_COMPONENTS[section.id];
          if (!Component) return null;
          if (section.id === "music") return <Component key={section.id} />;

          return (
            <div className={styles.storySection} key={section.id} data-pasundan-section={section.id}>
              <div className={styles.sectionOrnament} aria-hidden="true">
                <span className={styles.ornamentLeafLeft} />
                <span className={styles.ornamentLeafRight} />
              </div>
              <div className={styles.sectionFrame}>
                <div className={styles.sectionLabel}>{SECTION_LABELS[section.id] || section.id}</div>
                <Component />
              </div>
            </div>
          );
        })}
      </main>
    </InvitationProvider>
  );
}
