"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useInvitation } from "@/components/InvitationContext";
import {
  getGalleryItems,
  nextGalleryIndex,
  previousGalleryIndex,
} from "@/lib/commerce/gallery";

gsap.registerPlugin(ScrollTrigger);

export default function GallerySection() {
  const invitation = useInvitation();
  const images = useMemo(
    () => getGalleryItems(invitation?.content),
    [invitation?.content]
  );
  const quote = invitation?.content.galleryQuote;
  const sectionRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedImage = selectedIndex === null ? null : images[selectedIndex] ?? null;

  useEffect(() => {
    if (!sectionRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".gallery-item").forEach((item, index) => {
        gsap.from(item, {
          opacity: 0,
          y: 24,
          duration: 0.55,
          ease: "power3.out",
          delay: Math.min(index * 0.05, 0.25),
          scrollTrigger: { trigger: item, start: "top 90%" },
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [images.length]);

  useEffect(() => {
    if (selectedIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedIndex(null);
      } else if (event.key === "ArrowLeft") {
        setSelectedIndex((current) =>
          current === null ? null : previousGalleryIndex(current, images.length)
        );
      } else if (event.key === "ArrowRight") {
        setSelectedIndex((current) =>
          current === null ? null : nextGalleryIndex(current, images.length)
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedIndex, images.length]);

  if (images.length === 0) return null;

  const showPrevious = () => {
    setSelectedIndex((current) =>
      current === null ? null : previousGalleryIndex(current, images.length)
    );
  };

  const showNext = () => {
    setSelectedIndex((current) =>
      current === null ? null : nextGalleryIndex(current, images.length)
    );
  };

  return (
    <section id="gallery" ref={sectionRef} className="bg-white px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-4xl font-bold text-gray-800 md:text-5xl">
            {quote?.title || "Gallery"}
          </h2>
          {quote?.text && (
            <p className="mx-auto mt-4 max-w-2xl italic text-gray-600">{quote.text}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {images.map((image, index) => (
            <button
              type="button"
              key={image.id}
              className="gallery-item group relative aspect-square overflow-hidden rounded-xl bg-gray-100 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Buka foto ${index + 1}: ${image.alt}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.alt}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10 motion-reduce:transition-none" />
            </button>
          ))}
        </div>
      </div>

      {selectedImage && selectedIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ${selectedIndex + 1} dari ${images.length}: ${selectedImage.alt}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setSelectedIndex(null)}
            className="absolute right-4 top-4 rounded-full bg-black/40 p-2 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Tutup galeri"
          >
            <X className="size-7" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrevious();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:left-6"
                aria-label="Foto sebelumnya"
              >
                <ChevronLeft className="size-8" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:right-6"
                aria-label="Foto berikutnya"
              >
                <ChevronRight className="size-8" />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage.url}
            alt={selectedImage.alt}
            decoding="async"
            className="max-h-[90vh] max-w-[94vw] rounded-xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            {selectedIndex + 1} / {images.length}
          </p>
        </div>
      )}
    </section>
  );
}
