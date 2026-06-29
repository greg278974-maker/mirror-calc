export interface OrderParams {
  outW: number;        // mm
  outH: number;        // mm
  tileRows: number;    // rows of tiles per side in the border
  inclDeliv: boolean;
  inclInst: boolean;
}

export interface Settings {
  pMirror: number;   // ₸/m²
  pTile: number;     // ₸/pc
  pBagOut: number;   // ₸/lin.m
  pBagIn: number;    // ₸/lin.m
  pEuroEdge: number; // ₸/lin.m
  pBase: number;     // ₸/m²
  pPaint: number;    // ₸ flat
  pGlue: number;     // ₸ flat
  pMount: number;    // ₸ flat
  pMisc: number;     // ₸ flat
  frameOut: number;  // mm
  frameIn: number;   // mm
  tileW: number;     // cm
  tileH: number;     // cm
  pDeliv: number;    // ₸
  pInst: number;     // ₸
  wastePct: number;  // %
  markupPct: number; // %
}

export const DEFAULT_PARAMS: OrderParams = {
  outW: 600,
  outH: 600,
  tileRows: 1,
  inclDeliv: false,
  inclInst: false,
};

export const DEFAULT_SETTINGS: Settings = {
  pMirror: 7000,
  pTile: 800,
  pBagOut: 1500,
  pBagIn: 700,
  pEuroEdge: 500,
  pBase: 2500,
  pPaint: 600,
  pGlue: 500,
  pMount: 300,
  pMisc: 500,
  frameOut: 50,
  frameIn: 20,
  tileW: 10,
  tileH: 10,
  pDeliv: 2000,
  pInst: 3000,
  wastePct: 10,
  markupPct: 100,
};
