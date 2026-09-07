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
import styles from "./PaperCutGardenTemplate.module.css";

const LAYER_LABELS: Partial<Record<WeddingSectionId, string>> = {
  couple: "Layer 01 · The Couple",
  date: "Layer 02 · Save the Date",
  location: "Layer 03 · Wedding Place",
  story: "Layer 04 · Our Story",
  gallery: "Layer 05 · Memory Garden",
  rsvp: "Layer 06 · RSVP",
  wishes: "Layer 07 · Wishes",
  gift: "Layer 08 · Wedding Gift",
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

const DEPTH_FACTORS = {
  1: { x: -2, y: -2, scroll: -4 },
  2: { x: -4, y: -3, scroll: -8 },
  3: { x: -7, y: -5, scroll: -13 },
  4: { x: -10, y: -7, scroll: -18 },
  5: { x: -14, y: -9, scroll: -24 },
  6: { x: -17, y: -11, scroll: -29 },
  8: { x: -24, y: -15, scroll: -40 },
} as const;

type DepthKey = keyof typeof DEPTH_FACTORS;

function setPointerDepth(root: HTMLElement, x: number, y: number) {
  (Object.keys(DEPTH_FACTORS) as unknown as DepthKey[]).forEach((depth) => {
    const factor = DEPTH_FACTORS[depth];
    root.style.setProperty(`--paper-x${depth}`, `${(x * factor.x).toFixed(2)}px`);
    root.style.setProperty(`--paper-y${depth}`, `${(y * factor.y).toFixed(2)}px`);
  });
}

function setScrollDepth(root: HTMLElement, progress: number) {
  (Object.keys(DEPTH_FACTORS) as unknown as DepthKey[]).forEach((depth) => {
    const factor = DEPTH_FACTORS[depth];
    root.style.setProperty(`--paper-s${depth}`, `${(progress * factor.scroll).toFixed(2)}px`);
  });
}

function PaperFlower({ className = "" }: { className?: string }) {
  return (
    <div className={`${styles.paperFlower} ${className}`} aria-hidden="true">
      <span className={styles.petalOne} />
      <span className={styles.petalTwo} />
      <span className={styles.petalThree} />
      <span className={styles.petalFour} />
      <span className={styles.flowerCore} />
    </div>
  );
}

function PaperCutHero() {
  const invitation = useInvitation();
  const bride = invitation?.content?.couple?.bride;
  const groom = invitation?.content?.couple?.groom;
  const hero = invitation?.content?.hero;
  const guest = invitation?.guest;

  const brideName = bride?.shortName || bride?.name || "Bride";
  const groomName = groom?.shortName || groom?.name || "Groom";

  return (
    <section id="hero" className={styles.hero}>
      <div className={`${styles.depthLayer} ${styles.skyLayer}`} data-paper-depth="1" aria-hidden="true" />
      <div className={`${styles.depthLayer} ${styles.hillBack}`} data-paper-depth="2" aria-hidden="true" />
      <div className={`${styles.depthLayer} ${styles.hillMid}`} data-paper-depth="3" aria-hidden="true" />
      <div className={`${styles.depthLayer} ${styles.archLayer}`} data-paper-depth="4" aria-hidden="true">
        <div className={styles.paperArch} />
      </div>
      <div className={`${styles.depthLayer} ${styles.foliageBack}`} data-paper-depth="5" aria-hidden="true">
        <span className={styles.leafLeft} />
        <span className={styles.leafRight} />
      </div>

      <div className={styles.heroContent} data-paper-depth="6">
        {guest?.displayName && (
          <div className={styles.guest}>Kepada Yth. <strong>{guest.displayName}</strong></div>
        )}
        <p className={styles.kicker}>{hero?.greeting || "Paper Cut Garden"}</p>
        <h1 className={styles.names}>
          <span>{brideName}</span>
          <em>&amp;</em>
          <span>{groomName}</span>
        </h1>
        <p className={styles.subtitle}>
          {hero?.subtitle || "Dua cerita bertemu di sebuah taman kecil, disusun berlapis menjadi satu hari yang kami nantikan."}
        </p>
        <button
          type="button"
          className={styles.openButton}
          onClick={() => document.getElementById("couple")?.scrollIntoView({ behavior: "smooth" })}
        >
          Enter the Garden
        </button>
      </div>

      <div className={`${styles.depthLayer} ${styles.foreground}`} data-paper-depth="8" aria-hidden="true">
        <PaperFlower className={styles.flowerLeft} />
        <PaperFlower className={styles.flowerRight} />
        <span className={styles.foregroundLeafLeft} />
        <span className={styles.foregroundLeafRight} />
      </div>
    </section>
  );
}

export function PaperCutGardenTemplate({
  weddingId,
  publicSlug,
  content,
  sections,
  theme,
  guest,
}: TemplateRenderProps) {
  const rootRef = useRef<HTMLElement>(null);

  const sorted = [...sections]
    .filter((section) => section.enabled)
    .sort((a, b) => a.order - b.order);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let frame = 0;
    const updateScrollDepth = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const progress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1.5);
        setScrollDepth(root, progress);
        frame = 0;
      });
    };

    setPointerDepth(root, 0, 0);
    updateScrollDepth();
    window.addEventListener("scroll", updateScrollDepth, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateScrollDepth);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const root = rootRef.current;
    if (!root || event.pointerType === "touch") return;
    const rect = root.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2;
    const y = ((event.clientY / Math.max(window.innerHeight, 1)) - 0.5) * 2;
    setPointerDepth(root, x, y);
  };

  const resetPointer = () => {
    const root = rootRef.current;
    if (!root) return;
    setPointerDepth(root, 0, 0);
  };

  return (
    <InvitationProvider value={{ weddingId, publicSlug, content, sections, theme, guest }}>
      <main
        ref={rootRef}
        className={styles.root}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointer}
        data-endriya-template="paper-cut-001"
        data-endriya-visual-tier="2.5d"
        data-endriya-experience="layered-paper-parallax"
        data-endriya-typography="allura+dm-serif-display+inter"
      >
        {sorted.map((section) => {
          if (section.id === "hero") return <PaperCutHero key={section.id} />;
          const Component = SECTION_COMPONENTS[section.id];
          if (!Component) return null;
          if (section.id === "music") return <Component key={section.id} />;

          return (
            <div className={styles.paperSection} key={section.id} data-paper-section={section.id}>
              <div className={styles.sectionBackdrop} aria-hidden="true">
                <span className={styles.backdropLeafOne} />
                <span className={styles.backdropLeafTwo} />
              </div>
              <div className={styles.sectionFrame}>
                <div className={styles.layerLabel}>{LAYER_LABELS[section.id] || section.id}</div>
                <Component />
              </div>
            </div>
          );
        })}
      </main>
    </InvitationProvider>
  );
}
