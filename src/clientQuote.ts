import type { OrderParams, Settings } from './state';
import type { Geometry, CostResult } from './calc';

export interface QuoteLine {
  name: string;
  amount: number; // ₸, client price (markup folded in), rounded to whole ₸
}

export interface ClientQuote {
  outerSize: string;   // "600×600 мм"
  mirrorSize: string;  // "260×260 мм"
  lines: QuoteLine[];  // materials at client price, zero lines dropped
  productClient: number; // "Изделие" — equals the app's rounded productClient
  work: number;
  delivery: number;
  montage: number;
  total: number;        // exact total (round of cost.totalClient); not shown in the PDF
  totalRounded: number; // "К оплате" — equals the app's с округлением exactly
}

/**
 * Spread `target` whole tenge across `items` (weighted by their exact value)
 * using the largest-remainder method, so the integer lines sum *exactly* to
 * target. This keeps the printed column reconciled to the subtotal without any
 * per-line rounding drift.
 */
function allocate(items: { name: string; value: number }[], target: number): QuoteLine[] {
  const parts = items.map(it => {
    const floor = Math.floor(it.value);
    return { name: it.name, amount: floor, frac: it.value - floor };
  });
  let rem = target - parts.reduce((a, p) => a + p.amount, 0);
  const order = parts.map((_, i) => i).sort((a, b) => parts[b].frac - parts[a].frac);
  for (let k = 0; rem > 0 && k < order.length; k++, rem--) parts[order[k]].amount += 1;
  // Safety: never leave the subtotal unmet even under float edge cases.
  if (rem > 0 && order.length) parts[order[0]].amount += rem;
  return parts.map(p => ({ name: p.name, amount: p.amount }));
}

/**
 * Build the client-facing quote as a *presentation* of the engine's numbers — it
 * must never disagree with what the app shows the owner. Material costs are stored
 * at cost; each line is scaled by the waste+markup factor and the rounding is
 * allocated so the lines sum exactly to the app's productClient ("Изделие").
 * "К оплате" reuses the engine's totalRounded so it always equals the app's
 * "с округлением". Cost, profit and margin never appear in the returned data.
 */
export function buildClientQuote(
  params: OrderParams,
  settings: Settings,
  geom: Geometry,
  cost: CostResult,
): ClientQuote {
  const factor = (1 + settings.wastePct / 100) * (1 + settings.markupPct / 100);

  const items = Object.entries(cost.mat)
    .filter(([, amt]) => amt > 0)
    .map(([name, amt]) => ({ name, value: amt * factor }));

  // "Изделие" is the app's productClient, rounded once; lines are allocated to it.
  const productClient = Math.round(cost.productClient);
  const lines = allocate(items, productClient);

  const work = Math.round(cost.work);
  const delivery = Math.round(cost.delivery);
  const montage = Math.round(cost.montage);
  const total = Math.round(cost.totalClient);
  const totalRounded = cost.totalRounded; // identical to the app's с округлением

  return {
    outerSize: `${params.outW}×${params.outH} мм`,
    mirrorSize: `${geom.mirW}×${geom.mirH} мм`,
    lines,
    productClient,
    work,
    delivery,
    montage,
    total,
    totalRounded,
  };
}
