# Tripwire Visual Direction (Phase 0)

This brief defines visual guardrails for implementation phases.
It aligns UI and brand decisions with the contrarian scoring model.

## Brand Intent

- Product feel: dark operational monitoring dashboard
- Emotional tone: calm, watchful, precise
- Default state: dormant system awaiting threshold triggers

## Color Direction

- **Background**: charcoal / deep gray
- **Primary surfaces**: silver-gray neutrals
- **Primary accent**: alert red
- **Positive score accent**: cool green
- **Negative score accent**: red
- **Neutral score accent**: muted silver

Use strong contrast for readability, especially in dense table/card views.

## Score Color Semantics

- `+1.5` to `+2.0`: Strong Opportunity (strong green)
- `+1.0` to `+1.49`: Opportunity (muted green)
- `-0.49` to `+0.99`: Neutral (silver)
- `-0.5` to `-0.99`: Caution (muted red)
- `-1.0` to `-2.0`: Crowded / Overheated (strong red)

## Logo Guardrails

- Base logo concept: dormant tripwire sensor
- Visual motif: dim red sensor line + sleeping node / low-power detector
- Default mark should look inactive, not actively alarming
- Active-alert moments may temporarily brighten red accents in UI or micro-interactions

## Copy and Labeling Rules

Preferred score labels:

- Strong Opportunity
- Opportunity
- Neutral
- Caution
- Crowded / Overheated

Avoid these as primary interpretation labels:

- "bullish"
- "bearish"

Reason: Tripwire is contrarian, and positive values represent oversold opportunity rather than generic bullish momentum.

## UX Guardrails for Future Phases

- Always show numeric score and interpretation label together
- Show sector freshness (`last computed`, `stale`, `null`) explicitly
- Never hide unavailable data; display concise reason badges
- Keep dashboard density high enough for repeated monitoring, without sacrificing legibility
