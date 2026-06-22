// FishHaven v3 — data, types, and pure helpers ported from
// design/versions/v3/FishHaven.v3.dc.html (no React state in here).

import type { CSSProperties } from "react";

// ---------- props / constants ----------
export const ACCENT = "#1F7A8C";
export const SHOW_GABRIEL = true;
export const REDUCE_MOTION = false;

// ---------- color + band types ----------
export type ColorKey =
  | "tide"
  | "coral"
  | "gold"
  | "reed"
  | "shallows"
  | "grape";

export const COLORS: Record<ColorKey, string> = {
  tide: "#1F7A8C",
  coral: "#FF7E6B",
  gold: "#E8A825",
  reed: "#4FB058",
  shallows: "#7FC9D6",
  grape: "#9E7BC4",
};

export type BandKey = "kid" | "teen" | "adult";

export interface Band {
  primary: string;
  deep: string;
  radius: number;
  radiusLg: number;
  shadow: number;
  weight: number;
  btnShadow: string;
  cardShadow: string;
}

export const BANDS: Record<BandKey, Band> = {
  kid: {
    primary: "#FF7E6B",
    deep: "#E85C47",
    radius: 24,
    radiusLg: 30,
    shadow: 4,
    weight: 700,
    btnShadow: "0 4px 0 0 var(--c-primary-deep,#E85C47)",
    cardShadow:
      "0 4px 0 0 rgba(43,35,64,.08), 0 12px 26px rgba(43,35,64,.10)",
  },
  teen: {
    primary: "#1F7A8C",
    deep: "#15616F",
    radius: 12,
    radiusLg: 16,
    shadow: 0,
    weight: 600,
    btnShadow: "0 1px 2px rgba(43,35,64,.16)",
    cardShadow:
      "0 1px 2px rgba(43,35,64,.04), 0 6px 16px rgba(43,35,64,.05)",
  },
  adult: {
    primary: "#15616F",
    deep: "#0E3A45",
    radius: 9,
    radiusLg: 13,
    shadow: 0,
    weight: 500,
    btnShadow: "0 6px 18px rgba(14,58,69,.22)",
    cardShadow: "0 10px 26px rgba(43,35,64,.10)",
  },
};

export const BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Psalm", "Psalms", "Proverbs", "Isaiah", "Jeremiah", "Matthew",
  "Mark", "Luke", "John", "Acts", "Romans", "Corinthians",
  "Galatians", "Ephesians", "Philippians", "Colossians", "Daniel",
  "Revelation", "James", "Hebrews",
];

export const FEELINGS = [
  "gratitude", "lament", "advent", "hope", "joy",
  "grief", "peace", "answered", "wonder", "family",
];

export const SYNONYMS: Record<string, string> = {
  wrshp: "worship",
  pray: "prayer",
  art: "art",
  song: "worship",
  bible: "scripture",
  verse: "scripture",
};

export const KEYWORDS: Record<string, string> = {
  worship: "#worship", song: "#worship", sing: "#worship", hymn: "#worship", praise: "#worship",
  pray: "#prayer", prayer: "#prayer", praying: "#prayer",
  draw: "#art", paint: "#art", doodle: "#art", sketch: "#art", canvas: "#art",
  lego: "#creativity", build: "#creativity", built: "#creativity", made: "#creativity", make: "#creativity",
  bible: "#scripture", verse: "#scripture", memoriz: "#scripture",
  grateful: "#gratitude", thankful: "#gratitude", thank: "#gratitude", blessed: "#gratitude",
  dog: "#pets", cat: "#pets", puppy: "#pets", fish: "#pets",
  code: "#code", app: "#code", website: "#code", api: "#code",
  honeybee: "#creation", star: "#creation", volcano: "#creation", experiment: "#creation",
  hike: "#outdoors", trail: "#outdoors", camp: "#outdoors",
};

