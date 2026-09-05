"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero from "@/components/Hero";
import CoupleSection from "@/components/CoupleSection";
import GallerySection from "@/components/GallerySection";
import DateSection from "@/components/DateSection";
import LocationSection from "@/components/LocationSection";
import RSVPSection from "@/components/RSVPSection";
import LiveStreamingSection from "@/components/LiveStreamingSection";
import GiftSection from "@/components/GiftSection";
import WishesSection from "@/components/WishesSection";
import MusicPlayer from "@/components/MusicPlayer";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

export default function DemoPage() {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("section").forEach((section) => {
        gsap.from(section, {
          opacity: 0,
          y: 50,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      });
    }, mainRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={mainRef} className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur border-b border-gray-100">
        <Link href="/" className="font-medium text-foreground">
          ← Back
        </Link>
        <Link href="/dashboard" className="text-sm text-foreground/80 hover:text-foreground">
          Dashboard
        </Link>
      </nav>
      <Hero />
      <CoupleSection />
      <GallerySection />
      <DateSection />
      <LocationSection />
      <RSVPSection />
      <LiveStreamingSection />
      <GiftSection />
      <WishesSection />
      <MusicPlayer />
    </div>
  );
}
