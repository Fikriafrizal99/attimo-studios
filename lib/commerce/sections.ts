import { defaultSections, type SectionConfig } from "@/lib/wedding-defaults";

export function normalizeSections(raw: unknown): SectionConfig[] {
  const incoming = Array.isArray(raw)
    ? raw.filter((item): item is SectionConfig => {
        if (!item || typeof item !== "object") return false;
        const row = item as Record<string, unknown>;
        return typeof row.id === "string" && typeof row.enabled === "boolean" && typeof row.order === "number";
      })
    : [];

  const seen = new Set(incoming.map((item) => item.id));
  const merged = [
    ...incoming,
    ...defaultSections
      .filter((item) => !seen.has(item.id))
      .map((item, offset) => ({ ...item, order: incoming.length + offset })),
  ];

  return merged
    .sort((a, b) => a.order - b.order)
    .map((item, order) => ({ ...item, order }));
}
