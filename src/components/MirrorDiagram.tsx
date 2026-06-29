import type { OrderParams, Settings } from '../state'
import type { Geometry } from '../calc'

interface Props {
  params: OrderParams
  settings: Settings
  geom: Geometry
  svgRef?: React.Ref<SVGSVGElement>
}

const PAD = 40    // annotation margin in mm (SVG units = mm)
const JOINT = 2   // tile grout width in mm

export function MirrorDiagram({ params, settings, geom, svgRef }: Props) {
  const { outW, outH } = params
  const { tileW, tileH } = settings
  const { mirW, mirH, fo, bandOuterW, bandOuterH, bandInnerW, bandInnerH, bandArea, tiles } = geom

  if (outW <= 0 || outH <= 0) return null

  const vbW = outW + 2 * PAD
  const vbH = outH + 2 * PAD

  const ox = PAD
  const oy = PAD

  // Band rects
  const bOx = PAD + fo
  const bOy = PAD + fo
  const bIx = PAD + (outW - bandInnerW) / 2
  const bIy = PAD + (outH - bandInnerH) / 2

  // Mirror rect
  const mx = PAD + (outW - mirW) / 2
  const my = PAD + (outH - mirH) / 2

  const outerBoxPath = `M ${ox} ${oy} h ${outW} v ${outH} h ${-outW} Z`
  const bOuterPath   = `M ${bOx} ${bOy} h ${bandOuterW} v ${bandOuterH} h ${-bandOuterW} Z`
  const bInnerPath   = `M ${bIx} ${bIy} h ${bandInnerW} v ${bandInnerH} h ${-bandInnerW} Z`
  const mirPath      = `M ${mx} ${my} h ${mirW} v ${mirH} h ${-mirW} Z`

  // Convert tile size from cm to mm
  const tileWmm = tileW * 10
  const tileHmm = tileH * 10

  const cols = tileWmm > 0 ? Math.ceil(bandOuterW / tileWmm) : 0
  const rows = tileHmm > 0 ? Math.ceil(bandOuterH / tileHmm) : 0
  const tileRects: React.ReactElement[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tx = bOx + c * tileWmm
      const ty = bOy + r * tileHmm
      const shade = (r + c) % 2 === 0 ? '#c8a86c' : '#b89558'
      tileRects.push(
        <rect key={`${r}-${c}`}
          x={tx + JOINT / 2} y={ty + JOINT / 2}
          width={Math.max(0, tileWmm - JOINT)}
          height={Math.max(0, tileHmm - JOINT)}
          fill={shade} rx={2}
        />
      )
    }
  }

  // Proportional annotation sizes — capped so they fit within PAD=40
  const ann  = Math.min(Math.min(outW, outH) * 0.028, 26)  // base unit ~17 for 600mm panel
  const sw   = Math.max(ann * 0.12, 1)   // stroke width ~2
  const lgap = ann * 0.5                 // distance from panel edge to dim line
  const tick = ann * 0.35                // half-tick length
  const tgap = ann * 0.75               // distance from panel to text (top/bottom)
  const rgap = ann * 1.1                // distance from panel right to rotated text centre
  const fsDim  = ann                    // main annotation font size
  const fsNote = ann * 0.75             // note font size

  const dimTxt: React.CSSProperties = {
    fill: '#f3ece9', fontSize: fsDim, fontFamily: 'ui-monospace, monospace', fontWeight: 600,
  }
  const noteTxt: React.CSSProperties = {
    fill: '#7c6f6c', fontSize: fsNote, fontFamily: 'ui-monospace, monospace',
  }

  // Annotation line endpoints (top)
  const topLineY = oy - lgap
  const topTextY = oy - tgap
  // Annotation line endpoints (right)
  const rightLineX  = ox + outW + lgap
  const rightTextX  = ox + outW + rgap
  const rightTextCY = oy + outH / 2

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

      <svg ref={svgRef} viewBox={`0 0 ${vbW} ${vbH}`} style={{ width: '100%', display: 'block' }}
        aria-label="Схема зеркала-панно">
        <defs>
          <mask id="tile-band-mask">
            <rect x={bOx} y={bOy}
              width={Math.max(0, bandOuterW)} height={Math.max(0, bandOuterH)}
              fill="white" />
            <rect x={bIx} y={bIy}
              width={Math.max(0, bandInnerW)} height={Math.max(0, bandInnerH)}
              fill="black" />
          </mask>

          <linearGradient id="mir-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cdd3d6" />
            <stop offset="100%" stopColor="#9aa3a7" />
          </linearGradient>
        </defs>

        {/* Dark panel background */}
        <rect x={ox} y={oy} width={outW} height={outH} fill="#1a1314" />

        {/* Outer bagette ring */}
        <path fillRule="evenodd"
          d={`${outerBoxPath} ${bOuterPath}`}
          fill="#8d2233" />

        {/* Tile band background */}
        {bandInnerW > 0 && bandInnerH > 0 && (
          <path fillRule="evenodd"
            d={`${bOuterPath} ${bInnerPath}`}
            fill="#7a5c32" />
        )}

        {/* Tile grid — masked to band ring */}
        <g mask="url(#tile-band-mask)">
          {tileRects}
        </g>

        {/* Inner bagette ring */}
        {mirW > 0 && mirH > 0 && bandInnerW > 0 && bandInnerH > 0 && (
          <path fillRule="evenodd"
            d={`${bInnerPath} ${mirPath}`}
            fill="#5d1622" />
        )}

        {/* Mirror */}
        {mirW > 0 && mirH > 0 && (
          <>
            <rect x={mx} y={my} width={mirW} height={mirH} fill="url(#mir-grad)" />
            <rect x={mx + mirW * 0.12} y={my + mirH * 0.1}
              width={mirW * 0.28} height={mirH * 0.04}
              fill="rgba(255,255,255,0.22)" rx={1} />
          </>
        )}

        {/* === Dimension annotations === */}

        {/* Top: outer width */}
        <line x1={ox} y1={topLineY} x2={ox + outW} y2={topLineY}
          stroke="#5a4e50" strokeWidth={sw} />
        <line x1={ox}        y1={topLineY - tick} x2={ox}        y2={topLineY + tick}
          stroke="#5a4e50" strokeWidth={sw} />
        <line x1={ox + outW} y1={topLineY - tick} x2={ox + outW} y2={topLineY + tick}
          stroke="#5a4e50" strokeWidth={sw} />
        <text x={ox + outW / 2} y={topTextY} textAnchor="middle"
          dominantBaseline="auto" style={dimTxt}>
          {outW} мм
        </text>

        {/* Right: outer height */}
        <line x1={rightLineX} y1={oy} x2={rightLineX} y2={oy + outH}
          stroke="#5a4e50" strokeWidth={sw} />
        <line x1={rightLineX - tick} y1={oy}        x2={rightLineX + tick} y2={oy}
          stroke="#5a4e50" strokeWidth={sw} />
        <line x1={rightLineX - tick} y1={oy + outH} x2={rightLineX + tick} y2={oy + outH}
          stroke="#5a4e50" strokeWidth={sw} />
        <text
          x={rightTextX} y={rightTextCY}
          textAnchor="middle" dominantBaseline="middle"
          transform={`rotate(90,${rightTextX},${rightTextCY})`}
          style={dimTxt}>
          {outH} мм
        </text>

        {/* Mirror label */}
        {mirW > fsDim * 2 && mirH > fsDim * 2 && (
          <>
            <text x={mx + mirW / 2} y={my + mirH / 2 - fsDim * 0.6}
              textAnchor="middle" dominantBaseline="auto"
              style={{ ...dimTxt, fill: '#3a3232', fontSize: fsDim * 0.85 }}>
              {mirW}×{mirH} мм
            </text>
            <text x={mx + mirW / 2} y={my + mirH / 2 + fsDim * 0.8}
              textAnchor="middle" dominantBaseline="auto"
              style={{ ...noteTxt, fill: '#4a4040', fontSize: fsNote * 0.85 }}>
              зеркало
            </text>
          </>
        )}

        {/* Bottom: tile count note */}
        <text x={vbW / 2} y={oy + outH + tgap} textAnchor="middle"
          dominantBaseline="hanging" style={noteTxt}>
          {`бордюр ${(bandArea / 1_000_000).toFixed(4)} м² → ${tiles} плиток`}
        </text>
      </svg>
    </div>
  )
}
