import React from "react";
import type { BadgeVM, PostVM, ShoalItemVM, Profile } from "@/components/v3/types";

interface ProfileProps {
  me: Profile;
  connShoal: ShoalItemVM[];
  myPosts: PostVM[];
  badges: BadgeVM[];
}

export function ProfileScreen({ me, connShoal, myPosts, badges }: ProfileProps) {
  return (
    <div className="fh-surface" style={{ maxWidth: 900, margin: "0 auto", padding: "30px 30px 90px" }}>
      <div style={{ background: "#fff", borderRadius: 24, border: "1.5px solid rgba(43,35,64,.06)", boxShadow: "0 8px 22px rgba(43,35,64,.06)", padding: 26, display: "flex", alignItems: "center", gap: 22 }}>
        <span style={{ width: 96, height: 96, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 48, background: "#EAF6F4", border: "4px solid var(--c-primary,#1F7A8C)" }}>{me.avatar}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 30, letterSpacing: "-.02em" }}>{me.name}</div>
          <div style={{ fontSize: 14, color: "#5A4E7A", fontWeight: 600, marginTop: 2 }}>Level {me.level} · Worship Warriors &amp; 5 more</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
            <div style={{ position: "relative", height: 26, display: "flex", alignItems: "center" }}>
              {connShoal.map((f, i) => (
                <svg key={i} width="22" height="14" viewBox="-5 0 32 20" style={f.style}>
                  <path d="M6 10 Q15 2 24 10 Q15 18 6 10 Z" fill="currentColor" />
                  <path d="M6 10 L0 5 L2.5 10 L0 15 Z" fill="currentColor" />
                </svg>
              ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#5A4E7A" }}>48 in your shoal</div>
          </div>
        </div>
        <button onClick={() => {}} style={{ padding: "11px 22px", borderRadius: 999, fontWeight: 800, fontSize: 14, background: "var(--c-primary,#1F7A8C)", color: "#fff", boxShadow: "0 var(--shadow-off,3px) 0 0 var(--c-primary-deep,#15616f)" }}>Edit profile</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18, marginTop: 18, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {myPosts.map((p) => (
            <div key={p.id} style={{ background: "#fff", borderRadius: 20, border: "1.5px solid rgba(43,35,64,.06)", boxShadow: "0 8px 22px rgba(43,35,64,.06)", padding: 18 }}>
              <div style={{ fontSize: 12, color: "#8A82A8", fontWeight: 600 }}>in {p.cEmoji} {p.cName} · {p.time}</div>
              <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 18, margin: "8px 0 0" }}>{p.title}</h3>
              <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.5, color: "#5A4E7A", fontWeight: 500 }}>{p.body}</p>
            </div>
          ))}
        </div>
        <div style={{ background: "#fff", borderRadius: 20, border: "1.5px solid rgba(43,35,64,.06)", boxShadow: "0 8px 22px rgba(43,35,64,.06)", padding: 16 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 17, marginBottom: 14 }}>Badges</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {badges.map((b, i) => (
              <div key={i} style={b.style} title={b.name}>{b.icon}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
