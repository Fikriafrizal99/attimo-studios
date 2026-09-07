import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, getWeddingRole } from "@/lib/commerce/access";
import { isUuid } from "@/lib/commerce/validation";
import { withTenantDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid wedding id" }, { status: 400 });

    const summary = await withTenantDb(user.id, async (db) => {
      const role = await getWeddingRole(db, id, user.id);
      if (role !== "owner") return null;

      const result = await db.query<{
        invitation_count: number;
        rsvp_responses: number;
        attending: number;
        not_attending: number;
        maybe: number;
        expected_guest_count: number;
        pending_response: number;
      }>(
        `WITH active_guests AS (
           SELECT id
             FROM public.guests
            WHERE wedding_id = $1
              AND is_active = TRUE
         ),
         scoped_rsvp AS (
           SELECT id, guest_id, attendance, guest_count
             FROM public.rsvp
            WHERE wedding_id = $1
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
      return result.rows[0];
    });

    if (!summary) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ data: summary });
  } catch (error) {
    console.error("GET /api/weddings/[id]/rsvp/summary failed", error);
    return NextResponse.json({ error: "Failed to load RSVP analytics" }, { status: 500 });
  }
}
