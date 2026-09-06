import Link from "next/link";
import { LandingNav } from "./LandingNav";
import { HeroSection } from "./HeroSection";
import { ValueSection } from "./ValueSection";
import { ProductProofSection } from "./ProductProofSection";
import { TrustSection } from "./TrustSection";
import { FinalCtaSection } from "./FinalCtaSection";

export function EndriyaLanding() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      >
        Skip to content
      </a>
      <LandingNav />
      <main id="main-content">
        <HeroSection />
        <ValueSection />
        <ProductProofSection />
        <TrustSection />
        <FinalCtaSection />
      </main>
      <footer className="border-t border-white/[0.06] px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <span>ENDRIYA — Digital Wedding Experience</span>
          <Link
            href="/login"
            className="rounded-sm hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
