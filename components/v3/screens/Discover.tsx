import React from "react";
import type { DiscoverVM } from "@/components/v3/types";

export function DiscoverScreen({ discoverView }: { discoverView: DiscoverVM[] }) {
  return (
    <div className="fh-surface" style={{ maxWidth: 1100, margin: "0 auto", padding: "30px 30px 90px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#8A82A8" }}>Discover</div>
      <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 34, letterSpacing: "-.02em", margin: "8px 0 4px" }}>Harbors to sail into</h1>
      <p style={{ fontSize: 15, color: "#5A4E7A", fontWeight: 500, maxWidth: 560, margin: "0 0 22px" }}>Each community is its own water. Look across the harbor — the busier the shoal, the more alive it is right now.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {discoverView.map((c) => (
          <div key={c.id} style={{ background: "#fff", borderRadius: 20, border: "1.5px solid rgba(43,35,64,.06)", boxShadow: "0 var(--shadow-off,3px) 0 0 rgba(43,35,64,.05),0 8px 22px rgba(43,35,64,.06)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ height: 96, background: c.cover, position: "relative", display: "flex", alignItems: "flex-end", padding: 12 }}>
              <span style={{ position: "absolute", top: 12, left: 12, width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,.9)", display: "grid", placeItems: "center", fontSize: 23, boxShadow: "0 3px 10px rgba(0,0,0,.12)" }}>{c.emoji}</span>
              <div style={{ position: "relative", height: 24, flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                {c.shoal.map((f, i) => (
                  <svg key={i} width="20" height="13" viewBox="-5 0 32 20" style={f.style}>
                    <path d="M6 10 Q15 2 24 10 Q15 18 6 10 Z" fill="rgba(255,255,255,.85)" />
                    <path d="M6 10 L0 5 L2.5 10 L0 15 Z" fill="rgba(255,255,255,.85)" />
                  </svg>
                ))}
              </div>
            </div>
            <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 18 }}>{c.name}</div>
              <p style={{ fontSize: 13, color: "#5A4E7A", fontWeight: 500, margin: "5px 0 0", lineHeight: 1.4, flex: 1 }}>{c.blurb}</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                <div style={{ fontSize: 12, color: "#8A82A8", fontWeight: 700 }}>{c.membersLabel} members</div>
                <button onClick={c.onClick} style={{ padding: "8px 16px", borderRadius: 999, fontWeight: 800, fontSize: 13, background: "var(--c-primary,#1F7A8C)", color: "#fff", boxShadow: "0 var(--shadow-off,3px) 0 0 var(--c-primary-deep,#15616f)" }}>Enter</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
