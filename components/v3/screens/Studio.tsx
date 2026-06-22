"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { COLORS } from "@/lib/v3/data";

// Doodle Studio — a canvas drawing tool reimagined in the v3 Harbour-Light
// language. Adapted from the old components/screens/DoodlePage.tsx
// (brush / eraser / stamp, colour palette, sizes, clear, undo, share),
// restyled with rounded cards, tide/coral/gold accents, and a Gabriel
// kind-words nudge. Age-dial aware via the `prim` / `deep` props.

const PAPER = "#FFFDF5";

// Harbour-Light brush palette + a couple of warm neutrals.
const PALETTE = [
  COLORS.coral,
  COLORS.gold,
  COLORS.reed,
  COLORS.shallows,
  COLORS.tide,
  COLORS.grape,
  "#2B2340",
  "#FFFFFF",
];

const SIZES = [3, 8, 16, 28];
const STAMPS = ["✝", "❤️", "⭐", "🌈", "🕊️", "😇", "🙏", "🌻", "🐑", "☀️", "🔥", "💧"];

type Tool = "brush" | "eraser" | "stamp";

interface StudioProps {
  prim: string;
  deep: string;
  reduceMotion: boolean;
}

interface FriendCursor {
  id: string;
  name: string;
  avatar: string;
  color: string;
  x: number;
  y: number;
}

