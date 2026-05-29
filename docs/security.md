# Tripwire Security Notes

## Secrets storage

- `TELEGRAM_BOT_TOKEN`, `CRON_SECRET`, `FRED_API_KEY`, `TWELVE_DATA_API_KEY`, and `CLERK_SECRET_KEY` live in server environment variables only.
- Never add `NEXT_PUBLIC_*` variants for provider or bot secrets.
- User Telegram `chat_id` values are stored in Neon per user; the shared bot token is not stored in the database.

## Logging

- Structured logs use `src/lib/logging/logger.ts` with `redactSecrets()` applied before output.
- Telegram bot API URLs and env secret values are replaced with `[REDACTED]`.
- Webhook handlers log connect-code prefixes only, not full Telegram update payloads.

## API abuse protection

- Authenticated mutation routes use Neon-backed rate limits (`api_rate_limits` table).
- Cron routes require `CRON_SECRET` via `Authorization: Bearer` or query param.
- Telegram webhook requires `x-telegram-bot-api-secret-token`.

## Audit checklist

1. `rg TELEGRAM_BOT_TOKEN src` — token reference should appear only in server modules and tests with mocks.
2. `npm run build` — confirm `.next` client bundles do not contain the bot token string.
3. Confirm API 5xx responses never echo upstream provider URLs with embedded credentials.

See [telegram-security.md](./telegram-security.md) for bot token rotation.
