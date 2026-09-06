import { cn } from "@/lib/utils";

export function DashboardMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-white/[0.06]",
        "bg-white/[0.03] backdrop-blur-[16px]",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
        className
      )}
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex flex-1 justify-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
            ENDRIYA · Wedding Studio
          </span>
        </div>
      </div>
      <div className="flex min-h-[200px] md:min-h-[260px]">
        <aside className="flex w-14 flex-col gap-2 border-r border-white/[0.06] p-2 md:w-16">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-8 rounded-md bg-muted/40"
              style={{ width: i === 1 ? "100%" : "60%" }}
            />
          ))}
        </aside>
        <main className="flex-1 space-y-4 p-4 md:p-6">
          <div className="h-6 w-32 rounded bg-muted/50" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 rounded-lg border border-white/[0.06] bg-white/[0.02] md:h-24"
              />
            ))}
          </div>
          <div className="h-px bg-white/[0.06]" />
          <div className="space-y-2">
            <div className="h-3 w-full max-w-[80%] rounded bg-muted/40" />
            <div className="h-3 w-full max-w-[60%] rounded bg-muted/30" />
          </div>
        </main>
      </div>
    </div>
  );
}
