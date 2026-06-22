import React from "react";
import type { CalCellVM, CalRsvpVM } from "@/components/v3/types";

interface EventsProps {
  calMonth: string;
  weekdays: string[];
  calWeeks: CalCellVM[][];
  calRsvp: CalRsvpVM[];
}

export function EventsScreen({ calMonth, weekdays, calWeeks, calRsvp }: EventsProps) {
  return (
    <div className="fh-surface" style={{ maxWidth: 1080, margin: "0 auto", padding: "30px 30px 90px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#8A82A8" }}>Calendar</div>
      <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 34, letterSpacing: "-.02em", margin: "8px 0 4px" }}>Gatherings on the water</h1>
      <p style={{ fontSize: 15, color: "#5A4E7A", fontWeight: 500, maxWidth: 560, margin: "0 0 22px" }}>Worship nights, doodle jams, prayer circles and more — across every community you ride.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        {/* month grid */}
        <div style={{ background: "#fff", borderRadius: 22, border: "1.5px solid rgba(43,35,64,.06)", boxShadow: "0 8px 22px rgba(43,35,64,.06)", padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <button onClick={() => {}} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(43,35,64,.05)", fontSize: 15, display: "grid", placeItems: "center" }}>‹</button>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 24, flex: 1 }}>{calMonth}</h2>
            <button onClick={() => {}} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(43,35,64,.05)", fontSize: 15, display: "grid", placeItems: "center" }}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 6 }}>
            {weekdays.map((w, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 800, letterSpacing: ".08em", color: "#8A82A8" }}>{w}</div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {calWeeks.map((week, wi) => (
              <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
                {week.map((c, ci) => (
                  <div key={ci} style={c.cellStyle}>
                    {!c.blank && (
                      <>
                        <span style={c.dateStyle}>{c.date}</span>
                        {(c.events || []).map((e, ei) => (
                          <div key={ei} style={e.chipStyle}>
                            <span>{e.emoji}</span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* upcoming + RSVP */}
        <div style={{ background: "#fff", borderRadius: 22, border: "1.5px solid rgba(43,35,64,.06)", boxShadow: "0 8px 22px rgba(43,35,64,.06)", padding: 18 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 18, marginBottom: 14 }}>Upcoming</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {calRsvp.map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: "#FFFBF2", border: "1.5px solid rgba(43,35,64,.08)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "#8A6B00", letterSpacing: ".06em" }}>{e.day}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, marginTop: -2 }}>{e.date}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, lineHeight: 1.2 }}>{e.title}</div>
                  <div style={{ fontSize: 11.5, color: "#8A82A8", fontWeight: 600 }}>{e.time} · {e.cName}</div>
                </div>
                <button onClick={e.onClick} style={e.rsvpStyle}>{e.rsvpLabel}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
