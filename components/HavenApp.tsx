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
import { ParentsPage } from "./screens/ParentsPage";
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

export interface SessionUser {
  email: string;
  name: string | null;
  image: string | null;
}

export function HavenApp({
  session,
  onSignOut,
}: {
  session: SessionUser;
  onSignOut: () => void | Promise<void>;
}) {
  const [route, setRouteState] = useState<Route>({ page: "home" });
  const [strikes, setStrikes] = useState(0);
  const [theme, setTheme] = useState<Theme>("sunshine");
  const [avatar, setAvatar] = useState("🦄");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    logActivity("view_page", { page: route.page, communityId: route.communityId });
  }, [route.page, route.communityId]);

  const setRoute = (r: Route) => setRouteState(r);

  // Derive the in-app avatar from the first letter / seed data
  const baseUser = HAVEN_DATA.users[0];
  const displayName = session.name || session.email.split("@")[0];
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
        {route.page === "chat" && <ChatPage user={user} strikes={strikes} setStrikes={setStrikes} />}
        {route.page === "prayer" && <PrayerPage />}
        {route.page === "profile" && <ProfilePage user={user} strikes={strikes} />}
        {route.page === "parents" && <ParentsPage user={user} />}
        {route.page === "classroom" && <ClassroomPage />}
      </main>

      <AngelFloat strikes={strikes} onOpen={() => setRoute({ page: "chat" })} />

      <TweaksPanel
        theme={theme}
        setTheme={setTheme}
        strikes={strikes}
        setStrikes={setStrikes}
        avatar={avatar}
        setAvatar={setAvatar}
      />
    </div>
  );
}
