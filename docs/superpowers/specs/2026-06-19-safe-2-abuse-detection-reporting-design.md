# SAFE-2 — Abuse Detection & Mandatory Reporting (Design Spec)

**Date:** 2026-06-19 · **Gates:** C4 (user content/uploads) going live to kids. · **Builds on:** C4 (media quarantine + `scanMedia` seam), C2 (server-side text moderation).

> ⚖️ The **live** CSAM scanner (PhotoDNA / Thorn Safer / Cloudflare) and **NCMEC CyberTipline**
> filing require **vendor onboarding + ESP registration** — external/ops/[LEGAL], not code. This
> spec builds the **pipeline + provider abstraction + incident/report data model** so the live
> integration is a config swap. Default provider = **manual review** (media stays quarantined).

## Goal
Make the upload → scan → verdict → (approve | reject + incident + NCMEC report) flow **real and
pluggable**, with an incident/report system of record, so onboarding a real scanner/NCMEC is config,
not rework. Until a real provider is configured, uploads stay quarantined (safe default).

## Decisions
- **Provider abstraction:** `ScanProvider` interface; default `ManualReviewProvider` (verdict `review` → stays pending). Adapters for PhotoDNA/Thorn/Cloudflare are config-gated stubs that throw "not configured" until creds exist. Selected by `SCAN_PROVIDER` env.
- **Verdicts:** `clean` → media `approved`; `csam` → media `rejected` + **incident** + **NCMEC report (pending)** + lock; `review` → stays `pending` (manual queue).
- **Incidents are immutable records**; NCMEC report rows are never deleted (legal retention).
- **Text** abuse: the existing server-side `moderateText` flag stays (strike). SAFE-2 adds an
  optional escalation hook (a high-severity term → incident) — kept minimal; real classifier is a
  later upgrade (LLM), flagged.

## Data model (verify on real Supabase)
### `media` — add
- `scan_provider text`, `scan_verdict text check (scan_verdict in ('clean','csam','review'))`, `scanned_at timestamptz`.

### `incidents` (immutable)
`id uuid pk, account_id, person_id, kind text (e.g. 'csam_suspected','abuse_text'), media_id uuid null, ref text null (content ref), detail jsonb, status text default 'open' check (open|preserved|closed), created_at`.

### `ncmec_reports` (legal retention; never delete)
`id uuid pk, incident_id uuid → incidents, status text default 'pending' check (pending|filed|failed), report_ref text null, filed_at timestamptz null, created_at`.

### RPCs (service-role)
- `set_media_verdict(account, media_id, provider, verdict)` → updates media (`approved`/`rejected`/`pending` from verdict) + `scan_*`; on `csam` also `create_incident` + `create_ncmec_report`.
- `create_incident(account, person, kind, media_id, ref, detail)` → returns id.
- `create_ncmec_report(incident_id)` → row `pending`.
- `list_incidents(account)` / `list_open_ncmec_reports()` (the filing worklist).
- New fns re-run the execute lockdown.

## Pipeline (orchestration)
`lib/moderation/scan.ts`: `ScanProvider` + `getScanProvider()` (env). `scanAndAct(accountId, mediaId, path)`:
1. `verdict = await provider.scanImage(path)`.
2. `set_media_verdict(accountId, mediaId, provider.name, verdict)` (DB applies status + incident/report on csam).
3. return verdict.
- Wired into C4's `recordUpload`: after `create_media` (pending), call `scanAndAct`. Default provider → `review` → stays pending (no behavior change yet, but the rails are live).
`lib/moderation/ncmec.ts`: `fileReport(reportId)` stub → marks `failed` with reason "not configured" OR leaves `pending`; real filing = registered CyberTipline API ([LEGAL]).

## Admin / moderation
- Extend the admin area with an **Incidents** list (account-scoped, via `list_incidents`) showing kind/status/date. Platform-wide T&S queue + roles = **F2** (deferred; flagged). The C4 account-scoped pending-media queue remains the human-review surface for `review` verdicts.

## Out of scope / [GATED]
- Live PhotoDNA/Thorn/Cloudflare integration (vendor onboarding). Live NCMEC filing (ESP registration). Platform-wide moderator roles (F2). Real LLM text classifier (later). All are **integration points/[LEGAL]**, present as seams.

## Testing
- pgTAP: set_media_verdict clean→approved; csam→rejected + incident + ncmec_report(pending) created; review→pending; list_incidents/list_open_ncmec_reports; account scoping. Verify on real Supabase.
- Vitest: provider selection (default = ManualReview → 'review'); scanAndAct wiring with a fake provider.
