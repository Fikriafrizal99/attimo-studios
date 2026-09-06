"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { PublishReadiness } from "@/lib/commerce/publish-readiness";

const SLUG_REGEX = /^[a-z0-9-]+$/;

type TemplateOption = {
  id: string;
  name: string;
  category: string;
  visualTier: "2d" | "2.5d" | "3d";
  motionLevel: "light" | "rich" | "immersive";
};

export function SettingsForm({
  weddingId,
  initialSlug,
  initialStatus,
  initialTemplateId,
  initialPublicUrl,
  initialReadiness,
  templates,
}: {
  weddingId: string;
  initialSlug: string | null;
  initialStatus: string;
  initialTemplateId: string;
  initialPublicUrl: string | null;
  initialReadiness: PublishReadiness;
  templates: TemplateOption[];
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [released, setReleased] = useState(initialStatus === "released");
  const [publicUrl, setPublicUrl] = useState(initialPublicUrl);
  const [readiness, setReadiness] = useState(initialReadiness);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(initialSlug ? true : null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);

  useEffect(() => setReadiness(initialReadiness), [initialReadiness]);

  const normalizedSlug = slug.trim().toLowerCase();
  const slugValid = normalizedSlug.length >= 2 && normalizedSlug.length <= 63 && SLUG_REGEX.test(normalizedSlug);
  const slugChanged = normalizedSlug !== (initialSlug ?? "");

  useEffect(() => {
    if (!slugValid || released) return;
    if (!slugChanged) {
      setSlugAvailable(true);
      return;
    }
    const timer = window.setTimeout(async () => {
      setChecking(true);
      try {
        const response = await fetch(`/api/weddings/check-slug?slug=${encodeURIComponent(normalizedSlug)}&weddingId=${encodeURIComponent(weddingId)}`, { credentials: "include" });
        const payload = await response.json().catch(() => ({}));
        setSlugAvailable(response.ok && payload.available === true);
        if (!response.ok && payload.error) setError(payload.error);
      } finally {
        setChecking(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [normalizedSlug, slugValid, slugChanged, weddingId, released]);

  const slugMessage = useMemo(() => {
    if (!normalizedSlug) return "Set a slug before release.";
    if (!slugValid) return "Use 2–63 lowercase letters, numbers, or hyphens.";
    if (slugAvailable === false) return "Slug is already used or reserved.";
    if (checking) return "Checking slug…";
    return null;
  }, [normalizedSlug, slugValid, slugAvailable, checking]);

  async function patch(body: Record<string, unknown>) {
    setError(null);
    setDetails([]);
    const response = await fetch(`/api/weddings/${weddingId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error ?? "Failed to update wedding");
      setDetails(Array.isArray(payload.details) ? payload.details : []);
      if (Array.isArray(payload.checks)) {
        setReadiness({
          ready: false,
          errors: Array.isArray(payload.details) ? payload.details : [],
          warnings: Array.isArray(payload.warnings) ? payload.warnings : [],
          checks: payload.checks,
        });
      }
      throw new Error(payload.error ?? "Failed to update wedding");
    }
    if (payload.public_url) setPublicUrl(payload.public_url);
    if (payload.readiness) setReadiness(payload.readiness);
    return payload;
  }

  async function saveSettings() {
    if (!slugValid || slugAvailable !== true) return;
    setSaving(true);
    try {
      await patch({ slug: normalizedSlug, template_id: templateId });
      toast.success("Settings saved.");
      router.refresh();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function release() {
    if (!slugValid || slugAvailable !== true) return;
    setSaving(true);
    try {
      const payload = await patch({ slug: normalizedSlug, template_id: templateId, status: "released" });
      setReleased(true);
      setPublicUrl(payload.public_url ?? publicUrl);
      toast.success("Wedding released.");
      router.refresh();
    } catch (releaseError) {
      toast.error(releaseError instanceof Error ? releaseError.message : "Wedding is not ready to release");
    } finally {
      setSaving(false);
    }
  }

  async function deleteWedding() {
    if (!window.confirm("Delete this wedding, guests, RSVP, wishes, and related database records?")) return;
    setDeleting(true);
    const response = await fetch(`/api/weddings/${weddingId}`, { method: "DELETE", credentials: "include" });
    setDeleting(false);
    if (!response.ok) return toast.error("Failed to delete wedding");
    toast.success("Wedding deleted.");
    router.push("/dashboard");
  }

  const input = "min-h-[44px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-[#BFA14A] disabled:opacity-60";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-neutral-50">Settings & Publish</h2>
        <p className="mt-1 text-sm text-neutral-400">Pilih visual experience ENDRIYA, tetapkan slug, lalu release setelah readiness validator lolos.</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <p className="font-medium">{error}</p>
          {details.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">{details.map((item) => <li key={item}>{item}</li>)}</ul>}
        </div>
      )}

      <section className="space-y-4 rounded-md border border-white/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-100">Publish readiness</h3>
            <p className="mt-1 text-xs text-neutral-500">Fail harus diperbaiki. Warning tidak memblokir release.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${readiness.ready ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
            {readiness.ready ? "Ready to release" : `${readiness.errors.length} blocking issue(s)`}
          </span>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {readiness.checks.map((check) => (
            <div key={check.id} className="rounded-md border border-white/10 bg-white/[0.025] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-neutral-200">{check.label}</p>
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${check.status === "pass" ? "text-emerald-300" : check.status === "warn" ? "text-amber-300" : "text-red-300"}`}>
                  {check.status}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-neutral-500">{check.message}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-md border border-white/10 p-4">
        <label className="text-sm font-medium text-neutral-300">Template</label>
        <select value={templateId} onChange={(event) => setTemplateId(event.target.value)} disabled={released} className={input}>
          {templates.map((template) => (
            <option key={template.id} value={template.id} className="bg-neutral-900">
              {template.name} · {template.visualTier.toUpperCase()} · {template.category} · {template.motionLevel}
            </option>
          ))}
        </select>
        <p className="text-xs text-neutral-500">Semua template memiliki fitur wedding yang sama. 2D, 2.5D, dan 3D hanya membedakan pengalaman visual dan kompleksitas render.</p>
      </section>

      <section className="space-y-3 rounded-md border border-white/10 p-4">
        <label htmlFor="wedding-slug" className="text-sm font-medium text-neutral-300">Public slug</label>
        <input
          id="wedding-slug"
          value={slug}
          disabled={released}
          onChange={(event) => { setSlug(event.target.value); setSlugAvailable(null); }}
          className={input}
          placeholder="nadia-rizky"
          autoComplete="off"
          spellCheck={false}
        />
        {slugMessage && <p className="text-xs text-neutral-500">{slugMessage}</p>}
        {publicUrl && <p className="break-all text-xs text-neutral-400">Live URL: <span className="text-neutral-200">{publicUrl}</span></p>}
      </section>

      <div className="flex flex-wrap gap-3">
        {!released && (
          <>
            <button type="button" onClick={saveSettings} disabled={saving || slugAvailable !== true} className="rounded-md border border-white/10 px-5 py-2.5 text-sm font-medium text-neutral-100 disabled:opacity-50">Save settings</button>
            <button type="button" onClick={release} disabled={saving || slugAvailable !== true} className="rounded-md bg-neutral-100 px-5 py-2.5 text-sm font-semibold text-neutral-950 disabled:opacity-50">{saving ? "Checking…" : "Release wedding"}</button>
          </>
        )}
        {released && publicUrl && (
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="rounded-md bg-neutral-100 px-5 py-2.5 text-sm font-semibold text-neutral-950">View live invitation →</a>
        )}
      </div>

      <section className="rounded-md border border-red-500/30 bg-red-500/10 p-4">
        <h3 className="text-sm font-semibold text-red-300">Danger zone</h3>
        <p className="mt-1 text-xs text-red-300/80">Deleting the wedding cascades to guest records, RSVP, and wishes.</p>
        <button type="button" onClick={deleteWedding} disabled={deleting} className="mt-4 rounded-md border border-red-500/40 px-3 py-2 text-xs font-medium text-red-300 disabled:opacity-50">{deleting ? "Deleting…" : "Delete wedding"}</button>
      </section>
    </div>
  );
}
