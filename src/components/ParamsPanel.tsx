import type { OrderParams, Settings } from '../state'
import type { Geometry } from '../calc'
import { fmtMoney } from '../format'

interface Props {
  params: OrderParams
  settings: Settings
  geom: Geometry
  onChange: (p: OrderParams) => void
}

const panel: React.CSSProperties = {
  background: 'var(--panel)', border: '1px solid var(--line)',
  borderRadius: 'var(--radius)', padding: 16,
}

const eyebrow: React.CSSProperties = {
  fontSize: 11, letterSpacing: '1.4px', textTransform: 'uppercase',
  color: 'var(--wine-soft)', fontWeight: 650, margin: '0 0 14px',
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 5,
}

const inputBase: React.CSSProperties = {
  width: '100%', background: 'var(--field)', border: '1px solid var(--line)',
  color: 'var(--ink)', font: 'inherit', fontFamily: 'var(--mono)', fontSize: 14,
  padding: '9px 46px 9px 11px', borderRadius: 8, outline: 'none',
}

function NumField({
  label, value, unit, step = 1, min = 0,
  onChange,
}: {
  label: string
  value: number
  unit: string
  step?: number
  min?: number
  onChange: (v: number) => void
}) {
  return (
    <div style={{ flex: 1 }}>
      <label style={lbl}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="number"
          style={inputBase}
          value={value}
          min={min}
          step={step}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          onFocus={e => { e.target.style.borderColor = 'var(--wine-soft)'; e.target.style.background = '#201819' }}
          onBlur={e => { e.target.style.borderColor = 'var(--line)'; e.target.style.background = 'var(--field)' }}
        />
        <span style={{
          position: 'absolute', right: 11, fontSize: 11, color: 'var(--muted2)',
          pointerEvents: 'none', fontFamily: 'var(--sans)',
        }}>{unit}</span>
      </div>
    </div>
  )
}

export function ParamsPanel({ params, settings, geom, onChange }: Props) {
  const set = (patch: Partial<OrderParams>) => onChange({ ...params, ...patch })

  return (
    <section style={panel}>
      <p style={eyebrow}>Параметры изделия</p>

      {/* Outer size */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <NumField label="Наружный — ширина" value={params.outW} unit="мм"
          onChange={v => set({ outW: v })} />
        <NumField label="Наружный — высота" value={params.outH} unit="мм"
          onChange={v => set({ outH: v })} />
      </div>

      {/* Tile rows */}
      <div style={{ marginBottom: 12 }}>
        <NumField label="Рядов плитки (с каждой стороны)" value={params.tileRows}
          unit="ряд" step={1} min={0}
          onChange={v => set({ tileRows: Math.max(0, Math.round(v)) })} />
      </div>

      {/* Computed mirror size (read-only) */}
      <div style={{
        marginBottom: 12, padding: '9px 12px',
        background: 'var(--field)', border: '1px solid var(--line)', borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Зеркало (расчётное)</span>
        <span className="mono" style={{ fontSize: 14, color: geom.mirW > 0 ? 'var(--ink)' : 'var(--wine-soft)' }}>
          {geom.mirW > 0
            ? `${geom.mirW} × ${geom.mirH} мм`
            : 'не помещается'}
        </span>
      </div>

      {/* Services */}
      <div>
        <label style={lbl}>Доп. услуги</label>
        <div style={{
          display: 'flex', gap: 18, flexWrap: 'wrap', padding: '9px 11px',
          background: 'var(--field)', border: '1px solid var(--line)', borderRadius: 8,
        }}>
          {([
            { key: 'inclDeliv' as const, label: 'Доставка', price: settings.pDeliv },
            { key: 'inclInst' as const, label: 'Монтаж', price: settings.pInst },
          ]).map(({ key, label, price }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={params[key]}
                style={{ width: 16, height: 16, accentColor: 'var(--wine)', cursor: 'pointer' }}
                onChange={e => set({ [key]: e.target.checked })}
              />
              {label}
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted2)' }}>
                ({fmtMoney(price)})
              </span>
            </label>
          ))}
        </div>
      </div>
    </section>
  )
}
