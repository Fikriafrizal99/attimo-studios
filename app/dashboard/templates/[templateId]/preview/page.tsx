import Link from "next/link";
import { notFound } from "next/navigation";
import { InvitationRenderer } from "@/components/invitation/InvitationRenderer";
import { TEMPLATE_PREVIEW_CONTENT, TEMPLATE_PREVIEW_SECTIONS } from "@/lib/commerce/template-preview-fixture";
import { TEMPLATE_REGISTRY } from "@/templates/registry";

export default async function TemplatePreviewPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  const definition = TEMPLATE_REGISTRY[templateId];
  if (!definition || definition.status !== "active") notFound();

  return (
    <div className="-mx-4 -my-4 sm:-mx-6 sm:-my-6">
      <div className="sticky top-[56px] z-20 flex items-center justify-between gap-4 border-b border-white/10 bg-[#0E0E10]/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-neutral-100">{definition.name}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-neutral-500">Catalog preview · shared canonical fixture</p>
        </div>
        <Link href="/dashboard/templates" className="shrink-0 rounded-md border border-white/10 px-3 py-2 text-xs text-neutral-300 hover:bg-white/5">← Back to catalog</Link>
      </div>
      <InvitationRenderer
        weddingId="catalog-preview"
        templateId={templateId}
        content={TEMPLATE_PREVIEW_CONTENT}
        sections={TEMPLATE_PREVIEW_SECTIONS}
      />
    </div>
  );
}
