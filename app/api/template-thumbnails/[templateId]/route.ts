import { NextResponse } from "next/server";

const PALETTES: Record<string, { bg: string; accent: string; ink: string; label: string }> = {
  "classic-001": { bg: "#f5e9e6", accent: "#c98282", ink: "#4b3232", label: "CLASSIC" },
  "cartoon-001": { bg: "#d8f1ff", accent: "#e98078", ink: "#234b5b", label: "CARTOON" },
  "storybook-001": { bg: "#efe3c5", accent: "#68775a", ink: "#4d3828", label: "STORYBOOK" },
  "paper-cut-001": { bg: "#eee2d1", accent: "#7f9274", ink: "#51463c", label: "PAPER CUT" },
  "pasundan-001": { bg: "#253a32", accent: "#d0b461", ink: "#f7eed9", label: "PASUNDAN" },
  "clay-001": { bg: "#e8cdb8", accent: "#8c6251", ink: "#503a31", label: "CLAY 3D" },
  "editorial-001": { bg: "#f0ece3", accent: "#8a7659", ink: "#1a1916", label: "EDITORIAL" },
  "minimal-001": { bg: "#f3f3f0", accent: "#8b8b83", ink: "#20201e", label: "DRAFT" },
};

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[char] || char));
}

export async function GET(_request: Request, { params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  const palette = PALETTES[templateId] ?? { bg: "#ececec", accent: "#777", ink: "#222", label: templateId.toUpperCase() };
  const label = escapeXml(palette.label);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760" role="img" aria-label="${label} template thumbnail">
    <rect width="1200" height="760" fill="${palette.bg}"/>
    <circle cx="940" cy="150" r="210" fill="${palette.accent}" opacity=".18"/>
    <circle cx="185" cy="640" r="250" fill="${palette.accent}" opacity=".12"/>
    <rect x="68" y="68" width="1064" height="624" fill="none" stroke="${palette.accent}" stroke-opacity=".38"/>
    <text x="100" y="210" fill="${palette.ink}" font-family="Georgia,serif" font-size="34" letter-spacing="10">ENDRIYA</text>
    <text x="100" y="405" fill="${palette.ink}" font-family="Georgia,serif" font-size="105">Aluna</text>
    <text x="100" y="500" fill="${palette.accent}" font-family="Georgia,serif" font-size="64">&amp;</text>
    <text x="190" y="500" fill="${palette.ink}" font-family="Georgia,serif" font-size="105">Fikri</text>
    <text x="102" y="605" fill="${palette.ink}" opacity=".65" font-family="Arial,sans-serif" font-size="25" letter-spacing="7">${label}</text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
