"use client";
/* HAVEN KIDS — Chat rooms (switchable) + AI Angel moderation. */

import { useMemo, useState } from "react";
import { Angel, Avatar, Hearts } from "@/components/primitives";
import { logActivity } from "@/lib/activity";
import { HAVEN_DATA, type User, type ColorKey, type ChatMessageSeed } from "@/lib/data";
import { moderateMessage } from "@/app/app/chat/actions";

type ChatUser = { name: string; avatar: string; color: ColorKey; isAngel?: boolean };
interface ChatMessage {
  id: number;
  user: ChatUser;
  text: string;
  time: string;
}

export function ChatPage({
  user,
  strikes,
  onStrike,
}: {
  user: User;
  strikes: number;
  onStrike: (reason: string) => void;
}) {
  const roomsOrder = HAVEN_DATA.chatRoomsOrder;
  const [active, setActive] = useState<string>(roomsOrder[0].key);
  const [msg, setMsg] = useState("");
  // messages per room keyed by room key
  const [byRoom, setByRoom] = useState<Record<string, ChatMessage[]>>(() => {
    const out: Record<string, ChatMessage[]> = {};
    for (const [key, seeds] of Object.entries(HAVEN_DATA.chatRoomSeeds)) {
      out[key] = (seeds as ChatMessageSeed[]).map((s) => ({
        id: s.id,
        user: { name: s.name, avatar: s.avatar, color: s.color, isAngel: s.isAngel },
        text: s.text,
        time: s.time,
      }));
    }
    return out;
  });
  const [showStrike, setShowStrike] = useState<{ word: string } | null>(null);

  const messages = byRoom[active] || [];
  const roomMeta = roomsOrder.find((r) => r.key === active)!;

  const send = async () => {
    if (!msg.trim()) return;
    const verdict = await moderateMessage(msg);
    if (verdict.flagged) {
      logActivity("strike_triggered", { word: verdict.word, room: active });
      setShowStrike({ word: verdict.word ?? "unkind words" });
      setMsg("");
      return;
    }
    const newMsg: ChatMessage = {
      id: Date.now(),
      user,
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setByRoom((b) => ({ ...b, [active]: [...(b[active] ?? []), newMsg] }));
    logActivity("send_chat", { chars: msg.length, room: active });
    const sent = msg;
    setMsg("");
    if (sent.toLowerCase().includes("pray")) {
      setTimeout(() => {
        setByRoom((b) => ({
          ...b,
          [active]: [
            ...(b[active] ?? []),
            {
              id: Date.now() + 1,
              user: { name: "Gabriel", avatar: "😇", color: "gold", isAngel: true },
              text: "Beautiful heart 💛 I'll remember this one too.",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ],
        }));
      }, 800);
    }
  };

  const confirmStrike = () => {
    onStrike(showStrike?.word ?? "unkind words");
    setShowStrike(null);
  };

  // Room members: deterministically pick users from seed data
  const members = useMemo(() => {
    const seed = HAVEN_DATA.chatRoomSeeds[active] ?? [];
    const names = new Set(seed.filter((s) => !s.isAngel).map((s) => s.name));
    return HAVEN_DATA.users.slice(0, 10).filter((u) => names.has(u.name.split(" ")[0]) || true).slice(0, 6);
  }, [active]);

  return (
    <div style={{ padding: "20px 28px 20px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 260px", gap: 16, height: "calc(100vh - 110px)" }}>
        {/* rooms list */}
        <div className="card" style={{ padding: 10, overflowY: "auto" }}>
          <div
            style={{
              padding: 8,
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "var(--ink-mute)",
            }}
          >
            Rooms
          </div>
          {roomsOrder.map((r) => {
            const isActive = r.key === active;
            return (
              <button
                key={r.key}
                onClick={() => setActive(r.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: 10,
                  borderRadius: 12,
                  background: isActive ? "var(--ink)" : "transparent",
                  color: isActive ? "#fff" : "var(--ink)",
                  textAlign: "left",
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 2,
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 18 }}>{r.icon}</span>
                <span style={{ flex: 1 }}>{r.key}</span>
                <span style={{ fontSize: 11, opacity: 0.8 }}>🟢 {r.online}</span>
              </button>
            );
          })}
          <div className="divider" style={{ margin: "12px 6px" }} />
          <div
            style={{
              padding: 12,
              margin: 4,
              borderRadius: 14,
              background: "linear-gradient(135deg,#E0E0FA,#B4C4E5)",
              color: "#2B2340",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase" }}>
              🌙 Quiet hour in
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900, marginTop: 4 }}>19:47</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>Chat dims at 9pm bedtime</div>
          </div>
        </div>

        {/* chat main */}
        <div className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div className="row" style={{ padding: 14, borderBottom: "2px solid #2B234010" }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: "#FFF1D6",
                display: "grid",
                placeItems: "center",
                fontSize: 22,
              }}
            >
              {roomMeta.icon}
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 18 }}># {active}</div>
              <div className="tiny muted">{roomMeta.online} friends online · Gabriel is watching 😇</div>
            </div>
            <div style={{ flex: 1 }} />
            <Hearts broken={strikes} />
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {messages.map((m) => (
              <ChatBubble key={m.id} m={m} isMe={m.user.name === user.name} />
            ))}
          </div>

          <div style={{ padding: 12, borderTop: "2px solid #2B234010" }}>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-sm btn-ghost">😊</button>
              <button className="btn btn-sm btn-ghost">🎨</button>
              <button className="btn btn-sm btn-ghost">🙏</button>
              <input
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
                placeholder={`Say something kind in #${active}… (try 'dumb' to see the angel)`}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "2px solid #2B234014",
                  borderRadius: 999,
                  background: "#FFF8E8",
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <button className="btn btn-gold" onClick={() => void send()}>
                Send
              </button>
            </div>
          </div>
        </div>

        {/* members / angel panel */}
        <div className="stack" style={{ gap: 12, overflowY: "auto" }}>
          <div className="card" style={{ padding: 14, background: "linear-gradient(135deg,#FFF8E8,#FFEFC9)" }}>
            <div className="row">
              <div className="bob">
                <Angel size={48} />
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 14 }}>Gabriel</div>
                <div className="tiny muted">Your AI Angel · online</div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "#5A4E7A", fontStyle: "italic" }}>
              &quot;I&apos;m here to keep chats kind. Three strikes and we pause for a parent chat.&quot;
            </div>
            <div style={{ marginTop: 10 }}>
              <Hearts broken={strikes} />
              <div className="tiny" style={{ marginTop: 4, color: "var(--ink-mute)" }}>
                {3 - strikes} strike{3 - strikes === 1 ? "" : "s"} remaining
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "var(--ink-mute)",
              }}
            >
              In #{active}
            </div>
            <div className="stack" style={{ marginTop: 10, gap: 8 }}>
              {members.map((u) => (
                <div key={u.id} className="row" style={{ gap: 10 }}>
                  <Avatar user={u} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{u.name}</div>
                    <div className="tiny muted">🟢 online</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showStrike && (
        <StrikeModal
          word={showStrike.word}
          strikes={strikes}
          onClose={() => setShowStrike(null)}
          onConfirm={confirmStrike}
        />
      )}
    </div>
  );
}

