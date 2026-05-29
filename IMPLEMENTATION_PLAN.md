# Tripwire Implementation Plan

## 1. Product Goal

Tripwire is a personal asset-monitoring app that scores crypto and equity assets across three contrarian sectors:

- Macro
- Relativity
- Volume

Each sector outputs a score from `-2` to `+2`.

Score meaning:

- `+2`: deeply oversold, stronger accumulation or buy-opportunity signal
- `0`: neutral
- `-2`: overheated, overbought, or distribution signal

This convention applies to every sector. For example, a high Macro score during extreme fear signals opportunity, while a low Macro score during euphoria signals crowded conditions.

The final asset score (composite) is the average of Macro, Relativity, and Volume. Composite is valid only when all three sectors are valid, non-null, and non-stale. If any sector is unavailable, composite is null with `null_reason = "insufficient_valid_sectors"`.

The core user workflow:

1. User signs in.
2. User adds assets to a personal watchlist.
3. Tripwire computes sector scores and final scores for each watched asset.
4. User defines alert rules.
5. Tripwire sends Telegram alerts when rules are triggered.

## 2. Recommended Tech Stack

### App Platform

- Framework: Next.js App Router with TypeScript
- Styling: Tailwind CSS
- UI components: shadcn/ui, Radix primitives, lucide-react icons
- Deployment: Vercel
- Auth: Clerk
- Database: Neon Postgres
- ORM: Drizzle ORM
- Validation: Zod
- Charts: Recharts or Tremor charts
- Job scheduling: cron-job.org calling protected Vercel API routes
- Background job upgrade path: Inngest, Trigger.dev, or QStash if scoring runs become too long for Vercel Functions

Why this stack:

- Next.js, Clerk, Neon, and Vercel fit together cleanly for a fast MVP.
- Drizzle keeps the database layer typed without the heavier runtime footprint of Prisma.
- Neon is well-suited to serverless Postgres workloads.
- cron-job.org is a good fit because Tripwire's scheduled work can be triggered by HTTP requests to private API routes.
- Large scoring runs across many assets may eventually need a durable job runner if they exceed Vercel function duration limits.

Official docs to reference during implementation:

- Clerk Next.js App Router quickstart: https://clerk.com/docs/nextjs/getting-started/quickstart
- cron-job.org REST API: https://docs.cron-job.org/rest-api.html
- Neon serverless driver: https://neon.com/docs/serverless/serverless-driver
- Drizzle with Neon: https://orm.drizzle.team/docs/get-started/neon-new
- Telegram Bot API: https://core.telegram.org/bots/api

## 3. Visual Direction

Theme:

- Background: charcoal / dark grey
- Primary material feel: silver / grey
- Accent: alert red
- Positive score accent: cool green
- Negative score accent: red
- Neutral: muted silver

Logo direction:

- The logo should look like a dormant tripwire, sensor, or alert system that is currently asleep.
- Avoid a loud alarm-state logo for the default brand mark.
- Suggested visual metaphor: a dim red sensor line, a sleeping detection node, or a low-power alert beacon.
- In active alert moments, the product can animate or brighten the red accent, but the core logo should feel deactivated.

UI tone:

- Dark operational dashboard, not a marketing landing page.
- Dense enough for repeated monitoring.
- Use compact score chips, sector accordions, threshold controls, and clear alert status.

## 4. Core Data Model

### users

Clerk remains the auth source of truth. The app stores a local profile row mapped to Clerk.

Fields:

- `id`
- `clerk_user_id`
- `telegram_chat_id`
- `telegram_connect_code`
- `telegram_connect_code_expires_at`
- `telegram_verified_at`
- `created_at`
- `updated_at`

Telegram note: the MVP uses one shared Tripwire bot. The database stores each user's Telegram `chat_id`, not a per-user bot token.

### assets

Fields:

- `id`
- `symbol`
- `name`
- `asset_type`: `crypto` or `stock`
- `provider_symbol`
- `provider_name`: selected market-data provider, such as `binance_global`, `binance_us`, or `twelve_data`
- `quote_asset`: default `USDT` for crypto
- `benchmark_symbol`
- `resolution_status`: `resolved`, `unsupported`, or `needs_review`
- `unsupported_reason`
- `is_active`
- `created_at`
- `updated_at`

Benchmark rules:

- Crypto assets: benchmark against BTC.
- BTC itself: benchmark against SPY.
- Stocks: benchmark against SPY.

### watchlist_items

Fields:

- `id`
- `user_id`
- `asset_id`
- `created_at`

Unique constraint:

- `user_id + asset_id`

### score_snapshots

Fields:

- `id`
- `asset_id`
- `sector`: `macro`, `relativity`, `volume`, or `composite`
- `score`
- `is_null`
- `null_reason`
- `is_stale`
- `components_json`
- `source_metadata_json`
- `computed_at`
- `valid_for_date`
- `cadence`: `daily`, `weekly`, `manual`, or `provisional`

Recommended unique constraint:

- `asset_id + sector + valid_for_date + cadence`

Use `components_json` to power the UI breakdown dropdowns.

Example Macro breakdown:

```json
{
  "fear_greed": {
    "value": 22,
    "label": "Extreme Fear",
    "score": 2,
    "weight": 0.6
  },
  "btc_weekly_rsi": {
    "value": 38.4,
    "score": 1,
    "weight": 0.4
  }
}
```

