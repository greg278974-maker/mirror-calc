import { describe, it, expect } from 'vitest';
import { calcGeometry, calcCost } from './calc';
import { buildClientQuote } from './clientQuote';
import { DEFAULT_PARAMS, DEFAULT_SETTINGS, type OrderParams, type Settings } from './state';

// Deterministic LCG so the fuzz run is reproducible across machines/CI.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// The client quote is a presentation of the engine's numbers. It must never
// disagree with what the app shows the owner. These are the cross-document
// invariants: the same Изделие, the same "К оплате", and a reconciled column.
describe('client quote ↔ engine consistency (fuzz)', () => {
  it('agrees with calcCost across randomized inputs', () => {
    const r = rng(20260629);
    const mismatches: string[] = [];

    for (let i = 0; i < 800; i++) {
      const params: OrderParams = {
        outW: 200 + Math.floor(r() * 1800),
        outH: 200 + Math.floor(r() * 1800),
        tileRows: Math.floor(r() * 4),
        inclDeliv: r() < 0.5,
        inclInst: r() < 0.5,
      };
      // Randomize every price as a non-round float to stress per-line rounding.
      const s: Settings = {
        ...DEFAULT_SETTINGS,
        pMirror: 1000 + r() * 14000.37,
        pTile: 100 + r() * 1900.51,
        pBagOut: 500 + r() * 5000.13,
        pBagIn: 300 + r() * 3000.29,
        pEuroEdge: 100 + r() * 900.77,
        pBase: 500 + r() * 4000.19,
        pPaint: r() * 1500.41,
        pGlue: r() * 1200.61,
        pMount: r() * 900.23,
        pMisc: r() * 800.83,
        pDeliv: Math.round(r() * 5000),
        pInst: Math.round(r() * 6000),
        pWorkBase: r() * 10000.47,
        pWorkM2: r() * 12000.91,
        wastePct: r() * 25,
        markupPct: 20 + r() * 180,
      };

      const g = calcGeometry(params, s);
      const c = calcCost(params, s, g);
      const q = buildClientQuote(params, s, g, c);

      // Engine-internal reconciliation: whole tenge, subtotals add up.
      const matSum = Object.values(c.mat).reduce((a, b) => a + b, 0);
      if (matSum !== c.matSub) mismatches.push(`#${i} matSub ${matSum} != ${c.matSub}`);
      if (c.productCost !== c.matSub + c.wasteAmt)
        mismatches.push(`#${i} productCost != matSub+waste`);
      if (c.totalClient !== c.productClient + c.work + c.delivery + c.montage)
        mismatches.push(`#${i} totalClient != pieces`);

      const lineSum = q.lines.reduce((a, l) => a + l.amount, 0);

      // Изделие shown in the PDF must equal the app's productClient.
      if (q.productClient !== Math.round(c.productClient))
        mismatches.push(`#${i} Изделие ${q.productClient} != ${Math.round(c.productClient)}`);
      // Itemized lines must reconcile to that subtotal.
      if (lineSum !== q.productClient)
        mismatches.push(`#${i} lines ${lineSum} != Изделие ${q.productClient}`);
      // "К оплате" in the PDF must equal the app's rounded total exactly.
      if (q.totalRounded !== c.totalRounded)
        mismatches.push(`#${i} К оплате ${q.totalRounded} != app ${c.totalRounded}`);
      if (q.totalRounded % 500 !== 0)
        mismatches.push(`#${i} К оплате ${q.totalRounded} not multiple of 500`);
      if (q.lines.some(l => l.amount < 0))
        mismatches.push(`#${i} negative line`);
    }

    expect(mismatches.slice(0, 10)).toEqual([]);
  });

  it('default order is fully consistent', () => {
    const g = calcGeometry(DEFAULT_PARAMS, DEFAULT_SETTINGS);
    const c = calcCost(DEFAULT_PARAMS, DEFAULT_SETTINGS, g);
    const q = buildClientQuote(DEFAULT_PARAMS, DEFAULT_SETTINGS, g, c);
    expect(q.productClient).toBe(Math.round(c.productClient));
    expect(q.lines.reduce((a, l) => a + l.amount, 0)).toBe(q.productClient);
    expect(q.totalRounded).toBe(c.totalRounded);
  });
});
