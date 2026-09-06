"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { WeddingContent } from "@/lib/wedding-defaults";
import type { PublicGuestContext } from "@/templates/types";

export interface SectionConfig {
  id: string;
  enabled: boolean;
  order: number;
}

export interface InvitationContextValue {
  weddingId: string;
  publicSlug?: string;
  content: WeddingContent;
  sections: SectionConfig[];
  guest?: PublicGuestContext;
}

const InvitationContext = createContext<InvitationContextValue | null>(null);

export function InvitationProvider({
  value,
  children,
}: {
  value: InvitationContextValue;
  children: ReactNode;
}) {
  return (
    <InvitationContext.Provider value={value}>
      {children}
    </InvitationContext.Provider>
  );
}

export function useInvitation(): InvitationContextValue | null {
  return useContext(InvitationContext);
}
