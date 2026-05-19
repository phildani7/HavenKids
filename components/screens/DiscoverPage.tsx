"use client";
/* HAVEN KIDS — Discover page. Ported from screens-community.jsx */

import { useState } from "react";
import { HAVEN_DATA } from "@/lib/data";
import type { Route } from "@/components/HavenApp";

export function DiscoverPage({ setRoute }: { setRoute: (r: Route) => void }) {
  const D = HAVEN_DATA;
  const [cat, setCat] = useState("all");
  const cats = [
    { id: "all", label: "All", icon: "✨" },
    { id: "spiritual", label: "Spiritual", icon: "📖" },
    { id: "creative", label: "Creative", icon: "🎨" },
    { id: "learning", label: "Learning", icon: "📚" },
    { id: "active", label: "Active", icon: "⚽" },
    { id: "hobby", label: "Hobbies", icon: "🎯" },
  ];

  return (
    <div style={{ padding: "20px 28px 80px", maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <h1 style={{ whiteSpace: "nowrap" }}>Discover Communities</h1>
          <div className="muted" style={{ marginTop: 6 }}>
            All public. All free. All watched over by Gabriel.
          </div>
        </div>
        <button className="btn btn-gold" style={{ flexShrink: 0 }}>
          ✨ Create a Community
        </button>
      </div>

      <div className="pill-row" style={{ marginBottom: 20 }}>
        {cats.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={"chip " + (cat === c.id ? "is-active" : "")}
            style={{ cursor: "pointer", padding: "10px 16px", fontSize: 14 }}
          >
            <span>{c.icon}</span>
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {D.communities.map((c) => (
          <button
            key={c.id}
            onClick={() => setRoute({ page: "community", communityId: c.id })}
            className="card"
            style={{ padding: 0, overflow: "hidden", textAlign: "left", cursor: "pointer" }}
          >
            <div style={{ height: 110, background: c.cover, position: "relative", borderBottom: "2px solid #2B234010" }}>
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  bottom: -22,
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  background: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 28,
                  border: "3px solid #fff",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                {c.emoji}
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#ffffffcc",
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                🌐 Public · Free
              </div>
            </div>
            <div style={{ padding: "30px 16px 16px" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 18 }}>{c.name}</div>
              <div className="muted small" style={{ marginTop: 4 }}>
                {c.blurb}
              </div>
              <div
                className="row"
                style={{ marginTop: 12, gap: 10, fontSize: 12, fontWeight: 800, color: "var(--ink-soft)" }}
              >
                <span>👥 {c.members.toLocaleString()}</span>
                <span>📝 {c.posts.toLocaleString()}</span>
                <div style={{ flex: 1 }} />
                <span className="chip" style={{ background: "#FFF1D6", color: "#8A6B00" }}>
                  Join →
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
