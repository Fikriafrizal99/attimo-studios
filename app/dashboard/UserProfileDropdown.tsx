"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import {
  LayoutDashboard,
  Settings,
  Plus,
  Command,
  Monitor,
  Sun,
  Moon,
  Home,
  LogOut,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const THEME_KEY = "endriya-theme";
type Theme = "system" | "light" | "dark";

function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    if (stored) setThemeState(stored);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const applied =
      theme === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : theme;
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(applied);
  }, [theme]);
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    if (typeof window !== "undefined") localStorage.setItem(THEME_KEY, t);
  }, []);
  return [theme, setTheme] as const;
}

const itemClass =
  "flex min-h-[36px] cursor-pointer select-none items-center gap-2 rounded px-2 py-1.5 text-xs text-neutral-200 outline-none transition-colors hover:bg-white/5 hover:text-neutral-50 focus:bg-white/5 focus:text-neutral-50 data-[highlighted]:bg-white/5 data-[highlighted]:text-neutral-50 data-[highlighted]:outline-none";

export function UserProfileDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const [theme, setTheme] = useTheme();

  const userDisplayName =
    session?.user?.name?.trim() || session?.user?.email?.split("@")[0] || "User";
  const userEmail = session?.user?.email ?? "";
  const userInitial = session?.user?.name?.[0]?.toUpperCase() ?? session?.user?.email?.[0]?.toUpperCase() ?? "?";

  const isDashboard = pathname === "/dashboard" || pathname?.startsWith("/dashboard/weddings") || pathname === "/dashboard/new";

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/6 bg-white/5 text-[11px] font-medium text-neutral-400 transition-colors hover:border-white/10 hover:bg-white/10 hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0E10]"
          aria-label="Open account menu"
        >
          {userInitial}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className="z-50 min-w-[220px] rounded-md border border-white/6 bg-[#141416] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
        >
          <div className="border-b border-white/6 px-2 py-2">
            <p className="truncate text-sm font-semibold text-neutral-50">{userDisplayName}</p>
            <p className="truncate text-xs text-neutral-400">{userEmail}</p>
          </div>

          <DropdownMenu.Item asChild className={itemClass}>
            <Link href="/dashboard" className={cn(isDashboard && "bg-white/5 text-[#BFA14A]")}>
              <LayoutDashboard className="size-3.5 shrink-0" aria-hidden />
              Dashboard
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={itemClass}>
            <Link href="/dashboard/settings">
              <Settings className="size-3.5 shrink-0" aria-hidden />
              Account Settings
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={itemClass}>
            <Link href="/dashboard/new">
              <Plus className="size-3.5 shrink-0" aria-hidden />
              New project
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-white/6" />

          <DropdownMenu.Item className={itemClass} disabled>
            <Command className="size-3.5 shrink-0" aria-hidden />
            <span className="flex-1">Command Menu</span>
            <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-neutral-500">⌘K</kbd>
          </DropdownMenu.Item>
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <span className="text-xs text-neutral-400">Theme</span>
            <div className="flex rounded-md border border-white/6 bg-white/5 p-0.5" role="group" aria-label="Theme">
              <button type="button" onClick={() => setTheme("system")} title="System" className={cn("rounded p-1 text-neutral-400 transition-colors hover:text-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A]", theme === "system" && "border border-white/10 bg-white/5 text-neutral-50")} aria-pressed={theme === "system"}>
                <Monitor className="size-3.5" aria-hidden />
              </button>
              <button type="button" onClick={() => setTheme("light")} title="Light" className={cn("rounded p-1 text-neutral-400 transition-colors hover:text-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A]", theme === "light" && "border border-white/10 bg-white/5 text-neutral-50")} aria-pressed={theme === "light"}>
                <Sun className="size-3.5" aria-hidden />
              </button>
              <button type="button" onClick={() => setTheme("dark")} title="Dark" className={cn("rounded p-1 text-neutral-400 transition-colors hover:text-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A]", theme === "dark" && "border border-white/10 bg-white/5 text-neutral-50")} aria-pressed={theme === "dark"}>
                <Moon className="size-3.5" aria-hidden />
              </button>
            </div>
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-white/6" />

          <DropdownMenu.Item asChild className={itemClass}>
            <Link href="/">
              <Home className="size-3.5 shrink-0" aria-hidden />
              Home
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item className={itemClass} onSelect={(e) => { e.preventDefault(); handleSignOut(); }}>
            <LogOut className="size-3.5 shrink-0" aria-hidden />
            Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
