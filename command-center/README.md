# Workora Command Center

Phase 1 of the Command Center plan: a dark, live dashboard for the whole
company — agent roster with live status dots, company pulse, activity feed, and
an agent detail page with a live execution trace. Thin frontend over the
existing Workora backend; no new auth, no new infra.

## Design language

Styled to match Hyperagent (`hyperagent.com` / `hyperbrowserai/ui-components`):
pure black surfaces, Geist type, near-white/gray text with blue accents
(`#2e63e8` primary, `#b2d0fa` tertiary), 6/8/12/pill radius scale, subtle
shadows, 150–200ms motion. Sidebar navigation mirrors Hyperagent's dashboard
(logo, primary action, Agents + Resources sections). Tokens live in
`app/globals.css` (`:root`) and `tailwind.config.ts`.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3001
```

The Next dev server rewrites `/api/*` to the backend. Point it at a local
backend or the live site:

```bash
WORKORA_API=http://localhost:7777 npm run dev      # local backend
WORKORA_API=https://office.ramagiritharun.in npm run dev
```

Sign in at the backend first (JWT is shared via `localStorage["Workora.token"]`).
The workspace id is bootstrapped from `GET /api/servers` and remembered in
`localStorage["Workora.ccServerId"]`.

## What Phase 1 + 2 covers

- `/` — command center home: company pulse, live agent roster grid, activity feed
- `/tasks` — **briefs & tasks loop**: kanban (todo → in_progress → in_review →
  done → closed) over the real tasks API (claim + status moves) + a brief
  composer that creates tasks with `@mention` routing via the real messages API
  (`asTask`). Built from looper/goal-engineering methodology (see
  `docs/product/deep-audit-2026-08-06.md`).
- `/agent/[id]` — agent role card + skill badges + **run graph** (control-flow
  map of the activity log with retry loops) + assigned-work goals + live trace

Data sources (all existing endpoints):

| Surface | Endpoint |
|---|---|
| Roster + status dots | `GET /api/agents` (polled every 5s) |
| Machines | `GET /api/servers/:id/machines` |
| Pulse counts | aggregated from agents + machines + `GET /api/tasks/server` |
| Skill badges | `GET /api/skills` (`assignedTo` names) |
| Activity feed | per-agent `GET /api/agents/:id/activity-log` + status/task diffs |
| Agent trace | `GET /api/agents/:id/activity-log?limit=80` (polled every 4s) |

Live updates are polling-based for v1 (the plan explicitly allows this); the
upgrade path is socket.io (`agent:activity` events) which the backend already
emits — see the executor handoff doc (`docs/product/command-center-handoff-2026-08-05.md`).

## Deploy (Dokploy, second service)

1. Add a service in the same Dokploy project: source this repo, path `command-center/`.
2. Build: `docker build --build-arg WORKORA_API=https://office.ramagiritharun.in .`
   (or set the arg in the Dokploy build settings). The rewrites are baked at
   build time — changing the backend URL requires a rebuild.
3. Port: 3001. Domain: `cc.ramagiritharun.in` (or a path on the main domain).
4. Guardrails: no auth bypass (reuses the existing JWT), no new payment
   surface, deploy only via Dokploy.

## Quality gates

```bash
npm run typecheck   # tsc --noEmit
npm run build       # next build
npm test            # unit tests for feed logic
```
