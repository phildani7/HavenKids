# FishHaven × Micya — Risks & Open Questions

**Date:** 2026-06-16 · **Status:** living document (review before each kid-facing / AI sub-project).

The architecture (Supabase, the phased roadmap) is in good shape. The hard parts of
this project are **safety, trust, and governance** — the things that bite late if
left unexamined. This file tracks them so they're decided deliberately, not by default.

> **Standing rule (gate):** No kid-facing launch, user-generated content at scale,
> or DM/connection feature ships until the corresponding **Tier 1** item below is
> built. See the Safety & Compliance gates in the roadmap.

## Tier 1 — gates launch (legal / child-safety; non-negotiable)

- **COPPA + child-safety law.** US COPPA requires *verifiable parental consent* (VPC)
  for under-13s + data minimization; UK/EU have the Age-Appropriate Design Code. Our
  parent-account/profile model is the right shape, but consent capture, kid data
  handling, and no-behavioral-ads-to-kids are legal requirements. **Needs legal
  counsel** — we build the mechanisms; counsel determines acceptable methods/jurisdictions.
- **Mandatory abuse reporting.** Hosting minors + user content ⇒ CSAM detection +
  **NCMEC CyberTipline reporting is legally required** (US). Blocklist is a toy; need
  real image/text scanning + a preserve-and-report pipeline before real kids onboard.
- **DMs/connections are the highest-risk surface.** S1 kid-to-kid contact is where
  grooming happens. Parent-approval + monitoring must be built in from line one
  (gates S1).

## Tier 2 — shapes the product deeply

- **AI trust in a faith context.** Hallucinated/misquoted scripture is reputationally
  radioactive. Hard requirements: source citations, "AI can be wrong" framing,
  human-in-loop for doctrinal/sensitive answers.
- **Theological governance.** "Christian community" spans denominations that disagree.
  Whose doctrine? Contradiction-detection (C8) over theology is sensitive. Community-
  owned beliefs + owner/admin moderation help, but "who decides acceptable" is a
  product decision.
- **Data sensitivity & consent.** Prayer requests / confessions / personal struggles
  are the most sensitive data held. AI-Hidden / AI-Excluded scopes (F3) were a smart
  call. Add: AI-training consent, export/portability, real deletion (esp. minors).

## Tier 3 — decides whether it survives

- **AI cost model.** Embeddings + generation (refinery, Ask AI) likely the dominant
  cost, scaling per active community. Needs caching + a cost-per-community model early.
- **Funding + cold-start.** "Free" + AI + safety-ops = real recurring cost →
  nonprofit/grants/church-tier pricing? And communities are the product: how are the
  first churches/co-ops seeded?
- **Operational safety.** Audit flagged no observability + in-memory rate limiting.
  A *safety* incident (not just a bug) is possible → monitoring, incident path, durable
  rate-limiting before launch.

## Cross-cutting open questions (need a decision)
1. Launch **jurisdiction(s)** and **minimum age** — allow under-13 (full COPPA VPC) or
   13+ first (much lighter)? Biggest single scoping lever.
2. **Legal counsel** — engaged, or proceed against a compliance framework and flag all
   legal sign-offs?
3. **Funding/governance** model (nonprofit? who runs Micya?).
4. **Mobile** strategy (PWA vs native) given all-ages + global reach.
5. **Accessibility** baseline (kids + older adults): font scaling, contrast, simple UX.
