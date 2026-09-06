"use client";

import { ExternalLink, MapPin } from "lucide-react";
import { useInvitation } from "@/components/InvitationContext";
import { getLocationEntries } from "@/lib/commerce/location";

export default function LocationSection() {
  const invitation = useInvitation();
  const entries = getLocationEntries(invitation?.content);
  if (entries.length === 0) return null;

  return (
    <section id="location" className="bg-white px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-14 text-center font-serif text-4xl font-bold text-gray-800 md:text-5xl">
          Detail Acara
        </h2>
        <div className="space-y-8">
          {entries.map(({ event, embedUrl, directionsUrl, scheduleLabel }, index) => (
            <article
              key={event.id || index}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg"
            >
              <div className="p-7 md:p-9">
                <h3 className="font-serif text-3xl font-bold capitalize text-gray-800">
                  {event.title || `Acara ${index + 1}`}
                </h3>
                {scheduleLabel && (
                  <p className="mt-3 font-medium text-gray-700">{scheduleLabel}</p>
                )}
                <div className="mt-5 flex items-start gap-3">
                  <MapPin className="mt-1 size-5 shrink-0 text-rose-500" aria-hidden />
                  <div>
                    {event.location && (
                      <p className="font-semibold text-gray-800">{event.location}</p>
                    )}
                    {event.address && (
                      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-gray-600">
                        {event.address}
                      </p>
                    )}
                  </div>
                </div>
                {directionsUrl && (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                  >
                    Buka Navigasi <ExternalLink className="size-4" aria-hidden />
                  </a>
                )}
              </div>
              {embedUrl && (
                <iframe
                  src={embedUrl}
                  title={`Peta ${event.location || event.title || `acara ${index + 1}`}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-72 w-full border-0"
                  allowFullScreen
                />
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
