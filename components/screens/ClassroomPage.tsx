"use client";
/* Haven Kids — standalone Classroom page. Shows every lesson across
   the communities the kid is "in" with a working LessonViewer. */

import { useState } from "react";
import { HAVEN_DATA, type Lesson } from "@/lib/data";
import { LessonViewer } from "@/components/LessonViewer";

export function ClassroomPage() {
  const D = HAVEN_DATA;
  const [open, setOpen] = useState<Lesson | null>(null);

  return (
    <div style={{ padding: "20px 28px 80px", maxWidth: 1100, margin: "0 auto" }}>
      <h1>📚 My Classroom</h1>
      <div className="muted" style={{ marginTop: 4 }}>
        {D.classroom.length} lessons across every community you&apos;ve joined.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginTop: 20 }}>
        {D.classroom.map((c) => (
          <LessonCard key={c.id} lesson={c} onOpen={() => setOpen(c)} />
        ))}
      </div>
      {open && <LessonViewer lesson={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

export function LessonCard({ lesson, onOpen }: { lesson: Lesson; onOpen: () => void }) {
  const D = HAVEN_DATA;
  const community = D.communities.find((x) => x.id === lesson.community);
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="row" style={{ gap: 14 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: `var(--${lesson.color})`,
            display: "grid",
            placeItems: "center",
            fontSize: 36,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {lesson.thumb}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 18 }}>{lesson.title}</h3>
          <div className="muted small" style={{ marginTop: 2 }}>
            {community ? `${community.emoji} ${community.name} · ` : ""}
            {lesson.lessons} lessons · {Math.round(lesson.progress * 100)}%
          </div>
          <div style={{ marginTop: 8, height: 8, background: "#2B234014", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ width: `${lesson.progress * 100}%`, height: "100%", background: `var(--${lesson.color})` }} />
          </div>
          <div className="muted tiny" style={{ marginTop: 8, lineHeight: 1.45 }}>
            {lesson.description}
          </div>
        </div>
      </div>
      <div className="row" style={{ marginTop: 14 }}>
        <div style={{ flex: 1 }} />
        <button className="btn btn-sm btn-gold" onClick={onOpen}>
          ▶ {lesson.progress === 0 ? "Start" : lesson.progress === 1 ? "Revisit" : "Continue"}
        </button>
      </div>
    </div>
  );
}
