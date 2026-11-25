// Krijon ikonat e PWA-së nga shenja "N" (src/lib/logoGeom.js)
import sharp from 'sharp'
import fs from 'node:fs'
import { N_SHAPE, SLASH, MARK_W, pts } from '../src/lib/canvas/logoGeom.js'
const svg = (s, rx, scale) => {
  const h = s * scale, k = h / 100, ox = (s - MARK_W * k) / 2, oy = (s - h) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><defs><clipPath id="c"><path clip-rule="evenodd" d="M-10 -10H${s + 10}V${s + 10}H-10Z M${pts(SLASH, k, ox, oy).replace(/ /g, ' L')}Z"/></clipPath></defs><rect width="${s}" height="${s}" rx="${rx}" fill="#141416"/><polygon clip-path="url(#c)" fill="#E10600" points="${pts(N_SHAPE, k, ox, oy)}"/></svg>`
}
fs.writeFileSync('public/favicon.svg', svg(512, 112, 0.56))
await sharp(Buffer.from(svg(192, 42, 0.56))).png().toFile('public/icon-192.png')
await sharp(Buffer.from(svg(512, 112, 0.56))).png().toFile('public/icon-512.png')
await sharp(Buffer.from(svg(512, 0, 0.46))).png().toFile('public/icon-maskable-512.png')
await sharp(Buffer.from(svg(180, 0, 0.54))).png().toFile('public/apple-touch-icon.png')
console.log('ikonat u krijuan')
