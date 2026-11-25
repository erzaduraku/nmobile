// Discount from two printed prices. The model label is never trusted on its own.

export function parseAmount(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/\s/g, '').replace(/[€$£]/g, '').replace(',', '.')
  const match = cleaned.match(/\d+(?:\.\d+)?/)
  if (!match) return null
  const n = Number(match[0])
  return Number.isFinite(n) ? n : null
}

export function parsePercent(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null
  const match = value.replace(',', '.').match(/-?\d+(?:\.\d+)?/)
  if (!match) return null
  const n = Math.abs(Number(match[0]))
  return Number.isFinite(n) ? n : null
}

/** Calculated discount. shown is false when the printed label disagrees or the prices cannot be used. */
export function discountFromPrices(oldPrice, price, label) {
  const old = parseAmount(oldPrice)
  const next = parseAmount(price)
  if (old == null || next == null || !(old > 0) || next >= old) {
    return { discount: null, valid: false, shown: false, source: null }
  }
  const discount = Math.round(((old - next) / old) * 1000) / 10
  if (!(discount > 0) || discount > 100) return { discount: null, valid: false, shown: false, source: 'calculated' }
  const printed = parsePercent(label)
  if (printed != null && Math.abs(printed - discount) > 1) {
    return { discount, valid: false, shown: false, source: 'calculated', disagrees: true }
  }
  return { discount, valid: true, shown: true, source: 'calculated', disagrees: false }
}
