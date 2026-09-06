"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { useInvitation } from "@/components/InvitationContext";
import { getCountdownDate } from "@/lib/commerce/content";

export default function DateSection() {
  const invitation = useInvitation();
  const content = invitation?.content;
  const target = useMemo(() => getCountdownDate(content), [content]);
  const targetTime = target?.getTime() ?? null;
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetTime) return;
    const update = () => {
      const distance = targetTime - Date.now();
      if (distance <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setRemaining({
        days: Math.floor(distance / 86_400_000),
        hours: Math.floor((distance % 86_400_000) / 3_600_000),
        minutes: Math.floor((distance % 3_600_000) / 60_000),
        seconds: Math.floor((distance % 60_000) / 1000),
      });
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [targetTime]);

  if (!target || !targetTime) return null;

  const bride = content?.couple?.bride?.shortName || content?.couple?.bride?.name || "Bride";
  const groom = content?.couple?.groom?.shortName || content?.couple?.groom?.name || "Groom";

  function saveToCalendar() {
    if (!target) return;
    const start = format(target, "yyyyMMdd'T'HHmmss");
    const end = format(new Date(target.getTime() + 4 * 60 * 60 * 1000), "yyyyMMdd'T'HHmmss");
    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action", "TEMPLATE");
    url.searchParams.set("text", `Wedding ${bride} & ${groom}`);
    url.searchParams.set("dates", `${start}/${end}`);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }

  return (
    <section id="date" className="bg-gradient-to-b from-rose-50/30 to-white px-4 py-20">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-10 font-serif text-4xl font-bold text-gray-800 md:text-5xl">Save the Date</h2>
        <div className="mb-10 grid grid-cols-4 gap-2 md:gap-6">
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
        <p className="font-serif text-2xl font-semibold text-gray-800 md:text-3xl">{format(target, "EEEE, d MMMM yyyy")}</p>
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
