import React from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { PostCard } from "@/components/v3/PostCard";
import type {
  PostVM, QuickAction, ShoalItemVM, ShoalRailItemVM, ComposerChip,
  TagChip, VisRadio, VisCheck, FilterChip, TrendingVM, EventLineVM, Profile,
} from "@/components/v3/types";

interface HomeProps {
  me: Profile;
  heroShoal: ShoalItemVM[];
  railShoal: ShoalRailItemVM[];
  quickActions: QuickAction[];
  composer: string;
  onComposer: (e: ChangeEvent<HTMLInputElement>) => void;
  composerChips: ComposerChip[];
  showAutoTags: boolean;
  autoTagSummary: string;
  tagsOpen: boolean;
  toggleTags: () => void;
  autoTagChips: TagChip[];
  newTag: string;
  onNewTag: (e: ChangeEvent<HTMLInputElement>) => void;
  onNewTagKey: (e: KeyboardEvent<HTMLInputElement>) => void;
  addComposerTag: () => void;
  visOpen: boolean;
  toggleVisOpen: () => void;
  visLabel: string;
  visIcon: string;
  visIsSelect: boolean;
  visModeRadios: VisRadio[];
  visCommunityChecks: VisCheck[];
  filters: FilterChip[];
  feedView: PostVM[];
  trendingView: TrendingVM[];
  eventsView: EventLineVM[];
  goDiscover: () => void;
  openPalette: () => void;
  openPsalm139: () => void;
}

