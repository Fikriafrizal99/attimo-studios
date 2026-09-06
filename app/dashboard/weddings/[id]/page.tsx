import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { getSessionUser, getWeddingRole } from "@/lib/commerce/access";

export default async function WeddingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const supabase = createServerClient();
  const role = await getWeddingRole(supabase, id, user.id);
  if (!role) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-neutral-50">Overview</h1>
      <p className="text-sm text-neutral-400">
        {role === "owner"
          ? "Edit and manage your wedding invitation from the sections below."
          : "As a collaborator, you can edit invitation content and section layout."}
      </p>
      <ul className="list-inside list-disc space-y-2 text-sm text-neutral-300">
        <li>
          <Link
            href={`/dashboard/weddings/${id}/content`}
            className="rounded underline underline-offset-2 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141416]"
          >
            Content
          </Link>{" "}
          — Couple, events, gallery, music
        </li>
        <li>
          <Link
            href={`/dashboard/weddings/${id}/layout-sections`}
            className="rounded underline underline-offset-2 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141416]"
          >
            Layout
          </Link>{" "}
          — Toggle and reorder sections
        </li>
        {role === "owner" && (
          <>
            <li>
              <Link
                href={`/dashboard/weddings/${id}/guests`}
                className="rounded underline underline-offset-2 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141416]"
              >
                Guests
              </Link>{" "}
              — Manage personal guest links and quotas
            </li>
            <li>
              <Link
                href={`/dashboard/weddings/${id}/settings`}
                className="rounded underline underline-offset-2 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFA14A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141416]"
              >
                Settings
              </Link>{" "}
              — Template, public slug, release, and deletion
            </li>
          </>
        )}
      </ul>
    </div>
  );
}
