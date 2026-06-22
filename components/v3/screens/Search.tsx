import React from "react";
import type { ChangeEvent } from "react";
import { MiniPostCard } from "@/components/v3/PostCard";
import type { PostVM, TagChip } from "@/components/v3/types";
import type { CSSProperties } from "react";

interface AvailableTag {
  label: string;
  count: number;
  icon: string;
  onClick: () => void;
  style: CSSProperties;
  countStyle: CSSProperties;
}

interface SearchProps {
  filterQuery: string;
  onFilterQuery: (e: ChangeEvent<HTMLInputElement>) => void;
  filterSelected: TagChip[];
  filterHasSelected: boolean;
  clearFilter: () => void;
  filterTagsAvailable: AvailableTag[];
  filterNoTags: boolean;
  filterFeed: PostVM[];
  filterCount: number;
  filterEmpty: boolean;
}

export function SearchScreen(props: SearchProps) {
  const {
    filterQuery, onFilterQuery, filterSelected, filterHasSelected, clearFilter,
    filterTagsAvailable, filterNoTags, filterFeed, filterCount, filterEmpty,
  } = props;

  return (
    <div className="fh-surface" style={{ maxWidth: 900, margin: "0 auto", padding: "30px 30px 90px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#8A82A8" }}>Find Currents</div>
      <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 34, letterSpacing: "-.02em", margin: "8px 0 4px" }}>Cast, then narrow the water</h1>
      <p style={{ fontSize: 15, color: "#5A4E7A", fontWeight: 500, maxWidth: 560, margin: "0 0 20px" }}>Type a keyword to surface matching currents, then stack tags — each one you tap filters the catch further.</p>

      <div style={{ display: "flex", alignItems: "center", gap: 11, background: "#fff", padding: "13px 18px", borderRadius: 16, border: "1.5px solid rgba(43,35,64,.1)", boxShadow: "0 4px 14px rgba(43,35,64,.05)" }}>
        <span style={{ fontSize: 17 }}>🔍</span>
        <input value={filterQuery} onChange={onFilterQuery} placeholder="Search posts, verses, topics…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15, fontWeight: 600 }} />
      </div>

      {filterHasSelected && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginTop: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#8A82A8" }}>Riding:</span>
          {filterSelected.map((tg, i) => (
            <span key={i} style={tg.style}>
              <span>{tg.icon}</span><span>{tg.label}</span>
              <button onClick={tg.onRemove} style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,.3)", color: "#fff", fontSize: 12, fontWeight: 800, display: "grid", placeItems: "center", lineHeight: 1 }}>×</button>
            </span>
          ))}
          <button onClick={clearFilter} style={{ fontSize: 12.5, fontWeight: 800, color: "#8A82A8", padding: "6px 12px", borderRadius: 999 }}>Clear all</button>
        </div>
      )}

      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#8A82A8", margin: "22px 0 12px" }}>Available currents</div>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
        {filterTagsAvailable.map((tg, i) => (
          <button key={i} onClick={tg.onClick} style={tg.style}>
            <span>{tg.icon}</span><span>{tg.label}</span><span style={tg.countStyle}>{tg.count}</span>
          </button>
        ))}
        {filterNoTags && (
          <div style={{ fontSize: 13.5, color: "#8A82A8", fontWeight: 600 }}>No more currents to narrow by — this is the calmest the water gets.</div>
        )}
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#8A82A8", margin: "26px 0 12px" }}>{filterCount} in the catch</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filterFeed.map((p) => <MiniPostCard key={p.id} p={p} />)}
        {filterEmpty && (
          <div style={{ textAlign: "center", padding: "40px 20px", background: "#fff", borderRadius: 20, border: "1.5px solid rgba(43,35,64,.06)" }}>
            <div style={{ fontSize: 34 }}>🪝</div>
            <div style={{ fontWeight: 800, fontSize: 16, marginTop: 8 }}>Nothing in these waters</div>
            <div style={{ fontSize: 13.5, color: "#8A82A8", fontWeight: 600, marginTop: 4 }}>Drop a tag to widen the net, or start a post with this current.</div>
          </div>
        )}
      </div>
    </div>
  );
}
