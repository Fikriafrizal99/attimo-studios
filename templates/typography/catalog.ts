export const WEDDING_FONT_IDS = [
  "inter",
  "playfair-display",
  "cormorant-garamond",
  "dm-serif-display",
  "lora",
  "nunito",
  "parisienne",
  "allura",
  "sacramento",
  "cinzel-decorative",
] as const;

export type WeddingFontId = (typeof WEDDING_FONT_IDS)[number];
export type WeddingFontCategory = "sans" | "serif" | "script" | "decorative";
export type WeddingFontRole = "display" | "heading" | "body" | "accent";

export type WeddingFontDefinition = {
  id: WeddingFontId;
  family: string;
  category: WeddingFontCategory;
  source: "Google Fonts";
  license: "OFL-1.1";
  roles: readonly WeddingFontRole[];
};

export type TemplateTypography = {
  display: WeddingFontId;
  heading: WeddingFontId;
  body: WeddingFontId;
  accent?: WeddingFontId;
  fallback: {
    display: "playfair-display";
    heading: "playfair-display";
    body: "inter";
  };
};

export const WEDDING_FONT_REGISTRY: Readonly<Record<WeddingFontId, WeddingFontDefinition>> =
  Object.freeze({
    inter: {
      id: "inter",
      family: "Inter",
      category: "sans",
      source: "Google Fonts",
      license: "OFL-1.1",
      roles: ["body", "heading"],
    },
    "playfair-display": {
      id: "playfair-display",
      family: "Playfair Display",
      category: "serif",
      source: "Google Fonts",
      license: "OFL-1.1",
      roles: ["display", "heading"],
    },
    "cormorant-garamond": {
      id: "cormorant-garamond",
      family: "Cormorant Garamond",
      category: "serif",
      source: "Google Fonts",
      license: "OFL-1.1",
      roles: ["display", "heading", "accent"],
    },
    "dm-serif-display": {
      id: "dm-serif-display",
      family: "DM Serif Display",
      category: "serif",
      source: "Google Fonts",
      license: "OFL-1.1",
      roles: ["display", "heading"],
    },
    lora: {
      id: "lora",
      family: "Lora",
      category: "serif",
      source: "Google Fonts",
      license: "OFL-1.1",
      roles: ["body", "heading"],
    },
    nunito: {
      id: "nunito",
      family: "Nunito",
      category: "sans",
      source: "Google Fonts",
      license: "OFL-1.1",
      roles: ["body", "heading"],
    },
    parisienne: {
      id: "parisienne",
      family: "Parisienne",
      category: "script",
      source: "Google Fonts",
      license: "OFL-1.1",
      roles: ["display", "accent"],
    },
    allura: {
      id: "allura",
      family: "Allura",
      category: "script",
      source: "Google Fonts",
      license: "OFL-1.1",
      roles: ["display", "accent"],
    },
    sacramento: {
      id: "sacramento",
      family: "Sacramento",
      category: "script",
      source: "Google Fonts",
      license: "OFL-1.1",
      roles: ["display", "accent"],
    },
    "cinzel-decorative": {
      id: "cinzel-decorative",
      family: "Cinzel Decorative",
      category: "decorative",
      source: "Google Fonts",
      license: "OFL-1.1",
      roles: ["display", "accent"],
    },
  });

export const DEFAULT_TEMPLATE_TYPOGRAPHY: TemplateTypography = Object.freeze({
  display: "playfair-display",
  heading: "playfair-display",
  body: "inter",
  fallback: {
    display: "playfair-display",
    heading: "playfair-display",
    body: "inter",
  },
});

export function validateTemplateTypography(typography: TemplateTypography): void {
  const roles: Array<[WeddingFontId, WeddingFontRole]> = [
    [typography.display, "display"],
    [typography.heading, "heading"],
    [typography.body, "body"],
  ];
  if (typography.accent) roles.push([typography.accent, "accent"]);

  for (const [fontId, role] of roles) {
    const font = WEDDING_FONT_REGISTRY[fontId];
    if (!font) throw new Error(`Unknown wedding font: ${fontId}`);
    if (!font.roles.includes(role)) {
      throw new Error(`Wedding font ${fontId} is not approved for role ${role}`);
    }
  }
}
