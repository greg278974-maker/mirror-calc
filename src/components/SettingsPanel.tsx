import { useState } from 'react'
import type { Settings } from '../state'

interface Props {
  settings: Settings
  onChange: (s: Settings) => void
}

const panel: React.CSSProperties = {
  background: 'var(--panel)', border: '1px solid var(--line)',
  borderRadius: 'var(--radius)', padding: 16, marginTop: 16,
}

const subhead: React.CSSProperties = {
  fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase',
  color: 'var(--muted2)', margin: '14px 0 8px', fontWeight: 600,
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 5,
}

const inputBase: React.CSSProperties = {
  width: '100%', background: 'var(--field)', border: '1px solid var(--line)',
  color: 'var(--ink)', font: 'inherit', fontFamily: 'var(--mono)', fontSize: 14,
  padding: '9px 60px 9px 11px', borderRadius: 8, outline: 'none',
}

function PriceField({
  label, fieldKey, unit, step = 50, settings, onChange,
}: {
  label: string
  fieldKey: keyof Settings
  unit: string
  step?: number
  settings: Settings
  onChange: (s: Settings) => void
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={lbl}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="number"
          style={inputBase}
          value={settings[fieldKey] as number}
          min={0}
          step={step}
          onChange={e => onChange({ ...settings, [fieldKey]: parseFloat(e.target.value) || 0 })}
          onFocus={e => { e.target.style.borderColor = 'var(--wine-soft)'; e.target.style.background = '#201819' }}
          onBlur={e => { e.target.style.borderColor = 'var(--line)'; e.target.style.background = 'var(--field)' }}
        />
        <span style={{
          position: 'absolute', right: 8, fontSize: 10, color: 'var(--muted2)',
          pointerEvents: 'none', fontFamily: 'var(--sans)', whiteSpace: 'nowrap',
        }}>{unit}</span>
      </div>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>{children}</div>
}

export function SettingsPanel({ settings, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  const handle = (s: Settings) => {
    onChange(s)
    setSaved(true)
    setTimeout(() => setSaved(false), 1200)
  }

  const f = (key: keyof Settings, label: string, unit: string, step?: number) => (
    <PriceField key={key} label={label} fieldKey={key} unit={unit} step={step} settings={settings} onChange={handle} />
  )

  return (
    <section style={panel}>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(v => !v)}
      >
        <p style={{ fontSize: 11, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--wine-soft)', fontWeight: 650, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          Цены за единицу
          <span style={{ fontSize: 10.5, color: 'var(--good)', opacity: saved ? 1 : 0, transition: 'opacity .3s', marginLeft: 4 }}>
            сохранено
          </span>
        </p>
        <span style={{ color: 'var(--muted)', fontSize: 12, transition: 'transform .2s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', display: 'inline-block' }}>▼</span>
      </div>

      {open && (
        <div style={{ marginTop: 16 }}>
          <p style={{ ...subhead, marginTop: 0 }}>Материалы</p>
          <Row>{f('pMirror', 'Зеркало', '₸/м²', 100)}{f('pTile', 'Декор-плитка', '₸/шт', 50)}</Row>
          <Row>{f('pBagOut', 'Багет наружный', '₸/шт (2 м)', 100)}{f('pBagIn', 'Багет внутренний', '₸/шт (2 м)', 100)}</Row>
          <Row>{f('pEuroEdge', 'Еврокромка', '₸/пог.м', 50)}{f('pBase', 'Основа (МДФ)', '₸/м²', 100)}</Row>
          <Row>{f('pPaint', 'Краска', '₸', 50)}{f('pGlue', 'Клей', '₸', 50)}</Row>
          <Row>{f('pMount', 'Крепёж/подвес', '₸', 50)}{f('pMisc', 'Прочие расходники', '₸', 50)}</Row>

          <p style={subhead}>Ширина багета</p>
          <Row>{f('frameOut', 'Наружный', 'мм', 1)}{f('frameIn', 'Внутренний', 'мм', 1)}</Row>

          <p style={subhead}>Размер плитки</p>
          <Row>{f('tileW', 'Ширина', 'см', 1)}{f('tileH', 'Высота', 'см', 1)}</Row>

          <p style={subhead}>Работа</p>
          <Row>{f('pWorkBase', 'База (за заказ)', '₸', 100)}{f('pWorkM2', 'За м²', '₸/м²', 100)}</Row>

          <p style={subhead}>Доп. услуги</p>
          <Row>{f('pDeliv', 'Доставка', '₸', 100)}{f('pInst', 'Монтаж', '₸', 100)}</Row>

          <p style={subhead}>Коэффициенты</p>
          <Row>{f('wastePct', 'Запас на брак', '%', 1)}{f('markupPct', 'Наценка', '%', 5)}</Row>
        </div>
      )}
    </section>
  )
}
