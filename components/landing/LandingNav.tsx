import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/BrandMark";

export function LandingNav() {
  return (
    <nav
      className="flex items-center justify-between px-6 py-6 md:px-12"
      aria-label="Main"
    >
      <Link
        href="/"
        className="inline-flex items-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Endriya home"
      >
        <BrandMark showTagline />
      </Link>
      <div className="flex items-center gap-3">
        <Link
          href="/request-access"
          className={cn(
            "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-4 text-sm font-medium",
            "border border-border/60 text-muted-foreground hover:border-border hover:text-foreground",
            "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          Request Access
        </Link>
        <Link
          href="/signup"
          className={cn(
            "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-4 text-sm font-medium",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          Start with Endriya
        </Link>
      </div>
    </nav>
  );
}
