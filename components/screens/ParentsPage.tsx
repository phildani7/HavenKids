"use client";
/* HAVEN KIDS — Parents dashboard. Ported from screens-features.jsx */

import { Angel } from "@/components/primitives";
import { HAVEN_DATA, type User } from "@/lib/data";

export function ParentsPage({ user }: { user: User }) {
  return (
    <div style={{ padding: "20px 28px 80px", maxWidth: 1000, margin: "0 auto" }}>
      <div
        style={{
          padding: 28,
          borderRadius: 28,
          marginBottom: 20,
          background: "linear-gradient(135deg,#B5E2F9,#E0CBFA)",
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
            color: "#2B2340",
          }}
        >
          Parent / Guardian Dashboard
        </div>
        <h1 style={{ marginTop: 6 }}>Peace of mind, by design.</h1>
        <div style={{ marginTop: 8, maxWidth: 620 }}>
          Every conversation is watched by Gabriel. Every post is screened. You get a weekly digest, real-time alerts
          for strikes, and full visibility into {user.name}&apos;s activity.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {(
          [
            { icon: "🕒", label: "Screen time today", val: "42 min", bg: "linear-gradient(135deg,#FFE9A8,#FFC94A)" },
            { icon: "💛", label: "Kindness score", val: "98%", bg: "linear-gradient(135deg,#C7ECC9,#7DCE82)" },
            { icon: "💔", label: "Strikes this week", val: "0 / 3", bg: "linear-gradient(135deg,#FFD1E1,#F58BB3)" },
          ] as const
        ).map((s, i) => (
          <div key={i} className="card" style={{ padding: 18, background: s.bg, color: "#2B2340" }}>
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 900, marginTop: 4 }}>
              {s.val}
            </div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h2>Recent activity</h2>
          <div className="stack" style={{ marginTop: 12, gap: 10 }}>
            {HAVEN_DATA.parentActivityLog.map((row, k) => {
              const tone =
                row.kind === "positive" ? "#FFFBF0" : row.kind === "warn" ? "#FFE8EC" : "transparent";
              return (
                <div
                  key={k}
                  className="row"
                  style={{ padding: 8, borderRadius: 10, background: k % 2 ? tone : "transparent" }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: "#FFF1D6",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 16,
                    }}
                  >
                    {row.icon}
                  </div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{row.label}</div>
                  <div className="tiny muted">{row.time}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="stack" style={{ gap: 14 }}>
          <div className="card" style={{ padding: 20 }}>
            <h2>Safety controls</h2>
            <div className="stack" style={{ marginTop: 12, gap: 10 }}>
              {(
                [
                  ["Quiet hour at 9 PM", true],
                  ["DMs disabled (group chat only)", true],
                  ["Photo sharing requires parent approval", false],
                  ["Weekly email digest", true],
                  ["Real-time strike alerts", true],
                ] as const
              ).map(([l, on], i) => (
                <div key={i} className="row" style={{ padding: 8 }}>
                  <div style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{l}</div>
                  <div
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 999,
                      background: on ? "#7DCE82" : "#2B234020",
                      position: "relative",
                      transition: "background .2s",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 2,
                        left: on ? 22 : 2,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "#fff",
                        boxShadow: "0 1px 3px #0002",
                        transition: "left .2s",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 20, background: "linear-gradient(135deg,#FFF8E8,#FFEFC9)" }}>
            <div className="row">
              <Angel size={50} />
              <div>
                <div style={{ fontWeight: 900 }}>This week from Gabriel</div>
                <div className="tiny muted">Weekly kindness report</div>
              </div>
            </div>
            <p style={{ marginTop: 10, fontSize: 14, color: "#5A4E7A", fontStyle: "italic" }}>
              &quot;{user.name.split(" ")[0]} had a beautiful week — prayed for 4 friends, welcomed 1 new kid, zero
              unkind words. I gave her a Helper badge today. 💛&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
