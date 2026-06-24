import React from "react";
import type { PostVM } from "@/components/v3/types";

// Full post card (Home feed) with image, angel note, tags, reactions.
export function PostCard({ p }: { p: PostVM }) {
  return (
    <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 var(--shadow-off,3px) 0 0 rgba(43,35,64,.05),0 8px 22px rgba(43,35,64,.06)", border: "1.5px solid rgba(43,35,64,.06)", padding: 18 }}>
      {p.pinned && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 11, background: "#FFF4C4", color: "#8A6B00", padding: "4px 11px", borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>
          📌 Pinned
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 44, height: 44, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 22, background: "#FFF8EC", border: `2.5px solid ${p.uColor}` }}>{p.uAvatar}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>{p.uName}</div>
          <div style={{ fontSize: 12, color: "#8A82A8", fontWeight: 600 }}>
            in <span style={{ color: "#5A4E7A", fontWeight: 700 }}>{p.cEmoji} {p.cName}</span> · {p.time}
          </div>
        </div>
        {p.crossShared && (
          <span title={p.shareNote} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, background: "rgba(31,122,140,.1)", color: "#15616F", fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap" }}>
            <span>{p.shareIcon}</span><span>{p.shareLabel}</span>
          </span>
        )}
      </div>
      <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 19, lineHeight: 1.2, margin: "13px 0 0" }}>{p.title}</h3>
      <p style={{ margin: "7px 0 0", fontSize: 14.5, lineHeight: 1.5, color: "#5A4E7A", fontWeight: 500 }}>{p.body}</p>

      {p.crossShared && (
        <div style={{ marginTop: 11, display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 10, background: "#FFF8EC", color: "#8A6B00", fontSize: 12, fontWeight: 600 }}>
          <span>{p.shareIcon}</span><span>{p.shareNote}</span>
        </div>
      )}

      {p.image && (
        <div style={{ marginTop: 13, height: 190, borderRadius: 16, background: p.imageBg, display: "grid", placeItems: "center", border: "1.5px solid rgba(43,35,64,.08)", position: "relative", overflow: "hidden" }}>
          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(43,35,64,.42)", background: "rgba(255,255,255,.55)", padding: "5px 11px", borderRadius: 999 }}>{p.imageLabel}</div>
        </div>
      )}

      {p.angelNote && (
        <div style={{ marginTop: 13, display: "flex", alignItems: "center", gap: 11, padding: "10px 14px", borderRadius: 14, background: "linear-gradient(135deg,#FFF8EC,#FFF1D6)", border: "1.5px solid rgba(255,201,74,.4)" }}>
          <svg width="30" height="30" viewBox="0 0 100 100">
            <ellipse cx="22" cy="58" rx="16" ry="20" fill="#fff" stroke="#E8C7F0" strokeWidth="2" />
            <ellipse cx="78" cy="58" rx="16" ry="20" fill="#fff" stroke="#E8C7F0" strokeWidth="2" />
            <path d="M30 78 q0 -18 20 -18 q20 0 20 18 v8 h-40 z" fill="#FFF1D6" stroke="#2B2340" strokeWidth="2" />
            <circle cx="50" cy="48" r="17" fill="#FFE0C2" stroke="#2B2340" strokeWidth="2" />
            <circle cx="42" cy="50" r="2.4" fill="#2B2340" />
            <circle cx="58" cy="50" r="2.4" fill="#2B2340" />
            <path d="M42 58 q8 6 16 0" stroke="#2B2340" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <ellipse cx="50" cy="27" rx="15" ry="3.6" fill="none" stroke="#FFC94A" strokeWidth="3" />
          </svg>
          <div style={{ fontFamily: "'Caveat',cursive", fontSize: 17, fontWeight: 700, color: "#8A6B00" }}>{p.angelNote}</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 14 }}>
        {p.tagList.map((tg, i) => (
          <button key={i} onClick={tg.onClick} style={tg.style}><span>{tg.icon}</span><span>{tg.label}</span></button>
        ))}
      </div>

      <div style={{ height: 1, background: "rgba(43,35,64,.07)", margin: "14px 0" }} />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {p.reactionList.map((r) => (
          <button key={r.key} onClick={r.onClick} style={r.style}><span>{r.icon}</span><span>{r.count}</span></button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => {}} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 999, background: "rgba(43,35,64,.05)", fontSize: 13, fontWeight: 700, color: "#5A4E7A" }}>💬 {p.comments}</button>
        <button onClick={() => {}} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 999, background: "rgba(43,35,64,.05)", fontSize: 13, fontWeight: 700, color: "#5A4E7A" }}>↗ Share</button>
      </div>
    </div>
  );
}

// Compact post card (search / community / tag / profile feeds).
export function MiniPostCard({ p, showCommunity = true }: { p: PostVM; showCommunity?: boolean }) {
  return (
    <div style={{ background: "#fff", borderRadius: 20, border: "1.5px solid rgba(43,35,64,.06)", boxShadow: "0 6px 18px rgba(43,35,64,.05)", padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 42, height: 42, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 21, background: "#FFF8EC", border: `2.5px solid ${p.uColor}` }}>{p.uAvatar}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>{p.uName}</div>
          <div style={{ fontSize: 12, color: "#8A82A8", fontWeight: 600 }}>
            {showCommunity ? <>in {p.cEmoji} {p.cName} · {p.time}</> : p.time}
          </div>
        </div>
      </div>
      <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 18, margin: "12px 0 0" }}>{p.title}</h3>
      <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.5, color: "#5A4E7A", fontWeight: 500 }}>{p.body}</p>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
        {p.tagList.map((tg, i) => (
          <button key={i} onClick={tg.onClick} style={tg.style}><span>{tg.icon}</span><span>{tg.label}</span></button>
        ))}
      </div>
    </div>
  );
}