// ---------- data types ----------
export interface Profile {
  name: string;
  avatar: string;
  level: number;
  local: string;
  band: BandKey;
  sub: string;
}

export interface PendingMedia {
  id: string;
  child: string;
  avatar: string;
  kind: string;
  where: string;
  time: string;
}

export interface Notif {
  icon: string;
  title: string;
  body: string;
  time: string;
  color: string;
  unread: boolean;
}

export interface Community {
  id: string;
  name: string;
  emoji: string;
  color: ColorKey;
  members: number;
  posts: number;
  blurb: string;
  cover: string;
  parent?: string;
}

export interface User {
  name: string;
  avatar: string;
  color: ColorKey;
}

export interface FeedReact {
  heart?: number;
  amen?: number;
  praise?: number;
  wow?: number;
}

export interface FeedPost {
  id: string;
  c: string;
  u: number;
  time: string;
  title: string;
  body: string;
  react: FeedReact;
  comments: number;
  pinned?: boolean;
  image?: string;
  tags: string[];
  vis?: string[] | "everyone";
  angelNote?: string;
  answered?: boolean;
}

export interface Prayer {
  id: string;
  u: number;
  time: string;
  text: string;
  prayers: number;
  answered?: boolean;
}

export interface FishEvent {
  date: number;
  title: string;
  time: string;
  c: string;
}

export interface Trending {
  label: string;
  count: number;
  hot?: boolean;
}

export interface DmMessage {
  me: boolean;
  text: string;
  name?: string;
  angel?: boolean;
}

export interface DmThread {
  name: string;
  avatar: string;
  online: boolean;
  status: string;
  group?: boolean;
  msgs: DmMessage[];
}

// ---------- static data ----------
export const profiles: Profile[] = [
  { name: "Jordan", avatar: "🦁", level: 14, local: "worship", band: "teen", sub: "You · 13–17" },
  { name: "Ava", avatar: "🐰", level: 5, local: "bible", band: "kid", sub: "Kid · under 13" },
  { name: "Pat", avatar: "🦢", level: 1, local: "church", band: "adult", sub: "Parent · admin" },
];

export const pendingMedia: PendingMedia[] = [
  { id: "med_8f2a91", child: "Ava", avatar: "🐰", kind: "Photo", where: "Art Angels", time: "9:14 AM" },
  { id: "med_3c77d0", child: "Ava", avatar: "🐰", kind: "Doodle", where: "Doodle Garden", time: "Yesterday" },
  { id: "med_5b1e44", child: "Jordan", avatar: "🦁", kind: "Photo", where: "Worship Warriors", time: "2 days ago" },
];

export const notifs: Notif[] = [
  { icon: "⭐", title: "Scripture Star earned", body: "You memorized 5 verses — Bookworm is next.", time: "2m", color: "#E8A825", unread: true },
  { icon: "🙏", title: "Grace asked for prayer", body: "Tap to pray for her grandma's surgery.", time: "1h", color: "#FF7E6B", unread: true },
  { icon: "🎨", title: "Ezra mentioned you", body: "in the Garden of Eden group doodle.", time: "3h", color: "#9E7BC4", unread: true },
  { icon: "😇", title: "Gabriel summarized Worship Warriors", body: "Here's what you missed this week.", time: "1d", color: "#1F7A8C", unread: false },
];

