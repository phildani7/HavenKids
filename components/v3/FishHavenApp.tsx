"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ACCENT,
  SHOW_GABRIEL,
  REDUCE_MOTION,
  BANDS,
  SYNONYMS,
  type BandKey,
  type FeedPost,
  type Community,
  type DmMessage,
  profiles,
  pendingMedia,
  notifs,
  communities,
  users,
  feed,
  prayers,
  events,
  trending,
  verses,
  dms,
  hex,
  clean,
  isScripture,
  tagType,
  tagColor,
  tagIcon,
  disp,
  cmap,
  primary as primaryFn,
  primaryDeep as primaryDeepFn,
  shoal,
  shoalRail,
  genTags,
  shareInfo,
  buildCalendar,
  WEEKDAY_ABBR,
  IMG_BG,
  IMG_LABEL,
} from "@/lib/v3/data";
import { HomeScreen } from "@/components/v3/screens/Home";
import { DiscoverScreen } from "@/components/v3/screens/Discover";
import { SearchScreen } from "@/components/v3/screens/Search";
import { EventsScreen } from "@/components/v3/screens/Events";
import { CommunityScreen } from "@/components/v3/screens/Community";
import { PrayerScreen } from "@/components/v3/screens/Prayer";
import { ProfileScreen } from "@/components/v3/screens/Profile";
import { FamilyScreen } from "@/components/v3/screens/Family";
import { MessagesScreen } from "@/components/v3/screens/Messages";
import { TagScreen } from "@/components/v3/screens/Tag";

// ------- view model types passed to screens -------
export interface TagChip {
  label: string;
  icon: string;
  style: CSSProperties;
  onClick?: () => void;
  onRemove?: () => void;
}

export interface ReactionChip {
  key: string;
  icon: string;
  count: number;
  onClick: () => void;
  style: CSSProperties;
}

export interface PostVM extends FeedPost {
  cName: string;
  cEmoji: string;
  uName: string;
  uAvatar: string;
  uColor: string;
  imageBg?: string;
  imageLabel: string;
  crossShared: boolean;
  shareIcon: string;
  shareLabel: string;
  shareNote: string;
  tagList: TagChip[];
  reactionList: ReactionChip[];
}

type Route = { page: string; tag?: string; communityId?: string };

const NAV_ITEMS = [
  { id: "home", label: "Home", iconPath: "M3 10.5L12 3l9 7.5M5.5 9.3V20h13V9.3" },
  { id: "discover", label: "Discover", iconPath: "M12 3a9 9 0 100 18 9 9 0 000-18zM15.6 8.4l-2.3 4.9-4.9 2.3 2.3-4.9z" },
  { id: "filter", label: "Find Currents", iconPath: "M3 8.5c3-3 6 3 9 0s6-3 9 0M3 15.5c3-3 6 3 9 0s6-3 9 0" },
  { id: "calendar", label: "Calendar", iconPath: "M4 6h16v14H4zM4 10h16M8 3.5v4M16 3.5v4" },
  { id: "chat", label: "Messages", iconPath: "M4 5h16v10H9l-4 4V5z" },
  { id: "prayer", label: "Prayer Wall", iconPath: "M12 4c1.9 2.7 2.9 3.9 2.9 6.1a2.9 2.9 0 11-5.8 0C9.1 7.9 10.1 6.7 12 4zM7.5 20.5h9" },
  { id: "profile", label: "Profile", iconPath: "M12 11.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM5.5 20a6.5 6.5 0 0113 0" },
];

interface BuiltResult {
  type: string;
  title: string;
  sub: string;
  icon: string;
  color: string;
  act: () => void;
}

