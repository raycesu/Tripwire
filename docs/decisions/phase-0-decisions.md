# Phase 0 Decisions Lock-In

This document is the canonical decision record for Phase 0.
It resolves the open product-decision items from `IMPLEMENTATION_PLAN.md` and sets the baseline for Phase 1 execution.

## Decision Summary

## 1) MVP Asset Universe (Locked)

- **Crypto**: `BTC`, `ETH`, `SOL`, `HYPE`, `ZEC`
- **Stocks**: `MSTR`, `TSLA`, `NVDA`, `COIN`

**Rationale**
- Keeps MVP focused with a high-signal starter set across crypto and equities
- Aligns with the tested universe defined in the implementation roadmap
- Reduces provider-symbol and data-quality ambiguity during early scoring engine work

**Revisit Trigger**
- Revisit after Phase 4 and Phase 6 once scoring + alerts are stable and provider reliability has been validated in production-like runs

## 2) Provider/API Key Ownership (Locked)

- **Decision**: App-owned shared provider keys for MVP

**Rationale**
- Lowest friction onboarding for users
- Allows consistent provider behavior, limits, and diagnostics across all accounts
- Simplifies support and observability while core scoring and alert loops are still being hardened

**Revisit Trigger**
- Revisit when introducing advanced tiers, tenant isolation requirements, or compliance constraints that require per-user credential ownership

## 3) Telegram Architecture (Locked)

- **Decision**: One shared Tripwire Telegram bot for MVP
- Store one `TELEGRAM_BOT_TOKEN` in environment variables
- Store per-user Telegram `chat_id` in database after connect-code verification

**Rationale**
- Fastest path to reliable alert delivery with minimal setup burden for end users
- Fits MVP scale and cost profile
- Matches planned connect-code onboarding and duplicate-prevention model

**Revisit Trigger**
- Revisit if message volume or operational constraints require more advanced routing, segmentation, or bot strategy

## 4) Logo + Visual Direction (Locked)

- **Decision**: Dormant tripwire sensor concept
- Default mark should feel inactive/asleep (dim red line + muted detection node), not alarmed
- Alert state can brighten red accents only in active alert contexts

**Rationale**
- Matches product metaphor (monitoring system waiting for threshold events)
- Reinforces operational dashboard tone instead of loud marketing branding

**Revisit Trigger**
- Revisit during Phase 8 UI polish after live in-app alert flows can be visually tested end-to-end

## Phase 1 Readiness Checklist

The following must be in place before Phase 1 can be considered complete:

- [ ] Next.js App Router + TypeScript foundation scaffolded
  - Maps to Phase 1 deliverable: scaffold app
- [ ] Tailwind + shadcn/ui + lucide stack installed and working
  - Maps to Phase 1 deliverable: UI foundation
- [ ] Clerk authentication integrated for App Router
  - Maps to Phase 1 deliverable: auth configured
- [ ] Neon + Drizzle connection configured for local and Vercel environments
  - Maps to Phase 1 deliverable: database configured
- [ ] Zod-based environment variable validation added for required secrets and provider keys
  - Maps to Phase 1 deliverable: env validation
- [ ] Baseline dashboard shell route exists behind auth
  - Maps to Phase 1 deliverable: base dashboard shell
- [ ] Dark charcoal/silver/red theme tokens defined and applied to shell primitives
  - Maps to Phase 1 deliverable: theme tokens

### Acceptance Criteria Mapping

- **User can sign in and reach dashboard**
  - Satisfied by Clerk integration + protected dashboard shell route
- **Database connection works locally and on Vercel**
  - Satisfied by Neon/Drizzle integration + env validation for both environments
- **Protected routes cannot be accessed while signed out**
  - Satisfied by server-side auth guards and middleware/layout protection strategy

## Notes

- This decision file is the Phase 0 source of truth.
- If roadmap language conflicts with this file, this file governs until explicitly revised.
