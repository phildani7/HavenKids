import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { accountIdForEmail, listProfiles, adminPinIsSet, resolveActiveProfile, accountHasChildren, activeStrikes } from "@/lib/accounts";
import { getAdminUnlock } from "@/lib/session";
import { AdminGate } from "./AdminGate";
import { DeleteChildForm } from "./DeleteChildForm";
import { addChildProfile, clearChildStrikes, revokeChildConsent, approveMedia, rejectMedia, approveChildConnectionAction, blockChildConnectionAction } from "./actions";
import { listPendingMedia, mediaSignedUrl, listIncidents } from "@/lib/content";
import { listChildConnections, listChildMessages } from "@/lib/contacts";

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
  const [profiles, pendingMedia, incidents] = await Promise.all([
    Promise.all(baseProfiles.map(async (p) => ({ ...p, strikes: await activeStrikes(p.id) }))),
    listPendingMedia(accountId),
    listIncidents(accountId),
  ]);
  // SAFE-3: per-child contact monitoring (R12). Parents see their child's connections
  // (pending approvals + active/blocked) and the full bodies of their child's DMs.
  const childProfiles = profiles.filter((p) => p.kind === "child");
  const childContacts = await Promise.all(
    childProfiles.map(async (c) => ({
      child: c,
      connections: await listChildConnections(accountId, c.id),
      messages: await listChildMessages(accountId, c.id),
    })),
  );
  // Fetch signed thumbnail URLs for pending media (best-effort; null if unconfigured)
  const pendingWithUrls = await Promise.all(
    pendingMedia.map(async (m) => ({ ...m, thumbUrl: await mediaSignedUrl(m.path) })),
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
      <h2 style={{ marginTop: 32 }}>Pending media</h2>
      <p className="tiny muted" style={{ marginBottom: 12 }}>
        Images uploaded by family members wait here until you approve or reject them. Only approved images become visible.
      </p>
      {pendingWithUrls.length === 0 ? (
        <p className="tiny muted">No pending media — you&apos;re all caught up!</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {pendingWithUrls.map((m) => (
            <li
              key={m.id}
              style={{
                padding: "12px 0",
                borderBottom: "1px solid #eee",
                display: "flex",
                gap: 16,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {m.thumbUrl ? (
                <a href={m.thumbUrl} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.thumbUrl}
                    alt="pending media"
                    style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: "2px solid #eee" }}
                  />
                </a>
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 10,
                    border: "2px solid #eee",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 28,
                    background: "#f9f6ef",
                  }}
                >
                  🖼
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  {m.is_minor ? "👶 Minor upload" : "👤 Adult upload"}
                </div>
                <div className="tiny muted" style={{ marginTop: 2, wordBreak: "break-all" }}>{m.path}</div>
                <div className="tiny muted">{m.mime ?? "unknown type"} · {new Date(m.created_at).toLocaleString()}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <form action={approveMedia} style={{ display: "inline" }}>
                  <input type="hidden" name="mediaId" value={m.id} />
                  <button className="btn btn-ghost" type="submit" style={{ color: "#2a9d8f", fontWeight: 800 }}>
                    ✓ Approve
                  </button>
                </form>
                <form action={rejectMedia} style={{ display: "inline" }}>
                  <input type="hidden" name="mediaId" value={m.id} />
                  <button className="btn btn-ghost" type="submit" style={{ color: "#E85C47", fontWeight: 800 }}>
                    ✕ Reject
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
      <h2 style={{ marginTop: 32 }}>Incidents</h2>
      <p className="tiny muted" style={{ marginBottom: 12 }}>
        Safety incidents flagged by the automated scan pipeline or manual review.
      </p>
      {incidents.length === 0 ? (
        <p className="tiny muted">No incidents — all clear.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {incidents.map((inc) => (
            <li
              key={inc.id}
              style={{
                padding: "10px 0",
                borderBottom: "1px solid #eee",
                fontSize: 13,
              }}
            >
              <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>{inc.kind}</span>
              {" — "}
              <span style={{ color: inc.status === "open" ? "#E85C47" : "#888" }}>{inc.status}</span>
              {" — "}
              <span className="muted">{new Date(inc.created_at).toLocaleString()}</span>
              {inc.media_id && (
                <span className="muted" style={{ marginLeft: 8, wordBreak: "break-all" }}>
                  (media: {inc.media_id})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <h2 style={{ marginTop: 32 }}>Contacts &amp; messages</h2>
      <p className="tiny muted" style={{ marginBottom: 12 }}>
        Your children can only connect with people <strong>you approve</strong>, and you can see all of
        their messages. Under-13 profiles can&apos;t send direct messages at all.
      </p>
      {childContacts.length === 0 ? (
        <p className="tiny muted">No child profiles yet.</p>
      ) : (
        childContacts.map(({ child, connections, messages }) => (
          <div key={child.id} className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700 }}>{child.avatar} {child.display_name}</div>

            <div className="tiny muted" style={{ marginTop: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Connections
            </div>
            {connections.length === 0 ? (
              <p className="tiny muted" style={{ marginTop: 4 }}>No connections.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: "4px 0 0" }}>
                {connections.map((cn) => (
                  <li key={cn.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee", fontSize: 13, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <span className="muted" style={{ wordBreak: "break-all" }}>{cn.other_person}</span>
                    <span style={{ color: cn.status === "active" ? "#2a9d8f" : cn.status === "blocked" ? "#E85C47" : "#E8A825" }}>
                      {cn.status === "pending" ? "⏳ awaiting your approval" : cn.status}
                    </span>
                    <span style={{ flex: 1 }} />
                    {cn.status === "pending" && (
                      <form action={approveChildConnectionAction} style={{ display: "inline" }}>
                        <input type="hidden" name="connectionId" value={cn.id} />
                        <input type="hidden" name="childId" value={child.id} />
                        <button className="btn btn-ghost" type="submit" style={{ color: "#2a9d8f", fontWeight: 800 }}>✓ Approve</button>
                      </form>
                    )}
                    {cn.status !== "blocked" && (
                      <form action={blockChildConnectionAction} style={{ display: "inline" }}>
                        <input type="hidden" name="connectionId" value={cn.id} />
                        <button className="btn btn-ghost" type="submit" style={{ color: "#E85C47", fontWeight: 800 }}>Block</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="tiny muted" style={{ marginTop: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Messages
            </div>
            {messages.length === 0 ? (
              <p className="tiny muted" style={{ marginTop: 4 }}>No messages.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: "4px 0 0" }}>
                {messages.slice(0, 50).map((m) => (
                  <li key={m.id} style={{ padding: "6px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
                    <span className="muted tiny">{m.sender_id === child.id ? "→ sent" : "← received"} · {new Date(m.created_at).toLocaleString()}</span>
                    {m.flagged && <span style={{ color: "#E85C47", fontWeight: 800 }}> · flagged</span>}
                    <div>{m.body}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}

      <p className="tiny muted" style={{ marginTop: 24 }}>
        <a href="/app/profiles?choose=1">← Back to profiles</a>
      </p>
    </div>
  );
}
