import React from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import type { DmThreadVM, DmMessageVM } from "@/components/v3/types";

interface MessagesProps {
  dmThreads: DmThreadVM[];
  activeThread: { name: string; avatar: string; status: string };
  activeMessages: DmMessageVM[];
  dmDraft: string;
  onDmDraft: (e: ChangeEvent<HTMLInputElement>) => void;
  onDmKey: (e: KeyboardEvent<HTMLInputElement>) => void;
  sendDm: () => void;
}

export function MessagesScreen(props: MessagesProps) {
  const { dmThreads, activeThread, activeMessages, dmDraft, onDmDraft, onDmKey, sendDm } = props;
  return (
    <div className="fh-surface" style={{ height: "calc(100vh - 71px)", display: "grid", gridTemplateColumns: "300px 1fr" }}>
      <div style={{ borderRight: "1px solid rgba(255,255,255,.1)", padding: "20px 14px", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 8px 16px" }}>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 22, color: "#EAF6F4" }}>Messages</h2>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#7FC9D6", padding: "3px 9px", borderRadius: 999, background: "rgba(127,201,214,.14)" }}>deep water</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {dmThreads.map((t, i) => (
            <button key={i} onClick={t.onClick} style={t.style}>
              <span style={{ position: "relative", width: 44, height: 44, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 22, background: "rgba(255,255,255,.1)", flexShrink: 0 }}>
                {t.avatar}
                {t.online && <span style={{ position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: "50%", background: "#7DCE82", border: "2px solid #0E3A45" }} />}
              </span>
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#EAF6F4" }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "#9FC4CC", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.preview}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 20, background: "rgba(255,255,255,.1)" }}>{activeThread.avatar}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#EAF6F4" }}>{activeThread.name}</div>
            <div style={{ fontSize: 12, color: "#7FC9D6", fontWeight: 600 }}>{activeThread.status}</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {activeMessages.map((m, i) => (
            <div key={i} style={m.rowStyle}>
              {m.showName && <div style={m.nameStyle}>{m.name}</div>}
              <div style={m.bubbleStyle}>{m.text}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,.1)", display: "flex", gap: 10, alignItems: "center" }}>
          <input value={dmDraft} onChange={onDmDraft} onKeyDown={onDmKey} placeholder="Message — stays between you" style={{ flex: 1, padding: "12px 18px", borderRadius: 999, border: "1.5px solid rgba(255,255,255,.16)", background: "rgba(255,255,255,.07)", color: "#EAF6F4", fontSize: 14, fontWeight: 500, outline: "none" }} />
          <button onClick={sendDm} style={{ width: 44, height: 44, borderRadius: "50%", background: "#7FC9D6", color: "#0E3A45", fontSize: 18, fontWeight: 800, display: "grid", placeItems: "center" }}>↑</button>
        </div>
      </div>
    </div>
  );
}
