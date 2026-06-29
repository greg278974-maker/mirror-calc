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
  productClient: number; // sum of line amounts ("Изделие")
  delivery: number;
  montage: number;
  total: number;        // productClient + delivery + montage
  totalRounded: number; // total rounded up to nearest 500 ₸
}

/**
 * Build the client-facing quote. Material costs are stored internally at cost;
 * here each line is scaled by the waste+markup factor so the figures shown to the
 * client carry the markup and sum exactly to the client product price. Cost,
 * profit and margin never appear in the returned data.
 */
export function buildClientQuote(
  params: OrderParams,
  settings: Settings,
  geom: Geometry,
  cost: CostResult,
): ClientQuote {
  const factor = (1 + settings.wastePct / 100) * (1 + settings.markupPct / 100);

  const lines: QuoteLine[] = Object.entries(cost.mat)
    .filter(([, amt]) => amt > 0)
    .map(([name, amt]) => ({ name, amount: Math.round(amt * factor) }));

  // Subtotal is the sum of the rounded lines so the printed column reconciles.
  const productClient = lines.reduce((a, l) => a + l.amount, 0);
  const delivery = cost.delivery;
  const montage = cost.montage;
  const total = productClient + delivery + montage;
  const totalRounded = Math.ceil(total / 500) * 500;

  return {
    outerSize: `${params.outW}×${params.outH} мм`,
    mirrorSize: `${geom.mirW}×${geom.mirH} мм`,
    lines,
    productClient,
    delivery,
    montage,
    total,
    totalRounded,
  };
}
