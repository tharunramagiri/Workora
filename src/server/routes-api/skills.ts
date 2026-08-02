// Skill marketplace (OpenWork-Den style): publish skills, list the catalog, assign to agents.
// POST /api/skills        — publish a skill (name, description, SKILL.md content)
// GET  /api/skills        — list this workspace's published skills (+ assigned agent names)
// POST /api/skills/:id/assign   — assign a skill to an agent (binds into the agent's skills dir)
// POST /api/skills/:id/unassign — revoke
// DELETE /api/skills/:id  — remove from catalog
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { sendErr, sendJson } from "../util.js";
import type { ServerCtx } from "./ctx.js";

const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;

export async function handleSkills(ctx: ServerCtx): Promise<boolean> {
  const { req, res, method, url, p, serverId, userId } = ctx;

  if (p === "/api/skills" && method === "GET") {
    const rows = await db.select().from(schema.skills).where(eq(schema.skills.serverId, serverId)).orderBy(schema.skills.name);
    const assigned = await db.select().from(schema.skillAssignments).where(eq(schema.skillAssignments.serverId, serverId));
    const agents = await db.select().from(schema.agents).where(and(eq(schema.agents.serverId, serverId), isNull(schema.agents.deletedAt)));
    const byId = new Map(agents.map((a) => [a.id, a.name]));
    return (sendJson(res, 200, rows.map((s) => ({
      id: s.id, name: s.name, description: s.description, vendor: s.vendor,
      assignedTo: assigned.filter((a) => a.skillId === s.id).map((a) => byId.get(a.agentId) ?? a.agentId),
    }))), true);
  }

  if (p === "/api/skills" && method === "POST") {
    const b = await readJsonSafe(req);
    const name = String(b.name ?? "").trim().toLowerCase();
    if (!NAME_RE.test(name)) return (sendErr(res, 400, "skill name must be lowercase, kebab-case"), true);
    const content = String(b.content ?? "").trim();
    if (!content) return (sendErr(res, 400, "skill content (SKILL.md) required"), true);
    const existing = (await db.select().from(schema.skills).where(and(eq(schema.skills.serverId, serverId), eq(schema.skills.name, name))))[0];
    if (existing) return (sendErr(res, 409, "skill already exists", { skillId: existing.id }), true);
    const [s] = await db.insert(schema.skills).values({
      serverId, createdByUserId: userId, name, description: String(b.description ?? "").trim(),
      content, vendor: String(b.vendor ?? "workspace"),
    }).returning();
    return (sendJson(res, 200, { id: s!.id, name: s!.name }), true);
  }

  const m = /^\/api\/skills\/([^/]+)/.exec(p);
  if (m) {
    const id = m[1]!;
    const skill = (await db.select().from(schema.skills).where(and(eq(schema.skills.id, id), eq(schema.skills.serverId, serverId))))[0];
    if (!skill) return (sendErr(res, 404, "skill not found"), true);

    if (method === "DELETE") {
      await db.delete(schema.skillAssignments).where(eq(schema.skillAssignments.skillId, id));
      await db.delete(schema.skills).where(eq(schema.skills.id, id));
      return (sendJson(res, 200, { ok: true }), true);
    }

    if (method === "POST") {
      const sub = /^\/(assign|unassign)$/.exec(url.pathname.slice(m[0].length));
      if (sub) {
        const b = await readJsonSafe(req);
        const agentId = String(b.agentId ?? "").trim();
        if (!agentId) return (sendErr(res, 400, "agentId required"), true);
        const agent = (await db.select().from(schema.agents).where(and(eq(schema.agents.id, agentId), eq(schema.agents.serverId, serverId))))[0];
        if (!agent) return (sendErr(res, 404, "agent not found"), true);
        if (sub[1] === "assign") {
          await db.insert(schema.skillAssignments).values({ skillId: id, agentId, serverId }).onConflictDoNothing();
          return (sendJson(res, 200, { ok: true, assignedTo: agent.name }), true);
        }
        // unassign
        await db.delete(schema.skillAssignments).where(and(eq(schema.skillAssignments.skillId, id), eq(schema.skillAssignments.agentId, agentId)));
        return (sendJson(res, 200, { ok: true }), true);
      }
    }
  }
  return false;
}

async function readJsonSafe(req: any): Promise<Record<string, unknown>> {
  try {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const raw = Buffer.concat(chunks).toString("utf8");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}