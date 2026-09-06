import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark } from "@/components/BrandMark";

export const metadata: Metadata = {
  title: "Request Access — ENDRIYA",
  description: "Request access to Endriya Wedding Studio.",
};

export default function RequestAccessPage() {
  return (
    <div className="dark flex min-h-screen flex-col bg-background text-foreground">
      <header className="px-6 py-6 md:px-12">
        <Link
          href="/"
          className="inline-flex items-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Back to Endriya home"
        >
          <BrandMark showTagline />
        </Link>
      </header>
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#BFA14A]">ENDRIYA Studio</p>
        <h1 className="mb-4 mt-3 font-serif text-3xl tracking-tight text-foreground md:text-4xl">
          Request access
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Access is currently managed in stages while we complete the wedding studio experience.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Continue to account access
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-border px-6 text-sm font-medium text-foreground hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          <Link
            href="/"
            className="rounded-sm hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}
