import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

const photo = join(mkdtempSync(join(tmpdir(), 'nmobile-')), 'phone.png')
writeFileSync(photo, Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGElEQVR4nGP8z8Dwn4EIwDiqEAYGBob4DAAAnQMD/8s1c0sAAAAASUVORK5CYII=',
  'base64',
))

test('option lists are managed from + Add and saved only on confirm', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Vazhdo pa llogari/ }).click()
  await page.locator('input[type="file"]').first().setInputFiles(photo)
  await page.getByRole('button', { name: 'Detajet' }).click()
  await expect(page.getByText('Hapi 4 nga 5')).toBeVisible()

  await expect(page.getByRole('button', { name: 'Menaxho opsionet' })).toHaveCount(0)
  await expect(page.getByPlaceholder('p.sh. 512GB')).toHaveCount(0)
  await expect(page.getByPlaceholder('Bli tani!')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Add', exact: true }).first()).toBeVisible()

  const add = page.getByRole('button', { name: 'Add', exact: true }).first()
  await add.click()
  await expect(page.getByText('Menaxho opsionet')).toBeVisible()
  await page.getByLabel('Shto opsion te Kapaciteti').fill('2TB')
  await page.getByRole('button', { name: 'Shto' }).click()
  await page.getByRole('button', { name: 'Anulo' }).click()
  await expect(page.getByRole('button', { name: '2TB' })).toHaveCount(0)

  await add.click()
  await page.getByLabel('Shto opsion te Kapaciteti').fill('2TB')
  await page.getByRole('button', { name: 'Shto' }).click()
  await page.getByRole('button', { name: 'Ruaj ndryshimet' }).click()
  await page.getByRole('button', { name: '2TB' }).click()
  await expect(page.getByRole('button', { name: '2TB' })).toHaveAttribute('aria-pressed', 'true')

  await add.click()
  await page.getByRole('button', { name: 'Fshi 2TB' }).click()
  await page.getByRole('button', { name: 'Fshi', exact: true }).click()
  await expect(page.getByRole('button', { name: '2TB' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Ruaj ndryshimet' }).click()
  await expect(page.getByRole('button', { name: '2TB' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Më shumë detaje' }).click()
  await expect(page.getByText('RAM')).toBeVisible()
  await expect(page.getByPlaceholder('Tjetër')).toHaveCount(0)
  await expect(page.getByPlaceholder('p.sh. SUPER OFERTA NË N MOBILE!')).toHaveCount(0)
  await expect(page.getByPlaceholder('p.sh. Galaxy AI')).toHaveCount(0)
  expect(await page.getByRole('button', { name: 'Add', exact: true }).count()).toBeGreaterThan(4)
  await expect(page.getByRole('button', { name: 'Menaxho opsionet' })).toHaveCount(0)
})
