// Auto-extracted from the former routes-api.ts monolith — bodies are verbatim.
import type { ServerCtx } from "./ctx.js";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { readJson, sendErr, sendJson } from "../util.js";

export async function handleReminders(ctx: ServerCtx): Promise<boolean> {
  const { req, res, url, method, p, serverId, userId } = ctx;
  if (p === "/api/reminders" && method === "GET") {
    const ownerAgentId = url.searchParams.get("ownerAgentId") || url.searchParams.get("agentId");
    const status = url.searchParams.get("status"); // scheduled = not yet fired
    let rows = await db.select().from(schema.reminders).where(eq(schema.reminders.serverId, serverId)).orderBy(asc(schema.reminders.remindAt));
    if (ownerAgentId) rows = rows.filter((r) => r.ownerType === "agent" && r.ownerId === ownerAgentId);
    if (status) rows = rows.filter((r) => r.status === status);
    return (sendJson(res, 200, { reminders: rows.map((r) => ({ id: r.id, content: r.content, status: r.status, recurrence: r.recurrence, anchorMessageId: r.anchorMessageId, remindAt: r.remindAt, firedAt: r.firedAt, channelId: r.channelId, ownerType: r.ownerType, ownerId: r.ownerId, createdAt: r.createdAt })) }), true);
  }

  // Human-facing cron/reminder creation. The scheduler (src/server/reminders.ts) ticks due
  // reminders, posts a system message `⏰ @<owner> reminder: <content>` in the channel, and
  // reschedules recurring ones (recurrence = interval seconds). A human can create a recurring
  // reminder whose content @mentions an agent — the mention wakes that agent on schedule, which
  // makes this the user-facing "background cron job" primitive (qm's crons/watches borrow).
  if (p === "/api/reminders" && method === "POST") {
    const b = await readJson(req);
    const content = String(b.content ?? "").trim();
    if (!content) return (sendErr(res, 400, "content required"), true);
    let remindAt: Date;
    if (b.at) { remindAt = new Date(String(b.at)); if (isNaN(remindAt.getTime())) return (sendErr(res, 400, "invalid at (ISO time)"), true); }
    else if (b.in != null && Number(b.in) > 0) remindAt = new Date(Date.now() + Number(b.in) * 1000);
    else return (sendErr(res, 400, "provide in (seconds) or at (ISO time)"), true);
    const recurrence = b.recurring != null && Number(b.recurring) > 0 ? String(Number(b.recurring)) : null;
    // Optional channel by name; defaults to the scheduler's #all fallback.
    let channelId: string | null = null;
    if (typeof b.channel === "string" && b.channel.trim()) {
      const ch = (await db.select().from(schema.channels).where(and(eq(schema.channels.serverId, serverId), eq(schema.channels.name, b.channel.trim().replace(/^#/, "")))))[0];
      if (!ch) return (sendErr(res, 404, "channel not found"), true);
      channelId = ch.id;
    }
    const [r] = await db.insert(schema.reminders).values({
      serverId, ownerType: "user", ownerId: userId, content, remindAt,
      recurrence, channelId, anchorMessageId: null,
    }).returning();
    return (sendJson(res, 200, { ok: true, id: r!.id, remindAt: r!.remindAt, recurrence }), true);
  }

  const del = /^\/api\/reminders\/([^/]+)$/.exec(p);
  if (del && method === "DELETE") {
    const id = del[1]!;
    const r = (await db.select().from(schema.reminders).where(and(eq(schema.reminders.id, id), eq(schema.reminders.serverId, serverId))))[0];
    if (!r) return (sendErr(res, 404, "reminder not found"), true);
    await db.update(schema.reminders).set({ status: "cancelled" }).where(eq(schema.reminders.id, id));
    return (sendJson(res, 200, { ok: true }), true);
  }

  return false;
}
