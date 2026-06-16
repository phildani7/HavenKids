"use client";
/* =============================================================
   HAVEN KIDS — Top-level client shell with route state.
   Combines design/project/app.jsx + all ported screens.
   ============================================================= */

import { useEffect, useState } from "react";
import { HAVEN_DATA, type User } from "@/lib/data";
import { AngelFloat, Sidebar, TopBar } from "./shell";
import { HomePage } from "./screens/HomePage";
import { DiscoverPage } from "./screens/DiscoverPage";
import { CommunityPage } from "./screens/CommunityPage";
import { DoodlePage } from "./screens/DoodlePage";
import { ChatPage } from "./screens/ChatPage";
import { PrayerPage } from "./screens/PrayerPage";
import { ProfilePage } from "./screens/ProfilePage";
import { ClassroomPage } from "./screens/ClassroomPage";
import { TweaksPanel, type Theme } from "./TweaksPanel";
import { logActivity } from "@/lib/activity";

export type RoutePage =
  | "home"
  | "discover"
  | "community"
  | "doodle"
  | "chat"
  | "prayer"
  | "classroom"
  | "profile"
  | "parents";

export interface Route {
  page: RoutePage;
  communityId?: string;
}

export interface ActiveProfile {
  id: string;
  name: string;
  avatar: string;
  kind: "adult" | "child";
}

export function HavenApp({
  profile,
  onSignOut,
  initialStrikes,
}: {
  profile: ActiveProfile;
  onSignOut: () => void | Promise<void>;
  initialStrikes: number;
}) {
  const [route, setRouteState] = useState<Route>({ page: "home" });
  const [strikes, setStrikes] = useState(initialStrikes);

  // Persist strike changes for the active profile while keeping the UI instant.
  const bumpStrike = (reason: string) => {
    setStrikes((s) => Math.min(3, s + 1)); // 3 strikes = account paused (app premise)
    void import("@/app/app/strikes/actions").then((m) => m.recordStrikeAction(reason));
  };
  const resetStrikes = () => setStrikes(0);
  const [theme, setTheme] = useState<Theme>("sunshine");
  const [avatar, setAvatar] = useState(profile.avatar || "🦄");

  const displayName = profile.name;
  const isKid = profile.kind === "child";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.kidSafe = isKid ? "1" : "0";
  }, [theme, isKid]);

  useEffect(() => {
    logActivity("view_page", { page: route.page, communityId: route.communityId });
  }, [route.page, route.communityId]);

  const setRoute = (r: Route) => setRouteState(r);

  // Derive the in-app avatar from the first letter / seed data
  const baseUser = HAVEN_DATA.users[0];
  const user: User = {
    ...baseUser,
    id: "me",
    name: displayName,
    avatar,
    level: 7,
    xp: 640,
    color: "rose",
  };

  return (
    <div className="app">
      <Sidebar route={route} setRoute={setRoute} userName={displayName} onSignOut={onSignOut} />
      <main className="main">
        <TopBar user={user} strikes={strikes} />
        {route.page === "home" && <HomePage user={user} setRoute={setRoute} />}
        {route.page === "discover" && <DiscoverPage setRoute={setRoute} />}
        {route.page === "community" && (
          <CommunityPage communityId={route.communityId} setRoute={setRoute} user={user} />
        )}
        {route.page === "doodle" && <DoodlePage user={user} />}
        {route.page === "chat" && <ChatPage user={user} strikes={strikes} onStrike={bumpStrike} />}
        {route.page === "prayer" && <PrayerPage />}
        {route.page === "profile" && <ProfilePage user={user} strikes={strikes} />}
        {route.page === "parents" && (
          <div style={{ padding: 28 }}>
            <p>Family settings live in the admin zone.</p>
            <a className="btn btn-gold" href="/app/admin">Open admin zone →</a>
          </div>
        )}
        {route.page === "classroom" && <ClassroomPage />}
      </main>

      <AngelFloat strikes={strikes} onOpen={() => setRoute({ page: "chat" })} />

      <TweaksPanel
        theme={theme}
        setTheme={setTheme}
        strikes={strikes}
        setStrikes={setStrikes}
        onResetStrikes={resetStrikes}
        avatar={avatar}
        setAvatar={setAvatar}
      />
    </div>
  );
}
