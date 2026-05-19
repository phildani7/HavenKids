"use client";
/* HAVEN KIDS — Profile. Ported from screens-features.jsx */

import { HAVEN_DATA, type User } from "@/lib/data";
import { Avatar, Badge, Hearts } from "@/components/primitives";

export function ProfilePage({ user, strikes }: { user: User; strikes: number }) {
  const D = HAVEN_DATA;
  return (
    <div style={{ padding: "20px 28px 80px", maxWidth: 1100, margin: "0 auto" }}>
      <div
        style={{
          padding: 28,
          borderRadius: 28,
          marginBottom: 20,
          background: "linear-gradient(135deg,#FFE9A8,#FFC1B6)",
          border: "var(--border)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div className="row" style={{ gap: 20 }}>
          <Avatar user={user} size={120} ring />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "#8A4A6A",
              }}
            >
              Level {user.level} · Age {user.age}
            </div>
            <h1 style={{ marginTop: 6 }}>{user.name}</h1>
            <div style={{ marginTop: 6, fontFamily: "var(--font-hand)", fontSize: 22 }}>
              &quot;Be strong and courageous&quot; — Joshua 1:9 ⚔️
            </div>
            <div className="row" style={{ marginTop: 12, gap: 10 }}>
              <span className="chip" style={{ background: "#fff" }}>
                🔥 12-day streak
              </span>
              <span className="chip" style={{ background: "#fff" }}>
                📖 18 verses learned
              </span>
              <span className="chip" style={{ background: "#fff" }}>
                🙏 47 prayers sent
              </span>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Hearts broken={strikes} />
            <div className="tiny" style={{ marginTop: 6, color: "#8A4A6A", fontWeight: 800 }}>
              Good standing 💛
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="row">
            <h2>Badges</h2>
            <div style={{ flex: 1 }} />
            <span className="chip">
              {D.badges.filter((b) => b.earned).length}/{D.badges.length}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 14 }}>
            {D.badges.map((b) => (
              <div key={b.id} style={{ textAlign: "center" }}>
                <div style={{ display: "grid", placeItems: "center" }}>
                  <Badge badge={b} size="lg" />
                </div>
                <div style={{ marginTop: 8, fontWeight: 900, fontSize: 12 }}>{b.name}</div>
                <div className="tiny muted">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="stack" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 20 }}>
            <h2>Angel Sticker Collection</h2>
            <div className="muted small" style={{ marginTop: 4 }}>
              Collect all 12!
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginTop: 14 }}>
              {["🕊️", "⭐", "✝️", "🌈", "🔥", "💧", "🍞", "🐑", "🦁", "🌻", "🛡️", "📖"].map((e, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 14,
                    background: i < 8 ? "#FFF1D6" : "#EFECF6",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 26,
                    opacity: i < 8 ? 1 : 0.3,
                    filter: i < 8 ? "none" : "grayscale(1)",
                    border: i < 8 ? "2px solid #FFC94A60" : "2px dashed #8A82A830",
                  }}
                >
                  {i < 8 ? e : "?"}
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <h2>Devotional streak</h2>
            <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center" }}>
                  <div
                    style={{
                      aspectRatio: "1",
                      borderRadius: 12,
                      background: i < 5 ? "linear-gradient(135deg,#FFE28A,#FFC94A)" : "#EFECF6",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 18,
                      boxShadow: i < 5 ? "0 3px 0 0 #E8A825" : "none",
                    }}
                  >
                    {i < 5 ? "🔥" : "·"}
                  </div>
                  <div className="tiny" style={{ marginTop: 4, fontWeight: 800 }}>
                    {d}
                  </div>
                </div>
              ))}
            </div>
            <div className="muted small" style={{ marginTop: 12 }}>
              5 days this week. Keep going!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
