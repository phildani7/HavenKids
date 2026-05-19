"use client";
/* =============================================================
   HAVEN KIDS — Home page (+ PostCard, sub-widgets)
   Ported from design/project/screens-home.jsx
   ============================================================= */

import { useState } from "react";
import { HAVEN_DATA, type Post, type User, type EventItem, type LeaderboardEntry } from "@/lib/data";
import { Angel, Avatar, PlaceholderImage, VerseCard } from "@/components/primitives";
import { logActivity } from "@/lib/activity";
import type { Route } from "@/components/HavenApp";

export function HomePage({ user, setRoute }: { user: User; setRoute: (r: Route) => void }) {
  const D = HAVEN_DATA;
  return (
    <div style={{ padding: "20px 28px 80px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Hero */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, marginBottom: 20 }}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "28px 32px",
            borderRadius: 28,
            background: "linear-gradient(135deg,#FFE9A8 0%, #FFC1B6 60%, #D7B8F5 100%)",
            border: "var(--border)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: "#8A4A6A",
            }}
          >
            Hey {user.name.split(" ")[0]} 👋
          </div>
          <h1 style={{ marginTop: 6, maxWidth: 420 }}>A safe place to be a kid, a friend, and a light.</h1>
          <div style={{ marginTop: 10, fontSize: 15, color: "#4A3A66", maxWidth: 440 }}>
            Join {D.communities.length} free communities. Share spiritual wins, hobbies, and silly stuff — all watched
            over by Gabriel, your AI Angel helper.
          </div>
          <div className="row" style={{ marginTop: 18, gap: 10 }}>
            <button className="btn btn-coral" onClick={() => setRoute({ page: "discover" })}>
              🧭 Find a Community
            </button>
            <button className="btn btn-ghost" onClick={() => setRoute({ page: "doodle" })}>
              🎨 Start Doodling
            </button>
          </div>
          <div style={{ position: "absolute", right: -10, bottom: -10 }}>
            <div className="bob">
              <Angel size={140} />
            </div>
          </div>
        </div>
        <VerseCard verse={D.verse} />
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {(
          [
            { id: "streak", icon: "🔥", label: "12-day streak", sub: "Keep it going!", bg: "linear-gradient(135deg,#FFD3B5,#FF7E6B)", go: undefined },
            { id: "pray", icon: "🙏", label: "23 prayer requests", sub: "Pray with friends", bg: "linear-gradient(135deg,#E0CBFA,#B47EE5)", go: "prayer" },
            { id: "doodle", icon: "🎨", label: "Doodle Garden", sub: "4 kids drawing now", bg: "linear-gradient(135deg,#B5E2F9,#7AC7F2)", go: "doodle" },
            { id: "event", icon: "🎤", label: "Worship Night Fri", sub: "7pm — RSVP", bg: "linear-gradient(135deg,#C7ECC9,#7DCE82)", go: undefined },
          ] satisfies Array<{ id: string; icon: string; label: string; sub: string; bg: string; go?: Route["page"] }>
        ).map((q) => (
          <button
            key={q.id}
            onClick={() => q.go && setRoute({ page: q.go })}
            style={{
              textAlign: "left",
              padding: 16,
              borderRadius: 20,
              background: q.bg,
              color: "#fff",
              boxShadow: "var(--shadow-sm)",
              border: "var(--border)",
            }}
          >
            <div style={{ fontSize: 28 }}>{q.icon}</div>
            <div style={{ fontWeight: 900, marginTop: 6, fontSize: 15 }}>{q.label}</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>{q.sub}</div>
          </button>
        ))}
      </div>

      {/* Feed + right rail */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        <div className="stack" style={{ gap: 14 }}>
          <ComposerCard user={user} />
          <FilterRow />
          {D.feed.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
        <div className="stack" style={{ gap: 14, position: "sticky", top: 80 }}>
          <UpcomingEvents events={D.events} />
          <LeaderboardCard items={D.leaderboard.slice(0, 5)} />
          <ActiveNowCard />
        </div>
      </div>
    </div>
  );
}

export function ComposerCard({ user }: { user: User }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="row" style={{ gap: 12 }}>
        <Avatar user={user} size={44} ring />
        <input
          placeholder="Share something kind…"
          style={{
            flex: 1,
            padding: "12px 16px",
            border: "2px solid #2B234014",
            borderRadius: 999,
            background: "#FFF8E8",
            fontSize: 14,
            outline: "none",
          }}
        />
      </div>
      <div className="row" style={{ marginTop: 12, gap: 8, paddingLeft: 56, flexWrap: "wrap" }}>
        {(
          [
            ["📷", "Photo"],
            ["🎨", "Doodle"],
            ["🙏", "Prayer"],
            ["📖", "Verse"],
            ["😊", "Feeling"],
          ] as const
        ).map(([i, l]) => (
          <button key={l} className="chip">
            <span>{i}</span>
            <span>{l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function FilterRow() {
  const tabs = ["For You", "Following", "Spiritual", "Hobbies", "Funny", "Recent"];
  const [active, setActive] = useState(0);
  return (
    <div className="pill-row">
      {tabs.map((t, i) => (
        <button
          key={t}
          onClick={() => setActive(i)}
          className={"chip " + (active === i ? "is-active" : "")}
          style={{ cursor: "pointer", padding: "8px 14px" }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function PostCard({ post }: { post: Post }) {
  const community = HAVEN_DATA.communities.find((c) => c.id === post.community)!;
  const [reacted, setReacted] = useState<string | null>(null);

  const reactions: Array<[keyof Post["reactions"], string, string]> = [
    ["heart", "❤️", "Love"],
    ["amen", "🙏", "Amen"],
    ["praise", "🎉", "Praise"],
    ["wow", "✨", "Wow"],
  ];

  return (
    <div className="card" style={{ padding: 18 }}>
      {post.pinned && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 10,
            background: "#FFF4C4",
            color: "#8A6B00",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: ".08em",
            textTransform: "uppercase",
          }}
        >
          📌 Pinned by Gabriel
        </div>
      )}
      <div className="row" style={{ gap: 12 }}>
        <Avatar user={post.user} size={44} ring />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 14 }}>{post.user.name}</div>
          <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
            in{" "}
            <span style={{ color: "var(--ink-soft)", fontWeight: 800 }}>
              {community.emoji} {community.name}
            </span>{" "}
            · {post.time}
          </div>
        </div>
        <button className="chip" style={{ padding: "6px 10px" }}>
          ···
        </button>
      </div>
      <h3 style={{ marginTop: 12, fontSize: 18 }}>{post.title}</h3>
      <p style={{ marginTop: 6, fontSize: 14, color: "var(--ink-soft)" }}>{post.body}</p>
      {post.image && (
        <div style={{ marginTop: 12 }}>
          <PlaceholderImage kind={post.image} />
        </div>
      )}

      {post.angelNote && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderRadius: 14,
            background: "linear-gradient(135deg,#FFF8E8,#FFEFC9)",
            border: "2px solid #FFC94A40",
          }}
        >
          <Angel size={34} />
          <div style={{ fontSize: 13, fontWeight: 700, color: "#8A6B00", fontStyle: "italic" }}>{post.angelNote}</div>
        </div>
      )}

      <div className="row" style={{ marginTop: 14, gap: 6, flexWrap: "wrap" }}>
        {reactions.map(([k, icon, l]) => {
          const n = post.reactions[k];
          return (
            <button
              key={k}
              onClick={() => {
                setReacted(k);
                logActivity("post_reaction", { postId: post.id, kind: k });
              }}
              className="chip"
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                background: reacted === k ? "#FFF1D6" : "#F6F3FF",
                border: reacted === k ? "2px solid #FFC94A" : "2px solid transparent",
              }}
            >
              <span>{icon}</span>
              <span>{l}</span>
              <span style={{ color: "var(--ink-mute)" }}>· {n + (reacted === k ? 1 : 0)}</span>
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <button className="chip" style={{ padding: "8px 12px" }}>
          💬 {post.comments}
        </button>
        <button className="chip" style={{ padding: "8px 12px" }}>
          📤 Share
        </button>
      </div>
    </div>
  );
}

export function UpcomingEvents({ events }: { events: EventItem[] }) {
  const D = HAVEN_DATA;
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3>Upcoming</h3>
        <span className="chip" style={{ background: "#FFF1D6", color: "#8A6B00" }}>
          📅 This week
        </span>
      </div>
      <div className="stack" style={{ marginTop: 12, gap: 8 }}>
        {events.map((e) => {
          const c = D.communities.find((x) => x.id === e.community)!;
          return (
            <div key={e.id} className="row" style={{ gap: 10, padding: 8, borderRadius: 12, background: "#FFFBF0" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#FFF",
                  display: "grid",
                  placeItems: "center",
                  border: "2px solid #2B234014",
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 900, color: "#8A6B00", letterSpacing: ".1em" }}>
                  {e.day.toUpperCase()}
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, marginTop: -2 }}>{e.date}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 13, lineHeight: 1.2 }}>{e.title}</div>
                <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>
                  {e.time} · {c.emoji} {c.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LeaderboardCard({ items }: { items: LeaderboardEntry[] }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3>Top Angels this week</h3>
        <span className="chip" style={{ background: "#F6F3FF" }}>
          🏆
        </span>
      </div>
      <div className="stack" style={{ marginTop: 12, gap: 6 }}>
        {items.map((u) => (
          <div key={u.id} className="row" style={{ padding: 6, borderRadius: 10 }}>
            <div
              style={{
                width: 22,
                textAlign: "center",
                fontWeight: 900,
                fontSize: 13,
                color: u.rank <= 3 ? "#E8A825" : "var(--ink-mute)",
              }}
            >
              {u.rank <= 3 ? ["🥇", "🥈", "🥉"][u.rank - 1] : u.rank}
            </div>
            <Avatar user={u} size={28} />
            <div style={{ flex: 1, fontWeight: 800, fontSize: 13 }}>{u.name}</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#E8A825" }}>+{u.weekXp}xp</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActiveNowCard() {
  const D = HAVEN_DATA;
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3>Active Now</h3>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#4FB058",
            boxShadow: "0 0 0 4px #7DCE8240",
          }}
        />
      </div>
      <div style={{ display: "flex", marginTop: 12, flexWrap: "wrap" }}>
        {D.users.slice(0, 10).map((u, i) => (
          <div key={u.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
            <Avatar user={u} size={34} />
          </div>
        ))}
        <div style={{ marginLeft: 6, alignSelf: "center", fontSize: 13, fontWeight: 800, color: "var(--ink-mute)" }}>
          +42 kids
        </div>
      </div>
    </div>
  );
}
