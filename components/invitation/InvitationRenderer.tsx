import { normalizeWeddingContent } from "@/lib/commerce/content";
import { normalizeSections } from "@/lib/commerce/sections";
import { resolveTemplate } from "@/templates/registry";
import type { PublicGuestContext, ThemeConfig } from "@/templates/types";

export function InvitationRenderer({
  weddingId,
  templateId,
  content,
  sections,
  theme,
  guest,
}: {
  weddingId: string;
  templateId: string;
  content: unknown;
  sections: unknown;
  theme?: ThemeConfig;
  guest?: PublicGuestContext;
}) {
  const definition = resolveTemplate(templateId);
  const Template = definition.render;
  return (
    <Template
      weddingId={weddingId}
      content={normalizeWeddingContent(content)}
      sections={normalizeSections(sections)}
      theme={theme}
      guest={guest}
    />
  );
}
