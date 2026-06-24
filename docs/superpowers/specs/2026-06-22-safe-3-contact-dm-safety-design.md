# SAFE-3 — Contact & DM Safety (Design Spec)

**Date:** 2026-06-22 · **Gates:** S1 (connections / favourites / DMs) going live. · **Builds on:** F1 (people/accounts/strikes), SAFE-1 (consent-active children, admin zone + admin-unlock), SAFE-2 (incidents table + provider-abstraction pattern), C2 (`moderateText`).

> ⚖️ SAFE-3 builds the **mechanisms** for safe contact; **counsel sets the policy**. The grooming/risk
> classifier (ML) and any off-platform-contact detection are **gated seams** (like SAFE-2's scanner) —
> default is a transparent heuristic + manual review. No kid-facing DM/connection ships past this gate.

## Governing rules
- **R12** — No child↔child contact (connections/DMs) without **both parents' approval** and **active monitoring**. No unmonitored kid-to-kid messaging, ever.
- **R10** — All contact involving minors is subject to safety scanning + **monitoring / parent-visibility**.
- Mixed **adult⇄kid** contact follows the kid rules (parent approval + moderation + monitoring).

## What SAFE-3 owns vs. what S1 builds
SAFE-3 is the **gate**, built before the feature (mirrors SAFE-2 → C4). It owns the *governed stores and decision functions*; **S1** builds the *experience* (realtime, thread UI, connection cards) on top by calling these rails. Concretely:
- **SAFE-3 owns:** `connections` (relationship + approval state machine), `messages` (the **monitored** DM store), the permission decisions (`can_connect` / `can_dm`), the guarded write path (`send_message`), parent-visibility RPCs, block/report → incident, and the contact-risk provider seam.
- **S1 adds (later):** Supabase Realtime, thread/inbox UI, connection request cards, favourites, presence — all on top of these gated primitives.

## Policy decisions (defaults; flag for counsel)
- **D1 — Under-13 DMs: OFF by default.** `can_dm` returns `denied(reason='under13_no_dm')` for any thread involving an under-13 profile. Connections may still exist (for non-DM, e.g. family/community context) but DMs are blocked. *Rationale: most conservative reading; matches common platform practice.* **[POLICY: confirm whether monitored under-13 DMs are ever permitted.]**
- **D2 — 13–17 DMs: allowed only with parent approval + full monitoring.** A teen can DM a connection **only if** the connection is `active` (both required parent approvals recorded) **and** monitoring is in force (every message persisted + parent-readable). **[POLICY: teen-privacy vs. monitoring balance.]**
- **D3 — Adults: DM any `active` connection freely**, no monitoring, standard moderation only.
- **D4 — Connection approval (two-parent rule):** a connection involving a minor is `pending` until **every minor party's parent** has approved. Adult↔adult = requester→addressee accept. Adult↔kid or kid↔kid = also requires each minor's parent approval. A connection is `active` only when *all required approvals* are present.
- **D5 — Monitoring = parent-visible content,** not just metadata: the parent can read the full message bodies of their child's DMs from the guardian zone (admin-unlock + ownership). Children are told their chats are visible to their parent (transparency, R15 — surface copy).

## Connection state machine
States: `pending → active | declined | blocked`. A connection row carries, per side, the approvals it needs:
- `requester_id`, `addressee_id` (two `people`).
- `status` ∈ `pending | active | declined | blocked`.
- `requester_parent_ok bool`, `addressee_parent_ok bool` — required only when that side is a minor; auto-true for adults at creation.
- `addressee_accepted bool` — the addressee (or, for a minor addressee, this is implied by parent_ok + the minor's own accept) accepted the request.
- Transition to `active` requires: `addressee_accepted` AND (`requester` adult OR `requester_parent_ok`) AND (`addressee` adult OR `addressee_parent_ok`).
- `block_person` sets/creates `status='blocked'` (one-directional intent recorded; blocks override everything → `can_dm` false both ways).

## Data model (verify on real Supabase)
### `connections`
`id uuid pk, account_id uuid (requester's account, for scoping), requester_id uuid → people, addressee_id uuid → people, status text default 'pending' check (pending|active|declined|blocked), requester_parent_ok bool default false, addressee_parent_ok bool default false, addressee_accepted bool default false, created_at, updated_at`. Unique on the unordered pair `(least(req,addr), greatest(req,addr))` to prevent dupes; `requester_id <> addressee_id`.

### `messages` (the monitored DM store)
`id uuid pk, connection_id uuid → connections, sender_id uuid → people, recipient_id uuid → people, body text, flagged bool default false, flagged_term text null, involves_minor bool not null, created_at`. `involves_minor` derived server-side from sender/recipient kind (cannot be spoofed). Index `(connection_id, created_at)`.

### `incidents` (reuse SAFE-2) — new `kind` values
`'abuse_dm'` (flagged DM term), `'grooming_suspected'` (risk provider), `'unapproved_contact'` (attempted contact w/o approval), `'report_user'` / `'report_message'` (user-initiated report). `ref` carries message/connection id.

### RPCs (SECURITY DEFINER, `search_path = public, extensions`, EXECUTE → service_role only)
- `request_connection(account, requester, addressee)` → creates `pending`; sets `*_parent_ok` true for any adult side automatically; returns connection id. Rejects if a `blocked` row exists.
- `set_connection_parent_ok(account, connection_id, child_person_id)` → parent records approval for **their own** child (ownership checked: child's `account_id` = `account`); flips the right side's `*_parent_ok`; auto-activates if all conditions met.
- `respond_connection(account, connection_id, accept bool)` → addressee accept/decline; auto-activates if conditions met.
- `block_connection(account, connection_id)` → `status='blocked'`.
- `can_dm(a_person, b_person)` → boolean + reason: true only if an `active` connection exists, neither side blocked, **no under-13 party (D1)**, and if any minor → connection active (D2/D4). Returns `(allowed bool, reason text)`.
- `send_message(account, sender, recipient, body)` → **the guarded write path**: (1) `can_dm` gate (deny → no insert, returns reason); (2) `moderateText` flag computed by caller and passed in (or term passed); (3) insert message with `involves_minor`; (4) on flag → `add_strike(sender)` + `create_incident('abuse_dm', ref=message_id)`; returns `(message_id, flagged, blocked, reason)`.
- `list_child_connections(account, child)` / `list_child_messages(account, child)` → **parent monitoring** (ownership-checked); returns the child's connections + full message bodies.
- `report_user(account, reporter, target, detail)` / `report_message(account, reporter, message_id, detail)` → `create_incident`.
- All new fns re-run the EXECUTE lockdown (revoke public/anon/authenticated, grant service_role).

## Contact-risk provider seam (mirrors SAFE-2 scan provider)
`lib/moderation/contact.ts`: `ContactRiskProvider { name; assessConnection(ctx): 'allow'|'review'|'block'; assessMessage(ctx): risk }`.
- Default `HeuristicProvider`: flags for **review** (→ incident `grooming_suspected`, does not hard-block) on signals like adult→minor connection request, a burst of requests, or message patterns suggesting off-platform contact (simple keyword heuristics: "what's your number", "snapchat", "meet up", "don't tell"). Transparent, conservative, no ML.
- Gated `MlRiskProvider` (Thorn/Hive/etc.) throws "not configured" until creds exist. Selected by `CONTACT_RISK_PROVIDER` env.
- **Fail-safe:** any provider error → treat as `review` (never silently `allow`) — same discipline as SAFE-2's scan fail-safe.

## App layer
- `lib/contacts.ts` — service-role wrappers: `requestConnection`, `approveChildConnection`, `respondConnection`, `blockConnection`, `canDm`, `sendMessage` (computes `moderateText` then calls RPC + runs `assessMessage`), `listChildConnections`, `listChildMessages`, `reportUser`, `reportMessage`. Types `Connection`, `DmMessage`.
- **Guards** (`lib/guards.ts`): every server action self-authorizes — `requireActiveAdult` for one's own contact actions; `requireAdminUnlock` + ownership for parent monitoring and child-connection approval; children may never approve their own connections or read monitoring views.
- **Admin/guardian zone** (`/app/admin`): a **"Contacts & messages"** section — per child: their connections (with approve/block) and a read-only monitored message view (admin-unlock gated). Reuses the existing incidents view for `abuse_dm`/`grooming_suspected`/reports.
- **Server actions** (S1 will own the send UI; SAFE-3 provides the actions + a minimal harness): `requestConnectionAction`, `approveChildConnectionAction`, `respondConnectionAction`, `blockAction`, `sendMessageAction`, `reportAction` — all returning result objects, all moderated/gated.

## Out of scope / [GATED]
- Realtime delivery, inbox/thread UI, favourites, presence (= **S1**). Group DMs (later). ML grooming classifier + off-platform-contact detection (vendor seam). Platform-wide T&S moderator roles (= F2). All present as seams; none block the gate.

## Testing
- **pgTAP** (verify on real Supabase): two-parent activation (kid↔kid stays `pending` until both `*_parent_ok`); adult↔adult activates on accept; `can_dm` denies under-13 (D1), denies non-active, denies blocked, allows active adult; `send_message` blocks when `can_dm` false (no row inserted); flagged message → strike + `abuse_dm` incident; parent-monitoring lists child messages; account/ownership scoping. Target ~plan(14+).
- **Vitest:** contact-risk provider selection (default Heuristic), `assessMessage` heuristics flag off-platform phrases, fail-safe on provider error → `review`; `sendMessage` wiring with a fake gate.

## Build order
1. DB migration `20260622000000_safe3_contacts.sql` + verify (MCP transactional). 2. pgTAP. 3. `lib/moderation/contact.ts` + tests. 4. `lib/contacts.ts` + guards. 5. admin "Contacts & messages" section + server actions. 6. Vitest. 7. typecheck/lint/build. 8. commit + PR comment + memory.