export const communities: Community[] = [
  { id: "church", name: "Grace Harbor Church", emoji: "⛪", color: "tide", members: 1240, posts: 980, blurb: "One church family — with little harbors inside for every group.", cover: "#2C6E7A" },
  { id: "bible", name: "Bible Buddies", emoji: "📖", color: "gold", members: 2840, posts: 1842, blurb: "Stories, verses & wonder from the Word.", cover: "#B0843A" },
  { id: "art", name: "Art Angels", emoji: "🎨", color: "coral", members: 1993, posts: 3211, blurb: "Doodle, paint & share God-given creativity.", cover: "#C26551" },
  { id: "worship", name: "Worship Warriors", emoji: "🎤", color: "grape", members: 1520, posts: 812, blurb: "Songs, hymns, and joyful noises.", cover: "#7B6BA6" },
  { id: "science", name: "Creation Explorers", emoji: "🔭", color: "shallows", members: 1106, posts: 644, blurb: "Discover how wonderfully we are made.", cover: "#4F94A0" },
  { id: "home", name: "Homeschool Hangout", emoji: "🏠", color: "reed", members: 3210, posts: 5020, blurb: "Study buddies & school-day cheer.", cover: "#5C9866" },
  { id: "prayer", name: "Prayer Pals", emoji: "🙏", color: "tide", members: 2010, posts: 1330, blurb: "Lift each other up every single day.", cover: "#2F7886" },
  { id: "code", name: "Code for Christ", emoji: "💻", color: "tide", members: 612, posts: 288, blurb: "Build things with love & logic.", cover: "#3C7E8C" },
  { id: "pets", name: "Pet Parables", emoji: "🐶", color: "gold", members: 980, posts: 2100, blurb: "Furry, feathered & fishy friends.", cover: "#BE914A" },
  { id: "book", name: "Book Nook", emoji: "📚", color: "shallows", members: 872, posts: 442, blurb: "Stories, reviews & reading streaks.", cover: "#5E94A0" },
  { id: "ch-youth", name: "Youth Group", emoji: "🔥", color: "coral", members: 212, posts: 540, blurb: "Middle & high schoolers of Grace Harbor.", cover: "#C26551", parent: "church" },
  { id: "ch-worship", name: "Worship Team", emoji: "🎶", color: "grape", members: 48, posts: 210, blurb: "The folks who lead Sunday's sound.", cover: "#7B6BA6", parent: "church" },
  { id: "ch-groups", name: "Small Groups", emoji: "🫂", color: "reed", members: 320, posts: 430, blurb: "Midweek circles that meet in homes.", cover: "#5C9866", parent: "church" },
];

export const users: User[] = [
  { name: "Maya", avatar: "🦊", color: "coral" }, { name: "Caleb", avatar: "🐼", color: "tide" },
  { name: "Ezra", avatar: "🐻", color: "reed" }, { name: "Lily", avatar: "🦄", color: "grape" },
  { name: "Noah", avatar: "🐯", color: "tide" }, { name: "Grace", avatar: "🐰", color: "coral" },
  { name: "Asher", avatar: "🦉", color: "shallows" }, { name: "Hannah", avatar: "🐥", color: "gold" },
  { name: "Silas", avatar: "🐙", color: "grape" }, { name: "Ivy", avatar: "🦋", color: "shallows" },
  { name: "Levi", avatar: "🐵", color: "reed" }, { name: "Zoe", avatar: "🐢", color: "tide" },
  { name: "Micah", avatar: "🐸", color: "reed" }, { name: "Naomi", avatar: "🦒", color: "gold" },
  { name: "Eli", avatar: "🐳", color: "tide" }, { name: "Ada", avatar: "🐝", color: "coral" },
];

