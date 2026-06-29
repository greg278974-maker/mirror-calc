# Labor Price («Работа») — Design

**Date:** 2026-06-29
**Status:** Approved

## Goal

Add an explicit labour price to the quote. Until now the 100% markup implicitly
covered labour; this makes it a transparent, separately-priced line.

## Decisions

- **Role:** a separate client-facing line (like delivery/montage), **not marked up**.
  The 100% markup stays on materials only.
- **Formula:** `work = pWorkBase + baseArea_m² × pWorkM2`
  (baseArea = outer panel area, outW×outH). Always included in the order — no
  toggle. When both settings are 0 the line is hidden where `work > 0` is guarded.
- **Margin:** «Прибыль с изделия» / маржа stay product-only (materials), unchanged.
  Work — like delivery/montage — is not part of that figure.

## Money flow

```
materials → +waste → productCost → ×markup → productClient (ИЗДЕЛИЕ)
totalClient = productClient + work + delivery + montage
totalRounded = ceil(totalClient / 500) * 500
```

## Changes by file

- `state.ts` — `pWorkBase` (₸/order) and `pWorkM2` (₸/m²) + defaults
  (placeholder: base 5000, per-m² 8000).
- `calc.ts` — `CostResult.work`; `calcCost` computes work and adds it to
  `totalClient`. `profit`/`margin` unchanged.
- `SettingsPanel.tsx` — new «Работа» subsection: «База (за заказ)» + «За м²».
- `ResultPanel.tsx` — «Работа» line in «Состав заказа» (when `work > 0`).
- `clientQuote.ts` — `ClientQuote.work`; `total` includes work.
- `clientPdf.ts` — «Работа» totals line between «Изделие» and «Итого».

## Testing

- `calc`: work == base + baseArea×rate; totalClient includes work; margin/profit
  unchanged by work.
- `clientQuote`: total == productClient + work + delivery + montage; work exposed.

## Out of scope

- A combined «total profit» figure that folds in work/services.
- Per-hour labour pricing.
