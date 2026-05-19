"use client";
/* HAVEN KIDS — Community page with Skool-style tabs.
   Ported from design/project/screens-community.jsx */

import { useState } from "react";
import { HAVEN_DATA, type User, type EventItem, type LeaderboardEntry, type Community, type Lesson } from "@/lib/data";
import { Angel, Avatar } from "@/components/primitives";
import { PostCard } from "./HomePage";
import { LessonCard } from "./ClassroomPage";
import { LessonViewer } from "@/components/LessonViewer";
import type { Route } from "@/components/HavenApp";

export function CommunityPage({
  communityId,
  setRoute,
  user,
}: {
  communityId?: string;
  setRoute: (r: Route) => void;
  user: User;
}) {
  const D = HAVEN_DATA;
  const c = D.communities.find((x) => x.id === communityId) || D.communities[0];
  const [tab, setTab] = useState("feed");
  const tabs = [
    { id: "feed", label: "Feed", icon: "📰" },
    { id: "classroom", label: "Classroom", icon: "📚" },
    { id: "doodle", label: "Doodle Wall", icon: "🎨" },
    { id: "chat", label: "Chat", icon: "💬" },
    { id: "members", label: "Members", icon: "👥" },
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "leaderboard", label: "Leaderboard", icon: "🏆" },
    { id: "about", label: "About", icon: "ℹ️" },
  ];
  const posts = D.feed.filter((p) => p.community === c.id);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 0 80px" }}>
      <div
        style={{
          background: c.cover,
          position: "relative",
          margin: "20px 28px 0",
          borderRadius: 28,
          border: "var(--border)",
          boxShadow: "var(--shadow)",
          overflow: "hidden",
          padding: "28px 28px 24px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 85% 25%, #ffffff55, transparent 55%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            gap: 20,
            alignItems: "center",
            flexWrap: "wrap",
            color: "#2B2340",
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 26,
              background: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 52,
              border: "3px solid #fff",
              boxShadow: "var(--shadow)",
              flexShrink: 0,
            }}
          >
            {c.emoji}
          </div>
          <div style={{ flex: "1 1 300px", minWidth: 0 }}>
            <h1 style={{ fontSize: 34 }}>{c.name}</h1>
            <div style={{ marginTop: 6, fontWeight: 800, fontSize: 14 }}>{c.blurb}</div>
            <div className="row" style={{ gap: 14, marginTop: 10, fontSize: 13, fontWeight: 800, flexWrap: "wrap" }}>
              <span>👥 {c.members.toLocaleString()} members</span>
              <span>🌐 Public</span>
              <span>💝 Free</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <button className="btn btn-ghost">📣 Invite</button>
            <button className="btn" style={{ background: "#2B2340" }}>
              ✓ Joined
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "16px 28px",
          overflowX: "auto",
          borderBottom: "2px solid #2B234010",
          margin: "16px 0",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 18px",
              borderRadius: 14,
              background: tab === t.id ? "var(--ink)" : "transparent",
              color: tab === t.id ? "#fff" : "var(--ink-soft)",
              fontWeight: 800,
              fontSize: 14,
              whiteSpace: "nowrap",
              boxShadow: tab === t.id ? "0 3px 0 0 rgba(43,35,64,.3)" : "none",
            }}
          >
            <span style={{ marginRight: 6 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 28px" }}>
        {tab === "feed" && <CommunityFeed posts={posts} user={user} community={c} />}
        {tab === "classroom" && <ClassroomTab communityId={c.id} />}
        {tab === "doodle" && <DoodleWallTab setRoute={setRoute} />}
        {tab === "chat" && <ChatTabPreview setRoute={setRoute} />}
        {tab === "members" && <MembersTab users={D.users} />}
        {tab === "calendar" && <CalendarTab events={D.events} communityId={c.id} />}
        {tab === "leaderboard" && <LeaderboardTab items={D.leaderboard} />}
        {tab === "about" && <AboutTab community={c} />}
      </div>
    </div>
  );
}

