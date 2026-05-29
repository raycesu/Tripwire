# Tripwire

Personal asset score machine for crypto and equities. Tripwire scores your watchlist across three contrarian sectors, surfaces opportunity vs. crowded conditions, and sends Telegram alerts when your thresholds are met.

**Score convention (all sectors):** higher is more opportunity (`+2` deeply oversold), lower is more crowded (`-2` overheated). This is not generic “bullish/bearish” language—the UI labels scores as Strong Opportunity, Opportunity, Neutral, Caution, and Crowded / Overheated.

## Features

- **Watchlist** — Search and add crypto (Binance USDT pairs) and stocks from a catalog of 100k+ symbols (Binance + Twelve Data), synced on a schedule.
- **Three sector scores** — Macro, Relativity, and Volume, each from `-2` to `+2`, with component breakdowns stored for the UI.
- **Composite score** — Average of all three sectors when each is valid, non-null, and non-stale; otherwise null with a clear reason.
- **Asset detail** — Per-symbol score history, sector panels, freshness badges, and unsupported-asset explanations.
- **Alert rules** — Level-based thresholds on composite or individual sectors; initial-match alerts when a new rule already qualifies.
- **Telegram** — One shared Tripwire bot; connect via short-lived connect code and deep link; delivery caps and duplicate prevention built in.
- **Scheduled jobs** — [cron-job.org](https://cron-job.org) triggers protected Vercel API routes for daily/weekly scoring, alert evaluation, and catalog sync.
- **Observability** — `scheduled_job_runs` logs job outcomes; `/api/health` checks Neon connectivity.

## How scoring works

| Sector | Cadence | Inputs (summary) |
| --- | --- | --- |
| **Macro** | Daily | Crypto: Fear & Greed + BTC weekly RSI. Stocks: VIX + S&P 500 weekly RSI. |
| **Relativity** | Weekly | RSI vs. benchmark (`clamp((benchmark_rsi - asset_rsi) / 8, -2, +2)`). Crypto vs BTC; BTC vs SPY; stocks vs SPY. |
| **Volume** | Weekly | 30 completed weekly OHLCV candles; Wilder RSI(14); trend/context/gate/decel formula. |
| **Composite** | Daily refresh | Valid only when Macro, Relativity, and Volume are all valid (3/3). Stale sectors are excluded. |

**Freshness:** daily sectors stale after 36 hours; weekly sectors stale after 8 days.

**Providers:** Binance Global → Binance US fallback for crypto OHLCV (`<BASE>USDT` only); Twelve Data for stocks; FRED for macro; Alternative.me for Fear & Greed. Provider responses are cached where practical.

Scoring logic lives under `src/scoring/` and `src/jobs/`—not in React components or page loaders.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui, Radix, lucide-react |
| Auth | Clerk |
| Database | Neon Postgres |
| ORM | Drizzle |
| Validation | Zod |
| Charts | Recharts |
| Tests | Vitest |
| Deploy | Vercel |
| Cron | cron-job.org → protected `/api/cron/*` routes |

## Project structure

```txt
src/
  app/              # Routes, API handlers, dashboard pages
  components/       # UI (scores, watchlist, alerts, settings)
  db/               # Drizzle schema, migrations, seed
  jobs/             # Daily/weekly scoring and alert evaluation
  lib/              # Auth, queries, alerts, rate limits, logging
  providers/        # Binance, Twelve Data, FRED, Telegram, cache
  scoring/          # Pure sector formulas and indicators
  scripts/          # CLI: catalog sync, asset resolve, manual scores
docs/               # Cron setup, security, brand direction
```

## Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) Postgres database
- [Clerk](https://clerk.com) application keys
- API keys: [FRED](https://fred.stlouisfed.org/docs/api/api_key.html), [Twelve Data](https://twelvedata.com)
- A [Telegram bot](https://core.telegram.org/bots) (`TELEGRAM_BOT_TOKEN`, webhook secret)
- A strong `CRON_SECRET` for production cron routes

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Required variables are validated at startup via `src/lib/env.ts`. See [Environment variables](#environment-variables) below.

### 3. Database

```bash
npm run db:migrate    # apply migrations
npm run db:seed       # optional MVP seed assets (BTC, ETH, etc.)
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the root route redirects to `/dashboard` (Clerk sign-in required).

### 5. Optional: resolve catalog assets and run scores locally

```bash
npm run catalog:sync          # sync Binance + Twelve Data catalog
npm run assets:resolve        # resolve provider symbols for assets
npm run scores:run -- --daily # manual daily scoring job
npm run scores:run -- --weekly
npm run scores:run -- --all
npm run verify:market-data    # smoke-test provider connectivity
```

Cron routes can be exercised locally (see [docs/cron-setup.md](docs/cron-setup.md)):

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/score-daily
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk (public) |
| `CLERK_SECRET_KEY` | Yes | Clerk (server) |
| `CRON_SECRET` | Yes | Authenticates `/api/cron/*` routes |
| `TELEGRAM_BOT_TOKEN` | Yes | Shared Tripwire bot (server only) |
| `TELEGRAM_BOT_USERNAME` | Yes | Bot username for connect deep links |
| `TELEGRAM_WEBHOOK_SECRET` | Yes | Validates Telegram webhook requests |
| `FRED_API_KEY` | Yes | VIX and S&P 500 macro data |
| `TWELVE_DATA_API_KEY` | Yes | Stock OHLCV and catalog |
| `MAX_ALERTS_PER_USER_PER_RUN` | No | Default `10` |
| `MAX_TELEGRAM_MESSAGES_PER_MINUTE` | No | Default `20` |
| `PROVIDER_FETCH_MAX_RETRIES` | No | Default `3` |
| `PROVIDER_FETCH_TIMEOUT_MS` | No | Default `15000` |

Never commit `.env.local` or expose provider keys, `CRON_SECRET`, or `TELEGRAM_BOT_TOKEN` to the client.

## npm scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit/integration tests |
| `npm run db:generate` | Generate Drizzle migration from schema changes |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema directly (dev only) |
| `npm run db:seed` | Seed starter assets |
| `npm run catalog:sync` | Sync searchable asset catalog |
| `npm run assets:resolve` | Resolve provider symbols for assets |
| `npm run scores:run` | Run scoring jobs manually (`--daily`, `--weekly`, `--all`) |
| `npm run verify:market-data` | Verify external market data providers |

## App routes

| Path | Description |
| --- | --- |
| `/dashboard` | Watchlist scores, last job run summary |
| `/assets` | Browse/search catalog, add to watchlist |
| `/assets/[symbol]` | Asset detail, sector breakdowns, history |
| `/alerts` | Alert rules and delivery history |
| `/settings` | Telegram connection |

Protected by Clerk middleware (`/dashboard`, `/assets`, `/alerts`, `/settings`).

## API overview

**Authenticated (user-scoped):** watchlist CRUD, asset search, alert rules CRUD/export, Telegram connect and test.

**Cron ( `CRON_SECRET` ):** `POST /api/cron/score-daily`, `score-weekly`, `evaluate-alerts`, `sync-asset-catalog`.

**Public / special:** `GET /api/health`, Telegram webhook (`x-telegram-bot-api-secret-token`).

Full cron schedules, auth headers, and verification checklist: **[docs/cron-setup.md](docs/cron-setup.md)**.

## Production deployment

1. Deploy to [Vercel](https://vercel.com) with all environment variables set for Production.
2. Run `npm run db:migrate` against the production database (or use your CI migration step).
3. Register Telegram webhook to `/api/telegram/webhook` with your `TELEGRAM_WEBHOOK_SECRET`.
4. Create cron-job.org jobs per [docs/cron-setup.md](docs/cron-setup.md) (daily scores, weekly scores, optional alert retry, daily catalog sync).

Recommended UTC schedules (see docs for details):

- Catalog sync — daily ~00:15
- Daily scores (Macro + composite + alerts) — daily ~00:30
- Weekly scores (Relativity + Volume) — Monday ~01:00
- Alert retry — every 4–6 hours (optional)

## Testing

```bash
npm test
```

Covers scoring formulas, composite/staleness rules, alert evaluation and caps, cron auth, provider HTTP helpers, catalog queries, and integration flows. Scoring and alert logic are kept in pure/testable modules under `src/scoring/` and `src/lib/alerts/`.

## Documentation

| Doc | Contents |
| --- | --- |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Full product and engineering spec |
| [docs/cron-setup.md](docs/cron-setup.md) | cron-job.org jobs, auth, smoke tests |
| [docs/security.md](docs/security.md) | Secrets, logging redaction, rate limits |
| [docs/telegram-security.md](docs/telegram-security.md) | Bot token rotation |
| [docs/brand/visual-direction.md](docs/brand/visual-direction.md) | UI theme and tone |

## Security notes

- User data is scoped by Clerk-authenticated `user_id`; never trust client-provided user IDs.
- Telegram `chat_id` is stored per user in Neon; the bot token stays in env vars only.
- Authenticated mutation routes use Neon-backed rate limits (`api_rate_limits`).
- Structured logs redact secrets via `src/lib/logging/redact-secrets.ts`.

See [docs/security.md](docs/security.md) for the audit checklist.

## License

Private project — all rights reserved unless otherwise specified by the repository owner.