### scheduled_job_runs

Fields:

- `id`
- `job_name`: `score-daily`, `score-weekly`, `evaluate-alerts`, etc.
- `triggered_by`: `cron-job.org`, `manual`, or `admin`
- `status`: `running`, `success`, `partial_failure`, or `failed`
- `started_at`
- `finished_at`
- `assets_attempted`
- `assets_succeeded`
- `assets_failed`
- `error_json`
- `metadata_json`

Use this table to debug cron-job.org calls, provider failures, and partial scoring runs.

### alert_rules

Fields:

- `id`
- `user_id`
- `asset_id`
- `scope`: `composite` or `sector`
- `sector`: nullable sector name
- `operator`: MVP should support `above`; later versions can add `below`
- `threshold`
- `cooldown_minutes`: optional safety setting, default `0`
- `is_enabled`
- `created_at`
- `updated_at`

Example rules:

- Notify when composite score is above `1.5`.
- Notify when Macro sector score is above `1.5`.
- Notify when Volume sector score is above `1.5`.

Alert behavior:

- Alerts are level-based, not crossing-based.
- If a score is above the user-selected threshold after a fresh scoring run, send an alert.
- If the next scoring run is still above the threshold, send another alert.
- If a user creates a new alert and the latest score already qualifies, send an initial-match alert immediately.
- Do not send duplicate alerts for the same `alert_rule_id + score_snapshot_id`.
- Cooldowns can exist as an optional user-controlled safety valve, but the default should be to alert on every qualifying fresh score.

Alert storm safety:

- Default max alerts per user per scoring run: `10`.
- Default max Telegram messages globally per minute: `20`.
- If a user has more than 10 qualifying alerts in one run, send the first 10 and create skipped alert events with `telegram_status = "skipped_rate_limited"`.
- Prioritize composite alerts before sector alerts when applying the per-user cap.
- Never bypass duplicate prevention.
- Log skipped alerts so the UI can show "7 additional alerts were skipped by safety limits."
- Make both caps configurable through environment variables later if needed.

### alert_events

Fields:

- `id`
- `alert_rule_id`
- `user_id`
- `asset_id`
- `score_snapshot_id`
- `triggered_value`
- `message`
- `telegram_status`
- `telegram_error`
- `sent_at`
- `created_at`

Use this table for duplicate prevention, delivery logging, and alert history.

Recommended unique constraint:

- `alert_rule_id + score_snapshot_id`

### telegram_delivery_state

Fields:

- `id`
- `user_id`
- `telegram_chat_id`
- `status`: `connected`, `blocked`, `invalid_chat`, `send_failed`, or `disconnected`
- `last_success_at`
- `last_failure_at`
- `last_error`
- `updated_at`

Use this to disable or warn on Telegram alerts when a user blocks the bot, deletes the chat, or Telegram returns a permanent delivery error.

### provider_cache

Fields:

- `id`
- `cache_key`
- `provider`
- `payload_json`
- `expires_at`
- `created_at`
- `updated_at`

Use this to reduce duplicate API calls, especially for market-wide macro values and exchange metadata.

## 5. Score Computation Architecture

Recommended folder structure:

```txt
src/
  app/
    (dashboard)/
      dashboard/
      assets/
      alerts/
      settings/
    api/
      cron/
        score-daily/
        score-weekly/
        alerts/
      telegram/
        webhook/
  components/
    app-shell/
    assets/
    scores/
    alerts/
  db/
    schema.ts
    client.ts
    migrations/
  lib/
    auth/
    scoring/
      composite.ts
      macro.ts
      relativity.ts
      volume.ts
      indicators.ts
    providers/
      binance.ts
      binance-us.ts
      coingecko.ts
      fred.ts
      twelve-data.ts
      telegram.ts
    jobs/
      run-daily-scores.ts
      run-weekly-scores.ts
      evaluate-alerts.ts
```

Scoring principles:

- Store every sector run as a snapshot.
- Store component-level details for explainability.
- Do not compute scores only on page load.
- UI should read from latest stored snapshots.
- Manual refresh can exist for development/admin use, but scheduled jobs should be the source of truth.
- cron-job.org should only trigger API routes; all actual scoring logic should live in reusable server-side job functions.
- Each cron-triggered API route must require a shared secret header or token query param so random visitors cannot run scoring jobs.

## 6. Sector Specs

### 6.1 Macro

Purpose:

- Measure broad market conditions.
- Same macro score applies to all assets of the same asset type in a run.

Crypto macro:

- Fear & Greed Index from Alternative.me, 60% weight.
- BTC weekly RSI, 40% weight.
- Same crypto macro score applies to every crypto asset in the scoring run.

Fear & Greed scoring:

- `< 25`: `+2`
- `25-44`: `+1`
- `45-55`: `0`
- `56-75`: `-1`
- `> 75`: `-2`

BTC weekly RSI scoring:

- `< 30`: `+2`
- `30-44`: `+1`
- `45-55`: `0`
- `56-70`: `-1`
- `> 70`: `-2`

Crypto macro formula:

```txt
fear_greed_score = threshold_map(fear_greed_index)
btc_rsi_score = threshold_map(BTC weekly RSI)

crypto_macro_score = (fear_greed_score * 0.60)
                   + (btc_rsi_score * 0.40)
```

Crypto macro data flow:

