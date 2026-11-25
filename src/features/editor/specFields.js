// Specifikat si fusha të veçanta. Ruhen ende si një tekst `spec` ("12GB RAM | 256GB | 48MP | 5000mAh | 6.9\""),
// kështu postimet e vjetra dhe kolona ekzistuese funksionojnë pa migrim.
export const SPEC_FIELDS = [
  { id: 'ram', label: 'RAM', picks: ['4GB', '6GB', '8GB', '12GB', '16GB'], ph: 'p.sh. 12GB', cap: 'RAM' },
  { id: 'storage', label: 'Memoria', picks: ['64GB', '128GB', '256GB', '512GB', '1TB'], ph: 'p.sh. 256GB', cap: 'Memoria' },
  { id: 'camera', label: 'Kamera', picks: ['12MP', '48MP', '50MP', '108MP', '200MP'], ph: 'p.sh. 48MP', cap: 'Kamera' },
  { id: 'battery', label: 'Bateria', picks: ['4000mAh', '4500mAh', '5000mAh', '6000mAh'], ph: 'p.sh. 5000mAh', cap: 'Bateria' },
  { id: 'screen', label: 'Ekrani', picks: ['6.1"', '6.3"', '6.7"', '6.9"'], ph: 'p.sh. 6.9"', cap: 'Ekrani' },
]
export const EMPTY_SPECS = { ram: '', storage: '', camera: '', battery: '', screen: '', extra: '' }

const num = (v) => (v || '').trim().replace(',', '.')
// Shton njësinë kur shkruhet vetëm numri
export function normField(id, v) {
  const s = num(v); if (!s) return ''
  const n = /^\d+(\.\d+)?$/.test(s)
  if (id === 'ram') return (n ? s + 'GB' : s.replace(/\s*ram$/i, '').replace(/gb$/i, 'GB'))
  if (id === 'storage') return n ? (Number(s) <= 4 ? s + 'TB' : s + 'GB') : s.replace(/(gb|tb)$/i, (u) => u.toUpperCase())
  if (id === 'camera') return n ? s + 'MP' : s.replace(/mp$/i, 'MP')
  if (id === 'battery') return n ? s + 'mAh' : s.replace(/mah$/i, 'mAh')
  if (id === 'screen') return n ? s + '"' : s.replace(/\s*(inch|in|”)$/i, '"')
  return s
}
// Fushat -> tekst (rendi: RAM, Memoria, Kamera, Bateria, Ekrani)
export function composeSpec(f) {
  const out = []
  const r = normField('ram', f.ram); if (r) out.push(r + ' RAM')
  for (const id of ['storage', 'camera', 'battery', 'screen']) { const v = normField(id, f[id]); if (v) out.push(v) }
  if ((f.extra || '').trim()) out.push(f.extra.trim())
  return out.join(' | ')
}
// Tekst i vjetër -> fusha (pjesët e panjohura ruhen te `extra`)
export function parseSpec(text) {
  const f = { ...EMPTY_SPECS }, extra = []
  for (const p0 of (text || '').split(/\s*[|,;•]\s*/)) {
    const p = p0.trim(); if (!p) continue; const q = p.toLowerCase()
    if (/ram/.test(q) && !f.ram) f.ram = p.replace(/\s*ram\s*/i, '').trim()
    else if (/\d\s*mp\b|kamer|camera/.test(q) && !f.camera) f.camera = p.replace(/\s+/g, '')
    else if (/mah/.test(q) && !f.battery) f.battery = p.replace(/\s+/g, '')
    else if (/^\d+([.,]\d+)?\s*(gb|tb)$/.test(q) && !f.storage) f.storage = p.replace(/\s+/g, '')
    else if (/^\d+([.,]\d+)?\s*("|”|inch|in)$/.test(q) && !f.screen) f.screen = p.replace(/\s+/g, '')
    else extra.push(p)
  }
  f.extra = extra.join(' | ')
  return f
}
// Rreshtat për caption-in
export function captionSpecs(f) {
  return SPEC_FIELDS.map((x) => { const v = normField(x.id, f[x.id]); return v ? `${x.cap}: ${v}` : '' }).filter(Boolean).concat((f.extra || '').trim() ? [f.extra.trim()] : [])
}
