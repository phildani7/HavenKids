# FishHaven Tier 1 — Child Safety & Compliance Plan

**Date:** 2026-06-16 · **Status:** plan (drafted against frameworks; legal sign-off pending).

> ⚖️ **Not legal advice.** This designs the *mechanisms* to support compliance. Every
> **[LEGAL]** flag is a determination that needs counsel before real children onboard.
> See `docs/superpowers/risks-and-open-questions.md`.

## Decisions (locked)
- **Kid model:** parent-managed profiles only — children are profiles under a parent's
  account, no independent kid logins. (This *is* the F1 model — a strong start.)
- **Jurisdiction:** global from launch → design to the **strictest common denominator**.
- **Counsel:** proceed against published frameworks now; flag everything for later review.

## Strictest-common-denominator posture (what "global" forces)
| Source | What it demands of us |
|---|---|
| **COPPA (US)** | Verifiable parental consent before collecting a child's personal info; data minimization; no behavioral ads to kids; parental access/deletion; NCMEC reporting. **[LEGAL]** whether a *parent-created* profile still requires formal VPC, and which VPC method qualifies. |
| **UK Age-Appropriate Design Code** | High-privacy **defaults** for under-18s; data minimization; a documented **DPIA** (child-risk assessment); no nudge toward weaker privacy; geolocation off by default; transparency in kid-readable language. |
| **GDPR-K (EU)** | Lawful basis + parental consent under the age threshold (**13–16, varies by country** — **[LEGAL]**); right to access/export/erase; purpose limitation; possibly an EU representative/DPO. |

**Net design rules (apply to every child profile):** minimal data only; private by default;
no discovery/profiling/behavioral ads; geo-aware consent threshold (default strictest);
parent can view/export/delete; consent recorded before activation; everything logged.

## Sub-projects

### SAFE-0 — Legal & policy foundation *(policy, not code; gates all SAFE work)*
Deliverables (framework-drafted, each carrying **[LEGAL]** flags):
- **Compliance matrix:** COPPA / AADC / GDPR-K obligation → how we meet it → open legal questions.
- **Data inventory & minimization map:** every field collected per profile, purpose,
  retention, deletion trigger. (F1 already minimal: display_name, avatar, optional age
  signal — we removed `birth_year`; reintroduce only the minimum needed.)
- **Privacy Policy + Terms** — a **parent version** and a **kid-readable version**.
- **DPIA** (child-risk assessment) document. **NCMEC registration** plan. Retention/deletion policy.

### SAFE-1 — Age assurance & verifiable parental consent *(engineering; gates kid-facing launch; builds on F1 admin zone)*
- **Consent capture + immutable record** at child-profile creation: who consented, when,
  scope, method, version of terms. Child profile stays **inactive until consent recorded**.
  **[LEGAL]** exact VPC method (parent already account-authenticated may streamline this).
- **Age signal** per profile (age *bracket*, not full DOB unless required); **geo-aware**
  default consent threshold (strictest).
- **High-privacy defaults** for child profiles: private, not discoverable, no profiling/ads.
- **Parental data dashboard** (extend F1 `/app/admin`): view what's collected for each
  child, **export**, **delete**; revoke consent → deactivate + erase child data.
- **Data-minimization enforcement** + an **audit log** of consent/data actions.

### SAFE-2 — Abuse detection & mandatory reporting *(gates C4: any user content + uploads)*
- **CSAM hash-scan** on uploads (PhotoDNA / Thorn / Cloudflare CSAM) + text classifiers
  for grooming/abuse (extends the C2 server-side moderation pattern).
- **Report pipeline:** detect → preserve evidence → **NCMEC CyberTipline** report →
  lock content/account; immutable incident log. **[LEGAL]** reporting obligations + evidence handling.
- **Human moderation queue**: review/escalate/ban, roles via F2 governance, appeals.

### SAFE-3 — Contact & DM safety *(gates S1: connections/DMs)*
- **Parent-approved connections** (both children's parents) before any child↔child contact.
- **Monitored DMs**: server-side moderation, **parent visibility**, grooming-pattern
  detection, rate limits on unsolicited contact, one-tap **report/block**.

## Sequencing & gates
```
SAFE-0 (policy)
  └─> SAFE-1  ──gate──>  kid-facing launch
        ├─> SAFE-2  ──gate──>  C4 (user content / uploads)
        └─> SAFE-3  ──gate──>  S1 (connections / DMs)
```
No kid-facing feature ships past its SAFE gate. (Adults-only features can proceed in
parallel without these gates.)

## How F1 already helps
Parent-account ownership, the locked admin/guardian zone, server-side moderation (C2),
service-role-only data access, and per-profile `kind` are all foundations SAFE-1/2/3
build directly on — the parent-managed decision means much of the consent/control
surface extends the existing admin zone rather than new auth machinery.

## Recommended next step
Spec **SAFE-1** to implementation depth (it gates kid launch and is mostly an extension
of the F1 admin zone), and get a **one-time counsel review of SAFE-0** before any real
child onboards — even under "flag for later," that single review retires most of the legal risk.
