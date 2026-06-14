"use client";

import type { Profile } from "@/lib/accounts";
import { pickProfile, switchProfile } from "./actions";

export function PickerClient({
  profiles, hasChildren, pinFor, error,
}: {
  profiles: Profile[]; hasChildren: boolean; pinFor: string | null; error: string | null;
}) {
  return (
    <div className="login-shell">
      <div className="login-card" style={{ maxWidth: 640 }}>
        <h1 style={{ fontSize: 28 }}>Who&apos;s here? 🐟</h1>
        {error && (
          <p className="tiny" style={{ color: "#E85C47", marginTop: 8 }}>
            {error === "badpin" ? "That PIN didn't match — try again."
              : error === "locked" ? "Too many tries. Wait a minute and try again."
              : "Something went off. Try again."}
          </p>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 16, marginTop: 20 }}>
          {profiles.map((p) => (
            <form action={pickProfile} key={p.id} style={{ textAlign: "center" }}>
              <input type="hidden" name="personId" value={p.id} />
              <button className="card" type="submit" style={{ width: "100%", padding: 16, cursor: "pointer" }}>
                <div style={{ fontSize: 40 }}>{p.avatar}</div>
                <div style={{ fontWeight: 800, marginTop: 6 }}>{p.display_name}</div>
                {p.has_pin && <div className="tiny muted">🔒 PIN</div>}
              </button>
              {pinFor === p.id && (
                <input className="login-input" name="pin" inputMode="numeric" autoFocus
                  placeholder="Enter PIN" style={{ marginTop: 8 }} />
              )}
            </form>
          ))}
        </div>

        {hasChildren && (
          <a className="btn btn-ghost" href="/app/admin" style={{ marginTop: 20, justifyContent: "center" }}>
            🔐 Enter family / admin zone
          </a>
        )}

        <form action={switchProfile} style={{ marginTop: 12 }}>
          <button className="btn btn-ghost" type="submit" style={{ width: "100%", justifyContent: "center" }}>
            Sign out of this device
          </button>
        </form>
      </div>
    </div>
  );
}
