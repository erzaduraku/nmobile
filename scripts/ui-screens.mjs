// Dev: screenshots of every screen at 390px (needs `npm run build` and Google Chrome).
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const O = (process.env.OUT || '/workspace/n-mobile-renders') + '/'
const srv = spawn('npx', ['vite', 'preview', '--port', '4323', '--strictPort'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 2500))
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome' })
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const errs = []; p.on('pageerror', (e) => errs.push(e.message))
const shot = (n) => p.screenshot({ path: O + 'ui_' + n + '.png' })
await p.goto('http://localhost:4323/'); await p.waitForTimeout(1600)
const local = await p.$('text=Vazhdo pa llogari'); if (local) { await local.click(); await p.waitForTimeout(1300) }
await shot('home')
await p.setInputFiles('input[type=file]', process.env.PHOTO || O + 'white_hero_post_standard.png'); await p.waitForTimeout(1500)
await shot('step2_template')
await p.click('text=/^Vazhdo: Tema/'); await p.click('text=Krishtlindje'); await p.waitForTimeout(700); await shot('step3_tema')
await p.click('text=/^Vazhdo: Detajet/'); await p.fill('input[placeholder="p.sh. S26 Ultra"]', 'samsung galaxy s24 ultra'); await p.fill('input[placeholder="p.sh. 899"]', '1099'); await p.click('text=Më shumë detaje'); for (const c of ['12GB', '256GB', '5000mAh']) await p.click(`[data-spec-section] button:has-text("${c}")`); await p.fill('input[aria-label="Kamera tjetër"]', '64'); await p.fill('input[placeholder="p.sh. A3717"]', 'a3717'); await p.selectOption('select', 'CE'); await p.click('text=No Active'); await p.waitForTimeout(3200); await shot('step4_detajet')
await p.evaluate(() => { const c = document.querySelector('canvas')?.closest('.sticky'); if (c) c.style.display = 'none' }); await (await p.$('[data-spec-section]')).screenshot({ path: O + 'ui_detajet_specs.png' }); await p.evaluate(() => { const c = document.querySelector('canvas')?.closest('.sticky'); if (c) c.style.display = '' })
await p.evaluate(() => window.scrollTo(0, 2000)); await p.waitForTimeout(300); await shot('step4_detajet_bottom')
await p.click('text=/^Vazhdo: Eksporto/'); await p.waitForTimeout(700); await shot('step5_posto')
await p.click('text=Shkarko').catch(() => {}); await p.waitForTimeout(800)
await p.click('[aria-label=Mbyll]'); await p.waitForTimeout(500); await shot('home_with_posts')
for (const m of ['iphone 16 pro max', 'galaxy z fold6']) {
  await p.click('nav >> text=Kryefaqja'); await p.waitForTimeout(300)
  await p.setInputFiles('input[type=file]', O + 'white_red_post_standard.png'); await p.waitForTimeout(1200)
  await p.click('text=/^Vazhdo: Tema/'); await p.click('text=/^Vazhdo: Detajet/'); await p.fill('input[placeholder="p.sh. S26 Ultra"]', m); await p.waitForTimeout(3300)
  await p.click('[aria-label=Mbyll]'); await p.waitForTimeout(500)
}
await p.click('nav >> text=Postimet'); await p.waitForTimeout(600); await shot('postimet')
await p.click('button:has-text("Draftet")'); await p.waitForTimeout(400); await shot('postimet_draftet')
await p.click('nav >> text=Cilësime'); await p.waitForTimeout(400); await shot('cilesime')
console.log('errors', errs); await b.close(); srv.kill()
