import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { accountIdForEmail, resolveActiveProfile } from "@/lib/accounts";
import { allow } from "@/lib/rate-limit";

export const runtime = "nodejs";

const ALLOWED_EVENTS = new Set([
  "view_page","post_reaction","send_chat","strike_triggered","pray_for",
  "submit_prayer","doodle_stroke","join_community","create_post",
]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(`activity-ip:${ip}`, 300, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const accountId = await accountIdForEmail(session.user.email);
  if (!accountId) return NextResponse.json({ error: "No account" }, { status: 401 });

  const profile = await resolveActiveProfile(accountId);
  if (!profile) return NextResponse.json({ error: "No active profile" }, { status: 401 });

  if (!allow(`activity:${profile.id}`, 120, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  let body: { event?: string; data?: Record<string, unknown> };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const event = body.event;
  if (!event || !ALLOWED_EVENTS.has(event)) {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: true, stored: false });

  const { error } = await supabase.rpc("log_activity", {
    p_person_id: profile.id,
    p_event: event,
    p_data: body.data ?? {},
    p_user_agent: request.headers.get("user-agent") ?? null,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, stored: true });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const accountId = await accountIdForEmail(session.user.email);
  if (!accountId) return NextResponse.json({ error: "No account" }, { status: 401 });
  const profile = await resolveActiveProfile(accountId);
  if (!profile) return NextResponse.json({ error: "No active profile" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: true, rows: [], stored: false });

  const url = new URL(request.url);
  const limit = Math.min(200, Number(url.searchParams.get("limit") ?? "50"));
  const { data, error } = await supabase.rpc("my_activity", {
    p_person_id: profile.id, p_limit: limit,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, rows: data ?? [] });
}
