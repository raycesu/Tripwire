# Tripwire cron-job.org Setup

Tripwire uses [cron-job.org](https://cron-job.org) to trigger protected Vercel API routes on a schedule. Scoring and alert logic runs in reusable server jobs; cron routes only authenticate and orchestrate runs.

## Environment variables

Set these in Vercel (Production at minimum):

| Variable | Purpose |
| --- | --- |
| `CRON_SECRET` | Shared secret for cron route authentication |

All other Tripwire env vars (`DATABASE_URL`, provider keys, Telegram, Clerk) must also be configured.

## Health check

Uptime monitors can call:

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/health` | `GET` | Returns `{ ok: true, db: "up" }` when Neon is reachable |

This confirms database connectivity only. It does not verify that scoring cron jobs succeeded.

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/cron/score-daily` | `POST` | Refresh Macro, recompute composite, evaluate alerts |
| `/api/cron/score-weekly` | `POST` | Refresh Relativity and Volume, recompute composite, evaluate alerts |
| `/api/cron/evaluate-alerts` | `POST` | Catch-up unsent qualifying alerts and retry failed Telegram deliveries |

### Authentication

Send either:

- Header: `Authorization: Bearer <CRON_SECRET>` (preferred)
- Query param: `?secret=<CRON_SECRET>` (fallback if headers are unavailable)

Invalid or missing secrets return `401 Unauthorized`.

### Response shape

Routes return a compact JSON summary, for example:

```json
{
  "ok": true,
  "jobName": "score-daily",
  "status": "success",
  "attempted": 10,
  "succeeded": 10,
  "failed": 0,
  "alertsSent": 2
}
```

Detailed errors are stored in the `scheduled_job_runs` table (`error_json`, `metadata_json`).

## Recommended cron-job.org jobs

Replace `https://your-app.vercel.app` with your production domain.

| Job name | URL | Schedule (UTC) | Notes |
| --- | --- | --- | --- |
| Tripwire Daily Scores | `https://your-app.vercel.app/api/cron/score-daily` | Daily at 00:30 | Macro + composite + alerts |
| Tripwire Weekly Scores | `https://your-app.vercel.app/api/cron/score-weekly` | Monday at 01:00 | After weekly candle close |
| Tripwire Alert Retry | `https://your-app.vercel.app/api/cron/evaluate-alerts` | Every 4–6 hours | Optional; retries failed/unsent alerts |

For each job in cron-job.org:

1. Method: `POST`
2. Request header: `Authorization: Bearer <your CRON_SECRET>`
3. Enable failure notifications
4. Save execution history for debugging

## Local smoke test

With the dev server running (`npm run dev`) and `.env.local` configured:

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/score-daily
```

Without a valid secret:

```bash
curl -X POST http://localhost:3000/api/cron/score-daily
# Expect: {"error":"Unauthorized"}
```

Manual scoring (also logs to `scheduled_job_runs` with `triggered_by: manual`):

```bash
npm run scores:run -- --daily
npm run scores:run -- --weekly
npm run scores:run -- --all
```

## Database migration

Apply the Phase 6 migration before first cron run:

```bash
npm run db:migrate
```

This creates the `scheduled_job_runs` table used for observability.

## Verification checklist

1. `scheduled_job_runs` row appears after each cron call
2. Macro/Relativity/Volume snapshots update for watchlist assets
3. Composite excludes stale sectors (`insufficient_valid_sectors` when appropriate)
4. Alerts send on qualifying fresh snapshots without duplicates for the same rule + snapshot
5. cron-job.org execution history shows HTTP 200 from production
