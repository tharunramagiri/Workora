# Workora Deep Audit — Loop, Fleet, Goal, Graph & Team-of-Agents Engineering

Prepared: 2026-08-06
Scope: audit Workora's agent orchestration against seven public methodologies,
then apply the highest-value patterns to the Command Center roadmap.

## 1. Methodology sources studied

| Repo | Stars | Core idea |
|---|---|---|
| `nexu-io/looper` | 98 | An autonomous dev team: **planner → reviewer ⇄ fixer → worker**, each looping against its own success criteria until an explicit exit condition holds. The forge (issues/PRs/labels) is the source of truth; worktrees make runs parallel-safe. |
| `cobusgreyling/loop-engineering` | 9.9k | Five building blocks: **automation/scheduling, worktrees, skills, plugins/connectors (MCP), sub-agents (maker/checker split)** + durable memory. Phased autonomy **L1 report → L2 assisted → L3 unattended**. Loop Ready score, budgets, denylists. |
| `cobusgreyling/goal-engineering` | 37 | A **goal** is a bounded objective with a *verifiable completion condition*: objective + separate verifier (implementer never grades its own homework) + state + budget. `Prompt = one turn · Loop = recurring · Goal = run until done`. |
| `cobusgreyling/fleet-engineering` | 30 | Governed population: **registry, identity/credentials, permissions, inbox/HITL, observability/audit, economics (budgets), sovereign control (kill switch)**. Accountability test: *which agent did it, with what authority, against what task, evidenced by what?* |
| `cobusgreyling/graph-engineering` | 3 | Control flow you can see: nodes are plain functions, edges fixed/conditional, retry loops explicit, Mermaid/ASCII rendered, `max_steps` guard, `validate()` reachability. |
| `garrytan/gstack` | 127k | A team of specialist agents behind slash commands: CEO (`/plan-ceo-review`), Eng Manager (`/plan-eng-review`, `/review`), Designer (`/plan-design-review`, `/design-review`), QA (`/qa`), Security (`/cso`), Release (`/ship`, `/land-and-deploy`), Docs. Sprint: **Think → Plan → Build → Review → Test → Ship → Reflect**. Safety: `/careful`, `/freeze`, `/guard`. |
| `yc-software/qm` | 11.9k | Multiplayer agent harness: per-person/per-room **scoped memory, files, keychain, permissions, crons, sandbox**; small fixed tool surface with one `execute` tool; security postures (Strict / Auto / Dangerous) + a predeclared command policy; admin-gated skills; background crons. |

## 2. Workora current state (evidence)

| Capability | Workora today | File / endpoint |
|---|---|---|
| Agents (registry) | `agents` table; status/activity/runtime/model; soft-delete | `GET /api/agents`, `src/server/routes-api/agents.ts` |
| Identity | per-agent token hashes; machine API keys | `agentTokenHash`, `apiKeyHash` |
| Permissions | capability gates (`manageAgents`, `manageMachines`) | `src/server/capabilities.ts` |
| Execution safety | daemon command **deny-list** (no `rm -rf /`, `curl|sh`, reverse shells); project-directory allowlist | `src/daemon/` |
| Activity / observability | `agent_activity_log` (tool_start/thinking/working/deliverable) | `GET /api/agents/:id/activity-log` |
| Tasks (as messages) | messages with `taskStatus` todo/in_progress/in_review/done/closed; claim/status PATCH | `src/server/routes-api/tasks.ts` |
| Skills | skill marketplace; packs (spec/tickets/implement/tdd/review/handoff/triage); per-agent assignment | `GET /api/skills`, `src/server/routes-api/skills.ts` |
| Scheduling | cron reminders | `src/server/reminders.ts` |
| Human-in-the-loop | action cards (prepared → executed) | web views |
| Command Center (new) | roster grid + live dots, pulse, activity feed, agent trace, Hyperagent design | `command-center/` |

**Gaps versus the methodologies:**

