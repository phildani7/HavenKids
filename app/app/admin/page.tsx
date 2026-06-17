import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { accountIdForEmail, listProfiles, adminPinIsSet, resolveActiveProfile, accountHasChildren, activeStrikes } from "@/lib/accounts";
import { getAdminUnlock } from "@/lib/session";
import { AdminGate } from "./AdminGate";
import { DeleteChildForm } from "./DeleteChildForm";
import { addChildProfile, clearChildStrikes, revokeChildConsent } from "./actions";

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

  const errorMsg =
    sp.error === "attest" ? "Please confirm you're the parent/guardian." :
    sp.error === "badpin" ? "Wrong PIN." :
    sp.error === "locked" ? "Too many tries — wait a minute." :
    sp.error === "shortpin" ? "PIN must be at least 4 digits." :
    sp.error === "already" ? "A PIN is already set — enter it to unlock." :
    null;

  const baseProfiles = await listProfiles(accountId);
  const profiles = await Promise.all(
    baseProfiles.map(async (p) => ({ ...p, strikes: await activeStrikes(p.id) })),
  );
  return (
    <div style={{ padding: 28, maxWidth: 900, margin: "0 auto" }}>
      <h1>Family / admin</h1>
      {errorMsg && (
        <p className="tiny" style={{ color: "#E85C47", marginTop: 8 }}>{errorMsg}</p>
      )}
      <h2 style={{ marginTop: 20 }}>Profiles</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {profiles.map((p) => (
          <li key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
            <span style={{ fontWeight: 700 }}>{p.avatar} {p.display_name}</span>
            {" — "}{p.kind}{p.is_owner ? " (owner)" : ""}{p.has_pin ? " 🔒" : ""}
            {p.kind === "child" && (
              <>
                {" — "}
                <span style={{ color: p.is_active ? "#2a9d8f" : "#e76f51" }}>
                  {p.is_active ? "Active" : "⏳ Pending consent"}
                </span>
                {" — age band: "}{p.age_band}
              </>
            )}
            {" — "}{p.strikes} strike{p.strikes === 1 ? "" : "s"}
            {p.kind === "child" && (
              <span style={{ marginLeft: 12, display: "inline-flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <form action={clearChildStrikes} style={{ display: "inline" }}>
                  <input type="hidden" name="personId" value={p.id} />
                  <button className="btn btn-ghost" type="submit">Clear strikes</button>
                </form>
                <form action={revokeChildConsent} style={{ display: "inline" }}>
                  <input type="hidden" name="personId" value={p.id} />
                  <button className="btn btn-ghost" type="submit">Revoke consent</button>
                </form>
                <a className="btn btn-ghost" href={`/app/admin/export?personId=${p.id}`}>Export data</a>
                <DeleteChildForm personId={p.id} />
              </span>
            )}
          </li>
        ))}
      </ul>
      <h2 style={{ marginTop: 24 }}>Add a child profile</h2>
      <div className="card" style={{ padding: 16, marginBottom: 16, fontSize: 13, lineHeight: 1.5 }}>
        <strong>Before you add a child profile</strong> — FishHaven will collect only a display name,
        avatar, and age range for your child. We use this to apply the right safety rules. We do not
        collect your child&apos;s real name, date of birth, or contact details, and we never sell or
        share their data. You can export, correct, or delete it at any time from this page.
        By checking the box below you confirm you are this child&apos;s parent or legal guardian and
        consent to FishHaven processing their data as described in our{" "}
        <a href="/privacy-parents" target="_blank" rel="noopener noreferrer">parent privacy notice</a>.
      </div>
      <form action={addChildProfile} style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 480 }}>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <input className="login-input" name="name" placeholder="Name" />
          <input className="login-input" name="avatar" placeholder="🦄" maxLength={2} style={{ width: 70 }} />
          <input className="login-input" name="pin" inputMode="numeric" placeholder="PIN (optional)" />
        </div>
        <div>
          <label htmlFor="age_band" style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>
            Age range
          </label>
          <select id="age_band" name="age_band" className="login-input" style={{ width: "auto" }}>
            <option value="under_13">Under 13</option>
            <option value="13_17" selected>13–17</option>
          </select>
        </div>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" name="attest" style={{ marginTop: 2, flexShrink: 0 }} required />
          <span>
            I am this child&apos;s parent/guardian and consent to FishHaven processing their data
            as described in the notice above.
          </span>
        </label>
        <div>
          <button className="btn btn-coral" type="submit">Add child</button>
        </div>
      </form>
      <p className="tiny muted" style={{ marginTop: 24 }}>
        <a href="/app/profiles?choose=1">← Back to profiles</a>
      </p>
    </div>
  );
}
