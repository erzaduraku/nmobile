// Render testues: të gjitha templates × lloj × temë. Dalja është OUT, ose folderi i përkohshëm.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
const out = process.env.OUT || path.join(os.tmpdir(), 'n-mobile-renders')
fs.mkdirSync(out, { recursive: true })
const viteBin = path.join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js')
const srv = spawn(process.execPath, [viteBin, 'preview', '--port', '4319', '--strictPort'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 2500))
let browser
try {
  const options = { headless: true }
  if (process.env.CHROME) options.executablePath = process.env.CHROME
  else options.channel = 'chrome'
  browser = await chromium.launch(options)
} catch (error) {
  srv.kill()
  console.error('render-test needs Google Chrome. Set CHROME to the browser executable, or install Chrome.')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
try {
const context = await browser.newContext({ serviceWorkers: 'block' })
const page = await context.newPage()
await page.goto('http://localhost:4319/?test', { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => window.__nm, null, { timeout: 20000 })
if (process.env.NOPRICE) await page.evaluate(() => { window.__np = 1 })
if (process.env.WHITE) await page.evaluate(() => { window.__white = 1 })
if (process.env.FULL) await page.evaluate(() => { window.__full = 1 })
await page.evaluate(([a, b, c]) => { window.__tpls = a; window.__ths = b; window.__types = c }, [process.env.TPLS || '', process.env.THEMES || '', process.env.TYPES || ''])
const total = await page.evaluate(() => {
  const { TEMPLATES, THEMES } = window.__nm
  const want = (list, id) => !list || list.split(',').includes(id)
  let n = 0
  for (const t of TEMPLATES) for (const type of ['post', 'story']) for (const th of THEMES) {
    if (want(window.__tpls, t.id) && want(window.__ths, th.id) && want(window.__types, type)) n++
  }
  return n
})
const shots = []
for (let from = 0; from < total; from += 8) {
  const batch = await page.evaluate(async (range) => {
  const { renderTo, fontsReady, TEMPLATES, THEMES } = window.__nm
  await fontsReady()
  // foto demo: telefon realist në portret (pamje nga mbrapa + përpara), sfond studioje
  const p = document.createElement('canvas'); p.width = 1000; p.height = 1250; const c = p.getContext('2d')
  let g = c.createRadialGradient(500, 520, 80, 500, 600, 900); g.addColorStop(0, '#f4f4f6'); g.addColorStop(1, '#c9ccd3'); c.fillStyle = g; c.fillRect(0, 0, 1000, 1250)
  const sh = c.createRadialGradient(500, 1120, 10, 500, 1120, 420); sh.addColorStop(0, 'rgba(0,0,0,.35)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); c.save(); c.translate(0, 1120); c.scale(1, .12); c.translate(0, -1120); c.fillStyle = sh; c.beginPath(); c.arc(500, 1120, 420, 0, 7); c.fill(); c.restore()
  // pamja nga mbrapa
  c.save(); c.translate(380, 600); c.rotate(-0.06)
  g = c.createLinearGradient(-200, -460, 200, 460); g.addColorStop(0, '#6d6a66'); g.addColorStop(.5, '#4a4845'); g.addColorStop(1, '#2f2e2c'); c.fillStyle = g; c.beginPath(); c.roundRect(-200, -460, 400, 900, 70); c.fill()
  c.strokeStyle = '#8b8883'; c.lineWidth = 6; c.stroke()
  c.fillStyle = 'rgba(255,255,255,.08)'; c.beginPath(); c.roundRect(-170, -430, 190, 200, 50); c.fill()
  for (const [x, y] of [[-110, -370], [-110, -270], [-30, -320]]) { const lg = c.createRadialGradient(x, y, 4, x, y, 42); lg.addColorStop(0, '#5470a0'); lg.addColorStop(.35, '#0b0c10'); lg.addColorStop(1, '#262626'); c.fillStyle = '#9a968f'; c.beginPath(); c.arc(x, y, 46, 0, 7); c.fill(); c.fillStyle = lg; c.beginPath(); c.arc(x, y, 38, 0, 7); c.fill() }
  c.fillStyle = '#f5e6c0'; c.beginPath(); c.arc(-30, -240, 12, 0, 7); c.fill()
  c.restore()
  // pamja përpara
  c.save(); c.translate(610, 640); c.rotate(0.04)
  c.fillStyle = '#1a1a1a'; c.beginPath(); c.roundRect(-205, -470, 410, 920, 72); c.fill(); c.strokeStyle = '#7d7a75'; c.lineWidth = 6; c.stroke()
  g = c.createLinearGradient(-190, -450, 190, 430); g.addColorStop(0, '#ff7a45'); g.addColorStop(.45, '#c2185b'); g.addColorStop(1, '#311b92'); c.fillStyle = g; c.beginPath(); c.roundRect(-188, -452, 376, 884, 58); c.fill()
  c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(60, -60, 260, 120, -0.8, 0, 7); c.fill()
  c.fillStyle = '#000'; c.beginPath(); c.roundRect(-60, -428, 120, 34, 17); c.fill()
  c.fillStyle = 'rgba(255,255,255,.9)'; c.font = '600 92px sans-serif'; c.textAlign = 'center'; c.fillText('9:41', 0, -250)
  c.restore()
  if (window.__white) { // foto produkti në sfond të bardhë
    c.fillStyle = '#fff'; c.fillRect(0, 0, 1000, 1250)
    c.save(); c.translate(380, 620); c.rotate(-0.0); let gg = c.createLinearGradient(-200, -460, 200, 460); gg.addColorStop(0, '#8a2c3b'); gg.addColorStop(1, '#4d1420'); c.fillStyle = gg; c.beginPath(); c.roundRect(-200, -460, 400, 900, 70); c.fill()
    c.fillStyle = 'rgba(255,255,255,.08)'; c.beginPath(); c.roundRect(-175, -435, 200, 210, 50); c.fill()
    for (const [x, y] of [[-115, -375], [-115, -275], [-30, -325]]) { c.fillStyle = '#5d1a26'; c.beginPath(); c.arc(x, y, 46, 0, 7); c.fill(); c.fillStyle = '#0b0b0f'; c.beginPath(); c.arc(x, y, 36, 0, 7); c.fill() }
    c.restore(); c.save(); c.translate(620, 640); c.fillStyle = '#5a1824'; c.beginPath(); c.roundRect(-205, -470, 410, 920, 72); c.fill(); gg = c.createLinearGradient(-190, -450, 190, 430); gg.addColorStop(0, '#d9a3ad'); gg.addColorStop(1, '#3b0d17'); c.fillStyle = gg; c.beginPath(); c.roundRect(-188, -452, 376, 884, 58); c.fill(); c.fillStyle = '#000'; c.beginPath(); c.roundRect(-60, -428, 120, 34, 17); c.fill(); c.restore()
  }
  const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = p.toDataURL() })
  const data = { img, model: window.__white ? 'iphone 18 pro' : 'iPhone 15 Pro Max 256GB', price: window.__np ? '' : '1199', offer: window.__white ? '20' : '-15%', spec: window.__white ? '12GB RAM | 256GB | 200MP | 5000mAh' : '12GB RAM | 256GB | 200MP', info: 'Të ri në pako, 1 vit garancion', cta: 'Bli Tani!', code: window.__white ? 'A3717' : '', region: window.__white ? 'CE' : '', noActive: !!window.__white, logo: null }
  if (window.__full) Object.assign(data, { series: 'Galaxy', model: 'S26 Ultra', seriesBadge: 'Galaxy AI', capacity: '512GB', price: '1199', oldPrice: '1399', offer: '-15%', spec: '12GB RAM | 512GB | 200MP | 5000mAh', colors: [{ name: 'Titan', hex: '#8E8A84' }, { name: 'Blu', hex: '#2F5D9B', delta: '+50' }], condition: 'I ri në pako', notes: ['Me faturë'], code: '', region: '', noActive: false, slogan: 'Fuqia e AI në duart e tua', contact: { phone: '044 123 456', address: 'Prishtinë', instagram: 'nmobile' }, img2: img })
  const want = (list, id) => !list || list.split(',').includes(id)
  const res = []
  let seen = 0
  for (const t of TEMPLATES) for (const type of ['post', 'story']) for (const th of THEMES) {
    if (!want(window.__tpls, t.id) || !want(window.__ths, th.id) || !want(window.__types, type)) continue
    if (seen++ < range.from) continue
    if (res.length >= range.count) break
    const cv = document.createElement('canvas'); renderTo(cv, t.id, type, th, data, 1)
    res.push([(window.__np ? 'noprice_' : '') + (window.__white ? 'white_' : '') + (window.__full ? 'full_' : '') + `${t.id}_${type}_${th.id}.png`, cv.toDataURL('image/png')])
  }
  return res
  }, { from, count: 8 })
  shots.push(...batch)
}
for (const [n, d] of shots) fs.writeFileSync(path.join(out, n), Buffer.from(d.split(',')[1], 'base64'))
console.log('U krijuan', shots.length, 'PNG në', out)
} finally {
  if (browser) await browser.close()
  srv.kill()
}
