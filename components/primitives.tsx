"use client";
/* =============================================================
   HAVEN KIDS — shared primitives
   Ported from design/project/components.jsx
   ============================================================= */

import type { CSSProperties } from "react";
import type { BadgeDef, User } from "@/lib/data";

/* ---------- Angel SVG mascot (Gabriel) ---------- */
type Mood = "happy" | "worried" | "sleeping";
export function Angel({
  size = 56,
  mood = "happy",
  style = {},
}: {
  size?: number;
  mood?: Mood;
  style?: CSSProperties;
}) {
  const eyes =
    mood === "sleeping" ? (
      <>
        <path d="M38 52 q4 -4 8 0" stroke="#2B2340" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M54 52 q4 -4 8 0" stroke="#2B2340" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    ) : mood === "worried" ? (
      <>
        <circle cx="42" cy="52" r="2.2" fill="#2B2340" />
        <circle cx="58" cy="52" r="2.2" fill="#2B2340" />
        <path d="M36 48 l8 2 M56 50 l8 -2" stroke="#2B2340" strokeWidth="2" strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx="42" cy="52" r="2.5" fill="#2B2340" />
        <circle cx="58" cy="52" r="2.5" fill="#2B2340" />
      </>
    );
  const mouth =
    mood === "worried" ? (
      <path d="M42 62 q8 -4 16 0" stroke="#2B2340" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    ) : mood === "sleeping" ? (
      <path d="M46 62 q4 2 8 0" stroke="#2B2340" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    ) : (
      <path d="M42 60 q8 6 16 0" stroke="#2B2340" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    );

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <ellipse cx="22" cy="58" rx="18" ry="22" fill="#FFF" stroke="#E8C7F0" strokeWidth="2" />
      <ellipse cx="78" cy="58" rx="18" ry="22" fill="#FFF" stroke="#E8C7F0" strokeWidth="2" />
      <path d="M12 52 q10 4 16 12 M16 66 q8 2 14 8" stroke="#E8C7F0" strokeWidth="1.5" fill="none" />
      <path d="M88 52 q-10 4 -16 12 M84 66 q-8 2 -14 8" stroke="#E8C7F0" strokeWidth="1.5" fill="none" />
      <path d="M30 78 q0 -18 20 -18 q20 0 20 18 v8 h-40 z" fill="#FFF1D6" stroke="#2B2340" strokeWidth="2" />
      <circle cx="50" cy="48" r="18" fill="#FFE0C2" stroke="#2B2340" strokeWidth="2" />
      <circle cx="38" cy="58" r="3" fill="#FFB4B4" opacity=".7" />
      <circle cx="62" cy="58" r="3" fill="#FFB4B4" opacity=".7" />
      {eyes}
      {mouth}
      <ellipse cx="50" cy="28" rx="16" ry="4" fill="none" stroke="#FFC94A" strokeWidth="3" />
      <ellipse cx="50" cy="28" rx="16" ry="4" fill="none" stroke="#FFF4C4" strokeWidth="1.5" />
    </svg>
  );
}

/* ---------- Placeholder illustrations ---------- */
export function PlaceholderImage({ kind = "ark" }: { kind?: "ark" | "rainbow" | "dog" }) {
  const bgs: Record<string, string> = {
    ark: "linear-gradient(135deg,#B5E2F9,#7AC7F2)",
    rainbow: "linear-gradient(135deg,#FFE9A8,#FFC1B6,#D7B8F5,#B5E2F9)",
    dog: "linear-gradient(135deg,#FFE9A8,#E8A825)",
  };
  const icon: Record<string, string> = { ark: "🚢", rainbow: "🌈", dog: "🐶" };
  return (
    <div
      style={{
        height: 180,
        borderRadius: 20,
        background: bgs[kind] || bgs.ark,
        display: "grid",
        placeItems: "center",
        fontSize: 72,
        border: "2px solid #2B234014",
      }}
    >
      <span>{icon[kind] || "🖼️"}</span>
    </div>
  );
}

