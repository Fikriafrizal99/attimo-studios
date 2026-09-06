"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: (id: string) => `/dashboard/weddings/${id}`, label: "Overview", ownerOnly: false },
  { href: (id: string) => `/dashboard/weddings/${id}/content`, label: "Content", ownerOnly: false },
  { href: (id: string) => `/dashboard/weddings/${id}/layout-sections`, label: "Layout", ownerOnly: false },
  { href: (id: string) => `/dashboard/weddings/${id}/guests`, label: "Guests", ownerOnly: true },
  { href: (id: string) => `/dashboard/weddings/${id}/collaborators`, label: "Collaborators", ownerOnly: true },
  { href: (id: string) => `/dashboard/weddings/${id}/settings`, label: "Settings", ownerOnly: true },
] as const;

export function WeddingTabs({
  weddingId,
  role,
}: {
  weddingId: string;
  role: "owner" | "collaborator";
}) {
  const pathname = usePathname();
  const visibleTabs = TABS.filter((tab) => !tab.ownerOnly || role === "owner");

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-white/6" aria-label="Project sections">
      {visibleTabs.map(({ href, label }) => {
        const resolved = href(weddingId);
        const isActive =
          resolved === pathname ||
          (resolved !== `/dashboard/weddings/${weddingId}` && pathname?.startsWith(resolved));
        return (
          <Link
            key={resolved}
            href={resolved}
            className={
              isActive
                ? "-mb-px whitespace-nowrap rounded-t border-b-2 border-[#BFA14A] px-3 py-2.5 text-xs font-medium text-[#BFA14A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A]"
                : "whitespace-nowrap rounded-t px-3 py-2.5 text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A]"
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
