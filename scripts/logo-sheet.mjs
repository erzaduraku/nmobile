import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
const srv = spawn('npx', ['vite', 'preview', '--port', '4322', '--strictPort'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 2500))
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' })
const p = await b.newPage(); await p.goto('http://localhost:4322/?test'); await p.waitForFunction(() => window.__nm)
const url = await p.evaluate(async () => {
  const { drawLogo, drawMark, fontsReady } = window.__nm; await fontsReady()
  const c = document.createElement('canvas'); c.width = 1600; c.height = 1000; const x = c.getContext('2d')
  const bg = [['#141416', 'dark'], ['#F4F1EE', 'red'], ['#E10600', 'white'], ['#FFFFFF', 'black']]
  bg.forEach(([col, v], i) => { const cx = (i % 2) * 800, cy = Math.floor(i / 2) * 340; x.fillStyle = col; x.fillRect(cx, cy, 800, 340); drawLogo(x, cx + 400, cy + 110, 120, v, null, 'center') })
  x.fillStyle = '#ddd'; x.fillRect(0, 680, 1600, 320)
  ;[['#111', 'dark', 40], ['#E10600', 'white', 40], ['#fff', 'red', 40]].forEach(([col, v, r], i) => { const ox = 200 + i * 300, oy = 720; x.fillStyle = col; x.beginPath(); x.roundRect(ox, oy, 240, 240, r); x.fill(); drawMark(x, ox + 120 - 0.59 * 140, oy + 50, 140, v) })
  drawLogo(x, 1100, 790, 60, 'red', null, 'left'); drawLogo(x, 1100, 880, 34, 'red', null, 'left')
  return c.toDataURL()
})
fs.writeFileSync('/workspace/n-mobile-renders/logo_new.png', Buffer.from(url.split(',')[1], 'base64'))
await b.close(); srv.kill(); console.log('ok')
