import type { CSSProperties } from "react";
import type { PostVM, TagChip } from "@/components/v3/FishHavenApp";
import type { Profile } from "@/lib/v3/data";

export type { PostVM, TagChip };

export interface QuickAction {
  label: string;
  sub: string;
  tint: string;
  iconPath: string;
  onClick: () => void;
  style: CSSProperties;
  iconWrap: CSSProperties;
}

export interface ShoalItemVM {
  style: CSSProperties;
}
export interface ShoalRailItemVM {
  railStyle: CSSProperties;
}

export interface ComposerChip {
  iconPath: string;
  label: string;
}

export interface VisRadio {
  id: string;
  icon: string;
  title: string;
  sub: string;
  onClick: () => void;
  rowStyle: CSSProperties;
  dot: boolean;
}
export interface VisCheck {
  id: string;
  name: string;
  emoji: string;
  onClick: () => void;
  boxStyle: CSSProperties;
  check: string;
}

export interface FilterChip {
  label: string;
  onClick: () => void;
  style: CSSProperties;
}

export interface TrendingVM {
  label: string;
  count: string;
  hot?: boolean;
  color: string;
  icon: string;
  onClick: () => void;
}

export interface EventLineVM {
  date: number;
  title: string;
  time: string;
  cName: string;
  day: string;
}

export interface DiscoverVM {
  id: string;
  name: string;
  emoji: string;
  cover: string;
  blurb: string;
  membersLabel: string;
  onClick: () => void;
  shoal: ShoalItemVM[];
}

export interface CalCellVM {
  blank: boolean;
  cellStyle: CSSProperties;
  date?: number;
  today?: boolean;
  dateStyle?: CSSProperties;
  events?: { title: string; emoji: string; chipStyle: CSSProperties }[];
}

export interface CalRsvpVM {
  title: string;
  time: string;
  cName: string;
  date: number;
  day: string;
  rsvpLabel: string;
  onClick: () => void;
  rsvpStyle: CSSProperties;
}

export interface CommunityVM {
  id: string;
  name: string;
  emoji: string;
  cover: string;
  blurb: string;
  membersLabel: string;
  posts: number;
  isNested: boolean;
  hasChildren: boolean;
  parentName: string;
  parentEmoji: string;
  goParent: () => void;
}

export interface PrayerVM {
  id: string;
  text: string;
  time: string;
  uName: string;
  uAvatar: string;
  uColor: string;
  count: number;
  answered?: boolean;
  btnLabel: string;
  onClick: () => void;
  cardStyle: CSSProperties;
  btnStyle: CSSProperties;
}

export interface BadgeVM {
  name: string;
  icon: string;
  earned: boolean;
  style: CSSProperties;
}

export interface DmThreadVM {
  name: string;
  avatar: string;
  online: boolean;
  preview: string;
  onClick: () => void;
  style: CSSProperties;
}

export interface DmMessageVM {
  text: string;
  name?: string;
  showName: boolean;
  rowStyle: CSSProperties;
  nameStyle: CSSProperties;
  bubbleStyle: CSSProperties;
}

export interface ProfileAdminVM {
  name: string;
  avatar: string;
  sub: string;
  on: boolean;
  onToggle: () => void;
  switchStyle: CSSProperties;
  knobStyle: CSSProperties;
}

export interface PendingVM {
  id: string;
  child: string;
  kind: string;
  where: string;
  time: string;
  resolved: boolean;
  notResolved: boolean;
  statusLabel: string;
  statusStyle: CSSProperties;
  approve: () => void;
  decline: () => void;
}

export type { Profile };
