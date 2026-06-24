import React from "react";
import type { ProfileAdminVM, PendingVM } from "@/components/v3/types";

interface FamilyProps {
  profilesAdmin: ProfileAdminVM[];
  pendingView: PendingVM[];
  pendingPending: number;
  pendingEmpty: boolean;
}

export function FamilyScreen({ profilesAdmin, pendingView, pendingPending, pendingEmpty }: FamilyProps) {
  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: "40px 32px 90px", fontFamily: "'Hanken Grotesk',sans-serif" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 7, background: "#F1F0EC", border: "1px solid #E7E5E1", fontSize: 12, fontWeight: 700, color: "#6E6A7A", letterSpacing: ".02em" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6E6A7A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.4-3 8-7 10-4-2-7-5.6-7-10V6z" /></svg>
        Parent &amp; admin
      </div>
      <h1 style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 800, fontSize: 30, letterSpacing: "-.02em", color: "#1A1A1A", margin: "16px 0 6px" }}>Family &amp; safety</h1>
      <p style={{ fontSize: 15, color: "#6E6A7A", fontWeight: 500, maxWidth: 560, margin: 0 }}>Manage who&apos;s in your family, review what gets shared, and keep watch on safety — calm and in one place.</p>

      {/* profiles */}
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#9A958C", margin: "34px 0 12px" }}>Profiles</div>
      <div style={{ background: "#fff", border: "1px solid #E7E5E1", borderRadius: 12, overflow: "hidden" }}>
        {profilesAdmin.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: "1px solid #F1F0EC" }}>
            <span style={{ width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 20, background: "#F4F3EF", border: "1px solid #E7E5E1", flexShrink: 0 }}>{p.avatar}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1A1A1A" }}>{p.name}</div>
              <div style={{ fontSize: 13, color: "#9A958C", fontWeight: 500 }}>{p.sub}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontSize: 13, color: "#6E6A7A", fontWeight: 600 }}>Posting</span>
              <button onClick={p.onToggle} style={p.switchStyle}><span style={p.knobStyle} /></button>
            </div>
            <button onClick={() => {}} style={{ fontSize: 13, fontWeight: 700, color: "#1B2A2E", padding: "8px 14px", borderRadius: 8, border: "1px solid #E7E5E1", background: "#fff" }}>Manage</button>
          </div>
        ))}
        <button onClick={() => {}} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "15px 20px", fontSize: 14, fontWeight: 700, color: "#1B2A2E", background: "#fff", border: "none", textAlign: "left" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          Add a child
        </button>
      </div>

      {/* pending media */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "34px 0 12px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#9A958C" }}>Photos waiting for you</div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#B7791F", background: "#FBF1DF", border: "1px solid #F0E2C6", padding: "3px 10px", borderRadius: 7 }}>{pendingPending} pending</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pendingView.map((m) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, background: "#fff", border: "1px solid #E7E5E1", borderRadius: 12 }}>
            <div style={{ width: 54, height: 54, borderRadius: 9, background: "repeating-linear-gradient(135deg,#F1F0EC,#F1F0EC 6px,#EAE8E2 6px,#EAE8E2 12px)", border: "1px solid #E7E5E1", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B8B3A8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7.5h3L8.5 5.5h7L17 7.5h3v11H4zM12 11a3 3 0 100 6 3 3 0 000-6z" /></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: "#1A1A1A" }}>{m.kind} from {m.child}</div>
              <div style={{ fontSize: 13, color: "#9A958C", fontWeight: 500 }}>{m.where}</div>
              <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11.5, color: "#B8B3A8", marginTop: 3 }}>{m.id} · {m.time}</div>
            </div>
            {m.resolved && <span style={m.statusStyle}>{m.statusLabel}</span>}
            {m.notResolved && (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={m.decline} style={{ fontSize: 13, fontWeight: 700, color: "#6E6A7A", padding: "8px 15px", borderRadius: 8, border: "1px solid #E7E5E1", background: "#fff" }}>Decline</button>
                <button onClick={m.approve} style={{ fontSize: 13, fontWeight: 700, color: "#fff", padding: "8px 16px", borderRadius: 8, border: "none", background: "#1B2A2E" }}>Approve</button>
              </div>
            )}
          </div>
        ))}
        {pendingEmpty && (
          <div style={{ padding: 30, textAlign: "center", background: "#fff", border: "1px solid #E7E5E1", borderRadius: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1A1A1A" }}>You&apos;re all caught up</div>
            <div style={{ fontSize: 13.5, color: "#9A958C", fontWeight: 500, marginTop: 3 }}>Nothing waiting for review.</div>
          </div>
        )}
      </div>

      {/* safety */}
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#9A958C", margin: "34px 0 12px" }}>Safety</div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", background: "#fff", border: "1px solid #E7E5E1", borderRadius: 12 }}>
        <span style={{ width: 40, height: 40, borderRadius: "50%", background: "#E8F3EC", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E7D52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4 4 10-10" /></svg>
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1A1A1A" }}>No incidents — all clear</div>
          <div style={{ fontSize: 13.5, color: "#9A958C", fontWeight: 500 }}>We&apos;ll alert you here if anything ever needs your attention.</div>
        </div>
      </div>
    </div>
  );
}
