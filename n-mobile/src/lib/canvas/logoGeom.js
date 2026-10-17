// Gjeometria e shenjës "N" (lartësia 100): një formë e vetme, e pjerrët,
// me një prerje diagonale "thikë" si hapësirë negative.
const SKEW = 0.24
const sk = ([x, y]) => [+(x + (100 - y) * SKEW).toFixed(2), y]
// N e trashë (drejt), pastaj e pjerrët
export const N_SHAPE = [[0, 100], [0, 0], [32, 0], [64, 54], [64, 0], [94, 0], [94, 100], [62, 100], [30, 46], [30, 100]].map(sk)
// prerja: shirit i hollë diagonal që e pret N-në në pjesën e sipërme majtas
export const SLASH = [[-12, 70], [44, -12], [53, -12], [-3, 70]].map(sk)
export const MARK_W = 94 + 100 * SKEW
export const LOGO_VARIANTS = {
  red:   { a: '#E10600', text: '#E10600', line: '#111111' },
  dark:  { a: '#E10600', text: '#E10600', line: '#FFFFFF' },
  white: { a: '#FFFFFF', text: '#FFFFFF', line: '#FFFFFF' },
  black: { a: '#111111', text: '#111111', line: '#E10600' },
}
// Përmasat relative ndaj lartësisë h të shenjës (N më e lartë se "mobile")
export const L = { textX: 1.12, textSize: 0.66, baseline: 0.88, lineY: 0.96, lineH: 0.085, lineStart: 0.55 }
export const WORD = 'mobile'
export const WORD_FONT = 'Barlow Condensed'
export const pts = (p, k = 1, ox = 0, oy = 0) => p.map(([x, y]) => `${(ox + x * k).toFixed(1)},${(oy + y * k).toFixed(1)}`).join(' ')