export const feed: FeedPost[] = [
  { id: "p1", c: "bible", u: 2, time: "2m", title: "Built Noah's Ark in LEGO", body: "Took me three days but every animal is in pairs. Thinking Daniel in the lion's den next — who's in for a build-along?", react: { heart: 142, amen: 31, praise: 24, wow: 38 }, comments: 14, pinned: true, image: "ark", tags: ["#Genesis 6:14", "#creativity"], vis: ["bible", "book", "home"] },
  { id: "p2", c: "prayer", u: 5, time: "18m", title: "Please pray for my grandma", body: "She's going into surgery tomorrow morning. I know God's got her but I'm a little scared. Would you all pray? 🙏", react: { amen: 86, heart: 54, praise: 4, wow: 0 }, comments: 31, angelNote: "I lit a candle for Grace's grandma.", tags: ["#prayer", "#family"] },
  { id: "p3", c: "art", u: 8, time: "1h", title: "Rainbow promise doodle", body: "Made this in the group canvas with Ezra and Ada today. Genesis 9 hits different when you draw it.", react: { heart: 77, wow: 22, praise: 12, amen: 3 }, comments: 9, image: "rainbow", tags: ["#Genesis 9", "#art"], vis: ["art", "bible"] },
  { id: "p4", c: "science", u: 1, time: "3h", title: "Honeybees do a waggle dance", body: "They literally dance to tell friends where the flowers are. God made tiny engineers. Wrote a little report on it.", react: { wow: 41, heart: 28, amen: 5, praise: 8 }, comments: 6, tags: ["#creation", "#Psalm 139:14"] },
  { id: "p5", c: "worship", u: 13, time: "5h", title: "Wrote my first worship song", body: "It's called 'Small and Loved'. Only 12 lines. Can I sing it at Friday night?", react: { praise: 55, amen: 31, heart: 88, wow: 9 }, comments: 41, tags: ["#worship", "#Psalm 96"], vis: "everyone" },
  { id: "p6", c: "code", u: 11, time: "8h", title: "Made a verse-of-the-day site", body: "Uses a free API and my mom approved the verse list. My first real project and it actually works!", react: { wow: 30, heart: 42, praise: 19, amen: 5 }, comments: 24, tags: ["#Psalm 119:105", "#code"] },
  { id: "p7", c: "prayer", u: 7, time: "1d", title: "Prayed and it happened 💛", body: "The thing I posted about last week? Done. God showed up. Thank you to everyone who prayed with me.", react: { heart: 90, amen: 55, praise: 31, wow: 7 }, comments: 22, answered: true, tags: ["#gratitude", "#answered"] },
];

export const prayers: Prayer[] = [
  { id: "pr1", u: 5, time: "18m", text: "My grandma's surgery is tomorrow morning. Praying for steady hands and peace.", prayers: 34 },
  { id: "pr2", u: 1, time: "2h", text: "Please pray my dad finds a new job — he's been looking for three months.", prayers: 57 },
  { id: "pr3", u: 9, time: "5h", text: "Starting a new school next week. Pray I make a real friend?", prayers: 43 },
  { id: "pr4", u: 7, time: "1d", text: "Thankful my brother's fever broke! Praise God 🎉", prayers: 82, answered: true },
  { id: "pr5", u: 10, time: "1d", text: "Big chem test Friday. I studied but I'm still nervous.", prayers: 29 },
  { id: "pr6", u: 13, time: "2d", text: "Praying for the families I saw on the news with my mom tonight.", prayers: 201 },
];

export const events: FishEvent[] = [
  { date: 18, title: "Youth Bible Study", time: "6:30 PM", c: "bible" },
  { date: 20, title: "Open Doodle Canvas", time: "4:00 PM", c: "art" },
  { date: 22, title: "Prayer Circle Live", time: "7:30 PM", c: "prayer" },
  { date: 24, title: "Code Jam: Build a Verse App", time: "4:00 PM", c: "code" },
  { date: 26, title: "Virtual Worship Night", time: "7:00 PM", c: "worship" },
  { date: 27, title: "Group Doodle — Eden", time: "10:00 AM", c: "art" },
  { date: 28, title: "Scripture Scavenger Hunt", time: "2:00 PM", c: "bible" },
  { date: 30, title: "Creation Walk @ Park", time: "9:00 AM", c: "science" },
];

export const trending: Trending[] = [
  { label: "#worship", count: 1284, hot: true },
  { label: "Psalm 23", count: 842 },
  { label: "#gratitude", count: 611 },
  { label: "Psalm 119:105", count: 430 },
  { label: "#advent", count: 388, hot: true },
];

