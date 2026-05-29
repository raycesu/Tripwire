# Telegram Bot Token Security

Tripwire uses one shared Telegram bot. The bot token is highly sensitive.

## Storage

- Set `TELEGRAM_BOT_TOKEN` in Vercel (or `.env.local` for development).
- Set `TELEGRAM_WEBHOOK_SECRET` for webhook verification.
- Never commit tokens to git or expose them in client-side code.

## If the token leaks

1. Open [@BotFather](https://t.me/BotFather) and revoke/regenerate the bot token.
2. Update `TELEGRAM_BOT_TOKEN` in Vercel for Production (and Preview if used).
3. Redeploy the app.
4. Re-register the Telegram webhook with the new token and the same `TELEGRAM_WEBHOOK_SECRET` header value.
5. Ask users to reconnect only if delivery failures persist (usually unnecessary after rotation).

## Logging rules

- Do not log `sendMessage` request URLs (they embed the token).
- Log masked `chat_id` suffixes only when needed for support.
- User-facing errors must not include Telegram API URLs or token fragments.

## User data

- Alerts are sent to each user's private `chat_id` only.
- Exporting alert rules never includes Telegram identifiers.
