# FishHaven — Frontend Design Brief

**For:** a design/frontend agent building or refactoring the FishHaven UI.
**Status:** direction brief (opinionated). Recommendations are baked in; genuine forks are listed in §17 "Decisions to confirm."
**Author's stance:** This is a *point of view*, not a mood board. Build the revised plan exactly; derive every color and type decision from the tokens here.

---

## 0. How to use this document

1. Read §1–§5 first — they're the thesis. Everything downstream derives from them. Don't skim to the token tables.
2. Before writing any CSS, do the frontend-design two-pass: draft the token plan (§6–§9), then critique it against §16 "Anti-defaults" and §1 "the subject." If a choice reads like the generic answer you'd give any community app, revise it and note why.
3. The codebase already has a working token + component layer in `app/globals.css` and `components/`. **Extend it, don't rip it out.** This brief maps 1:1 onto the existing classes (`.btn`, `.card`, `.chip`, `.sidebar`, etc.). The migration path is §15.
4. Hold yourself to the quality floor in §14 without announcing it.

---

## 1. The subject, pinned

**FishHaven is a Christian community platform for every age** — kids, teens, parents, families, and whole churches/communities — that is growing into the **Micya AI Community Operating System**. One adult login can hold several profiles (a parent + their kids, Netflix-style). Communities have owners and admins, nest inside each other, and can open threads or whole communities to one another. There is a feed, communities, events/RSVP, a prayer wall, DMs and connections (LinkedIn-style), a resource library, and an AI helper ("Gabriel," rendered as an angel). Underneath it all is a hard child-safety spine: parental consent, content quarantine, abuse detection, NCMEC reporting.

**The single job of the product's front door:** make a person — of any age — feel they've arrived somewhere *safe, warm, and alive with other people*, and get them into their community in one move.

**Audience, concretely.** The same screens must work for:
- a **7-year-old** (under_13) who can barely read and needs big, friendly, low-text surfaces;
- a **14-year-old** (13_17) who will abandon anything that looks like a baby app;
- a **parent** managing consent, profiles, and a moderation queue — who needs to trust this with their child;
- a **community owner / pastor / org admin** running a congregation — who needs it to look like a serious tool, not a toy.

That last sentence is the whole problem.

---

## 2. The core design problem (the thesis)

The product was born as **"Haven Kids"** and its current skin is a candy "Sunshine" theme: `#FFF7E6` cream sky, six saturated playground colors, Fraunces + Nunito + Caveat, and chunky "sticker" buttons with hard offset shadows. It's genuinely charming **for a 7-year-old** and genuinely disqualifying **for a pastor deciding whether to move their congregation here.**

We are **not** going to ship two apps, and we are **not** going to flatten the kids' joy into grown-up greige. The thesis:

> **One haven, many ages.** A single design language with a *depth/play dial* that flexes by who's holding the screen. Same bones, same brand, same components — but saturation, ornament, type weight, motion, and surface depth shift across three bands: **kid · teen · adult.** A child gets brightness and stickers; a pastor gets calm, deep water and restraint. Neither feels like the other's app, yet they are unmistakably the *same place.*

The mechanism is a `data-age` attribute on the app shell, derived from the active profile's `age_band` (the data model already carries `under_13 | 13_17` and adult). One token system; the band re-weights a handful of dials (§11). This *is* the signature constraint of the project — design every component as "how does this flex across the dial," not "how does this look once."

---

## 3. Brand world & signature

FishHaven = **fish + haven.** Two ancient, concrete things:

- **The fish (ichthys)** — the earliest Christian sign, two crossing arcs drawn in the sand. It means *belonging without saying a word.* In the product, people belong to communities; communities are **schools of fish moving together.**
- **The haven** — a harbor, sheltered water. Refuge. A place boats come in from open sea. The product's entire reason to exist is *safety:* a child can be online here the way a boat can be safe in harbor.

So the brand world is **a safe harbor at warm light**: still water, dappled light on its surface, lamps along the dock, buoys marking where it's safe, and — under the surface — schools of fish. This world gives us color (water + harbor light), motion (drift, tide, swim), structure (surface vs. depth = public vs. private), and a mark.

### The signature element (spend your boldness here, nowhere else)

**The ichthys-shoal + depth.** Three expressions of one idea, and the page is *remembered by this:*