export function FishHavenApp({
  accent = ACCENT,
  showGabriel = SHOW_GABRIEL,
  reduceMotion = REDUCE_MOTION,
}: {
  accent?: string;
  showGabriel?: boolean;
  reduceMotion?: boolean;
}) {
  // ---------- state ----------
  const [route, setRoute] = useState<Route>({ page: "home" });
  const [band, setBand] = useState<BandKey>("teen");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [facet, setFacet] = useState("All");
  const [pIndex, setPIndex] = useState(0);
  const [reacted, setReacted] = useState<Record<string, boolean>>({});
  const [prayed, setPrayed] = useState<Record<string, boolean>>({});
  const [followed, setFollowed] = useState<string[]>(["#worship", "Psalm 23", "#gratitude"]);
  const [filter, setFilter] = useState("For You");
  const [composer, setComposer] = useState(
    "Wrote a new worship song for Friday night — it leans on Psalm 96 🎶",
  );
  const [composerTags, setComposerTags] = useState<string[]>([]);
  const [composerEdited, setComposerEdited] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [prayerDraft, setPrayerDraft] = useState("");
  const [dmThread, setDmThread] = useState(0);
  const [dmExtra, setDmExtra] = useState<Record<number, string[]>>({ 0: [], 1: [], 2: [] });
  const [dmDraft, setDmDraft] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [visMode, setVisMode] = useState("local");
  const [visSelected, setVisSelected] = useState<string[]>(["worship", "bible"]);
  const [visOpen, setVisOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [profileIdx, setProfileIdx] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pinFor, setPinFor] = useState<number | null>(null);
  const [pinEntry, setPinEntry] = useState("");
  const [pinError, setPinError] = useState(false);
  const [mediaStatus, setMediaStatus] = useState<Record<string, string>>({});
  const [posting, setPosting] = useState<Record<string, boolean>>({});
  const [rsvp, setRsvp] = useState<Record<string, boolean>>({});

  const paletteRef = useRef<HTMLInputElement | null>(null);

  const t = BANDS[band];
  const prim = primaryFn(accent, t);
  const deep = primaryDeepFn(accent, t);

  const activeProfile = profiles[profileIdx];

  // ---------- navigation ----------
  const go = useCallback((page: string, extra?: Partial<Route>) => {
    setRoute({ page, ...(extra || {}) });
    setPaletteOpen(false);
  }, []);

  // ---------- profile switching + PIN ----------
  const commitProfile = useCallback((i: number) => {
    setProfileIdx(i);
    setBand(profiles[i].band);
    setVisMode("local");
    setVisSelected([profiles[i].local]);
    setPinFor(null);
    setPinEntry("");
    setPinError(false);
  }, []);

  const switchProfile = useCallback(
    (i: number) => {
      if (i === profileIdx) {
        setMenuOpen(false);
        return;
      }
      setPinFor(i);
      setPinEntry("");
      setPinError(false);
      setMenuOpen(false);
    },
    [profileIdx],
  );

  const pinKey = useCallback(
    (d: string) => {
      if (pinEntry.length >= 4) return;
      const ne = pinEntry + d;
      if (ne.length === 4) {
        if (ne === "1234" && pinFor !== null) commitProfile(pinFor);
        else {
          setPinEntry("");
          setPinError(true);
        }
      } else {
        setPinEntry(ne);
        setPinError(false);
      }
    },
    [pinEntry, pinFor, commitProfile],
  );

  const pinDel = useCallback(() => {
    setPinEntry((e) => e.slice(0, -1));
    setPinError(false);
  }, []);

  const closePin = useCallback(() => {
    setPinFor(null);
    setPinEntry("");
    setPinError(false);
  }, []);

  // ---------- reactions / prayers ----------
  const react = useCallback((id: string, k: string) => {
    setReacted((r) => ({ ...r, [id + ":" + k]: !r[id + ":" + k] }));
  }, []);
  const pray = useCallback((id: string) => {
    setPrayed((p) => ({ ...p, [id]: true }));
  }, []);

  // ---------- media (family) ----------
  const setMedia = useCallback((id: string, s: string) => {
    setMediaStatus((m) => ({ ...m, [id]: s }));
  }, []);
  const togglePosting = useCallback((name: string) => {
    setPosting((p) => ({ ...p, [name]: p[name] === false ? true : false }));
  }, []);

  // ---------- composer tags ----------
  const autoTags = composerEdited ? composerTags : genTags(composer);
  const editTags = useCallback(
    (fn: (a: string[]) => string[]) => {
      const base = (composerEdited ? composerTags : genTags(composer)).slice();
      setComposerTags(fn(base));
      setComposerEdited(true);
    },
    [composerEdited, composerTags, composer],
  );
  const removeComposerTag = useCallback(
    (label: string) => editTags((a) => a.filter((x) => x !== label)),
    [editTags],
  );
  const addComposerTag = useCallback(() => {
    const v = newTag.trim();
    if (!v) return;
    let lbl = v;
    if (!isScripture(v) && !v.startsWith("#")) lbl = "#" + v.replace(/^#+/, "");
    editTags((a) =>
      a.some((x) => clean(x).toLowerCase() === clean(lbl).toLowerCase())
        ? a
        : [...a, lbl],
    );
    setNewTag("");
  }, [newTag, editTags]);

  // ---------- filter page ----------
  const filterMatches = useCallback(() => {
    const q = filterQuery.toLowerCase().trim();
    const norm = (x: string) => clean(x).toLowerCase();
    const sel = filterTags.map(norm);
    return feed.filter((p) => {
      const hay = (p.title + " " + p.body + " " + p.tags.join(" ")).toLowerCase();
      const kw = !q || hay.includes(q);
      const hasAll = sel.every((s) => p.tags.some((tg) => norm(tg) === s));
      return kw && hasAll;
    });
  }, [filterQuery, filterTags]);

  const filterAvailableTags = useCallback(() => {
    const norm = (x: string) => clean(x).toLowerCase();
    const sel = filterTags.map(norm);
    const counts: Record<string, number> = {};
    filterMatches().forEach((p) =>
      p.tags.forEach((tg) => {
        if (!sel.includes(norm(tg))) counts[tg] = (counts[tg] || 0) + 1;
      }),
    );
    return Object.keys(counts)
      .map((label) => ({ label, count: counts[label] }))
      .sort((a, b) => b.count - a.count);
  }, [filterTags, filterMatches]);

  const toggleFilterTag = useCallback(
    (label: string) => {
      const norm = (x: string) => clean(x).toLowerCase();
      setFilterTags((prev) =>
        prev.some((tg) => norm(tg) === norm(label))
          ? prev.filter((tg) => norm(tg) !== norm(label))
          : [...prev, label],
      );
    },
    [],
  );
  const clearFilter = useCallback(() => {
    setFilterTags([]);
    setFilterQuery("");
  }, []);

  // ---------- visibility ----------
  const cm = useMemo(() => cmap(), []);
  const visLabel = (() => {
    if (visMode === "everyone") return "Everyone";
    if (visMode === "select")
      return (
        visSelected.length +
        " communit" +
        (visSelected.length === 1 ? "y" : "ies")
      );
    return cm[activeProfile.local] ? cm[activeProfile.local].name : "My community";
  })();
  const visIcon = visMode === "everyone" ? "🌐" : visMode === "select" ? "🔗" : "📍";
  const setVisModeFn = useCallback(
    (m: string) => {
      setVisMode(m);
      setVisOpen(m === "select");
      if (m === "select" && visSelected.length === 0)
        setVisSelected([activeProfile.local]);
    },
    [visSelected.length, activeProfile.local],
  );
  const toggleVisCommunity = useCallback((id: string) => {
    setVisSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  // ---------- tags follow ----------
  const toggleFollowTag = useCallback(() => {
    const tg = route.tag;
    if (!tg) return;
    setFollowed((prev) =>
      prev.includes(tg) ? prev.filter((x) => x !== tg) : [...prev, tg],
    );
  }, [route.tag]);

  // ---------- dm ----------
  const activeMessages = useMemo<DmMessage[]>(() => {
    const th = dms[dmThread];
    const base: DmMessage[] = th.msgs.map((m) => ({ ...m }));
    const extra: DmMessage[] = (dmExtra[dmThread] || []).map((text) => ({
      me: true,
      text,
    }));
    return [...base, ...extra];
  }, [dmThread, dmExtra]);

  const sendDm = useCallback(() => {
    const v = dmDraft.trim();
    if (!v) return;
    setDmExtra((ex) => ({
      ...ex,
      [dmThread]: [...(ex[dmThread] || []), v],
    }));
    setDmDraft("");
  }, [dmDraft, dmThread]);

  const toggleRsvp = useCallback((key: string) => {
    setRsvp((r) => ({ ...r, [key]: !r[key] }));
  }, []);

  // ---------- palette ----------
  const buildResults = useCallback((): BuiltResult[] => {
    const all: BuiltResult[] = [];
    communities.forEach((c) =>
      all.push({
        type: "Community",
        title: c.name,
        sub: c.members.toLocaleString() + " members",
        icon: c.emoji,
        color: hex(c.color),
        act: () => go("community", { communityId: c.id }),
      }),
    );
    const seen = new Set<string>();
    [...trending.map((tr) => tr.label), ...feed.flatMap((p) => p.tags)].forEach(
      (tg) => {
        const key = clean(tg).toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        if (isScripture(tg))
          all.push({
            type: "Scripture",
            title: clean(tg),
            sub: "verse current",
            icon: "✝",
            color: "#E8A825",
            act: () => go("tag", { tag: tg }),
          });
        else
          all.push({
            type: "Tag",
            title: tg,
            sub: "topic current",
            icon: "#",
            color: "#1F7A8C",
            act: () => go("tag", { tag: tg }),
          });
      },
    );
    users.forEach((u) =>
      all.push({
        type: "Person",
        title: u.name,
        sub: "in your shoal",
        icon: u.avatar,
        color: hex(u.color),
        act: () => go("profile"),
      }),
    );
    feed.forEach((p) =>
      all.push({
        type: "Post",
        title: p.title,
        sub: "in " + cm[p.c].name,
        icon: "📝",
        color: "#5A4E7A",
        act: () => go("community", { communityId: p.c }),
      }),
    );
    prayers.forEach((p) =>
      all.push({
        type: "Prayer",
        title: p.text.slice(0, 48) + (p.text.length > 48 ? "…" : ""),
        sub: p.prayers + " praying",
        icon: "🙏",
        color: "#FF7E6B",
        act: () => go("prayer"),
      }),
    );
    events.forEach((e) =>
      all.push({
        type: "Event",
        title: e.title,
        sub: e.date + " · " + e.time,
        icon: "📅",
        color: "#E8A825",
        act: () => go("home"),
      }),
    );
    return all;
  }, [cm, go]);

  const match = (title: string, q: string) => {
    const s = title.toLowerCase();
    if (s.includes(q)) return true;
    let i = 0;
    for (const ch of s) {
      if (ch === q[i]) i++;
      if (i >= q.length) return true;
    }
    return false;
  };

  const filteredResults = useCallback((): BuiltResult[] => {
    let q = query.toLowerCase().trim();
    if (SYNONYMS[q]) q = SYNONYMS[q];
    const facetMap: Record<string, string> = {
      People: "Person",
      Communities: "Community",
      Posts: "Post",
      Prayers: "Prayer",
      Events: "Event",
      Scripture: "Scripture",
      Tags: "Tag",
    };
    let res = buildResults();
    if (facet !== "All") res = res.filter((r) => r.type === facetMap[facet]);
    if (!q) {
      if (facet === "All")
        res = res
          .filter(
            (r) =>
              r.type === "Scripture" || r.type === "Tag" || r.type === "Community",
          )
          .slice(0, 7);
      else res = res.slice(0, 8);
    } else {
      res = res.filter((r) => match(r.title, q) || match(r.sub, q)).slice(0, 12);
    }
    return res;
  }, [query, facet, buildResults]);

  const openPalette = useCallback(() => {
    setPaletteOpen(true);
    setQuery("");
    setFacet("All");
    setPIndex(0);
  }, []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  const onPaletteKey = useCallback(
    (e: React.KeyboardEvent) => {
      const res = filteredResults();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setPIndex((i) => Math.min(res.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setPIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const r = res[pIndex];
        if (r) r.act();
      } else if (e.key === "Escape") {
        closePalette();
      }
    },
    [filteredResults, pIndex, closePalette],
  );

  // ---------- keyboard shortcuts ----------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const tagName = (target?.tagName || "").toLowerCase();
      const typing = tagName === "input" || tagName === "textarea";
      if (meta && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen((open) => {
          if (open) return false;
          setQuery("");
          setFacet("All");
          setPIndex(0);
          return true;
        });
      } else if (e.key === "/" && !typing && !paletteOpen) {
        e.preventDefault();
        openPalette();
      } else if (e.key === "Escape" && paletteOpen) {
        closePalette();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [paletteOpen, openPalette, closePalette]);

  // focus palette input when it opens
  useEffect(() => {
    if (paletteOpen && paletteRef.current) paletteRef.current.focus();
  }, [paletteOpen]);

  // ---------- post view builder ----------
  const postView = useCallback(
    (p: FeedPost): PostVM => {
      const c = cm[p.c];
      const u = users[p.u];
      const si = shareInfo(p);
      return {
        ...p,
        cName: c.name,
        cEmoji: c.emoji,
        uName: u.name,
        uAvatar: u.avatar,
        uColor: hex(u.color),
        imageBg: p.image ? IMG_BG[p.image] : undefined,
        imageLabel: (p.image && IMG_LABEL[p.image]) || "image",
        crossShared: si.cross,
        shareIcon: si.icon,
        shareLabel: si.label,
        shareNote: si.note,
        tagList: p.tags.map((tg) => ({
          label: disp(tg),
          icon: tagIcon(tg),
          onClick: () => go("tag", { tag: tg }),
          style: {
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 11px",
            borderRadius: "999px",
            fontSize: "12.5px",
            fontWeight: 800,
            color: "#fff",
            whiteSpace: "nowrap",
            background: tagColor(tg),
            border: "none",
          },
        })),
        reactionList: (
          [
            ["heart", "❤️"],
            ["amen", "🙏"],
            ["praise", "🎉"],
            ["wow", "✨"],
          ] as const
        ).map(([k, icon]) => {
          const active = !!reacted[p.id + ":" + k];
          const base = (p.react as Record<string, number>)[k] || 0;
          return {
            key: k,
            icon,
            count: base + (active ? 1 : 0),
            onClick: () => react(p.id, k),
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 13px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: 700,
              color: active ? "#15616F" : "#5A4E7A",
              background: active ? "rgba(31,122,140,.12)" : "rgba(43,35,64,.05)",
              border: active
                ? "1.5px solid rgba(31,122,140,.5)"
                : "1.5px solid transparent",
            },
          };
        }),
      };
    },
    [cm, reacted, react, go],
  );

  // ---------- depth ----------
  const page = route.page;
  const depthOf: Record<string, number> = {
    home: 0, discover: 0, filter: 0, calendar: 0, admin: 2,
    tag: 1, community: 1, profile: 1, prayer: 1, chat: 3,
  };
  let d = depthOf[page] ?? 0;
  if (page === "community") {
    const cc = cm[route.communityId || ""];
    d = cc && cc.parent ? 2 : 1;
  }
  const isAdminPage = page === "admin";
  const depthBg = isAdminPage
    ? "#F5F2EC"
    : d === 3
      ? "radial-gradient(120% 80% at 30% 0%, #14515F, transparent 60%), #0E3A45"
      : d === 2
        ? "linear-gradient(180deg,#F2EFE6,#E6EEEE)"
        : d === 1
          ? "#F2EFE6"
          : "#F5F2EC";
  const depthStyle: CSSProperties = {
    background: depthBg,
    color: d === 3 ? "#EAF6F4" : isAdminPage ? "#1A1A1A" : "#2B2340",
    minHeight: "calc(100vh - 71px)",
    transition: "background .4s ease, color .4s ease",
  };

  // ---------- dock / shell ----------
  const expanded = !navCollapsed;
  const shellStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: expanded ? "252px 1fr" : "78px 1fr",
    minHeight: "100vh",
    width: "100%",
  };
  const sidebarStyle: CSSProperties = {
    position: "sticky",
    top: 0,
    alignSelf: "start",
    height: "100vh",
    overflowY: "auto",
    overflowX: "hidden",
    background: "#FFFDF8",
    borderRight: "1px solid rgba(43,35,64,.08)",
    padding: expanded ? "20px 14px" : "18px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  };
  const headerStyle: CSSProperties = expanded
    ? { display: "flex", alignItems: "center", gap: "11px", padding: "2px 4px 14px" }
    : { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "2px 0 14px" };
  const collapseBtnStyle: CSSProperties = {
    width: "30px", height: "30px", borderRadius: "9px",
    background: "rgba(43,35,64,.05)", display: "grid", placeItems: "center",
    fontSize: "15px", color: "#5A4E7A", flexShrink: 0,
  };

  const nav = NAV_ITEMS.map((n) => {
    const active = page === n.id;
    return {
      ...n,
      onClick: () => go(n.id),
      title: n.label,
      navStyle: {
        display: "flex", alignItems: "center", gap: "11px",
        padding: expanded ? "10px 12px" : "11px 0",
        justifyContent: expanded ? "flex-start" : "center",
        borderRadius: "13px", fontSize: "14px", fontWeight: 700,
        background: active ? "rgba(31,122,140,.1)" : "transparent",
        color: active ? "#0E3A45" : "#2B2340",
      } as CSSProperties,
      lampStyle: {
        width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
        background: active ? "#FFC94A" : "rgba(43,35,64,.15)",
        boxShadow: active ? "0 0 8px 1px #FFC94A" : "none",
      } as CSSProperties,
    };
  });

  const myCommunities = communities
    .filter((c) => !c.parent)
    .slice(0, 5)
    .map((c) => ({
      ...c,
      onClick: () => go("community", { communityId: c.id }),
      title: c.name,
      rowStyle: {
        display: "flex", alignItems: "center", gap: "10px",
        padding: expanded ? "7px 9px" : "6px 0",
        justifyContent: expanded ? "flex-start" : "center",
        borderRadius: "11px", textAlign: "left", fontSize: "13px", fontWeight: 700,
      } as CSSProperties,
    }));

  const followedView = followed.map((label) => ({
    label,
    title: label,
    onClick: () => go("tag", { tag: label }),
    dotStyle: {
      width: "8px", height: "8px", borderRadius: "2px",
      background: tagColor(label), flexShrink: 0, transform: "rotate(45deg)",
    } as CSSProperties,
    rowStyle: {
      display: "flex", alignItems: "center", gap: "9px",
      padding: expanded ? "7px 10px" : "8px 0",
      justifyContent: expanded ? "flex-start" : "center",
      borderRadius: "11px", textAlign: "left", fontSize: "13px",
      fontWeight: 700, color: "#5A4E7A",
    } as CSSProperties,
  }));

  const profileBtnStyle: CSSProperties = expanded
    ? { display: "flex", alignItems: "center", gap: "11px", padding: "10px", borderRadius: "16px", background: "#FFF8EC", border: "1.5px solid rgba(43,35,64,.07)", textAlign: "left", marginTop: "10px" }
    : { display: "grid", placeItems: "center", padding: "8px 0", marginTop: "10px" };

  // ---------- PIN ----------
  const pinOpen = pinFor !== null;
  const pinProfile = pinOpen ? profiles[pinFor as number] : null;
  const pinDots = [0, 1, 2, 3].map((i) => ({
    style: {
      width: "14px", height: "14px", borderRadius: "50%",
      border: "2px solid " + (pinError ? "#E85C47" : "rgba(43,35,64,.3)"),
      background:
        i < pinEntry.length
          ? pinError
            ? "#E85C47"
            : "var(--c-primary,#1F7A8C)"
          : "transparent",
    } as CSSProperties,
  }));
  const pinKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map(
    (k) => ({
      key: k || "blank",
      label: k === "del" ? "⌫" : k,
      onClick: k === "del" ? pinDel : k === "" ? () => {} : () => pinKey(k),
      style: {
        height: "56px", borderRadius: "14px", fontSize: "22px", fontWeight: 700,
        color: "#2B2340",
        background: k === "" ? "transparent" : "rgba(43,35,64,.04)",
        border: "none", cursor: k === "" ? "default" : "pointer",
      } as CSSProperties,
    }),
  );

  // ---------- palette view ----------
  const results = filteredResults();
  const facetList = [
    "All", "People", "Communities", "Posts", "Prayers", "Events", "Scripture", "Tags",
  ].map((label) => {
    const on = facet === label;
    return {
      label,
      onClick: () => {
        setFacet(label);
        setPIndex(0);
      },
      style: {
        padding: "6px 13px", borderRadius: "999px", fontSize: "12.5px",
        fontWeight: 800, whiteSpace: "nowrap",
        background: on ? "#1F7A8C" : "rgba(43,35,64,.05)",
        color: on ? "#fff" : "#5A4E7A", border: "none",
      } as CSSProperties,
    };
  });
  const paletteResults = results.map((r, i) => {
    const active = i === pIndex;
    return {
      title: r.title, sub: r.sub, icon: r.icon, type: r.type,
      onClick: () => r.act(),
      onHover: () => setPIndex(i),
      style: {
        display: "flex", alignItems: "center", gap: "13px", width: "100%",
        padding: "11px 13px", borderRadius: "13px", border: "none",
        background: active ? "rgba(31,122,140,.1)" : "transparent",
      } as CSSProperties,
      iconStyle: {
        width: "38px", height: "38px", borderRadius: "11px", display: "grid",
        placeItems: "center", fontSize: "18px", flexShrink: 0, color: "#fff",
        background: r.color,
      } as CSSProperties,
      tagStyle: {
        fontSize: "10.5px", fontWeight: 800, letterSpacing: ".05em",
        textTransform: "uppercase", color: r.color, background: "rgba(43,35,64,.05)",
        padding: "4px 9px", borderRadius: "999px", flexShrink: 0,
      } as CSSProperties,
    };
  });

  // ---------- bell + menu ----------
  const me = activeProfile;
  const unread = notifs.filter((n) => n.unread).length;
  const notifsView = notifs.map((n) => ({
    ...n,
    iconStyle: {
      width: "38px", height: "38px", borderRadius: "11px", display: "grid",
      placeItems: "center", fontSize: "18px", flexShrink: 0,
      background: n.color + "22",
    } as CSSProperties,
    rowStyle: {
      display: "flex", gap: "12px", padding: "11px 14px", borderRadius: "13px",
      background: n.unread ? "rgba(31,122,140,.05)" : "transparent",
      alignItems: "flex-start", width: "100%", textAlign: "left", border: "none",
    } as CSSProperties,
  }));
  const profilesView = profiles.map((p, i) => {
    const on = profileIdx === i;
    return {
      name: p.name, avatar: p.avatar, sub: p.sub,
      onClick: () => switchProfile(i),
      rowStyle: {
        display: "flex", alignItems: "center", gap: "11px", padding: "9px 10px",
        borderRadius: "12px", width: "100%", textAlign: "left", border: "none",
        background: on ? "rgba(31,122,140,.08)" : "transparent",
      } as CSSProperties,
      avatarStyle: {
        width: "36px", height: "36px", borderRadius: "50%", display: "grid",
        placeItems: "center", fontSize: "19px", background: "#EAF6F4",
        border: on ? "2.5px solid var(--c-primary,#1F7A8C)" : "2px solid rgba(43,35,64,.1)",
        flexShrink: 0,
      } as CSSProperties,
      active: on,
    };
  });

  const toggleBell = () => {
    setBellOpen((b) => !b);
    setMenuOpen(false);
  };
  const toggleMenu = () => {
    setMenuOpen((m) => !m);
    setBellOpen(false);
  };
  const closeOverlays = () => {
    setBellOpen(false);
    setMenuOpen(false);
  };

  // ---------- root style (age-dial theming) ----------
  const rootStyle = {
    "--c-primary": prim,
    "--c-primary-deep": deep,
    "--btn-shadow": t.btnShadow,
    "--card-shadow": t.cardShadow,
    "--radius": t.radius + "px",
    "--radius-lg": t.radiusLg + "px",
    "--shadow-off": t.shadow + "px",
    fontWeight: t.weight,
    minHeight: "100vh",
  } as CSSProperties;

  // ---------- shoals ----------
  const heroShoal = shoal(14, "#9FDCE6", reduceMotion);
  const railShoal = shoalRail(11, "#1F7A8C", reduceMotion);
  const connShoal = shoal(9, "#1F7A8C", reduceMotion);

  // ---------- per-screen derived data ----------
  // feed filtering
  let feedRaw = feed;
  if (filter === "Scripture")
    feedRaw = feed.filter((p) => p.tags.some((x) => isScripture(x)));
  else if (filter === "Prayer")
    feedRaw = feed.filter((p) => p.c === "prayer" || p.tags.includes("#prayer"));
  else if (filter === "Following")
    feedRaw = feed.filter((p) => ["worship", "art", "bible"].includes(p.c));
  const feedView = feedRaw.map(postView);

  const filters = ["For You", "Following", "Scripture", "Prayer", "Recent"].map(
    (label) => {
      const on = filter === label;
      return {
        label,
        onClick: () => setFilter(label),
        style: {
          padding: "8px 15px", borderRadius: "999px", fontSize: "13px",
          fontWeight: 800, background: on ? prim : "rgba(43,35,64,.05)",
          color: on ? "#fff" : "#5A4E7A", border: "none",
        } as CSSProperties,
      };
    },
  );

  const trendingView = trending.map((c) => ({
    ...c,
    color: tagColor(c.label),
    icon: tagIcon(c.label),
    count: c.count.toLocaleString(),
    onClick: () => go("tag", { tag: c.label }),
  }));
  const eventsView = events.map((e) => ({
    ...e,
    cName: cm[e.c].name,
    day: WEEKDAY_ABBR[new Date(2026, 5, e.date).getDay()],
  }));

  const composerChips = (
    [
      ["M4 7.5h3L8.5 5.5h7L17 7.5h3v11H4zM12 11a3 3 0 100 6 3 3 0 000-6z", "Photo"],
      ["M4 20l4-1 9.5-9.5-3-3L5 16zM14.5 6l3 3", "Doodle"],
      ["M12 4c1.9 2.7 2.9 3.9 2.9 6.1a2.9 2.9 0 11-5.8 0C9.1 7.9 10.1 6.7 12 4zM7.5 20.5h9", "Prayer"],
      ["M5 4.5h10a2 2 0 012 2v13H7a2 2 0 01-2-2zM5 17.5h12", "Verse"],
      ["M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 10.5h.01M14.5 10.5h.01M9 14.5c1 1 5 1 6 0", "Feeling"],
    ] as const
  ).map(([iconPath, label]) => ({ iconPath, label }));

  const autoTagChips = autoTags.map((label) => ({
    label: disp(label),
    icon: tagIcon(label),
    onRemove: () => removeComposerTag(label),
    style: {
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "5px 6px 5px 11px", borderRadius: "999px", fontSize: "12.5px",
      fontWeight: 800, color: "#fff", whiteSpace: "nowrap",
      background: tagColor(label), border: "none",
    } as CSSProperties,
  }));
  const autoTagSummary =
    autoTags.slice(0, 3).map((x) => disp(x)).join("  ") +
    (autoTags.length > 3 ? "  +" + (autoTags.length - 3) : "");

  const visModeRadios = [
    { id: "local", icon: "📍", title: cm[activeProfile.local] ? cm[activeProfile.local].name : "My community", sub: "Your home water · default" },
    { id: "everyone", icon: "🌐", title: "Everyone", sub: "Anyone across the harbor" },
    { id: "select", icon: "🔗", title: "Pick communities", sub: "Share once — comments stay shared" },
  ].map((o) => {
    const on = visMode === o.id;
    return {
      ...o,
      onClick: () => setVisModeFn(o.id),
      rowStyle: {
        display: "flex", alignItems: "center", gap: "11px", width: "100%",
        padding: "10px", borderRadius: "12px", textAlign: "left", border: "none",
        background: on ? "rgba(31,122,140,.08)" : "transparent",
      } as CSSProperties,
      dot: on,
    };
  });
  const visCommunityChecks = communities.slice(0, 6).map((c) => {
    const on = visSelected.includes(c.id);
    return {
      id: c.id, name: c.name, emoji: c.emoji,
      onClick: () => toggleVisCommunity(c.id),
      boxStyle: {
        width: "20px", height: "20px", borderRadius: "6px", display: "grid",
        placeItems: "center", fontSize: "13px", color: "#fff", flexShrink: 0,
        background: on ? "var(--c-primary,#1F7A8C)" : "transparent",
        border: on ? "none" : "1.5px solid rgba(43,35,64,.25)",
      } as CSSProperties,
      check: on ? "✓" : "",
    };
  });

  // quick actions
  const quickActions = (
    [
      { label: "Prayer Wall", sub: "6 need you today", tint: "#1F7A8C", iconPath: "M12 4c1.9 2.7 2.9 3.9 2.9 6.1a2.9 2.9 0 11-5.8 0C9.1 7.9 10.1 6.7 12 4zM7.5 20.5h9", goTo: "prayer" },
      { label: "Discover", sub: "9 harbors open", tint: "#C26551", iconPath: "M12 3a9 9 0 100 18 9 9 0 000-18zM15.6 8.4l-2.3 4.9-4.9 2.3 2.3-4.9z", goTo: "discover" },
      { label: "Worship Night", sub: "Fri 7pm · RSVP", tint: "#7B6BA6", iconPath: "M9 17.5V6l10-2v11.5M9 9.5l10-2M9 17.5a2.3 2.3 0 11-4.6 0 2.3 2.3 0 014.6 0zM19 15.5a2.3 2.3 0 11-4.6 0 2.3 2.3 0 014.6 0z", goTo: null as string | null },
      { label: "Messages", sub: "2 new", tint: "#5C9866", iconPath: "M4 5h16v10H9l-4 4V5z", goTo: "chat" },
    ] as const
  ).map((q) => ({
    ...q,
    onClick: () => q.goTo && go(q.goTo),
    style: {
      textAlign: "left", padding: "16px", borderRadius: "14px", background: "#fff",
      border: "1px solid rgba(43,35,64,.09)", boxShadow: "0 1px 2px rgba(43,35,64,.04)",
    } as CSSProperties,
    iconWrap: {
      display: "inline-grid", placeItems: "center", width: "40px", height: "40px",
      borderRadius: "11px", background: q.tint + "1a",
    } as CSSProperties,
  }));

  // discover
  const discoverView = communities
    .filter((c) => !c.parent)
    .map((c) => ({
      ...c,
      membersLabel: c.members.toLocaleString(),
      onClick: () => go("community", { communityId: c.id }),
      shoal: shoal(
        Math.max(3, Math.min(8, Math.round(c.members / 450))),
        "#fff",
        reduceMotion,
      ).map((s) => ({
        style: {
          marginLeft: s.style.marginLeft,
          opacity: s.style.opacity,
          animation: s.style.animation,
        } as CSSProperties,
      })),
    }));

  // calendar
  const calWeeks = buildCalendar().map((week) =>
    week.map((cell) => {
      if (!cell)
        return {
          blank: true,
          cellStyle: { minHeight: "92px", borderRadius: "12px" } as CSSProperties,
        };
      return {
        blank: false,
        date: cell.date,
        today: cell.today,
        cellStyle: {
          minHeight: "92px", borderRadius: "12px", padding: "7px 8px",
          background: cell.today ? "rgba(31,122,140,.08)" : "#fff",
          border: cell.today
            ? "2px solid var(--c-primary,#1F7A8C)"
            : "1.5px solid rgba(43,35,64,.07)",
          display: "flex", flexDirection: "column", gap: "4px",
        } as CSSProperties,
        dateStyle: {
          fontSize: "13px", fontWeight: 800,
          color: cell.today ? "#15616F" : "#5A4E7A", alignSelf: "flex-start",
        } as CSSProperties,
        events: cell.events.map((e) => ({
          title: e.title,
          emoji: e.emoji,
          chipStyle: {
            display: "flex", alignItems: "center", gap: "4px", fontSize: "10.5px",
            fontWeight: 700, color: "#fff", background: e.color, borderRadius: "5px",
            padding: "2px 5px", overflow: "hidden", whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          } as CSSProperties,
        })),
      };
    }),
  );
  const calRsvp = events.map((e) => {
    const key = "e" + e.date;
    const on = !!rsvp[key];
    return {
      title: e.title, time: e.time, cName: cm[e.c].name, date: e.date,
      day: WEEKDAY_ABBR[new Date(2026, 5, e.date).getDay()],
      rsvpLabel: on ? "Going ✓" : "RSVP",
      onClick: () => toggleRsvp(key),
      rsvpStyle: {
        padding: "7px 14px", borderRadius: "999px", fontSize: "12.5px",
        fontWeight: 800, border: "none",
        background: on ? "rgba(79,176,88,.16)" : "#FFC94A",
        color: on ? "#2F7A3A" : "#2B2340",
        boxShadow: on ? "none" : "0 " + t.shadow + "px 0 0 #B9851A",
      } as CSSProperties,
    };
  });

  // community
  const curC: Community = cm[route.communityId || ""] || communities[0];
  const parentC = curC.parent ? cm[curC.parent] : null;
  const childCommunities = communities
    .filter((c) => c.parent === curC.id)
    .map((c) => ({
      ...c,
      membersLabel: c.members.toLocaleString(),
      onClick: () => go("community", { communityId: c.id }),
      shoal: shoal(
        Math.max(3, Math.min(7, Math.round(c.members / 60))),
        "#fff",
        reduceMotion,
      ).map((s) => ({
        style: {
          marginLeft: s.style.marginLeft,
          opacity: s.style.opacity,
          animation: s.style.animation,
        } as CSSProperties,
      })),
    }));
  const community = {
    ...curC,
    membersLabel: curC.members.toLocaleString(),
    isNested: !!parentC,
    hasChildren: childCommunities.length > 0,
    parentName: parentC ? parentC.name : "",
    parentEmoji: parentC ? parentC.emoji : "",
    goParent: parentC
      ? () => go("community", { communityId: parentC.id })
      : () => {},
  };
  const communityFeedRaw = feed.filter((p) => p.c === curC.id).map(postView);
  const communityFeed = communityFeedRaw.length
    ? communityFeedRaw
    : feed.slice(0, 2).map((p) => postView({ ...p, c: curC.id }));

  // prayer
  const prayerView = prayers.map((p) => {
    const u = users[p.u];
    const isPrayed = !!prayed[p.id];
    const answered = !!p.answered;
    return {
      ...p,
      uName: u.name, uAvatar: u.avatar, uColor: hex(u.color),
      count: p.prayers + (isPrayed ? 1 : 0),
      btnLabel: isPrayed ? "Praying with you" : "Pray",
      onClick: () => pray(p.id),
      cardStyle: {
        background: answered ? "linear-gradient(135deg,#F1FBF0,#fff)" : "#fff",
        borderRadius: "20px",
        border: answered
          ? "1.5px solid rgba(79,176,88,.3)"
          : "1.5px solid rgba(43,35,64,.06)",
        boxShadow: "0 6px 18px rgba(43,35,64,.05)", padding: "18px",
      } as CSSProperties,
      btnStyle: {
        display: "inline-flex", alignItems: "center", gap: "7px",
        padding: "8px 16px", borderRadius: "999px", fontSize: "13px",
        fontWeight: 800,
        background: isPrayed ? "rgba(232,168,37,.18)" : "#FFC94A",
        color: isPrayed ? "#8A6B00" : "#2B2340",
        boxShadow: isPrayed ? "none" : "0 " + t.shadow + "px 0 0 #B9851A",
        border: "none",
      } as CSSProperties,
    };
  });

  // profile
  const myPosts = feed
    .filter((p) => ["worship", "bible"].includes(p.c))
    .slice(0, 2)
    .map(postView);
  const badges = (
    [
      { name: "Kind Words", icon: "💛", earned: true },
      { name: "Scripture Star", icon: "⭐", earned: true },
      { name: "Prayer Warrior", icon: "🙏", earned: true },
      { name: "Helper", icon: "🤝", earned: true },
      { name: "Creator", icon: "🎨", earned: false },
      { name: "Bookworm", icon: "📚", earned: false },
      { name: "Worship Lead", icon: "🎤", earned: false },
      { name: "Angel Wings", icon: "😇", earned: false },
    ] as const
  ).map((b) => ({
    ...b,
    style: {
      aspectRatio: "1", borderRadius: "50%", display: "grid", placeItems: "center",
      fontSize: "24px", background: b.earned ? "#FFF8EC" : "#EFECF6",
      boxShadow: b.earned ? "0 3px 0 0 rgba(43,35,64,.12)" : "none",
      opacity: b.earned ? 1 : 0.4,
      filter: b.earned ? "none" : "grayscale(.7)",
    } as CSSProperties,
  }));

  // dm
  const dmThreads = dms.map((th, i) => {
    const on = dmThread === i;
    const last = th.msgs[th.msgs.length - 1];
    return {
      name: th.name, avatar: th.avatar, online: th.online,
      preview: (last.me ? "You: " : "") + last.text,
      onClick: () => setDmThread(i),
      style: {
        display: "flex", alignItems: "center", gap: "11px", padding: "10px",
        borderRadius: "14px",
        background: on ? "rgba(127,201,214,.14)" : "transparent",
        border: "none", width: "100%",
      } as CSSProperties,
    };
  });
  const activeTh = dms[dmThread];
  const activeThread = {
    name: activeTh.name, avatar: activeTh.avatar, status: activeTh.status,
  };
  const activeMessagesView = activeMessages.map((m) => {
    const mine = m.me;
    return {
      text: m.text, name: m.name,
      showName: !!(activeTh.group && !mine && m.name),
      rowStyle: {
        display: "flex", flexDirection: "column",
        alignItems: mine ? "flex-end" : "flex-start", gap: "2px",
      } as CSSProperties,
      nameStyle: {
        fontSize: "11px", fontWeight: 800,
        color: m.angel ? "#FFC94A" : "#7FC9D6", paddingLeft: "4px",
      } as CSSProperties,
      bubbleStyle: {
        maxWidth: "70%", padding: "10px 15px",
        borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        fontSize: "14.5px", fontWeight: 500, lineHeight: 1.4,
        background: mine
          ? "#7FC9D6"
          : m.angel
            ? "rgba(255,201,74,.16)"
            : "rgba(255,255,255,.09)",
        color: mine ? "#0E3A45" : m.angel ? "#FFE9A8" : "#EAF6F4",
        fontFamily: m.angel ? "'Caveat',cursive" : "inherit",
        fontStyle: "normal",
      } as CSSProperties,
    };
  });

  // tag page
  const tagLabel = route.tag || "#worship";
  const tagIsScripture = isScripture(tagLabel);
  const tagFeedRaw = feed
    .filter((p) =>
      p.tags.some(
        (x) => clean(x).toLowerCase() === clean(tagLabel).toLowerCase(),
      ),
    )
    .map(postView);
  const tagFeed = tagFeedRaw.length ? tagFeedRaw : feed.slice(0, 3).map(postView);
  const following = followed.includes(tagLabel);

  // filter page views
  const filterSelected = filterTags.map((label) => ({
    label: disp(label),
    icon: tagIcon(label),
    onRemove: () => toggleFilterTag(label),
    style: {
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "6px 8px 6px 12px", borderRadius: "999px", fontSize: "13px",
      fontWeight: 800, color: "#fff", whiteSpace: "nowrap",
      background: tagColor(label), border: "none",
    } as CSSProperties,
  }));
  const filterTagsAvailable = filterAvailableTags().map((tg) => ({
    label: disp(tg.label),
    count: tg.count,
    icon: tagIcon(tg.label),
    onClick: () => toggleFilterTag(tg.label),
    style: {
      display: "inline-flex", alignItems: "center", gap: "7px",
      padding: "8px 14px", borderRadius: "999px", fontSize: "13.5px",
      fontWeight: 700, whiteSpace: "nowrap", color: tagColor(tg.label),
      background: "#fff", border: "1.5px solid " + tagColor(tg.label) + "55",
    } as CSSProperties,
    countStyle: {
      fontSize: "11.5px", fontWeight: 800, color: "#fff",
      background: tagColor(tg.label), borderRadius: "999px", padding: "1px 7px",
    } as CSSProperties,
  }));
  const filterFeed = filterMatches().map(postView);

  // admin
  const profilesAdmin = profiles.map((p) => {
    const on = posting[p.name] !== false;
    return {
      name: p.name, avatar: p.avatar, sub: p.sub, on,
      onToggle: () => togglePosting(p.name),
      switchStyle: {
        width: "40px", height: "23px", borderRadius: "999px",
        background: on ? "#1B2A2E" : "#D9D6D0", position: "relative",
        flexShrink: 0, border: "none", cursor: "pointer",
      } as CSSProperties,
      knobStyle: {
        position: "absolute", top: "2.5px", left: on ? "20px" : "2.5px",
        width: "18px", height: "18px", borderRadius: "50%", background: "#fff",
      } as CSSProperties,
    };
  });
  const STATUS: Record<string, { label: string; style: CSSProperties }> = {
    approved: { label: "Approved", style: { fontSize: "12px", fontWeight: 700, color: "#2E7D52", background: "#E8F3EC", padding: "5px 12px", borderRadius: "7px" } },
    declined: { label: "Declined", style: { fontSize: "12px", fontWeight: 700, color: "#C0392B", background: "#FBEAE7", padding: "5px 12px", borderRadius: "7px" } },
  };
  const pendingView = pendingMedia.map((m) => {
    const s = mediaStatus[m.id];
    return {
      ...m,
      resolved: !!s,
      notResolved: !s,
      statusLabel: s ? STATUS[s].label : "",
      statusStyle: s ? STATUS[s].style : {},
      approve: () => setMedia(m.id, "approved"),
      decline: () => setMedia(m.id, "declined"),
    };
  });
  const pendingPending = pendingView.filter((m) => !m.resolved).length;

  // composer helpers
  const showAutoTags = !!composer.trim() && autoTags.length > 0;

  // ---------- render ----------
  return (
    <div className="fh-v3-root" style={rootStyle}>
      <div style={shellStyle}>
        {/* ============ DOCK (sidebar) ============ */}
        <aside style={sidebarStyle}>
          <div style={headerStyle}>
            <div
              style={{
                width: 42, height: 42, borderRadius: 13,
                background: "linear-gradient(150deg,#1F7A8C,#0E3A45)",
                display: "grid", placeItems: "center",
                boxShadow: "0 3px 0 0 rgba(14,58,69,.4)", flexShrink: 0,
              }}
            >
              <svg width="26" height="17" viewBox="-5 0 32 20" fill="none">
                <path d="M6 10 Q15 2 24 10 Q15 18 6 10 Z" fill="#FFC94A" />
                <path d="M6 10 L0 5 L2.5 10 L0 15 Z" fill="#FFC94A" />
                <circle cx="20" cy="9" r="1.3" fill="#0E3A45" />
              </svg>
            </div>
            {expanded && (
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 21, lineHeight: 1, letterSpacing: "-.02em" }}>
                  FishHaven
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#8A82A8", marginTop: 3, display: "block" }}>
                  Community
                </span>
              </div>
            )}
            <button onClick={() => setNavCollapsed((c) => !c)} title="Toggle sidebar" style={collapseBtnStyle}>
              {expanded ? "«" : "»"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {nav.map((item, i) => (
              <button key={i} onClick={item.onClick} title={item.title} style={item.navStyle}>
                {expanded && <span style={item.lampStyle} />}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d={item.iconPath} />
                </svg>
                {expanded && <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>}
              </button>
            ))}
          </div>

          {/* current divider */}
          <div style={{ position: "relative", height: 14, margin: "12px 8px 6px" }}>
            <div style={{ position: "absolute", top: 7, left: 0, right: 0, height: 1.5, background: "rgba(43,35,64,.1)", borderRadius: 2 }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 14 }}>
              <svg width="22" height="14" viewBox="-5 0 32 20" style={{ position: "absolute", top: 0, left: 0, animation: reduceMotion ? "none" : "swim 9s linear infinite alternate" }}>
                <path d="M6 10 Q15 2 24 10 Q15 18 6 10 Z" fill="#7FC9D6" />
                <path d="M6 10 L0 5 L2.5 10 L0 15 Z" fill="#7FC9D6" />
              </svg>
            </div>
          </div>

          {expanded && (
            <div style={{ padding: "0 8px 6px", fontSize: 10, fontWeight: 800, letterSpacing: ".14em", color: "#8A82A8", textTransform: "uppercase" }}>
              Currents you ride
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 6 }}>
            {followedView.map((tg, i) => (
              <button key={i} onClick={tg.onClick} title={tg.title} style={tg.rowStyle}>
                <span style={tg.dotStyle} />
                {expanded && (
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tg.label}
                  </span>
                )}
              </button>
            ))}
          </div>

          {expanded && (
            <div style={{ padding: "0 8px 6px", fontSize: 10, fontWeight: 800, letterSpacing: ".14em", color: "#8A82A8", textTransform: "uppercase" }}>
              Your communities
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {myCommunities.map((c, i) => (
              <button key={i} onClick={c.onClick} title={c.title} style={c.rowStyle}>
                <span style={{ width: 28, height: 28, borderRadius: 9, display: "grid", placeItems: "center", fontSize: 15, background: c.cover, border: "1.5px solid rgba(43,35,64,.08)", flexShrink: 0 }}>
                  {c.emoji}
                </span>
                {expanded && (
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <button onClick={() => go("profile")} style={profileBtnStyle}>
            <span style={{ width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 20, background: "#EAF6F4", border: "2.5px solid #1F7A8C", flexShrink: 0 }}>
              {me.avatar}
            </span>
            {expanded && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>{me.name}</div>
                <div style={{ fontSize: 11, color: "#8A82A8", fontWeight: 600 }}>
                  Level {me.level} · 13–17
                </div>
              </div>
            )}
          </button>
        </aside>

        {/* ============ MAIN ============ */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* top bar */}
          <div style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", gap: 14, padding: "14px 26px", background: "rgba(250,244,234,.82)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(43,35,64,.07)" }}>
            <button onClick={openPalette} style={{ flex: 1, maxWidth: 540, display: "flex", alignItems: "center", gap: 11, background: "#fff", padding: "11px 16px", borderRadius: 999, border: "1.5px solid rgba(43,35,64,.1)", boxShadow: "0 2px 0 0 rgba(43,35,64,.05)", color: "#8A82A8", fontWeight: 600, fontSize: 14 }}>
              <span style={{ display: "inline-flex", color: "#8A82A8" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.5 10.5m-6.5 0a6.5 6.5 0 1013 0 6.5 6.5 0 10-13 0M20 20l-4.6-4.6" />
                </svg>
              </span>
              <span style={{ flex: 1, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Cast into the harbor — people, verses, currents…
              </span>
              <span style={{ display: "inline-flex", gap: 3, alignItems: "center", padding: "3px 9px", borderRadius: 999, background: "#FFF8EC", color: "#8A6B00", fontSize: 11, fontWeight: 800, fontFamily: "'Spline Sans Mono',monospace", whiteSpace: "nowrap" }}>
                ⌘K
              </span>
            </button>

            {/* bell */}
            <div style={{ position: "relative" }}>
              <button onClick={toggleBell} title="Notifications" style={{ position: "relative", width: 42, height: 42, borderRadius: "50%", background: "#fff", border: "1.5px solid rgba(43,35,64,.08)", display: "grid", placeItems: "center", color: "#5A4E7A" }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 9a5 5 0 0110 0c0 4 1.7 5.2 1.7 5.2H5.3S7 13 7 9zM10 20a2 2 0 004 0" />
                </svg>
                {unread > 0 && (
                  <span style={{ position: "absolute", top: 6, right: 7, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: "#FF7E6B", color: "#fff", fontSize: 10, fontWeight: 800, display: "grid", placeItems: "center", border: "2px solid #fff" }}>
                    {unread}
                  </span>
                )}
              </button>
              {bellOpen && (
                <>
                  <div onClick={closeOverlays} style={{ position: "fixed", inset: 0, zIndex: 38 }} />
                  <div style={{ position: "absolute", top: "calc(100% + 12px)", right: 0, zIndex: 39, width: 340, background: "#fff", borderRadius: 18, border: "1.5px solid rgba(43,35,64,.1)", boxShadow: "0 20px 50px rgba(14,58,69,.22)", overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px 11px" }}>
                      <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 800, fontSize: 18 }}>Notifications</div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#15616F", background: "rgba(31,122,140,.1)", padding: "3px 10px", borderRadius: 999 }}>{unread} new</span>
                    </div>
                    <div style={{ maxHeight: 380, overflowY: "auto", padding: "2px 8px 8px" }}>
                      {notifsView.map((n, i) => (
                        <button key={i} onClick={() => {}} style={n.rowStyle}>
                          <span style={n.iconStyle}>{n.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: 13.5, lineHeight: 1.25 }}>{n.title}</div>
                            <div style={{ fontSize: 12.5, color: "#5A4E7A", fontWeight: 500, marginTop: 2, lineHeight: 1.35 }}>{n.body}</div>
                          </div>
                          <span style={{ fontSize: 11, color: "#8A82A8", fontWeight: 700, flexShrink: 0 }}>{n.time}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={closeOverlays} style={{ width: "100%", padding: 12, borderTop: "1px solid rgba(43,35,64,.07)", fontSize: 13, fontWeight: 800, color: "#15616F" }}>Mark all read</button>
                  </div>
                </>
              )}
            </div>

            {/* avatar menu */}
            <div style={{ position: "relative" }}>
              <button onClick={toggleMenu} title={me.name} style={{ width: 42, height: 42, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 21, background: "#EAF6F4", border: "2.5px solid var(--c-primary,#1F7A8C)" }}>
                {me.avatar}
              </button>
              {menuOpen && (
                <>
                  <div onClick={closeOverlays} style={{ position: "fixed", inset: 0, zIndex: 38 }} />
                  <div style={{ position: "absolute", top: "calc(100% + 12px)", right: 0, zIndex: 39, width: 280, background: "#fff", borderRadius: 18, border: "1.5px solid rgba(43,35,64,.1)", boxShadow: "0 20px 50px rgba(14,58,69,.22)", padding: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#8A82A8", padding: "6px 10px" }}>Switch profile</div>
                    {profilesView.map((p, i) => (
                      <button key={i} onClick={p.onClick} style={p.rowStyle}>
                        <span style={p.avatarStyle}>{p.avatar}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 13.5 }}>{p.name}</div>
                          <div style={{ fontSize: 11.5, color: "#8A82A8", fontWeight: 600 }}>{p.sub}</div>
                        </div>
                        {p.active && <span style={{ fontSize: 12, fontWeight: 800, color: "#15616F" }}>●</span>}
                      </button>
                    ))}
                    <div style={{ height: 1, background: "rgba(43,35,64,.07)", margin: "8px 6px" }} />
                    <button onClick={() => { setMenuOpen(false); go("profile"); }} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "9px 10px", borderRadius: 11, textAlign: "left", fontSize: 13.5, fontWeight: 700, border: "none", background: "transparent" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5A4E7A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 11.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM5.5 20a6.5 6.5 0 0113 0" /></svg>
                      View my profile
                    </button>
                    <button onClick={() => { setMenuOpen(false); go("admin"); }} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "9px 10px", borderRadius: 11, textAlign: "left", fontSize: 13.5, fontWeight: 700, border: "none", background: "transparent" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5A4E7A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.4-3 8-7 10-4-2-7-5.6-7-10V6z" /></svg>
                      Family &amp; safety
                    </button>
                    <button onClick={() => {}} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "9px 10px", borderRadius: 11, textAlign: "left", fontSize: 13.5, fontWeight: 700, color: "#E85C47", border: "none", background: "transparent" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85C47" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4h4v16h-4M14 12H4M8 8l-4 4 4 4" /></svg>
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* depth-aware content well */}
          <div style={depthStyle}>
            {page === "home" && (
              <HomeScreen
                me={me}
                heroShoal={heroShoal} railShoal={railShoal}
                quickActions={quickActions} composer={composer}
                onComposer={(e) => setComposer(e.target.value)}
                composerChips={composerChips} showAutoTags={showAutoTags}
                autoTagSummary={autoTagSummary} tagsOpen={tagsOpen}
                toggleTags={() => setTagsOpen((o) => !o)}
                autoTagChips={autoTagChips} newTag={newTag}
                onNewTag={(e) => setNewTag(e.target.value)}
                onNewTagKey={(e) => { if (e.key === "Enter") { e.preventDefault(); addComposerTag(); } }}
                addComposerTag={addComposerTag}
                visOpen={visOpen} toggleVisOpen={() => setVisOpen((o) => !o)}
                visLabel={visLabel} visIcon={visIcon}
                visIsSelect={visMode === "select"}
                visModeRadios={visModeRadios} visCommunityChecks={visCommunityChecks}
                filters={filters} feedView={feedView} trendingView={trendingView}
                eventsView={eventsView}
                goDiscover={() => go("discover")} openPalette={openPalette}
                openPsalm139={() => go("tag", { tag: "Psalm 139:14" })}
              />
            )}
            {page === "discover" && <DiscoverScreen discoverView={discoverView} />}
            {page === "filter" && (
              <SearchScreen
                filterQuery={filterQuery}
                onFilterQuery={(e) => setFilterQuery(e.target.value)}
                filterSelected={filterSelected}
                filterHasSelected={filterTags.length > 0}
                clearFilter={clearFilter}
                filterTagsAvailable={filterTagsAvailable}
                filterNoTags={filterTagsAvailable.length === 0}
                filterFeed={filterFeed}
                filterCount={filterFeed.length}
                filterEmpty={filterFeed.length === 0}
              />
            )}
            {page === "calendar" && (
              <EventsScreen
                calMonth="June 2026"
                weekdays={["S", "M", "T", "W", "T", "F", "S"]}
                calWeeks={calWeeks} calRsvp={calRsvp}
              />
            )}
            {page === "community" && (
              <CommunityScreen community={community} childCommunities={childCommunities} communityFeed={communityFeed} />
            )}
            {page === "prayer" && (
              <PrayerScreen
                prayerView={prayerView}
                prayerDraft={prayerDraft}
                onPrayerDraft={(e) => setPrayerDraft(e.target.value)}
              />
            )}
            {page === "profile" && <ProfileScreen me={me} connShoal={connShoal} myPosts={myPosts} badges={badges} />}
            {page === "admin" && (
              <FamilyScreen
                profilesAdmin={profilesAdmin} pendingView={pendingView}
                pendingPending={pendingPending} pendingEmpty={pendingPending === 0}
              />
            )}
            {page === "chat" && (
              <MessagesScreen
                dmThreads={dmThreads} activeThread={activeThread}
                activeMessages={activeMessagesView} dmDraft={dmDraft}
                onDmDraft={(e) => setDmDraft(e.target.value)}
                onDmKey={(e) => { if (e.key === "Enter") { e.preventDefault(); sendDm(); } }}
                sendDm={sendDm}
              />
            )}
            {page === "tag" && (
              <TagScreen
                tagTitle={clean(tagLabel)}
                tagKind={tagIsScripture ? "Scripture" : tagType(tagLabel) === "feeling" ? "Feeling" : "Topic"}
                tagIsScripture={tagIsScripture}
                tagVerse={verses[clean(tagLabel)] ? '"' + verses[clean(tagLabel)] + '"' : ""}
                tagEyebrowColor={tagColor(tagLabel)}
                tagReach={tagFeed.length + 2}
                tagHeaderStyle={{ background: "#fff", borderRadius: "22px", border: "1.5px solid rgba(43,35,64,.06)", boxShadow: "0 8px 22px rgba(43,35,64,.06)", padding: "24px", borderLeft: "5px solid " + tagColor(tagLabel) }}
                tagFeed={tagFeed}
                toggleFollowTag={toggleFollowTag}
                followBtnLabel={following ? "Riding ✓" : "Follow current"}
                followBtnStyle={{ padding: "9px 18px", borderRadius: "999px", fontSize: "13px", fontWeight: 800, border: "none", background: following ? "rgba(31,122,140,.14)" : prim, color: following ? "#15616F" : "#fff", boxShadow: following ? "none" : "0 " + t.shadow + "px 0 0 " + deep }}
                goHome={() => go("home")}
              />
            )}
          </div>
        </div>
      </div>

      {/* ============ GABRIEL FLOAT ============ */}
      {showGabriel && (
        <button onClick={() => {}} style={{ position: "fixed", bottom: 22, right: 22, zIndex: 40, display: "flex", alignItems: "center", gap: 11, background: "#fff", padding: "9px 16px 9px 9px", borderRadius: 999, boxShadow: "0 10px 30px rgba(43,35,64,.18)", border: "1.5px solid rgba(43,35,64,.08)" }}>
          <svg width="40" height="40" viewBox="0 0 100 100">
            <ellipse cx="22" cy="58" rx="16" ry="20" fill="#fff" stroke="#E8C7F0" strokeWidth="2" />
            <ellipse cx="78" cy="58" rx="16" ry="20" fill="#fff" stroke="#E8C7F0" strokeWidth="2" />
            <path d="M30 78 q0 -18 20 -18 q20 0 20 18 v8 h-40 z" fill="#FFF1D6" stroke="#2B2340" strokeWidth="2" />
            <circle cx="50" cy="48" r="17" fill="#FFE0C2" stroke="#2B2340" strokeWidth="2" />
            <circle cx="42" cy="50" r="2.5" fill="#2B2340" />
            <circle cx="58" cy="50" r="2.5" fill="#2B2340" />
            <path d="M42 58 q8 6 16 0" stroke="#2B2340" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="50" cy="27" rx="15" ry="3.6" fill="none" stroke="#FFC94A" strokeWidth="3" />
          </svg>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>Gabriel</div>
            <div style={{ fontFamily: "'Caveat',cursive", fontSize: 15, fontWeight: 700, color: "#8A6B00", lineHeight: 1 }}>here if you need me</div>
          </div>
        </button>
      )}

      {/* ============ PIN GATE ============ */}
      {pinOpen && pinProfile && (
        <div onClick={closePin} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(14,58,69,.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 340, background: "#fff", borderRadius: 24, boxShadow: "0 30px 80px rgba(14,58,69,.4)", padding: "28px 26px", textAlign: "center" }}>
            <span style={{ display: "inline-grid", placeItems: "center", width: 66, height: 66, borderRadius: "50%", fontSize: 34, background: "#EAF6F4", border: "3px solid var(--c-primary,#1F7A8C)" }}>{pinProfile.avatar}</span>
            <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 22, marginTop: 14 }}>Enter {pinProfile.name}&apos;s PIN</div>
            <div style={{ fontSize: 13, color: "#8A82A8", fontWeight: 600, marginTop: 4 }}>Keeps each profile safe in the harbor.</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 14, margin: "22px 0 6px" }}>
              {pinDots.map((dd, i) => <span key={i} style={dd.style} />)}
            </div>
            <div style={{ height: 18, fontSize: 12.5, fontWeight: 700, color: "#E85C47" }}>{pinError && "Wrong PIN — try again"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 8 }}>
              {pinKeys.map((k) => <button key={k.key} onClick={k.onClick} style={k.style}>{k.label}</button>)}
            </div>
            <button onClick={closePin} style={{ marginTop: 14, fontSize: 13, fontWeight: 800, color: "#8A82A8" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ============ COMMAND PALETTE ============ */}
      {paletteOpen && (
        <div onClick={closePalette} style={{ position: "fixed", inset: 0, zIndex: 60, background: "radial-gradient(120% 90% at 50% 0%, rgba(31,122,140,.42), rgba(14,58,69,.5))", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "11vh" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 640, background: "#fff", borderRadius: 22, boxShadow: "0 30px 80px rgba(14,58,69,.4)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "18px 22px", borderBottom: "1px solid rgba(43,35,64,.08)" }}>
              <span style={{ fontSize: 19 }}>🔍</span>
              <input ref={paletteRef} value={query} onChange={(e) => { setQuery(e.target.value); setPIndex(0); }} onKeyDown={onPaletteKey} placeholder="Cast into the water…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 18, fontWeight: 600, color: "#2B2340" }} />
              <span style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, fontWeight: 600, color: "#8A82A8", padding: "4px 9px", borderRadius: 8, background: "#FFF8EC" }}>esc</span>
            </div>
            <div style={{ display: "flex", gap: 6, padding: "12px 18px", overflowX: "auto", borderBottom: "1px solid rgba(43,35,64,.06)" }}>
              {facetList.map((fct, i) => <button key={i} onClick={fct.onClick} style={fct.style}>{fct.label}</button>)}
            </div>
            <div style={{ padding: "8px 18px", fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#8A82A8" }}>
              {query.trim() ? results.length + " in the water" : "Suggested currents"}
            </div>
            <div style={{ maxHeight: "46vh", overflowY: "auto", padding: "4px 8px 10px" }}>
              {paletteResults.map((r, i) => (
                <button key={i} onClick={r.onClick} onMouseEnter={r.onHover} style={r.style}>
                  <span style={r.iconStyle}>{r.icon}</span>
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: "#8A82A8", fontWeight: 600 }}>{r.sub}</div>
                  </div>
                  <span style={r.tagStyle}>{r.type}</span>
                </button>
              ))}
              {results.length === 0 && (
                <div style={{ padding: "30px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 32 }}>🪝</div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginTop: 8 }}>Nothing in these waters yet</div>
                  <div style={{ fontSize: 13, color: "#8A82A8", fontWeight: 600, marginTop: 4 }}>Try a different current, or start one.</div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "11px 20px", borderTop: "1px solid rgba(43,35,64,.06)", fontSize: 11.5, color: "#8A82A8", fontWeight: 700 }}>
              <span style={{ fontFamily: "'Spline Sans Mono',monospace" }}>↑↓</span> navigate
              <span style={{ fontFamily: "'Spline Sans Mono',monospace" }}>↵</span> open
              <span style={{ flex: 1 }} />
              <span>only shows water you&apos;re allowed to swim</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
