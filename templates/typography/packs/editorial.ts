import type { CSSProperties } from "react";
import { Cormorant_Garamond, DM_Serif_Display } from "next/font/google";

const display = Cormorant_Garamond({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-endriya-editorial-display",
  display: "swap",
});

const heading = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-endriya-editorial-heading",
  display: "swap",
});

export const editorialTypographyClassName = [display.variable, heading.variable].join(" ");

export const editorialTypographyStyle = {
  "--font-wedding-display": "var(--font-endriya-editorial-display)",
  "--font-wedding-heading": "var(--font-endriya-editorial-heading)",
  "--font-wedding-body": "var(--font-inter)",
} as CSSProperties;
