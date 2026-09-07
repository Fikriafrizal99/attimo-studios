import type { CSSProperties, ReactNode } from "react";
import {
  Allura,
  Cinzel_Decorative,
  Cormorant_Garamond,
  DM_Serif_Display,
  Lora,
  Nunito,
  Parisienne,
  Sacramento,
} from "next/font/google";
import type {
  TemplateTypography,
  WeddingFontId,
} from "@/templates/typography/catalog";

// Custom wedding font faces remain centralized for stable semantic variables,
// but none are preloaded globally. Browsers fetch only faces that are actually
// used by the selected template; platform Inter/Playfair remain the fallback.
const allura = Allura({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-endriya-allura",
  display: "swap",
  preload: false,
});

const cormorant = Cormorant_Garamond({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-endriya-cormorant",
  display: "swap",
  preload: false,
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-endriya-dm-serif-display",
  display: "swap",
  preload: false,
});

const lora = Lora({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-endriya-lora",
  display: "swap",
  preload: false,
});

const nunito = Nunito({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-endriya-nunito",
  display: "swap",
  preload: false,
});

const parisienne = Parisienne({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-endriya-parisienne",
  display: "swap",
  preload: false,
});

const cinzelDecorative = Cinzel_Decorative({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-endriya-cinzel-decorative",
  display: "swap",
  preload: false,
});

const sacramento = Sacramento({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-endriya-sacramento",
  display: "swap",
  preload: false,
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
  "cinzel-decorative": "var(--font-endriya-cinzel-decorative)",
  sacramento: "var(--font-endriya-sacramento)",
};

const fontLoaderClassName = [
  allura.variable,
  cormorant.variable,
  dmSerif.variable,
  lora.variable,
  nunito.variable,
  parisienne.variable,
  cinzelDecorative.variable,
  sacramento.variable,
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
