import type { Geometry, CostResult } from '../calc'
import { fmtMoney, fmtNum, fmtPct } from '../format'

interface Props {
  cost: CostResult
  geom: Geometry
}

const panel: React.CSSProperties = {
  background: 'var(--panel)', border: '1px solid var(--line)',
  borderRadius: 'var(--radius)', padding: 16,
}

const eyebrow: React.CSSProperties = {
  fontSize: 11, letterSpacing: '1.4px', textTransform: 'uppercase',
  color: 'var(--wine-soft)', fontWeight: 650, margin: '0 0 14px',
}

// Zone colors matching SVG diagram
const MAT_COLORS: Record<string, string> = {
  'Зеркало':        '#9aa3a7',
  'Плитка декор':   '#c8a96e',
  'Багет наружный': '#8d2233',
  'Багет внутр.':   '#5d1622',
  'Основа':         '#8b7355',
  'Краска':         '#7c6f6c',
  'Клей':           '#6b5c5e',
  'Крепёж':         '#5a4e50',
  'Расходники':     '#4d4244',
}

function TotLine({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}>
      <span style={{ color: bold ? 'var(--ink)' : 'var(--muted)' }}>{label}</span>
      <span className="mono" style={{ fontWeight: bold ? 600 : undefined, color: 'var(--ink)' }}>
        {fmtMoney(value)}
      </span>
    </div>
  )
}

export function ResultPanel({ cost, geom }: Props) {
  const denom = cost.productCost > 0 ? cost.productCost : 1

  return (
    <>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg,#2c2122 0%,#241a1b 100%)',
        border: '1px solid var(--line)', borderRadius: 'var(--radius)',
        padding: 18, marginBottom: 14,
      }}>
        <div style={{ fontSize: 11, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
          Итого клиенту
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span className="mono" style={{ fontSize: 33, fontWeight: 600, letterSpacing: '-.5px', lineHeight: 1 }}>
            {fmtNum(cost.totalClient)}
          </span>
          <span style={{ fontSize: 18, color: 'var(--wine-soft)' }}>₸</span>
        </div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
          с округлением: <b style={{ color: 'var(--ink)', fontWeight: 600 }}>{fmtMoney(cost.totalRounded)}</b>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 9, padding: '11px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>Себестоимость</div>
          <div className="mono" style={{ fontSize: 17, fontWeight: 600 }}>{fmtMoney(cost.productCost)}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 9, padding: '11px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>Прибыль с изделия</div>
          <div className="mono" style={{ fontSize: 17, fontWeight: 600, color: 'var(--good)' }}>{fmtMoney(cost.profit)}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted2)' }}>маржа {fmtPct(cost.margin)}</div>
        </div>
      </div>

      {/* Order composition */}
      <section style={{ ...panel, marginBottom: 14 }}>
        <p style={eyebrow}>Состав заказа</p>
        <TotLine label="Изделие" value={cost.productClient} />
        {cost.delivery > 0 && <TotLine label="Доставка" value={cost.delivery} />}
        {cost.montage > 0 && <TotLine label="Монтаж" value={cost.montage} />}
        <div style={{ borderTop: '1px solid var(--line)', marginTop: 6, paddingTop: 8 }}>
          <TotLine label="Итого клиенту" value={cost.totalClient} bold />
        </div>
      </section>

      {/* Cost breakdown */}
      <section style={panel}>
        <p style={eyebrow}>Разбивка себестоимости</p>

        {Object.entries(cost.mat).map(([name, amt]) => {
          if (amt <= 0) return null
          const pct = (amt / denom) * 100
          const color = MAT_COLORS[name] ?? 'var(--wine)'
          return (
            <div key={name} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: 'var(--muted)' }}>{name}</span>
                <span className="mono" style={{ fontSize: 12.5 }}>{fmtMoney(amt)}</span>
              </div>
              <div style={{ height: 4, background: 'var(--field)', borderRadius: 3, overflow: 'hidden' }}>
                <i style={{ display: 'block', height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 3 }} />
              </div>
            </div>
          )
        })}

        <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '14px 0' }} />
        <TotLine label="Материалы" value={cost.matSub} />
        {cost.wasteAmt > 0 && <TotLine label="Запас на брак" value={cost.wasteAmt} />}
        <TotLine label="Себестоимость" value={cost.productCost} bold />

        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--muted2)', lineHeight: 1.5 }}>
          {`Зеркало ${geom.mirArea.toFixed(4)} м² · `}
          {`периметр рамы ${geom.perimOut.toFixed(3)} пог.м · `}
          {`бордюр ${(geom.bandArea / 1_000_000).toFixed(4)} м² → ${geom.tiles} плиток`}
        </div>
      </section>
    </>
  )
}
