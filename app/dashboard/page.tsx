import Link from "next/link";
import { redirect } from "next/navigation";
import { withTenantDb } from "@/lib/db";
import { getSessionUser } from "@/lib/commerce/access";
import { buildInvitationUrl } from "@/lib/commerce/url";
import { CreateWeddingButton } from "./CreateWeddingButton";

type WeddingListRow = {
  id: string;
  slug: string | null;
  status: "draft" | "released";
  template_id: string;
  content: unknown;
  updated_at: string | null;
  created_at: string | null;
  role: "owner" | "collaborator";
};

function weddingTitle(content: unknown) {
  const value = content as
    | {
        couple?: {
          bride?: { name?: string };
          groom?: { name?: string };
        };
      }
    | null;

  const bride = value?.couple?.bride?.name?.trim();
  const groom = value?.couple?.groom?.name?.trim();

  if (bride && groom) return `${bride} & ${groom}`;
  return bride || groom || "Untitled wedding";
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const weddings = await withTenantDb(user.id, async (db) => {
    const result = await db.query<WeddingListRow>(
      `SELECT
         w.id,
         w.slug,
         w.status,
         w.template_id,
         w.content,
         w.updated_at,
         w.created_at,
         wc.role
       FROM public.weddings AS w
       JOIN public.wedding_collaborators AS wc
         ON wc.wedding_id = w.id
        AND wc.user_id = $1
       ORDER BY COALESCE(w.updated_at, w.created_at) DESC, w.created_at DESC`,
      [user.id]
    );
    return result.rows;
  });

  const draftCount = weddings.filter((item) => item.status === "draft").length;
  const releasedCount = weddings.filter((item) => item.status === "released").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#BFA14A]">
            ENDRIYA Studio
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-50">
            Wedding Projects
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            One complete wedding platform · 2D, 2.5D, and 3D visual experiences
          </p>
        </div>
        <CreateWeddingButton className="bg-neutral-100 text-neutral-950 hover:bg-neutral-200" />
      </div>

      {weddings.length === 0 ? (
        <section className="rounded-md border border-white/10 bg-[#141416] p-8 sm:p-10">
          <div className="max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#BFA14A]">
              Start here
            </p>
            <h2 className="mt-2 text-lg font-semibold text-neutral-50">
              Create your first wedding project
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-400">
              Every ENDRIYA project starts as a private draft. You can fill the wedding
              content, preview it, and publish only when it is ready.
            </p>
            <div className="mt-5">
              <CreateWeddingButton
                label="Create Wedding Project"
                className="bg-neutral-100 text-neutral-950 hover:bg-neutral-200"
              />
            </div>
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-md border border-white/10 bg-[#141416]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-neutral-200">
              <thead className="border-b border-white/10 bg-black/20 text-[11px] uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-3 text-left">Project</th>
                  <th className="px-4 py-3 text-left">Access</th>
                  <th className="px-4 py-3 text-left">Template</th>
                  <th className="px-4 py-3 text-left">Slug</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {weddings.map((wedding) => (
                  <tr
                    key={wedding.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.025]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/weddings/${wedding.id}`}
                        className="font-medium text-neutral-50 hover:underline"
                      >
                        {weddingTitle(wedding.content)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          wedding.role === "owner"
                            ? "inline-flex rounded-full border border-[#BFA14A]/40 bg-[#BFA14A]/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#BFA14A]"
                            : "inline-flex rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-400"
                        }
                      >
                        {wedding.role === "owner" ? "Owner" : "Collaborator"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-neutral-400">
                      {wedding.template_id}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-neutral-400">
                      {wedding.slug ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          wedding.status === "released" ? "text-[#BFA14A]" : "text-neutral-400"
                        }
                      >
                        {wedding.status === "released" ? "Released" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {wedding.updated_at || wedding.created_at
                        ? new Date(wedding.updated_at ?? wedding.created_at ?? "").toLocaleString(
                            "id-ID"
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/dashboard/weddings/${wedding.id}`}
                          className="hover:underline"
                        >
                          Edit
                        </Link>
                        <Link href={`/preview/${wedding.id}`} className="hover:underline">
                          Preview
                        </Link>
                        {wedding.status === "released" && wedding.slug && (
                          <a
                            href={buildInvitationUrl({ slug: wedding.slug })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-neutral-50 hover:underline"
                          >
                            Live
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Projects", weddings.length],
          ["Drafts", draftCount],
          ["Released", releasedCount],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-md border border-white/10 bg-[#141416] px-4 py-3"
          >
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</p>
            <p className="mt-1 text-xl font-semibold text-neutral-50">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
