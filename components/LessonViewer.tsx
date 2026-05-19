"use client";

import { useState } from "react";
import type { Lesson, LessonStep } from "@/lib/data";
import { Angel } from "./primitives";
import { logActivity } from "@/lib/activity";

export function LessonViewer({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [quizPick, setQuizPick] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const step = lesson.steps[i];
  const isLast = i === lesson.steps.length - 1;

  const next = () => {
    setQuizPick(null);
    if (isLast) {
      setDone(true);
      logActivity("view_page", { lesson: lesson.id, step: "complete" });
    } else {
      setI((x) => x + 1);
      logActivity("view_page", { lesson: lesson.id, step: i + 1 });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "#2B234088",
        zIndex: 500,
        display: "grid",
        placeItems: "center",
        padding: 20,
        animation: "pop .25s ease",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          padding: 0,
          maxWidth: 560,
          width: "100%",
          maxHeight: "90vh",
          background: "linear-gradient(180deg,#FFF8E8 0%,#FFFFFF 45%)",
          border: "3px solid var(--gold)",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: 18,
            borderBottom: "2px solid #2B234010",
            background: `var(--${lesson.color})`,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 28,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {lesson.thumb}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", color: "#2B234099" }}>
              Lesson · {lesson.lessons} parts
            </div>
            <h2 style={{ fontSize: 22, lineHeight: 1.1, marginTop: 2 }}>{lesson.title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: "#ffffffcc",
              border: "2px solid #2B234014",
              fontWeight: 900,
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        <div style={{ padding: "10px 18px 0" }}>
          <div style={{ height: 8, borderRadius: 10, background: "#2B234014", overflow: "hidden" }}>
            <div
              style={{
                width: `${done ? 100 : Math.round(((i + 1) / lesson.steps.length) * 100)}%`,
                height: "100%",
                background: `var(--${lesson.color})`,
                transition: "width .2s ease",
              }}
            />
          </div>
          <div className="tiny muted" style={{ marginTop: 6 }}>
            Step {done ? lesson.steps.length : i + 1} of {lesson.steps.length}
          </div>
        </div>

        {/* Step body */}
        <div style={{ padding: "12px 18px 6px", overflowY: "auto" }}>
          {done ? (
            <LessonDone lesson={lesson} />
          ) : (
            <StepBody
              step={step}
              color={lesson.color}
              quizPick={quizPick}
              setQuizPick={setQuizPick}
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            padding: 14,
            borderTop: "2px solid #2B234010",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setI((x) => Math.max(0, x - 1))}
            disabled={done || i === 0}
            style={{ opacity: done || i === 0 ? 0.4 : 1 }}
          >
            ← Back
          </button>
          <div style={{ flex: 1 }} />
          {done ? (
            <button className="btn btn-gold" onClick={onClose}>
              ✨ Done — nice work
            </button>
          ) : (
            <button
              className="btn btn-gold"
              onClick={next}
              disabled={step.kind === "quiz" && quizPick === null}
              style={{ opacity: step.kind === "quiz" && quizPick === null ? 0.5 : 1 }}
            >
              {isLast ? "Finish 🎉" : "Next →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepBody({
  step,
  color,
  quizPick,
  setQuizPick,
}: {
  step: LessonStep;
  color: string;
  quizPick: number | null;
  setQuizPick: (n: number) => void;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "#8A6B00",
        }}
      >
        {step.kind === "read" && "📖 Read"}
        {step.kind === "reflect" && "💭 Reflect"}
        {step.kind === "do" && "✏️ Try it"}
        {step.kind === "verse" && "✨ Scripture"}
        {step.kind === "quiz" && "❓ Quick check"}
      </div>
      <h3 style={{ marginTop: 6, fontSize: 20 }}>{step.title}</h3>
      <p style={{ marginTop: 10, fontSize: 15, lineHeight: 1.55, color: "var(--ink-soft)" }}>{step.body}</p>

      {step.kind === "verse" && step.verseRef && (
        <div
          className="card"
          style={{
            marginTop: 14,
            padding: 14,
            background: "linear-gradient(135deg,#FFF4C4,#FFE28A)",
            border: "2px solid #FFC94A60",
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 17,
          }}
        >
          — {step.verseRef}
        </div>
      )}

      {step.kind === "quiz" && step.options && (
        <div className="stack" style={{ marginTop: 14, gap: 8 }}>
          {step.options.map((opt, idx) => {
            const selected = quizPick === idx;
            const correct = selected && idx === step.answer;
            const wrong = selected && idx !== step.answer;
            return (
              <button
                key={idx}
                onClick={() => setQuizPick(idx)}
                className="card"
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  cursor: "pointer",
                  border: selected
                    ? correct
                      ? "2px solid #4FB058"
                      : "2px solid #E85C47"
                    : "2px solid #2B234014",
                  background: selected ? (correct ? "#E8F9E2" : "#FFD1E1") : "#fff",
                }}
              >
                <span style={{ fontWeight: 800 }}>{String.fromCharCode(65 + idx)}.</span> {opt}{" "}
                {correct && <span style={{ float: "right" }}>✅</span>}
                {wrong && <span style={{ float: "right" }}>❌</span>}
              </button>
            );
          })}
          {quizPick !== null && step.answer !== undefined && (
            <div className="tiny muted" style={{ marginTop: 4 }}>
              {quizPick === step.answer ? "Correct! Tap Next." : `Not quite — the answer is ${String.fromCharCode(65 + step.answer)}.`}
            </div>
          )}
        </div>
      )}

      {step.kind === "do" && (
        <div
          className="card"
          style={{
            marginTop: 14,
            padding: 14,
            background: `linear-gradient(135deg,#FFF8E8,#FFEFC9)`,
            border: "2px solid #FFC94A60",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <Angel size={40} />
          <div style={{ fontSize: 13, color: "#8A6B00", fontWeight: 700 }}>
            Give it a go! Come back and tap Next once you&apos;re done.
          </div>
        </div>
      )}

      {step.kind === "reflect" && (
        <textarea
          placeholder="Type a short thought (just between you and God)…"
          rows={3}
          style={{
            width: "100%",
            marginTop: 12,
            padding: 12,
            border: "2px solid #2B234014",
            borderRadius: 14,
            background: "#FFF8E8",
            fontSize: 14,
            outline: "none",
            resize: "vertical",
          }}
        />
      )}
    </div>
  );
}

function LessonDone({ lesson }: { lesson: Lesson }) {
  return (
    <div style={{ textAlign: "center", padding: "14px 6px 6px" }}>
      <div style={{ display: "grid", placeItems: "center" }}>
        <div className="bob">
          <Angel size={100} />
        </div>
      </div>
      <h2 style={{ marginTop: 12 }}>Lesson complete!</h2>
      <p style={{ marginTop: 8, color: "var(--ink-soft)", fontSize: 15 }}>
        You finished all {lesson.steps.length} steps of <b>{lesson.title}</b>. +25 XP ⭐
      </p>
      <div className="row" style={{ marginTop: 14, justifyContent: "center", gap: 8 }}>
        <span className="chip" style={{ background: "#FFF1D6", color: "#8A6B00" }}>
          +25 XP
        </span>
        <span className="chip" style={{ background: "#E8F9E2", color: "#2F7A3A" }}>
          Streak +1 🔥
        </span>
      </div>
    </div>
  );
}
