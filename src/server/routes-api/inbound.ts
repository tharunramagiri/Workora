// Inbound bridge — external systems push events into a Workora channel.
//
// This is the landing point for messaging-app bridges (WhatsApp/Telegram via an
// owpenbot-style connector), product webhooks (Bookoraa orders, Stripe events,
// GitHub notifications), or any cron/caller that can do an HTTP POST.
//
//   POST /api/inbound
//   Authorization: Bearer <INBOUND_WEBHOOK_KEY>   (shared secret, set in env)
//   x-server-id: <workspace id>
//   { "channel": "#engineering" | "engineering", "text": "message body",
//     "mention": "@engineer" | "engineer", "from": "whatsapp" }
//
// Auth is a single shared secret (timing-safe) because the caller is an external
// service, not a human — it cannot hold a per-user JWT. The secret is never logged.
// The message is posted as a system sender named "webhook"; if `mention` is given,
// it is appended as an @mention so the named agent gets woken (delegate-to-agent).
import type { IncomingMessage, ServerResponse } from "node:http";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { safeEqual } from "../auth.js";
import { createMessage } from "../core.js";
import { bearer, readJson, sendErr, sendJson, serverIdHeader } from "../util.js";

const KEY = process.env.INBOUND_WEBHOOK_KEY ?? "";

export async function handleInbound(req: IncomingMessage, res: ServerResponse, method: string): Promise<boolean> {
  const p = req.url ? new URL(req.url, "http://localhost").pathname : "";
  if (p !== "/api/inbound" || method !== "POST") return false;
  if (!KEY) return (sendErr(res, 503, "inbound webhook not configured (INBOUND_WEBHOOK_KEY unset)"), true);

  const token = bearer(req);
  if (!token || !safeEqual(token, KEY)) return (sendErr(res, 401, "unauthorized"), true);

  const serverId = serverIdHeader(req);
  if (!serverId) return (sendErr(res, 400, "x-server-id header required"), true);
  const member = (await db.select().from(schema.servers).where(eq(schema.servers.id, serverId)))[0];
  if (!member) return (sendErr(res, 404, "workspace not found"), true);

  const b = await readJson(req);
  const text = String(b.text ?? b.content ?? "").trim();
  if (!text) return (sendErr(res, 400, "text required"), true);
  if (text.length > 20000) return (sendErr(res, 413, "text too long"), true);

  // Resolve the target channel by name (default #all).
  const channelName = String(b.channel ?? "all").trim().replace(/^#/, "") || "all";
  const channel = (await db.select().from(schema.channels).where(and(eq(schema.channels.serverId, serverId), eq(schema.channels.name, channelName), isNull(schema.channels.deletedAt))))[0];
  if (!channel) return (sendErr(res, 404, "channel not found"), true);

  // Optional mention → append @mention so the agent is woken (delegate-to-agent).
  let content = text;
  const mention = String(b.mention ?? "").trim().replace(/^@/, "");
  if (mention) content = `@${mention} ${text}`;

  const from = String(b.from ?? "webhook").trim().slice(0, 40);
  const msg = await createMessage({
    serverId, channelId: channel.id, senderType: "system", senderId: null,
    senderName: "webhook", content: `[${from}] ${content}`,
  });
  return (sendJson(res, 200, { ok: true, id: msg.id, channel: channel.name }), true);
}
