import { describe, it, expect } from 'vitest';
import { calcGeometry, calcCost } from './calc';
import { DEFAULT_PARAMS, DEFAULT_SETTINGS, type OrderParams, type Settings } from './state';

const P = DEFAULT_PARAMS;
const S = DEFAULT_SETTINGS;

describe('calcGeometry', () => {
  it('computes mirror area in m²', () => {
    const g = calcGeometry(P, S);
    expect(g.mirArea).toBeCloseTo((30 * 30) / 10000); // 0.09
  });

  it('computes base area in m²', () => {
    const g = calcGeometry(P, S);
    expect(g.baseArea).toBeCloseTo((60 * 60) / 10000); // 0.36
  });

  it('computes outer perimeter in lin.m', () => {
    const g = calcGeometry(P, S);
    expect(g.perimOut).toBeCloseTo(2 * (60 + 60) / 100); // 2.4
  });

  it('computes inner perimeter in lin.m', () => {
    const g = calcGeometry(P, S);
    expect(g.perimIn).toBeCloseTo(2 * (30 + 30) / 100); // 1.2
  });

  it('computes band area correctly', () => {
    // fo = 50/10 = 5cm, fi = 20/10 = 2cm
    // bandOuterW = 60 - 2*5 = 50, bandOuterH = 50
    // bandInnerW = 30 + 2*2 = 34, bandInnerH = 34
    // bandArea = 50*50 - 34*34 = 2500 - 1156 = 1344 cm²
    const g = calcGeometry(P, S);
    expect(g.bandArea).toBeCloseTo(1344);
  });

  it('computes auto tiles (ceiling of band/tile)', () => {
    // tileArea = 10*10 = 100 cm², bandArea = 1344
    // autoTiles = ceil(1344/100) = 14
    const g = calcGeometry(P, S);
    expect(g.autoTiles).toBe(14);
  });

  it('uses manual tile count when tileMode=manual', () => {
    const params: OrderParams = { ...P, tileMode: 'manual', tilesManual: 20 };
    const g = calcGeometry(params, S);
    expect(g.tiles).toBe(20);
  });

  it('uses auto tile count when tileMode=auto', () => {
    const g = calcGeometry(P, S);
    expect(g.tiles).toBe(g.autoTiles);
  });

  it('bandArea is 0 when mirror+frame fills outer', () => {
    const params: OrderParams = { ...P, mirW: 60, mirH: 60 };
    const g = calcGeometry(params, S);
    expect(g.bandArea).toBe(0);
  });

  it('handles zero tile size without divide by zero', () => {
    const settings: Settings = { ...S, tileW: 0, tileH: 0 };
    const g = calcGeometry(P, settings);
    expect(g.autoTiles).toBe(0);
  });

  it('exposes frame dimensions in cm', () => {
    const g = calcGeometry(P, S);
    expect(g.fo).toBeCloseTo(5);  // 50mm -> 5cm
    expect(g.fi).toBeCloseTo(2);  // 20mm -> 2cm
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
    const params: OrderParams = { ...P, outW: 0, outH: 0, mirW: 0, mirH: 0 };
    const settings: Settings = { ...S, pPaint: 0, pGlue: 0, pMount: 0, pMisc: 0 };
    const g = calcGeometry(params, settings);
    const r = calcCost(params, settings, g);
    expect(r.margin).toBe(0);
  });
});
