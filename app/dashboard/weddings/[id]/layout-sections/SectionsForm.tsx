"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { SectionConfig } from "@/lib/wedding-defaults";

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero / Opening",
  couple: "Couple",
  date: "Countdown / Date",
  location: "Events & Location",
  story: "Love Story",
  gallery: "Gallery",
  rsvp: "RSVP",
  wishes: "Wishes",
  gift: "Digital Gift",
  music: "Music",
};

export function SectionsForm({ weddingId, initialSections }: { weddingId: string; initialSections: SectionConfig[] }) {
  const [sections, setSections] = useState<SectionConfig[]>([...initialSections].sort((a, b) => a.order - b.order));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (next: SectionConfig[]) => {
    setError(null);
    setSaving(true);
    const response = await fetch(`/api/weddings/${weddingId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections: next }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      const message = payload.error ?? "Failed to save layout";
      setError(message);
      toast.error(message);
      return;
    }
    setSections([...(payload.sections ?? next)].sort((a: SectionConfig, b: SectionConfig) => a.order - b.order));
    toast.success("Layout saved.");
  }, [weddingId]);

  function toggle(index: number) {
    const next = sections.map((section, itemIndex) => itemIndex === index ? { ...section, enabled: !section.enabled } : section);
    setSections(next);
    void save(next);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    const normalized = next.map((section, order) => ({ ...section, order }));
    setSections(normalized);
    void save(normalized);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-50">Layout Sections</h2>
        <p className="mt-1 text-sm text-neutral-400">Urutan section adalah data wedding; template tetap boleh menyusun pengalaman visualnya sendiri selama compatibility contract terpenuhi.</p>
      </div>
      {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      <ul className="divide-y divide-white/5 overflow-hidden rounded-md border border-white/10 bg-white/[0.02]">
        {sections.map((section, index) => (
          <li key={section.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex gap-1">
              <button type="button" disabled={index === 0 || saving} onClick={() => move(index, -1)} className="flex size-9 items-center justify-center rounded border border-white/10 text-neutral-300 disabled:opacity-30">↑</button>
              <button type="button" disabled={index === sections.length - 1 || saving} onClick={() => move(index, 1)} className="flex size-9 items-center justify-center rounded border border-white/10 text-neutral-300 disabled:opacity-30">↓</button>
            </div>
            <label className="flex min-h-[44px] flex-1 cursor-pointer items-center gap-3">
              <input type="checkbox" checked={section.enabled} disabled={saving} onChange={() => toggle(index)} className="size-5" />
              <span className="font-medium text-neutral-200">{SECTION_LABELS[section.id] ?? section.id}</span>
            </label>
          </li>
        ))}
      </ul>
      {saving && <p className="text-xs text-neutral-500">Saving layout…</p>}
    </div>
  );
}
