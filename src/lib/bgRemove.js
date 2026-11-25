// Background removal for product photos.
// 1) Fast path (no download): if the photo border is smooth (solid colour or gentle gradient,
//    any colour), flood-fill from all borders with an adaptive tolerance. Only regions connected
//    to the border are removed, so whites/colours inside the phone stay. Edge pixels get a soft
//    alpha (1-2 px feather) and are decontaminated from the background colour (no light halo).
// 2) AI path (busy backgrounds): @imgly/background-removal, lazy-loaded on click. Its model and
//    onnxruntime wasm files are fetched from the imgly CDN at runtime (nothing big in our bundle).
// Both return a PNG Blob with transparency, cropped to the product (+ small margin).
import { blobToImg } from './photoStore.js'

const MAXPX = 1600
function readPixels(img) {
  const k = Math.min(1, MAXPX / Math.max(img.naturalWidth, img.naturalHeight))
  const W = Math.max(1, Math.round(img.naturalWidth * k)), H = Math.max(1, Math.round(img.naturalHeight * k))
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, W, H)
  return { c, x, W, H, id: x.getImageData(0, 0, W, H) }
}
const dist = (p, a, b) => Math.max(Math.abs(p[a] - p[b]), Math.abs(p[a + 1] - p[b + 1]), Math.abs(p[a + 2] - p[b + 2]))
const pct = (arr, q) => { const s = Float32Array.from(arr).sort(); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : 0 }

// Border pixel indices in perimeter order (clockwise), `inset` px from the edge.
function perimeter(W, H, inset = 1) {
  const out = [], x0 = inset, y0 = inset, x1 = W - 1 - inset, y1 = H - 1 - inset
  for (let x = x0; x <= x1; x++) out.push(y0 * W + x)
  for (let y = y0 + 1; y <= y1; y++) out.push(y * W + x1)
  for (let x = x1 - 1; x >= x0; x--) out.push(y1 * W + x)
  for (let y = y1 - 1; y > y0; y--) out.push(y * W + x0)
  return out
}
const hasAlpha = (p) => { for (let i = 3; i < p.length; i += 4 * 7) if (p[i] < 250) return true; return false }

/* Analyses the photo. Returns { alpha } for images that are already cut out,
   else { smooth, step } where smooth = border is a solid colour / gradient (fast path works). */
export function analyse(px, W, H) {
  const p = px.data
  if (hasAlpha(p)) return { alpha: true, smooth: false }
  if (W < 16 || H < 16) return { smooth: false }
  const per = perimeter(W, H, 1), steps = []
  for (let i = 0; i < per.length; i++) steps.push(dist(p, per[i] * 4, per[(i + 1) % per.length] * 4))
  // a phone touching the edge only adds a few jumps; busy backgrounds jump all along the border
  // count separate jumps (consecutive big steps = one edge)
  let jumps = 0; for (let i = 0; i < steps.length; i++) if (steps[i] > 22 && !(steps[(i - 1 + steps.length) % steps.length] > 22)) jumps++
  const p90 = pct(steps, 0.9)
  return { smooth: jumps <= 8 && p90 < 10, step: Math.min(22, Math.max(9, p90 * 2.5 + 7)) }
}

function cropToAlpha(c, x, W, H, p) {
  let x0 = W, y0 = H, x1 = -1, y1 = -1
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) if (p[(y * W + xx) * 4 + 3] > 12) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y }
  if (x1 < x0) return null
  const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.02)
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad)
  const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1
  o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height)
  return new Promise((r) => o.toBlob(r, 'image/png'))
}

/* Flood-fill removal. force = run even if the border is not smooth (manual toggle).
   Returns a PNG Blob, or null when nothing sensible could be removed. */