1. Fetch current Fear & Greed Index from Alternative.me.
2. Fetch BTC weekly closes.
3. Compute standard Wilder RSI(14) on weekly closes.
4. Score both components with the threshold tables.
5. Store the weighted score and component breakdown once per run.

Stock macro:

- VIX from FRED, 60% weight.
- S&P 500 weekly RSI, 40% weight.
- Same stock macro score applies to every stock asset in the scoring run.

VIX scoring:

- `< 13`: `-1`
- `13-19`: `0`
- `20-29`: `+1`
- `30-39`: `+2`
- `>= 40`: `+2`

S&P 500 weekly RSI uses the same thresholds as BTC weekly RSI.

Stock macro formula:

```txt
vix_score = threshold_map(VIX level)
sp500_rsi_score = threshold_map(S&P 500 weekly RSI)

stock_macro_score = (vix_score * 0.60)
                  + (sp500_rsi_score * 0.40)
```

Stock macro data flow:

1. Fetch latest VIX observation from FRED series `VIXCLS`.
2. Fetch S&P 500 prices from FRED series `SP500`.
3. Resample daily S&P values into weekly closes using Friday close, or the last available market day of the week.
4. Compute standard Wilder RSI(14).
5. Score both components and store the weighted breakdown.

Macro implementation notes:

- Fetch macro values once at the start of a scoring run and reuse them for every asset of that type.
- Cache macro payloads because they are market-wide, not asset-specific.
- Use completed weekly closes for RSI-based stable scores.

### 6.2 Relativity

Purpose:

- Measure whether an asset is weak or strong relative to its benchmark.
- Uses weekly RSI divergence.

Formula:

```txt
Relativity Index = Benchmark RSI(14, weekly) - Asset RSI(14, weekly)
Score = clamp(Index / 8, -2, +2)
```

Interpretation:

- Positive score means the asset is weaker or more oversold than its benchmark, which is bullish for a contrarian opportunity detector.
- Negative score means the asset is stronger or more overbought than its benchmark, which is bearish or less attractive for new buys.

Examples:

- Benchmark RSI `50`, asset RSI `38`: score `+1.5`
- Benchmark RSI `50`, asset RSI `50`: score `0`
- Benchmark RSI `50`, asset RSI `60`: score `-1.25`

Benchmarks:

- Crypto assets: BTC weekly RSI
- Stocks: SPY weekly RSI
- BTC: SPY weekly RSI

Inputs:

- Asset weekly closes.
- Benchmark weekly closes.
- Minimum 28 weekly candles recommended for stable RSI.
- Use the most recent completed weekly candle only.

Implementation flow:

1. Determine benchmark from asset type.
2. Fetch asset weekly OHLCV.
3. Fetch benchmark weekly OHLCV.
4. Compute Wilder RSI(14) for both.
5. Read the latest RSI output from each series.
6. Compute `benchmark_rsi - asset_rsi`.
7. Divide by `8` and clamp to `[-2, +2]`.
8. Store component details:
   - asset RSI
   - benchmark symbol
   - benchmark RSI
   - relativity index
   - final score

Edge cases:

- If asset RSI cannot be computed, return null for Relativity.
- If benchmark RSI cannot be computed, return null for Relativity.
- Cache benchmark RSI per run so BTC or SPY is not fetched repeatedly for every watched asset.

### 6.3 Volume

Purpose:

- Detect seller exhaustion, distribution, and price/volume context.

Inputs:

- 30 weekly OHLCV candles.
- Exclude in-progress weekly candles for stable production scores.
- Index convention: `0` is oldest candle and `29` is the most recent completed weekly candle.
- Crypto source: Binance weekly klines.
- Equity source: Twelve Data weekly candles if the free tier supports the needed interval.

Components:

- `V_trend`: volume trend over 6 candles, weight 60%.
- `P_context`: current close location in 10-week range, weight 40%.
- `RSI gate`: asymmetric multiplier based on weekly RSI.
- `decel_factor`: price deceleration modifier.

Component 1: `V_trend`

Measures whether volume is rising or falling over the last 6 completed weekly candles. The slope is inverted because falling volume near lows can show seller exhaustion.

```txt
vol_recent = mean(volume[29], volume[28], volume[27])
vol_prior = mean(volume[26], volume[25], volume[24])

if vol_prior == 0:
  V_trend = 0
else:
  vol_slope = (vol_recent - vol_prior) / vol_prior
  V_trend = clamp(vol_slope * -3, -1, +1)
```

Interpretation:

- A 33% volume decline maps near `+1`.
- A 33% volume increase maps near `-1`.
- Positive `V_trend` supports accumulation / seller exhaustion.
- Negative `V_trend` supports distribution / overheating.

Component 2: `P_context`

Measures where the current weekly close sits inside its 10-week close range.

```txt
low_10w = min(close[20] ... close[29])
high_10w = max(close[20] ... close[29])
range = high_10w - low_10w

if range == 0:
  P_context = 0
else:
  range_position = (close[29] - low_10w) / range
  P_context = clamp(1 - (range_position * 2), -1, +1)
```

Interpretation:

- At 10-week low: `P_context = +1`
- At 10-week high: `P_context = -1`
- Mid-range: `P_context = 0`

Component 3: RSI gate

This is a multiplier, not an additive score. It intentionally amplifies oversold setups and dampens overbought or noisy setups.