1. **The mark.** A single continuous-stroke ichthys is the FishHaven glyph — logo, favicon, the loader (a fish that completes its loop as content loads), and the divider (one small fish swimming left→right along a hairline "current" rule between sections). It replaces generic dots/chevrons everywhere a small mark is needed.
2. **Presence as a shoal.** Community vitality — "who's here now," connection strength, a thread heating up — is drawn as **a small school of fish all facing the same way.** More fish = more alive. This *replaces* the default stacked-avatars-with-"+42" pattern (see `ActiveNowCard` in `HomePage.tsx`) with something native to the brand. Avatars still exist for identity; the shoal is for *energy.*
3. **Depth as privacy.** The haven has a bright surface and a still deep. As a person moves from the public feed → a community → family/admin → private DMs, the **surface literally deepens** toward harbor teal: lighter and warmer in public, darker, calmer, fewer stickers as it gets private. Going private *feels like going into deeper, stiller water.* This encodes a real safety truth (privacy = depth) instead of decorating.

Everything else stays quiet so these land.

---

## 4. Design principles (specific to FishHaven)

1. **Safety reads as calm, not as warnings.** The product's hardest feature is child safety. It should feel like a harbor, not a hospital. Trust comes from steadiness — generous space, soft deep water, plain words — not from badges and shields. Reserve alarm colors strictly for genuine incidents (§6 safety palette).
2. **The dial is the design.** No component is "done" until it's specified at kid, teen, and adult. If a treatment only works for one band, it's wrong.
3. **Warmth survives growing up.** The adult band is calm and deep — but never cold, never corporate-blue, never greige. A grandmother and a pastor still feel *welcomed,* just not *babied.* Keep the warm plum-ink and lamp-gold across all bands.
4. **One bold thing per surface.** Per surface, let the signature (a shoal, a deepening, one Fraunces headline, one gold gathering-light) be the memorable element; keep everything around it disciplined. Cut the second flourish.
5. **Structure encodes truth, not decoration.** Use eyebrows, dividers, and depth to mean something — *this is public / this is your family / this is private.* Don't number things (01/02/03) unless they're a real sequence (e.g., the consent flow, a lesson's PRAY steps). Most of this app is a *graph,* not a list.
6. **The AI helper is a guest, not a host.** Gabriel/the Angel annotates and reassures; it never owns the page or speaks over people. Scope its voice (and the handwriting font) tightly.

---

## 5. What's already there (don't reinvent)

Grounding so you extend rather than duplicate:

- `app/globals.css` — the token system (`:root` vars), `[data-theme="cloud"]` alt theme, and primitives: `.card .chip .btn(.btn-coral/-sky/-gold/-grass/-grape/-ghost/-sm) .sticker .app .sidebar .login-*`. The "sticker" shadow language is `0 4px 0 0 <deep>` (a hard offset + soft ambient).
- `components/primitives.tsx` — `Angel` (Gabriel SVG mascot, moods happy/worried/sleeping), `Avatar`, `PlaceholderImage`, `VerseCard`.
- `components/screens/*` — `HomePage` (hero + quick actions + feed + right rail), `CommunityPage`/`CommunityFeed`, `DiscoverPage`, `ProfilePage`, `ChatPage`, `PrayerPage`, `ClassroomPage`, `DoodlePage`.
- `app/app/admin/page.tsx` — the family/admin zone (profiles, consent, pending-media queue, incidents). Currently bare inline styles; this is the most under-designed and highest-trust surface.
- `app/login`, `app/app/profiles` (profile picker), `app/privacy-parents`, `app/privacy-kids`.

Tokens that should **survive** the refactor (continuity + low migration cost): `--ink #2B2340`, `--coral`, `--gold`, `--grass`, the radius scale, the sticker-shadow idea. Tokens that **change**: the cream sky becomes warmer/cleaner sand; **deep harbor teal is added as the new spine;** purple/pink/sky are demoted to kid-band accents.

---

## 6. Color system — "Harbour Light"

The palette is a safe harbor at golden hour: warm sand and foam above the waterline, teal water below it, lamp-gold and a coral buoy for warmth and wayfinding. Continuity with today's coral/gold/grass/ink is deliberate.

### Core named values

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#2B2340` | Primary text. Warm plum-black — **not** pure black. Keep across all bands. |
| `--ink-soft` | `#5A4E7A` | Secondary text. |
| `--ink-mute` | `#8A82A8` | Tertiary / metadata. |
| `--sand` | `#FAF4EA` | App background above the waterline. Cleaner & less yellow than today's `#FFF7E6`. |
| `--foam` | `#FFFFFF` | Cards, raised surfaces. |
| `--shell` | `#FFF8EC` | Inset fields, soft wells (replaces `#FFF8E8`). |
| **`--harbor`** | **`#0E3A45`** | **The new spine.** Deep water. Private/family/admin surfaces, footers, deep panels, the deepest depth level. |
| **`--tide`** | **`#1F7A8C`** | **Primary interactive for teen/adult** — links, primary actions, focus. The trustworthy blue-green the candy palette never had. |
| `--shallows` | `#7FC9D6` | Bright aqua — kid-band primary, highlights, presence glow. |
| `--buoy` / deep | `#FF7E6B` / `#E85C47` | The coral accent (kept). Energy, "you are here," kid CTAs, the *one* warm pop. |
| `--lamp` / deep | `#FFC94A` / `#E8A825` | Gold. Gatherings/events, selection (`::selection`), highlight, warmth. |
| `--reed` / deep | `#7DCE82` / `#4FB058` | Green. Success, growth, answered prayer, "active." |

Kid-only accents (demoted from core to the kid band): `--grape #B47EE5`, `--rose #F58BB3`, `--sky #7AC7F2`. Available at `data-age="kid"`; muted or unused at adult.

### The depth model (the spatial system — this is the risk worth taking)

Surfaces are assigned a **depth level** via `data-depth` on a zone wrapper. Higher depth = more private = deeper, stiller water. The background, card treatment, and ornament density all shift with depth.

| `data-depth` | Where | Background | Cards | Feel |
|---|---|---|---|---|
| `0` surface | Public feed, discover, marketing | `--sand` + faint caustics | `--foam`, full sticker shadow | Bright, open, social |
| `1` shallows | Inside a community | `--sand` slightly cooler | `--foam`, softer shadow | Focused, belonging |
| `2` deep | Family / admin / consent | gradient `--sand`→`#EAF0F0` | `--foam` on cool ground, flatter | Calm, serious, trusted |
| `3` harbor | Private DMs | `--harbor` deep, light text | translucent foam panels | Intimate, quiet, off the record |

The transition between depths should be a **slow background settle** (≤400ms, reduced-motion: instant), never a jarring theme flip. This makes "I'm now somewhere private" a *felt* thing, not a label.

### Safety / semantic colors (reserved — never decorative)

| Token | Hex | Meaning |
|---|---|---|
| `--ok` | `#4FB058` | Approved, consented, clean. |
| `--pending` | `#E8A825` | Quarantined / awaiting review / pending consent (lamp-deep — "waiting by the dock"). |
| `--alert` | `#E85C47` | Rejected, strike, blocked. |
| `--incident` | `#B3261E` | **Reserved for real incidents only** (CSAM-suspected, NCMEC). A deeper, soberer red than `--alert`. Never use for UI chrome. |

The pending/alert distinction matters: the admin queue (`page.tsx`) currently uses `#2a9d8f`/`#E85C47` ad hoc — replace with `--ok`/`--alert` and add `--pending` for the quarantine state, which is the *common, non-scary* case.

---

## 7. Typography

Three roles, deliberately paired — and the type *flexes on the dial* rather than switching faces per band.

| Role | Face | Use |
|---|---|---|
| **Display** | **Fraunces** (kept) | Headlines, hero, community names. Warm, characterful serif with optical sizing — use the **9pt optical** at UI sizes and **144pt optical** at hero scale. Used with restraint, heavier at kid, lighter/airier at adult. |
| **Body / UI** | **Hanken Grotesk** (recommended swap from Nunito) | All body, labels, buttons, data. Humanist and warm but *grown-up* — Nunito's rounded terminals are the single biggest "this is a kids' app" tell to adults. One face, weight/size re-weighted per band. *(Fork in §17 if continuity with Nunito is preferred — then keep Nunito for kid band only.)* |
| **Hand / annotation** | **Caveat** (kept, *scoped*) | **Only** two uses: kid-band playful accents, and Gabriel/Angel's spoken annotations. Never general UI. |
| **Data / mono** | **Spline Sans Mono** (new, admin-only) | Raw IDs, paths, timestamps in the admin incident/media tables (`page.tsx` shows raw `media_id`, `path` — these want mono). |

### Type scale (adult band baseline; kid/teen re-weight per §11)

| Step | Size / line-height | Weight | Face |
|---|---|---|---|
| Display XL (hero) | 56 / 1.0 | 900 | Fraunces 144opt |
| H1 | 40 / 1.05 | 800 | Fraunces |
| H2 | 28 / 1.1 | 700 | Fraunces |
| H3 | 20 / 1.2 | 700 | Fraunces |
| Body L | 17 / 1.5 | 500 | Hanken |
| Body | 15 / 1.5 | 500 | Hanken |
| Label | 13 / 1.3 | 700 | Hanken |
| Caption | 12 / 1.35 | 600 | Hanken |
| Eyebrow | 11 / 1.3 | 800, `+0.12em`, uppercase | Hanken |

Adult sets body weight to 500 (today's global `font-weight: 600` everywhere reads heavy/young — drop to 500 for adult, keep 600–700 for kid). Numerals tabular for any count, leaderboard, or table.

---

## 8. Space, radius, shadow, grid

- **Spacing scale:** 4 · 8 · 12 · 16 · 20 · 28 · 40 · 64. Be generous at adult depth (calm = air); tighter and chunkier at kid.
- **Radius (dial-flexed):** keep `--radius-sm/…/-pill`. Kid leans `--radius-lg/-xl` (toy-soft); adult leans `--radius`/`--radius-sm` (composed). Pills stay for chips/buttons across bands.
- **Shadow — the "sticker" language flexes on the dial.** Today's `0 4px 0 0 <deep>` hard offset is the toy/sticker feel. **Kid:** full 4px offset. **Teen:** 3px, softer. **Adult:** 1–2px or drop the hard offset for a single soft ambient shadow (`0 8px 24px rgba(43,35,64,.10)`). The offset shadow is *the* thing that codes "young" — dial it down, don't delete it.
- **Grid / app shell:** keep the `240px | 1fr` sidebar shell (`.app`). Content max-width 1200 (feed) / 900 (admin/settings) / 640 (reading, prayer, consent). Right rail 320, collapses below 1024. The sidebar is the **dock** — a vertical row of lit lamps (nav items), the active one glowing gold.

---

## 9. Motion

Motion serves the harbor, used sparingly (over-animation is itself a "looks AI-generated" tell).

- **Signature loader:** the ichthys draws itself / completes its loop as content loads. Replaces spinners.
- **Depth settle:** background deepens/lightens on zone change (§6), ≤400ms ease.
- **Shoal drift:** presence fish bob/drift gently (extend the existing `@keyframes bob`), randomized phase per fish. Idle ambient only.
- **Page-load:** a single orchestrated reveal on the home hero (content rises like it's surfacing) — once, not per-card. Keep the rest still.
- **Micro:** keep the satisfying button press (`translateY` + shadow collapse — it's good and on-brand). Hover lifts on cards.
- **Reduced motion:** `prefers-reduced-motion` kills drift, settle, and reveal; loaders become a static mark; nothing essential depends on motion. Non-negotiable (§14).

---

## 10. Component direction

Map onto existing classes; specify each across the dial.

- **Buttons (`.btn` + variants).** Keep the pill + press. Variants map to roles: primary = `--tide` (adult) / `--shallows` or `--coral` (kid); `.btn-coral` = the one warm CTA; `.btn-gold` = gatherings/RSVP; `.btn-ghost` = secondary. Shadow offset flexes on the dial.
- **Cards (`.card`).** Foam on sand. Border + shadow flex with depth (§6/§8). At `data-depth=3` (DMs) cards become translucent foam over harbor.
- **Chips (`.chip`).** Filters, tags, reactions. `is-active` → ink (today) / `--tide` fill at adult. Keep pill.
- **Avatar & the Shoal (new).** `Avatar` stays for identity. Add `<Shoal count birds={facing}>` for presence/vitality — the signature; use it in `ActiveNowCard`, community headers, connection strength, "thread heating up."
- **Ichthys mark & divider (new).** `<Fish>` glyph component (logo, loader, bullet) + `<Current/>` hairline divider with a swimming fish. Replace decorative dots/`···`.
- **Composer (`ComposerCard`).** Adult copy "Share with your community…"; kid copy "Share something kind…" (already there) — dial-driven. Keep the attachment chips (Photo/Doodle/Prayer/Verse/Feeling); doodle hidden at adult.
- **Post card (`PostCard`).** Reactions (❤️/🙏/🎉/✨) stay — they're warm and on-brand for all ages. Gabriel's `angelNote` annotation = the scoped Caveat + Angel use. "Pinned by Gabriel" → at adult, "Pinned." Soften gamified chrome at adult.
- **App shell / sidebar = the dock.** Nav items are lamps; active glows `--lamp`. Add the active-profile + depth indicator (you can *see* you're in family vs. public water).
- **Family / admin zone (`app/app/admin/page.tsx`) — the priority rebuild.** This is the highest-trust, lowest-design surface. Set `data-depth=2` (calm deep water). Replace ad-hoc hex with semantic tokens. The three sections — **Profiles, Pending media, Incidents** — become calm data surfaces: pending-media is the common, *non-alarming* `--pending` state (a tray by the dock), incidents use `--alert`/`--incident` and mono IDs. Consent copy stays plain and parental (today's is good). This screen must make a parent exhale.
- **Consent / onboarding flow.** A real sequence → numbering *is* earned here. Depth 2, generous space, one step per view, plain words.
- **Login / profile picker.** Keep the centered card warmth. Profile picker = Netflix-style faces *as a small shoal coming into harbor.* Picking a kid profile visibly shifts the whole shell to the kid band (the dial, demonstrated).

---

## 11. Age-band theming spec (the dial)

Root app shell sets `data-age` from the active profile's `age_band`: `under_13 → kid`, `13_17 → teen`, adult/owner → `adult`. Implement as CSS variable overrides on `[data-age="…"]`, exactly like the existing `[data-theme="cloud"]` block. Concrete deltas:

| Dial | kid | teen | adult |
|---|---|---|---|
| Body weight | 700 | 600 | 500 |
| Base font size | 16–17 | 15–16 | 15 |
| Radius lean | lg / xl | radius | radius / sm |
| Sticker shadow offset | 4px | 3px | 1–2px / soft only |
| Saturation | full candy (grape/rose/sky on) | moderate | restrained (teal/sand/gold/coral) |
| Primary color | `--shallows` / `--coral` | `--tide` | `--tide` |
| Caveat (hand) | accents allowed | sparing | Gabriel-only |
| Emoji density | high | medium | low (functional only) |
| Motion amplitude | lively | moderate | subtle |
| Gamification (XP/streaks/leaderboard) | prominent | present | minimal/off (fork §17) |
| Background caustics | playful, visible | faint | barely-there |

**Crucial:** all three share the *same components, layout, ink, gold, coral, and the haven world.* The dial re-weights; it never forks the design. A parent switching from their own profile to their kid's should watch the *same place* get younger — not jump to a different app.

---

## 12. Voice & content

Copy is design material. Register flexes on the dial; structure and honesty don't.

- **Labels name what the person controls,** not the system. "Pending media" → consider "Photos waiting for you" (parent-facing). Actions say what happens: "Approve," "Add child," "Share." An action keeps its name through the flow (button "Publish" → toast "Published").
- **Register by band.** Kid: short, warm, concrete ("Share something kind…"). Adult: plain and respectful, not stiff ("Share with your community"). Never baby-talk an adult; never bureaucratize a child.
- **Errors are calm and directive** — the existing admin errors are the right voice, keep them: "Wrong PIN." "Too many tries — wait a minute." "PIN must be at least 4 digits." No apologies, no vagueness.
- **Empty states invite action,** they don't mope: "No incidents — all clear." (good, keep) / pending empty: "You're all caught up." Prayer wall empty → an invitation to post the first request.
- **Safety copy reassures without alarming.** Quarantine is the *normal* path: "Photos are checked before they appear — usually quick." Save real gravity for real incidents.
- **Gabriel** speaks in Caveat, briefly, as a gentle guest: a one-line note, never a wall, never speaking *for* the user.

---

## 13. Screen-by-screen direction

- **Home (`HomePage.tsx`)** — Hero is the thesis: "you've arrived somewhere alive." Replace the candy gradient hero with a harbor-light hero whose signature is **presence** (a shoal + warm welcome), not a generic stat. Keep quick-actions but make them band-aware. Feed stays; right rail's `ActiveNowCard` becomes the Shoal; leaderboard softens/hides at adult.
- **Discover (`DiscoverPage.tsx`)** — Communities as harbors to sail into; each card shows life via a small shoal. Browsing = looking across the water.
- **Community (`CommunityPage`/`CommunityFeed`)** — `data-depth=1`. Header carries the community's identity + its shoal (how alive it is) + owner/admin markers. Nested communities = harbors-within-harbors; cross-sharing = "open to other waters."
- **Profile (`ProfilePage.tsx`)** — Identity + connections (the connection graph as a shoal you swim with). Badges present at kid, restrained at adult.
- **DMs / Chat (`ChatPage.tsx`)** — `data-depth=3`, harbor deep, intimate and quiet. The most private water. Safety still present but unobtrusive.
- **Prayer (`PrayerPage.tsx`)** — Quietest surface. 640 max-width, deep calm, lamp-gold for "praying with you." Answered prayer → `--reed`. This is where restraint pays off most.
- **Family / Admin (`app/app/admin/page.tsx`)** — see §10. The trust-defining rebuild. `data-depth=2`.
- **Login & profile picker** — see §10. The picker is where the dial first reveals itself.
- **Onboarding / consent** — earned numbering, one step per view, depth 2.
- **Classroom / Doodle (`ClassroomPage`, `DoodlePage`)** — kid/teen-leaning; full play. Lessons (PRAY steps) are a real sequence → numbering earned.

---

## 14. Quality floor (meet silently)

- Responsive to mobile: sidebar → bottom dock/drawer below 768; rails stack; tap targets ≥44px (kids need bigger).
- Visible keyboard focus everywhere (a `--tide` focus ring); full keyboard nav.
- `prefers-reduced-motion` respected (§9).
- WCAG AA contrast on *every* band — verify candy-on-sand and light-on-harbor especially.
- Don't rely on color alone for safety state (pair `--pending`/`--alert`/`--incident` with text + icon).
- Real loading/empty/error states for every async surface (feed, media queue, incidents, signed-URL thumbnails that may be null).
- Image content from quarantine may be `null` (unconfigured signed URLs) — design the graceful placeholder (already present in admin as the 🖼 well; make it intentional).

---

## 15. Build / migration plan (incremental, non-destructive)

Extend `app/globals.css` and `components/`; ship in phases, each independently shippable.

- **Phase 0 — Token layer.** Add Harbour-Light vars, `--harbor/--tide/--sand/--foam/--shell`, semantic safety tokens, `[data-age="kid|teen|adult"]` override blocks, and `data-depth` surface rules. Wire `data-age` from active profile, `data-depth` per route/zone. (No visual change yet beyond palette.)
- **Phase 1 — Primitives.** Update `.btn/.card/.chip/.sticker` to the dial; add `<Fish>` (mark/loader/bullet), `<Current/>` (divider), `<Shoal/>` (presence). Swap body font Hanken (or keep Nunito kid-only per fork).
- **Phase 2 — App shell.** Sidebar → dock with lamps + active-profile/depth indicator; responsive bottom dock.
- **Phase 3 — Home & feed.** New hero, band-aware quick actions, Shoal in the rail.
- **Phase 4 — Community, discover, profile.** Depth 1, shoals, nesting/cross-share affordances.
- **Phase 5 — DMs & prayer.** Depth 3 (harbor) and the quiet prayer surface.
- **Phase 6 — Family / admin (priority).** Depth 2 rebuild, semantic tokens, mono data, calm queue, sober incidents.
- **Phase 7 — Login, picker, onboarding/consent.** The dial reveal + earned numbering.
- **Phase 8 — Motion, ambient, a11y pass.** Ichthys loader, depth settle, shoal drift, reduced-motion, contrast audit.

Screenshot and self-critique each phase (§16). Keep notes of what you tried.

---

## 16. Anti-defaults (critique against this before building)

Current AI design clusters around (1) warm-cream + high-contrast serif + terracotta; (2) near-black + one acid accent; (3) broadsheet hairlines/zero-radius. **Note:** today's app sits dangerously near #1 (cream + Fraunces + coral). Harbour-Light's defense is the **deep harbor-teal spine + the depth/play dial + the ichthys-shoal** — none of which is generic. Guard rails:

- If you reach for cream + serif + terracotta and *stop there,* you've shipped the default. The teal water and the dial are what make it FishHaven.
- Don't render presence as stacked-avatars-+N. That's the default; we have the shoal.
- Don't number non-sequences. Most of this is a graph.
- Don't let Gabriel or emoji run the page at adult.
- Don't add a second flourish per surface. One bold thing (§4.4).
- Don't ship one band and tint it. All three or it's not done (§11).
- Run the prompt yourself: "design a Christian community app." If your result looks like that generic answer, the harbor and the dial aren't doing their job — revise.

---

## 17. Decisions to confirm (genuine forks)

These change the brief materially; the doc currently bakes in the **recommended** option of each.

1. **Master aesthetic (baked: age-adaptive single system, anchored on the adult band).** Alt: keep kid-first as master and treat adult as the variant. Recommended as written — the adult/pastor trust problem is the bigger business risk.
2. **Body font (baked: swap Nunito → Hanken Grotesk, one face all bands).** Alt: keep Nunito for kid band only, Hanken for teen/adult. Lower migration, slightly less cohesion.
3. **Gamification at adult (baked: minimal/off — XP, streaks, leaderboard hidden for adults, kept for kids).** Alt: keep a softened version for everyone. This is a product-tone call as much as visual.
4. **Depth-as-privacy ambient (baked: full — deepening surfaces + faint caustics + the harbor DM theme).** Alt: restrained — color tokens only, no animated settle, no caustics. Full is the signature risk; restrained is safer/faster.

---

*This brief is the plan. Build the revised plan exactly, derive every color and type choice from §6–§9, spend boldness only on the signature (§3), and critique against §16 before and after.*

---

# Part B — The "ultra" layer

The bar is raised: FishHaven must be **ultra interesting, creative, intuitive, feature-rich, and its search + tags must be excellent.** Part A is the disciplined floor; Part B is the ambition ceiling. The two are not in tension — the discipline is *what lets* the boldness land. Read this layer as elevating §4 (principles) and §16 (anti-defaults), not replacing them.

## 18. Creative ambition (raise the ceiling)

§4.4 still holds — **one bold thing per surface** — but the *baseline* ambition rises: this should be a place people screenshot and show a friend, and a tool a community runs its week on. "Restraint" means *focusing* the wow, not avoiding it.

- Spend the wow on the **signature triad** (§3): the **ichthys-shoal**, **depth-as-privacy**, and a third, introduced here — **scripture-currents** (§21). These three, executed fully, are the memorable identity. Everything else stays quiet so they sing.
- Take the depth risk **fully** (fork §17.4 → full): animated surface settle, faint caustics, the harbor-deep DM theme. Half-committing to the signature is the one way to land in the generic middle.
- Branded *moments,* not branded *chrome:* the command palette surfacing like a breath of water-light (§21), the ichthys completing its loop as a loader, a followed tag swimming into your sidebar, a prayer being "answered" rippling green. A few orchestrated moments beat scattered effects.
- "Interesting" is earned by the **subject,** never by ornament. The most novel things here are *Christian-community-native:* a cross-community scripture index, prayer that visibly gets answered, communities as harbors that can open to each other's waters. Lean into what no secular community app would build.

## 19. Intuitiveness (zero-instruction)

The product must be obvious to a 7-year-old *and* a grandmother on first try — across the whole age dial.

- **Recognizable, then flavored.** Use patterns people already know (feed, search bar, profile, DMs) so nothing needs a tutorial — then give each the FishHaven flavor. Familiar bones, distinctive skin.
- **One obvious primary action per surface.** Never make a person hunt for the main move. Secondary actions recede (`.btn-ghost`, overflow).
- **You always know where you are.** Wayfinding via the dock-lamps (active glows gold) + the depth model — the *water itself* tells you public vs. community vs. family vs. private. Add a quiet breadcrumb at deeper zones.
- **Progressive disclosure.** Power features (faceted search, cross-community sharing, tag curation, owner dashboards) reveal when relevant; they never block or clutter the simple path. A kid never sees an admin control; a pastor finds the dashboard exactly when they look for it.
- **Forgiving by default.** Autosave drafts, undo on destructive moves, confirm only where truly irreversible (delete child, reject media). Optimistic UI with graceful rollback.
- **Search is a navigation primitive, not a feature** (§21) — from anywhere, one key gets you to anything you're allowed to see.

## 20. Feature-richness (what makes it productive for every group)

The surfaces below are the product's substance; design each as a first-class, considered experience — never a stub. Group by who it serves.

- **Everyone:** universal command-palette search (§21), followed tags/"currents," saved searches, a rich typed composer (post · prayer · verse · doodle · photo · event), reactions, connections graph + DMs, notifications (the bell), presence shoals, profile/identity.
- **Christian-native (the distinctive set):** the **scripture index** (cross-community verse graph, §21), a **prayer wall with answered-prayer tracking** (visible, celebrated), verse-of-the-day, lessons/PRAY-step classroom, resource library (studies, music, readings) with great tag-driven discovery.
- **Communities & families:** nested communities (harbors-within-harbors), **cross-sharing** (open a thread / sub-community / whole community to other waters), events + RSVP, the family/admin trust surfaces (consent, queue, export).
- **Owners / orgs (where "Community OS" lives):** member management, roles (owner/admin), a calm community dashboard (life, growth, prayer — *not* surveillance), moderation tools, cross-community relationships. Design these to feel like a *capable instrument,* the strongest argument for the adult band.
- **Gabriel (the AI helper), as connective tissue:** suggests tags (incl. scripture detection), summarizes a busy community ("here's what you missed"), surfaces relevant content and people, drafts gently, assists moderation. Always a guest (§4.6) — present where useful, never in the way. This is the seam into Micya AI.

## 21. Search & Tags — the productivity engine (must be excellent)

This is the spine of a graph product and the user's explicit priority. Design it to be **instant, forgiving, scoped, safe, and delightful.**

### 21.1 Concept — currents

A **tag is a current** — a thread of water connecting content across the whole harbor. Following a current means everything moving with it flows to you. **Search is how you cast into the water;** tags are the currents your catch rides in on. This metaphor is the entire visual/interaction language for discovery, and it's native to the subject.

### 21.2 Search experience

- **The command palette ("the Tide").** One universal entry from anywhere: press `/` or `⌘K`. It opens like surfacing — a calm water-light overlay, keyboard-first, debounced, **<100ms perceived.** This is the primary navigation of the product, not a buried feature.
- **Instant + forgiving.** Typo-tolerant and synonym-aware (`pg_trgm`), autocomplete as you type, recent + suggested queries on focus. "wrshp" finds worship; "songs for sad days" finds resources tagged `#lament` (semantic, §21.5 phase 2).
- **Faceted + scoped.** Tabs/facets across the typed graph: **All · People · Communities · Posts · Prayers · Events · Resources · Scripture · Tags.** Filter by community, tag, type, date, connection ("people I'm connected to"), and special facets like "answered prayers." Scope defaults to context (inside a community → that community first) and can widen to the whole harbor.
- **Typed results, right primitive.** A person renders as avatar + their shoal; a community as a harbor card with life; a scripture hit as a verse card; a post as a post-card preview; a tag as a current you can follow. Never a flat undifferentiated list.
- **Saved searches & followed tags = "currents you're riding."** Pin to the dock; get notified on new matches. Following a tag = a little fish swims into your sidebar (§18 moment).
- **Empty / zero results are directive,** never dead ends: suggest adjacent currents, broaden scope, or offer to create the thing ("Start a #lament prayer").

### 21.3 Tag system

- **Tag types (typed, color/icon-coded):** topic (`#worship`, `#baptism`), format/kind, **scripture references** (auto-detected, §21.4), community, people/mentions, feeling/season (`#advent`, `#lament`, `#gratitude`). Each type renders with a consistent chip treatment so people learn the vocabulary.
- **How things get tagged (three sources, layered):** (1) the author tags freely; (2) **Gabriel suggests** tags + auto-detects scripture and topics; (3) communities curate **canonical** tags (so `#worship` / `#praise` / `#music` don't fragment). Canonicalization + synonyms keep currents from splintering.
- **Follow, trend, discover.** Follow any tag to ride its current. **Trending tags = "strong currents,"** visualized as faster-moving currents — per community and global, **age-scoped.** A tag page is a cross-community river of everything (you're allowed to see) moving with it.

### 21.4 Scripture as a native tag type (a signature feature)

Every verse reference (`Psalm 119:105`) is **auto-parsed into a tappable scripture tag** that links to *everything across every community* touching that passage — a living, social, cross-community Bible index. This is genuinely novel, deeply on-brand, and no secular app would build it. Render scripture hits as verse cards; a passage's page shows posts, prayers, resources, and lessons that reference it. Make this a headline capability of search.

### 21.5 Safety, privacy & the depth boundary (non-negotiable)

Search obeys the **depth model** (§6) exactly — *the water has the same boundaries whether you swim or search:*

- **Surface (depth 0)** content is broadly searchable. **Community shallows (1)** scoped to membership. **Deep / family (2)** and **private DMs / harbor (3)** are **never** indexed into shared search. You can only ever find what you're allowed to see.
- **Kid-safe search.** At the kid band, search and tags are constrained to age-appropriate, moderated content; results are filtered the same way the feed is. Tags can never be used to surface private, quarantined, or another family's content. Enforce at the query layer (RLS / depth-aware filters), not just the UI.
- Tags on kid content are moderated; quarantined media never appears in results until approved.

### 21.6 Technical seam (Supabase)

- **Postgres FTS:** `tsvector` columns + `websearch_to_tsquery`, per-entity search index (materialized where hot), ranked results.
- **Fuzzy / autocomplete:** `pg_trgm` for typo tolerance and as-you-type suggestions.
- **Semantic (phase 2):** `pgvector` embeddings for intent search ("songs for sad days"), Gabriel-assisted.
- **Tags:** normalized `tags` + join tables, canonical/synonym mapping, a **scripture-reference parser** that recognizes book/chapter/verse and normalizes (`Ps 119:105` = `Psalm 119:105`).
- **Depth-aware filtering** applied in every search query (membership + depth + age band) so privacy is enforced server-side. Debounce, paginate, cache; keep perceived latency sub-100ms.

### 21.7 Visual & interaction

- The palette is a **branded moment** (§18): surfacing animation, water-light, calm — not a generic gray modal.
- Tag chips reuse `.chip`, typed by color/icon; scripture chips get the verse treatment.
- Trending currents get subtle motion (faster current = hotter), reduced-motion safe.
- Keyboard-first throughout: arrow to navigate, enter to open, escape to dismiss, facet shortcuts.

## 22. Forks, updated

The Part-B ambition resolves two of §17's forks toward the bolder option: **§17.4 depth ambient → full** (the signature needs it), and the creative ceiling assumes **§17.1 age-adaptive single system** and **§17.3 gamification dialed by band.** §17.2 (body font) remains the one open, low-stakes choice. Everything else in §17 stands.

---

*Part A is the discipline; Part B is the ambition. Build both: a harbor that a 7-year-old and a pastor both find obvious on first try, with search and scripture-currents so good they become the reason people stay.*
