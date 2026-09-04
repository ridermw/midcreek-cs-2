import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })

test('first playable repairs a fault through visible controls', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('?seed=417&scenario=coolant-leak&heading=0&zoom=1')
  await page.screenshot({ path: testInfo.outputPath('initial.png') })
  await expect(
    page.getByRole('button', { name: 'Dispatch technician' }),
  ).toBeVisible()
  await expect(
    page.getByRole('img', { name: 'Interactive data hall' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Dispatch technician' }).click()
  await expect(page.getByTestId('work-status')).toHaveText('Repairing', {
    timeout: 20000,
  })
  await page.screenshot({ path: testInfo.outputPath('working.png') })
  await expect(
    page.getByRole('heading', { name: 'Hall restored' }),
  ).toBeVisible({ timeout: 15000 })
  await page.screenshot({ path: testInfo.outputPath('restored.png') })
  await page.getByRole('button', { name: 'Restart shift' }).click()
  await expect(
    page.getByRole('button', { name: 'Dispatch technician' }),
  ).toBeEnabled()
  expect(errors).toEqual([])
})

test('navigation, pause, and measured budgets remain observable', async ({
  page,
}) => {
  await page.goto('?seed=417&heading=0&zoom=1')
  await expect(
    page.getByRole('button', { name: 'Dispatch technician' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Rotate clockwise' }).click()
  await expect(page.getByTestId('heading')).toHaveText('135°')
  await page.getByRole('img', { name: 'Interactive data hall' }).focus()
  await page.keyboard.press('q')
  await expect(page.getByTestId('heading')).toHaveText('45°')
  await page.getByRole('button', { name: 'Zoom in' }).click()
  await expect(page.getByTestId('zoom')).toHaveText('115%')
  await page.getByRole('button', { name: 'Reset view' }).click()
  await expect(page.getByTestId('zoom')).toHaveText('100%')
  await page.getByRole('button', { name: 'Pause shift' }).click()
  await expect(
    page.getByRole('button', { name: 'Dispatch technician' }),
  ).toBeDisabled()
  await page.getByRole('button', { name: 'Resume shift' }).click()
  await page.getByRole('button', { name: 'Performance' }).click()
  await expect(page.getByTestId('draw-calls')).not.toHaveText('0')
  expect(
    Number(await page.getByTestId('draw-calls').textContent()),
  ).toBeLessThanOrEqual(250)
  expect(
    Number(await page.getByTestId('triangles').textContent()),
  ).toBeLessThanOrEqual(1_000_000)
  expect(
    Number(await page.getByTestId('transfer').textContent()),
  ).toBeLessThanOrEqual(15)
})

test('invalid seeds show an explicit startup error', async ({ page }) => {
  await page.goto('?seed=not-a-number')
  await expect(
    page.getByRole('heading', { name: 'This shift could not start.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Dispatch technician' }),
  ).toHaveCount(0)
})

test('graphics loss freezes gameplay and offers reload', async ({ page }) => {
  await page.goto('?seed=417')
  await expect(
    page.getByRole('button', { name: 'Dispatch technician' }),
  ).toBeVisible()
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas')!
    const extension = canvas
      .getContext('webgl2')!
      .getExtension('WEBGL_lose_context')
    if (!extension) throw new Error('Context-loss extension unavailable')
    extension.loseContext()
  })
  await expect(
    page.getByRole('button', { name: 'Resume shift' }),
  ).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Reload shift' })).toBeVisible()
  await page.getByRole('button', { name: 'Reload shift' }).click()
  await expect(
    page.getByRole('button', { name: 'Dispatch technician' }),
  ).toBeEnabled()
})
