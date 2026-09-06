import Link from "next/link";
import { DashboardMockup } from "./DashboardMockup";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section
      className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-6 py-16 md:px-12 md:py-24 lg:grid-cols-12 lg:gap-16"
      aria-labelledby="hero-heading"
    >
      <div className="space-y-8 lg:col-span-5 xl:col-span-6">
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#BFA14A]">2D · 2.5D · 3D Wedding Experiences</p>
          <h1
            id="hero-heading"
            className={cn(
              "font-serif text-4xl leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[64px]",
              "landing-reveal",
              "animate-[landing-reveal_0.4s_ease-out_both]"
            )}
            style={{ animationDelay: "0ms" }}
          >
            Your wedding, expressed beautifully.
          </h1>
        </div>
        <p
          className={cn(
            "max-w-[34ch] text-lg text-muted-foreground",
            "landing-reveal",
            "animate-[landing-reveal_0.4s_ease-out_both]"
          )}
          style={{ animationDelay: "80ms" }}
        >
          One complete digital wedding platform. The features stay complete; the visual experience is yours to choose.
        </p>
        <div
          className={cn(
            "flex flex-wrap gap-3",
            "landing-reveal",
            "animate-[landing-reveal_0.4s_ease-out_both]"
          )}
          style={{ animationDelay: "160ms" }}
        >
          <Link
            href="/signup"
            className={cn(
              "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-6 text-sm font-medium",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
          >
            Start with Endriya
          </Link>
          <Link
            href="/request-access"
            className={cn(
              "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-6 text-sm font-medium",
              "border border-border text-foreground hover:bg-accent/50",
              "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
          >
            Request Access
          </Link>
        </div>
      </div>
      <div
        className={cn(
          "flex justify-end lg:col-span-7 xl:col-span-6",
          "landing-reveal",
          "animate-[landing-reveal_0.45s_ease-out_both]"
        )}
        style={{ animationDelay: "240ms" }}
      >
        <DashboardMockup className="w-full max-w-[520px]" />
      </div>
    </section>
  );
}
