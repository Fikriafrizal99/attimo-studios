"use client";

import { useInvitation } from "@/components/InvitationContext";

export default function StorySection() {
  const invitation = useInvitation();
  const story = invitation?.content.story ?? [];
  if (story.length === 0) return null;

  return (
    <section id="story" className="bg-rose-50/30 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-rose-500">Our Journey</p>
          <h2 className="mt-2 font-serif text-4xl font-bold text-gray-800 md:text-5xl">Love Story</h2>
        </div>
        <div className="relative space-y-8 before:absolute before:bottom-0 before:left-4 before:top-0 before:w-px before:bg-rose-200 md:before:left-1/2">
          {story.map((item, index) => (
            <article
              key={item.id}
              className={`relative grid gap-4 pl-12 md:grid-cols-2 md:pl-0 ${index % 2 ? "md:text-left" : "md:text-right"}`}
            >
              <span className="absolute left-[11px] top-2 size-3 rounded-full border-2 border-rose-500 bg-white md:left-1/2 md:-translate-x-1/2" />
              <div className={index % 2 ? "md:col-start-2 md:pl-10" : "md:pr-10"}>
                {item.date && <p className="text-sm font-medium text-rose-500">{item.date}</p>}
                <h3 className="mt-1 font-serif text-2xl font-semibold text-gray-800">{item.title}</h3>
                <p className="mt-3 whitespace-pre-line leading-7 text-gray-600">{item.description}</p>
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="mt-5 aspect-video w-full rounded-xl object-cover"
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
