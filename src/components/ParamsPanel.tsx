import type { OrderParams, Settings } from '../state'
import type { Geometry } from '../calc'

interface Props {
  params: OrderParams
  settings: Settings
  geom: Geometry
  onChange: (p: OrderParams) => void
}

export function ParamsPanel({ params, onChange }: Props) {
  const set = (patch: Partial<OrderParams>) => onChange({ ...params, ...patch })
  return (
    <section style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 16 }}>
      <p style={{ fontSize: 11, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--wine-soft)', fontWeight: 650, margin: '0 0 14px' }}>Параметры изделия</p>
      <div>stub outW={params.outW}</div>
      <button onClick={() => set({ outW: params.outW + 1 })}>+</button>
    </section>
  )
}
