# FishHaven × Micya — Foundation Roadmap (North Star)

**Date:** 2026-06-14
**Status:** Approved direction; sub-projects specced individually as their turn comes.

## Naming

The product formerly called "Haven Kids" is now **FishHaven** — a community
platform for **every Christian**: individuals, families, and communities, all
ages, kids included (the fish/Ichthys motif). It is not a kids-only app; the
children's experience is one safe mode within a general platform. The broader
knowledge-platform architecture it is growing into is the **Micya AI Community
Operating System** (see `external.txt`) — which was always a general community
OS, so the all-ages positioning aligns FishHaven with it rather than straining
it. "FishHaven" is the brand/app; "Micya" is the underlying community-OS
architecture. Code, UI, and copy are rebranded Haven Kids → FishHaven (all-ages
framing) as part of sub-project F1.

## What this document is

`external.txt` describes a multi-year, multi-subsystem platform vision (an
entity-centric knowledge graph, a knowledge-refinery pipeline, hybrid retrieval,
community digital twins, insight/wisdom layers). That is far too large for one
spec. This roadmap decomposes it into independently-buildable sub-projects with
an explicit dependency order, so each can be specced and shipped on its own while
staying compatible with the whole.

It is the **north star**, not an implementation plan. Each sub-project below gets
its own `YYYY-MM-DD-<name>-design.md` spec when it is next in line.

## Guiding principle: Postgres-first, infra-on-demand

The Micya spec names Neo4j, Kafka, Typesense, Redis, and S3. **None of these are
day-one foundations.** Supabase Postgres carries the entire foundation:

| Need | Start simple (now) | Graduate to (trigger) |
|---|---|---|
| Vectors | `pgvector` | dedicated vector store (only if pgvector throughput caps) |
| Keyword search | Postgres FTS (`tsvector`) | Typesense/Meilisearch (when ranking/typo-tolerance demands) |
| Graph traversal | recursive CTEs over a `relationships` table | Neo4j (when multi-hop traversal latency caps) |
| Events | Postgres `LISTEN/NOTIFY` + Edge Functions | Kafka (when fan-out/throughput demands) |
| Hot cache | Postgres + HTTP caching | Redis (when read latency demands) |
| Blob storage | Supabase Storage | S3 (when volume/cost demands) |

Each graduation is a measured swap behind a stable interface — never a premature
day-one dependency.

## Sub-projects

### Foundation tier

**F1 — Identity & Entity Foundation** *(first; dependency root)*
- Person entity = **profiles** (`kind = adult | child`) under one **account**.
- Account = one login owning 1..N profiles. Solo adult = account of one (the
  common case); family = account with child profiles (the `Family` scope).