function ChatBubble({ m, isMe }: { m: ChatMessage; isMe: boolean }) {
  if (m.user.isAngel) {
    return (
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Angel size={36} />
        <div
          style={{
            background: "linear-gradient(135deg,#FFF8E8,#FFEFC9)",
            border: "2px solid #FFC94A40",
            padding: "10px 14px",
            borderRadius: "18px 18px 18px 4px",
            maxWidth: "75%",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: "#8A6B00",
              letterSpacing: ".08em",
              textTransform: "uppercase",
            }}
          >
            Gabriel · AI Angel
          </div>
          <div style={{ marginTop: 2, fontSize: 14, fontStyle: "italic", color: "#5A4E7A" }}>{m.text}</div>
          <div className="tiny muted" style={{ marginTop: 4 }}>
            {m.time}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexDirection: isMe ? "row-reverse" : "row",
        alignItems: "flex-end",
      }}
    >
      <Avatar user={m.user} size={32} />
      <div
        style={{
          background: isMe ? "var(--sky)" : "#FFF8E8",
          color: isMe ? "#fff" : "var(--ink)",
          padding: "8px 14px",
          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          maxWidth: "70%",
          boxShadow: "0 2px 0 0 #0001",
        }}
      >
        {!isMe && <div style={{ fontSize: 11, fontWeight: 900, color: "var(--ink-soft)" }}>{m.user.name}</div>}
        <div style={{ fontSize: 14 }}>{m.text}</div>
      </div>
      <div className="tiny muted" style={{ alignSelf: "flex-end", paddingBottom: 4 }}>
        {m.time}
      </div>
    </div>
  );
}

function StrikeModal({
  word,
  strikes,
  onClose,
  onConfirm,
}: {
  word: string;
  strikes: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const next = strikes + 1;
  type Msg = { title: string; body: string; mood: "happy" | "worried"; cta: string };
  const table: Record<number, Msg> = {
    1: {
      title: "Whoops — let's try again 💛",
      body: `I noticed the word "${word}". That might hurt a friend. No strike yet — just a gentle nudge. Try saying what you mean in a kinder way.`,
      mood: "happy",
      cta: "Got it, I'll try again",
    },
    2: {
      title: "That's strike 1 of 3",
      body: `I saw "${word}" again. Remember — Ephesians 4:29 says only build each other up. One of your hearts just broke. Take a breath?`,
      mood: "worried",
      cta: "I'll do better",
    },
    3: {
      title: "Strike 2 of 3",
      body: `Another unkind word. Two hearts broken. One more and we pause your chat for a grown-up to help. I believe in you!`,
      mood: "worried",
      cta: "Okay, I hear you",
    },
    4: {
      title: "Strike 3 — time for a break",
      body: `You've used all three hearts. I've messaged your grown-up so you can talk together. This isn't a forever goodbye — come back kinder tomorrow 💛`,
      mood: "worried",
      cta: "Pause my account",
    },
  };
  const msgs: Msg = table[next] || { title: "...", body: "...", mood: "happy", cta: "Ok" };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#2B234088",
        zIndex: 500,
        display: "grid",
        placeItems: "center",
        padding: 20,
        animation: "pop .3s ease",
      }}
    >
      <div
        className="card"
        style={{
          padding: 28,
          maxWidth: 460,
          width: "100%",
          background: "linear-gradient(180deg,#FFF8E8 0%,#FFFFFF 100%)",
          border: "3px solid #FFC94A",
          boxShadow: "var(--shadow-lg)",
          textAlign: "center",
        }}
      >
        <div style={{ display: "grid", placeItems: "center" }}>
          <Angel size={110} mood={msgs.mood} />
        </div>
        <h2 style={{ marginTop: 12 }}>{msgs.title}</h2>
        <div style={{ marginTop: 12, display: "grid", placeItems: "center" }}>
          <Hearts broken={next} size={36} />
        </div>
        <p style={{ marginTop: 14, color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.5 }}>{msgs.body}</p>
        <div className="row" style={{ marginTop: 20, justifyContent: "center", gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-gold" onClick={onConfirm}>
            {msgs.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
