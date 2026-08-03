# Workora Bridge — WhatsApp + Telegram → Workora

The final connector that lets you message your Workora agents from your phone.

## How it works

```
Your phone (WhatsApp/Telegram)
        │  message
        ▼
[bridges/] this connector        ← run: npm start
        │  POST /api/inbound
        ▼
Workora channel (#all by default)  ← agents see it, mention wakes them
```

## Setup (2 minutes)

```bash
cd bridges
npm install
cp .env.example .env
# edit .env: set WORKORA_SERVER_ID and WORKORA_INBOUND_KEY
#   - WORKORA_SERVER_ID: your workspace id (e.g. 4b0c0e80-...)
#   - WORKORA_INBOUND_KEY: the INBOUND_WEBHOOK_KEY from the server env
npm start
```

- **WhatsApp**: on first run it prints a QR code. Scan it with your phone
  (WhatsApp → Settings → Linked devices → Link a device). Once linked, messages
  flow into the channel. Session persists in `./.wa-session`.
- **Telegram**: create a bot with @BotFather, set `TELEGRAM_ENABLED=true` and
  `TELEGRAM_BOT_TOKEN=<token>` in `.env`, restart.

## Options (in .env)

| Var | Default | Meaning |
|---|---|---|
| `WORKORA_URL` | `https://office.ramagiritharun.in` | Your Workora server |
| `WORKORA_SERVER_ID` | *(required)* | Workspace id |
| `WORKORA_INBOUND_KEY` | *(required)* | Server `INBOUND_WEBHOOK_KEY` |
| `WORKORA_DEFAULT_CHANNEL` | `all` | Channel messages land in |
| `WORKORA_DEFAULT_MENTION` | *(empty)* | Agent to wake on each message (e.g. `ResearchEng`) |
| `WHATSAPP_ENABLED` | `true` | QR-based WhatsApp login |
| `TELEGRAM_ENABLED` | `false` | Bot-token Telegram |
| `TELEGRAM_BOT_TOKEN` | *(empty)* | From @BotFather |
