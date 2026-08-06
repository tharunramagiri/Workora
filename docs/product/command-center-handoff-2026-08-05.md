# Workora Command Center — Executor Handoff Package

Prepared: 2026-08-05
For: the coding agent (Claude Code / Codex) that will build the Command Center
Spec source: `/home/tarun/research/workora-command-center-plan.md` (CEO plan)
Scope: Phase 1 buildable now; Phases 2-5 sequenced after.

**Status update (2026-08-06):** Phases 1–5 are now BUILT and verified live
against the real backend. Phase 2 (tasks + briefs loop with verifier gate),
Phase 3 (deliverables gallery), Phase 4 (role system + Hyperagent skill import,
`npm run seed:hyperagent`), Phase 5 (fleet control: autonomy tiers, kill
switch, budget-guard volume) + cross-agent audit. See
`docs/product/deep-audit-2026-08-06.md` for the methodology audit (looper,
loop/fleet/goal/graph-engineering, gstack, qm) mapped to Workora's roadmap.

---

## 1. What we're building

**Vision:** `office.ramagiritharun.in` becomes a command center — open it, see the
whole company live: who's working, what's shipping, what's blocked. Brief once,
agents ship forever, every deliverable is a live link. Hyperagent experience,
self-hosted, zero per-task fees.

**Design language (matches hyperagent + Buzz quality):**
- Dark theme + `#f97316` orange accent
- Lottie avatars for agents
- Command center: agent roster grid with live status dots (🟢 working / 🟡 thinking / 🔴 blocked/offline), company pulse, activity feed
- Agent detail: role card + live execution trace (watch them work) + deliverables
- Kanban task board + deliverables gallery (stays-alive links)
- Brief composer: type a brief → auto-routes to the right agents

---

## 2. Architecture (thin, reuses existing infra)

```
┌─ Command Center (NEW) ────────────────────────────────┐
│ Next.js (App Router) + Tailwind + shadcn/ui           │
│ Dark theme + #f97316 + Lottie avatars                 │
│                                                       │
│  Roster grid │ Agent detail │ Kanban │ Brief composer │
└──────────────┬────────────────────────────────────────┘
               │ thin API + SSE
┌──────────────▼────────────────────────────────────────┐
│ Existing Workora (office.ramagiritharun.in)           │
│  · REST /api/* (agents, machines, tasks, channels)    │
│  · daemon WS (agent lifecycle, live activity)         │
│  · existing auth (JWT + x-server-id)                  │
└───────────────────────────────────────────────────────┘
```

**Key decisions:**
- **Thin API over the existing daemon** — do NOT reimplement agent logic. The
  Command Center calls the existing `/api/*` endpoints and subscribes to the same
  realtime events the current web app uses.
- **SSE for live traces** — the existing app uses socket.io for realtime. For the
  Command Center, use an SSE endpoint (or reuse socket.io) that streams agent
  activity (`agent_activity_log` rows, activity status changes). Simplest first:
  poll the existing activity endpoints + add an SSE route on the existing server.
- **Deploy on Dokploy, same project** — add a second container/service in the
  same Dokploy app or a sibling app pointing at the same Postgres. The Command
  Center is a separate frontend that calls the same backend.

---

## 3. Data surface (what exists to build on)

From the current Workora codebase:

| Need | Existing endpoint / source |
|---|---|
| Agent roster | `GET /api/agents` → id, name, status, activity, runtime, machineId |
| Machine/status | `GET /api/servers/:id/machines` → online/offline, runtimes |
| Live activity | `agent_activity_log` table + socket.io events (`activity` statuses: online/working/thinking/offline) |
| Task board | `GET /api/tasks/server`, `GET /api/tasks/channel/:id` → open/claimed/done |
| Deliverables | Projects (`/api/projects`) + branch channels; the diff panel (new) surfaces agent file changes |
| Briefs | Create tasks via `POST /api/tasks/channel/:id` or `POST /api/messages` with @mention |
| Agent role/skills | `personality.md` (role) + `/api/skills` (assigned skill badges) |
| Knowledge | `/api/knowledge` |

