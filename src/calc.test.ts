import { describe, it, expect } from 'vitest';
import { calcGeometry, calcCost } from './calc';
import { DEFAULT_PARAMS, DEFAULT_SETTINGS, type OrderParams, type Settings } from './state';

// Defaults: outW=600mm, outH=600mm, tileRows=1
// frameOut=50mm, frameIn=20mm, tileW=10cm(100mm), tileH=10cm(100mm)
// → mirW = mirH = 600 - 2*50 - 2*1*100 - 2*20 = 260mm
const P = DEFAULT_PARAMS;
const S = DEFAULT_SETTINGS;

describe('calcGeometry', () => {
  it('computes derived mirror size from outer size and tile rows', () => {
    const g = calcGeometry(P, S);
    // mirW = 600 - 2*50 - 2*100 - 2*20 = 260
    expect(g.mirW).toBe(260);
    expect(g.mirH).toBe(260);
  });

  it('computes mirror area in m²', () => {
    const g = calcGeometry(P, S);
    expect(g.mirArea).toBeCloseTo((260 * 260) / 1_000_000); // 0.0676 m²
  });

  it('computes base area in m²', () => {
    const g = calcGeometry(P, S);
    expect(g.baseArea).toBeCloseTo((600 * 600) / 1_000_000); // 0.36 m²
  });

  it('computes outer perimeter in lin.m', () => {
    const g = calcGeometry(P, S);
    expect(g.perimOut).toBeCloseTo(2 * (600 + 600) / 1000); // 2.4 m
  });

  it('computes inner perimeter in lin.m', () => {
    const g = calcGeometry(P, S);
    expect(g.perimIn).toBeCloseTo(2 * (260 + 260) / 1000); // 1.04 m
  });

  it('computes band area correctly', () => {
    // bandOuterW = 600 - 2*50 = 500mm, bandOuterH = 500mm
    // mirW=260 → bandInnerW = 260 + 2*20 = 300mm, bandInnerH = 300mm
    // bandArea = 500*500 - 300*300 = 250000 - 90000 = 160000 mm²
    const g = calcGeometry(P, S);
    expect(g.bandArea).toBeCloseTo(160000);
  });

  it('computes auto tiles (ceiling of band/tileArea)', () => {
    // tileArea = 100mm * 100mm = 10000mm²
    // autoTiles = ceil(160000 / 10000) = 16
    const g = calcGeometry(P, S);
    expect(g.autoTiles).toBe(16);
    expect(g.tiles).toBe(16);
  });

  it('inner frame edge aligns with tile grid (tileRows=2)', () => {
    const params: OrderParams = { ...P, tileRows: 2 };
    const g = calcGeometry(params, S);
    // mirW = 600 - 100 - 400 - 40 = 60
    expect(g.mirW).toBe(60);
    // bandInnerW = 60 + 40 = 100; bandOuterW = 500
    // inner frame starts exactly at 2 tile widths from band outer edge: fo + 2*100 = 250 from each side
    expect(g.bandInnerW).toBe(100);
  });

  it('bandArea is 0 when tileRows=0 (mirror fills tile band)', () => {
    // tileRows=0 → mirW = 600 - 100 - 0 - 40 = 460
    // bandInnerW = 460 + 40 = 500 = bandOuterW → bandArea = 0
    const params: OrderParams = { ...P, tileRows: 0 };
    const g = calcGeometry(params, S);
    expect(g.bandArea).toBe(0);
  });

  it('mirW clamps to 0 when tileRows is too large', () => {
    // tileRows=3 → mirW = 600 - 100 - 600 - 40 = -140 → clamped to 0
    const params: OrderParams = { ...P, tileRows: 3 };
    const g = calcGeometry(params, S);
    expect(g.mirW).toBe(0);
    expect(g.mirH).toBe(0);
  });

  it('handles zero tile size without divide by zero', () => {
    const settings: Settings = { ...S, tileW: 0, tileH: 0 };
    const g = calcGeometry(P, settings);
    expect(g.autoTiles).toBe(0);
  });

  it('exposes frame dimensions in mm', () => {
    const g = calcGeometry(P, S);
    expect(g.fo).toBeCloseTo(50); // frameOut=50mm
    expect(g.fi).toBeCloseTo(20); // frameIn=20mm
  });

  it('counts baguette in whole 2 m sticks (ceil of perimeter / 2)', () => {
    const g = calcGeometry(P, S);
    // perimOut = 2.4 m → ceil(2.4/2) = 2 sticks
    expect(g.bagOutPcs).toBe(2);
    // perimIn = 1.04 m → ceil(1.04/2) = 1 stick
    expect(g.bagInPcs).toBe(1);
  });

  it('needs zero inner sticks when mirror collapses to 0', () => {
    const params: OrderParams = { ...P, tileRows: 3 };
    const g = calcGeometry(params, S);
    expect(g.perimIn).toBe(0);
    expect(g.bagInPcs).toBe(0);
  });
});

