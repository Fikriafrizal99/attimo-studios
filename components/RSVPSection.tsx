"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useInvitation } from "@/components/InvitationContext";
import { Link2, Send, Users } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

type Attendance = "yes" | "no" | "maybe";

function isAttendance(value: unknown): value is Attendance {
  return value === "yes" || value === "no" || value === "maybe";
}

export default function RSVPSection() {
  const invitation = useInvitation();
  const publicSlug = invitation?.publicSlug;
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
    if (!publicSlug || !guest?.token) {
      setTotalGuests(0);
      return;
    }

    const params = new URLSearchParams({
      slug: publicSlug,
      guest_token: guest.token,
    });

    fetch(`/api/rsvp?${params.toString()}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        setTotalGuests(data?.statistics?.totalGuests ?? 0);
        const response = data?.response;
        if (response && isAttendance(response.attendance)) {
          setFormData({
            name: guest.displayName,
            attendance: response.attendance,
            guestCount:
              response.attendance === "yes"
                ? Math.min(Math.max(Number(response.guestCount) || 1, 1), guest.maxGuests)
                : 1,
            message: typeof response.message === "string" ? response.message : "",
          });
          setSubmitted(true);
        }
      })
      .catch(() => undefined);
  }, [publicSlug, guest, submitted]);

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
    if (!publicSlug || !guest?.token) {
      return setError("RSVP hanya tersedia melalui link undangan personal.");
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendance: formData.attendance,
          guestCount: formData.guestCount,
          message: formData.message,
          wedding_slug: publicSlug,
          guest_token: guest.token,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Failed to submit RSVP");
      setSubmitted(true);
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
          {guest && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-2">
              <Users className="size-5 text-rose-600" />
              <span className="font-semibold text-rose-600">{totalGuests} expected guest{totalGuests === 1 ? "" : "s"}</span>
            </div>
          )}
          <h2 className="font-serif text-4xl font-bold text-gray-800 md:text-5xl">Konfirmasi Kehadiran</h2>
          {guest?.displayName && (
            <p className="mt-4 text-gray-600">Undangan untuk <strong>{guest.displayName}</strong> · maksimal {guest.maxGuests} tamu.</p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-lg md:p-12">
          {!guest || !publicSlug ? (
            <div className="text-center">
              <Link2 className="mx-auto mb-4 size-7 text-rose-500" />
              <h3 className="font-serif text-2xl font-semibold text-gray-800">RSVP menggunakan link personal</h3>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-600">
                Undangan ini dapat dilihat tanpa login. Untuk mengirim atau mengubah RSVP, buka link personal yang diberikan oleh pasangan atau penyelenggara.
              </p>
            </div>
          ) : (
            <>
              {submitted && (
                <div className="mb-6 rounded-xl bg-green-50 p-4 text-center text-green-700">
                  <Send className="mx-auto mb-2 size-6" />
                  RSVP Anda sudah tersimpan. Anda dapat memperbaruinya kapan saja dari link tamu yang sama.
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Nama tamu</label>
                  <input
                    readOnly
                    value={guest.displayName}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700"
                  />
                </div>

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
                      max={guest.maxGuests}
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
            </>
          )}
        </div>
      </div>
    </section>
  );
}
