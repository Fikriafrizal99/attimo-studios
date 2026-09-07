import { InvitationTypography } from "@/components/invitation/InvitationTypography";
import { TemplateRuntime } from "@/components/invitation/TemplateRuntime";
import { normalizeWeddingContent } from "@/lib/commerce/content";
import { normalizeSections } from "@/lib/commerce/sections";
import { resolveTemplate } from "@/templates/registry";
import type { PublicGuestContext, ThemeConfig } from "@/templates/types";

export function InvitationRenderer({
  weddingId,
  publicSlug,
  templateId,
  content,
  sections,
  theme,
  guest,
}: {
  weddingId: string;
  publicSlug?: string;
  templateId: string;
  content: unknown;
  sections: unknown;
  theme?: ThemeConfig;
  guest?: PublicGuestContext;
}) {
  const definition = resolveTemplate(templateId);

  return (
    <InvitationTypography typography={definition.typography}>
      <TemplateRuntime
        templateId={definition.id}
        weddingId={weddingId}
        publicSlug={publicSlug}
        content={normalizeWeddingContent(content)}
        sections={normalizeSections(sections)}
        theme={theme}
        guest={guest}
      />
    </InvitationTypography>
  );
}