```txt
if RSI_now < 35:
  gate = 1.5
elif RSI_now < 45:
  gate = 1.2
elif RSI_now < 50:
  gate = 0.6
elif RSI_now < 65:
  gate = 0.8
else:
  gate = 0.5
```

Important:

- Use Wilder RSI(14) on weekly closes.
- With 30 closes and period 14, the RSI output is shorter than the input.
- Always use `rsiOutput[rsiOutput.length - 1]` for the latest RSI.
- If RSI cannot be computed, use fallback `gate = 0.6`.
- Do not remove the 45-50 dead zone; it suppresses false positives when volume collapses but price momentum is not meaningfully oversold.

Component 4: `decel_factor`

Suppresses falling-knife signals and boosts scores when the rate of decline is slowing.

```txt
momentum_recent = (close[29] - close[27]) / close[27]
momentum_prior = (close[27] - close[25]) / close[25]

decel_factor = clamp(1 + (momentum_prior - momentum_recent), 0.5, 1.5)
```

Edge cases:

- If `close[27] == 0`, set `decel_factor = 1.0`.
- If `close[25] == 0`, set `decel_factor = 1.0`.

Interpretation:

- If the decline is slowing, `decel_factor > 1.0`.
- If the decline is accelerating, `decel_factor < 1.0`.
- Range is capped from `0.5` to `1.5`.

Formula:

```txt
raw = (V_trend * 0.60) + (P_context * 0.40)
Score = clamp(raw * gate * decel_factor * 2, -2, +2)
```

Score interpretation:

- `+1.5` to `+2.0`: strong accumulation / seller exhaustion
- `+1.0` to `+1.5`: mild accumulation / actionable entry zone
- `-0.5` to `+1.0`: neutral or noisy
- `-0.5` to `-1.0`: mild distribution
- `-1.0` to `-2.0`: strong distribution / overbought

Important implementation notes:

- Use Wilder RSI(14).
- Take the latest RSI output value, not an index-matched array position.
- If `vol_prior` is zero, set `V_trend = 0`.
- If price range is zero, set `P_context = 0`.
- If required close values are zero, set `decel_factor = 1`.
- The signal can lag exact bottoms by 1-2 weekly candles because it is confirming stabilization, not trying to predict the bottom wick.

## 7. Refresh Cadence

Use different refresh schedules per sector.

### MVP Cadence

| Sector | Recommended refresh | Reason |
| --- | --- | --- |
| Macro crypto | Daily | Fear & Greed updates daily; BTC weekly RSI only changes on weekly close if using completed candles. |
| Macro stock | Daily on market days after close | VIX changes daily; S&P weekly RSI only changes on weekly close. |
| Relativity | Weekly after weekly candle close | It is based on completed weekly RSI divergence. |
| Volume | Weekly after weekly candle close for stable MVP | It uses weekly candles and should exclude in-progress candles for reliable production signals. |
| Composite | After any sector refresh | Recompute whenever at least one sector has a new snapshot. |
| Alerts | After composite recomputation | Evaluate only after fresh snapshots are stored. |

### Composite Staleness Rule

Tripwire combines sectors that refresh at different speeds, so every sector snapshot needs a freshness policy.

Recommended staleness windows:

| Sector | Expected cadence | Mark stale after |
| --- | --- | --- |
| Macro crypto | Daily | 36 hours |
| Macro stock | Daily on market days | 36 hours after latest expected market-day refresh |
| Relativity | Weekly | 8 days |
| Volume | Weekly | 8 days |

Composite rules:

- Recompute composite after any fresh sector update.
- Use the latest non-null, non-stale snapshots from Macro, Relativity, and Volume only.
- Composite is valid only when all three sectors are valid (3/3).
- If any sector is null, stale, or invalid, mark composite as null with `null_reason = "insufficient_valid_sectors"`.
- Store which sectors were included in `components_json` when composite is valid.
- UI should show sector-level freshness and explicitly label stale or null sectors.
- Do not silently mix stale sectors into a fresh composite.

Market-calendar handling:

- For stocks, weekly closes should use the last available trading day of the week, not assume Friday always exists.
- Stock daily macro refreshes should tolerate holidays and weekends.
- Crypto can refresh every calendar day, but weekly stable scores should still use completed weekly candles only.

### Optional Later Cadence

Once the MVP is stable:

- Volume: add a provisional daily score that includes the current in-progress weekly candle, clearly labelled as provisional.
- Alerts: run immediately after every scoring job, plus a manual test-alert action.

### cron-job.org Setup

cron-job.org should trigger HTTPS API routes deployed on Vercel.

Recommended jobs:

| cron-job.org job | Target route | Suggested schedule | Purpose |
| --- | --- | --- | --- |
| Tripwire Daily Scores | `/api/cron/score-daily` | Once daily | Refresh daily macro, recompute composite, evaluate threshold alerts. |
| Tripwire Weekly Scores | `/api/cron/score-weekly` | Once weekly after weekly candle close | Refresh Relativity and Volume, recompute composite, evaluate threshold alerts. |
| Tripwire Alert Retry | `/api/cron/evaluate-alerts` | Optional, every few hours | Re-check unsent or failed alert events without duplicating already-sent snapshot alerts. |

Security:

- Add a `CRON_SECRET` environment variable.
- Require cron-job.org to send either an `Authorization: Bearer <CRON_SECRET>` header or a secret query param.
- Prefer a header if cron-job.org configuration supports it.
- Return `401` immediately when the secret is missing or invalid.

Operational notes:

- Keep route responses small; log details to `scheduled_job_runs` instead of returning huge JSON payloads.
- Make score jobs idempotent by using `valid_for_date`, sector names, and asset IDs as uniqueness guards.
- Make alert sends idempotent per `alert_rule_id + score_snapshot_id`, while still sending again when a new scoring run creates a new qualifying snapshot.
- If a job partially fails, store successful snapshots and log failed assets for retry.
- If a scoring run grows too large for a Vercel function, split cron-job.org into batch routes such as `/api/cron/score-daily?batch=0`.

## 8. Telegram Alert System

### Shared Tripwire Bot Model

The MVP should use one shared Tripwire Telegram bot.

How it works:

1. The Tripwire owner creates one Telegram bot with BotFather, for example `@TripwireAlertsBot`.
2. Telegram gives the app owner one bot token.
3. Tripwire stores that bot token in an environment variable, not in the database.
4. Each user connects their Telegram account by starting the shared Tripwire bot.
5. Tripwire stores each user's private Telegram `chat_id`.
6. Alerts are sent to the correct user's `chat_id` using the shared bot token.

This does not create a separate bot per user. Instead, each user gets their own private 1-on-1 chat with the same Tripwire bot.

Privacy:

- User A and User B both talk to the same `@TripwireAlertsBot`.
- User A's alerts are sent only to User A's `chat_id`.
- User B's alerts are sent only to User B's `chat_id`.
- Users cannot see each other's alerts unless they intentionally share their own Telegram account or chat.

Why this is the right MVP choice:

- It is free for the expected MVP alert volume.
- It is much easier for end users.
- Users do not need to understand BotFather or API tokens.
- Tripwire only needs to protect one bot token.
- The bot can be branded as Tripwire.
- The setup flow is cleaner and more product-like.

Tradeoffs:

- The app owner is responsible for the shared bot token.
- If the shared bot token leaks, the owner must rotate it in BotFather and update the environment variable.
- All messages share the same Telegram bot rate limits.
- At large scale, paid broadcasts may exist as an option, but the MVP should stay under the free limits.

Recommended onboarding:

1. User clicks "Connect Telegram" in Tripwire.
2. Tripwire generates a short-lived `telegram_connect_code` tied to the signed-in Clerk user.
3. Tripwire opens a deep link like `https://t.me/TripwireAlertsBot?start=<connect_code>`.
4. User presses Start in Telegram.
5. Telegram sends the `/start <connect_code>` message to Tripwire's webhook.
6. Tripwire validates the connect code and stores the Telegram `chat_id` on the matching user profile.
7. Tripwire marks `telegram_verified_at`.
8. User sends a test alert from the Tripwire settings page.

Required Telegram routes:

- `/api/telegram/webhook`: receives `/start <connect_code>` updates and stores `chat_id`.
- `/api/telegram/test`: sends a test alert to the signed-in user's stored `chat_id`.

Required Telegram environment variable:

- `TELEGRAM_BOT_TOKEN`: the shared Tripwire bot token from BotFather.

Security:

- Do not store the shared bot token in Neon.
- Do not expose the shared bot token to the browser.
- Do not log the shared bot token.
- Expire unused connect codes.
- Make connect codes single-use.
- Verify that webhook updates are intended for the Tripwire bot before linking a chat.

Alert message format:

```txt
Tripwire Alert

SOL composite is above 1.50

Composite: +1.63
Macro: +1.20
Relativity: +1.50
Volume: +1.82

Reason: Your alert rule "Composite above 1.5" matched the latest score update.
```

Implementation notes:

- Use Telegram `sendMessage`.
- Store one shared bot token in Vercel environment variables.
- Store `chat_id` per user after verification.
- Send an alert every time a fresh scoring run produces a score above the user's threshold.
- Send an initial-match alert immediately when a user creates a rule that already matches the latest valid score.
- Do not require a crossing event.
- Do not send duplicates for the same score snapshot.
- Optional cooldowns can be added as a user setting later, but default behavior should match every qualifying scoring update.
- Log every send attempt.
- If Telegram returns a permanent error because the user blocked the bot or the chat is invalid, mark the user's Telegram delivery state as disconnected and stop sending alerts until they reconnect.
- Never expose another user's Telegram `chat_id`.

## 9. UI Plan

### Main Views

Dashboard:

- Watchlist overview.
- Current composite score per asset.
- Last updated time.
- Active alert count.
- Quick status for each sector.

Asset Detail:

- Header with asset name, symbol, current composite score, and score interpretation.
- Sector score row:
  - Macro
  - Relativity
  - Volume
- Each sector opens into a breakdown accordion.
- Show component values, weights, source, and last computed time.
- Show score history chart.

Alerts:

- List all alert rules.
- Create/edit alert rule modal.
- Threshold controls for composite or sector.
- Operator selector.
- Cooldown selector.
- Test Telegram alert button.

Settings:

- Connect Telegram.
- Chat ID verification.
- Test message.
- API key status for providers needed by the user.

### Score Presentation

Use consistent score colors:

- `+1.5` to `+2`: strong green
- `+1.0` to `+1.49`: muted green
- `-0.49` to `+0.99`: silver / neutral
- `-0.5` to `-0.99`: muted red
- `-1.0` to `-2`: strong red

