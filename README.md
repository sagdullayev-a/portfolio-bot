# Telegram Bot Service

Telegram bot for the **Prince · Webkaiken** portfolio. It has two independent
responsibilities:

1. **User-facing bot** — answers Telegram commands (`/start`, `/about_me`,
   `/cv_website`, …) for anyone who messages it.
2. **Admin notifier** — sends private notifications (contact form submissions,
   deploys, server errors) to the owner's personal chat.

> This service is separate from the Next.js portfolio website. The website calls
> the Telegram HTTP API directly for notifications and does not depend on this
> service being online.

## Requirements

- Node.js **>= 18.17**
- A bot token from [@BotFather](https://t.me/BotFather)

## Setup

```bash
cd telegram-bot
npm install
cp .env.example .env
```

Open `.env` and fill in the values:

| Variable                | Description                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN`    | Token from @BotFather.                                                                   |
| `TELEGRAM_ADMIN_CHAT_ID`| Your personal chat id (discovered in Phase 3 via `/whoami`; placeholder is fine earlier). |
| `NODE_ENV`              | `development` or `production` (optional).                                                |

## Run locally (watch mode)

```bash
npm run dev
```

## Build & run compiled output

```bash
npm run build
npm start
```

## Type-check only

```bash
npm run typecheck
```

## Project layout

```
src/
├── bot.ts            # Telegraf instance + wiring (Phase 2+)
├── index.ts          # Entry point: launch + graceful shutdown
├── config/env.ts     # Env var loading & validation
├── commands/         # One file per command + registerCommands() (Phase 2)
├── middlewares/      # Logger middleware (Phase 2)
├── services/         # Admin notifier (Phase 3)
└── types/            # Shared types (Phase 3)
```

### Adding a new command (later phases)

Only two changes are ever needed:

1. Add a new file under `src/commands/`.
2. Register it with one line inside `registerCommands()` in
   `src/commands/index.ts`.

Do not restructure `bot.ts` or `index.ts` to add commands.
