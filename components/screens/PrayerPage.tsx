"use client";
/* HAVEN KIDS — Prayer Wall. Ported from screens-features.jsx */

import { useState } from "react";
import { HAVEN_DATA, type PrayerRequest } from "@/lib/data";
import { Avatar } from "@/components/primitives";
import { logActivity } from "@/lib/activity";

export function PrayerPage() {
  const D = HAVEN_DATA;
  const [reqs, setReqs] = useState<PrayerRequest[]>(D.prayerRequests);
  const [newReq, setNewReq] = useState("");

  const addPrayer = (id: string) => {
    setReqs((rs) =>
      rs.map((r) => (r.id === id ? { ...r, prayers: r.prayers + 1, justPrayed: true } : r))
    );
    logActivity("pray_for", { requestId: id });
  };

  const submit = () => {
    if (!newReq.trim()) return;
    setReqs((rs) => [
      { id: "n" + Date.now(), user: D.users[0], time: "now", text: newReq, prayers: 0 },
      ...rs,
    ]);
    logActivity("submit_prayer", { chars: newReq.length });
    setNewReq("");
  };

  return (
    <div style={{ padding: "20px 28px 80px", maxWidth: 1000, margin: "0 auto" }}>
      <div
        style={{
          padding: 28,
          borderRadius: 28,
          background: "linear-gradient(135deg,#E0CBFA,#FFC1B6)",
          border: "var(--border)",
          boxShadow: "var(--shadow)",
          position: "relative",
          overflow: "hidden",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: ".12em",
            color: "#6A3A8A",
            textTransform: "uppercase",
          }}
        >
          🙏 The Prayer Wall
        </div>
        <h1 style={{ marginTop: 6 }}>Lift each other up.</h1>
        <div style={{ marginTop: 8, maxWidth: 560, fontWeight: 700 }}>
          Share something you&apos;re praying for, or tap the praying hands to pray for a friend. Gabriel lights a candle
          for each request.
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "var(--ink-mute)",
          }}
        >
          Add a prayer request
        </div>
        <textarea
          value={newReq}
          onChange={(e) => setNewReq(e.target.value)}
          placeholder="What's on your heart? (No last names or addresses — Gabriel will remind you.)"
          rows={3}
          style={{
            marginTop: 8,
            width: "100%",
            padding: 14,
            border: "2px solid #2B234014",
            borderRadius: 16,
            background: "#FFF8E8",
            fontSize: 14,
            outline: "none",
            resize: "vertical",
          }}
        />
        <div className="row" style={{ marginTop: 10 }}>
          <span className="chip" style={{ background: "#FFF1D6", color: "#8A6B00" }}>
            👁️ Public to friends
          </span>
          <span className="chip">🔒 Just Gabriel</span>
          <div style={{ flex: 1 }} />
          <button className="btn btn-grape" onClick={submit}>
            🕯️ Light a candle
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {reqs.map((r) => (
          <div
            key={r.id}
            className="card"
            style={{
              padding: 18,
              position: "relative",
              background: r.answered ? "linear-gradient(135deg,#E8F9E2,#FFFFFF)" : "#fff",
            }}
          >
            {r.answered && (
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#7DCE82",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                }}
              >
                ✓ Answered!
              </div>
            )}
            <div className="row" style={{ gap: 10 }}>
              <Avatar user={r.user} size={36} ring />
              <div>
                <div style={{ fontWeight: 900, fontSize: 13 }}>{r.user.name}</div>
                <div className="tiny muted">{r.time} ago</div>
              </div>
            </div>
            <p
              style={{
                marginTop: 12,
                color: "var(--ink-soft)",
                fontFamily: "var(--font-hand)",
                fontSize: 20,
                lineHeight: 1.3,
              }}
            >
              &quot;{r.text}&quot;
            </p>
            <div className="row" style={{ marginTop: 14 }}>
              <button
                onClick={() => addPrayer(r.id)}
                className="btn btn-sm"
                style={{
                  background: r.justPrayed ? "#7DCE82" : "#B47EE5",
                  boxShadow: `0 3px 0 0 ${r.justPrayed ? "#4FB058" : "#8B5AC2"}`,
                }}
              >
                🙏 {r.justPrayed ? "Prayed!" : "Pray with them"}
              </button>
              <div style={{ flex: 1 }} />
              <div className="tiny" style={{ fontWeight: 800, color: "var(--ink-mute)" }}>
                {r.prayers} friend{r.prayers === 1 ? "" : "s"} praying
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
