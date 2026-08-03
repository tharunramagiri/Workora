// Knowledge base API — durable team/agent memory (memmy/qm-inspired).
// The `knowledge` table has existed in the schema since the scopes system shipped
// (knowledge:read scope references "the agent knowledge base"), but no routes ever
// implemented it. This wires the table to real endpoints:
//   GET  /api/knowledge            — list this server's knowledge entries (optional ?agentId= filter)
//   POST /api/knowledge            — add an entry { title, content, agentId? }
//   DELETE /api/knowledge/:id      — remove an entry
// Agents additionally get /agent-api/knowledge (read + write) so they can persist
// durable facts team-wide instead of only in their private MEMORY.md — the
// cross-agent shared-memory layer from the improvement study.
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { isUuid, readJson, sendErr, sendJson } from "../util.js";
import type { ServerCtx } from "./ctx.js";

export async function handleKnowledge(ctx: ServerCtx): Promise<boolean> {
  const { req, res, method, url, p, serverId, userId } = ctx;

  if (p === "/api/knowledge" && method === "GET") {
    const agentId = url.searchParams.get("agentId")?.trim() || null;
    const where = agentId
      ? and(eq(schema.knowledge.serverId, serverId), eq(schema.knowledge.agentId, agentId))
      : eq(schema.knowledge.serverId, serverId);
    const rows = await db.select().from(schema.knowledge).where(where).orderBy(desc(schema.knowledge.createdAt));
    return (sendJson(res, 200, rows.map((k) => ({ id: k.id, title: k.title, content: k.content, agentId: k.agentId, createdAt: k.createdAt }))), true);
  }

  if (p === "/api/knowledge" && method === "POST") {
    const b = await readJson(req);
    const title = String(b.title ?? "").trim();
    const content = String(b.content ?? "").trim();
    if (!title || !content) return (sendErr(res, 400, "title and content required"), true);
    const agentId = typeof b.agentId === "string" && b.agentId.trim() ? b.agentId.trim() : null;
    if (agentId && !isUuid(agentId)) return (sendErr(res, 400, "invalid agentId"), true);
    // If an agentId is given, it must belong to this server (no cross-tenant writes).
    if (agentId) {
      const agent = (await db.select().from(schema.agents).where(and(eq(schema.agents.id, agentId), eq(schema.agents.serverId, serverId))))[0];
      if (!agent) return (sendErr(res, 404, "agent not found"), true);
    }
    const [row] = await db.insert(schema.knowledge).values({
      serverId, agentId, title, content,
      searchText: `${title} ${content}`.toLowerCase().slice(0, 20000),
    }).returning();
    return (sendJson(res, 200, { id: row!.id, title: row!.title }), true);
  }

  const m = /^\/api\/knowledge\/([^/]+)$/.exec(p);
  if (m && method === "DELETE") {
    if (!isUuid(m[1]!)) return (sendErr(res, 404, "knowledge not found"), true);
    const row = (await db.select().from(schema.knowledge).where(and(eq(schema.knowledge.id, m[1]!), eq(schema.knowledge.serverId, serverId))))[0];
    if (!row) return (sendErr(res, 404, "knowledge not found"), true);
    await db.delete(schema.knowledge).where(eq(schema.knowledge.id, m[1]!));
    return (sendJson(res, 200, { ok: true }), true);
  }

  return false;
}