Because Tripwire is a buy-opportunity detector, positive means more attractive / oversold. Make that clear in the UI labels.

Recommended UI language:

- `+1.5` to `+2.0`: Strong Opportunity
- `+1.0` to `+1.49`: Opportunity
- `-0.49` to `+0.99`: Neutral
- `-0.5` to `-0.99`: Caution
- `-1.0` to `-2.0`: Crowded / Overheated

Avoid using "bullish" and "bearish" as the primary labels because the app is contrarian. Positive scores mean opportunity or oversold conditions, not generic bullishness.

Freshness display:

- Show `last computed` for every sector.
- Show `stale` badges when a sector is outside its freshness window.
- Show `null` or `unavailable` badges with a short reason, such as "macro source unavailable" or "not enough candles."
- On the composite card, show which sectors were included in the current score.

## 10. API Providers

### Initial MVP Asset Universe

The app should be built to support dynamic asset search/add later, but the MVP should seed a verified starter universe so provider mapping and scoring can be tested reliably.

Initial crypto assets:

| Asset | Display symbol | Provider symbol target |
| --- | --- | --- |
| Bitcoin | `BTC` | `BTCUSDT` on Binance |
| Ethereum | `ETH` | `ETHUSDT` on Binance |
| Solana | `SOL` | `SOLUSDT` on Binance |
| Hyperliquid | `HYPE` | `HYPEUSDT` on Binance if available; otherwise mark unsupported until a free OHLCV source is chosen |
| Zcash | `ZEC` | `ZECUSDT` on Binance |

Initial stock assets:

| Asset | Display symbol | Provider symbol target |
| --- | --- | --- |
| MicroStrategy | `MSTR` | `MSTR` |
| Tesla | `TSLA` | `TSLA` |
| Nvidia | `NVDA` | `NVDA` |
| Coinbase | `COIN` | `COIN` |

Implementation note:

- This is the tested seed universe, not a permanent product limit.
- Users can add more assets later only after provider validation confirms the app can fetch enough data.
- If an asset cannot be mapped to a free provider, show a clear unsupported reason instead of failing silently.

Crypto OHLCV:

- Primary: Binance Global public REST API for weekly candles.
- Fallback: Binance US public REST API for weekly candles if Binance Global does not list the needed `USDT` pair.
- Both providers should use public market-data endpoints only; no API key should be required for OHLCV.

Crypto symbol resolution:

1. Normalize the user input to an uppercase base asset symbol, such as `SOL`.
2. Build the preferred quote pair as `<BASE>USDT`, such as `SOLUSDT`.
3. Query Binance Global exchange info and check whether the symbol exists and is actively tradable.
4. If found, store:
   - `provider_name = "binance_global"`
   - `provider_symbol = "<BASE>USDT"`
   - `quote_asset = "USDT"`
   - `resolution_status = "resolved"`
5. If not found, query Binance US exchange info for the same `<BASE>USDT` pair.
6. If found on Binance US, store:
   - `provider_name = "binance_us"`
   - `provider_symbol = "<BASE>USDT"`
   - `quote_asset = "USDT"`
   - `resolution_status = "resolved"`
7. If neither provider supports the pair, mark the asset unsupported with a clear reason.

Resolution pseudocode:

```txt
candidate = `${baseSymbol}USDT`

if binanceGlobal.exchangeInfo.hasActiveSymbol(candidate):
  return { provider: "binance_global", symbol: candidate }

if binanceUS.exchangeInfo.hasActiveSymbol(candidate):
  return { provider: "binance_us", symbol: candidate }

return {
  provider: null,
  symbol: null,
  status: "unsupported",
  reason: "No Binance Global or Binance US USDT pair found"
}
```

Crypto OHLCV fetch:

- If `provider_name = "binance_global"`, fetch klines from Binance Global.
- If `provider_name = "binance_us"`, fetch klines from Binance US.
- Use `interval=1w` and the required `limit` for the sector.
- Normalize both provider responses into the same internal candle shape.
- Store the selected provider and symbol in `source_metadata_json` on every score snapshot.

Equity OHLCV:

- Twelve Data for stock weekly candles, if free tier supports the needed weekly interval.
- FRED for VIX and S&P 500 macro data.

Macro:

- Alternative.me Fear & Greed Index.
- CoinGecko or Binance for BTC closes.
- FRED for VIX and S&P 500.

Telegram:

- Telegram Bot API.

Provider open questions:

- Confirm Twelve Data weekly equity support on the free tier before building stock relativity and stock volume.
- Confirm CoinGecko free OHLC limits and whether Binance can replace it for BTC RSI to reduce provider count.
- Because MVP includes both crypto and stocks, confirm the free stock-data path early before building the scoring engine around it.

Provider and data edge cases:

- If a crypto asset does not have a Binance Global or Binance US `USDT` pair, mark it unsupported instead of guessing another pair.
- Do not silently fall back to `USDC`, `USD`, `BTC`, or perpetual futures pairs in the MVP.
- If a symbol exists on both Binance Global and Binance US, prefer Binance Global for consistency and broader coverage.
- Cache exchange-info responses so symbol resolution does not call provider metadata endpoints repeatedly.
- If a stock provider cannot return enough weekly candles, return null for the affected sector with `null_reason = "insufficient_candles"`.
- If a provider fails for one asset, continue scoring the rest of the watchlist.
- If market data has missing candles, sort by timestamp, deduplicate, and validate minimum candle count before scoring.
- If a stock market holiday removes the Friday close, use the last available trading day in that week.
- If Alternative.me Fear & Greed data is displayed, include required attribution near the component or in a data-sources footer.
- Store provider payload metadata so bad upstream data can be audited later.

