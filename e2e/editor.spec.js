import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

// 8×8 red PNG. Enough for the photo step; the test does not depend on how it is drawn.
const photo = join(mkdtempSync(join(tmpdir(), 'nmobile-')), 'phone.png')
writeFileSync(photo, Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGElEQVR4nGP8z8Dwn4EIwDiqEAYGBob4DAAAnQMD/8s1c0sAAAAASUVORK5CYII=',
  'base64',
))

async function openLocal(page) {
  await page.goto('/')
  const start = page.getByRole('button', { name: /Vazhdo pa llogari/ })
  const home = page.getByRole('heading', { name: 'Mirë se erdhe' })
  await expect(start.or(home)).toBeVisible()
  if (await start.isVisible()) await start.click()
  await expect(home).toBeVisible()
}

async function startFromPhoto(page) {
  await openLocal(page)
  await page.locator('input[type="file"]').first().setInputFiles(photo)
  await expect(page.getByText('Hapi 1 nga 5')).toBeVisible()
  await expect(page.getByText('Ndrysho foton')).toBeVisible()
}

test('the app loads and offers a device-only session when Supabase is not configured', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Postime për Instagram')).toBeVisible()
  await expect(page.getByText('Hyrja nuk është konfiguruar')).toBeVisible()
  await expect(page.getByRole('button', { name: /Vazhdo pa llogari/ })).toBeVisible()
})

test('a photo opens the editor and a template can be selected', async ({ page }) => {
  await startFromPhoto(page)
  await page.getByRole('button', { name: 'Vazhdo: Template' }).click()
  await expect(page.getByText('Hapi 2 nga 5')).toBeVisible()
  await page.getByRole('button', { name: 'Studio' }).click()
  await page.getByRole('button', { name: 'Vazhdo: Tema' }).click()
  await expect(page.getByText(/Studio ·/)).toBeVisible()
})

test('a draft is saved on the device and restored with the same model', async ({ page }) => {
  await startFromPhoto(page)
  await page.getByRole('button', { name: 'Detajet' }).click()
  await expect(page.getByText('Hapi 4 nga 5')).toBeVisible()
  await page.getByPlaceholder('p.sh. S26 Ultra').fill('iPhone 13')
  await page.getByRole('button', { name: 'Ruaj si draft' }).click()
  await expect(page.getByText('U ruajt si draft')).toBeVisible()
  await page.getByRole('button', { name: 'Mbyll' }).click()
  await page.getByRole('button', { name: 'Postimet' }).click()
  await expect(page.getByText('iPhone 13')).toBeVisible()
  await expect(page.getByText('Draft', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Vazhdo' }).click()
  await expect(page.getByPlaceholder('p.sh. S26 Ultra')).toHaveValue('iPhone 13')
})

test('export downloads a png of the post', async ({ page }) => {
  await startFromPhoto(page)
  await page.getByRole('button', { name: 'Eksporto' }).click()
  await expect(page.getByText('Hapi 5 nga 5')).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Shkarko' }).click()
  const file = await download
  expect(file.suggestedFilename()).toMatch(/\.png$/)
  await expect(page.getByText('Fotoja u shkarkua')).toBeVisible()
})
