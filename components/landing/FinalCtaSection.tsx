import Link from "next/link";
import { cn } from "@/lib/utils";

export function FinalCtaSection() {
  return (
    <section
      className="border-y border-white/[0.06] bg-muted/20 px-6 py-20 md:px-12 md:py-28"
      aria-labelledby="final-cta-heading"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#BFA14A]">ENDRIYA</p>
          <h2
            id="final-cta-heading"
            className="mt-2 font-serif text-2xl tracking-tight text-foreground md:text-3xl"
          >
            Choose the experience. Keep every feature.
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
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
    </section>
  );
}
