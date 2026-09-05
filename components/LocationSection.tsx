"use client";

import { ExternalLink, MapPin } from "lucide-react";
import { useInvitation } from "@/components/InvitationContext";

function mapEmbedUrl(event: { latitude?: number; longitude?: number; address: string; location: string }) {
  const query =
    typeof event.latitude === "number" && typeof event.longitude === "number"
      ? `${event.latitude},${event.longitude}`
      : event.address || event.location;
  return query ? `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed` : null;
}

export default function LocationSection() {
  const invitation = useInvitation();
  const events = invitation?.content.events ?? [];
  if (events.length === 0) return null;

  return (
    <section id="location" className="bg-white px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-14 text-center font-serif text-4xl font-bold text-gray-800 md:text-5xl">Detail Acara</h2>
        <div className="space-y-8">
          {events.map((event, index) => {
            const embed = mapEmbedUrl(event);
            return (
              <article key={event.id ?? index} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
                <div className="p-7 md:p-9">
                  <h3 className="font-serif text-3xl font-bold capitalize text-gray-800">{event.title}</h3>
                  <p className="mt-3 font-medium text-gray-700">{event.date} · {event.time}{event.endTime ? ` – ${event.endTime}` : ""}</p>
                  <div className="mt-5 flex items-start gap-3">
                    <MapPin className="mt-1 size-5 shrink-0 text-rose-500" />
                    <div>
                      <p className="font-semibold text-gray-800">{event.location}</p>
                      <p className="mt-1 text-sm leading-6 text-gray-600">{event.address}</p>
                    </div>
                  </div>
                  {event.mapsUrl && (
                    <a
                      href={event.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-600"
                    >
                      Buka Navigasi <ExternalLink className="size-4" />
                    </a>
                  )}
                </div>
                {embed && (
                  <iframe
                    src={embed}
                    title={`Map ${event.location || event.title}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-72 w-full border-0"
                    allowFullScreen
                  />
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