export const verses: Record<string, string> = {
  "Psalm 139:14": "I praise you because I am fearfully and wonderfully made; your works are wonderful.",
  "Psalm 23": "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures.",
  "Psalm 119:105": "Your word is a lamp for my feet, a light on my path.",
  "Psalm 96": "Sing to the Lord a new song; sing to the Lord, all the earth.",
  "Genesis 9": "I have set my rainbow in the clouds, and it will be the sign of the covenant.",
  "Genesis 6:14": "So make yourself an ark of cypress wood; make rooms in it.",
};

export const dms: DmThread[] = [
  {
    name: "Caleb", avatar: "🐼", online: true, status: "active now", msgs: [
      { me: false, text: "hey! you coming to worship night fri?" },
      { me: true, text: "yesss saving you a seat" },
      { me: false, text: "bring the uke?? 🎸" },
      { me: true, text: "obviously" },
    ],
  },
  {
    name: "Maya", avatar: "🦊", online: false, status: "last seen 1h ago", msgs: [
      { me: false, text: "that doodle you posted is unreal" },
      { me: true, text: "haha thank you 🥹 took forever" },
    ],
  },
  {
    name: "Prayer Circle", avatar: "🙏", online: true, status: "4 swimming · group", group: true, msgs: [
      { me: false, name: "Grace", text: "can we pray for my grandma tmrw morning" },
      { me: false, name: "Gabriel", angel: true, text: "I've lit a candle. Anyone want to pray with Grace? 💛" },
      { me: true, text: "praying right now 🕯️" },
    ],
  },
];

// ---------- pure helpers ----------
export function hex(c: string): string {
  return (COLORS as Record<string, string>)[c] || "#1F7A8C";
}

export function clean(t: string): string {
  return String(t).replace(/^#/, "").trim();
}

export function isScripture(t: string): boolean {
  const s = clean(t);
  return BOOKS.some((b) => s.startsWith(b)) || /\d+:\d+/.test(s);
}

export type TagKind = "scripture" | "feeling" | "topic";

export function tagType(t: string): TagKind {
  if (isScripture(t)) return "scripture";
  const s = clean(t).toLowerCase();
  return FEELINGS.includes(s) ? "feeling" : "topic";
}

export function tagColor(t: string): string {
  const k = tagType(t);
  return k === "scripture" ? "#E8A825" : k === "feeling" ? "#FF7E6B" : "#1F7A8C";
}

export function tagIcon(t: string): string {
  const k = tagType(t);
  return k === "scripture" ? "✝" : k === "feeling" ? "♥" : "#";
}

export function disp(t: string): string {
  return isScripture(t) ? clean(t) : t;
}

export function cmap(): Record<string, Community> {
  const m: Record<string, Community> = {};
  communities.forEach((c) => {
    m[c.id] = c;
  });
  return m;
}

export function primaryDeep(accent: string | undefined, band: Band): string {
  const map: Record<string, string> = {
    "#1F7A8C": "#15616F",
    "#FF7E6B": "#E85C47",
    "#E8A825": "#B9851A",
  };
  return accent ? map[accent] || band.deep : band.deep;
}

export function primary(accent: string | undefined, band: Band): string {
  return accent || band.primary;
}

// shoal: bobbing fish row
export interface ShoalItem {
  style: CSSProperties;
}

export function shoal(
  n: number,
  color: string,
  reduceMotion: boolean,
): ShoalItem[] {
  const arr: ShoalItem[] = [];
  for (let i = 0; i < n; i++) {
    arr.push({
      style: {
        color,
        marginLeft: i === 0 ? 0 : "-4px",
        opacity: Number((0.55 + ((i * 7) % 5) / 10).toFixed(2)),
        animation: reduceMotion
          ? "none"
          : `bob 3s ease-in-out ${(i * 0.31).toFixed(2)}s infinite`,
      },
    });
  }
  return arr;
}

export interface ShoalRailItem {
  railStyle: CSSProperties;
}

export function shoalRail(
  n: number,
  color: string,
  reduceMotion: boolean,
): ShoalRailItem[] {
  const arr: ShoalRailItem[] = [];
  for (let i = 0; i < n; i++) {
    arr.push({
      railStyle: {
        color,
        position: "absolute",
        left: (i % 6) * 16 + 2 + "%",
        top: Math.floor(i / 6) * 26 + (i % 2) * 6 + "px",
        opacity: Number((0.6 + ((i * 5) % 4) / 10).toFixed(2)),
        animation: reduceMotion
          ? "none"
          : `bob ${(2.6 + (i % 3) * 0.4).toFixed(1)}s ease-in-out ${(
              i * 0.27
            ).toFixed(2)}s infinite`,
      },
    });
  }
  return arr;
}

// genTags — Gabriel auto-tagging from composer text
export function genTags(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (t: string) => {
    const k = clean(t).toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(t);
    }
  };
  const re = new RegExp(
    "\\b((?:[1-3]\\s)?(?:" + BOOKS.join("|") + "))\\s+(\\d+(?::\\d+(?:-\\d+)?)?)",
    "gi",
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const book = m[1]
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/\s+/g, " ")
      .trim();
    push(book + " " + m[2]);
  }
  const low = text.toLowerCase();
  for (const k in KEYWORDS) if (low.includes(k)) push(KEYWORDS[k]);
  return out.slice(0, 5);
}

