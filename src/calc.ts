import type { OrderParams, Settings } from './state';

// Baguette (moulding) is sold as whole sticks; each stick is this long.
export const BAGUETTE_STICK_M = 2;

export interface Geometry {
  mirW: number;        // mm - computed from outer size, frames, tile rows
  mirH: number;        // mm - computed
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
  bagOutPcs: number;   // whole 2 m sticks needed for the outer frame
  bagInPcs: number;    // whole 2 m sticks needed for the inner frame
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
  const fo = settings.frameOut;  // mm
  const fi = settings.frameIn;   // mm
  const tileWmm = settings.tileW * 10;  // cm → mm
  const tileHmm = settings.tileH * 10;  // cm → mm

  // Mirror size is derived: outer size minus both frames and tile rows on each side.
  // Inner frame snaps exactly to the tile grid edge.
  const mirW = Math.max(0, params.outW - 2 * fo - 2 * params.tileRows * tileWmm - 2 * fi);
  const mirH = Math.max(0, params.outH - 2 * fo - 2 * params.tileRows * tileHmm - 2 * fi);

  const mirArea  = (mirW * mirH) / 1_000_000;               // mm² → m²
  const baseArea = (params.outW * params.outH) / 1_000_000; // mm² → m²
  const perimOut = 2 * (params.outW + params.outH) / 1000;  // mm → m
  const perimIn  = 2 * (mirW + mirH) / 1000;                // mm → m

  // Band dimensions in mm
  const bandOuterW = Math.max(0, params.outW - 2 * fo);
  const bandOuterH = Math.max(0, params.outH - 2 * fo);
  const bandInnerW = mirW + 2 * fi;
  const bandInnerH = mirH + 2 * fi;
  const bandArea   = Math.max(0, bandOuterW * bandOuterH - bandInnerW * bandInnerH); // mm²

  const tileAreaMm2 = tileWmm * tileHmm;
  const autoTiles   = tileAreaMm2 > 0 ? Math.ceil(bandArea / tileAreaMm2) : 0;
  const tiles       = autoTiles;

  // Baguette is bought in whole 2 m sticks — round each frame's length up.
  const bagOutPcs = Math.ceil(perimOut / BAGUETTE_STICK_M);
  const bagInPcs  = Math.ceil(perimIn  / BAGUETTE_STICK_M);

  return {
    mirW, mirH, mirArea, baseArea, perimOut, perimIn, fo, fi,
    bandOuterW, bandOuterH, bandInnerW, bandInnerH,
    bandArea, autoTiles, tiles, bagOutPcs, bagInPcs,
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
    'Багет наружный': geom.bagOutPcs * settings.pBagOut,
    'Багет внутр.':   geom.bagInPcs  * settings.pBagIn,
    'Еврокромка':     geom.perimIn  * settings.pEuroEdge,
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
