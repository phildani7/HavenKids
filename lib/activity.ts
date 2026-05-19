// Client-side helper for logging user activity to Supabase via /api/activity.
// Fails silently so UI interactions never break on network hiccups.

export type ActivityEvent =
  | "view_page"
  | "post_reaction"
  | "send_chat"
  | "strike_triggered"
  | "pray_for"
  | "submit_prayer"
  | "doodle_stroke"
  | "join_community"
  | "create_post";

export async function logActivity(event: ActivityEvent, data: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, data }),
      keepalive: true,
    });
  } catch {
    // silent
  }
}
