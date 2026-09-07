import type { CSSProperties, ReactNode } from "react";
import {
  Allura,
  Cormorant_Garamond,
  DM_Serif_Display,
  Lora,
  Nunito,
  Parisienne,
} from "next/font/google";
import type {
  TemplateTypography,
  WeddingFontId,
} from "@/templates/typography/catalog";

const allura = Allura({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-endriya-allura",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-endriya-cormorant",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-endriya-dm-serif-display",
  display: "swap",
});

const lora = Lora({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-endriya-lora",
  display: "swap",
});

const nunito = Nunito({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-endriya-nunito",
  display: "swap",
});

const parisienne = Parisienne({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-endriya-parisienne",
  display: "swap",
});

const loadedFontVariable: Partial<Record<WeddingFontId, string>> = {
  inter: "var(--font-inter)",
  "playfair-display": "var(--font-playfair)",
  "cormorant-garamond": "var(--font-endriya-cormorant)",
  "dm-serif-display": "var(--font-endriya-dm-serif-display)",
  lora: "var(--font-endriya-lora)",
  nunito: "var(--font-endriya-nunito)",
  parisienne: "var(--font-endriya-parisienne)",
  allura: "var(--font-endriya-allura)",
};

const fontLoaderClassName = [
  allura.variable,
  cormorant.variable,
  dmSerif.variable,
  lora.variable,
  nunito.variable,
  parisienne.variable,
].join(" ");

function resolveLoadedFont(fontId: WeddingFontId, fallbackId: WeddingFontId): string {
  return loadedFontVariable[fontId] ?? loadedFontVariable[fallbackId] ?? "inherit";
}

export function InvitationTypography({
  typography,
  children,
}: {
  typography: TemplateTypography;
  children: ReactNode;
}) {
  const style = {
    "--font-wedding-display": resolveLoadedFont(
      typography.display,
      typography.fallback.display
    ),
    "--font-wedding-heading": resolveLoadedFont(
      typography.heading,
      typography.fallback.heading
    ),
    "--font-wedding-body": resolveLoadedFont(
      typography.body,
      typography.fallback.body
    ),
    "--font-wedding-accent": typography.accent
      ? resolveLoadedFont(typography.accent, typography.fallback.display)
      : resolveLoadedFont(typography.display, typography.fallback.display),
  } as CSSProperties;

  return (
    <div
      className={fontLoaderClassName}
      style={style}
      data-endriya-typography-scope="true"
      data-endriya-display-font={typography.display}
      data-endriya-heading-font={typography.heading}
      data-endriya-body-font={typography.body}
    >
      {children}
    </div>
  );
}
