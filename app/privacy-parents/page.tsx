export const metadata = { title: "FishHaven — Privacy Notice for Parents" };

// Public so a parent can read it before consenting (SAFE-1 R15 transparency).
// Content mirrors docs/superpowers/safe-0/privacy-notice-parents.md (DRAFT — pending counsel).
export default function PrivacyParentsPage() {
  return (
    <div className="login-shell">
      <div className="login-card" style={{ maxWidth: 720, textAlign: "left" }}>
        <h1 style={{ fontSize: 26 }}>Privacy Notice for Parents &amp; Guardians</h1>
        <p className="tiny muted">Draft — India + US (UK/EU not served). Pending final/legal review.</p>

        <h2 style={{ marginTop: 16, fontSize: 18 }}>You hold the account</h2>
        <p>FishHaven is a Christian community platform. You hold the account; your children use it as
        <strong> profiles</strong> under your account. Children do not have their own logins.</p>

        <h2 style={{ marginTop: 16, fontSize: 18 }}>Your consent is required</h2>
        <p>A child&apos;s profile stays inactive until you give consent. You confirm you are the child&apos;s
        parent or legal guardian. You can withdraw consent at any time — doing so deactivates the profile
        and deletes the child&apos;s data.</p>

        <h2 style={{ marginTop: 16, fontSize: 18 }}>What we collect about a child — and nothing more</h2>
        <ul>
          <li>A display name and avatar you choose.</li>
          <li>An age range (under 13, or 13–17) so we apply the right safety rules.</li>
          <li>Activity needed to run the service and keep them safe.</li>
        </ul>
        <p>We do <strong>not</strong> collect your child&apos;s real name, date of birth, location, or contact details.</p>

        <h2 style={{ marginTop: 16, fontSize: 18 }}>What we never do</h2>
        <p>We do not track or profile children, show them targeted ads, sell or share their data, or use it to
        train AI models.</p>

        <h2 style={{ marginTop: 16, fontSize: 18 }}>How we keep children safe</h2>
        <p>Content and any contact involving children is monitored; child-to-child connections and messages
        require your approval and are supervised. We are legally required to report suspected child-abuse
        material to authorities.</p>

        <h2 style={{ marginTop: 16, fontSize: 18 }}>Your rights</h2>
        <p>From the family/admin area you can <strong>see, export, correct, and delete</strong> everything we hold
        about your child, and withdraw consent. We keep child data only as long as needed, then erase it
        (except records the law requires us to keep, such as a safety report).</p>

        <p className="tiny muted" style={{ marginTop: 20 }}>
          Questions or complaints: contact our support/grievance channel. ·{" "}
          <a href="/privacy-kids">Kids&apos; version</a> · <a href="/login">Back to sign in</a>
        </p>
      </div>
    </div>
  );
}
