"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import { useInvitation } from "@/components/InvitationContext";
import {
  buildGoogleCalendarUrl,
  calculateCountdownRemaining,
  formatWeddingEventDate,
  getCountdownTarget,
} from "@/lib/commerce/countdown";

const ZERO_REMAINING = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  completed: true,
};

export default function DateSection() {
  const invitation = useInvitation();
  const content = invitation?.content;
  const target = useMemo(() => (content ? getCountdownTarget(content) : null), [content]);
  const targetTime = target?.date.getTime() ?? null;
  const [remaining, setRemaining] = useState(ZERO_REMAINING);

  useEffect(() => {
    if (!targetTime) {
      setRemaining(ZERO_REMAINING);
      return;
    }

    const update = () => setRemaining(calculateCountdownRemaining(targetTime));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [targetTime]);

  if (!content || !target || !targetTime) return null;

  const event = target.event;
  const eventDate = formatWeddingEventDate(target);
  const eventTime = event?.time || null;

  function saveToCalendar() {
    window.open(buildGoogleCalendarUrl(content, target), "_blank", "noopener,noreferrer");
  }

  return (
    <section id="date" className="bg-gradient-to-b from-rose-50/30 to-white px-4 py-20">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-rose-400">
          {event?.title || "Wedding Day"}
        </p>
        <h2 className="mb-10 font-serif text-4xl font-bold text-gray-800 md:text-5xl">
          {remaining.completed ? "Hari Bahagia Telah Tiba" : "Menuju Hari Bahagia"}
        </h2>

        <div className="mb-10 grid grid-cols-4 gap-2 md:gap-6" aria-live="polite">
          {[
            ["Hari", remaining.days],
            ["Jam", remaining.hours],
            ["Menit", remaining.minutes],
            ["Detik", remaining.seconds],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl bg-white p-4 shadow-md md:p-6">
              <div className="text-2xl font-bold text-rose-500 md:text-5xl">{value}</div>
              <div className="mt-2 text-[10px] uppercase tracking-wider text-gray-500 md:text-sm">{label}</div>
            </div>
          ))}
        </div>

        <p className="font-serif text-2xl font-semibold text-gray-800 md:text-3xl">{eventDate}</p>
        {eventTime && (
          <p className="mt-2 text-sm text-gray-500">
            {eventTime}{event?.endTime ? ` – ${event.endTime}` : ""} · {target.timeZone}
          </p>
        )}

        <button
          type="button"
          onClick={saveToCalendar}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 font-medium text-white hover:bg-rose-600"
        >
          <Calendar className="size-5" /> Simpan ke Kalender
        </button>
      </div>
    </section>
  );
}
