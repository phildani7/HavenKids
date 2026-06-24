export default function BlockedPage() {
  return (
    <div className="login-shell">
      <div className="login-card">
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
          FishHaven isn&apos;t available in your region yet 🐟
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--muted, #666)" }}>
          FishHaven is not currently offered in the United Kingdom or European
          Union / EEA. We&apos;re working on it — check back soon.
        </p>
      </div>
    </div>
  );
}
