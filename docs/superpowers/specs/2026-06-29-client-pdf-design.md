# Client PDF Quote — Design

**Date:** 2026-06-29
**Status:** Approved

## Goal

A client-facing PDF export of the mirror quote that shows **material prices with
markup** and the **diagram**, but never reveals internal data (себестоимость,
прибыль, маржа, запас на брак, наценка as separate lines).

## Document contents

1. **Header** — title «Расчёт стоимости зеркала», auto date, editable
   **Имя клиента** + **Телефон** fields (entered on the page before export).
2. **Specs** — outer size and mirror size.
3. **Materials** — each material (Зеркало, Багет, Еврокромка, Декор-плитка, …)
   with a **client price** (with markup). Zero-cost lines omitted.
4. **Totals** — Изделие, Доставка, Монтаж (if included), Итого, and
   «К оплате (округлённо)» = `totalRounded` (round up to 500 ₸).
5. **Diagram** — current SVG diagram embedded as a raster image.

## Client price math

Material breakdown is stored at cost. To present client prices without exposing
cost, scale each line by:

```
factor = (1 + wastePct/100) * (1 + markupPct/100)
clientLine = matCostLine * factor
```

Sum of client lines == `productClient` (the «Изделие» subtotal). Waste and markup
are folded into per-material prices, never shown as separate lines. Lines are
rounded to whole ₸; the «Изделие» subtotal equals the sum of the rounded lines so
the column reconciles.

## Architecture

- `src/clientQuote.ts` — pure `buildClientQuote(params, settings, geom, cost)`
  returning `{ specs, lines: {name, amount}[], productClient, delivery, montage,
  total, totalRounded }`. No jsPDF. Unit-tested.
- `src/clientPdf.ts` — renders the quote to PDF via jsPDF. Loaded via dynamic
  import so jsPDF + font land in a separate chunk, off the initial bundle.
- `src/components/ClientExport.tsx` — card in the right column with Имя/Телефон
  inputs and a «PDF для клиента» button.

## Technical notes

- **Cyrillic:** jsPDF built-in fonts are not Unicode. Embed Roboto TTF
  (Apache 2.0, full Cyrillic) via `addFileToVFS`/`addFont`. Font asset is fetched
  at click time (Vite `?url` import), not bundled as base64 source.
- **Diagram:** the SVG uses a `<mask>`; vector SVG→PDF converters mishandle masks.
  Rasterize SVG → canvas → PNG and `addImage`. `MirrorDiagram` accepts an
  `svgRef` so the export can serialize the live node.

## Testing

- Unit tests on `buildClientQuote`: sum of lines == `productClient`; no cost/
  profit/margin fields leak into the returned data; zero lines dropped.
- jsPDF rendering verified manually by exporting a real PDF.

## Out of scope

- Master/company branding block (chose client fields only).
- Persisting client name/phone (per-client, left empty each time).