- Multi-profile UX: owner logs in (Google / email magic-link) → profile picker
  (auto-skipped when there's only one profile) → optional per-profile PIN →
  in-app as the active profile (kid-safe mode when `kind=child`).
- Admin/guardian zone (manage profiles, dashboard, strikes/moderation) is
  PIN-locked whenever the account has any child profile. The owner is *also* a
  usable adult profile.
- Auth hardening / audit fixes: remove the always-on demo login; add the missing
  `log_activity` / `my_activity` RPCs; persist strikes & moderation; remove
  `allowDangerousEmailAccountLinking`; add security headers + rate limiting; add
  ESLint.
- Rebrand Haven Kids → FishHaven (all-ages framing).
- Tables are concrete (`accounts`, `people`, `activity`, `strikes`) but
  designed **entity-aware** so F2 generalizes them without a rewrite.

**F2 — Entity & Relationship Core** *(the knowledge-layer spine)*
- Generalize F1's Person/Household into the full entity model: `entities`
  (Person, Organization, Community, Topic, Resource, Event, Project, Idea,
  Claim, Experience, Document) + a polymorphic `relationships` table
  (`member_of`, `created_by`, `references`, `supports`, `teaches`,
  `related_to`, `recommends`, `attends`, `follows`).
- Canonical entities with aliases; hierarchical taxonomy; AI-suggested ontology
  updates requiring admin approval. Pure Postgres.
- **Community governance:** the `member_of` relationship carries a **role**
  (`owner | admin | member`). Each community has exactly one **owner** and zero
  or more **admins**; both are `Person` profiles linked to the `Community`
  entity by a `member_of` edge with the corresponding role. Owner can transfer
  ownership and appoint/remove admins; admins manage membership and content.

**F3 — Permission Model** *(cross-cutting; precedes any AI retrieval)*
- The nine scopes (Public, Community, Group, Team, Family, Invite Only,
  Anonymous Public, AI Hidden, AI Excluded) as one reusable access layer
  enforced by Supabase RLS + app guards.
- Makes "permission-aware AI" physically real: the retrieval pipeline cannot
  return what the viewer cannot see. Depends on F1 + F2.
- **Role-based community powers:** the `member_of` role (owner/admin/member from
  F2) drives what each member can do within Community/Group/Team scopes —
  owner/admins can moderate, manage membership, post announcements, and adjust
  community visibility; members get standard participation. Enforced by the same
  RLS + app-guard layer.

### Content & AI tier

**C4 — Raw Content Layer** — posts / comments / messages / documents persisted
for real (today they are client-side mocks); the activity log; feedstock for
the refinery.

**C5 — Knowledge Refinery** — async LLM pipeline: extract entities → classify
topics → discover relationships → extract claims → embed → summarize. Begins as
a single Supabase Edge Function triggered on new content.

**C6 — Hybrid Retrieval** — Postgres FTS + pgvector + recursive-CTE graph
expansion → merge + rerank → **permission filter (F3)** → LLM answer. Powers
"Ask AI on every page."

**S1 — Social Graph & Messaging** *(Connections · Favourites · DMs; features
only — no look-and-feel in this roadmap)*
Depends on F1 (people), F2 (relationship types), F3 (permission scopes), C4
(messages = content). Realtime via Supabase Realtime / Postgres.
- **Connections (LinkedIn-style):** a `connected_to` relationship between two
  `Person`s via request → accept.
  - *Adults:* request → accept, freely.
  - *Kids:* a connection request is inactive until **both** children's parents
    approve it.
- **Favourites:** a private, one-way `favourites` relationship from a `Person`
  to any entity (post, person, community, resource). A personal bookmark/save;
  visible only to the owner. Available to adults and kids (favouriting content
  is contact-free, so low safety risk).
- **Direct Messages:** 1:1 (group later) messaging between connected people.
  - *Adults:* DM any accepted connection freely.
  - *Kids:* DM only **parent-approved** connections; every message passes
    content moderation (the existing strikes / kind-words system) and is
    **visible to the parent**. No unmonitored kid-to-kid messaging, ever.
- Mixed adult⇄kid contact follows the kid rules (parent approval + moderation).

**C7 — AI Memory & Community Digital Twins** — multi-level memory (community +
topic), the AI-generated community profile (beliefs, resources, influencers,
trends, FAQs, expertise, emerging topics).

**C8 — Insight & Wisdom Layers** — summaries, trends, recommendations,
contradiction detection, consensus patterns.

### Scale tier (deferred; trigger-based, never day one)

Redis hot cache, Kafka event bus, dedicated Neo4j, Typesense, S3 cold storage —
each swapped in only when a measured Postgres limit forces it, per the
graduation table above.

## Dependency order

```
F1 → F2 → F3 → C4 → S1 → C5 → C6 → C7 → C8
                         (scale tier woven in on demand)
```

S1 (Social Graph & Messaging) slots after C4 — it needs people (F1), relationship
types (F2), permission scopes (F3), and the content layer (C4), but is independent
of the AI tiers (C5–C8) and can be built in parallel with them.

## Mapping back to external.txt

| external.txt concept | Sub-project |
|---|---|
| Person / Family entities & scopes | F1 |
| Entity-centric architecture, relationships, ontology | F2 |
| Community governance (owner / admins / members) | F2 (roles) + F3 (powers) |
| Permission-aware AI; the nine permission scopes | F3 |
| Raw Layer (posts, comments, messages, documents) | C4 |
| Knowledge Refinery pipeline | C5 |
| Hybrid retrieval (keyword + vector + graph), Ask AI | C6 |
| Connections, favourites, direct messaging | S1 |
| Multi-level AI memory; community digital twins | C7 |
| Insight Layer, Wisdom Layer, contradiction detection | C8 |
| Redis / Kafka / Neo4j / Typesense / S3 | Scale tier |