function CommunityFeed({ posts, user, community }: { posts: ReturnType<typeof Array<any>>; user: User; community: Community }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
      <div className="stack" style={{ gap: 14 }}>
        <div className="card" style={{ padding: 14 }}>
          <div className="row" style={{ gap: 12 }}>
            <Avatar user={user} size={40} ring />
            <input
              placeholder={`Share with ${community.name}…`}
              style={{
                flex: 1,
                padding: "10px 16px",
                border: "2px solid #2B234014",
                borderRadius: 999,
                background: "#FFF8E8",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>
        </div>
        {posts.length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: "center" }}>
            <Angel size={80} />
            <div style={{ marginTop: 10, fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22 }}>
              Be the first to share!
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              This community is waiting for your kind words.
            </div>
          </div>
        )}
        {posts.map((p: any) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
      <div className="stack" style={{ gap: 14, position: "sticky", top: 80 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3>Pinned by Gabriel</h3>
          <div
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 14,
              background: "linear-gradient(135deg,#FFF8E8,#FFEFC9)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700 }}>📖 Weekly verse to meditate on:</div>
            <div style={{ marginTop: 6, fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 15 }}>
              &quot;Be kind and compassionate to one another…&quot; — Eph 4:32
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h3>House Rules</h3>
          <ol style={{ margin: "10px 0 0 18px", padding: 0, fontSize: 13, lineHeight: 1.7 }}>
            <li>Kind words only 💛</li>
            <li>No last names or addresses 🔒</li>
            <li>Respect every friend 🤝</li>
            <li>When in doubt, ask Gabriel 😇</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function ClassroomTab({ communityId }: { communityId: string }) {
  const D = HAVEN_DATA;
  const [open, setOpen] = useState<Lesson | null>(null);
  const lessons = D.classroom.filter((l) => l.community === communityId);
  if (lessons.length === 0) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center", maxWidth: 520 }}>
        <Angel size={72} />
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, marginTop: 8 }}>
          No lessons yet — but stay tuned!
        </div>
        <div className="muted small" style={{ marginTop: 6 }}>
          New lessons ship every week. Ask Gabriel for a sneak peek in chat.
        </div>
      </div>
    );
  }
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
        {lessons.map((l) => (
          <LessonCard key={l.id} lesson={l} onOpen={() => setOpen(l)} />
        ))}
      </div>
      {open && <LessonViewer lesson={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function DoodleWallTab({ setRoute }: { setRoute: (r: Route) => void }) {
  const items = [
    { title: "Rainbow promise", kids: 3, color: "linear-gradient(135deg,#FFE9A8,#FFC1B6,#D7B8F5,#B5E2F9)", emoji: "🌈" },
    { title: "Garden of Eden", kids: 5, color: "linear-gradient(135deg,#C7ECC9,#7DCE82)", emoji: "🌳" },
    { title: "Noah's ark", kids: 2, color: "linear-gradient(135deg,#B5E2F9,#7AC7F2)", emoji: "🚢" },
    { title: "Jonah's whale", kids: 4, color: "linear-gradient(135deg,#E0CBFA,#B47EE5)", emoji: "🐋" },
    { title: "David's slingshot", kids: 1, color: "linear-gradient(135deg,#FFD1E1,#F58BB3)", emoji: "🎯" },
    { title: "Loaves & fishes", kids: 2, color: "linear-gradient(135deg,#FFE28A,#FFC94A)", emoji: "🍞" },
  ];
  return (
    <div>
      <div className="row" style={{ marginBottom: 14 }}>
        <h2>Shared Doodle Canvases</h2>
        <div style={{ flex: 1 }} />
        <button className="btn btn-coral" onClick={() => setRoute({ page: "doodle" })}>
          🎨 New Canvas
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {items.map((it, i) => (
          <button
            key={i}
            onClick={() => setRoute({ page: "doodle" })}
            className="card"
            style={{ padding: 0, overflow: "hidden", textAlign: "left", cursor: "pointer" }}
          >
            <div style={{ height: 160, background: it.color, display: "grid", placeItems: "center", fontSize: 64 }}>
              {it.emoji}
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16 }}>{it.title}</div>
              <div className="row" style={{ marginTop: 6 }}>
                <span className="chip" style={{ background: "#E8F9E2", color: "#2F7A3A", fontSize: 11 }}>
                  🟢 {it.kids} drawing
                </span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-mute)" }}>Join →</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatTabPreview({ setRoute }: { setRoute: (r: Route) => void }) {
  const rooms = [
    { name: "General", emoji: "💬", online: 12, last: "Lily: made cookies today 🍪", time: "2m" },
    { name: "Prayer Circle", emoji: "🙏", online: 4, last: "Gabriel: Who would like to pray for Miriam?", time: "8m" },
    { name: "Art Jam", emoji: "🎨", online: 7, last: "Caleb: check out my dragon!", time: "15m" },
    { name: "Book Club", emoji: "📚", online: 3, last: "Hannah: Narnia chapter 3 was crazy", time: "1h" },
  ];
  return (
    <div className="stack" style={{ gap: 10, maxWidth: 700 }}>
      <div className="row">
        <h2>Chat rooms</h2>
        <div style={{ flex: 1 }} />
        <button className="btn btn-sm btn-ghost" onClick={() => setRoute({ page: "chat" })}>
          Open full chat →
        </button>
      </div>
      {rooms.map((r, i) => (
        <button
          key={i}
          onClick={() => setRoute({ page: "chat" })}
          className="card"
          style={{ padding: 14, textAlign: "left", cursor: "pointer" }}
        >
          <div className="row">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "#FFF1D6",
                display: "grid",
                placeItems: "center",
                fontSize: 22,
              }}
            >
              {r.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row" style={{ gap: 8 }}>
                <span style={{ fontWeight: 900, fontSize: 15 }}>{r.name}</span>
                <span
                  className="chip"
                  style={{ padding: "2px 8px", fontSize: 11, background: "#E8F9E2", color: "#2F7A3A" }}
                >
                  🟢 {r.online}
                </span>
                <div style={{ flex: 1 }} />
                <span className="tiny muted">{r.time}</span>
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  color: "var(--ink-soft)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {r.last}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function MembersTab({ users }: { users: User[] }) {
  const badgeIcon: Record<string, string> = { kind: "💛", scripture: "⭐", helper: "🤝" };
  return (
    <div>
      <div className="row" style={{ marginBottom: 14 }}>
        <h2>Members ({users.length})</h2>
        <div style={{ flex: 1 }} />
        <div className="chip">🔍 Search</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {users.slice(0, 16).map((u) => (
          <div key={u.id} className="card" style={{ padding: 14, textAlign: "center" }}>
            <div style={{ display: "grid", placeItems: "center" }}>
              <Avatar user={u} size={64} ring />
            </div>
            <div style={{ marginTop: 10, fontWeight: 900, fontSize: 14 }}>{u.name}</div>
            <div className="muted tiny">
              Age {u.age} · Lvl {u.level}
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 4, justifyContent: "center" }}>
              {u.badges.map((b, i) => (
                <span key={i} style={{ fontSize: 14 }}>
                  {badgeIcon[b]}
                </span>
              ))}
            </div>
            <button className="btn btn-sm btn-ghost" style={{ marginTop: 10, width: "100%" }}>
              👋 Say hi
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarTab({ events, communityId }: { events: EventItem[]; communityId?: string }) {
  const D = HAVEN_DATA;
  const days = Array.from({ length: 35 }, (_, i) => i - 2);
  const [scope, setScope] = useState<"community" | "all">(communityId ? "community" : "all");
  const filtered = scope === "community" && communityId
    ? events.filter((e) => e.community === communityId)
    : events;
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="row">
        <h2>October 2025</h2>
        <div style={{ flex: 1 }} />
        {communityId && (
          <div className="pill-row">
            <button
              onClick={() => setScope("community")}
              className={"chip " + (scope === "community" ? "is-active" : "")}
              style={{ cursor: "pointer" }}
            >
              This community
            </button>
            <button
              onClick={() => setScope("all")}
              className={"chip " + (scope === "all" ? "is-active" : "")}
              style={{ cursor: "pointer" }}
            >
              All events
            </button>
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginTop: 16 }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 11,
              fontWeight: 900,
              color: "var(--ink-mute)",
              letterSpacing: ".1em",
              padding: 6,
            }}
          >
            {d}
          </div>
        ))}
        {days.map((d) => {
          const evt = filtered.find((e) => e.date === d);
          const c = evt && D.communities.find((x) => x.id === evt.community);
          const inMonth = d >= 1 && d <= 31;
          return (
            <div
              key={d}
              style={{
                aspectRatio: "1 / 0.9",
                border: "2px solid #2B234010",
                borderRadius: 12,
                padding: 6,
                background: inMonth ? "#fff" : "#f7f4e8",
                opacity: inMonth ? 1 : 0.4,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-soft)" }}>{inMonth ? d : ""}</div>
              {evt && c && (
                <div
                  style={{
                    marginTop: 4,
                    padding: "3px 6px",
                    borderRadius: 6,
                    background: c.cover,
                    fontSize: 10,
                    fontWeight: 900,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.emoji} {evt.title}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeaderboardTab({ items }: { items: LeaderboardEntry[] }) {
  return (
    <div style={{ maxWidth: 680 }}>
      <h2 style={{ marginBottom: 14 }}>Weekly Leaderboard</h2>
      <div className="card" style={{ padding: 8 }}>
        {items.map((u, i) => (
          <div
            key={u.id}
            className="row"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: i < 3 ? "#FFFBF0" : "transparent",
            }}
          >
            <div style={{ width: 36, textAlign: "center", fontSize: 18, fontWeight: 900 }}>
              {u.rank <= 3 ? ["🥇", "🥈", "🥉"][u.rank - 1] : u.rank}
            </div>
            <Avatar user={u} size={40} ring={i < 3} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 14 }}>{u.name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                Lvl {u.level} · {u.badges.length} badges
              </div>
            </div>
            <div style={{ fontWeight: 900, color: "#E8A825" }}>+{u.weekXp} xp</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutTab({ community }: { community: Community }) {
  return (
    <div style={{ maxWidth: 680 }}>
      <div className="card" style={{ padding: 20 }}>
        <h2>About {community.name}</h2>
        <p style={{ marginTop: 8, color: "var(--ink-soft)" }}>{community.blurb}</p>
        <div className="divider" style={{ margin: "16px 0" }} />
        <h3>What we&apos;re about</h3>
        <p style={{ marginTop: 6, color: "var(--ink-soft)" }}>
          A warm, safe corner of Haven Kids for sharing, learning, and growing together in faith and fun. Everyone&apos;s
          welcome. Be kind, be curious, be you.
        </p>
        <div className="divider" style={{ margin: "16px 0" }} />
        <h3>Moderation</h3>
        <div className="row" style={{ gap: 10, marginTop: 8 }}>
          <Angel size={44} />
          <div style={{ fontSize: 14, color: "var(--ink-soft)" }}>
            Gabriel watches every post and message. Unkind words get a gentle nudge. Three strikes and the child is
            paused for a parent chat.
          </div>
        </div>
      </div>
    </div>
  );
}
