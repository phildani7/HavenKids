"use client";
/* =============================================================
   FISHHAVEN — Sidebar, TopBar, AngelFloat
   Ported from design/project/screens-home.jsx (Sidebar, TopBar)
   and screens-features.jsx (AngelFloat)
   ============================================================= */

import { HAVEN_DATA, type User } from "@/lib/data";
import { Angel, Avatar, Hearts, LevelPill } from "./primitives";
import { NotificationsBell } from "./NotificationsBell";
import type { Route } from "./HavenApp";

export function Sidebar({
  route,
  setRoute,
  userName,
  onSignOut,
  isKid,
}: {
  route: Route;
  setRoute: (r: Route) => void;
  userName: string;
  onSignOut: () => void | Promise<void>;
  isKid?: boolean;
}) {
  const allNav: Array<{ id: Route["page"]; label: string; icon: string }> = [
    { id: "home", label: "Home", icon: "🏡" },
    { id: "discover", label: "Discover", icon: "🧭" },
    { id: "doodle", label: "Group Doodle", icon: "🎨" },
    { id: "chat", label: "Chat Rooms", icon: "💬" },
    { id: "prayer", label: "Prayer Wall", icon: "🙏" },
    { id: "classroom", label: "Classroom", icon: "📚" },
    { id: "profile", label: "My Profile", icon: "😇" },
    { id: "parents", label: "For Parents", icon: "👨‍👩‍👧" },
  ];
  const nav = isKid ? allNav.filter((n) => n.id !== "parents") : allNav;
  const myCommunities = HAVEN_DATA.communities.slice(0, 5);

  return (
    <aside className="sidebar">
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 14px" }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            background: "linear-gradient(135deg,#FFE28A,#FFC94A)",
            display: "grid",
            placeItems: "center",
            fontSize: 22,
            boxShadow: "0 3px 0 0 #E8A825",
          }}
        >
          😇
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, lineHeight: 1 }}>FishHaven</div>
      </div>

      <div className="stack" style={{ gap: 4 }}>
        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => setRoute({ page: n.id })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 14,
              background: route.page === n.id ? "var(--ink)" : "transparent",
              color: route.page === n.id ? "#fff" : "var(--ink)",
              textAlign: "left",
              fontSize: 14,
              fontWeight: 800,
              boxShadow: route.page === n.id ? "0 3px 0 0 rgba(43,35,64,.35)" : "none",
            }}
          >
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </div>

      <div className="divider" style={{ margin: "12px 6px" }} />

      <div
        style={{
          padding: "0 8px 6px",
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: ".1em",
          color: "var(--ink-mute)",
          textTransform: "uppercase",
        }}
      >
        My Communities
      </div>
      <div className="stack" style={{ gap: 2 }}>
        {myCommunities.map((c) => (
          <button
            key={c.id}
            onClick={() => setRoute({ page: "community", communityId: c.id })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 12,
              background: route.communityId === c.id && route.page === "community" ? "#FFF1D6" : "transparent",
              textAlign: "left",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 9,
                background: c.cover,
                display: "grid",
                placeItems: "center",
                fontSize: 16,
                border: "2px solid #2B234014",
              }}
            >
              {c.emoji}
            </div>
            <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          background: "linear-gradient(135deg,#E8F9E2,#C7ECC9)",
          borderRadius: 16,
          padding: 12,
          border: "2px solid #4FB05830",
          margin: "8px 4px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "#2F7A3A",
          }}
        >
          Kind Words Meter
        </div>
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 24 }}>🌻</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 14 }}>98% sunny</div>
            <div style={{ height: 6, background: "#fff8", borderRadius: 10, overflow: "hidden", marginTop: 2 }}>
              <div style={{ width: "98%", height: "100%", background: "#4FB058" }} />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onSignOut}
        className="btn btn-ghost btn-sm"
        style={{ margin: "4px 4px 0", justifyContent: "flex-start" }}
        title={`Signed in as ${userName}`}
      >
        👋 Sign out
      </button>
    </aside>
  );
}

export function TopBar({ user, strikes }: { user: User; strikes: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 28px",
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(255,247,230,.88)",
        backdropFilter: "blur(10px)",
        borderBottom: "2px solid #2B234010",
      }}
    >
      <div
        style={{
          flex: 1,
          maxWidth: 520,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#fff",
          padding: "10px 16px",
          borderRadius: 999,
          border: "2px solid #2B234014",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <span style={{ fontSize: 18 }}>🔍</span>
        <input
          placeholder="Search communities, friends, verses…"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 14,
            fontWeight: 700,
          }}
        />
        <span className="chip" style={{ background: "#FFF1D6", color: "#8A6B00" }}>
          ⌘K
        </span>
      </div>

      <NotificationsBell />
      <Hearts broken={strikes} size={22} />
      <LevelPill level={user.level} xp={user.xp} />
      <Avatar user={user} size={38} ring />
    </div>
  );
}

export function AngelFloat({ strikes, onOpen }: { strikes: number; onOpen: () => void }) {
  return (
    <button className="angel-float" onClick={onOpen}>
      <Angel size={44} mood={strikes >= 2 ? "worried" : "happy"} />
      <div style={{ textAlign: "left" }}>
        <div style={{ fontWeight: 900, fontSize: 13 }}>Gabriel</div>
        <div className="tiny" style={{ color: "#8A6B00" }}>
          {strikes === 0 ? "You're doing great!" : `${3 - strikes} heart${3 - strikes === 1 ? "" : "s"} left`}
        </div>
      </div>
      <Hearts broken={strikes} size={16} />
    </button>
  );
}