1. **No success criteria / verifier.** Tasks are status fields, not goals. Nothing enforces "the implementer did not grade its own homework." A task can be marked `done` with no check. *(goal-engineering: verifier primitive; looper: worker exit condition; gstack: /review gate.)*
2. **No explicit loop model.** The daemon responds to messages; there is no per-run control flow (plan → implement → verify → retry) and no visible graph of it. *(graph-engineering; looper's four loops.)*
3. **No fleet economics / sovereign control.** No per-agent token budget, no fleet kill switch, no cost attribution. *(fleet-engineering: economics + sovereign control.)*
4. **No cross-agent audit search.** Activity logs are per-agent; "which agent did it, with what authority, against what task" is not answerable in one query. *(fleet-engineering: observability/audit; qm: audit trail.)*
5. **No security posture per agent.** executionMode is auto/fast; there is no Strict (approve-every-tool) / Auto (classifier) / Dangerous posture. *(qm: security postures; looper/gstack: safety gates.)*
6. **No shared inbox / HITL fleet-wide.** Approvals exist per action card but not as a fleet inbox. *(fleet-engineering: inbox/escalation.)*

## 3. Application to the Command Center roadmap

The CEO plan's phases already track these methodologies. This audit sharpens them:

### Phase 2 — Tasks + briefs loop (build next; this session implements it)
- **Brief composer → goal, not message.** Compose a brief; each line becomes a task with `@mention` routing (existing `POST /api/messages` with `asTask` — mentions parsed server-side). This is looper's "start from an issue, not a prompt" and goal-engineering's "one sentence + done condition".
- **Kanban board** from the real tasks API with claim + status transitions — looper's forge-as-source-of-truth, surfaced in the Command Center.

### Phase 3 — Transparent execution + deliverables (graph view is partially in this session)
- **Run graph**: render each agent's activity log as a control-flow graph (forward edges + retry loops), not just a linear log — graph-engineering's "control flow you can see". Implemented this session as a compact run-map strip on the agent detail page.
- **Assigned work block**: each agent card shows its open tasks + statuses — goal-engineering's per-agent objectives.

### Phase 4 — Role system + skill badges
- **Skill badges already exist** (`/api/skills` assignedTo). Extend into looper-style roles: planner / reviewer / fixer / worker as assignable skill packs (planner loops until spec reviewable; reviewer until clean; fixer until threads resolved; worker until checks pass). The existing spec/tickets/implement/tdd/review/handoff/triage packs map 1:1.

### Phase 5 — Polish + approval gates
- **Fleet control**: per-agent autonomy tier (L1 report / L2 assisted / L3 unattended) as a first-class field, with a fleet-level kill switch in the Command Center. *(loop-engineering autonomy levels; fleet-engineering sovereign control.)*
- **Security posture** per agent (Strict/Auto/Dangerous) mapping to existing executionMode. *(qm.)*
- **Verifier gate on done**: a task reaches `done` only when a separate check (review skill, tests green, or human confirm) passes — implementer must not grade its own homework. *(goal-engineering verifier.)*

### Standing (not Command Center)
- **Fleet budget guard**: per-agent token caps + cost attribution surfaced in the pulse. *(fleet-engineering economics.)*
- **Cross-agent audit search**: one endpoint answering "which agent did it, with what authority, against what task" across all activity logs. *(fleet-engineering audit.)*

## 4. What this session ships

1. `docs/product/deep-audit-2026-08-06.md` (this file) — the audit.
2. **Command Center Phase 2**: `/tasks` kanban (real tasks, claim + status moves, channel links) + brief composer (channel picker, `@mention` routing, `asTask` creation). Verified live against the real API.
3. **Run graph + assigned work** on agent detail (Phase 3 seeds). Verified live.
4. Handoff doc updated: Phase 2 spec refined with the methodology mapping.

## 5. Definition of done for this session

- [x] Deep audit written with file/endpoint evidence per gap
- [x] `/tasks` renders real tasks in status columns
- [x] Composer creates real tasks via the real API (verified)
- [x] Status transitions + claim work via the real API (verified)
- [x] Agent detail shows run graph + assigned work
- [x] Typecheck + unit tests + `next build` green; committed + pushed
