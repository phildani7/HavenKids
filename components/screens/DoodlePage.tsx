"use client";
/* HAVEN KIDS — Doodle canvas. Ported from screens-features.jsx */

import { useEffect, useRef, useState } from "react";
import { Angel, Avatar } from "@/components/primitives";
import { logActivity } from "@/lib/activity";
import type { User } from "@/lib/data";

export function DoodlePage({ user }: { user: User }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState("#FF7E6B");
  const [size, setSize] = useState(8);
  const [tool, setTool] = useState<"brush" | "eraser" | "stamp">("brush");
  const [stamp, setStamp] = useState("✝️");
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const colors = ["#FF7E6B", "#FFC94A", "#7DCE82", "#7AC7F2", "#B47EE5", "#F58BB3", "#2B2340", "#FFFFFF"];
  const sizes = [3, 8, 16, 28];
  const stamps = ["✝️", "❤️", "⭐", "🌈", "🕊️", "😇", "🙏", "🌻", "🐑", "☀️", "🔥", "💧"];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(2, 2);
    ctx.fillStyle = "#FFFDF5";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const touch = (e as React.TouchEvent).touches?.[0];
    const mouse = e as React.MouseEvent;
    return {
      x: (touch ? touch.clientX : mouse.clientX) - rect.left,
      y: (touch ? touch.clientY : mouse.clientY) - rect.top,
    };
  };

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPos(e);
    if (tool === "stamp") {
      const ctx = canvasRef.current!.getContext("2d")!;
      ctx.font = `${size * 3}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(stamp, pos.x, pos.y);
      logActivity("doodle_stroke", { tool: "stamp", stamp });
      return;
    }
    drawing.current = true;
    last.current = pos;
  };
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current || !last.current) return;
    const pos = getPos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.strokeStyle = tool === "eraser" ? "#FFFDF5" : color;
    ctx.lineWidth = tool === "eraser" ? size * 2 : size;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    last.current = pos;
  };
  const onUp = () => {
    if (drawing.current) logActivity("doodle_stroke", { tool, size, color });
    drawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#FFFDF5";
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  // simulated friend cursors
  const [friends, setFriends] = useState([
    { id: "f1", name: "Caleb", avatar: "🦊", color: "#7AC7F2", x: 30, y: 40 },
    { id: "f2", name: "Maya", avatar: "🐰", color: "#F58BB3", x: 70, y: 60 },
    { id: "f3", name: "Ezra", avatar: "🐼", color: "#7DCE82", x: 50, y: 25 },
  ]);
  useEffect(() => {
    const t = setInterval(() => {
      setFriends((fs) =>
        fs.map((f) => ({
          ...f,
          x: Math.max(5, Math.min(95, f.x + (Math.random() - 0.5) * 10)),
          y: Math.max(5, Math.min(95, f.y + (Math.random() - 0.5) * 10)),
        }))
      );
    }, 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ padding: "20px 28px 80px", maxWidth: 1400, margin: "0 auto" }}>
      <div className="row" style={{ marginBottom: 16 }}>
        <h1>🎨 Group Doodle — Rainbow Promise</h1>
        <div style={{ flex: 1 }} />
        <div className="row" style={{ gap: 0 }}>
          {friends.map((f, i) => (
            <div key={f.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
              <Avatar user={{ avatar: f.avatar, color: "gold" }} size={34} ring />
            </div>
          ))}
          <div style={{ marginLeft: -8 }}>
            <Avatar user={user} size={36} ring />
          </div>
        </div>
        <span className="chip" style={{ background: "#E8F9E2", color: "#2F7A3A" }}>
          🟢 4 drawing
        </span>
        <button className="btn btn-sm btn-ghost">💾 Save to Feed</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 220px", gap: 16 }}>
        <div className="card" style={{ padding: 10, height: "fit-content", position: "sticky", top: 80 }}>
          <div className="stack" style={{ gap: 6, alignItems: "center" }}>
            {(
              [
                ["brush", "🖌️"],
                ["eraser", "🧼"],
                ["stamp", "✨"],
              ] as const
            ).map(([t, icon]) => (
              <button
                key={t}
                onClick={() => setTool(t)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: tool === t ? "var(--ink)" : "#FFF8E8",
                  color: tool === t ? "#fff" : "var(--ink)",
                  fontSize: 22,
                  boxShadow: tool === t ? "0 3px 0 0 rgba(43,35,64,.3)" : "0 2px 0 0 #0001",
                }}
              >
                {icon}
              </button>
            ))}
            <div className="divider" style={{ width: "100%", margin: "6px 0" }} />
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: size === s ? "#FFF1D6" : "transparent",
                  display: "grid",
                  placeItems: "center",
                  border: size === s ? "2px solid #FFC94A" : "2px solid transparent",
                }}
              >
                <div style={{ width: s, height: s, borderRadius: "50%", background: color }} />
              </button>
            ))}
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <canvas
            ref={canvasRef}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchStart={onDown}
            onTouchMove={onMove}
            onTouchEnd={onUp}
            style={{
              width: "100%",
              height: 560,
              borderRadius: 24,
              background: "#FFFDF5",
              border: "3px solid #2B2340",
              boxShadow: "var(--shadow-lg)",
              cursor: "crosshair",
              touchAction: "none",
            }}
          />
          {friends.map((f) => (
            <div
              key={f.id}
              style={{
                position: "absolute",
                left: `${f.x}%`,
                top: `${f.y}%`,
                transition: "left 1.5s ease, top 1.5s ease",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: `14px solid ${f.color}`,
                  transform: "rotate(-30deg)",
                }}
              />
              <div
                style={{
                  background: f.color,
                  color: "#fff",
                  padding: "2px 8px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 900,
                  marginTop: 2,
                  whiteSpace: "nowrap",
                }}
              >
                {f.avatar} {f.name}
              </div>
            </div>
          ))}
          <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", gap: 8 }}>
            <button className="btn btn-sm btn-ghost" onClick={clearCanvas}>
              🗑️ Clear
            </button>
            <button className="btn btn-sm btn-ghost">↶ Undo</button>
            <button className="btn btn-sm btn-gold">📤 Share</button>
          </div>
        </div>

        <div className="stack" style={{ gap: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "var(--ink-mute)",
              }}
            >
              Colors
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 8 }}>
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 12,
                    background: c,
                    border: color === c ? "3px solid var(--ink)" : "2px solid #0002",
                    boxShadow: "0 2px 0 0 #0002",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "var(--ink-mute)",
              }}
            >
              Stickers
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginTop: 8 }}>
              {stamps.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setTool("stamp");
                    setStamp(s);
                  }}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 10,
                    background: stamp === s && tool === "stamp" ? "#FFF1D6" : "#FFF8E8",
                    border: stamp === s && tool === "stamp" ? "2px solid #FFC94A" : "2px solid transparent",
                    fontSize: 20,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 14, background: "linear-gradient(135deg,#FFF8E8,#FFEFC9)" }}>
            <div className="row">
              <Angel size={38} />
              <div style={{ fontSize: 12, fontWeight: 700, color: "#8A6B00" }}>
                Remember: draw kind, draw brave! I&apos;m watching every stroke for safety.
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "var(--ink-mute)",
              }}
            >
              Verse overlay
            </div>
            <button className="btn btn-sm btn-ghost" style={{ width: "100%", marginTop: 8 }}>
              📖 Add today&apos;s verse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
