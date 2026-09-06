import { DashboardMockup } from "./DashboardMockup";
import { cn } from "@/lib/utils";

export function ProductProofSection() {
  return (
    <section
      className="mx-auto max-w-[1400px] px-6 py-20 md:px-12 md:py-28"
      aria-labelledby="product-heading"
    >
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="order-2 lg:order-1 lg:col-span-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#BFA14A]">ENDRIYA Wedding Studio</p>
          <h2
            id="product-heading"
            className="mb-6 mt-3 font-serif text-3xl tracking-tight text-foreground md:text-4xl"
          >
            One editor. Any visual experience.
          </h2>
          <p className="mb-4 text-lg leading-relaxed text-muted-foreground">
            Manage wedding content once, preview it live, and render the same data through 2D, 2.5D, or 3D templates without rebuilding the wedding from scratch.
          </p>
          <p className={cn("text-xs uppercase tracking-[0.2em] text-muted-foreground/80")}>
            Content engine · template renderer · public invitation
          </p>
        </div>
        <div className="order-1 lg:order-2 lg:col-span-7">
          <DashboardMockup className="ml-0 w-full max-w-[480px] lg:ml-auto" />
        </div>
      </div>
    </section>
  );
}
