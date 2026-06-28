import type { Settings } from '../state'

interface Props {
  settings: Settings
  onChange: (s: Settings) => void
}

export function SettingsPanel({ settings }: Props) {
  return (
    <section style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 16, marginTop: 16 }}>
      <p style={{ fontSize: 11, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--wine-soft)', fontWeight: 650, margin: 0 }}>Цены за единицу (stub pMirror={settings.pMirror})</p>
    </section>
  )
}
