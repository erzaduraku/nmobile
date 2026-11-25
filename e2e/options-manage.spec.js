import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

const photo = join(mkdtempSync(join(tmpdir(), 'nmobile-')), 'phone.png')
writeFileSync(photo, Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGElEQVR4nGP8z8Dwn4EIwDiqEAYGBob4DAAAnQMD/8s1c0sAAAAASUVORK5CYII=',
  'base64',
))

test('option lists are managed in a modal and saved only on confirm', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Vazhdo pa llogari/ }).click()
  await page.locator('input[type="file"]').first().setInputFiles(photo)
  await page.getByRole('button', { name: 'Detajet' }).click()
  await expect(page.getByText('Hapi 4 nga 5')).toBeVisible()
  await expect(page.getByRole('button', { name: '+ Add' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Menaxho opsionet' }).first()).toBeVisible()

  await page.getByRole('button', { name: 'Menaxho opsionet' }).first().click()
  await page.getByLabel('Shto opsion te Kapaciteti').fill('2TB')
  await page.getByRole('button', { name: 'Shto' }).click()
  await page.getByRole('button', { name: 'Anulo' }).click()
  await expect(page.getByRole('button', { name: '2TB' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Menaxho opsionet' }).first().click()
  await page.getByLabel('Shto opsion te Kapaciteti').fill('2TB')
  await page.getByRole('button', { name: 'Shto' }).click()
  await page.getByRole('button', { name: 'Ruaj ndryshimet' }).click()
  await page.getByRole('button', { name: '2TB' }).click()
  await expect(page.getByRole('button', { name: '2TB' })).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Menaxho opsionet' }).first().click()
  await page.getByRole('button', { name: 'Fshi 2TB' }).click()
  await page.getByRole('button', { name: 'Fshi', exact: true }).click()
  await expect(page.getByRole('button', { name: '2TB' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Ruaj ndryshimet' }).click()
  await expect(page.getByRole('button', { name: '2TB' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Më shumë detaje' }).click()
  await expect(page.getByText('RAM')).toBeVisible()
  await expect(page.getByRole('button', { name: '+ Add' })).toHaveCount(0)
  expect(await page.getByRole('button', { name: 'Menaxho opsionet' }).count()).toBeGreaterThan(4)
})
