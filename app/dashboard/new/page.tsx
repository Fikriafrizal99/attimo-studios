import Link from "next/link";
import { CreateWeddingButton } from "../CreateWeddingButton";

export default function NewWeddingPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <section className="rounded-md border border-white/10 bg-[#141416] p-6 sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#BFA14A]">
          New project
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-neutral-50">
          Create a wedding project
        </h1>
        <p className="mt-2 text-sm leading-6 text-neutral-400">
          ENDRIYA will create a private draft with the default wedding structure. Nothing is
          published until you release it from project settings.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <CreateWeddingButton
            label="Create Wedding Project"
            className="bg-neutral-100 text-neutral-950 hover:bg-neutral-200"
          />
          <Link
            href="/dashboard"
            className="inline-flex h-8 items-center rounded-md border border-white/10 px-3 text-xs text-neutral-300 hover:bg-white/5 hover:text-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141416]"
          >
            Cancel
          </Link>
        </div>
      </section>
    </div>
  );
}
