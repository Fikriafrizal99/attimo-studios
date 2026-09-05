"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Heart } from "lucide-react";
import { useInvitation } from "@/components/InvitationContext";

export default function Hero() {
  const invitation = useInvitation();
  const content = invitation?.content;
  const guest = invitation?.guest;
  const bride = content?.couple?.bride;
  const groom = content?.couple?.groom;
  const hero = content?.hero;
  const blessing = content?.blessingMessage;
  const heroRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(contentRef.current, { opacity: 0, y: 28, duration: 1.1, ease: "power3.out", delay: 0.15 });
      if (overlayRef.current) {
        gsap.to(overlayRef.current, {
          y: -70,
          scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: true },
        });
      }
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const brideName = bride?.shortName || bride?.name || "Bride";
  const groomName = groom?.shortName || groom?.name || "Groom";
  const coverImage = hero?.coverImage;

  return (
    <section id="hero" ref={heroRef} className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        {coverImage ? (
          <img src={coverImage} alt="Wedding cover" className="h-full w-full object-cover" fetchPriority="high" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-rose-200 via-stone-100 to-amber-100" />
        )}
        <div ref={overlayRef} className="absolute -inset-y-20 inset-x-0 bg-gradient-to-b from-black/30 via-black/25 to-black/60" />
      </div>

      <div ref={contentRef} className="relative z-10 mx-auto max-w-4xl px-4 text-center text-white">
        {guest?.displayName && (
          <div className="mb-8 rounded-full border border-white/25 bg-black/15 px-5 py-2 text-sm backdrop-blur-sm">
            Kepada Yth. <strong>{guest.displayName}</strong>
          </div>
        )}
        <p className="mb-5 text-sm uppercase tracking-[0.32em] text-white/80">{hero?.greeting || "The Wedding of"}</p>
        <h1 className="font-serif text-5xl font-bold md:text-7xl">{brideName}</h1>
        <div className="my-6 flex items-center justify-center gap-4">
          <div className="h-px w-16 bg-white/50" />
          <Heart className="size-6 fill-rose-300 text-rose-300" />
          <div className="h-px w-16 bg-white/50" />
        </div>
        <h2 className="font-serif text-5xl font-bold md:text-7xl">{groomName}</h2>
        {hero?.subtitle && <p className="mx-auto mt-7 max-w-2xl text-lg text-white/90">{hero.subtitle}</p>}
        {hero?.quote && <p className="mx-auto mt-5 max-w-2xl font-serif text-lg italic text-white/80">“{hero.quote}”</p>}
        {blessing?.translation && (
          <div className="mx-auto mt-8 max-w-2xl text-sm leading-7 text-white/75">
            <p>{blessing.translation}</p>
            {blessing.source && <p className="mt-2 font-medium">{blessing.source}</p>}
          </div>
        )}
        <button
          type="button"
          onClick={() => document.getElementById("couple")?.scrollIntoView({ behavior: "smooth" })}
          className="mt-10 rounded-full border border-white/35 bg-white/15 px-8 py-3 font-medium backdrop-blur-sm transition hover:bg-white/25"
        >
          Buka Undangan
        </button>
      </div>
    </section>
  );
}
