"use client";

import React, { useState } from "react";
import { lessons, hex, cmap, type Lesson, type LessonStep } from "@/lib/v3/data";

// Learn / Classroom — a list of step-based Bible lessons that open into a
// guided read / reflect / do / verse / quiz flow with progress + quiz
// feedback. Adapted from the old ClassroomPage + LessonViewer, restyled in
// the v3 Harbour-Light language and age-dial aware via `prim` / `deep`.

interface LearnProps {
  prim: string;
  deep: string;
  reduceMotion: boolean;
}

const CM = cmap();

const STEP_META: Record<LessonStep["kind"], { label: string; icon: string }> = {
  read: { label: "Read", icon: "📖" },
  reflect: { label: "Reflect", icon: "💭" },
  do: { label: "Try it", icon: "✏️" },
  verse: { label: "Scripture", icon: "✨" },
  quiz: { label: "Quick check", icon: "❓" },
};

export function LearnScreen({ prim, deep }: LearnProps) {
  const [open, setOpen] = useState<Lesson | null>(null);

  return (
    <div className="fh-surface" style={{ maxWidth: 1000, margin: "0 auto", padding: "30px 30px 90px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#8A82A8" }}>Learn · your classroom</div>
      <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 34, letterSpacing: "-.02em", margin: "8px 0 4px" }}>Lessons across your harbors</h1>
      <p style={{ fontSize: 15, color: "#5A4E7A", fontWeight: 500, maxWidth: 560, margin: "0 0 22px" }}>
        Short, guided lessons from every community you&apos;ve joined. Read a little, try a little, and check what you learned.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
        {lessons.map((c) => (
          <LessonCard key={c.id} lesson={c} prim={prim} deep={deep} onOpen={() => setOpen(c)} />
        ))}
      </div>
      {open && <LessonViewer lesson={open} prim={prim} deep={deep} onClose={() => setOpen(null)} />}
    </div>
  );
}

function LessonCard({ lesson, prim, deep, onOpen }: { lesson: Lesson; prim: string; deep: string; onOpen: () => void }) {
  const community = CM[lesson.community];
  const tint = hex(lesson.color);
  const pct = Math.round(lesson.progress * 100);
  const action = lesson.progress === 0 ? "Start" : lesson.progress >= 1 ? "Revisit" : "Continue";
  return (
    <div style={{ background: "#fff", borderRadius: 20, border: "1.5px solid rgba(43,35,64,.06)", boxShadow: "0 var(--shadow-off,3px) 0 0 rgba(43,35,64,.05),0 8px 22px rgba(43,35,64,.06)", padding: 18, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 14 }}>
        <span style={{ width: 64, height: 64, borderRadius: 18, background: tint, display: "grid", placeItems: "center", fontSize: 30, flexShrink: 0, boxShadow: "0 3px 10px rgba(43,35,64,.12)" }}>
          {lesson.thumb}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 18, lineHeight: 1.15 }}>{lesson.title}</h3>
          <div style={{ fontSize: 12, color: "#8A82A8", fontWeight: 700, marginTop: 3 }}>
            {community ? `${community.emoji} ${community.name} · ` : ""}{lesson.lessons} lessons · {pct}%
          </div>
          <div style={{ marginTop: 9, height: 8, background: "rgba(43,35,64,.08)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: tint, borderRadius: 10 }} />
          </div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "#5A4E7A", fontWeight: 500, lineHeight: 1.45, margin: "12px 0 0", flex: 1 }}>{lesson.description}</p>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <button onClick={onOpen} style={{ padding: "9px 18px", borderRadius: 999, fontSize: 13, fontWeight: 800, background: prim, color: "#fff", boxShadow: `0 var(--shadow-off,3px) 0 0 ${deep}` }}>
          ▶ {action}
        </button>
      </div>
    </div>
  );
}

