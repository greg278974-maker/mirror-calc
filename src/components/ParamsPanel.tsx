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
  label, value, unit, step = 1, min = 0, disabled = false,
  onChange,
}: {
  label: string
  value: number
  unit: string
  step?: number
  min?: number
  disabled?: boolean
  onChange: (v: number) => void
}) {
  return (
    <div style={{ flex: 1 }}>
      <label style={lbl}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="number"
          style={{ ...inputBase, opacity: disabled ? 0.55 : 1, cursor: disabled ? 'not-allowed' : undefined }}
          value={value}
          min={min}
          step={step}
          disabled={disabled}
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

      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <NumField label="Наружный — ширина" value={params.outW} unit="мм"
          onChange={v => set({ outW: v })} />
        <NumField label="Наружный — высота" value={params.outH} unit="мм"
          onChange={v => set({ outH: v })} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <NumField label="Зеркало — ширина" value={params.mirW} unit="мм"
          onChange={v => set({ mirW: v })} />
        <NumField label="Зеркало — высота" value={params.mirH} unit="мм"
          onChange={v => set({ mirH: v })} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
          <label style={{ ...lbl, margin: 0 }}>Кол-во плитки</label>
          <div style={{ display: 'inline-flex', border: '1px solid var(--line)', borderRadius: 7, overflow: 'hidden' }}>
            {(['auto', 'manual'] as const).map(mode => (
              <button key={mode}
                style={{
                  background: params.tileMode === mode ? 'var(--wine)' : 'var(--field)',
                  border: 'none',
                  color: params.tileMode === mode ? '#fff' : 'var(--muted)',
                  font: 'inherit', fontSize: 11, padding: '4px 10px', cursor: 'pointer',
                }}
                onClick={() => set({ tileMode: mode })}
              >
                {mode === 'auto' ? 'Авто' : 'Вручную'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="number"
            style={{
              ...inputBase,
              opacity: params.tileMode === 'auto' ? 0.55 : 1,
              cursor: params.tileMode === 'auto' ? 'not-allowed' : undefined,
            }}
            value={params.tileMode === 'auto' ? geom.autoTiles : params.tilesManual}
            min={0} step={1}
            disabled={params.tileMode === 'auto'}
            onChange={e => set({ tilesManual: parseFloat(e.target.value) || 0 })}
            onFocus={e => { e.target.style.borderColor = 'var(--wine-soft)'; e.target.style.background = '#201819' }}
            onBlur={e => { e.target.style.borderColor = 'var(--line)'; e.target.style.background = 'var(--field)' }}
          />
          <span style={{
            position: 'absolute', right: 11, fontSize: 11, color: 'var(--muted2)',
            pointerEvents: 'none', fontFamily: 'var(--sans)',
          }}>шт</span>
        </div>
      </div>

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
