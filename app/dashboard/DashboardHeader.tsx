"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { UserProfileDropdown } from "./UserProfileDropdown";

function ProfileDropdownPlaceholder() {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/6 bg-white/5 text-[11px] font-medium text-neutral-400"
      aria-hidden
    >
      …
    </span>
  );
}

export function DashboardHeader() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isWeddingRoute =
    pathname?.startsWith("/dashboard/weddings/") &&
    pathname !== "/dashboard/weddings" &&
    pathname !== "/dashboard/new";

  return (
    <header className="sticky top-0 z-10 flex min-h-[56px] items-center justify-between gap-4 border-b border-white/6 bg-[#0E0E10]/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <Link
          href="/dashboard"
          className="shrink-0 rounded transition-colors hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0E10]"
          aria-label="Endriya dashboard"
        >
          <BrandMark />
        </Link>
        <span className="hidden truncate text-sm text-neutral-500 sm:inline" aria-hidden>
          {isWeddingRoute ? "Wedding Studio" : "Projects"}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <label className="hidden sm:block">
          <span className="sr-only">Search</span>
          <input
            type="search"
            placeholder="Find project…"
            autoComplete="off"
            className="h-8 min-w-[140px] max-w-[200px] rounded border border-white/6 bg-white/5 px-2.5 py-1 text-xs text-neutral-200 placeholder:text-neutral-500 outline-none transition-colors focus:border-white/10 focus:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#BFA14A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0E10]"
          />
        </label>
        {mounted ? <UserProfileDropdown /> : <ProfileDropdownPlaceholder />}
      </div>
    </header>
  );
}
