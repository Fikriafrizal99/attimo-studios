"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useInvitation } from "@/components/InvitationContext";
import { Send, Users } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

type Attendance = "yes" | "no" | "maybe";

export default function RSVPSection() {
  const invitation = useInvitation();
  const weddingId = invitation?.weddingId;
  const guest = invitation?.guest;
  const sectionRef = useRef<HTMLDivElement>(null);
  const [totalGuests, setTotalGuests] = useState(0);
  const [formData, setFormData] = useState({
    name: guest?.displayName ?? "",
    attendance: "yes" as Attendance,
    guestCount: 1,
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (guest) {
      setFormData((current) => ({
        ...current,
        name: guest.displayName,
        guestCount: Math.min(Math.max(current.guestCount, 1), guest.maxGuests),
      }));
    }
  }, [guest]);

  useEffect(() => {
    if (!weddingId) return;
    fetch(`/api/rsvp?wedding_id=${encodeURIComponent(weddingId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setTotalGuests(data?.statistics?.totalGuests ?? 0))
      .catch(() => undefined);
  }, [weddingId, submitted]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".rsvp-content", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!weddingId) return setError("Wedding context is missing.");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          wedding_id: weddingId,
          guest_token: guest?.token,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Failed to submit RSVP");
      setSubmitted(true);
      setFormData({
        name: guest?.displayName ?? "",
        attendance: "yes",
        guestCount: 1,
        message: "",
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit RSVP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="rsvp" ref={sectionRef} className="bg-gradient-to-b from-white to-rose-50/30 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="rsvp-content mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-2">
            <Users className="size-5 text-rose-600" />
            <span className="font-semibold text-rose-600">{totalGuests} expected guest{totalGuests === 1 ? "" : "s"}</span>
          </div>
          <h2 className="font-serif text-4xl font-bold text-gray-800 md:text-5xl">Konfirmasi Kehadiran</h2>
          {guest?.displayName && (
            <p className="mt-4 text-gray-600">Undangan untuk <strong>{guest.displayName}</strong> · maksimal {guest.maxGuests} tamu.</p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-lg md:p-12">
          {submitted && (
            <div className="mb-6 rounded-xl bg-green-50 p-4 text-center text-green-700">
              <Send className="mx-auto mb-2 size-6" />
              Terima kasih, RSVP Anda sudah tersimpan. Anda masih dapat memperbaruinya dari link tamu yang sama.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!guest && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Nama *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
                  maxLength={120}
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Apakah Anda akan hadir? *</label>
              <div className="grid grid-cols-3 gap-3">
                {(["yes", "no", "maybe"] as Attendance[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFormData({ ...formData, attendance: option })}
                    className={`rounded-lg px-3 py-3 font-medium transition-colors ${formData.attendance === option ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-700"}`}
                  >
                    {option === "yes" ? "Hadir" : option === "no" ? "Tidak" : "Mungkin"}
                  </button>
                ))}
              </div>
            </div>

            {formData.attendance === "yes" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Jumlah tamu *</label>
                <input
                  type="number"
                  min={1}
                  max={guest?.maxGuests ?? 20}
                  required
                  value={formData.guestCount}
                  onChange={(event) => setFormData({ ...formData, guestCount: Number(event.target.value) || 1 })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Pesan (opsional)</label>
              <textarea
                rows={4}
                maxLength={500}
                value={formData.message}
                onChange={(event) => setFormData({ ...formData, message: event.target.value })}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-rose-500 px-6 py-4 font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
            >
              {loading ? "Menyimpan…" : submitted ? "Perbarui RSVP" : "Kirim RSVP"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
