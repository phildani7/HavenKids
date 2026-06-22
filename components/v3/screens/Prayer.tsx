import React from "react";
import type { ChangeEvent } from "react";
import type { PrayerVM } from "@/components/v3/types";

interface PrayerProps {
  prayerView: PrayerVM[];
  prayerDraft: string;
  onPrayerDraft: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function PrayerScreen({ prayerView, prayerDraft, onPrayerDraft }: PrayerProps) {
  return (
    <div className="fh-surface" style={{ maxWidth: 640, margin: "0 auto", padding: "34px 24px 90px" }}>
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#8A82A8" }}>Prayer Wall · quiet water</div>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 32, letterSpacing: "-.02em", margin: "8px 0 4px" }}>Lift each other up</h1>
        <p style={{ fontSize: 14.5, color: "#5A4E7A", fontWeight: 500 }}>Post a request, or tap the lamp to pray with someone today.</p>
      </div>
      <div style={{ background: "#fff", borderRadius: 20, border: "1.5px solid rgba(43,35,64,.06)", boxShadow: "0 8px 22px rgba(43,35,64,.06)", padding: 16, marginBottom: 18 }}>
        <input value={prayerDraft} onChange={onPrayerDraft} placeholder="Share a prayer request…" style={{ width: "100%", padding: "13px 16px", border: "1.5px solid rgba(43,35,64,.1)", borderRadius: 14, background: "#FFF8EC", fontSize: 14, fontWeight: 600, outline: "none" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button onClick={() => {}} style={{ padding: "9px 20px", borderRadius: 999, fontWeight: 800, fontSize: 13, background: "var(--c-primary,#1F7A8C)", color: "#fff", boxShadow: "0 var(--shadow-off,3px) 0 0 var(--c-primary-deep,#15616f)" }}>Post request</button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {prayerView.map((p) => (
          <div key={p.id} style={p.cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 19, background: "#FFF8EC", border: `2.5px solid ${p.uColor}` }}>{p.uAvatar}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13.5 }}>{p.uName}</div>
                <div style={{ fontSize: 11.5, color: "#8A82A8", fontWeight: 600 }}>{p.time} ago</div>
              </div>
              {p.answered && <span style={{ padding: "4px 11px", borderRadius: 999, background: "rgba(79,176,88,.16)", color: "#2F7A3A", fontSize: 11, fontWeight: 800 }}>✓ Answered</span>}
            </div>
            <p style={{ margin: "11px 0 0", fontSize: 15, lineHeight: 1.5, color: "#2B2340", fontWeight: 500 }}>{p.text}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
              <button onClick={p.onClick} style={p.btnStyle}><span>🕯️</span><span>{p.btnLabel}</span></button>
              <div style={{ fontSize: 12.5, color: "#8A82A8", fontWeight: 700 }}>{p.count} praying</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
