"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { X } from "lucide-react";
import { useInvitation } from "@/components/InvitationContext";

gsap.registerPlugin(ScrollTrigger);

export default function GallerySection() {
  const invitation = useInvitation();
  const images = invitation?.content.gallery ?? [];
  const quote = invitation?.content.galleryQuote;
  const sectionRef = useRef<HTMLElement>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
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

  if (images.length === 0) return null;

  return (
    <section id="gallery" ref={sectionRef} className="bg-white px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-4xl font-bold text-gray-800 md:text-5xl">{quote?.title || "Gallery"}</h2>
          {quote?.text && <p className="mx-auto mt-4 max-w-2xl italic text-gray-600">{quote.text}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {images.map((image) => (
            <button
              type="button"
              key={image.id}
              className="gallery-item group relative aspect-square overflow-hidden rounded-xl bg-gray-100 text-left"
              onClick={() => setSelectedImage(image)}
              aria-label={`Open ${image.alt}`}
            >
              <img
                src={image.url}
                alt={image.alt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
            </button>
          ))}
        </div>
      </div>

      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedImage.alt}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute right-4 top-4 rounded-full bg-black/40 p-2 text-white"
            aria-label="Close image"
          >
            <X className="size-7" />
          </button>
          <img
            src={selectedImage.url}
            alt={selectedImage.alt}
            className="max-h-[90vh] max-w-[94vw] rounded-xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
