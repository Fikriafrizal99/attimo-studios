import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  cleanText,
  isAttendance,
  isUuid,
  parseGuestCount,
} from "@/lib/commerce/validation";
import {
  checkRateLimit,
  getClientIp,
  PUBLIC_SUBMISSION_LIMIT,
} from "@/lib/commerce/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !isUuid(body.wedding_id)) {
      return NextResponse.json({ error: "Valid wedding_id is required" }, { status: 400 });
    }

    const weddingId = body.wedding_id as string;
    const rate = checkRateLimit(
      `${getClientIp(request)}:rsvp:${weddingId}`,
      PUBLIC_SUBMISSION_LIMIT
    );
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many RSVP attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    if (!isAttendance(body.attendance)) {
      return NextResponse.json({ error: "Invalid attendance value" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: wedding } = await supabase
      .from("weddings")
      .select("id")
      .eq("id", weddingId)
      .eq("status", "released")
      .maybeSingle();
    if (!wedding) return NextResponse.json({ error: "Wedding not found" }, { status: 404 });

    const guestToken = cleanText(body.guest_token, 128, false) || "";
    let guest: { id: string; display_name: string; max_guests: number } | null = null;
    if (guestToken) {
      const { data } = await supabase
        .from("guests")
        .select("id, display_name, max_guests")
        .eq("wedding_id", weddingId)
        .eq("token", guestToken)
        .eq("is_active", true)
        .maybeSingle();
      if (!data) {
        return NextResponse.json({ error: "Guest link is invalid or inactive" }, { status: 400 });
      }
      guest = data;
    }

    const name = guest?.display_name ?? cleanText(body.name, 120, true);
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const parsedGuestCount = parseGuestCount(body.guestCount, guest?.max_guests ?? 20);
    const guestCount = body.attendance === "yes" ? (parsedGuestCount ?? 0) : 0;
    if (body.attendance === "yes" && guestCount < 1) {
      return NextResponse.json({ error: "Guest count must be at least 1" }, { status: 400 });
    }
    if (guest && guestCount > guest.max_guests) {
      return NextResponse.json({ error: `Maximum guest quota is ${guest.max_guests}` }, { status: 400 });
    }

    const message = cleanText(body.message, 500, false) || null;
    const payload = {
      wedding_id: weddingId,
      guest_id: guest?.id ?? null,
      name,
      attendance: body.attendance,
      guest_count: guestCount,
      message,
      updated_at: new Date().toISOString(),
    };

    let saved: {
      id: string;
      name: string;
      attendance: string;
      guest_count: number;
      message: string | null;
      submitted_at: string;
      updated_at: string;
    } | null = null;

    if (guest) {
      const { data: existing } = await supabase
        .from("rsvp")
        .select("id")
        .eq("wedding_id", weddingId)
        .eq("guest_id", guest.id)
        .maybeSingle();
      if (existing) {
        const { data, error } = await supabase
          .from("rsvp")
          .update(payload)
          .eq("id", existing.id)
          .select("id, name, attendance, guest_count, message, submitted_at, updated_at")
          .single();
        if (error) throw error;
        saved = data;
      }
    }

    if (!saved) {
      const { data, error } = await supabase
        .from("rsvp")
        .insert(payload)
        .select("id, name, attendance, guest_count, message, submitted_at, updated_at")
        .single();
      if (error) throw error;
      saved = data;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: saved.id,
          name: saved.name,
          attendance: saved.attendance,
          guestCount: saved.guest_count,
          message: saved.message,
          submittedAt: saved.submitted_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/rsvp failed", error);
    return NextResponse.json({ error: "Failed to submit RSVP" }, { status: 500 });
  }
}

/** Public GET only returns aggregate statistics for one explicitly scoped wedding. */
export async function GET(request: NextRequest) {
  try {
    const weddingId = request.nextUrl.searchParams.get("wedding_id");
    if (!isUuid(weddingId)) {
      return NextResponse.json({ error: "Valid wedding_id is required" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: wedding } = await supabase
      .from("weddings")
      .select("id")
      .eq("id", weddingId)
      .eq("status", "released")
      .maybeSingle();
    if (!wedding) return NextResponse.json({ error: "Wedding not found" }, { status: 404 });

    const { data, error } = await supabase
      .from("rsvp")
      .select("attendance, guest_count")
      .eq("wedding_id", weddingId);
    if (error) throw error;

    const rows = data ?? [];
    const attending = rows.filter((row) => row.attendance === "yes").length;
    const notAttending = rows.filter((row) => row.attendance === "no").length;
    const maybe = rows.filter((row) => row.attendance === "maybe").length;
    const totalGuests = rows
      .filter((row) => row.attendance === "yes")
      .reduce((sum, row) => sum + (row.guest_count || 0), 0);

    return NextResponse.json({
      success: true,
      statistics: {
        totalResponses: rows.length,
        attending,
        notAttending,
        maybe,
        totalGuests,
      },
    });
  } catch (error) {
    console.error("GET /api/rsvp failed", error);
    return NextResponse.json({ error: "Failed to fetch RSVP statistics" }, { status: 500 });
  }
}
