# Workora improvement study — agent soul, memory, skills, and channels

Date: 2026-08-03
Status: implementation-ready plan
Method: read + synthesized 11 referenced projects, mapped each to concrete Workora gaps, and identified the highest-value tractable builds already grounded in Workora's existing schema/infra.

## 1. What the referenced projects are

| Project | What it is | Relevance to Workora |
|---|---|---|
| **qm** (yc-software/qm) | Multiplayer agent harness: per-person/per-room scoped memory+files+keychain, command policy, crons/watches, skill grants, security postures (strict/auto/dangerous) | Directly relevant. Workora shares the same mental model (agents-as-employees, channels, skills). Borrow: knowledge base, command policy, background crons, skill provenance |
| **ruflo** (ruvnet/ruflo) | Meta-harness: swarms, self-learning memory, federation, 100+ agents | Relevant concepts: structured/self-learning memory; swarm coordination patterns Workora can borrow without adopting ruflo |
| **aihero.dev/skills + mattpocock/skills** | 21 MIT process skills: grill→spec→tickets→implement→tdd→review; handoff, triage, wayfinder, research | Highly relevant. Workora's skill marketplace needs curated process packs, not just capability one-offs |
| **happy** (slopus/happy) | Mobile/web client for Claude/Codex with E2E encryption, push, device switching | Future: mobile client + notifications for Workora. Not this iteration |
| **screenpipe** | 24/7 screen/mic/keyboard recording for full-context AI | Privacy-heavy, self-hosted optional daemon feature. Defer |
| **owpenbot** | WhatsApp + Telegram bridge to opencode | Future: chat-app bridge for Workora agents (Waora is already a WhatsApp engine — natural fit). Defer |
| **openwork / openwork-hub** | Open-source Claude Cowork alt; hub for agents/skills/commands/plugins | Relevant pattern: skills/agents/commands/plugins as vendorable assets. Workora's marketplace is the analog |
| **agent-rules-books** | AGENTS.md rules distilled from Clean Code, DDD, DDIA, Refactoring | Highly relevant: curate book-derived rule packs as installable skills |
| **LobsterAI** | All-in-one assistant: Cowork mode (supervised tool execution), skills, scheduled tasks, multi-channel | Workora already has action cards (Cowork analog) + reminders. Borrow: richer built-in skill set |
| **memmy-agent** | One shared memory across all AI agents; structured memory engine; history onboarding | Highly relevant: shared knowledge base + structured memory is Workora's biggest gap |

## 2. What Workora already has (grounded in code)

- Per-agent persistent workspace with `MEMORY.md` index + `notes/` detail files (`src/daemon/memory.ts`, `prompt.ts`)
- `personality.md` read/write/delete per agent, editable in web UI (`routes-api/agents.ts`, `Members.tsx`)
- Skill marketplace: publish/list/assign/unassign, materializes SKILL.md into the agent's provider skills dir (`routes-api/skills.ts`, `Skills.tsx`)
- 15 permission scopes including `knowledge:read` (`src/server/scopes.ts`)
- Human-gated action cards (channel:create / agent:create) — the "Cowork mode" analog
- Reminders with optional recurrence field, tasks, projects, branch channels
- Multiple runtimes (claude, codex, copilot, opencode, kimi, pi, cursor, hermes)

## 3. Confirmed gaps (with evidence)

1. **Knowledge base is declared but not implemented.** `knowledge` table exists in `src/db/schema.ts` (serverId, agentId, title, content, searchText) and `knowledge:read` is a scope — but there are **zero routes** (`grep schema.knowledge src/` → no hits). "Fetch topics from the agent knowledge base" is a scope with no backing API. This is the single biggest "agent memory" gap.
2. **No default soul template.** Agents start with an empty personality unless the human uploads one. No seed voice/values/boundaries template.
3. **Skill marketplace has no curated packs.** Publishing works, but there's no starter library. The skills that made mattpocock/gstack famous (spec→tickets→implement→review, handoff, triage) are absent.
4. **No command policy.** qm's "predeclared command policy" (hard denials for destructive ops) has no Workora analog. The daemon's `git:test` path accepts a shell command string; the recent security fix added length caps but no deny-list.
5. **No cross-agent shared memory / knowledge write path.** Agents can only write their own MEMORY.md; there's no team knowledge base to store durable facts with searchText.

## 4. Prioritized build plan

### P0 — Knowledge base API (agent memory, real)
Wire the existing `knowledge` table:
- Human API: `GET /api/knowledge` (server-scoped, optional `agentId` filter), `POST /api/knowledge` (title+content+searchText)
- Agent API: `POST /agent-api/knowledge` (agent writes durable team knowledge; gated by `knowledge:read`/write), `GET /agent-api/knowledge` (agent reads server knowledge)
- Prompt: teach agents to write decisions/facts to the knowledge base, not just MEMORY.md

### P1 — Agent soul template
- Seed a default `personality.md` on first start (voice, values, boundaries, work style) when the human hasn't set one
- Surface "soul" in the web UI agent profile (already renders personality.md)

### P2 — Curated skill packs (marketplace starter library)
- Seed MIT-licensed process skills: `spec`, `tickets`, `implement`, `tdd`, `review`, `handoff`, `triage`
- Book-derived rule pack: `clean-code` (mini rules from agent-rules-books distilled)
- Seed on fresh install + a `db:seed-skills` script for existing installs

### P3 — Command policy (defense in depth)
- Deny-list for the daemon's `git:test` shell path: block `rm -rf /`, `mkfs`, `dd if=`, `curl|sh`-style pipes, credential exfil patterns
- Return a clear "command denied by policy" error instead of executing

### P4 — Background crons (qm borrow)
- Extend reminders' existing `recurrence` field into full crons (interval already stored; add dispatch loop + UI)

### Deferred (documented, not this iteration)
- Mobile client + push (happy), WhatsApp/Telegram bridge (owpenbot/Waora), screen capture (screenpipe), ruflo-style swarm UI

## 5. Implementation order for this session

1. `src/server/routes-api/knowledge.ts` + register in `index.ts` + agent route in `routes-agent.ts`
2. Default soul seed in `agentManager.ts` first-start path
3. `scripts/seed-skills.ts` with the curated pack + `package.json` script
4. Command deny-list in `src/daemon/gitOps.ts` (runProjectTests path)
5. Validate: typecheck, unit tests (memory/agentManager), web build, live verify knowledge API + skill seed
