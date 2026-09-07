import { Allura, Cormorant_Garamond, Lora } from "next/font/google";

const display = Allura({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-endriya-classic-display",
  display: "swap",
});

const heading = Cormorant_Garamond({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-endriya-classic-heading",
  display: "swap",
});

const body = Lora({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-endriya-classic-body",
  display: "swap",
});

export const classicTypographyClassName = [display.variable, heading.variable, body.variable].join(" ");

export const classicTypographyStyle = {
  "--font-wedding-display": "var(--font-endriya-classic-display)",
  "--font-wedding-heading": "var(--font-endriya-classic-heading)",
  "--font-wedding-body": "var(--font-endriya-classic-body)",
} as React.CSSProperties;
