import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { withTenantDb } from "@/lib/db";
import { getSessionUser, getWeddingRole } from "@/lib/commerce/access";
import { WeddingTabs } from "./WeddingTabs";

const BASE_DOMAIN =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "localhost:3000";

export default async function WeddingEditLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const context = await withTenantDb(user.id, async (db) => {
    const role = await getWeddingRole(db, id, user.id);
    if (!role) return null;

    const result = await db.query<{
      id: string;
      slug: string | null;
      status: string;
      content: unknown;
    }>(
      `SELECT id, slug, status, content
         FROM public.weddings
        WHERE id = $1
        LIMIT 1`,
      [id]
    );
    const wedding = result.rows[0];
    return wedding ? { wedding, role } : null;
  });

  if (!context) notFound();
  const { wedding, role } = context;

  const c = wedding.content as { couple?: { bride?: { name?: string }; groom?: { name?: string } } } | undefined;
  const bride = c?.couple?.bride?.name;
  const groom = c?.couple?.groom?.name;
  const title =
    bride && groom ? `${bride} & ${groom}` : bride ?? groom ?? wedding.slug ?? "Untitled";

  const siteUrl =
    wedding.slug && wedding.status === "released"
      ? `https://${wedding.slug}.${BASE_DOMAIN}`
      : null;

  return (
    <div className="space-y-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-neutral-50 sm:text-2xl" title={title}>
            {title}
          </h1>
          {role === "collaborator" && (
            <p className="mt-1 text-xs text-neutral-500">Collaborator access · content and layout editing only</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              wedding.status === "released"
                ? "inline-flex items-center gap-1.5 rounded-full border border-[#BFA14A] px-2 py-0.5 text-[11px] font-medium text-[#BFA14A]"
                : "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-neutral-400"
            }
          >
            {wedding.status === "released" && <span className="size-1.5 rounded-full bg-[#BFA14A]" aria-hidden />}
            {wedding.status === "released" ? "Released" : "Draft"}
          </span>
          <Link
            href={`/preview/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center rounded-md border border-white/10 bg-transparent px-3 text-xs text-neutral-200 hover:bg-white/5 hover:text-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0E10]"
          >
            Preview
          </Link>
          {role === "owner" && (
            <Link
              href={`/dashboard/weddings/${id}/settings`}
              className="inline-flex h-8 items-center rounded-md border border-white/10 bg-transparent px-3 text-xs text-neutral-200 hover:bg-white/5 hover:text-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0E10]"
            >
              Settings
            </Link>
          )}
          {siteUrl ? (
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center rounded-md bg-neutral-100 px-3 text-xs font-medium text-[#0E0E10] hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0E10]"
            >
              Visit
            </a>
          ) : null}
        </div>
      </div>

      <WeddingTabs weddingId={id} role={role} />

      <div className="rounded-md border border-white/6 bg-[#141416]">
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
