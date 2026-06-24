import React from "react";
import { MiniPostCard } from "@/components/v3/PostCard";
import type { CommunityVM, DiscoverVM, PostVM } from "@/components/v3/types";

interface CommunityProps {
  community: CommunityVM;
  childCommunities: DiscoverVM[];
  communityFeed: PostVM[];
}

export function CommunityScreen({ community, childCommunities, communityFeed }: CommunityProps) {
  return (
    <div className="fh-surface" style={{ maxWidth: 1000, margin: "0 auto", padding: "0 30px 90px" }}>
      {community.isNested && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 4px 6px", fontSize: 13, fontWeight: 700, flexWrap: "wrap" }}>
          <button onClick={community.goParent} style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#5A4E7A", whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 15 }}>{community.parentEmoji}</span><span>{community.parentName}</span>
          </button>
          <span style={{ color: "#8A82A8" }}>›</span>
          <span style={{ color: "#2B2340", whiteSpace: "nowrap" }}>{community.name}</span>
          <span style={{ marginLeft: 6, padding: "3px 10px", borderRadius: 999, background: "rgba(31,122,140,.1)", color: "#15616F", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>🌊 deeper water</span>
        </div>
      )}
      <div style={{ height: 170, borderRadius: "0 0 26px 26px", background: community.cover, position: "relative", display: "flex", alignItems: "flex-end", padding: "22px 26px" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(14,58,69,.32), transparent 60%)", borderRadius: "0 0 26px 26px" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 16, width: "100%" }}>
          <span style={{ width: 74, height: 74, borderRadius: 20, background: "rgba(255,255,255,.94)", display: "grid", placeItems: "center", fontSize: 38, boxShadow: "0 6px 16px rgba(0,0,0,.18)" }}>{community.emoji}</span>
          <div style={{ flex: 1, color: "#fff", paddingBottom: 4 }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 30, letterSpacing: "-.02em", textShadow: "0 1px 8px rgba(0,0,0,.25)" }}>{community.name}</div>
            <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.95 }}>{community.membersLabel} members · {community.posts} posts</div>
          </div>
          <button onClick={() => {}} style={{ padding: "11px 22px", borderRadius: 999, fontWeight: 800, fontSize: 14, background: "#FFC94A", color: "#2B2340", boxShadow: "0 var(--shadow-off,3px) 0 0 #B9851A" }}>Joined ✓</button>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "18px 4px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 14px", borderRadius: 999, background: "#fff", border: "1.5px solid rgba(43,35,64,.08)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4FB058" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#5A4E7A" }}>Owned by Pastor Dré · 3 admins</span>
        </div>
        <div style={{ flex: 1 }} />
        <p style={{ fontSize: 14, color: "#5A4E7A", fontWeight: 600, maxWidth: 420, textAlign: "right" }}>{community.blurb}</p>
      </div>
      {community.hasChildren && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#8A82A8", margin: "6px 4px 12px" }}>Harbors inside</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 26 }}>
            {childCommunities.map((c) => (
              <div key={c.id} style={{ background: "#fff", borderRadius: 18, border: "1.5px solid rgba(43,35,64,.06)", boxShadow: "0 6px 18px rgba(43,35,64,.05)", overflow: "hidden" }}>
                <div style={{ height: 64, background: c.cover, position: "relative", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 12px" }}>
                  <span style={{ position: "absolute", top: 10, left: 12, width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,.92)", display: "grid", placeItems: "center", fontSize: 20, boxShadow: "0 3px 9px rgba(0,0,0,.12)" }}>{c.emoji}</span>
                  <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 0 }}>
                    {c.shoal.map((f, i) => (
                      <svg key={i} width="18" height="11" viewBox="-5 0 32 20" style={f.style}>
                        <path d="M6 10 Q15 2 24 10 Q15 18 6 10 Z" fill="rgba(255,255,255,.85)" />
                        <path d="M6 10 L0 5 L2.5 10 L0 15 Z" fill="rgba(255,255,255,.85)" />
                      </svg>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "12px 14px 14px" }}>
                  <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 16 }}>{c.name}</div>
                  <p style={{ fontSize: 12.5, color: "#5A4E7A", fontWeight: 500, margin: "4px 0 0", lineHeight: 1.4 }}>{c.blurb}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                    <span style={{ fontSize: 11.5, color: "#8A82A8", fontWeight: 700 }}>{c.membersLabel} members</span>
                    <button onClick={c.onClick} style={{ padding: "6px 14px", borderRadius: 999, fontWeight: 800, fontSize: 12.5, background: "var(--c-primary,#1F7A8C)", color: "#fff", boxShadow: "0 var(--shadow-off,3px) 0 0 var(--c-primary-deep,#15616F)" }}>Dive in</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {communityFeed.map((p) => <MiniPostCard key={p.id} p={p} showCommunity={false} />)}
      </div>
    </div>
  );
}