export async function floodRemove(blob, { force = false } = {}) {
  const img = await blobToImg(blob)
  try {
    const { c, x, W, H, id } = readPixels(img), p = id.data, N = W * H
    const a = analyse(id, W, H)
    if (a.alpha || (!a.smooth && !force)) return null
    const S = a.step || 14
    // global cap: never further from the border colours than the border itself varies (+ margin)
    const per = perimeter(W, H, 0), ref = new Uint8ClampedArray(3)
    for (let k = 0; k < 3; k++) ref[k] = pct(per.map((i) => p[i * 4 + k]), 0.5)
    const refD = (o) => Math.max(Math.abs(p[o] - ref[0]), Math.abs(p[o + 1] - ref[1]), Math.abs(p[o + 2] - ref[2]))
    const G = pct(per.map((i) => refD(i * 4)), 0.98) + 28
    const bg = new Uint8Array(N), q = new Int32Array(N); let qh = 0, qt = 0
    for (const i of per) if (refD(i * 4) <= G) { bg[i] = 1; q[qt++] = i }
    while (qh < qt) {
      const i = q[qh++], u = i % W, v = (i / W) | 0, o = i * 4
      const nb = [u > 0 ? i - 1 : -1, u < W - 1 ? i + 1 : -1, v > 0 ? i - W : -1, v < H - 1 ? i + W : -1]
      for (const j of nb) { if (j < 0 || bg[j]) continue; const oj = j * 4; if (dist(p, oj, o) <= S && refD(oj) <= G) { bg[j] = 1; q[qt++] = j } }
    }
    let removed = 0; for (let i = 0; i < N; i++) removed += bg[i]
    if (removed < N * 0.03 || removed > N * 0.97) return null
    // alpha: background 0; foreground pixels next to the background get a soft, decontaminated edge
    const A = new Float32Array(N); for (let i = 0; i < N; i++) A[i] = bg[i] ? 0 : 1
    // edge band = foreground pixels within 2 px of the background
    const band = new Uint8Array(N)
    for (let i = 0; i < N; i++) if (!bg[i]) {
      const u = i % W, v = (i / W) | 0
      outer: for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const uu = u + dx, vv = v + dy; if (uu >= 0 && vv >= 0 && uu < W && vv < H && bg[vv * W + uu]) { band[i] = 1; break outer } }
    }
    // alpha by projecting each edge pixel between the local background colour B and the local
    // product colour F (mixed anti-aliased pixels get partial alpha), then remove B from the colour
    const avg = (u, v, r, pick) => { let R = 0, G2 = 0, Bb = 0, n = 0; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const uu = u + dx, vv = v + dy; if (uu < 0 || vv < 0 || uu >= W || vv >= H) continue; const j = vv * W + uu; if (pick(j)) { const o = j * 4; R += p[o]; G2 += p[o + 1]; Bb += p[o + 2]; n++ } } return n ? [R / n, G2 / n, Bb / n] : null }
    const src = new Uint8ClampedArray(p)
    for (let i = 0; i < N; i++) if (band[i]) {
      const u = i % W, v = (i / W) | 0, o = i * 4
      const Bc = avg(u, v, 3, (j) => bg[j]), Fc = avg(u, v, 4, (j) => !bg[j] && !band[j])
      if (!Bc) continue
      let al
      if (Fc) {
        const fx = Fc[0] - Bc[0], fy = Fc[1] - Bc[1], fz = Fc[2] - Bc[2], ff = fx * fx + fy * fy + fz * fz
        al = ff > 300 ? ((src[o] - Bc[0]) * fx + (src[o + 1] - Bc[1]) * fy + (src[o + 2] - Bc[2]) * fz) / ff : 1
      } else al = Math.max(Math.abs(src[o] - Bc[0]), Math.abs(src[o + 1] - Bc[1]), Math.abs(src[o + 2] - Bc[2])) / 80
      al = Math.min(1, Math.max(0, al)); if (al > 0.92) al = 1
      A[i] = al
      if (al > 0.04 && al < 1) for (let k = 0; k < 3; k++) p[o + k] = (src[o + k] - (1 - al) * Bc[k]) / al
    }
    // 1 px feather on the edge band (3x3 average)
    const F = A.slice()
    for (let i = 0; i < N; i++) if (band[i] || (bg[i] && (band[i - 1] || band[i + 1] || band[i - W] || band[i + W]))) {
      const u = i % W, v = (i / W) | 0; let s = 0, n = 0
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const uu = u + dx, vv = v + dy; if (uu < 0 || vv < 0 || uu >= W || vv >= H) continue; s += A[vv * W + uu]; n++ }
      F[i] = (A[i] + s / n) / 2
    }
    for (let i = 0; i < N; i++) p[i * 4 + 3] = Math.round(F[i] * 255)
    x.putImageData(id, 0, 0)
    return await cropToAlpha(c, x, W, H, p)
  } finally { URL.revokeObjectURL(img.src) }
}

// Drops leftover islands the model kept from busy backgrounds: keeps the largest visible region
// and any region at least 15% of its size (e.g. a second phone).
function keepMainObject(p, W, H) {
  const N = W * H, lab = new Int32Array(N), sizes = [0], q = new Int32Array(N)
  for (let s = 0; s < N; s++) {
    if (lab[s] || p[s * 4 + 3] < 32) continue
    const L = sizes.length; let qh = 0, qt = 0, n = 0; lab[s] = L; q[qt++] = s
    while (qh < qt) { const i = q[qh++], u = i % W; n++
      for (const j of [u > 0 ? i - 1 : -1, u < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < N && !lab[j] && p[j * 4 + 3] >= 32) { lab[j] = L; q[qt++] = j } }
    sizes.push(n)
  }
  const max = Math.max(0, ...sizes)
  for (let i = 0; i < N; i++) { const L = lab[i]; if (p[i * 4 + 3] && (!L || sizes[L] < max * 0.15)) p[i * 4 + 3] = L ? 0 : p[i * 4 + 3] < 32 && nearKept(i) ? p[i * 4 + 3] : 0 }
  function nearKept(i) { const u = i % W; for (const j of [u > 0 ? i - 1 : -1, u < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < N && lab[j] && sizes[lab[j]] >= max * 0.15) return true; return false }
}

/* AI removal (any background). progress(0..1) is optional. */
export async function aiRemove(blob, progress) {
  const { removeBackground } = await import('@imgly/background-removal')
  const out = await removeBackground(blob, {
    model: 'isnet_fp16',
    output: { format: 'image/png', quality: 1 },
    progress: progress ? (key, cur, tot) => { if (/fetch/.test(key) && tot) progress(cur / tot) } : undefined,
  })
  const img = await blobToImg(out)
  try {
    const { c, x, W, H, id } = readPixels(img)
    keepMainObject(id.data, W, H); x.putImageData(id, 0, 0)
    return (await cropToAlpha(c, x, W, H, id.data)) || out
  } finally { URL.revokeObjectURL(img.src) }
}

// Quick check used when a saved photo is reopened: would the fast path apply?
export async function canFlood(blob) {
  const img = await blobToImg(blob)
  try { const { id, W, H } = readPixels(img); const a = analyse(id, W, H); return { alpha: !!a.alpha, smooth: !!a.smooth } } finally { URL.revokeObjectURL(img.src) }
}
