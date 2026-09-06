export function ValueSection() {
  return (
    <section
      className="mx-auto max-w-[1400px] px-6 py-20 md:px-12 md:py-28"
      aria-labelledby="value-heading"
    >
      <div className="max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#BFA14A]">One platform, three visual classes</p>
        <h2
          id="value-heading"
          className="mb-6 mt-3 font-serif text-3xl tracking-tight text-foreground md:text-4xl"
        >
          Every wedding gets the complete feature set.
        </h2>
        <p className="text-lg leading-relaxed text-muted-foreground">
          Couple profiles, events, gallery, countdown, maps, gifts, guest links, RSVP, wishes, and publishing stay available across every experience. What changes is the visual language: elegant 2D, layered 2.5D, or immersive 3D.
        </p>
      </div>
    </section>
  );
}
