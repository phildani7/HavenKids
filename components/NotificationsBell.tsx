"use client";

import { useEffect, useRef, useState } from "react";
import { HAVEN_DATA } from "@/lib/data";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = HAVEN_DATA.notifications.length;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn btn-ghost btn-sm"
        aria-label="Notifications"
        style={{ position: "relative" }}
      >
        🔔 <span>{unread}</span>
      </button>
      {open && (
        <div
          className="card"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 340,
            padding: 0,
            overflow: "hidden",
            zIndex: 300,
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "2px solid #2B234010",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16 }}>Notifications</div>
            <div style={{ flex: 1 }} />
            <span className="chip" style={{ padding: "4px 10px", fontSize: 11 }}>
              {unread} new
            </span>
          </div>
          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {HAVEN_DATA.notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "12px 14px",
                  width: "100%",
                  textAlign: "left",
                  borderBottom: "1px solid #2B234010",
                  cursor: "pointer",
                  background: "#FFFBF0",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: `var(--${n.color})`,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 18,
                    flexShrink: 0,
                    boxShadow: "0 2px 0 0 #0002",
                  }}
                >
                  {n.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 13, lineHeight: 1.2 }}>{n.title}</div>
                  <div className="tiny" style={{ color: "var(--ink-soft)", marginTop: 2, lineHeight: 1.35 }}>
                    {n.body}
                  </div>
                </div>
                <div className="tiny muted" style={{ flexShrink: 0 }}>
                  {n.time}
                </div>
              </button>
            ))}
          </div>
          <div style={{ padding: "10px 14px", textAlign: "center" }}>
            <button className="btn btn-sm btn-ghost" style={{ width: "100%", justifyContent: "center" }}>
              ✓ Mark all read
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
