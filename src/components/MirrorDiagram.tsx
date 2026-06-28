import type { OrderParams, Settings } from '../state'
import type { Geometry } from '../calc'

interface Props {
  params: OrderParams
  settings: Settings
  geom: Geometry
}

export function MirrorDiagram({ params }: Props) {
  return (
    <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 12, marginTop: 14 }}>
      <p style={{ fontSize: 11, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--wine-soft)', fontWeight: 650, margin: '0 0 8px' }}>Схема (stub {params.outW}×{params.outH})</p>
    </div>
  )
}
