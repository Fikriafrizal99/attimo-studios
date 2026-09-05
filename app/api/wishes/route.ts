import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cleanText, isUuid } from "@/lib/commerce/validation";
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
      `${getClientIp(request)}:wish:${weddingId}`,
      PUBLIC_SUBMISSION_LIMIT
    );
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const message = cleanText(body.message, 1000, true);
    const location = cleanText(body.location, 120, false) || "";
    if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

    const supabase = createServerClient();
    const { data: wedding } = await supabase
      .from("weddings")
      .select("id")
      .eq("id", weddingId)
      .eq("status", "released")
      .maybeSingle();
    if (!wedding) return NextResponse.json({ error: "Wedding not found" }, { status: 404 });

    const guestToken = cleanText(body.guest_token, 128, false) || "";
    let guest: { id: string; display_name: string } | null = null;
    if (guestToken) {
      const { data } = await supabase
        .from("guests")
        .select("id, display_name")
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

    const { data, error } = await supabase
      .from("wishes")
      .insert({
        wedding_id: weddingId,
        guest_id: guest?.id ?? null,
        name,
        location,
        message,
        status: "visible",
      })
      .select("id, name, location, message, created_at")
      .single();
    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: data.id,
          name: data.name,
          location: data.location,
          message: data.message,
          createdAt: data.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/wishes failed", error);
    return NextResponse.json({ error: "Failed to submit wish" }, { status: 500 });
  }
}

/** Public, wedding-scoped visible wishes only. */
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
      .from("wishes")
      .select("id, name, location, message, created_at")
      .eq("wedding_id", weddingId)
      .eq("status", "visible")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    const rows = data ?? [];
    return NextResponse.json({
      success: true,
      data: rows.map((item) => ({
        id: item.id,
        name: item.name,
        location: item.location,
        message: item.message,
        createdAt: item.created_at,
      })),
      count: rows.length,
    });
  } catch (error) {
    console.error("GET /api/wishes failed", error);
    return NextResponse.json({ error: "Failed to fetch wishes" }, { status: 500 });
  }
}
