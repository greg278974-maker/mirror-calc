import { useState, useCallback, useRef, useEffect } from 'react'
import { type OrderParams, type Settings } from './state'
import { calcGeometry, calcCost } from './calc'
import { buildClientQuote } from './clientQuote'
import { loadSettings, saveSettings, loadParams, saveParams } from './storage'
import { ParamsPanel } from './components/ParamsPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { ResultPanel } from './components/ResultPanel'
import { MirrorDiagram } from './components/MirrorDiagram'
import { ClientExport } from './components/ClientExport'

export default function App() {
  const [params, setParams] = useState<OrderParams>(loadParams)
  const [settings, setSettings] = useState<Settings>(loadSettings)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const paramsTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const updateSettings = useCallback((next: Settings) => {
    setSettings(next)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveSettings(next), 400)
  }, [])

  const updateParams = useCallback((next: OrderParams) => {
    setParams(next)
    clearTimeout(paramsTimer.current)
    paramsTimer.current = setTimeout(() => saveParams(next), 400)
  }, [])

  useEffect(() => () => {
    clearTimeout(saveTimer.current)
    clearTimeout(paramsTimer.current)
  }, [])

  const svgRef = useRef<SVGSVGElement>(null)

  const geom = calcGeometry(params, settings)
  const cost = calcCost(params, settings, geom)
  const quote = buildClientQuote(params, settings, geom, cost)

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '22px 18px 60px' }}>
      <header style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        gap: 16, borderBottom: '1px solid var(--line)', paddingBottom: 16, marginBottom: 20,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 7, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--wine) 0%, var(--wine2) 100%)',
            boxShadow: 'inset 0 0 0 3px #2a2223, inset 0 0 0 4px #4a3a3c',
          }} />
          <div>
            <h1 style={{ fontSize: 18, margin: 0, letterSpacing: '.3px', fontWeight: 650 }}>
              Калькулятор зеркала
            </h1>
            <div style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 2 }}>
              Себестоимость и цена для клиента · ₸
            </div>
          </div>
        </div>
      </header>

      <div className="app-grid">
        {/* LEFT */}
        <div>
          <ParamsPanel params={params} settings={settings} geom={geom} onChange={updateParams} />
          <SettingsPanel settings={settings} onChange={updateSettings} />
        </div>

        {/* RIGHT */}
        <div style={{ position: 'sticky', top: 16 }}>
          <ResultPanel cost={cost} geom={geom} />
          <MirrorDiagram params={params} settings={settings} geom={geom} svgRef={svgRef} />
          <ClientExport quote={quote} svgRef={svgRef} />
        </div>
      </div>
    </div>
  )
}
