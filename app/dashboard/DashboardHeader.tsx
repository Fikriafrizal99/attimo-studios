"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { UserProfileDropdown } from "./UserProfileDropdown";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Projects" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/customers", label: "Customers" },
] as const;

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
    <header className="sticky top-0 z-10 border-b border-white/6 bg-[#0E0E10]/95 backdrop-blur">
      <div className="flex min-h-[56px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/dashboard"
            className="shrink-0 rounded transition-colors hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0E10]"
            aria-label="Endriya dashboard"
          >
            <BrandMark />
          </Link>
          <span className="hidden truncate text-sm text-neutral-500 lg:inline" aria-hidden>
            {isWeddingRoute ? "Wedding Studio" : "Commerce Studio"}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {mounted ? <UserProfileDropdown /> : <ProfileDropdownPlaceholder />}
        </div>
      </div>

      {!isWeddingRoute && (
        <nav className="flex gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Commerce sections">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "-mb-px whitespace-nowrap border-b-2 border-[#BFA14A] px-3 py-2 text-xs font-medium text-[#BFA14A]"
                    : "whitespace-nowrap px-3 py-2 text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-200"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
