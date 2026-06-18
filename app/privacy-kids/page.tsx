export const metadata = { title: "FishHaven — How we keep you safe" };

// Kid-readable notice. Mirrors docs/superpowers/safe-0/privacy-notice-kids.md (DRAFT).
export default function PrivacyKidsPage() {
  return (
    <div className="login-shell">
      <div className="login-card" style={{ maxWidth: 620, textAlign: "left" }}>
        <h1 style={{ fontSize: 26 }}>Hi friend! How FishHaven keeps you safe 🐟</h1>

        <p style={{ marginTop: 12 }}><strong>A grown-up said yes.</strong> Your parent or guardian set up your
        profile and said it&apos;s okay for you to be here. They&apos;re always in charge of your account.</p>

        <p style={{ marginTop: 12 }}><strong>We help keep chats kind.</strong> Gabriel the Angel watches the
        chats. If a word might hurt a friend, you&apos;ll get a gentle nudge. Three strikes and we pause so a
        grown-up can help — that&apos;s not a punishment, it&apos;s a break. 💛</p>

        <p style={{ marginTop: 12 }}><strong>What we remember.</strong> Just your name and the little picture you
        pick, and the things you do here so we can make it fun and safe. We don&apos;t know your real name, where
        you live, or your phone — and we never show you ads.</p>

        <p style={{ marginTop: 12 }}><strong>Talking to friends.</strong> You can only connect or message other
        kids if a grown-up says yes first, and a grown-up can see those messages to keep everyone safe.</p>

        <p style={{ marginTop: 12 }}><strong>If something feels wrong,</strong> tell a grown-up, or tap Report 🚩.
        You can always say &quot;stop.&quot;</p>

        <p style={{ marginTop: 12 }}>Be kind, have fun, and remember — you matter. 💛</p>

        <p className="tiny muted" style={{ marginTop: 20 }}>
          <a href="/privacy-parents">Grown-up version</a> · <a href="/login">Back</a>
        </p>
      </div>
    </div>
  );
}
