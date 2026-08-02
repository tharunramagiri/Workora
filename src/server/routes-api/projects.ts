// Project routes: "paste a repo, get a coding agent" (Phase 1).
// POST /api/projects          — validate a git URL, ask the machine's daemon to clone it, create a
//                               per-project channel (#<repo>-eng), record the row
// GET  /api/projects          — list this server's projects
// GET  /api/projects/:id      — one project + status
// POST /api/projects/:id/sync — ask the daemon to pull latest from upstream
// POST /api/projects/:id/push — commit all changes on a feature branch and push (agent ships a PR)
// DELETE /api/projects/:id    — remove (daemon leaves the clone; DB row removed)
import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { requestDaemonByMachine } from "../daemonHub.js";
import { sendErr, sendJson } from "../util.js";
import type { ServerCtx } from "./ctx.js";

const GIT_URL_RE = /^(https?:\/\/|git@)[^\s]+$/;

function repoNameFromUrl(url: string): string {
  const clean = url.replace(/^git@[^:]+:/, "").replace(/^https?:\/\//, "").replace(/\.git$/, "").split("/").filter(Boolean);
  const owner = clean[clean.length - 2] ?? "repo";
  const repo = clean[clean.length - 1] ?? "repo";
  return `${owner}-${repo}`.replace(/[^A-Za-z0-9_.-]/g, "-");
}

export async function handleProjects(ctx: ServerCtx): Promise<boolean> {
  const { req, res, method, url, p, serverId, userId } = ctx;

  if (p === "/api/projects" && method === "GET") {
    const rows = await db.select().from(schema.projects).where(eq(schema.projects.serverId, serverId)).orderBy(desc(schema.projects.createdAt));
    return (sendJson(res, 200, rows.map((pr) => serialize(pr))), true);
  }

  if (p === "/api/projects" && method === "POST") {
    const b = await readJsonSafe(req);
    const repoUrl = String(b.repoUrl ?? "").trim();
    if (!GIT_URL_RE.test(repoUrl)) return (sendErr(res, 400, "a valid git URL is required (https:// or git@)"), true);
    const machineId = String(b.machineId ?? "").trim();
    if (!machineId) return (sendErr(res, 400, "machineId required"), true);
    const machine = (await db.select().from(schema.machines).where(and(eq(schema.machines.id, machineId), eq(schema.machines.serverId, serverId))))[0];
    if (!machine) return (sendErr(res, 404, "machine not found"), true);

    const name = String(b.name ?? "").trim() || repoNameFromUrl(repoUrl);
    const dup = (await db.select().from(schema.projects).where(and(eq(schema.projects.serverId, serverId), eq(schema.projects.repoUrl, repoUrl))))[0];
    if (dup) return (sendErr(res, 409, "this repo is already imported", { projectId: dup.id }), true);

    // Ask the daemon to clone (blobless). If no daemon is online, record the row as "error" — the
    // UI can retry with a sync. We deliberately create the channel + row first so the failure is visible.
    const rowId = randomUUID();
    const clonePath = await computeClonePath(repoUrl, machineId);
    const [row] = await db.insert(schema.projects).values({
      id: rowId, serverId, machineId, createdByUserId: userId, name, repoUrl,
      clonePath, status: "cloning",
    }).returning();

    const rpc = await requestDaemonByMachine(machineId, { type: "git:clone", repoUrl, path: clonePath }, 120_000);
    if (rpc?.ok !== true) {
      await db.update(schema.projects).set({ status: "error", lastError: String(rpc?.error ?? "clone failed") }).where(eq(schema.projects.id, rowId));
      const ch = await ensureProjectChannel(serverId, userId, name);
      if (ch && row!.channelId !== ch.id) await db.update(schema.projects).set({ channelId: ch.id }).where(eq(schema.projects.id, rowId));
      return (sendJson(res, 200, { id: rowId, status: "error", error: String(rpc?.error ?? "clone failed"), clonePath }), true);
    }

    const defaultBranch = typeof rpc.defaultBranch === "string" ? rpc.defaultBranch : "main";
    const channel = await ensureProjectChannel(serverId, userId, name);
    await db.update(schema.projects).set({
      status: "ready", defaultBranch, lastCommit: typeof rpc.commit === "string" ? rpc.commit : null,
      lastSyncedAt: new Date(), channelId: channel?.id ?? null,
    }).where(eq(schema.projects.id, rowId));
    return (sendJson(res, 200, { id: rowId, status: "ready", clonePath, defaultBranch, channelId: channel?.id ?? null }), true);
  }

  const m = /^\/api\/projects\/([^/]+)/.exec(p); // no trailing $ so /sync|push|branch-channel sub-paths match too
  if (m) {
    const id = m[1]!;
    const row = (await db.select().from(schema.projects).where(and(eq(schema.projects.id, id), eq(schema.projects.serverId, serverId))))[0];
    if (!row) return (sendErr(res, 404, "project not found"), true);

    if (method === "GET") return (sendJson(res, 200, serialize(row)), true);

    if (method === "DELETE") {
      await db.update(schema.projects).set({ status: "removed" }).where(eq(schema.projects.id, id));
      return (sendJson(res, 200, { ok: true }), true);
    }

    if (method === "POST") {
      const sub = /^\/(sync|push|branch-channel|branches|checkout)$/.exec(url.pathname.slice(m[0].length));
      if (!sub) return (sendErr(res, 404, "not found"), true);
      const op = sub[1]!;
      if (op === "branch-channel") {
        // Phase 3: "branch = channel" (buzz Forge). Creates a #<repo>-<branch> channel scoped to
        // this project + branch so patches, review, and merge discussion live in one place.
        const b = await readJsonSafe(req);
        const branch = String(b.branch ?? "").trim();
        if (!branch) return (sendErr(res, 400, "branch required"), true);
        const chan = await ensureProjectBranchChannel(serverId, userId, row, branch);
        if (!chan) return (sendJson(res, 200, { ok: false, error: "channel creation failed" }), true);
        return (sendJson(res, 200, { id: chan.id, name: chan.name }), true);
      }
      if (op === "branches") {
        const rpc = await requestDaemonByMachine(row.machineId, { type: "git:branches", clonePath: row.clonePath }, 30_000);
        if (rpc?.ok !== true) return (sendJson(res, 200, { ok: false, error: rpc?.error ?? "branches failed" }), true);
        return (sendJson(res, 200, { ok: true, branches: rpc.branches ?? [], local: rpc.local ?? [], remote: rpc.remote ?? [], current: rpc.current ?? null }), true);
      }
      if (op === "checkout") {
        const b = await readJsonSafe(req);
        const branch = String(b.branch ?? "").trim();
        if (!branch) return (sendErr(res, 400, "branch required"), true);
        const rpc = await requestDaemonByMachine(row.machineId, { type: "git:checkout", clonePath: row.clonePath, branch }, 30_000);
        if (rpc?.ok !== true) return (sendJson(res, 200, { ok: false, error: rpc?.error ?? "checkout failed" }), true);
        await db.update(schema.projects).set({ lastCommit: rpc.commit ?? null }).where(eq(schema.projects.id, id));
        return (sendJson(res, 200, { ok: true, branch: rpc.branch, commit: rpc.commit }), true);
      }
      if (op === "sync") {
        const rpc = await requestDaemonByMachine(row.machineId, { type: "git:pull", clonePath: row.clonePath, branch: row.defaultBranch }, 60_000);
        if (rpc?.ok !== true) return (sendJson(res, 200, { ok: false, error: rpc?.error ?? "sync failed" }), true);
        await db.update(schema.projects).set({ status: "ready", lastCommit: rpc.commit ?? null, lastSyncedAt: new Date() }).where(eq(schema.projects.id, id));
        return (sendJson(res, 200, { ok: true, commit: rpc.commit }), true);
      }
      if (op === "push") {
        const b = await readJsonSafe(req);
        const branch = String(b.branch ?? "").trim() || `workora/agent-changes`;
        const message = String(b.message ?? "").trim() || "workora: agent changes";
        const author = typeof b.author === "string" && b.author.trim() ? b.author.trim() : undefined;
        const rpc = await requestDaemonByMachine(row.machineId, { type: "git:push", clonePath: row.clonePath, branch, message, author }, 60_000);
        if (rpc?.ok !== true) return (sendJson(res, 200, { ok: false, error: rpc?.error ?? "push failed" }), true);
        await db.update(schema.projects).set({ lastCommit: rpc.commit ?? null, lastSyncedAt: new Date() }).where(eq(schema.projects.id, id));
        // Auto-create the branch review channel (idempotent) so patches + review live with the branch.
        const chan = await ensureProjectBranchChannel(serverId, userId, row, branch);
        return (sendJson(res, 200, { ok: true, commit: rpc.commit, branch: rpc.branch, channel: chan ?? null }), true);
      }
    }
  }

  return false;
}

async function computeClonePath(repoUrl: string, machineId: string): Promise<string> {
  // Ask the daemon where its projects root is; fall back to a sensible default if unreachable.
  const rpc = await requestDaemonByMachine(machineId, { type: "git:projects-root" }, 5000);
  const root = typeof rpc?.root === "string" && rpc.root ? rpc.root : "/opt/projects";
  const name = repoNameFromUrl(repoUrl);
  return `${root.replace(/\/$/, "")}/${name}`;
}

async function ensureProjectChannel(serverId: string, userId: string, projectName: string): Promise<{ id: string } | null> {
  const channelName = `${projectName.replace(/[^a-z0-9-]/gi, "").toLowerCase().slice(0, 48)}-eng`;
  const existing = (await db.select().from(schema.channels).where(and(eq(schema.channels.serverId, serverId), eq(schema.channels.name, channelName))))[0];
  if (existing) return { id: existing.id };
  try {
    const [ch] = await db.insert(schema.channels).values({ serverId, name: channelName, description: `Engineering channel for ${projectName} (auto-created on import)`, type: "channel" }).returning();
    await db.insert(schema.channelMembers).values([{ channelId: ch!.id, memberType: "user", memberId: userId }]).onConflictDoNothing();
    const agents = await db.select().from(schema.agents).where(and(eq(schema.agents.serverId, serverId), isNull(schema.agents.deletedAt)));
    if (agents.length) await db.insert(schema.channelMembers).values(agents.map((a) => ({ channelId: ch!.id, memberType: "agent", memberId: a.id }))).onConflictDoNothing();
    return { id: ch!.id };
  } catch {
    return null;
  }
}

/** Create (or find) the #<repo>-<branch> channel for a project+branch. Idempotent. */
async function ensureProjectBranchChannel(serverId: string, userId: string, project: typeof schema.projects.$inferSelect, branch: string): Promise<{ id: string; name: string } | null> {
  const chanName = `${project.name.replace(/[^a-z0-9-]/gi, "").toLowerCase().slice(0, 40)}-${branch.replace(/[^a-z0-9-]/gi, "").toLowerCase().slice(0, 24)}`;
  const existing = (await db.select().from(schema.channels).where(and(eq(schema.channels.serverId, serverId), eq(schema.channels.name, chanName))))[0];
  if (existing) return { id: existing.id, name: existing.name };
  try {
    const [ch] = await db.insert(schema.channels).values({
      serverId, name: chanName, type: "channel",
      description: `Branch channel for ${project.name} (${branch}) — patches, review, and merge discussion. Auto-created on push.`,
    }).returning();
    await db.insert(schema.channelMembers).values([{ channelId: ch!.id, memberType: "user", memberId: userId }]).onConflictDoNothing();
    const agents = await db.select().from(schema.agents).where(and(eq(schema.agents.serverId, serverId), isNull(schema.agents.deletedAt)));
    if (agents.length) await db.insert(schema.channelMembers).values(agents.map((a) => ({ channelId: ch!.id, memberType: "agent", memberId: a.id }))).onConflictDoNothing();
    return { id: ch!.id, name: ch!.name };
  } catch {
    return null;
  }
}

function serialize(row: typeof schema.projects.$inferSelect): Record<string, unknown> {
  return {
    id: row.id, name: row.name, repoUrl: row.repoUrl, clonePath: row.clonePath,
    defaultBranch: row.defaultBranch, channelId: row.channelId, status: row.status,
    lastError: row.lastError, lastCommit: row.lastCommit, lastSyncedAt: row.lastSyncedAt,
    createdAt: row.createdAt,
  };
}

async function readJsonSafe(req: any): Promise<Record<string, unknown>> {
  try {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const raw = Buffer.concat(chunks).toString("utf8");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
