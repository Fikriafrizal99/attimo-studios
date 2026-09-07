import Link from "next/link";
import { getTemplateRegistrySnapshot } from "@/templates/registry";

function normalize(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export default async function TemplatesCatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const q = normalize(query.q).toLowerCase();
  const category = normalize(query.category);
  const tier = normalize(query.tier);
  const status = normalize(query.status);

  const templates = getTemplateRegistrySnapshot();
  const categories = [...new Set(templates.map((item) => item.category))].sort();
  const tiers = [...new Set(templates.map((item) => item.visualTier))];

  const filtered = templates.filter((item) => {
    const haystack = [item.name, item.id, item.family, item.category, ...item.tags].join(" ").toLowerCase();
    if (q && !haystack.includes(q)) return false;
    if (category && item.category !== category) return false;
    if (tier && item.visualTier !== tier) return false;
    if (status && item.status !== status) return false;
    return true;
  });

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#BFA14A]">ENDRIYA Template Registry</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-50">Template Catalog</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-neutral-500">Operator catalog for active, draft, and archived invitation experiences. Every active renderer uses the same canonical wedding data and business blocks.</p>
        </div>
        <div className="text-xs text-neutral-500">{templates.filter((item) => item.status === "active").length} active · {templates.length} total</div>
      </div>

      <form className="grid gap-3 rounded-md border border-white/10 bg-[#141416] p-4 md:grid-cols-[minmax(220px,1fr)_180px_140px_140px_auto]">
        <input name="q" defaultValue={normalize(query.q)} placeholder="Search name, family, tag…" className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs text-neutral-100 outline-none focus:border-[#BFA14A]/50" />
        <select name="category" defaultValue={category} className="rounded-md border border-white/10 bg-[#0E0E10] px-3 py-2 text-xs text-neutral-300">
          <option value="">All categories</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select name="tier" defaultValue={tier} className="rounded-md border border-white/10 bg-[#0E0E10] px-3 py-2 text-xs text-neutral-300">
          <option value="">All tiers</option>
          {tiers.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select name="status" defaultValue={status} className="rounded-md border border-white/10 bg-[#0E0E10] px-3 py-2 text-xs text-neutral-300">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <div className="flex gap-2">
          <button className="rounded-md bg-neutral-100 px-4 py-2 text-xs font-medium text-neutral-950 hover:bg-neutral-200">Filter</button>
          <Link href="/dashboard/templates" className="rounded-md border border-white/10 px-4 py-2 text-xs text-neutral-400 hover:bg-white/5">Reset</Link>
        </div>
      </form>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-white/10 p-10 text-center text-sm text-neutral-500">No template matches the selected filters.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((template) => (
            <article key={template.id} className="overflow-hidden rounded-md border border-white/10 bg-[#141416]">
              <div className="aspect-[12/7] overflow-hidden border-b border-white/10 bg-black/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={template.thumbnail} alt={`${template.name} thumbnail`} className="h-full w-full object-cover transition duration-300 hover:scale-[1.015]" />
              </div>
              <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-100">{template.name}</p>
                    <p className="mt-1 font-mono text-[10px] text-neutral-600">{template.id} · v{template.version}</p>
                  </div>
                  <span className={template.status === "active" ? "rounded-full border border-emerald-500/25 bg-emerald-500/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300" : "rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-neutral-500"}>{template.status}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-md border border-white/8 bg-black/10 p-2.5"><span className="block text-neutral-600">Category</span><b className="mt-1 block font-medium text-neutral-300">{template.category}</b></div>
                  <div className="rounded-md border border-white/8 bg-black/10 p-2.5"><span className="block text-neutral-600">Visual tier</span><b className="mt-1 block font-medium text-neutral-300">{template.visualTier}</b></div>
                  <div className="rounded-md border border-white/8 bg-black/10 p-2.5"><span className="block text-neutral-600">Rendering</span><b className="mt-1 block font-medium text-neutral-300">{template.performance.renderingMode}</b></div>
                  <div className="rounded-md border border-white/8 bg-black/10 p-2.5"><span className="block text-neutral-600">Motion / mobile</span><b className="mt-1 block font-medium text-neutral-300">{template.performance.motionLevel} · {template.performance.mobileProfile}</b></div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {template.tags.slice(0, 6).map((tag) => <span key={tag} className="rounded-full border border-white/8 px-2 py-1 text-[10px] text-neutral-500">{tag}</span>)}
                </div>

                <div className="border-t border-white/8 pt-3 text-[10px] text-neutral-500">
                  <span>{template.typography.display}</span> · <span>{template.typography.heading}</span> · <span>{template.typography.body}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-600">{template.family}</span>
                  {template.status === "active" ? (
                    <Link href={template.previewPath} className="rounded-md border border-[#BFA14A]/35 bg-[#BFA14A]/5 px-3 py-2 text-xs font-medium text-[#D7BD6C] hover:bg-[#BFA14A]/10">Full preview →</Link>
                  ) : (
                    <span className="rounded-md border border-white/8 px-3 py-2 text-xs text-neutral-600">Preview unavailable</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