## 11. Implementation Phases

### Phase 0: Product Decisions

Status: resolved and locked in `docs/decisions/phase-0-decisions.md`.

Deliverables:

- Initial supported crypto asset list is BTC, ETH, SOL, HYPE, and ZEC. (locked)
- Initial supported stock asset list is MSTR, TSLA, NVDA, and COIN. (locked)
- Use app-owned shared provider keys for MVP. (locked)
- Use one shared Tripwire Telegram bot for MVP. (locked)
- Finalize logo concept as a dormant tripwire sensor aesthetic. (locked)

Recommendation:

- Build crypto + stocks from day one.
- Use one app-owned Tripwire Telegram bot.
- Use app-owned market-data provider keys at first.

Canonical decision record: `docs/decisions/phase-0-decisions.md`

### Phase 1: Project Foundation

Deliverables:

- Scaffold Next.js TypeScript app.
- Add Tailwind, shadcn/ui, lucide-react.
- Configure Clerk.
- Configure Neon and Drizzle.
- Add environment variable validation.
- Create base dashboard shell.
- Add dark charcoal/silver/red theme tokens.

Acceptance criteria:

- User can sign in and reach dashboard.
- Database connection works locally and on Vercel.
- Protected routes cannot be accessed while signed out.

### Phase 2: Database and Watchlist

Deliverables:

- Create Drizzle schema and migrations.
- Add assets table.
- Add user profile sync from Clerk.
- Add watchlist add/remove flows.
- Add watchlist deletion behavior that disables that user's alerts for the removed asset.
- Seed BTC, ETH, SOL, HYPE, ZEC, MSTR, TSLA, NVDA, and COIN.

Acceptance criteria:

- User can add BTC, ETH, SOL, HYPE, ZEC, MSTR, TSLA, NVDA, COIN, and other provider-validated supported assets.
- Watchlist persists per user.
- Removing an asset from the watchlist disables or archives that user's alert rules for the asset.
- Asset list and asset detail pages load from Neon.

### Phase 3: Market Data and Indicators

Deliverables:

- Build Binance OHLCV provider.
- Build Binance US OHLCV fallback provider.
- Build crypto symbol resolver:
  - Try Binance Global `<BASE>USDT`.
  - Fall back to Binance US `<BASE>USDT`.
  - Mark unsupported if neither provider has the pair.
- Build stock OHLCV provider after confirming the free source.
- Build FRED provider for VIX and S&P 500 macro data.
- Build indicator utilities:
  - RSI(14) Wilder
  - clamp
  - weekly candle normalization
- Add provider cache.
- Add unit tests for RSI output offset and score clamping.

Acceptance criteria:

- App can fetch 30 weekly candles for BTC, ETH, SOL, ZEC, and any other Binance-supported MVP crypto asset.
- HYPE resolves through Binance Global, Binance US, or is clearly marked unsupported with a reason.
- Crypto score snapshots store which provider and provider symbol were used.
- App can fetch enough weekly stock candles for MVP stock assets.
- RSI tests confirm latest output maps to latest completed candle.
- In-progress weekly candles are excluded from stable production scores.
- Missing or insufficient candles produce null sector snapshots with clear null reasons.

### Phase 4: Scoring Engine

Deliverables:

- Implement Macro crypto score.
- Implement Macro stock score.
- Implement Relativity score.
- Implement Volume score.
- Implement composite averaging.
- Store snapshots and component breakdowns.

Acceptance criteria:

- Each watched crypto and stock asset has Macro, Relativity, Volume, and Composite snapshots.
- Asset detail UI can show each sector and its breakdown.
- Composite is valid only when all three sectors are valid (3/3); otherwise null with `insufficient_valid_sectors`.

### Phase 5: Alerts and Telegram

Deliverables:

- Shared Tripwire bot setup with BotFather.
- Telegram connect-code flow.
- Telegram webhook route.
- Chat ID verification.
- Alert rule CRUD.
- Alert evaluation engine.
- Telegram sendMessage integration.
- Alert event logging and duplicate prevention.

Acceptance criteria:

- User can click Connect Telegram and start the shared Tripwire bot.
- Tripwire links the Telegram chat to the signed-in Clerk user.
- User can send a test Telegram alert.
- User can create a rule like "Macro above 1.5".
- Creating a rule immediately sends an initial-match alert if the latest score already qualifies.
- Alert sends when a fresh score update is above the threshold.
- Alert sends again on the next fresh scoring run if the score is still above the threshold.
- Duplicate sends are prevented for the same alert rule and same score snapshot.
- Alert storm caps prevent more than 10 alerts per user per scoring run and more than 20 Telegram messages globally per minute by default.
- If Telegram reports that a user blocked the bot or has an invalid chat, Tripwire marks Telegram disconnected for that user.

### Phase 6: Scheduled Jobs

Deliverables:

