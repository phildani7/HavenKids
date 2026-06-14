import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { accountIdForEmail, listProfiles, accountHasChildren } from "@/lib/accounts";
import { setActiveProfile } from "@/lib/session";
import { PickerClient } from "./PickerClient";

export const dynamic = "force-dynamic";

export default async function ProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ pinFor?: string; error?: string; choose?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const accountId = await accountIdForEmail(session.user.email);
  if (!accountId) redirect("/login");

  const profiles = await listProfiles(accountId);
  const sp = await searchParams;

  // Auto-skip: a single profile with no PIN goes straight in, unless the user
  // explicitly asked to choose (?choose=1).
  if (profiles.length === 1 && !profiles[0].has_pin && sp.choose !== "1") {
    await setActiveProfile(profiles[0].id);
    redirect("/app");
  }

  const hasChildren = await accountHasChildren(accountId);
  return (
    <PickerClient
      profiles={profiles}
      hasChildren={hasChildren}
      pinFor={sp.pinFor ?? null}
      error={sp.error ?? null}
    />
  );
}
