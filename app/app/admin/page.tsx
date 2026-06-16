import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { accountIdForEmail, listProfiles, adminPinIsSet, resolveActiveProfile, accountHasChildren, activeStrikes } from "@/lib/accounts";
import { getAdminUnlock } from "@/lib/session";
import { AdminGate } from "./AdminGate";
import { addChildProfile, clearChildStrikes } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const accountId = await accountIdForEmail(session.user.email);
  if (!accountId) redirect("/login");
  const sp = await searchParams;

  const active = await resolveActiveProfile(accountId);
  if (active?.kind === "child") redirect("/app/profiles?choose=1");

  const unlocked = (await getAdminUnlock()) === accountId;
  const pinSet = await adminPinIsSet(accountId);
  const hasChildren = await accountHasChildren(accountId);

  // Adult-only account with no PIN and no children: it's just settings — let
  // the owner in. Otherwise the zone is gated (unlock if a PIN exists, else setup).
  if (!unlocked && (pinSet || hasChildren)) {
    return <AdminGate needsSetup={!pinSet} error={sp.error ?? null} />;
  }

  const baseProfiles = await listProfiles(accountId);
  const profiles = await Promise.all(
    baseProfiles.map(async (p) => ({ ...p, strikes: await activeStrikes(p.id) })),
  );
  return (
    <div style={{ padding: 28, maxWidth: 900, margin: "0 auto" }}>
      <h1>Family / admin</h1>
      <h2 style={{ marginTop: 20 }}>Profiles</h2>
      <ul>
        {profiles.map((p) => (
          <li key={p.id}>
            {p.avatar} {p.display_name} — {p.kind}{p.is_owner ? " (owner)" : ""}{p.has_pin ? " 🔒" : ""}
            {" — "}{p.strikes} strike{p.strikes === 1 ? "" : "s"}
            {p.kind === "child" && (
              <>
                {" "}
                <form action={clearChildStrikes} style={{ display: "inline" }}>
                  <input type="hidden" name="personId" value={p.id} />
                  <button className="btn btn-ghost" type="submit">Clear strikes</button>
                </form>
              </>
            )}
          </li>
        ))}
      </ul>
      <h2 style={{ marginTop: 20 }}>Add a child profile</h2>
      <form action={addChildProfile} className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <input className="login-input" name="name" placeholder="Name" />
        <input className="login-input" name="avatar" placeholder="🦄" maxLength={2} style={{ width: 70 }} />
        <input className="login-input" name="pin" inputMode="numeric" placeholder="PIN (optional)" />
        <button className="btn btn-coral" type="submit">Add child</button>
      </form>
      <p className="tiny muted" style={{ marginTop: 24 }}>
        <a href="/app/profiles?choose=1">← Back to profiles</a>
      </p>
    </div>
  );
}
