# FishHaven × Micya — Foundation Roadmap (North Star)

**Date:** 2026-06-14
**Status:** Approved direction; sub-projects specced individually as their turn comes.

## Naming

The product formerly called "Haven Kids" is now **FishHaven** (a Christian kids
community platform; the fish/Ichthys motif). The broader knowledge-platform
architecture it is growing into is the **Micya AI Community Operating System**
(see `external.txt`). "FishHaven" is the brand/app; "Micya" is the underlying
community-OS architecture. Code, UI, and copy are rebranded Haven Kids →
FishHaven as part of sub-project F1.

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
- Person entity = **profiles** (parent + kids under one household).
- Family scope = **household** (one parent login owns N profiles).
- Multi-profile UX: parent logs in (Google / email magic-link) → profile picker
  → optional per-profile PIN → in-app as that profile.
- Parent zone (admin: manage profiles, dashboard, strikes/moderation) is always
  locked behind a parent credential. The parent is *also* a usable profile.
- Auth hardening / audit fixes: remove the always-on demo login; add the missing
  `log_activity` / `my_activity` RPCs; persist strikes & moderation; remove
  `allowDangerousEmailAccountLinking`; add security headers + rate limiting; add
  ESLint.
- Rebrand Haven Kids → FishHaven.
- Tables are concrete (`households`, `people`, `activity`, `strikes`) but
  designed **entity-aware** so F2 generalizes them without a rewrite.

**F2 — Entity & Relationship Core** *(the knowledge-layer spine)*
- Generalize F1's Person/Household into the full entity model: `entities`
  (Person, Organization, Community, Topic, Resource, Event, Project, Idea,
  Claim, Experience, Document) + a polymorphic `relationships` table
  (`member_of`, `created_by`, `references`, `supports`, `teaches`,
  `related_to`, `recommends`, `attends`, `follows`).
- Canonical entities with aliases; hierarchical taxonomy; AI-suggested ontology
  updates requiring admin approval. Pure Postgres.

**F3 — Permission Model** *(cross-cutting; precedes any AI retrieval)*
- The nine scopes (Public, Community, Group, Team, Family, Invite Only,
  Anonymous Public, AI Hidden, AI Excluded) as one reusable access layer
  enforced by Supabase RLS + app guards.
- Makes "permission-aware AI" physically real: the retrieval pipeline cannot
  return what the viewer cannot see. Depends on F1 + F2.

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
F1 → F2 → F3 → C4 → C5 → C6 → C7 → C8
                         (scale tier woven in on demand)
```

## Mapping back to external.txt

| external.txt concept | Sub-project |
|---|---|
| Person / Family entities & scopes | F1 |
| Entity-centric architecture, relationships, ontology | F2 |
| Permission-aware AI; the nine permission scopes | F3 |
| Raw Layer (posts, comments, messages, documents) | C4 |
| Knowledge Refinery pipeline | C5 |
| Hybrid retrieval (keyword + vector + graph), Ask AI | C6 |
| Multi-level AI memory; community digital twins | C7 |
| Insight Layer, Wisdom Layer, contradiction detection | C8 |
| Redis / Kafka / Neo4j / Typesense / S3 | Scale tier |