- `/api/cron/score-daily`
- `/api/cron/score-weekly`
- `/api/cron/evaluate-alerts`
- cron-job.org job setup.
- Secret header protection for cron routes.
- Job logs table or structured logs.
- Idempotency checks so repeated cron calls do not duplicate score snapshots or alerts.

Acceptance criteria:

- Daily job refreshes Macro.
- Weekly job refreshes Relativity and Volume.
- Composite is recomputed after sector updates.
- Stale sectors are excluded from fresh composite calculations.
- Alert evaluation runs after score updates and sends threshold-matching alerts.
- cron-job.org can successfully call each protected route in production.

### Phase 7: UI Polish and Explainability

Deliverables:

- Asset detail score accordions.
- Component-level explanations.
- Score history charts.
- Alert history timeline.
- Empty states.
- Loading and error states.
- Logo and favicon.

Acceptance criteria:

- A user can understand why an asset received its score.
- Sector dropdowns expose the exact component values and weights.
- UI clearly distinguishes stable vs provisional scores if provisional scores are added.

### Phase 8: Production Hardening

Deliverables:

- Rate-limit API routes.
- Add provider failure handling.
- Add retry policies.
- Add observability.
- Add backup/export path for user alert rules.
- Add privacy/security review for Telegram tokens.

Acceptance criteria:

- Provider outages do not crash scoring runs.
- Failed sectors are logged and marked stale/null.
- No raw Telegram tokens appear in logs or UI.

## 12. Environment Variables

```txt
DATABASE_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

CRON_SECRET=
MAX_ALERTS_PER_USER_PER_RUN=10
MAX_TELEGRAM_MESSAGES_PER_MINUTE=20

TELEGRAM_BOT_TOKEN=

FRED_API_KEY=
TWELVE_DATA_API_KEY=
```

The MVP uses one shared Tripwire Telegram bot. Store `TELEGRAM_BOT_TOKEN` as an environment variable and store only each user's Telegram `chat_id` in the database.

## 13. Testing Plan

Unit tests:

- RSI(14) Wilder output.
- Relativity formula.
- Volume score formula and edge cases.
- Macro threshold mapping.
- Composite averaging with strict 3/3 valid sectors.
- Composite staleness exclusion.
- Alert rule operators.
- Duplicate-prevention logic for `alert_rule_id + score_snapshot_id`.
- Initial-match alert behavior.
- Alert storm cap behavior.
- Watchlist deletion disabling related alerts.
- Telegram permanent delivery failure handling.

Integration tests:

- Add asset to watchlist.
- Run scoring job for an asset.
- Store score snapshots.
- Composite is null when any sector is null or stale.
- Exclude stale sectors from composite.
- Evaluate alert rule.
- Create a new alert that immediately matches the latest score.
- Send Telegram test alert with mocked Telegram API.

Manual QA:

- Sign up / sign in.
- Add asset.
- View asset detail.
- Expand sector breakdown.
- Create alert rule.
- Confirm initial-match alert sends when the latest score is already above threshold.
- Confirm repeated fresh qualifying scores send repeated alerts.
- Confirm duplicate alerts are not sent for the same score snapshot.
- Confirm alert storm safety skips excess alerts and logs them.
- Verify Telegram setup.
- Trigger test alert.

## 14. Key Risks

Vercel Function duration:

- Large scoring runs may exceed function limits.
- Mitigation: batch assets, split daily/weekly jobs, add a durable job queue if needed.

Provider limits:

- Free market-data APIs can change limits or availability.
- Mitigation: abstract providers behind interfaces and cache aggressively.

Mixed-cadence freshness:

- Daily and weekly sectors can drift out of sync.
- Mitigation: mark stale sectors, exclude stale sectors from fresh composites, and show freshness in the UI.

Alert storms:

- Level-based alerts can create many messages when several assets qualify in the same scoring run.
- Mitigation: per-user and global message caps, duplicate prevention, and skipped-alert logging.

Telegram token security:

- The shared Tripwire bot token is sensitive.
- Mitigation: keep it in environment variables, redact logs, never expose it to the browser, and rotate it in BotFather if it leaks.

Signal interpretation:

- Positive scores mean oversold/opportunity, which can be counterintuitive.
- Mitigation: label the UI clearly around "opportunity score" rather than generic bullish/bearish language.

Provider outages:

- Binance, FRED, Twelve Data, and other free market-data providers may be unavailable.
- Mitigation: return null sector snapshots with reasons, keep scoring unaffected sectors, and avoid using stale failed sectors silently.

## 15. MVP Recommendation

Build the first version with crypto and stocks:

- Crypto assets: Bitcoin (`BTC`), Ethereum (`ETH`), Solana (`SOL`), Hyperliquid (`HYPE`), and Zcash (`ZEC`).
- Stock assets: MicroStrategy (`MSTR`), Tesla (`TSLA`), Nvidia (`NVDA`), and Coinbase (`COIN`).
- Sectors: Macro, Relativity, and Volume.
- Alerts: composite and sector threshold alerts where each qualifying fresh score update sends a Telegram message.
- Telegram: one shared Tripwire bot with per-user verified chat IDs.
- Deployment: Vercel app with cron-job.org triggering daily and weekly scoring routes.

This gets the core Tripwire loop working quickly:

```txt
watchlist -> scoring snapshots -> composite score -> alert rule -> Telegram notification
```

After the core loop is reliable, expand the supported asset universe and harden provider reliability.
