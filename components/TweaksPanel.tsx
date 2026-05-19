"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

export type Theme = "sunshine" | "cloud";

export function TweaksPanel({
  theme,
  setTheme,
  strikes,
  setStrikes,
  avatar,
  setAvatar,
}: {
  theme: Theme;
  setTheme: Dispatch<SetStateAction<Theme>>;
  strikes: number;
  setStrikes: Dispatch<SetStateAction<number>>;
  avatar: string;
  setAvatar: Dispatch<SetStateAction<string>>;
}) {
  const [open, setOpen] = useState(false);
  const avatars = ["🦄", "🦊", "🐼", "🐰", "🦁", "🐸", "🦉", "🐥", "🐻", "🐙"];

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open tweaks panel"
        style={{
          position: "fixed",
          bottom: 22,
          left: 22,
          zIndex: 200,
          width: 48,
          height: 48,
          borderRadius: 14,
          background: "#fff",
          border: "2px solid #2B234014",
          boxShadow: "var(--shadow)",
          fontSize: 22,
          cursor: "pointer",
        }}
      >
        ⚙️
      </button>
      {open && (
        <div
          className="card"
          style={{
            position: "fixed",
            bottom: 80,
            left: 22,
            zIndex: 220,
            width: 280,
            padding: 16,
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div className="row" style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16 }}>Tweaks</div>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setOpen(false)}
              className="chip"
              style={{ padding: "4px 10px", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>

          <Section title="Theme">
            <div className="pill-row">
              <button
                onClick={() => setTheme("sunshine")}
                className={"chip " + (theme === "sunshine" ? "is-active" : "")}
                style={{ cursor: "pointer" }}
              >
                ☀️ Sunshine
              </button>
              <button
                onClick={() => setTheme("cloud")}
                className={"chip " + (theme === "cloud" ? "is-active" : "")}
                style={{ cursor: "pointer" }}
              >
                ☁️ Cloud
              </button>
            </div>
          </Section>

          <Section title="AI Angel — demo strikes">
            <div className="pill-row">
              {[0, 1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setStrikes(n)}
                  className={"chip " + (strikes === n ? "is-active" : "")}
                  style={{ cursor: "pointer", padding: "6px 12px" }}
                >
                  {n} {n === 0 ? "· good" : n === 3 ? "· paused" : ""}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Avatar">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
              {avatars.map((e) => (
                <button
                  key={e}
                  onClick={() => setAvatar(e)}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 10,
                    background: avatar === e ? "#FFF1D6" : "#FFF8E8",
                    border: avatar === e ? "2px solid #FFC94A" : "2px solid transparent",
                    fontSize: 22,
                    cursor: "pointer",
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </Section>
        </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: "var(--ink-mute)",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
