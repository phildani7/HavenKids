# SAFE-0 — Compliance Foundation & Operating Rules

**Date:** 2026-06-16 · **Status:** framework-drafted (legal sign-off pending). · **Owner:** FishHaven / Micya.

> ⚖️ **Not legal advice.** This is drafted against published guidance (India DPDP Act 2023,
> US COPPA, NCMEC reporting law). Every **[LEGAL]** item needs counsel before real children
> onboard. Parent: `docs/superpowers/specs/2026-06-16-fishhaven-tier1-safety-plan.md`.

## 1. Scope

- **Markets:** India, United States, and rest-of-world **EXCEPT the United Kingdom and the EU/EEA**, which are **geo-restricted** (blocked at signup and access) until a separate UK/EU compliance track is done.
- **Kid model:** parent-managed only. Children exist solely as **profiles** under a parent/guardian's account; **no independent child logins**. (Already true in F1.)
- **Child definition (governing):** **anyone under 18** — India DPDP's bar — is treated as a child requiring parental consent. This is stricter than COPPA's under-13, so one rule covers all minors. We still record an **under-13 flag** because some US COPPA mechanics (and NCMEC handling) hinge on it.
- **Legal posture:** strictest of India DPDP + US COPPA/NCMEC. We do **not** sell or "share" personal data, run behavioral ads, or profile minors — which removes large swaths of obligation by design.

## 2. THE RULES (operating ruleset)

These are binding product/engineering rules. SAFE-1/2/3 implement them; nothing kid-facing ships violating them.

