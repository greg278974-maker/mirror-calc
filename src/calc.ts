import type { OrderParams, Settings } from './state';

export interface Geometry {
  mirArea: number;
  baseArea: number;
  perimOut: number;
  perimIn: number;
  fo: number;
  fi: number;
  bandOuterW: number;
  bandOuterH: number;
  bandInnerW: number;
  bandInnerH: number;
  bandArea: number;
  autoTiles: number;
  tiles: number;
}

export interface CostResult {
  mat: Record<string, number>;
  matSub: number;
  wasteAmt: number;
  productCost: number;
  productClient: number;
  delivery: number;
  montage: number;
  totalClient: number;
  profit: number;
  margin: number;
  totalRounded: number;
}

export function calcGeometry(params: OrderParams, settings: Settings): Geometry {
  // outW/outH/mirW/mirH are in mm; frameOut/frameIn already in mm
  const fo = settings.frameOut;  // mm
  const fi = settings.frameIn;   // mm

  const mirArea  = (params.mirW * params.mirH) / 1_000_000;    // mm² → m²
  const baseArea = (params.outW * params.outH) / 1_000_000;    // mm² → m²
  const perimOut = 2 * (params.outW + params.outH) / 1000;     // mm → m
  const perimIn  = 2 * (params.mirW + params.mirH) / 1000;     // mm → m

  // Band dimensions in mm
  const bandOuterW = Math.max(0, params.outW - 2 * fo);
  const bandOuterH = Math.max(0, params.outH - 2 * fo);
  const bandInnerW = params.mirW + 2 * fi;
  const bandInnerH = params.mirH + 2 * fi;
  const bandArea = Math.max(0, bandOuterW * bandOuterH - bandInnerW * bandInnerH); // mm²

  // tileW/tileH are in cm → convert to mm for area comparison
  const tileAreaMm2 = settings.tileW * settings.tileH * 100;   // cm² → mm²
  const autoTiles = tileAreaMm2 > 0 ? Math.ceil(bandArea / tileAreaMm2) : 0;
  const tiles = params.tileMode === 'auto' ? autoTiles : params.tilesManual;

  return {
    mirArea, baseArea, perimOut, perimIn, fo, fi,
    bandOuterW, bandOuterH, bandInnerW, bandInnerH,
    bandArea, autoTiles, tiles,
  };
}

export function calcCost(
  params: OrderParams,
  settings: Settings,
  geom: Geometry,
): CostResult {
  const mat: Record<string, number> = {
    'Зеркало':        geom.mirArea  * settings.pMirror,
    'Плитка декор':   geom.tiles    * settings.pTile,
    'Багет наружный': geom.perimOut * settings.pBagOut,
    'Багет внутр.':   geom.perimIn  * settings.pBagIn,
    'Основа':         geom.baseArea * settings.pBase,
    'Краска':         settings.pPaint,
    'Клей':           settings.pGlue,
    'Крепёж':         settings.pMount,
    'Расходники':     settings.pMisc,
  };

  const matSub = Object.values(mat).reduce((a, b) => a + b, 0);
  const wasteAmt = matSub * settings.wastePct / 100;
  const productCost = matSub + wasteAmt;
  const productClient = productCost * (1 + settings.markupPct / 100);

  const delivery = params.inclDeliv ? settings.pDeliv : 0;
  const montage  = params.inclInst  ? settings.pInst  : 0;
  const totalClient = productClient + delivery + montage;

  const profit = productClient - productCost;
  const margin = productClient > 0 ? profit / productClient * 100 : 0;
  const totalRounded = Math.ceil(totalClient / 500) * 500;

  return {
    mat, matSub, wasteAmt, productCost, productClient,
    delivery, montage, totalClient, profit, margin, totalRounded,
  };
}
