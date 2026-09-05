"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { format } from "date-fns";
import { useInvitation } from "@/components/InvitationContext";
import { MapPin, Send } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

type Wish = {
  id: string;
  name: string;
  location: string;
  message: string;
  createdAt: Date;
};

export default function WishesSection() {
  const invitation = useInvitation();
  const weddingId = invitation?.weddingId;
  const guest = invitation?.guest;
  const sectionRef = useRef<HTMLDivElement>(null);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [formData, setFormData] = useState({ name: guest?.displayName ?? "", location: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (guest) setFormData((current) => ({ ...current, name: guest.displayName }));
  }, [guest]);

  useEffect(() => {
    if (!weddingId) return;
    setLoading(true);
    fetch(`/api/wishes?wedding_id=${encodeURIComponent(weddingId)}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload) => {
        const rows = (payload.data ?? []) as Array<{ id: string; name: string; location: string; message: string; createdAt: string }>;
        setWishes(rows.map((item) => ({ ...item, createdAt: new Date(item.createdAt) })));
      })
      .catch(() => setError("Ucapan belum dapat dimuat."))
      .finally(() => setLoading(false));
  }, [weddingId]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".wish-item", {
        opacity: 0,
        y: 18,
        duration: 0.5,
        stagger: 0.05,
        scrollTrigger: { trigger: sectionRef.current, start: "top 85%" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [wishes]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!weddingId) return setError("Wedding context is missing.");
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          wedding_id: weddingId,
          guest_token: guest?.token,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Failed to submit wish");
      setWishes((current) => [
        { ...payload.data, createdAt: new Date(payload.data.createdAt) },
        ...current,
      ]);
      setFormData({ name: guest?.displayName ?? "", location: "", message: "" });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit wish");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="wishes" ref={sectionRef} className="bg-white px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 text-center font-serif text-4xl font-bold text-gray-800 md:text-5xl">Ucapan & Doa</h2>

        <div className="mb-12 space-y-4">
          {loading ? (
            <p className="text-center text-gray-500">Memuat ucapan…</p>
          ) : wishes.length === 0 ? (
            <p className="rounded-xl bg-gray-50 p-8 text-center text-gray-500">Belum ada ucapan. Jadilah yang pertama.</p>
          ) : (
            wishes.map((wish) => (
              <article key={wish.id} className="wish-item rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <strong className="text-gray-800">{wish.name}</strong>
                  {wish.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500"><MapPin className="size-3" />{wish.location}</span>
                  )}
                </div>
                <p className="mt-3 whitespace-pre-line text-gray-700">{wish.message}</p>
                <p className="mt-3 text-xs text-gray-400">{format(wish.createdAt, "d MMM yyyy, HH:mm")}</p>
              </article>
            ))
          )}
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl bg-gray-50 p-6 md:p-8">
          {!guest && (
            <input
              required
              maxLength={120}
              placeholder="Nama"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
            />
          )}
          <input
            maxLength={120}
            placeholder="Lokasi (opsional)"
            value={formData.location}
            onChange={(event) => setFormData({ ...formData, location: event.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
          />
          <textarea
            required
            rows={4}
            maxLength={1000}
            placeholder="Tuliskan doa dan ucapan…"
            value={formData.message}
            onChange={(event) => setFormData({ ...formData, message: event.target.value })}
            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
          />
          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-500 px-6 py-4 font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
          >
            <Send className="size-5" />
            {submitting ? "Mengirim…" : "Kirim Ucapan"}
          </button>
        </form>
      </div>
    </section>
  );
}
