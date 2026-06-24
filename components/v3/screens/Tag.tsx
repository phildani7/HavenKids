import React from "react";
import type { CSSProperties } from "react";
import { MiniPostCard } from "@/components/v3/PostCard";
import type { PostVM } from "@/components/v3/types";

interface TagProps {
  tagTitle: string;
  tagKind: string;
  tagIsScripture: boolean;
  tagVerse: string;
  tagEyebrowColor: string;
  tagReach: number;
  tagHeaderStyle: CSSProperties;
  tagFeed: PostVM[];
  toggleFollowTag: () => void;
  followBtnLabel: string;
  followBtnStyle: CSSProperties;
  goHome: () => void;
}

export function TagScreen(props: TagProps) {
  const {
    tagTitle, tagKind, tagIsScripture, tagVerse, tagEyebrowColor, tagReach,
    tagHeaderStyle, tagFeed, toggleFollowTag, followBtnLabel, followBtnStyle, goHome,
  } = props;
  return (
    <div className="fh-surface" style={{ maxWidth: 760, margin: "0 auto", padding: "30px 24px 90px" }}>
      <button onClick={goHome} style={{ fontSize: 13, fontWeight: 700, color: "#8A82A8", marginBottom: 16 }}>← back to the harbor</button>
      <div style={tagHeaderStyle}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: tagEyebrowColor }}>{tagKind} current</div>
        <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 30, letterSpacing: "-.02em", marginTop: 6, color: "#2B2340" }}>{tagTitle}</div>
        {tagIsScripture && (
          <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontWeight: 500, fontSize: 17, color: "#5A4E7A", marginTop: 8, lineHeight: 1.4 }}>{tagVerse}</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
          <button onClick={toggleFollowTag} style={followBtnStyle}>{followBtnLabel}</button>
          <div style={{ fontSize: 13, color: "#8A82A8", fontWeight: 700 }}>flows across {tagReach} communities</div>
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#8A82A8", margin: "24px 0 12px" }}>Riding this current</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {tagFeed.map((p) => <MiniPostCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
