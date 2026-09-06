"use client";

import { createContext, useContext, type ReactNode } from "react";
import type {
  CanonicalWeddingContent,
  SectionConfig,
} from "@/lib/wedding-contract";
import type { PublicGuestContext, ThemeConfig } from "@/templates/types";

export interface InvitationContextValue {
  weddingId: string;
  publicSlug?: string;
  content: CanonicalWeddingContent;
  sections: SectionConfig[];
  theme?: ThemeConfig;
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
