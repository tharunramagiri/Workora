// Workora Bridge — WhatsApp + Telegram → Workora /api/inbound connector.
// Runs as a standalone Node service. WhatsApp uses whatsapp-web.js (QR login,
// works with a normal WhatsApp number, no API token). Telegram uses the bot API.
//
// Every inbound message is POSTed to WORKORA_URL/api/inbound with:
//   { channel, text, mention?, from }
// so it lands in a Workora channel and (optionally) wakes an agent.
import "dotenv/config";
import qrcode from "qrcode-terminal";

const {
  WORKORA_URL = "https://office.ramagiritharun.in",
  WORKORA_SERVER_ID = "",
  WORKORA_INBOUND_KEY = "",
  WORKORA_DEFAULT_CHANNEL = "all",
  WORKORA_DEFAULT_MENTION = "",
  WHATSAPP_ENABLED = "true",
  WHATSAPP_AUTH_DIR = "./.wa-session",
  TELEGRAM_ENABLED = "false",
  TELEGRAM_BOT_TOKEN = "",
  BRIDGE_SENDER_LABEL = "chat",
} = process.env;

function fail(msg) {
  console.error(`✗ ${msg}`);
  console.error("  Set WORKORA_SERVER_ID and WORKORA_INBOUND_KEY (see bridges/.env.example).");
  process.exit(1);
}
if (!WORKORA_SERVER_ID) fail("WORKORA_SERVER_ID is required");
if (!WORKORA_INBOUND_KEY) fail("WORKORA_INBOUND_KEY is required");

/** Push a message into Workora via /api/inbound. */
async function pushToWorkora(text, senderName) {
  const body = {
    channel: WORKORA_DEFAULT_CHANNEL,
    text: `[${senderName}] ${text}`.slice(0, 20000),
    from: BRIDGE_SENDER_LABEL,
  };
  if (WORKORA_DEFAULT_MENTION) body.mention = WORKORA_DEFAULT_MENTION;
  const res = await fetch(`${WORKORA_URL}/api/inbound`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${WORKORA_INBOUND_KEY}`,
      "x-server-id": WORKORA_SERVER_ID,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`✗ /api/inbound → ${res.status} ${await res.text().catch(() => "")}`);
    return;
  }
  const data = await res.json().catch(() => ({}));
  console.log(`✓ forwarded → #${data?.channel ?? WORKORA_DEFAULT_CHANNEL}`);
}

console.log("Workora Bridge starting…");
console.log(`  → Workora: ${WORKORA_URL} (channel #${WORKORA_DEFAULT_CHANNEL})`);

// ── WhatsApp ─────────────────────────────────────────────────────────────
if (WHATSAPP_ENABLED === "true") {
  const { default: wa } = await import("whatsapp-web.js");
  const { Client, LocalAuth } = wa;
  const client = new Client({ authStrategy: new LocalAuth({ dataPath: WHATSAPP_AUTH_DIR }), puppeteer: { headless: true, args: ["--no-sandbox"] } });

  client.on("qr", (qr) => {
    console.log("\n=== Scan this QR with WhatsApp on your phone (Settings → Linked devices) ===");
    qrcode.generate(qr, { small: true });
  });
  client.on("ready", () => console.log("✓ WhatsApp connected. Messages will now flow into Workora."));
  client.on("authenticated", () => console.log("✓ WhatsApp authenticated"));
  client.on("auth_failure", (m) => console.error("✗ WhatsApp auth failed:", String(m)));
  client.on("disconnected", (r) => console.error("✗ WhatsApp disconnected:", String(r)));

  client.on("message", async (msg) => {
    if (msg.fromMe) return; // don't loop our own replies
    const text = msg.body?.trim();
    if (!text) return;
    const sender = msg._data?.notifyName || msg.from || "whatsapp";
    console.log(`WhatsApp ← ${sender}: ${text.slice(0, 60)}`);
    await pushToWorkora(text, sender);
  });

  client.initialize().catch((e) => console.error("✗ WhatsApp init failed:", String(e)));
}

// ── Telegram ─────────────────────────────────────────────────────────────
if (TELEGRAM_ENABLED === "true" && TELEGRAM_BOT_TOKEN) {
  const token = TELEGRAM_BOT_TOKEN;
  let offset = 0;
  const poll = async () => {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=25`);
      const data = await res.json();
      for (const u of data?.result ?? []) {
        offset = Math.max(offset, (u.update_id ?? 0) + 1);
        const text = u.message?.text?.trim();
        if (!text) continue;
        const sender = u.message?.from?.first_name || u.message?.from?.username || "telegram";
        console.log(`Telegram ← ${sender}: ${text.slice(0, 60)}`);
        await pushToWorkora(text, sender);
      }
    } catch (e) {
      console.error("Telegram poll error:", String(e?.message ?? e));
    }
    setTimeout(poll, 1000);
  };
  console.log("Telegram bot enabled");
  poll();
}

console.log("Bridge running. Press Ctrl+C to stop.");