export function StudioScreen({ prim, deep, reduceMotion }: StudioProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  // Undo stack of canvas snapshots (data URLs).
  const history = useRef<string[]>([]);

  const [color, setColor] = useState<string>(COLORS.coral);
  const [size, setSize] = useState(8);
  const [tool, setTool] = useState<Tool>("brush");
  const [stamp, setStamp] = useState("✝");
  const [shared, setShared] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  // Paint a blank page (and clear undo history).
  const resetCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    history.current.push(canvas.toDataURL());
    if (history.current.length > 30) history.current.shift();
    setCanUndo(history.current.length > 0);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = (e as React.TouchEvent).touches?.[0];
    const mouse = e as React.MouseEvent;
    return {
      x: (touch ? touch.clientX : mouse.clientX) - rect.left,
      y: (touch ? touch.clientY : mouse.clientY) - rect.top,
    };
  };

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    pushHistory();
    if (tool === "stamp") {
      ctx.font = `${size * 3}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(stamp, pos.x, pos.y);
      return;
    }
    drawing.current = true;
    last.current = pos;
  };

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current || !last.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.strokeStyle = tool === "eraser" ? PAPER : color;
    ctx.lineWidth = tool === "eraser" ? size * 2 : size;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    last.current = pos;
  };

  const onUp = () => {
    drawing.current = false;
    last.current = null;
  };

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const prev = history.current.pop();
    setCanUndo(history.current.length > 0);
    if (!prev) {
      resetCanvas();
      return;
    }
    const img = new Image();
    img.onload = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
    };
    img.src = prev;
  }, [resetCanvas]);

  const clear = useCallback(() => {
    pushHistory();
    resetCanvas();
  }, [pushHistory, resetCanvas]);

  const share = useCallback(() => {
    // Demo / no-op like other v3 actions — surfaces a friendly confirmation.
    setShared(true);
    window.setTimeout(() => setShared(false), 2400);
  }, []);

  // Simulated friends drawing alongside you (bobbing cursors).
  const [friends, setFriends] = useState<FriendCursor[]>([
    { id: "f1", name: "Caleb", avatar: "🐼", color: COLORS.shallows, x: 30, y: 40 },
    { id: "f2", name: "Maya", avatar: "🦊", color: COLORS.coral, x: 70, y: 60 },
    { id: "f3", name: "Ezra", avatar: "🐻", color: COLORS.reed, x: 50, y: 25 },
  ]);
  useEffect(() => {
    if (reduceMotion) return;
    const t = window.setInterval(() => {
      setFriends((fs) =>
        fs.map((f) => ({
          ...f,
          x: Math.max(6, Math.min(94, f.x + (Math.random() - 0.5) * 10)),
          y: Math.max(6, Math.min(94, f.y + (Math.random() - 0.5) * 10)),
        })),
      );
    }, 1600);
    return () => window.clearInterval(t);
  }, [reduceMotion]);

  const toolBtn = (active: boolean): CSSProperties => ({
    width: 54,
    height: 54,
    borderRadius: 16,
    fontSize: 22,
    display: "grid",
    placeItems: "center",
    background: active ? prim : "#FFF8EC",
    color: active ? "#fff" : "#2B2340",
    border: active ? "none" : "1.5px solid rgba(43,35,64,.08)",
    boxShadow: active ? `0 var(--shadow-off,3px) 0 0 ${deep}` : "0 1px 2px rgba(43,35,64,.06)",
  });

  const ghostBtn: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 999,
    fontSize: 12.5,
    fontWeight: 800,
    background: "rgba(255,255,255,.92)",
    color: "#2B2340",
    border: "1.5px solid rgba(43,35,64,.1)",
    boxShadow: "0 2px 8px rgba(43,35,64,.12)",
  };

  return (
    <div className="fh-surface" style={{ maxWidth: 1180, margin: "0 auto", padding: "26px 30px 90px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#8A82A8" }}>
            Studio · group doodle
          </div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 32, letterSpacing: "-.02em", margin: "6px 0 0" }}>
            Rainbow Promise canvas
          </h1>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center" }}>
          {friends.map((f, i) => (
            <span
              key={f.id}
              title={f.name}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontSize: 17,
                background: "#EAF6F4",
                border: `2.5px solid ${f.color}`,
                marginLeft: i === 0 ? 0 : -8,
              }}
            >
              {f.avatar}
            </span>
          ))}
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 13px", borderRadius: 999, background: "rgba(79,176,88,.16)", color: "#2F7A3A", fontSize: 12, fontWeight: 800 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4FB058" }} />
          4 drawing
        </span>
        <button
          onClick={share}
          style={{ padding: "10px 18px", borderRadius: 999, fontSize: 13, fontWeight: 800, background: prim, color: "#fff", boxShadow: `0 var(--shadow-off,3px) 0 0 ${deep}` }}
        >
          {shared ? "Shared to Art Angels ✓" : "Share to community"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "78px 1fr 230px", gap: 16, alignItems: "start" }}>
        {/* tool rail */}
        <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid rgba(43,35,64,.06)", boxShadow: "0 8px 22px rgba(43,35,64,.06)", padding: 11, position: "sticky", top: 88, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          {(
            [
              ["brush", "🖌️"],
              ["eraser", "🧼"],
              ["stamp", "✨"],
            ] as const
          ).map(([tl, icon]) => (
            <button key={tl} onClick={() => setTool(tl)} title={tl} style={toolBtn(tool === tl)}>
              {icon}
            </button>
          ))}
          <div style={{ width: "100%", height: 1.5, background: "rgba(43,35,64,.08)", margin: "4px 0" }} />
          {SIZES.map((s) => {
            const on = size === s;
            return (
              <button
                key={s}
                onClick={() => setSize(s)}
                title={`${s}px`}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  display: "grid",
                  placeItems: "center",
                  background: on ? "#FFF8EC" : "transparent",
                  border: on ? "2px solid #FFC94A" : "2px solid transparent",
                }}
              >
                <span style={{ width: s, height: s, borderRadius: "50%", background: color === "#FFFFFF" ? "#2B2340" : color, display: "block" }} />
              </button>
            );
          })}
        </div>

        {/* canvas */}
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
              borderRadius: "var(--radius-lg,20px)",
              background: PAPER,
              border: "1.5px solid rgba(43,35,64,.1)",
              boxShadow: "0 12px 30px rgba(43,35,64,.1)",
              cursor: "crosshair",
              touchAction: "none",
              display: "block",
            }}
          />
          {friends.map((f) => (
            <div
              key={f.id}
              style={{
                position: "absolute",
                left: `${f.x}%`,
                top: `${f.y}%`,
                transition: reduceMotion ? "none" : "left 1.6s ease, top 1.6s ease",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "9px solid transparent",
                  borderRight: "9px solid transparent",
                  borderTop: `13px solid ${f.color}`,
                  transform: "rotate(-30deg)",
                }}
              />
              <div style={{ background: f.color, color: "#fff", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 800, marginTop: 2, whiteSpace: "nowrap" }}>
                {f.avatar} {f.name}
              </div>
            </div>
          ))}
          <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", gap: 8 }}>
            <button onClick={clear} style={ghostBtn}>🗑 Clear</button>
            <button onClick={undo} disabled={!canUndo} style={{ ...ghostBtn, opacity: canUndo ? 1 : 0.45 }}>↶ Undo</button>
          </div>
        </div>

        {/* right rail: colours, stickers, Gabriel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid rgba(43,35,64,.06)", boxShadow: "0 8px 22px rgba(43,35,64,.06)", padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#8A82A8" }}>Colors</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 10 }}>
              {PALETTE.map((c) => {
                const on = color === c && tool !== "eraser";
                return (
                  <button
                    key={c}
                    onClick={() => {
                      setColor(c);
                      if (tool === "eraser") setTool("brush");
                    }}
                    title={c}
                    style={{
                      aspectRatio: "1",
                      borderRadius: 12,
                      background: c,
                      border: on ? "3px solid #2B2340" : "1.5px solid rgba(43,35,64,.14)",
                      boxShadow: "0 1px 2px rgba(43,35,64,.12)",
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid rgba(43,35,64,.06)", boxShadow: "0 8px 22px rgba(43,35,64,.06)", padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#8A82A8" }}>Stickers</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginTop: 10 }}>
              {STAMPS.map((s) => {
                const on = stamp === s && tool === "stamp";
                return (
                  <button
                    key={s}
                    onClick={() => {
                      setTool("stamp");
                      setStamp(s);
                    }}
                    style={{
                      aspectRatio: "1",
                      borderRadius: 10,
                      fontSize: 19,
                      display: "grid",
                      placeItems: "center",
                      background: on ? "#FFF8EC" : "#FFF8EC88",
                      border: on ? "2px solid #FFC94A" : "1.5px solid transparent",
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ borderRadius: 16, padding: 14, background: "linear-gradient(135deg,#FFF8EC,#FFEFC9)", border: "1.5px solid rgba(232,168,37,.3)" }}>
            <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
              <svg width="38" height="38" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
                <ellipse cx="22" cy="58" rx="16" ry="20" fill="#fff" stroke="#E8C7F0" strokeWidth="2" />
                <ellipse cx="78" cy="58" rx="16" ry="20" fill="#fff" stroke="#E8C7F0" strokeWidth="2" />
                <path d="M30 78 q0 -18 20 -18 q20 0 20 18 v8 h-40 z" fill="#FFF1D6" stroke="#2B2340" strokeWidth="2" />
                <circle cx="50" cy="48" r="17" fill="#FFE0C2" stroke="#2B2340" strokeWidth="2" />
                <circle cx="42" cy="50" r="2.5" fill="#2B2340" />
                <circle cx="58" cy="50" r="2.5" fill="#2B2340" />
                <path d="M42 58 q8 6 16 0" stroke="#2B2340" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <ellipse cx="50" cy="27" rx="15" ry="3.6" fill="none" stroke="#FFC94A" strokeWidth="3" />
              </svg>
              <div>
                <div style={{ fontWeight: 800, fontSize: 12.5, color: "#2B2340" }}>Gabriel</div>
                <div style={{ fontFamily: "'Caveat',cursive", fontSize: 15, fontWeight: 700, color: "#8A6B00", lineHeight: 1.25, marginTop: 2 }}>
                  Draw kind, draw brave — I&apos;m watching every stroke for safety.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
