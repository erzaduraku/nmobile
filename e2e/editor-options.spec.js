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

const field = (page, name) => page.getByLabel(`Shto opsion te ${name}`).locator('xpath=../..')
// The editor has sticky header/footer bars; dispatch directly so scrolling never lands under them.
const press = (locator) => locator.evaluate((el) => el.click())

async function addOption(page, name, text, chip = text) {
  const area = field(page, name)
  await area.getByLabel(`Shto opsion te ${name}`).fill(text)
  await press(area.getByRole('button', { name: '+ Add' }))
  const button = area.getByRole('button', { name: chip, exact: true })
  await expect(button).toBeVisible()
  return button
}

async function exerciseField(page, name, text, chip = text) {
  const button = await addOption(page, name, text, chip)
  await press(button)
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await press(field(page, name).getByRole('button', { name: `Hiq opsionin ${chip}` }))
  await expect(field(page, name).getByRole('button', { name: chip, exact: true })).toHaveCount(0)
}

test('every editable chip field adds, selects, deletes and keeps its own options', async ({ page }) => {
  test.setTimeout(150_000)
  await openEditor(page)

  // Duplicate and empty values never enter a list.
  const capacity = field(page, 'Kapaciteti')
  await capacity.getByLabel('Shto opsion te Kapaciteti').fill(' 256 gb ')
  await press(capacity.getByRole('button', { name: '+ Add' }))
  await expect(capacity.getByRole('status')).toContainText('ekziston')
  await capacity.getByLabel('Shto opsion te Kapaciteti').fill('   ')
  await press(capacity.getByRole('button', { name: '+ Add' }))
  await expect(capacity.getByRole('status')).toContainText('zbrazët')

  for (const [name, value, chip] of [
    ['Kapaciteti', '2TB', '2TB'],
    ['Teksti i butonit', 'Thirre tani', 'Thirre tani'],
  ]) await exerciseField(page, name, value, chip)

  await press(page.getByRole('button', { name: 'Më shumë detaje' }))
  for (const [name, value, chip] of [
    ['Titulli', 'TEST OFERTA', 'TEST OFERTA'],
    ['Shenja e serisë', 'Test Badge', 'Test Badge'],
    ['Ngjyrat', 'Test #123456', 'Test'],
    ['RAM', '18GB', '18GB'],
    ['Memoria', '2TB', '2TB'],
    ['Kamera', '64MP', '64MP'],
    ['Bateria', '7000mAh', '7000mAh'],
    ['Ekrani', '7.2"', '7.2"'],
    ['Gjendja', 'I ri me kuti', 'I ri me kuti'],
    ['Shënimet', 'Kuti origjinale', 'Kuti origjinale'],
  ]) await exerciseField(page, name, value, chip)

  // Deleting a selected value clears the field, not just the chip.
  const selected = await addOption(page, 'Kapaciteti', '2TB')
  await press(selected)
  await expect(page.getByPlaceholder('p.sh. 512GB')).toHaveValue('2TB')
  await press(field(page, 'Kapaciteti').getByRole('button', { name: 'Hiq opsionin 2TB' }))
  await expect(page.getByPlaceholder('p.sh. 512GB')).toHaveValue('')

  // Additions and deletions are read back from localStorage after a refresh.
  await addOption(page, 'Kapaciteti', '2TB')
  await press(field(page, 'Kapaciteti').getByRole('button', { name: 'Hiq opsionin 128GB' }))
  await openEditor(page)
  await expect(field(page, 'Kapaciteti').getByRole('button', { name: '2TB', exact: true })).toBeVisible()
  await expect(field(page, 'Kapaciteti').getByRole('button', { name: '128GB', exact: true })).toHaveCount(0)
})
