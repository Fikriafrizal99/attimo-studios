import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  showTagline?: boolean;
};

export function BrandMark({ className, showTagline = false }: BrandMarkProps) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="Endriya">
      <span
        className="inline-flex size-7 items-center justify-center rounded-full border border-[#BFA14A]/40 bg-[#BFA14A]/10 font-serif text-sm font-semibold text-[#D8C27A]"
        aria-hidden
      >
        E
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-serif text-lg font-semibold tracking-[0.18em] text-neutral-50",
            className
          )}
        >
          ENDRIYA
        </span>
        {showTagline && (
          <span className="mt-1 text-[9px] uppercase tracking-[0.16em] text-neutral-500">
            Digital Wedding Experience
          </span>
        )}
      </span>
    </span>
  );
}
