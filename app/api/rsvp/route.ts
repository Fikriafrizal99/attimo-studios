import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { logServerError } from "@/lib/commerce/observability";
import {
  cleanText,
  isAttendance,
  parseGuestCount,
  validateSlug,
} from "@/lib/commerce/validation";
import {
  checkSharedRateLimit,
  getClientIp,
  PUBLIC_READ_LIMIT,
  PUBLIC_RESOLUTION_LIMIT,
  PUBLIC_SUBMISSION_LIMIT,
  PUBLIC_WEDDING_BURST_LIMIT,
  type RateLimitOptions,
} from "@/lib/commerce/rate-limit";

async function rateLimitResponse(
  key: string,
  options: RateLimitOptions,
  message: string
) {
  const rate = await checkSharedRateLimit(key, options);
  if (rate.allowed) return null;
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(rate.retryAfterSeconds),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}

async function resolveReleasedGuest(input: {
  slug: unknown;
  token: unknown;
}) {
  const validatedSlug = validateSlug(input.slug);
  if (!validatedSlug.ok) {
    return { error: validatedSlug.error, status: 400 as const };
  }

  const guestToken = cleanText(input.token, 128, true);
  if (!guestToken) {
    return { error: "Personal guest token is required", status: 400 as const };
  }

  const supabase = createServiceRoleClient();
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, slug")
    .eq("slug", validatedSlug.value)
    .eq("status", "released")
    .maybeSingle();
  if (!wedding) {
    return { error: "Wedding not found", status: 404 as const };
  }

  const { data: guest } = await supabase
    .from("guests")
    .select("id, display_name, max_guests")
    .eq("wedding_id", wedding.id)
    .eq("token", guestToken)
    .eq("is_active", true)
    .maybeSingle();
  if (!guest) {
    return { error: "Guest link is invalid or inactive", status: 404 as const };
  }

  return {
    supabase,
    wedding,
    guest,
    guestToken,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const clientIp = getClientIp(request);
    const resolutionLimit = await rateLimitResponse(
      `${clientIp}:rsvp:resolve`,
      PUBLIC_RESOLUTION_LIMIT,
      "Too many RSVP link attempts. Please try again later."
    );
    if (resolutionLimit) return resolutionLimit;

    const resolved = await resolveReleasedGuest({
      slug: body.wedding_slug,
      token: body.guest_token,
    });
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const { supabase, wedding, guest } = resolved;

    const guestLimit = await rateLimitResponse(
      `rsvp:${wedding.id}:guest:${guest.id}`,
      PUBLIC_SUBMISSION_LIMIT,
      "Too many RSVP attempts for this guest. Please try again later."
    );
    if (guestLimit) return guestLimit;

    const ipLimit = await rateLimitResponse(
      `${clientIp}:rsvp:${wedding.id}`,
      PUBLIC_SUBMISSION_LIMIT,
      "Too many RSVP attempts. Please try again later."
    );
    if (ipLimit) return ipLimit;

    const weddingBurstLimit = await rateLimitResponse(
      `rsvp:${wedding.id}:all`,
      PUBLIC_WEDDING_BURST_LIMIT,
      "This wedding is receiving too many RSVP submissions. Please try again later."
    );
    if (weddingBurstLimit) return weddingBurstLimit;

    if (!isAttendance(body.attendance)) {
      return NextResponse.json({ error: "Invalid attendance value" }, { status: 400 });
    }

    const parsedGuestCount = parseGuestCount(body.guestCount, guest.max_guests);
    const guestCount = body.attendance === "yes" ? (parsedGuestCount ?? 0) : 0;
    if (body.attendance === "yes" && guestCount < 1) {
      return NextResponse.json({ error: "Guest count must be at least 1" }, { status: 400 });
    }

    const message = cleanText(body.message, 500, false) || null;
    const payload = {
      wedding_id: wedding.id,
      guest_id: guest.id,
      name: guest.display_name,
      attendance: body.attendance,
      guest_count: guestCount,
      message,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("rsvp")
      .select("id")
      .eq("wedding_id", wedding.id)
      .eq("guest_id", guest.id)
      .maybeSingle();

    let saved: {
      id: string;
      name: string;
      attendance: string;
      guest_count: number;
      message: string | null;
      submitted_at: string;
      updated_at: string;
    };
    let created = false;

    if (existing) {
      const { data, error } = await supabase
        .from("rsvp")
        .update(payload)
        .eq("id", existing.id)
        .select("id, name, attendance, guest_count, message, submitted_at, updated_at")
        .single();
      if (error || !data) throw error ?? new Error("RSVP update failed");
      saved = data;
    } else {
      const { data, error } = await supabase
        .from("rsvp")
        .insert(payload)
        .select("id, name, attendance, guest_count, message, submitted_at, updated_at")
        .single();
      if (error || !data) throw error ?? new Error("RSVP insert failed");
      saved = data;
      created = true;
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
      { status: created ? 201 : 200 }
    );
  } catch (error) {
    logServerError("rsvp_submit_failed", request, error);
    return NextResponse.json({ error: "Failed to submit RSVP" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const resolutionLimit = await rateLimitResponse(
      `${clientIp}:rsvp:resolve-read`,
      PUBLIC_RESOLUTION_LIMIT,
      "Too many RSVP link requests. Please try again later."
    );
    if (resolutionLimit) return resolutionLimit;

    const resolved = await resolveReleasedGuest({
      slug: request.nextUrl.searchParams.get("slug"),
      token: request.nextUrl.searchParams.get("guest_token"),
    });
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const { supabase, wedding, guest } = resolved;
    const readLimit = await rateLimitResponse(
      `${clientIp}:rsvp:read:${wedding.id}`,
      PUBLIC_READ_LIMIT,
      "Too many RSVP requests. Please try again later."
    );
    if (readLimit) return readLimit;

    const { data, error } = await supabase
      .from("rsvp")
      .select("guest_id, attendance, guest_count, message, submitted_at")
      .eq("wedding_id", wedding.id);
    if (error) throw error;

    const rows = data ?? [];
    const attending = rows.filter((row) => row.attendance === "yes").length;
    const notAttending = rows.filter((row) => row.attendance === "no").length;
    const maybe = rows.filter((row) => row.attendance === "maybe").length;
    const totalGuests = rows
      .filter((row) => row.attendance === "yes")
      .reduce((sum, row) => sum + (row.guest_count || 0), 0);
    const ownResponse = rows.find((row) => row.guest_id === guest.id) ?? null;

    return NextResponse.json({
      success: true,
      statistics: {
        totalResponses: rows.length,
        attending,
        notAttending,
        maybe,
        totalGuests,
      },
      response: ownResponse
        ? {
            attendance: ownResponse.attendance,
            guestCount: ownResponse.guest_count,
            message: ownResponse.message,
            submittedAt: ownResponse.submitted_at,
          }
        : null,
    });
  } catch (error) {
    logServerError("rsvp_read_failed", request, error);
    return NextResponse.json({ error: "Failed to fetch RSVP" }, { status: 500 });
  }
}