### Consent & accounts
- **R1.** A child profile is **inactive** (cannot post, chat, connect, or have data processed beyond what's needed to create the consent record) **until a parent/guardian records verifiable consent.** **[LEGAL: which VPC method qualifies for India + US; whether parent-account authentication + an explicit consent step suffices.]**
- **R2.** Consent is captured as an **immutable record**: parent identity (account), child profile, timestamp, consent scope, method, and the **version** of the notice/terms consented to.
- **R3.** Consent is **revocable** at any time by the parent; revocation **deactivates the child profile and triggers erasure** of the child's personal data (R14).
- **R4.** Account owner attests they are the parent/legal guardian of each child profile they create. **[LEGAL: attestation wording + whether stronger guardian verification is required.]**

### Data minimization & purpose
- **R5.** Collect the **minimum** per child profile: display name, avatar, an **age bracket** (under-13 / 13–17), and activity strictly needed to run the service. **No full date of birth, no real-name requirement, no contact info for the child** (parent's email is the account's). 
- **R6.** **Purpose limitation:** child data is used only to operate FishHaven for that child and for safety. Not for ads, not for model training, not for analytics profiling. **[LEGAL: confirm any analytics on minors is aggregate/non-identifying only.]**
- **R7.** **No tracking, behavioral monitoring, profiling, or targeted advertising of minors — ever** (DPDP explicit; COPPA-aligned). No third-party trackers on kid surfaces.

### Parental rights & control
- **R8.** A parent can, for each child, **view all data collected, export it, correct it, and delete it**, from the admin/guardian zone (extends F1 `/app/admin`).
- **R9.** A **grievance/contact** channel is published and staffed (DPDP requires a contact for redressal). **[LEGAL: India may require a named Grievance Officer.]**

### Safety & mandatory reporting
- **R10.** All user-generated content and contact involving minors is subject to **safety scanning** (SAFE-2) and **monitoring/parent-visibility** (SAFE-3).
- **R11.** Suspected CSAM → **preserve evidence, file an NCMEC CyberTipline report, lock the content/account**, per US law (18 U.S.C. §2258A). Maintain an immutable incident log. **[LEGAL: registration as a reporting provider; evidence-retention rules.]**
- **R12.** No child↔child contact (connections/DMs) without **both parents' approval** and active monitoring (SAFE-3 gate).

### Security, retention, transparency
- **R13.** Personal data is protected with reasonable safeguards: service-role-only DB access (F1), encryption in transit, least privilege, audit logging. **Breach** → notify affected + the India Data Protection Board within the required window. **[LEGAL: breach timelines.]**
- **R14.** **Retention:** keep child data only as long as needed; **erase on consent withdrawal, profile deletion, or account closure**, except data law requires us to retain (e.g. NCMEC incident records). Document every retention period (§5).
- **R15.** **Transparency:** a **parent privacy notice** and a **kid-readable notice**, in plain language, available before consent. **[LEGAL: India multilingual-notice expectation — English + major Indian languages.]**
- **R16.** **Geo-restriction:** detect and **block UK + EU/EEA** users at signup and on access; the Terms state the service is not offered there. **[LEGAL: geo-IP is best-effort; document the limitation.]**

## 3. Compliance matrix (rule → law → status)

| Rule | India DPDP | US COPPA/NCMEC | Implemented by | Status |
|---|---|---|---|---|
| R1–R4 consent | ✅ parental consent <18 | ✅ VPC <13 | SAFE-1 | planned |
| R5–R7 minimization / no-tracking | ✅ | ✅ | SAFE-1 + design rule | planned |
| R8 parental access/export/delete | ✅ | ✅ | SAFE-1 (admin zone) | planned |
| R9 grievance contact | ✅ (officer?) | — | SAFE-0 + ops | **[LEGAL]** |
| R10–R12 safety/reporting/contact | well-being duty | ✅ NCMEC | SAFE-2 / SAFE-3 | planned (gates C4/S1) |
| R13 security/breach | ✅ | ✅ | F1 + ops | partial (F1) |
| R14 retention/erasure | ✅ | ✅ | SAFE-1 | planned |
| R15 transparency | ✅ (multilingual?) | ✅ notice | SAFE-0 notices | drafting |
| R16 geo-restriction | n/a | n/a | engineering | planned |

## 4. Data inventory & minimization map

| Data | Subject | Why (purpose) | Lawful basis | Retention |
|---|---|---|---|---|
| owner_email | parent | account identity, consent record, contact | parent consent / contract | life of account |
| admin_pin_hash | parent | guardian-zone gate | legitimate operation | life of account |
| profile display_name, avatar | child | identify the profile in-app | parental consent | until profile/consent deleted |
| age bracket (under-13 / 13–17) | child | apply correct safety rules | parental consent / legal | until profile deleted |
| activity events (page/event, ts) | child | run service, safety, parent dashboard | parental consent | rolling window (define, e.g. 12 mo) **[LEGAL]** |
| strikes (reason, ts) | child | moderation / guardian visibility | safety / legit interest | until cleared + audit window |
| consent record | parent+child | prove lawful basis | legal obligation | retain (proof) **[LEGAL]** |
| safety incident / NCMEC report | child | mandatory reporting | legal obligation | per law (do not delete) **[LEGAL]** |

**Removed by design:** full DOB, child contact info, real name, geolocation, third-party trackers, ad identifiers.

## 5. Child-safety risk assessment (voluntary DPIA-style)

Not legally required without UK/EU, but cheap insurance and exactly what counsel reviews.
- **Highest risks:** (1) child↔child contact / grooming via DMs → mitigated by SAFE-3 (parent-approved + monitored). (2) CSAM in uploads → SAFE-2 scanning + NCMEC. (3) over-collection of child data → R5–R7 minimization. (4) a child reaching the guardian zone / clearing own strikes → already fixed in F1 (C1/C2).
- **Residual:** client-side chat *delivery* (a tampered client could evade detection) → server-side chat is a later sub-project; documented.

## 6. Mandatory reporting (NCMEC) plan
- Register FishHaven as an electronic service provider for CyberTipline reporting. **[LEGAL]**
- On detection (SAFE-2): preserve content + metadata, file report, lock, log immutably, do **not** delete the evidence. Define an internal escalation + a named responsible person.

## 7. Geo-restriction requirement (flows to engineering)
- Geo-IP check at signup and on protected routes; block UK + EU/EEA with a clear "not available in your region" page. Record the country determination with the consent record. Best-effort; documented limitation (VPNs).

## 8. Requirements handed to SAFE-1 / SAFE-2 / SAFE-3
- **SAFE-1:** consent capture + immutable record (R1–R4), age bracket (R5), minimization + no-tracking defaults (R5–R7), parental data dashboard view/export/correct/delete (R8), retention/erasure jobs (R14), audit log, **geo-restriction (R16)**, grievance contact surface (R9).
- **SAFE-2:** CSAM scanning + NCMEC pipeline + moderation queue (R10–R11).
- **SAFE-3:** parent-approved + monitored contact (R12).

## 9. [LEGAL] flag register (hand this to counsel)
1. VPC method acceptable for India (<18) + US (<13); does parent-account auth + explicit step suffice? (R1, R4)
2. Named Grievance Officer requirement in India. (R9)
3. India multilingual-notice expectation. (R15)
4. Breach-notification timelines + Data Protection Board process. (R13)
5. NCMEC registration + evidence retention specifics. (R6, R11)
6. Retention windows for activity/consent/incident data. (R14, §4)
7. Final India DPDP **Rules** (still being notified) may add specifics. (whole doc)
8. Guardian-verification strength beyond self-attestation. (R4)

## 10. Status & next steps
- [x] Jurisdiction + age + kid-model decided; rules drafted.
- [x] Compliance matrix, data inventory, risk assessment, NCMEC plan, retention map drafted.
- [ ] Parent + kid privacy notices — drafts in this folder (`privacy-notice-*.md`).
- [ ] **Counsel review of this doc** (recommended before kid launch).
- [ ] Proceed to **SAFE-1** spec (consent + parental controls), which implements §8.
