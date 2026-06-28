import type { OrderParams, Settings } from '../state'
import type { Geometry } from '../calc'

interface Props {
  params: OrderParams
  settings: Settings
  geom: Geometry
}

const PAD = 30   // padding for labels (in cm units = SVG units)
const JOINT = 0.3  // tile joint width in cm

export function MirrorDiagram({ params, settings, geom }: Props) {
  const { outW, outH, mirW, mirH } = params
  const { tileW, tileH } = settings
  const { fo, bandOuterW, bandOuterH, bandInnerW, bandInnerH, bandArea, tiles } = geom

  if (outW <= 0 || outH <= 0) return null

  const vbW = outW + 2 * PAD
  const vbH = outH + 2 * PAD

  // Outer rectangle
  const ox = PAD, oy = PAD

  // Band outer (inner edge of outer bagette)
  const bOx = PAD + fo
  const bOy = PAD + fo

  // Band inner (outer edge of inner bagette) — centered in outer
  const bIx = PAD + (outW - bandInnerW) / 2
  const bIy = PAD + (outH - bandInnerH) / 2

  // Mirror — centered
  const mx = PAD + (outW - mirW) / 2
  const my = PAD + (outH - mirH) / 2

  const clipId = 'band-ring-clip'

  // Ring clip: outer box minus inner box via even-odd rule
  const outerPath = `M ${bOx} ${bOy} h ${bandOuterW} v ${bandOuterH} h ${-bandOuterW} Z`
  const innerPath = `M ${bIx} ${bIy} h ${bandInnerW} v ${bandInnerH} h ${-bandInnerW} Z`
  const ringPath = `${outerPath} ${innerPath}`

  // Tile grid — fills band outer bounds
  const cols = tileW > 0 ? Math.ceil(bandOuterW / tileW) : 0
  const rows = tileH > 0 ? Math.ceil(bandOuterH / tileH) : 0
  const tileRects: React.ReactElement[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tx = bOx + c * tileW
      const ty = bOy + r * tileH
      const shade = (r + c) % 2 === 0 ? '#c8a86c' : '#b89558'
      tileRects.push(
        <rect key={`${r}-${c}`}
          x={tx + JOINT / 2} y={ty + JOINT / 2}
          width={Math.max(0, tileW - JOINT)}
          height={Math.max(0, tileH - JOINT)}
          fill={shade} rx={0.4}
        />
      )
    }
  }

  const dimTxt: React.CSSProperties = { fill: '#f3ece9', fontSize: 3.5, fontFamily: 'ui-monospace, monospace', fontWeight: 600 }
  const noteTxt: React.CSSProperties = { fill: '#7c6f6c', fontSize: 3, fontFamily: 'ui-monospace, monospace' }

  return (
    <div style={{
      background: 'var(--panel)', border: '1px solid var(--line)',
      borderRadius: 'var(--radius)', padding: 12, marginTop: 14,
    }}>
      <p style={{
        fontSize: 11, letterSpacing: '1.4px', textTransform: 'uppercase',
        color: 'var(--wine-soft)', fontWeight: 650, margin: '0 0 10px',
      }}>
        Схема изделия
      </p>

      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        style={{ width: '100%', display: 'block' }}
        aria-label="Схема зеркала-панно"
      >
        <defs>
          <clipPath id={clipId}>
            <path fillRule="evenodd" d={ringPath} />
          </clipPath>
          <linearGradient id="mir-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cdd3d6" />
            <stop offset="100%" stopColor="#9aa3a7" />
          </linearGradient>
        </defs>

        {/* Panel background */}
        <rect x={ox} y={oy} width={outW} height={outH} fill="#1a1314" />

        {/* Outer bagette — ring between outer rect and band outer */}
        <path
          fillRule="evenodd"
          d={[
            `M ${ox} ${oy} h ${outW} v ${outH} h ${-outW} Z`,
            outerPath,
          ].join(' ')}
          fill="#8d2233"
        />

        {/* Tile band background (shown where tiles don't cover) */}
        <path fillRule="evenodd" d={ringPath} fill="#7a5c32" />

        {/* Tile grid, clipped to band ring */}
        <g clipPath={`url(#${clipId})`}>
          {tileRects}
        </g>

        {/* Inner bagette — ring between band inner and mirror */}
        {(bandInnerW > 0 && bandInnerH > 0 && mirW > 0 && mirH > 0) && (
          <path
            fillRule="evenodd"
            d={[
              innerPath,
              `M ${mx} ${my} h ${mirW} v ${mirH} h ${-mirW} Z`,
            ].join(' ')}
            fill="#5d1622"
          />
        )}

        {/* Mirror */}
        {mirW > 0 && mirH > 0 && (
          <>
            <rect x={mx} y={my} width={mirW} height={mirH} fill="url(#mir-grad)" />
            {/* Highlight streak */}
            <rect
              x={mx + mirW * 0.12} y={my + mirH * 0.1}
              width={mirW * 0.28} height={mirH * 0.04}
              fill="rgba(255,255,255,0.22)" rx={1}
            />
          </>
        )}

        {/* === Dimension annotations === */}

        {/* Top: outer width */}
        <line x1={ox} y1={oy - 7} x2={ox + outW} y2={oy - 7} stroke="#5a4e50" strokeWidth={0.5} />
        <line x1={ox} y1={oy - 9} x2={ox} y2={oy - 5} stroke="#5a4e50" strokeWidth={0.5} />
        <line x1={ox + outW} y1={oy - 9} x2={ox + outW} y2={oy - 5} stroke="#5a4e50" strokeWidth={0.5} />
        <text x={ox + outW / 2} y={oy - 10} textAnchor="middle" style={dimTxt}>
          {outW} см
        </text>

        {/* Right: outer height */}
        <line x1={ox + outW + 7} y1={oy} x2={ox + outW + 7} y2={oy + outH} stroke="#5a4e50" strokeWidth={0.5} />
        <line x1={ox + outW + 5} y1={oy} x2={ox + outW + 9} y2={oy} stroke="#5a4e50" strokeWidth={0.5} />
        <line x1={ox + outW + 5} y1={oy + outH} x2={ox + outW + 9} y2={oy + outH} stroke="#5a4e50" strokeWidth={0.5} />
        <text
          x={ox + outW + 13}
          y={oy + outH / 2}
          textAnchor="middle"
          style={dimTxt}
          transform={`rotate(90,${ox + outW + 13},${oy + outH / 2})`}
        >
          {outH} см
        </text>

        {/* Mirror label */}
        {mirW > 3 && mirH > 3 && (
          <>
            <text x={mx + mirW / 2} y={my + mirH / 2 - 1.5} textAnchor="middle"
              style={{ ...dimTxt, fill: '#2a2324' }}>
              {mirW}×{mirH}
            </text>
            <text x={mx + mirW / 2} y={my + mirH / 2 + 3} textAnchor="middle"
              style={{ ...noteTxt, fill: '#3a3032' }}>
              зеркало
            </text>
          </>
        )}

        {/* Bottom: tile count note */}
        <text x={vbW / 2} y={oy + outH + 13} textAnchor="middle" style={noteTxt}>
          {`бордюр ${(bandArea / 10000).toFixed(3)} м² → ${tiles} плиток`}
        </text>
      </svg>
    </div>
  )
}
