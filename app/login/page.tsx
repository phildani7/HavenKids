import { redirect } from "next/navigation";
import { auth, hasGoogle, hasResend, signIn } from "@/auth";
import { Angel } from "@/components/primitives";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/app");

  const { sent, error, callbackUrl } = await searchParams;
  const redirectTo = callbackUrl || "/app";

  return (
    <div className="login-shell">
      <div className="login-card">
        <div style={{ display: "grid", placeItems: "center" }}>
          <div className="bob">
            <Angel size={110} />
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "#8A6B00",
            marginTop: 10,
          }}
        >
          Welcome to Haven Kids
        </div>
        <h1 style={{ marginTop: 6, fontSize: 32 }}>Come on in, friend 💛</h1>
        <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: 14 }}>
          {hasGoogle || hasResend
            ? "Sign in with Google or get a magic link by email. Gabriel is waiting."
            : "Try it out as a demo kid — Gabriel is waiting."}
        </p>

        {sent && (
          <div
            className="card"
            style={{
              marginTop: 16,
              padding: "12px 14px",
              background: "linear-gradient(135deg,#E8F9E2,#C7ECC9)",
              border: "2px solid #4FB05830",
              textAlign: "left",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 14 }}>📬 Check your email</div>
            <div className="tiny muted" style={{ marginTop: 4 }}>
              We sent you a magic link. Open it on this device to sign in.
            </div>
          </div>
        )}
        {error && (
          <div
            className="card"
            style={{
              marginTop: 16,
              padding: "12px 14px",
              background: "linear-gradient(135deg,#FFD1E1,#FFC1B6)",
              border: "2px solid #E85C4730",
              textAlign: "left",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 14 }}>Hmm, that didn&apos;t work</div>
            <div className="tiny muted" style={{ marginTop: 4 }}>
              {error}. Try again in a moment.
            </div>
          </div>
        )}

        {hasGoogle && (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo });
            }}
            style={{ marginTop: 20 }}
          >
            <button
              className="btn btn-ghost"
              type="submit"
              style={{ width: "100%", justifyContent: "center", gap: 10, padding: "14px 20px" }}
            >
              <GoogleG />
              <span>Continue with Google</span>
            </button>
          </form>
        )}

        {hasResend && (
          <>
            <div className="row" style={{ marginTop: 18, gap: 10 }}>
              <div style={{ flex: 1, height: 2, background: "#2B234014", borderRadius: 2 }} />
              <span className="tiny muted" style={{ fontWeight: 900 }}>
                OR
              </span>
              <div style={{ flex: 1, height: 2, background: "#2B234014", borderRadius: 2 }} />
            </div>

            <form
              action={async (formData) => {
                "use server";
                const email = String(formData.get("email") || "").trim();
                if (!email) return;
                await signIn("resend", { email, redirectTo });
              }}
              style={{ marginTop: 18 }}
            >
              <input
                className="login-input"
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                autoComplete="email"
              />
              <button
                className="btn btn-gold"
                type="submit"
                style={{ width: "100%", justifyContent: "center", marginTop: 10, padding: "14px 20px" }}
              >
                ✨ Email me a magic link
              </button>
            </form>
          </>
        )}

        {/* Demo / bypass — always available */}
        <div className="row" style={{ marginTop: 18, gap: 10 }}>
          <div style={{ flex: 1, height: 2, background: "#2B234014", borderRadius: 2 }} />
          <span className="tiny muted" style={{ fontWeight: 900 }}>
            OR TRY WITHOUT SIGNUP
          </span>
          <div style={{ flex: 1, height: 2, background: "#2B234014", borderRadius: 2 }} />
        </div>

        <form
          action={async (formData) => {
            "use server";
            const name = String(formData.get("name") || "").trim();
            await signIn("demo", { name, redirectTo });
          }}
          style={{ marginTop: 14 }}
        >
          <input
            className="login-input"
            type="text"
            name="name"
            placeholder="Your kid name (optional)"
            maxLength={40}
            autoComplete="off"
            style={{ marginBottom: 10 }}
          />
          <button
            className="btn btn-coral"
            type="submit"
            style={{ width: "100%", justifyContent: "center", padding: "14px 20px", gap: 8 }}
          >
            😇 Enter as a Demo Kid
          </button>
        </form>

        <p className="tiny muted" style={{ marginTop: 18 }}>
          By continuing you agree to kind-words-only and that Gabriel may pause your account after three strikes.
        </p>
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 43.5c5.4 0 10.3-2 14-5.3l-6.5-5.3C29.6 34.3 26.9 35.5 24 35.5c-5.3 0-9.7-3.3-11.3-7.9l-6.6 5.1C9.6 39 16.2 43.5 24 43.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.5 5.3c3.8-3.5 6.1-8.7 6.1-15 0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
