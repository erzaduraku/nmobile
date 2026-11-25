// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { analyse, canFlood, floodRemove } from './bgRemove.js'

// jsdom cannot decode image bytes. blobToImg only supplies the pixels the real
// flood fill then reads through a pixel canvas. The removal code itself is not stubbed.
vi.mock('./photoStore.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    blobToImg: async (blob) => {
      const px = blob.__px
      if (!px) throw new Error('test image has no pixels')
      return {
        naturalWidth: px.w,
        naturalHeight: px.h,
        width: px.w,
        height: px.h,
        src: 'blob:http://127.0.0.1/photo',
        __px: px,
      }
    },
  }
})

function makeCanvas() {
  let width = 0
  let height = 0
  let data = new Uint8ClampedArray(0)
  const resize = () => { data = new Uint8ClampedArray(Math.max(0, width * height * 4)) }
  const ctx = {
    drawImage(src, a, b, c, d, e, f, g, h) {
      const srcData = src._data || src.__px?.data
      const srcW = src._data ? src.width : src.__px.w
      const srcH = src._data ? src.height : src.__px.h
      let sx, sy, sw, sh, dx, dy, dw, dh
      if (h === undefined) { sx = 0; sy = 0; sw = srcW; sh = srcH; dx = a; dy = b; dw = c; dh = d }
      else { sx = a; sy = b; sw = c; sh = d; dx = e; dy = f; dw = g; dh = h }
      for (let y = 0; y < dh; y++) {
        for (let x = 0; x < dw; x++) {
          const ix = Math.min(srcW - 1, sx + Math.floor((x * sw) / dw))
          const iy = Math.min(srcH - 1, sy + Math.floor((y * sh) / dh))
          const s = (iy * srcW + ix) * 4
          const o = ((dy + y) * width + (dx + x)) * 4
          data[o] = srcData[s]; data[o + 1] = srcData[s + 1]; data[o + 2] = srcData[s + 2]; data[o + 3] = srcData[s + 3]
        }
      }
    },
    getImageData(x, y, w, h) {
      const out = new Uint8ClampedArray(w * h * 4)
      for (let row = 0; row < h; row++) out.set(data.slice(((y + row) * width + x) * 4, ((y + row) * width + x + w) * 4), row * w * 4)
      return { data: out, width: w, height: h }
    },
    putImageData(image, x, y) {
      for (let row = 0; row < image.height; row++) data.set(image.data.slice(row * image.width * 4, (row + 1) * image.width * 4), ((y + row) * width + x) * 4)
    },
  }
  return {
    get width() { return width },
    set width(v) { width = v; resize() },
    get height() { return height },
    set height(v) { height = v; resize() },
    get _data() { return data },
    getContext() { return ctx },
    toBlob(cb, type) {
      const blob = new Blob([data], { type: type || 'image/png' })
      blob.__px = { w: width, h: height, data: data.slice() }
      cb(blob)
    },
  }
}

function pixels(w, h, paint) {
  const data = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [r, g, b, a] = paint(x, y)
    const o = (y * w + x) * 4
    data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = a ?? 255
  }
  return { data, width: w, height: h }
}

function imageBlob(px) {
  const blob = new Blob([px.data], { type: 'image/png' })
  blob.__px = { w: px.width, h: px.height, data: px.data }
  return blob
}

beforeEach(() => {
  URL.revokeObjectURL = () => {}
  const real = document.createElement.bind(document)
  document.createElement = (tag, ...args) => (String(tag).toLowerCase() === 'canvas' ? makeCanvas() : real(tag, ...args))
})

describe('analyse', () => {
  test('a flat border is smooth and an existing cut-out is left alone', () => {
    const flat = pixels(32, 32, () => [240, 240, 240])
    const smooth = analyse(flat, 32, 32)
    expect(smooth.smooth).toBe(true)
    expect(smooth.alpha).toBeUndefined()

    const cut = pixels(32, 32, () => [240, 240, 240, 0])
    expect(analyse(cut, 32, 32).alpha).toBe(true)

    expect(analyse(pixels(8, 8, () => [255, 255, 255]), 8, 8).smooth).toBe(false)
  })

  test('a border that keeps changing colour is not a plain background', () => {
    const busy = pixels(32, 32, (x, y) => [(x * 40) % 255, (y * 70) % 255, 20])
    expect(analyse(busy, 32, 32).smooth).toBe(false)
  })
})

describe('floodRemove', () => {
  test('removes a plain border and keeps the product', async () => {
    const px = pixels(40, 40, (x, y) => (x > 12 && x < 28 && y > 10 && y < 30 ? [20, 20, 20] : [250, 250, 250]))
    const out = await floodRemove(imageBlob(px))
    expect(out).toBeInstanceOf(Blob)
    expect(out.type).toBe('image/png')
    const alphas = out.__px.data.filter((_, i) => i % 4 === 3)
    expect(alphas.some((a) => a === 0)).toBe(true)
    expect(alphas.some((a) => a > 200)).toBe(true)
  })

  test('does not strip a photo that is already transparent or has a busy border', async () => {
    const cut = pixels(32, 32, (x, y) => [20, 20, 20, x > 8 && x < 24 && y > 8 && y < 24 ? 255 : 0])
    expect(await floodRemove(imageBlob(cut))).toBeNull()
    const busy = pixels(32, 32, (x, y) => [(x * 50) % 255, (y * 90) % 255, (x * y) % 255])
    expect(await floodRemove(imageBlob(busy))).toBeNull()
    const check = await canFlood(imageBlob(busy))
    expect(check).toEqual({ alpha: false, smooth: false })
  })
})
