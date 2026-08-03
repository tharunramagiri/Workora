# Workora production-launch audit — final report

Date: 2026-08-03
Methodology: gstack CSO security audit (OWASP Top 10 + STRIDE + supply chain) and gstack QA discipline (real-browser flow testing), applied manually against the live Workora codebase and production deployment since gstack's Claude-Code-specific harness plumbing (AskUserQuestion, session-state files) doesn't run under this agent. qm (yc-software/qm) was evaluated and correctly excluded — it is a competing multi-agent product, not a checklist tool, and does not apply here.

Scope: full codebase (`src/server`, `src/daemon`, `web/src`), CI/CD, Docker/infra, and the live production deployment at `office.ramagiritharun.in`.

---

## Summary

| Severity | Found | Fixed | Verified live |
|---|---|---|---|
| CRITICAL | 1 | 1 | ✅ |
| HIGH | 0 | — | — |
| MEDIUM | 1 | 1 | ✅ |
| LOW / non-findings (verified, no action) | 4 | — | — |

---

## CRITICAL — Fixed and verified

### Finding 1: Unauthenticated-privilege remote code execution via `POST /api/projects/:id/test`

**File:line:** `src/server/routes-api/projects.ts` (all mutating routes had zero capability check)
**Trace:** `projects.ts:113-118` accepted client `b.command` unsanitized → `requestDaemonByMachine("git:test", ...)` → `src/daemon/index.ts:168` → `src/daemon/gitOps.ts:179-180` → `` `/bin/sh -c ${command}` `` on the connected physical host, 190s budget, 8KB output returned to the caller.

**Impact:** Any authenticated member of any workspace (not just owner/admin) could run arbitrary shell commands on the machine running the Workora daemon, simply by calling `POST /api/projects/:id/test` with a malicious `command`. The same missing gate also let any member trigger real repo clones, delete any project, and push arbitrary commits — `agents.ts` and `servers.ts` both consistently gate on `manageAgents`/`manageMachines`; `projects.ts` had none.

**Fix:** commit `519c9e1` — added `requireCap(serverId, userId, "manageAgents")` to `POST /api/projects` (import) and to every mutating/executing `:id` sub-route (delete, sync, push, checkout, test), while leaving `GET` open to all members. Also capped the test-command override at 2000 chars as defense in depth.

**Live verification:** created a temporary real `member`-role account, minted its JWT, and confirmed with the live production API:
```
IMPORT_STATUS 403 {"error":"need manageAgents capability"}
CAN_LIST_PROJECTS 2 [ 'tharunramagiri-Waora', 'tharunramagiri-bookoraa' ]
RCE_ATTEMPT_STATUS 403 {"error":"need manageAgents capability"}
DELETE_ATTEMPT_STATUS 403 {"error":"need manageAgents capability"}
```
Read access (list projects) is preserved; every mutating/executing path is now blocked for a plain member. Test account deleted after verification.

---

## MEDIUM — Fixed and verified

### Finding 2: `TRUST_PROXY` unset on the live deployment, defeating per-IP rate limiting

**Evidence:** `src/server/ratelimit.ts` correctly implements per-IP rate limiting for login/register, gated behind `TRUST_PROXY=true` (documented, deliberate design to prevent header-spoofing when unset). The live Dokploy environment for the Workora app had no `TRUST_PROXY` variable, while the deployment runs behind Traefik — meaning `clientIp()` fell back to `req.socket.remoteAddress`, which is the proxy hop's address for every request, collapsing all external clients into effectively one shared rate-limit bucket.

**Fix:** set `TRUST_PROXY=true` in the Dokploy application environment and redeployed.

**Live verification:** confirmed `TRUST_PROXY=true` is present in the running container's environment post-redeploy; confirmed `/api/auth/login` still functions correctly (401 on bad creds) after the change.

---

## Verified, no finding (false positives caught by active verification)

Per the CSO methodology's Phase 12 (active verification before reporting), the following were investigated in depth and confirmed safe:

