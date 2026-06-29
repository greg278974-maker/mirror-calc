import { useState } from 'react'
import type { ClientQuote } from '../clientQuote'

interface Props {
  quote: ClientQuote
  svgRef: React.RefObject<SVGSVGElement | null>
}

const panel: React.CSSProperties = {
  background: 'var(--panel)', border: '1px solid var(--line)',
  borderRadius: 'var(--radius)', padding: 16, marginTop: 14,
}

const eyebrow: React.CSSProperties = {
  fontSize: 11, letterSpacing: '1.4px', textTransform: 'uppercase',
  color: 'var(--wine-soft)', fontWeight: 650, margin: '0 0 12px',
}

const input: React.CSSProperties = {
  width: '100%', background: 'var(--field)', border: '1px solid var(--line)',
  color: 'var(--ink)', font: 'inherit', fontSize: 14,
  padding: '9px 11px', borderRadius: 8, outline: 'none', boxSizing: 'border-box',
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 5,
}

export function ClientExport({ quote, svgRef }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(false)

  const handle = async () => {
    setBusy(true)
    setErr(false)
    try {
      const { exportClientPdf } = await import('../clientPdf')
      await exportClientPdf(quote, svgRef.current, { name, phone })
    } catch {
      setErr(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section style={panel}>
      <p style={eyebrow}>PDF для клиента</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label style={lbl}>Имя клиента</label>
          <input
            style={input} value={name} placeholder="—"
            onChange={e => setName(e.target.value)}
            onFocus={e => { e.target.style.borderColor = 'var(--wine-soft)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--line)' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label style={lbl}>Телефон</label>
          <input
            style={input} value={phone} placeholder="—" inputMode="tel"
            onChange={e => setPhone(e.target.value)}
            onFocus={e => { e.target.style.borderColor = 'var(--wine-soft)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--line)' }}
          />
        </div>
      </div>

      <button
        onClick={handle}
        disabled={busy}
        style={{
          width: '100%', background: 'linear-gradient(135deg, var(--wine) 0%, var(--wine2) 100%)',
          border: 'none', color: '#f5ece9', font: 'inherit', fontSize: 13.5, fontWeight: 650,
          padding: '11px 12px', borderRadius: 9, cursor: busy ? 'default' : 'pointer',
          opacity: busy ? 0.7 : 1, transition: 'opacity .15s',
        }}
      >
        {busy ? 'Готовлю PDF…' : 'Скачать PDF для клиента'}
      </button>

      {err && (
        <p style={{ fontSize: 11.5, color: 'var(--wine-soft)', margin: '8px 0 0' }}>
          Не удалось сформировать PDF. Попробуйте ещё раз.
        </p>
      )}
      <p style={{ fontSize: 11, color: 'var(--muted2)', margin: '8px 0 0', lineHeight: 1.5 }}>
        Без себестоимости и наценки — только цены материалов, итог и схема.
      </p>
    </section>
  )
}
