import { useId } from 'react'
import { N_SHAPE, SLASH, MARK_W, LOGO_VARIANTS, L, WORD, WORD_FONT, pts } from '../../lib/canvas/logoGeom.js'

function MarkShape({ color }) {
  const id = useId().replace(/:/g, '')
  return (
    <>
      <defs><clipPath id={id}><path clipRule="evenodd" d={`M-200 -200H400V300H-200Z M${pts(SLASH).replace(/ /g, ' L')}Z`} /></clipPath></defs>
      <polygon points={pts(N_SHAPE)} fill={color} clipPath={`url(#${id})`} />
    </>
  )
}

export function Mark({ size = 36, variant = 'red' }) {
  return <svg width={(size * MARK_W) / 100} height={size} viewBox={`0 0 ${MARK_W} 100`} aria-hidden="true"><MarkShape color={LOGO_VARIANTS[variant].a} /></svg>
}

// Logoja si SVG (gjeometria e njëjtë me canvas-in)
export default function Logo({ size = 36, custom, variant = 'red' }) {
  if (custom) return <img src={custom} alt="Logo" style={{ height: size * 1.15 }} className="object-contain" />
  const P = LOGO_VARIANTS[variant]
  const tw = 1.58 // gjerësia e "mobile" në njësi h
  const W = (L.textX + tw + 0.08) * 100, H = (L.lineY + L.lineH * 1.7) * 100
  const lx = L.lineStart * 100, rx = (L.textX + tw) * 100, ly = L.lineY * 100, lh = L.lineH * 100, mx = (lx + rx) / 2
  return (
    <svg height={(size * H) / 100} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="N Mobile">
      <MarkShape color={P.a} />
      <text x={L.textX * 100} y={L.baseline * 100} fontFamily={`'${WORD_FONT}', sans-serif`} fontStyle="italic" fontWeight="800" fontSize={L.textSize * 100} fill={P.text} textLength={tw * 100} lengthAdjust="spacingAndGlyphs">{WORD}</text>
      <path d={`M${lx} ${ly + lh * 0.55} Q${mx} ${ly + lh * 0.9} ${rx + 6} ${ly - lh * 0.2} L${rx - 2} ${ly + lh} Q${mx} ${ly + lh * 1.6} ${lx} ${ly + lh * 0.75}Z`} fill={P.line} />
    </svg>
  )
}