describe('calcCost', () => {
  it('computes material cost for mirror', () => {
    const g = calcGeometry(P, S);
    const r = calcCost(P, S, g);
    expect(r.mat['Зеркало']).toBeCloseTo(g.mirArea * S.pMirror);
  });

  it('computes tile cost', () => {
    const g = calcGeometry(P, S);
    const r = calcCost(P, S, g);
    expect(r.mat['Плитка декор']).toBeCloseTo(g.tiles * S.pTile);
  });

  it('prices baguette per stick, not per metre', () => {
    const g = calcGeometry(P, S);
    const r = calcCost(P, S, g);
    expect(r.mat['Багет наружный']).toBeCloseTo(g.bagOutPcs * S.pBagOut);
    expect(r.mat['Багет внутр.']).toBeCloseTo(g.bagInPcs * S.pBagIn);
  });

  it('adds waste percentage to materials', () => {
    const g = calcGeometry(P, S);
    const r = calcCost(P, S, g);
    expect(r.wasteAmt).toBeCloseTo(r.matSub * S.wastePct / 100);
    expect(r.productCost).toBeCloseTo(r.matSub + r.wasteAmt);
  });

  it('applies markup to get client product price', () => {
    const g = calcGeometry(P, S);
    const r = calcCost(P, S, g);
    expect(r.productClient).toBeCloseTo(r.productCost * (1 + S.markupPct / 100));
  });

  it('adds delivery when inclDeliv=true', () => {
    const params: OrderParams = { ...P, inclDeliv: true };
    const g = calcGeometry(params, S);
    const r = calcCost(params, S, g);
    expect(r.delivery).toBe(S.pDeliv);
    expect(r.totalClient).toBeCloseTo(r.productClient + S.pDeliv);
  });

  it('does not add delivery when inclDeliv=false', () => {
    const g = calcGeometry(P, S);
    const r = calcCost(P, S, g);
    expect(r.delivery).toBe(0);
  });

  it('adds montage when inclInst=true', () => {
    const params: OrderParams = { ...P, inclInst: true };
    const g = calcGeometry(params, S);
    const r = calcCost(params, S, g);
    expect(r.montage).toBe(S.pInst);
  });

  it('rounds total up to nearest 500', () => {
    const g = calcGeometry(P, S);
    const r = calcCost(P, S, g);
    expect(r.totalRounded % 500).toBe(0);
    expect(r.totalRounded).toBeGreaterThanOrEqual(r.totalClient);
    expect(r.totalRounded - r.totalClient).toBeLessThan(500);
  });

  it('profit = productClient - productCost (no services)', () => {
    const g = calcGeometry(P, S);
    const r = calcCost(P, S, g);
    expect(r.profit).toBeCloseTo(r.productClient - r.productCost);
  });

  it('margin = profit/productClient * 100', () => {
    const g = calcGeometry(P, S);
    const r = calcCost(P, S, g);
    expect(r.margin).toBeCloseTo(r.profit / r.productClient * 100);
  });

  it('margin is 0 when productClient is 0', () => {
    const params: OrderParams = { ...P, outW: 0, outH: 0 };
    const settings: Settings = { ...S, pPaint: 0, pGlue: 0, pMount: 0, pMisc: 0 };
    const g = calcGeometry(params, settings);
    const r = calcCost(params, settings, g);
    expect(r.margin).toBe(0);
  });
});
