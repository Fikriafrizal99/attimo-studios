"use client";

import { InvitationProvider } from "@/components/InvitationContext";
import RSVPSection from "@/components/RSVPSection";
import WishesSection from "@/components/WishesSection";
import GiftSection from "@/components/GiftSection";
import MusicPlayer from "@/components/MusicPlayer";
import type { TemplateRenderProps } from "@/templates/types";

export function Minimal001Template({
  weddingId,
  publicSlug,
  content,
  sections,
  guest,
}: TemplateRenderProps) {
  const enabled = new Set(sections.filter((item) => item.enabled).map((item) => item.id));
  const bride = content.couple?.bride;
  const groom = content.couple?.groom;
  const heroImage = content.hero?.coverImage;

  return (
    <InvitationProvider value={{ weddingId, publicSlug, content, sections, guest }}>
      <main className="min-h-screen bg-[#f8f7f3] text-[#1f1f1d]">
        {enabled.has("hero") && (
          <section className="relative flex min-h-[92vh] items-end overflow-hidden px-6 pb-16 pt-24 md:px-12">
            {heroImage ? (
              <img
                src={heroImage}
                alt="Wedding cover"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-stone-200 via-neutral-50 to-amber-50" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            <div className="relative z-10 max-w-4xl text-white">
              {guest?.displayName && (
                <p className="mb-6 text-sm uppercase tracking-[0.24em] text-white/80">
                  Kepada Yth. {guest.displayName}
                </p>
              )}
              <p className="mb-3 text-sm uppercase tracking-[0.32em] text-white/75">
                {content.hero?.greeting || "The Wedding of"}
              </p>
              <h1 className="font-serif text-5xl leading-none md:text-8xl">
                {bride?.shortName || bride?.name || "Bride"}
                <span className="mx-3 font-light italic">&</span>
                {groom?.shortName || groom?.name || "Groom"}
              </h1>
              {content.hero?.subtitle && (
                <p className="mt-6 max-w-xl text-base text-white/80 md:text-lg">
                  {content.hero.subtitle}
                </p>
              )}
            </div>
          </section>
        )}

        {enabled.has("couple") && (
          <section className="mx-auto grid max-w-5xl gap-12 px-6 py-24 md:grid-cols-2 md:px-10">
            {[bride, groom].map((person, index) => (
              <article key={index} className="border-t border-black/20 pt-6">
                {person?.image && (
                  <img
                    src={person.image}
                    alt={person.name}
                    className="mb-7 aspect-[4/5] w-full object-cover grayscale-[15%]"
                  />
                )}
                <p className="text-xs uppercase tracking-[0.24em] text-black/45">
                  {index === 0 ? "Bride" : "Groom"}
                </p>
                <h2 className="mt-2 font-serif text-4xl">{person?.name}</h2>
                {person?.parentInfo && (
                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-black/60">
                    {person.parentInfo}
                  </p>
                )}
              </article>
            ))}
          </section>
        )}

        {enabled.has("location") && (content.events?.length ?? 0) > 0 && (
          <section className="border-y border-black/10 bg-white px-6 py-24">
            <div className="mx-auto max-w-5xl">
              <p className="text-xs uppercase tracking-[0.26em] text-black/45">Events</p>
              <div className="mt-10 grid gap-8 md:grid-cols-2">
                {content.events?.map((event) => (
                  <article key={event.id ?? `${event.title}-${event.date}`} className="border-l border-black/20 pl-6">
                    <h3 className="font-serif text-3xl">{event.title}</h3>
                    <p className="mt-4 text-sm uppercase tracking-[0.12em] text-black/55">
                      {event.date} · {event.time}
                    </p>
                    <p className="mt-5 font-medium">{event.location}</p>
                    <p className="mt-2 text-sm leading-6 text-black/55">{event.address}</p>
                    {event.mapsUrl && (
                      <a
                        href={event.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 inline-block border-b border-black pb-1 text-sm"
                      >
                        Buka Maps
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {enabled.has("story") && (content.story?.length ?? 0) > 0 && (
          <section className="mx-auto max-w-4xl px-6 py-24">
            <h2 className="font-serif text-4xl">Our Story</h2>
            <div className="mt-12 space-y-10">
              {content.story?.map((item) => (
                <article key={item.id} className="grid gap-4 border-t border-black/15 pt-6 md:grid-cols-[150px_1fr]">
                  <p className="text-sm text-black/45">{item.date}</p>
                  <div>
                    <h3 className="font-serif text-2xl">{item.title}</h3>
                    <p className="mt-3 leading-7 text-black/60">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {enabled.has("gallery") && (content.gallery?.length ?? 0) > 0 && (
          <section className="bg-[#1d1d1b] px-4 py-16 text-white">
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 md:grid-cols-3">
              {content.gallery?.map((image) => (
                <img
                  key={image.id}
                  src={image.url}
                  alt={image.alt}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover"
                />
              ))}
            </div>
          </section>
        )}

        {enabled.has("rsvp") && <RSVPSection />}
        {enabled.has("wishes") && <WishesSection />}
        {enabled.has("gift") && <GiftSection />}
        {enabled.has("music") && <MusicPlayer />}
      </main>
    </InvitationProvider>
  );
}