function LessonViewer({ lesson, prim, deep, onClose }: { lesson: Lesson; prim: string; deep: string; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [quizPick, setQuizPick] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const step = lesson.steps[i];
  const isLast = i === lesson.steps.length - 1;
  const tint = hex(lesson.color);
  const pct = done ? 100 : Math.round(((i + 1) / lesson.steps.length) * 100);

  const next = () => {
    setQuizPick(null);
    if (isLast) setDone(true);
    else setI((x) => x + 1);
  };
  const back = () => {
    setQuizPick(null);
    setI((x) => Math.max(0, x - 1));
  };

  const quizBlocked = step.kind === "quiz" && quizPick === null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(14,58,69,.5)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", background: "#fff", borderRadius: 24, boxShadow: "0 30px 80px rgba(14,58,69,.4)", overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 18, background: tint, color: "#fff" }}>
          <span style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,.9)", display: "grid", placeItems: "center", fontSize: 26, flexShrink: 0 }}>{lesson.thumb}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.85 }}>Lesson · {lesson.lessons} parts</div>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 22, lineHeight: 1.1, marginTop: 2 }}>{lesson.title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ width: 34, height: 34, borderRadius: 12, background: "rgba(255,255,255,.85)", color: "#2B2340", fontWeight: 900, fontSize: 15, display: "grid", placeItems: "center", flexShrink: 0 }}>✕</button>
        </div>

        {/* progress */}
        <div style={{ padding: "12px 20px 0" }}>
          <div style={{ height: 8, borderRadius: 10, background: "rgba(43,35,64,.08)", overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: tint, transition: "width .25s ease" }} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#8A82A8", marginTop: 6 }}>
            Step {done ? lesson.steps.length : i + 1} of {lesson.steps.length}
          </div>
        </div>

        {/* body */}
        <div style={{ padding: "12px 20px 6px", overflowY: "auto" }}>
          {done ? (
            <LessonDone lesson={lesson} />
          ) : (
            <StepBody step={step} tint={tint} quizPick={quizPick} setQuizPick={setQuizPick} />
          )}
        </div>

        {/* footer */}
        <div style={{ marginTop: "auto", padding: 16, borderTop: "1px solid rgba(43,35,64,.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={back} disabled={done || i === 0} style={{ padding: "9px 16px", borderRadius: 999, fontSize: 13, fontWeight: 800, color: "#5A4E7A", background: "rgba(43,35,64,.05)", opacity: done || i === 0 ? 0.4 : 1 }}>← Back</button>
          <div style={{ flex: 1 }} />
          {done ? (
            <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 999, fontSize: 13, fontWeight: 800, background: prim, color: "#fff", boxShadow: `0 var(--shadow-off,3px) 0 0 ${deep}` }}>✨ Done — nice work</button>
          ) : (
            <button onClick={next} disabled={quizBlocked} style={{ padding: "10px 20px", borderRadius: 999, fontSize: 13, fontWeight: 800, background: prim, color: "#fff", boxShadow: `0 var(--shadow-off,3px) 0 0 ${deep}`, opacity: quizBlocked ? 0.5 : 1 }}>{isLast ? "Finish 🎉" : "Next →"}</button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepBody({ step, tint, quizPick, setQuizPick }: { step: LessonStep; tint: string; quizPick: number | null; setQuizPick: (n: number) => void }) {
  const meta = STEP_META[step.kind];
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#8A6B00" }}>
        {meta.icon} {meta.label}
      </div>
      <h3 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 20, marginTop: 6 }}>{step.title}</h3>
      <p style={{ marginTop: 10, fontSize: 15, lineHeight: 1.55, color: "#5A4E7A", fontWeight: 500 }}>{step.body}</p>

      {step.kind === "verse" && step.verseRef && (
        <div style={{ marginTop: 14, padding: 14, borderRadius: 16, background: "linear-gradient(135deg,#FFF8EC,#FFEFC9)", border: "1.5px solid rgba(232,168,37,.4)", fontFamily: "'Fraunces',serif", fontStyle: "italic", fontSize: 17, color: "#2B2340" }}>
          — {step.verseRef}
        </div>
      )}

      {step.kind === "quiz" && step.options && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {step.options.map((opt, idx) => {
            const selected = quizPick === idx;
            const correct = selected && idx === step.answer;
            const wrong = selected && idx !== step.answer;
            return (
              <button
                key={idx}
                onClick={() => setQuizPick(idx)}
                style={{
                  padding: "11px 14px",
                  textAlign: "left",
                  borderRadius: 14,
                  fontSize: 14.5,
                  fontWeight: 600,
                  color: "#2B2340",
                  border: selected ? (correct ? "2px solid #4FB058" : "2px solid #E85C47") : "1.5px solid rgba(43,35,64,.12)",
                  background: selected ? (correct ? "rgba(79,176,88,.12)" : "rgba(232,92,71,.1)") : "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontWeight: 800 }}>{String.fromCharCode(65 + idx)}.</span>
                <span style={{ flex: 1 }}>{opt}</span>
                {correct && <span>✅</span>}
                {wrong && <span>❌</span>}
              </button>
            );
          })}
          {quizPick !== null && step.answer !== undefined && (
            <div style={{ fontSize: 12.5, fontWeight: 700, color: quizPick === step.answer ? "#2F7A3A" : "#8A82A8", marginTop: 4 }}>
              {quizPick === step.answer ? "Correct! Tap Next." : `Not quite — the answer is ${String.fromCharCode(65 + step.answer)}.`}
            </div>
          )}
        </div>
      )}

      {step.kind === "do" && (
        <div style={{ marginTop: 14, padding: 14, borderRadius: 16, background: "linear-gradient(135deg,#FFF8EC,#FFEFC9)", border: "1.5px solid rgba(232,168,37,.4)", display: "flex", gap: 12, alignItems: "center" }}>
          <svg width="40" height="40" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
            <ellipse cx="22" cy="58" rx="16" ry="20" fill="#fff" stroke="#E8C7F0" strokeWidth="2" />
            <ellipse cx="78" cy="58" rx="16" ry="20" fill="#fff" stroke="#E8C7F0" strokeWidth="2" />
            <path d="M30 78 q0 -18 20 -18 q20 0 20 18 v8 h-40 z" fill="#FFF1D6" stroke="#2B2340" strokeWidth="2" />
            <circle cx="50" cy="48" r="17" fill="#FFE0C2" stroke="#2B2340" strokeWidth="2" />
            <circle cx="42" cy="50" r="2.5" fill="#2B2340" />
            <circle cx="58" cy="50" r="2.5" fill="#2B2340" />
            <path d="M42 58 q8 6 16 0" stroke="#2B2340" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="50" cy="27" rx="15" ry="3.6" fill="none" stroke="#FFC94A" strokeWidth="3" />
          </svg>
          <div style={{ fontFamily: "'Caveat',cursive", fontSize: 16, fontWeight: 700, color: "#8A6B00", lineHeight: 1.3 }}>
            Give it a go! Come back and tap Next once you&apos;re done.
          </div>
        </div>
      )}

      {step.kind === "reflect" && (
        <textarea
          placeholder="Type a short thought (just between you and God)…"
          rows={3}
          style={{ width: "100%", marginTop: 12, padding: 12, border: "1.5px solid rgba(43,35,64,.12)", borderRadius: 14, background: "#FFF8EC", fontSize: 14, fontWeight: 500, outline: "none", resize: "vertical", color: "#2B2340" }}
        />
      )}

      {step.kind === "read" && (
        <div style={{ marginTop: 14, height: 4, borderRadius: 4, background: tint, opacity: 0.25 }} />
      )}
    </div>
  );
}

function LessonDone({ lesson }: { lesson: Lesson }): React.ReactElement {
  return (
    <div style={{ textAlign: "center", padding: "16px 6px 6px" }}>
      <svg width="92" height="92" viewBox="0 0 100 100" style={{ animation: "bob 3s ease-in-out infinite" }}>
        <ellipse cx="22" cy="58" rx="16" ry="20" fill="#fff" stroke="#E8C7F0" strokeWidth="2" />
        <ellipse cx="78" cy="58" rx="16" ry="20" fill="#fff" stroke="#E8C7F0" strokeWidth="2" />
        <path d="M30 78 q0 -18 20 -18 q20 0 20 18 v8 h-40 z" fill="#FFF1D6" stroke="#2B2340" strokeWidth="2" />
        <circle cx="50" cy="48" r="17" fill="#FFE0C2" stroke="#2B2340" strokeWidth="2" />
        <circle cx="42" cy="50" r="2.5" fill="#2B2340" />
        <circle cx="58" cy="50" r="2.5" fill="#2B2340" />
        <path d="M42 58 q8 6 16 0" stroke="#2B2340" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <ellipse cx="50" cy="27" rx="15" ry="3.6" fill="none" stroke="#FFC94A" strokeWidth="3" />
      </svg>
      <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 24, marginTop: 12 }}>Lesson complete!</h2>
      <p style={{ marginTop: 8, color: "#5A4E7A", fontSize: 15, fontWeight: 500 }}>
        You finished all {lesson.steps.length} steps of <b>{lesson.title}</b>. +25 XP ⭐
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
        <span style={{ padding: "5px 12px", borderRadius: 999, background: "#FFF8EC", color: "#8A6B00", fontSize: 12.5, fontWeight: 800 }}>+25 XP</span>
        <span style={{ padding: "5px 12px", borderRadius: 999, background: "rgba(79,176,88,.16)", color: "#2F7A3A", fontSize: 12.5, fontWeight: 800 }}>Streak +1 🔥</span>
      </div>
    </div>
  );
}