/* ---------- Avatar ---------- */
type AvatarUser = Pick<User, "avatar" | "color"> & Partial<User>;
export function Avatar({
  user,
  size = 40,
  ring = false,
}: {
  user: AvatarUser;
  size?: number;
  ring?: boolean;
}) {
  const ringColors: Record<string, string> = {
    gold: "#FFC94A",
    coral: "#FF7E6B",
    sky: "#7AC7F2",
    grass: "#7DCE82",
    grape: "#B47EE5",
    rose: "#F58BB3",
  };
  const ringColor = ringColors[user.color] || "#FFC94A";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#FFF1D6",
        display: "grid",
        placeItems: "center",
        fontSize: size * 0.55,
        border: ring ? `3px solid ${ringColor}` : "2px solid #2B234020",
        boxShadow: "0 2px 0 0 rgba(43,35,64,.1)",
        flexShrink: 0,
      }}
    >
      {user.avatar}
    </div>
  );
}

/* ---------- Level pill ---------- */
export function LevelPill({ level, xp, max = 1000 }: { level: number; xp: number; max?: number }) {
  const pct = Math.min(100, (xp / max) * 100);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px 4px 6px",
        background: "#fff",
        borderRadius: 999,
        border: "2px solid #2B234014",
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#FFC94A,#E8A825)",
          display: "grid",
          placeItems: "center",
          fontSize: 11,
          color: "#2B2340",
          boxShadow: "0 2px 0 0 rgba(43,35,64,.15)",
        }}
      >
        {level}
      </div>
      <div style={{ width: 50, height: 6, background: "#2B234014", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#FFC94A" }} />
      </div>
    </div>
  );
}

/* ---------- Hearts (3-strike indicator) ---------- */
export function Hearts({ broken = 0, size = 24 }: { broken?: number; size?: number }) {
  return (
    <div style={{ display: "inline-flex", gap: 4 }}>
      {[0, 1, 2].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24">
          {i < broken ? (
            <>
              <path
                d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 5a5 5 0 0 1 9.5 7c-2.5 4.5-9.5 9-9.5 9z"
                fill="#D8D4E5"
                stroke="#8A82A8"
                strokeWidth="1.5"
              />
              <path d="M8 10 l4 3 M12 13 l3 -4" stroke="#8A82A8" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <path
              d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 5a5 5 0 0 1 9.5 7c-2.5 4.5-9.5 9-9.5 9z"
              fill="#FF7E6B"
              stroke="#E85C47"
              strokeWidth="1.5"
            />
          )}
        </svg>
      ))}
    </div>
  );
}

/* ---------- Badge pill ---------- */
export function Badge({ badge, size = "md" }: { badge: BadgeDef; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? 36 : size === "lg" ? 72 : 52;
  const glows: Record<string, string> = {
    common: "0 0 0 3px #FFF4C4",
    uncommon: "0 0 0 3px #B5E2F9",
    rare: "0 0 0 3px #D7B8F5",
    legendary: "0 0 0 3px #FFC94A, 0 0 24px #FFC94A80",
  };
  const glow = badge.earned ? glows[badge.rarity] : "none";
  return (
    <div
      style={{
        width: sz,
        height: sz,
        borderRadius: "50%",
        background: badge.earned ? "#FFF1D6" : "#EFECF6",
        display: "grid",
        placeItems: "center",
        fontSize: sz * 0.5,
        boxShadow: badge.earned ? "0 3px 0 0 rgba(43,35,64,.15)" : "inset 0 0 0 2px #00000008",
        outline: glow,
        opacity: badge.earned ? 1 : 0.45,
        filter: badge.earned ? "none" : "grayscale(0.8)",
        flexShrink: 0,
      }}
      title={badge.name}
    >
      {badge.icon}
    </div>
  );
}

/* ---------- Scripture card ---------- */
export function VerseCard({ verse }: { verse: { ref: string; text: string; theme: string } }) {
  return (
    <div
      className="card"
      style={{
        padding: 18,
        background: "linear-gradient(135deg,#FFF4C4,#FFE28A)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: -20, right: -20, fontSize: 120, opacity: 0.15, lineHeight: 1 }}>✨</div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: ".1em",
          color: "#8A6B00",
          textTransform: "uppercase",
        }}
      >
        Verse of the day · {verse.theme}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 19,
          fontWeight: 700,
          lineHeight: 1.25,
          marginTop: 8,
          fontStyle: "italic",
        }}
      >
        &quot;{verse.text}&quot;
      </div>
      <div style={{ marginTop: 10, fontWeight: 900, fontSize: 13 }}>— {verse.ref}</div>
    </div>
  );
}
