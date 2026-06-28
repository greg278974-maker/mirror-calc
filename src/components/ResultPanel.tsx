import type { Geometry, CostResult } from '../calc'

interface Props {
  cost: CostResult
  geom: Geometry
}

export function ResultPanel({ cost }: Props) {
  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ fontSize: 24, fontFamily: 'var(--mono)' }}>stub итого {Math.round(cost.totalClient)} ₸</div>
    </div>
  )
}
