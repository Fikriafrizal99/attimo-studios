import { notFound, redirect } from "next/navigation";
import { getSessionUser, getWeddingRole } from "@/lib/commerce/access";
import { withTenantDb } from "@/lib/db";

export const metadata = { title: "RSVP Analytics | ENDRIYA" };

type Summary = {
  invitation_count: number;
  rsvp_responses: number;
  attending: number;
  not_attending: number;
  maybe: number;
  expected_guest_count: number;
  pending_response: number;
};

type ResponseRow = {
  id: string;
  name: string;
  attendance: "yes" | "no" | "maybe";
  guest_count: number;
  message: string | null;
  submitted_at: string;
  updated_at: string | null;
  guest_name: string | null;
  group_name: string | null;
};

export default async function RsvpAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const result = await withTenantDb(user.id, async (db) => {
    const role = await getWeddingRole(db, id, user.id);
    if (!role) return { kind: "missing" } as const;
    if (role !== "owner") return { kind: "forbidden" } as const;

    const summaryResult = await db.query<Summary>(
      `WITH active_guests AS (
         SELECT id FROM public.guests WHERE wedding_id = $1 AND is_active = TRUE
       ),
       scoped_rsvp AS (
         SELECT id, guest_id, attendance, guest_count FROM public.rsvp WHERE wedding_id = $1
       ),
       responded_active_guests AS (
         SELECT DISTINCT r.guest_id
           FROM scoped_rsvp r
           JOIN active_guests g ON g.id = r.guest_id
          WHERE r.guest_id IS NOT NULL
       )
       SELECT
         (SELECT COUNT(*)::int FROM active_guests) AS invitation_count,
         (SELECT COUNT(*)::int FROM scoped_rsvp) AS rsvp_responses,
         (SELECT COUNT(*)::int FROM scoped_rsvp WHERE attendance = 'yes') AS attending,
         (SELECT COUNT(*)::int FROM scoped_rsvp WHERE attendance = 'no') AS not_attending,
         (SELECT COUNT(*)::int FROM scoped_rsvp WHERE attendance = 'maybe') AS maybe,
         (SELECT COALESCE(SUM(guest_count), 0)::int FROM scoped_rsvp WHERE attendance = 'yes') AS expected_guest_count,
         GREATEST(
           (SELECT COUNT(*)::int FROM active_guests) -
           (SELECT COUNT(*)::int FROM responded_active_guests),
           0
         ) AS pending_response`,
      [id]
    );

    const responses = await db.query<ResponseRow>(
      `SELECT
         r.id,
         r.name,
         r.attendance,
         r.guest_count,
         r.message,
         r.submitted_at,
         r.updated_at,
         g.display_name AS guest_name,
         g.group_name
       FROM public.rsvp r
       LEFT JOIN public.guests g
         ON g.id = r.guest_id
        AND g.wedding_id = r.wedding_id
      WHERE r.wedding_id = $1
      ORDER BY COALESCE(r.updated_at, r.submitted_at) DESC
      LIMIT 300`,
      [id]
    );

    return { kind: "ok", summary: summaryResult.rows[0], responses: responses.rows } as const;
  });

  if (result.kind === "missing") notFound();
  if (result.kind === "forbidden") redirect(`/dashboard/weddings/${id}`);

  const summary = result.summary;
  const responseRate = summary.invitation_count > 0
    ? Math.round(((summary.invitation_count - summary.pending_response) / summary.invitation_count) * 100)
    : 0;

  const cards = [
    ["Invitations", summary.invitation_count],
    ["Responses", summary.rsvp_responses],
    ["Attending", summary.attending],
    ["Not attending", summary.not_attending],
    ["Maybe", summary.maybe],
    ["Expected guests", summary.expected_guest_count],
    ["Pending", summary.pending_response],
    ["Response rate", `${responseRate}%`],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-50">RSVP Analytics</h2>
        <p className="mt-1 text-xs text-neutral-500">Wedding-scoped response and expected-attendance summary.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={String(label)} className="rounded-md border border-white/10 bg-[#141416] px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</p>
            <p className="mt-1 text-xl font-semibold text-neutral-50">{value}</p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-md border border-white/10 bg-[#141416]">
        <div className="border-b border-white/10 p-4">
          <h3 className="text-sm font-semibold text-neutral-100">Responses</h3>
          <p className="mt-1 text-xs text-neutral-500">Latest RSVP responses for this wedding only.</p>
        </div>
        {result.responses.length === 0 ? (
          <div className="p-8 text-sm text-neutral-500">No RSVP responses yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-neutral-200">
              <thead className="border-b border-white/10 bg-black/20 text-[11px] uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-3 text-left">Guest</th>
                  <th className="px-4 py-3 text-left">Group</th>
                  <th className="px-4 py-3 text-left">Attendance</th>
                  <th className="px-4 py-3 text-left">Count</th>
                  <th className="px-4 py-3 text-left">Message</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {result.responses.map((response) => (
                  <tr key={response.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3"><p className="font-medium text-neutral-50">{response.guest_name ?? response.name}</p>{response.guest_name && response.guest_name !== response.name && <p className="mt-1 text-[11px] text-neutral-500">Submitted as {response.name}</p>}</td>
                    <td className="px-4 py-3 text-neutral-500">{response.group_name ?? "—"}</td>
                    <td className="px-4 py-3"><span className={response.attendance === "yes" ? "text-emerald-300" : response.attendance === "no" ? "text-red-300" : "text-amber-300"}>{response.attendance === "yes" ? "Attending" : response.attendance === "no" ? "Not attending" : "Maybe"}</span></td>
                    <td className="px-4 py-3">{response.guest_count}</td>
                    <td className="max-w-sm px-4 py-3 text-neutral-400">{response.message || "—"}</td>
                    <td className="px-4 py-3 text-neutral-500">{new Date(response.updated_at ?? response.submitted_at).toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
