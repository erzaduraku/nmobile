import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

const photo = join(mkdtempSync(join(tmpdir(), 'nmobile-options-')), 'phone.png')
writeFileSync(photo, Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGElEQVR4nGP8z8Dwn4EIwDiqEAYGBob4DAAAnQMD/8s1c0sAAAAASUVORK5CYII=',
  'base64',
))

async function openEditor(page) {
  await page.goto('/')
  const start = page.getByRole('button', { name: /Vazhdo pa llogari/ })
  const home = page.getByRole('heading', { name: 'Mirë se erdhe' })
  await expect(start.or(home)).toBeVisible()
  if (await start.isVisible()) await start.click()
  await expect(home).toBeVisible()
  await page.locator('input[type="file"]').first().setInputFiles(photo)
  await expect(page.getByText('Ndrysho foton')).toBeVisible()
  await page.getByRole('button', { name: 'Detajet' }).click()
  await expect(page.getByText('Hapi 4 nga 5')).toBeVisible()
}

const field = (page, heading) => page.locator('div').filter({ has: page.getByText(heading, { exact: true }) }).filter({ has: page.getByRole('button', { name: 'Add', exact: true }) }).last()
const press = (locator) => locator.evaluate((el) => el.click())

async function manage(page, root) {
  await press(root.getByRole('button', { name: 'Add', exact: true }))
  await expect(page.getByText('Menaxho opsionet')).toBeVisible()
}

async function addOption(page, root, name, text, chip = text) {
  await manage(page, root)
  await page.getByLabel(`Shto opsion te ${name}`).fill(text)
  await press(page.getByRole('button', { name: 'Shto', exact: true }))
  await press(page.getByRole('button', { name: 'Ruaj ndryshimet' }))
  const button = root.getByRole('button', { name: chip, exact: true })
  await expect(button).toBeVisible()
  return button
}

async function removeOption(page, root, chip) {
  await manage(page, root)
  await press(page.getByRole('button', { name: `Fshi ${chip}` }))
  await press(page.getByRole('button', { name: 'Fshi', exact: true }))
  await press(page.getByRole('button', { name: 'Ruaj ndryshimet' }))
  await expect(root.getByRole('button', { name: chip, exact: true })).toHaveCount(0)
}

async function exerciseField(page, heading, name, text, chip = text) {
  const root = field(page, heading)
  const button = await addOption(page, root, name, text, chip)
  await press(button)
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await removeOption(page, root, chip)
}

test('every editable chip field adds, selects, deletes and keeps its own options', async ({ page }) => {
  test.setTimeout(150_000)
  await openEditor(page)

  const capacity = field(page, 'Kapaciteti (opsional)')
  await manage(page, capacity)
  await page.getByLabel('Shto opsion te Kapaciteti').fill(' 256 gb ')
  await press(page.getByRole('button', { name: 'Shto', exact: true }))
  await expect(page.getByRole('status')).toContainText('ekziston')
  await page.getByLabel('Shto opsion te Kapaciteti').fill('   ')
  await press(page.getByRole('button', { name: 'Shto', exact: true }))
  await expect(page.getByRole('status')).toContainText('zbrazët')
  await press(page.getByRole('button', { name: 'Anulo' }))

  for (const [heading, name, value, chip] of [
    ['Kapaciteti (opsional)', 'Kapaciteti', '2TB', '2TB'],
    ['Teksti i butonit', 'Teksti i butonit', 'Thirre tani', 'Thirre tani'],
  ]) await exerciseField(page, heading, name, value, chip)

  await press(page.getByRole('button', { name: 'Më shumë detaje' }))
  for (const [heading, name, value, chip] of [
    ['Titulli sipër (opsional)', 'Titulli', 'TEST OFERTA', 'TEST OFERTA'],
    ['Shenja e serisë (opsionale)', 'Shenja e serisë', 'Test Badge', 'Test Badge'],
    ['Ngjyrat', 'Ngjyrat', 'Test #123456', 'Test'],
    ['RAM', 'RAM', '18GB', '18GB'],
    ['Memoria', 'Memoria', '2TB', '2TB'],
    ['Kamera', 'Kamera', '64MP', '64MP'],
    ['Bateria', 'Bateria', '7000mAh', '7000mAh'],
    ['Ekrani', 'Ekrani', '7.2"', '7.2"'],
    ['Gjendja', 'Gjendja', 'I ri me kuti', 'I ri me kuti'],
    ['Shënime', 'Shënimet', 'Kuti origjinale', 'Kuti origjinale'],
  ]) await exerciseField(page, heading, name, value, chip)

  const selected = await addOption(page, capacity, 'Kapaciteti', '2TB')
  await press(selected)
  await expect(selected).toHaveAttribute('aria-pressed', 'true')
  await removeOption(page, capacity, '2TB')

  await addOption(page, capacity, 'Kapaciteti', '2TB')
  await removeOption(page, capacity, '128GB')
  await openEditor(page)
  const again = field(page, 'Kapaciteti (opsional)')
  await expect(again.getByRole('button', { name: '2TB', exact: true })).toBeVisible()
  await expect(again.getByRole('button', { name: '128GB', exact: true })).toHaveCount(0)
})