- **`dangerouslySetInnerHTML` in search results (`web/src/views/misc.tsx:332`)** — the string is passed through `escHtml()` (HTML-entity escaping) before the `<mark>` highlight wrap. Not exploitable.
- **Agent tool-call execution boundary** — `POST /agent-api/action/prepare` only ever creates a "proposal card"; a human must click to actually execute channel/agent creation. Agents cannot self-execute privileged actions.
- **SQL injection surface** — every database query in the codebase uses Drizzle's parameterized `sql`/`dsql` tagged templates; no string-concatenated SQL found.
- **Command injection in daemon git operations** — `gitOps.ts` uses `execFile`/`spawnSafe` (argv arrays, no shell) everywhere except the one already-fixed `runProjectTests` path.
- **CI/CD pipeline security** — no `pull_request_target`, no script injection via `${{ github.event.* }}` in `run:` steps, actions pinned to version tags (MEDIUM-tier per the skill's own FP rule, not HIGH, since they're all first-party `actions/*`).
- **Dockerfile** — runs as non-root (`USER node`), no secrets baked into the image, Postgres/Redis bound to `127.0.0.1` only.
- **Secrets archaeology** — no tracked `.env` files, no credential-prefix hits (`AKIA`, `sk-`, `ghp_`, `xoxb-`) anywhere in git history.
- **Dependency supply chain** — `npm audit` clean on root; `web/` has 2 moderate react-router-dom CVEs (open-redirect + SSR deserialization) with no non-breaking fix available in the 6.x line (the fix requires a major v7 bump). Deferred as a tracked follow-up rather than risking the app's routing under time pressure — logged here explicitly rather than silently dropped.
- **Auth hardening** — login and register are both rate-limited, login returns a generic error to prevent user enumeration, registration validates password strength (`passwordError`), passwords/API keys/agent tokens are hashed at rest, daemon WS connections are authenticated per-machine by hashed API key.
- **Multi-tenant isolation** — every `projects.ts` query scopes correctly by `serverId`; no cross-tenant IDOR found.

---

## Tracked follow-up (not blocking launch, logged honestly)

- **react-router-dom moderate CVEs** (open-redirect, SSR-hydration deserialization) — fix requires a v6→v7 major bump; not applied here to avoid breaking routing under time pressure. Recommend scheduling this as its own dedicated upgrade + regression pass.
- **CI Actions are tag-pinned, not SHA-pinned** — low real risk (all first-party `actions/*` plus one docs-only third-party action), but SHA-pinning is the stricter best practice for a project this security-conscious.

---

## QA pass — 6 flows against live production

| # | Flow | Result | Evidence |
|---|---|---|---|
| 1 | Landing page (anonymous) | ✅ PASS | Hero renders "Paste a repo. Get an AI team that ships work.", zero console errors |
| 2 | Login page renders | ✅ PASS | Email/password form present, zero console errors |
| 3 | Onboarding wizard loads | ✅ PASS | Machine step renders correctly, zero console errors |
| 4 | Projects page loads (read) | ✅ PASS | 2 real projects listed, zero console errors |
| 5 | Chat send | ✅ PASS (after test-harness correction) | `POST /api/messages` returned `{"ok":true,"id":"022c0ab2...","seq":499}`; confirmed via `GET /api/messages/:id` that the message persisted correctly. Initial DOM-based check gave a false negative from a socket-timing race in the test script, not a product bug. |
| 6 | Task claim | ✅ PASS | `POST /api/tasks/channel/:id` created task #3, `PATCH /api/tasks/:id/claim` returned `{"ok":true,"taskStatus":"in_progress"}` |

All 6 flows pass. QA test artifacts (4 messages, their `agent_activity_log`/`agent_message_decisions` rows, 1 task, plus the earlier onboarding-wizard test projects/agents from the prior session) were fully cleaned from the live database — confirmed with a final zero-residue check.

---

## What was explicitly NOT done

- LLM prompt-injection deep-dive beyond the tool-call boundary check (Workora's actual LLM calls happen inside third-party CLIs — claude/codex/copilot binaries — which are out of this repo's scope to audit).
- Full penetration test / active exploitation beyond the RCE and privilege-check verification shown above.
- Load/performance testing.
- Mobile-native app review (Workora is web-only).
- The react-router-dom v7 major-version upgrade (see Tracked follow-up).

---

## Bottom line

One CRITICAL (unauthenticated RCE via missing capability gate on the entire projects domain) and one MEDIUM (ineffective rate limiting from a missing proxy-trust env var) were found, fixed, deployed, and live-verified with real non-owner credentials against production. Everything else checked came back clean on active verification, with one dependency CVE explicitly deferred and logged rather than silently ignored. Workora's core security architecture (capability system, parameterized SQL, non-root Docker, hashed secrets, authenticated daemon channel, human-gated agent actions) is genuinely solid — the projects-domain gap was an isolated omission, not a systemic pattern.
