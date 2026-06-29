import { describe, it, expect } from 'vitest';
import { calcGeometry, calcCost } from './calc';
import { buildClientQuote } from './clientQuote';
import { DEFAULT_PARAMS, DEFAULT_SETTINGS, type OrderParams, type Settings } from './state';

const P = DEFAULT_PARAMS;
const S = DEFAULT_SETTINGS;

function quote(params: OrderParams = P, settings: Settings = S) {
  const g = calcGeometry(params, settings);
  const c = calcCost(params, settings, g);
  return { q: buildClientQuote(params, settings, g, c), g, c };
}

describe('buildClientQuote', () => {
  it('sum of material lines equals productClient', () => {
    const { q } = quote();
    const sum = q.lines.reduce((a, l) => a + l.amount, 0);
    expect(sum).toBe(q.productClient);
  });

  it('client material prices carry markup (above raw cost)', () => {
    const { q, c } = quote();
    const factor = (1 + S.wastePct / 100) * (1 + S.markupPct / 100);
    const mirrorLine = q.lines.find(l => l.name === 'Зеркало');
    expect(mirrorLine).toBeDefined();
    // Allocation may shift a single line by at most 1 ₸ from its raw value.
    expect(Math.abs(mirrorLine!.amount - c.mat['Зеркало'] * factor)).toBeLessThanOrEqual(1);
    expect(mirrorLine!.amount).toBeGreaterThan(c.mat['Зеркало']);
  });

  it('productClient equals the app productClient, rounded', () => {
    const { q, c } = quote();
    expect(q.productClient).toBe(Math.round(c.productClient));
  });

  it('drops zero-cost material lines', () => {
    const settings: Settings = {
      ...S, pPaint: 0, pGlue: 0, pMount: 0, pMisc: 0,
    };
    const { q } = quote(P, settings);
    const names = q.lines.map(l => l.name);
    expect(names).not.toContain('Краска');
    expect(names).not.toContain('Клей');
    expect(names).not.toContain('Крепёж');
    expect(names).not.toContain('Расходники');
  });

  it('includes euro-edge line at client price', () => {
    const { q } = quote();
    expect(q.lines.some(l => l.name === 'Еврокромка')).toBe(true);
  });

  it('total and К оплате match the engine', () => {
    const params: OrderParams = { ...P, inclDeliv: true, inclInst: true };
    const { q, c } = quote(params);
    expect(q.delivery).toBe(S.pDeliv);
    expect(q.montage).toBe(S.pInst);
    expect(q.total).toBe(Math.round(c.totalClient));
    expect(q.totalRounded).toBe(c.totalRounded);
  });

  it('includes labour from cost in the quote', () => {
    const { q, c } = quote();
    expect(q.work).toBe(Math.round(c.work));
    expect(q.work).toBeGreaterThan(0);
  });

  it('totalRounded is a multiple of 500 and >= total', () => {
    const { q } = quote();
    expect(q.totalRounded % 500).toBe(0);
    expect(q.totalRounded).toBeGreaterThanOrEqual(q.total);
    expect(q.totalRounded - q.total).toBeLessThan(500);
  });

  it('exposes sizes as formatted strings', () => {
    const { q, g } = quote();
    expect(q.outerSize).toBe(`${P.outW}×${P.outH} мм`);
    expect(q.mirrorSize).toBe(`${g.mirW}×${g.mirH} мм`);
  });

  it('does not leak cost/profit/margin fields', () => {
    const { q } = quote();
    expect(q).not.toHaveProperty('productCost');
    expect(q).not.toHaveProperty('profit');
    expect(q).not.toHaveProperty('margin');
    expect(q).not.toHaveProperty('matSub');
    expect(q).not.toHaveProperty('wasteAmt');
  });
});