**Auth:** reuse the existing JWT (`Workora.token` in localStorage) + `x-server-id`
header. The Command Center's API routes proxy to the existing backend with the
user's token — do not create a second auth system.

---

## 4. Phase 1 spec (build this first, 3-4 days)

**Goal:** a visible win — the command center shell with a live agent roster.

### 4.1 Pages / routes
- `/` — Command Center home: company pulse + agent roster grid + activity feed
- `/agent/[id]` — agent detail: role card + live trace + deliverables (Phase 3 fills trace)

### 4.2 Roster grid (the centerpiece)
Each agent card shows:
- Lottie avatar (or generated avatar fallback)
- name + displayName
- status dot: 🟢 working (activity=working/active) / 🟡 thinking (activity=thinking) / 🔴 offline (inactive/offline) / ⚪ sleeping
- runtime badge (claude/codex/opencode/...)
- assigned skills (badges from `/api/skills` — this is the hyperagent "what can this agent do" layer)
- last activity timestamp

Grid updates **live** — subscribe to the same activity events the current app
uses (socket.io) or poll `/api/agents` every 3-5s as a v1 fallback. Live dots are
the "wow" moment; polling is acceptable to ship first.

### 4.3 Company pulse (top bar)
- total agents, agents working now, agents offline
- open tasks count, blocked count
- machines online count

### 4.4 Activity feed (right rail)
- chronological stream of agent status changes + task claims + deliverables
- newest first, auto-appends live

### 4.5 Design tokens (lock these first)

**Updated 2026-08-05 to the Hyperagent design language** (matches
`hyperagent.com/threads/new` + `hyperbrowserai/ui-components`; verified live in a
browser): pure black surfaces, Geist type, near-white/gray text, blue accents.

```css
:root {
  --background: #000000;            /* surface.base */
  --surface: #0D0D0D;               /* surface.muted ≈ lab(2.48 0 0) */
  --surface-strong: #0a1628;        /* surface.strong (dark navy) */
  --foreground: #EBEBEB;            /* text.primary ≈ lab(93.04 0 0) */
  --muted-foreground: #A4A4A4;      /* text.secondary ≈ lab(67.52 0 0) */
  --tertiary: #b2d0fa;              /* text.tertiary */
  --primary: #2e63e8;               /* hyperagent blue */
  --primary-soft: rgba(46, 99, 232, 0.12);
  --border: rgba(58, 58, 58, 0.5);  /* border.default ≈ lab(24.6 0 0 / 0.5) */
  --border-strong: rgba(255, 255, 255, 0.1);
  --ok: #00d5a6; --warn: #ffb527; --err: #f94144; /* status dots */
}
```

Typography: Geist (body + display, `geist/font/sans`), base 16px/24px line.
Radius scale: 6/8/12/pill. Spacing: 4px base. Motion: 150/200ms. Sidebar
navigation mirrors Hyperagent (logo, primary action, Agents + Resources).

---

## 5. Phase 2-5 summaries (sequence after Phase 1)

- **Phase 2 — tasks + briefs loop (3-4d):** kanban board (open/claimed/done from
  existing tasks API), brief composer → routes to right agents by role/skill
  (@mention), task cards link to channels.
- **Phase 3 — transparent execution + deliverables (3-4d):** agent detail live
  execution trace (SSE/socket of activity log), deliverables gallery (projects,
  branches, diff panel links — "stays-alive links").
- **Phase 4 — role system + skill badges (2-3d):** import the hyperagent public
  skill library (see §6), map skills onto agents, render as visible badges.
- **Phase 5 — polish + approval gates (2-3d):** motion polish, Lottie avatars,
  approval-gate UI for risky agent actions (reuse existing action-card pattern).

---

## 6. Skill library reference (the hyperagent "secret")

The plan's core insight: hyperagent publicly publishes its skill library; we
import those skills and badge them onto agents. Reference:

