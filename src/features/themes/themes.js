import THEMES_JSON from './themes.json'

// Temat (konfigurim i ndarë te themes.json): Standard, Stinët, Festat.
export const THEMES = THEMES_JSON
export const GROUPS = [['standard', 'Standard'], ['stinet', 'Stinët'], ['festat', 'Festat']]
export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0]

const DAY = 86400000
const at = (y, m, d) => new Date(y, m - 1, d)
// E premtja e 4-t e nëntorit
const blackFriday = (y) => { const d = at(y, 11, 1); const first = (5 - d.getDay() + 7) % 7; return at(y, 11, 1 + first + 21) }
function nextEvent(w, today) {
  const y = today.getFullYear(), list = []
  if (w.fixed) for (const yy of [y - 1, y, y + 1]) list.push(at(yy, w.fixed[0], w.fixed[1]))
  if (w.rule === 'blackfriday') for (const yy of [y - 1, y, y + 1]) list.push(blackFriday(yy))
  if (w.dates) for (const s of w.dates) { const [a, b, c] = s.split('-').map(Number); list.push(at(a, b, c)) }
  // ngjarja më e afërt që s'ka kaluar më shumë se "after" ditë
  return list.filter((d) => (today - d) / DAY <= (w.after ?? 1)).sort((a, b) => a - b)[0] || null
}
const SEASON = (m) => (m >= 3 && m <= 5 ? 'pranvere' : m >= 6 && m <= 8 ? 'vere' : m >= 9 && m <= 11 ? 'vjeshte' : 'dimer')

/* Sugjerimi sipas datës: festa më e afërt brenda periudhës së saj (lead ditë para),
   përndryshe stina. Kthen { theme, reason, upcoming } */
export function suggestTheme(today = new Date()) {
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  let best = null, soon = null
  for (const t of THEMES) {
    if (!t.when) continue
    const d = nextEvent(t.when, t0); if (!d) continue
    const days = Math.round((d - t0) / DAY)
    if (days <= (t.when.lead ?? 7) && (!best || Math.abs(days) < Math.abs(best.days))) best = { t, d, days }
    if (days >= 0 && (!soon || days < soon.days)) soon = { t, d, days }
  }
  const fmt = (d) => d.toLocaleDateString('sq-AL', { day: 'numeric', month: 'long' })
  if (best) return { theme: best.t, reason: best.days > 0 ? `${best.t.name} pas ${best.days} ditësh (${fmt(best.d)})` : best.days === 0 ? `Sot është ${best.t.name}` : `${best.t.name} sapo kaloi`, upcoming: soon && soon.t.id !== best.t.id ? soon : null, fmt }
  const s = themeById(SEASON(t0.getMonth() + 1))
  return { theme: s, reason: `Stina e tanishme: ${s.name}`, upcoming: soon, fmt }
}
