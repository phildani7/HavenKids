"use client";
import { unlockAdmin, setupAdminPin } from "./actions";

export function AdminGate({ needsSetup, error }: { needsSetup: boolean; error: string | null }) {
  const action = needsSetup ? setupAdminPin : unlockAdmin;
  return (
    <div className="login-shell">
      <div className="login-card">
        <h1 style={{ fontSize: 26 }}>{needsSetup ? "Set an admin PIN 🔐" : "Admin / family zone 🔐"}</h1>
        <p className="tiny muted" style={{ marginTop: 8 }}>
          {needsSetup
            ? "Create a PIN to manage profiles and family settings. You'll need it before adding a child profile."
            : "Enter your admin PIN to continue."}
        </p>
        {error && <p className="tiny" style={{ color: "#E85C47", marginTop: 8 }}>
          {error === "badpin" ? "Wrong PIN." : error === "locked" ? "Too many tries — wait a minute."
            : error === "shortpin" ? "PIN must be at least 4 digits."
            : error === "already" ? "A PIN is already set — enter it to unlock." : "Try again."}
        </p>}
        <form action={action} style={{ marginTop: 16 }}>
          <input className="login-input" name="pin" inputMode="numeric" autoFocus placeholder="PIN" />
          <button className="btn btn-gold" type="submit" style={{ width: "100%", marginTop: 10, justifyContent: "center" }}>
            {needsSetup ? "Set PIN" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