- **Repo:** `alexmcdonnell-airtable/hyperagent-public-skills` (public, ~12-15 JSON
  skill packs from the Hyperagent/Airtable team)
- **Docs:** `hyperagent.com/docs/concepts/skills` — explains global skills vs
  team skills
- **Format:** each skill is a portable JSON package (identity + instructions +
  workflow) that an agent loads at runtime — we can adapt these into Workora
  skill marketplace entries (our skills are SKILL.md files, assignable per agent)

**Plan for import (Phase 4):**
1. Clone the hyperagent-public-skills repo
2. Convert each JSON skill → Workora `POST /api/skills` entry (name, description, content)
3. Assign to the 10 agents by role (CTO → code-review/security skills, MarketingAI → content skills, etc.)
4. Render assigned skills as badges on roster cards + agent detail

Known skill themes in the library (verify exact list on clone): Airtable kanban
management, video/trailer production, API exploration, file conversion, data
connections, context building, media generation. Adapt the ones that fit Workora's
10 agents; skip the rest.

---

## 7. Deploy checklist (Dokploy, same project) — verified build path

**Prereqs (done):**
- VPS online + healthy (`/health` 200) — verified 2026-08-05
- Repo pushed (`fix-dokploy` = `main` = `72706fa`)
- **Build path verified**: `npm ci` (111 pkgs) → `npm run typecheck` → `npm test` (9/9) → `npm run build` all green from a clean `node_modules` — exactly what the Dockerfile runs
- `Dockerfile` (multi-stage, `WORKORA_API` build arg, port 3001) + `command-center/README.md` in the repo

**Steps (needs your Dokploy login — the only user-dependent step left for the Command Center):**
1. In Dokploy, open the existing Workora app → **Add service / new service** (or a sibling project):
   - Source: GitHub repo `tharunramagiri/Workora`, branch `main`, **root path** `command-center/`
   - Build: the repo's `command-center/Dockerfile` (Dokploy detects it), or the compose `build.args` with `WORKORA_API=https://office.ramagiritharun.in`
   - Port: **3001**; health check optional
2. Domain: `cc.ramagiritharun.in` (or `office.ramagiritharun.in/cc`) with HTTPS (Traefik auto-certs).
3. Smoke test after deploy:
   - `https://cc.ramagiritharun.in/` → sign in at office.ramagiritharun.in first (JWT is shared), then the roster/pulse/feed render
   - `/tasks` → compose a brief → a task appears with `@mention` routing
   - `/deliverables`, `/roles`, `/fleet`, `/audit` all load
4. Optional: run `npm run seed:hyperagent` on the backend once to import the Hyperagent skill library (idempotent).

**Guardrails (do not remove):**
- money/payment gates stay on the existing backend
- deploy only via Dokploy (no new infra) — the unmanaged-docker path was deliberately NOT taken
- brand rules (Workora name/colors) enforced

---

## 8. Definition of done for Phase 1

- [ ] Dark theme + `#f97316` accent applied site-wide
- [ ] Roster grid renders all agents with live status dots (working/thinking/offline/sleeping)
- [ ] Company pulse bar shows working/total/offline + task counts
- [ ] Activity feed streams agent status changes live
- [ ] Agent detail page shows role card + skill badges (from existing data)
- [ ] Typecheck + build green; deployed on Dokploy; verified in browser
- [ ] Guardrails intact (no auth bypass, no new payment surface)

---

## 9. Handoff to executor

Give the executor agent:
1. This file as the spec
2. The repo (`/Users/ramagiritharun/.jcode/scratch/workora-repo` or the git remote)
3. The existing codebase docs: `docs/authorization.md`, `ARCHITECTURE.md`, `web/src/store.tsx` (API patterns), `web/src/views/` (existing views to match)
4. Access to the running backend for live testing (once VPS is back)

**Recommended:** start with Phase 1 only. It is self-contained and delivers the
visible "command center" win in 3 days. Phases 2-5 build on it.
