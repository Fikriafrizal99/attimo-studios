import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { withTenantDb, type TenantDbClient } from "@/lib/db";
import { getSessionUser, getWeddingRole } from "@/lib/commerce/access";
import { buildInvitationUrl } from "@/lib/commerce/url";
import { cleanText, isUuid, parseGuestCount } from "@/lib/commerce/validation";

type GuestRow = {
  id: string;
  display_name: string;
  phone: string | null;
  group_name: string | null;
  max_guests: number;
  token: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

async function loadOwnerWedding(db: TenantDbClient, weddingId: string, userId: string) {
  const role = await getWeddingRole(db, weddingId, userId);
  if (!role) return { status: 403, error: "Forbidden" } as const;
  if (role !== "owner") return { status: 403, error: "Only the owner can manage guests" } as const;

  const result = await db.query<{ id: string; slug: string | null }>(
    `SELECT id, slug FROM public.weddings WHERE id = $1 LIMIT 1`,
    [weddingId]
  );
  const wedding = result.rows[0];
  if (!wedding) return { status: 404, error: "Wedding not found" } as const;
  return { status: 200, wedding } as const;
}

function publicUrl(slug: string | null, token: string) {
  return slug ? buildInvitationUrl({ slug, guestToken: token }) : null;
}

function serializeGuest(guest: GuestRow, slug: string | null) {
  return {
    id: guest.id,
    displayName: guest.display_name,
    phone: guest.phone,
    groupName: guest.group_name,
    maxGuests: guest.max_guests,
    token: guest.token,
    isActive: guest.is_active,
    url: publicUrl(slug, guest.token),
    ...(guest.created_at !== undefined ? { createdAt: guest.created_at } : {}),
    ...(guest.updated_at !== undefined ? { updatedAt: guest.updated_at } : {}),
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;

    return await withTenantDb(user.id, async (db) => {
      const owner = await loadOwnerWedding(db, id, user.id);
      if (owner.status !== 200) return NextResponse.json({ error: owner.error }, { status: owner.status });

      const result = await db.query<GuestRow>(
        `SELECT id, display_name, phone, group_name, max_guests, token,
                is_active, created_at, updated_at
           FROM public.guests
          WHERE wedding_id = $1
          ORDER BY created_at DESC`,
        [id]
      );
      return NextResponse.json({
        data: result.rows.map((guest) => serializeGuest(guest, owner.wedding.slug)),
      });
    });
  } catch (error) {
    console.error("GET wedding guests failed", error);
    return NextResponse.json({ error: "Failed to load guests" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const displayName = cleanText(body?.displayName, 120, true);
    const phone = cleanText(body?.phone, 40, false) || null;
    const groupName = cleanText(body?.groupName, 80, false) || null;
    const maxGuests = parseGuestCount(body?.maxGuests ?? 1, 20);
    if (!displayName || !maxGuests || maxGuests < 1) {
      return NextResponse.json({ error: "Display name and valid guest quota are required" }, { status: 400 });
    }

    return await withTenantDb(user.id, async (db) => {
      const owner = await loadOwnerWedding(db, id, user.id);
      if (owner.status !== 200) return NextResponse.json({ error: owner.error }, { status: owner.status });

      const token = randomBytes(18).toString("base64url");
      const result = await db.query<GuestRow>(
        `INSERT INTO public.guests (
           wedding_id, display_name, phone, group_name, max_guests, token, is_active
         ) VALUES ($1, $2, $3, $4, $5, $6, TRUE)
         RETURNING id, display_name, phone, group_name, max_guests, token, is_active`,
        [id, displayName, phone, groupName, maxGuests, token]
      );
      return NextResponse.json(
        { data: serializeGuest(result.rows[0], owner.wedding.slug) },
        { status: 201 }
      );
    });
  } catch (error) {
    console.error("POST wedding guest failed", error);
    return NextResponse.json({ error: "Failed to create guest" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    if (!isUuid(body?.guestId)) {
      return NextResponse.json({ error: "Valid guestId is required" }, { status: 400 });
    }

    const updates: Array<[string, unknown]> = [["updated_at", new Date().toISOString()]];
    if (body.displayName !== undefined) {
      const value = cleanText(body.displayName, 120, true);
      if (!value) return NextResponse.json({ error: "Display name is required" }, { status: 400 });
      updates.push(["display_name", value]);
    }
    if (body.phone !== undefined) updates.push(["phone", cleanText(body.phone, 40, false) || null]);
    if (body.groupName !== undefined) updates.push(["group_name", cleanText(body.groupName, 80, false) || null]);
    if (body.maxGuests !== undefined) {
      const maxGuests = parseGuestCount(body.maxGuests, 20);
      if (!maxGuests || maxGuests < 1) return NextResponse.json({ error: "Invalid guest quota" }, { status: 400 });
      updates.push(["max_guests", maxGuests]);
    }
    if (body.isActive !== undefined) updates.push(["is_active", Boolean(body.isActive)]);

    return await withTenantDb(user.id, async (db) => {
      const owner = await loadOwnerWedding(db, id, user.id);
      if (owner.status !== 200) return NextResponse.json({ error: owner.error }, { status: owner.status });

      const values = updates.map(([, value]) => value);
      const setClause = updates.map(([column], index) => `${column} = $${index + 1}`).join(", ");
      values.push(body.guestId, id);
      const result = await db.query<GuestRow>(
        `UPDATE public.guests
            SET ${setClause}
          WHERE id = $${values.length - 1}
            AND wedding_id = $${values.length}
          RETURNING id, display_name, phone, group_name, max_guests, token, is_active`,
        values
      );
      const guest = result.rows[0];
      if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });
      return NextResponse.json({ data: serializeGuest(guest, owner.wedding.slug) });
    });
  } catch (error) {
    console.error("PATCH wedding guest failed", error);
    return NextResponse.json({ error: "Failed to update guest" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    if (!isUuid(body?.guestId)) {
      return NextResponse.json({ error: "Valid guestId is required" }, { status: 400 });
    }

    return await withTenantDb(user.id, async (db) => {
      const owner = await loadOwnerWedding(db, id, user.id);
      if (owner.status !== 200) return NextResponse.json({ error: owner.error }, { status: owner.status });

      const result = await db.query(
        `DELETE FROM public.guests WHERE id = $1 AND wedding_id = $2`,
        [body.guestId, id]
      );
      if ((result.rowCount ?? 0) === 0) {
        return NextResponse.json({ error: "Guest not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    });
  } catch (error) {
    console.error("DELETE wedding guest failed", error);
    return NextResponse.json({ error: "Failed to delete guest" }, { status: 500 });
  }
}
