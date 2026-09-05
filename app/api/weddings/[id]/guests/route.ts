import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getSessionUser, hasWeddingAccess } from "@/lib/commerce/access";
import { buildInvitationUrl } from "@/lib/commerce/url";
import { cleanText, isUuid, parseGuestCount } from "@/lib/commerce/validation";

async function getContext(weddingId: string) {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const supabase = createServerClient();
  if (!(await hasWeddingAccess(supabase, weddingId, user.id))) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, slug")
    .eq("id", weddingId)
    .maybeSingle();
  if (!wedding) return { error: NextResponse.json({ error: "Wedding not found" }, { status: 404 }) };
  return { supabase, wedding };
}

function publicUrl(slug: string | null, token: string) {
  return slug ? buildInvitationUrl({ slug, guestToken: token }) : null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const result = await getContext(id);
  if ("error" in result) return result.error;
  const { supabase, wedding } = result;

  const { data, error } = await supabase
    .from("guests")
    .select("id, display_name, phone, group_name, max_guests, token, is_active, created_at, updated_at")
    .eq("wedding_id", id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Failed to load guests" }, { status: 500 });

  return NextResponse.json({
    data: (data ?? []).map((guest) => ({
      id: guest.id,
      displayName: guest.display_name,
      phone: guest.phone,
      groupName: guest.group_name,
      maxGuests: guest.max_guests,
      token: guest.token,
      isActive: guest.is_active,
      url: publicUrl(wedding.slug, guest.token),
      createdAt: guest.created_at,
      updatedAt: guest.updated_at,
    })),
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const result = await getContext(id);
  if ("error" in result) return result.error;
  const { supabase, wedding } = result;

  const body = await request.json().catch(() => null);
  const displayName = cleanText(body?.displayName, 120, true);
  const phone = cleanText(body?.phone, 40, false) || null;
  const groupName = cleanText(body?.groupName, 80, false) || null;
  const maxGuests = parseGuestCount(body?.maxGuests ?? 1, 20);
  if (!displayName || !maxGuests || maxGuests < 1) {
    return NextResponse.json({ error: "Display name and valid guest quota are required" }, { status: 400 });
  }

  const token = randomBytes(18).toString("base64url");
  const { data, error } = await supabase
    .from("guests")
    .insert({
      wedding_id: id,
      display_name: displayName,
      phone,
      group_name: groupName,
      max_guests: maxGuests,
      token,
      is_active: true,
    })
    .select("id, display_name, phone, group_name, max_guests, token, is_active")
    .single();
  if (error) return NextResponse.json({ error: "Failed to create guest" }, { status: 500 });

  return NextResponse.json(
    {
      data: {
        id: data.id,
        displayName: data.display_name,
        phone: data.phone,
        groupName: data.group_name,
        maxGuests: data.max_guests,
        token: data.token,
        isActive: data.is_active,
        url: publicUrl(wedding.slug, data.token),
      },
    },
    { status: 201 }
  );
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const result = await getContext(id);
  if ("error" in result) return result.error;
  const { supabase, wedding } = result;
  const body = await request.json().catch(() => null);
  if (!isUuid(body?.guestId)) return NextResponse.json({ error: "Valid guestId is required" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.displayName !== undefined) {
    const value = cleanText(body.displayName, 120, true);
    if (!value) return NextResponse.json({ error: "Display name is required" }, { status: 400 });
    updates.display_name = value;
  }
  if (body.phone !== undefined) updates.phone = cleanText(body.phone, 40, false) || null;
  if (body.groupName !== undefined) updates.group_name = cleanText(body.groupName, 80, false) || null;
  if (body.maxGuests !== undefined) {
    const maxGuests = parseGuestCount(body.maxGuests, 20);
    if (!maxGuests || maxGuests < 1) return NextResponse.json({ error: "Invalid guest quota" }, { status: 400 });
    updates.max_guests = maxGuests;
  }
  if (body.isActive !== undefined) updates.is_active = Boolean(body.isActive);

  const { data, error } = await supabase
    .from("guests")
    .update(updates)
    .eq("id", body.guestId)
    .eq("wedding_id", id)
    .select("id, display_name, phone, group_name, max_guests, token, is_active")
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Guest not found" }, { status: 404 });

  return NextResponse.json({
    data: {
      id: data.id,
      displayName: data.display_name,
      phone: data.phone,
      groupName: data.group_name,
      maxGuests: data.max_guests,
      token: data.token,
      isActive: data.is_active,
      url: publicUrl(wedding.slug, data.token),
    },
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const result = await getContext(id);
  if ("error" in result) return result.error;
  const { supabase } = result;
  const body = await request.json().catch(() => null);
  if (!isUuid(body?.guestId)) return NextResponse.json({ error: "Valid guestId is required" }, { status: 400 });

  const { error } = await supabase
    .from("guests")
    .delete()
    .eq("id", body.guestId)
    .eq("wedding_id", id);
  if (error) return NextResponse.json({ error: "Failed to delete guest" }, { status: 500 });
  return NextResponse.json({ success: true });
}