export function HomeScreen(props: HomeProps) {
  const {
    me, heroShoal, railShoal, quickActions, composer,
    onComposer, composerChips, showAutoTags, autoTagSummary, tagsOpen,
    toggleTags, autoTagChips, newTag, onNewTag, onNewTagKey, addComposerTag,
    visOpen, toggleVisOpen, visLabel, visIcon, visIsSelect, visModeRadios,
    visCommunityChecks, filters, feedView, trendingView, eventsView,
    goDiscover, openPalette, openPsalm139,
  } = props;

  return (
    <div className="fh-surface" style={{ maxWidth: 1180, margin: "0 auto", padding: "26px 30px 90px" }}>
      {/* hero */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 18, marginBottom: 18 }}>
        <div style={{ position: "relative", overflow: "hidden", padding: "30px 34px", borderRadius: 26, background: "radial-gradient(120% 140% at 85% 10%, rgba(127,201,214,.35), transparent 55%), linear-gradient(135deg,#1F7A8C 0%,#0E3A45 100%)", color: "#EAF6F4", boxShadow: "0 10px 30px rgba(14,58,69,.28)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#9FDCE6" }}>Welcome back, {me.name}</div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 38, lineHeight: 1.04, letterSpacing: "-.02em", margin: "10px 0 0", maxWidth: 430 }}>You&apos;ve arrived somewhere alive.</h1>
          <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.5, color: "#CDEAEF", maxWidth: 420, fontWeight: 500 }}>Your communities are humming right now. Dive in, share something real, and ride the currents you care about.</p>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={goDiscover} style={{ padding: "12px 22px", borderRadius: 999, fontWeight: 800, fontSize: 15, background: "#FFC94A", color: "#2B2340", boxShadow: "0 var(--shadow-off,3px) 0 0 #B9851A" }}>Explore harbors</button>
            <button onClick={openPalette} style={{ padding: "12px 22px", borderRadius: 999, fontWeight: 800, fontSize: 15, background: "rgba(255,255,255,.14)", color: "#EAF6F4", border: "1.5px solid rgba(255,255,255,.25)" }}>Search anything</button>
          </div>
          <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative", height: 34, display: "flex", alignItems: "center" }}>
              {heroShoal.map((f, i) => (
                <svg key={i} width="24" height="15" viewBox="-5 0 32 20" style={f.style}>
                  <path d="M6 10 Q15 2 24 10 Q15 18 6 10 Z" fill="currentColor" />
                  <path d="M6 10 L0 5 L2.5 10 L0 15 Z" fill="currentColor" />
                </svg>
              ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#CDEAEF" }}><span style={{ color: "#fff", fontWeight: 800 }}>214 friends</span> swimming nearby</div>
          </div>
        </div>
        {/* verse of day */}
        <div style={{ position: "relative", overflow: "hidden", padding: 22, borderRadius: 26, background: "linear-gradient(135deg,#FFF4C4,#FFE28A)", border: "1.5px solid rgba(232,168,37,.3)" }}>
          <div style={{ position: "absolute", top: -18, right: -10, fontSize: 120, opacity: 0.12, lineHeight: 1 }}>✝</div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#8A6B00" }}>Verse of the day · Wonder</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontWeight: 600, fontSize: 20, lineHeight: 1.28, marginTop: 10, color: "#2B2340" }}>&quot;I praise you because I am fearfully and wonderfully made; your works are wonderful.&quot;</div>
          <button onClick={openPsalm139} style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 13px", borderRadius: 999, background: "rgba(232,168,37,.22)", color: "#8A6B00", fontSize: 13, fontWeight: 800 }}><span>✝</span> Psalm 139:14</button>
        </div>
      </div>

      {/* quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        {quickActions.map((q, i) => (
          <button key={i} onClick={q.onClick} style={q.style}>
            <span style={q.iconWrap}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={q.tint} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={q.iconPath} /></svg>
            </span>
            <div style={{ fontWeight: 700, fontSize: 14, marginTop: 12, color: "#2B2340" }}>{q.label}</div>
            <div style={{ fontSize: 12.5, marginTop: 3, fontWeight: 500, color: "#8A82A8" }}>{q.sub}</div>
          </button>
        ))}
      </div>

      {/* feed + rail */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 318px", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {/* composer */}
          <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 var(--shadow-off,3px) 0 0 rgba(43,35,64,.05),0 8px 22px rgba(43,35,64,.06)", border: "1.5px solid rgba(43,35,64,.06)", padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 42, height: 42, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 21, background: "#EAF6F4", border: "2.5px solid var(--c-primary,#1F7A8C)" }}>{me.avatar}</span>
              <input value={composer} onChange={onComposer} placeholder="Share with your community…" style={{ flex: 1, padding: "12px 16px", border: "1.5px solid rgba(43,35,64,.1)", borderRadius: 999, background: "#FFF8EC", fontSize: 14, fontWeight: 600, outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, paddingLeft: 54, flexWrap: "wrap" }}>
              {composerChips.map((ch, i) => (
                <button key={i} onClick={() => {}} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: 999, background: "rgba(43,35,64,.05)", fontSize: 13, fontWeight: 700, color: "#5A4E7A" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={ch.iconPath} /></svg>
                  <span>{ch.label}</span>
                </button>
              ))}
            </div>

            {showAutoTags && (
              <div style={{ marginTop: 12, marginLeft: 54, borderTop: "1px dashed rgba(43,35,64,.1)", paddingTop: 12 }}>
                <button onClick={toggleTags} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left" }}>
                  <svg width="22" height="22" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
                    <circle cx="50" cy="50" r="30" fill="#FFF1D6" stroke="#2B2340" strokeWidth="3" />
                    <circle cx="42" cy="48" r="2.6" fill="#2B2340" />
                    <circle cx="58" cy="48" r="2.6" fill="#2B2340" />
                    <path d="M42 58 q8 6 16 0" stroke="#2B2340" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                    <ellipse cx="50" cy="22" rx="13" ry="3" fill="none" stroke="#FFC94A" strokeWidth="3" />
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#8A6B00" }}>Gabriel tagged this</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#8A82A8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{autoTagSummary}</span>
                  <span style={{ fontSize: 13, color: "#8A82A8" }}>{tagsOpen ? "▾" : "▸"}</span>
                </button>
                {tagsOpen && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
                      {autoTagChips.map((tg, i) => (
                        <span key={i} style={tg.style}>
                          <span>{tg.icon}</span><span>{tg.label}</span>
                          <button onClick={tg.onRemove} style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,.3)", color: "#fff", fontSize: 12, fontWeight: 800, display: "grid", placeItems: "center", lineHeight: 1 }}>×</button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 11 }}>
                      <input value={newTag} onChange={onNewTag} onKeyDown={onNewTagKey} placeholder="Add your own tag…" style={{ flex: 1, padding: "8px 14px", border: "1.5px solid rgba(43,35,64,.12)", borderRadius: 999, background: "#FFF8EC", fontSize: 13, fontWeight: 600, outline: "none" }} />
                      <button onClick={addComposerTag} style={{ padding: "8px 16px", borderRadius: 999, fontWeight: 800, fontSize: 13, background: "rgba(31,122,140,.12)", color: "#15616F", border: "none" }}>Add</button>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#8A82A8", fontWeight: 600, marginTop: 9 }}>Gabriel auto-detects scripture &amp; topics — edit freely before you post.</div>
                  </div>
                )}
              </div>
            )}

            {/* visibility + share footer */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(43,35,64,.07)" }}>
              <div style={{ position: "relative" }}>
                <button onClick={toggleVisOpen} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 999, background: "rgba(31,122,140,.08)", color: "#15616F", fontSize: 13, fontWeight: 800, border: "1.5px solid rgba(31,122,140,.18)" }}>
                  <span>{visIcon}</span><span>{visLabel}</span><span style={{ fontSize: 11 }}>▾</span>
                </button>
                {visOpen && (
                  <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, zIndex: 30, width: 288, background: "#fff", borderRadius: 16, border: "1.5px solid rgba(43,35,64,.1)", boxShadow: "0 18px 44px rgba(43,35,64,.2)", padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#8A82A8", padding: "2px 8px 8px" }}>Who can see this?</div>
                    {visModeRadios.map((o, i) => (
                      <button key={i} onClick={o.onClick} style={o.rowStyle}>
                        <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{o.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 13.5 }}>{o.title}</div>
                          <div style={{ fontSize: 11.5, color: "#8A82A8", fontWeight: 600 }}>{o.sub}</div>
                        </div>
                        {o.dot && <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--c-primary,#1F7A8C)", color: "#fff", fontSize: 11, display: "grid", placeItems: "center" }}>✓</span>}
                      </button>
                    ))}
                    {visIsSelect && (
                      <div style={{ marginTop: 6, padding: "10px 8px 4px", borderTop: "1px solid rgba(43,35,64,.07)", display: "flex", flexDirection: "column", gap: 2 }}>
                        {visCommunityChecks.map((c, i) => (
                          <button key={i} onClick={c.onClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 10, textAlign: "left" }}>
                            <span style={c.boxStyle}>{c.check}</span>
                            <span style={{ fontSize: 15 }}>{c.emoji}</span>
                            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700 }}>{c.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#8A82A8", fontWeight: 600, padding: "9px 8px 2px", lineHeight: 1.4 }}>One post — never re-post. Comments stay visible to every community you choose.</div>
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }} />
              <button onClick={() => {}} style={{ padding: "10px 22px", borderRadius: 999, fontWeight: 800, fontSize: 14, background: "var(--c-primary,#1F7A8C)", color: "#fff", boxShadow: "0 var(--shadow-off,3px) 0 0 var(--c-primary-deep,#15616F)" }}>Share</button>
            </div>
          </div>

          {/* currents filter */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {filters.map((f, i) => (
              <button key={i} onClick={f.onClick} style={f.style}>{f.label}</button>
            ))}
          </div>

          {/* posts */}
          {feedView.map((p) => <PostCard key={p.id} p={p} />)}
        </div>

        {/* right rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 84 }}>
          {/* active now shoal */}
          <div style={{ background: "#fff", borderRadius: 20, border: "1.5px solid rgba(43,35,64,.06)", boxShadow: "0 8px 22px rgba(43,35,64,.06)", padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 17 }}>Alive right now</div>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#4FB058", boxShadow: "0 0 0 4px rgba(79,176,88,.22)" }} />
            </div>
            <div style={{ position: "relative", height: 60, marginTop: 14 }}>
              {railShoal.map((f, i) => (
                <svg key={i} width="26" height="16" viewBox="-5 0 32 20" style={f.railStyle}>
                  <path d="M6 10 Q15 2 24 10 Q15 18 6 10 Z" fill="currentColor" />
                  <path d="M6 10 L0 5 L2.5 10 L0 15 Z" fill="currentColor" />
                  <circle cx="20" cy="9" r="1.1" fill="rgba(14,58,69,.5)" />
                </svg>
              ))}
            </div>
            <div style={{ fontSize: 12.5, color: "#8A82A8", fontWeight: 600, marginTop: 6 }}>A whole shoal is here — drop a post and they&apos;ll see it.</div>
          </div>

          {/* trending currents */}
          <div style={{ background: "#fff", borderRadius: 20, border: "1.5px solid rgba(43,35,64,.06)", boxShadow: "0 8px 22px rgba(43,35,64,.06)", padding: 16 }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 17, marginBottom: 12 }}>Strong currents</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {trendingView.map((c, i) => (
                <button key={i} onClick={c.onClick} style={{ display: "flex", alignItems: "center", gap: 11, padding: 8, borderRadius: 12, textAlign: "left" }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800, color: "#fff", background: c.color }}>{c.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</div>
                    <div style={{ fontSize: 11.5, color: "#8A82A8", fontWeight: 600 }}>{c.count} riding</div>
                  </div>
                  {c.hot && <span style={{ fontSize: 13 }}>🌊</span>}
                </button>
              ))}
            </div>
          </div>

          {/* upcoming */}
          <div style={{ background: "#fff", borderRadius: 20, border: "1.5px solid rgba(43,35,64,.06)", boxShadow: "0 8px 22px rgba(43,35,64,.06)", padding: 16 }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 17, marginBottom: 12 }}>This week</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {eventsView.map((e, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: 8, borderRadius: 12, background: "#FFFBF2" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fff", border: "1.5px solid rgba(43,35,64,.1)", display: "grid", placeItems: "center" }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: "#8A6B00", letterSpacing: ".08em" }}>{e.day}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, marginTop: -2 }}>{e.date}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>{e.title}</div>
                    <div style={{ fontSize: 11.5, color: "#8A82A8", fontWeight: 600 }}>{e.time} · {e.cName}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
