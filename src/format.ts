const nf = new Intl.NumberFormat('ru-RU');

export const fmtNum = (v: number): string => nf.format(Math.round(v));
export const fmtMoney = (v: number): string => `${fmtNum(v)} ₸`;
export const fmtPct = (v: number): string => `${v.toFixed(1)}%`;
