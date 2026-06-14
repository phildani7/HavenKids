import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { accountIdForEmail, resolveActiveProfile, activeStrikes } from "@/lib/accounts";
import { clearAllProfileCookies } from "@/lib/session";
import { HavenApp } from "@/components/HavenApp";

export const dynamic = "force-dynamic";

export default async function AppPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const accountId = await accountIdForEmail(session.user.email);
  if (!accountId) redirect("/login");

  const profile = await resolveActiveProfile(accountId);
  if (!profile) redirect("/app/profiles");

  const initialStrikes = await activeStrikes(profile.id);

  async function handleSignOut() {
    "use server";
    await clearAllProfileCookies();
    await signOut({ redirectTo: "/login" });
  }

  return (
    <HavenApp
      profile={{
        id: profile.id,
        name: profile.display_name,
        avatar: profile.avatar,
        kind: profile.kind,
      }}
      onSignOut={handleSignOut}
      initialStrikes={initialStrikes}
    />
  );
}