// shareInfo — cross-post visibility badge
export interface ShareInfo {
  cross: boolean;
  icon: string;
  label: string;
  note: string;
}

export function shareInfo(p: FeedPost): ShareInfo {
  const cm = cmap();
  const vis = p.vis;
  if (vis === "everyone")
    return {
      cross: true,
      icon: "🌐",
      label: "Everyone",
      note: "Shared across the whole harbor — every comment shows up in one thread.",
    };
  if (Array.isArray(vis) && vis.length > 1) {
    const names = vis.map((id) => (cm[id] ? cm[id].name : id));
    return {
      cross: true,
      icon: "🔗",
      label: "+" + (vis.length - 1),
      note: "Shared with " + names.join(", ") + " — one post, comments visible to all.",
    };
  }
  return { cross: false, icon: "", label: "", note: "" };
}

export const WEEKDAY_ABBR = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const IMG_BG: Record<string, string> = {
  ark: "linear-gradient(135deg,#BFE6EC,#7FC9D6)",
  rainbow: "linear-gradient(135deg,#FFE9A8,#FFC1B6,#CDB6E8,#BFE6EC)",
  dog: "linear-gradient(135deg,#FFE9A8,#E8A825)",
};

export const IMG_LABEL: Record<string, string> = {
  ark: "photo · lego ark",
  rainbow: "doodle · rainbow",
  dog: "photo · puppy",
};

// ---------- calendar ----------
export const CAL_YEAR = 2026;
export const CAL_MONTH = 5;
export const CAL_TODAY = 22;

export interface CalEvent {
  title: string;
  time: string;
  color: string;
  emoji: string;
}

export interface CalCell {
  date: number;
  today: boolean;
  events: CalEvent[];
}

export function buildCalendar(): (CalCell | null)[][] {
  const first = new Date(CAL_YEAR, CAL_MONTH, 1).getDay();
  const days = new Date(CAL_YEAR, CAL_MONTH + 1, 0).getDate();
  const byDate: Record<number, FishEvent[]> = {};
  events.forEach((e) => {
    (byDate[e.date] = byDate[e.date] || []).push(e);
  });
  const cm = cmap();
  const cells: (CalCell | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let dnum = 1; dnum <= days; dnum++) {
    const evs: CalEvent[] = (byDate[dnum] || []).map((e) => ({
      title: e.title,
      time: e.time,
      color: hex(cm[e.c].color),
      emoji: cm[e.c].emoji,
    }));
    cells.push({ date: dnum, today: dnum === CAL_TODAY, events: evs });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (CalCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
