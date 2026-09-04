import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import type {} from '../../src/diagnostics/inspection'

test.use({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })

test('fixed-view hillclimb evidence and pointer navigation', async ({
  page,
}, testInfo) => {
  await page.goto('?seed=417&scenario=coolant-leak&heading=0&zoom=1')
  await page.waitForFunction(
    () => (window.__midcreek?.diagnostics().frames.samples ?? 0) >= 300,
  )
  const metrics = await page.evaluate(() => window.__midcreek!.diagnostics())
  await writeFile(
    testInfo.outputPath('measurements.json'),
    JSON.stringify(metrics, null, 2),
  )
  await testInfo.attach('measurements', {
    body: JSON.stringify(metrics, null, 2),
    contentType: 'application/json',
  })
  await page.screenshot({ path: testInfo.outputPath('hall.png') })
  expect(metrics.seed).toBe(417)
  if (process.env.EXPECTED_BUILD_SHA)
    expect(metrics.build).toBe(process.env.EXPECTED_BUILD_SHA)
  expect(metrics.camera.heading).toBe(45)
  expect(metrics.camera.elevation).toBe(35.264)
  expect(metrics.camera.zoom).toBe(1)
  expect(metrics.camera.viewport).toEqual({ width: 1280, height: 600 })
  expect(metrics.browserViewport).toEqual({ width: 1280, height: 720 })
  expect(metrics.drawCalls).toBeGreaterThan(0)
  expect(metrics.drawCalls).toBeLessThanOrEqual(250)
  expect(metrics.triangles).toBeLessThanOrEqual(1_000_000)
  expect(metrics.initialTransferBytes).toBeLessThanOrEqual(15_000_000)
  await page.evaluate(async () => {
    await fetch(`${location.pathname}?late-transfer-probe=1`)
  })
  expect(
    await page.evaluate(
      () => window.__midcreek!.diagnostics().initialTransferBytes,
    ),
  ).toBe(metrics.initialTransferBytes)

  const target = await page.evaluate(() => window.__midcreek!.project(2, 8))
  await page
    .getByRole('img', { name: 'Interactive data hall' })
    .click({ position: target })
  await expect
    .poll(() => page.evaluate(() => window.__midcreek!.snapshot().player.cell))
    .toEqual({ x: 2, z: 8 })
  await page.keyboard.press('w')
  await expect
    .poll(() => page.evaluate(() => window.__midcreek!.snapshot().player.cell))
    .toEqual({ x: 2, z: 7 })
  await page.getByRole('button', { name: 'Pause shift' }).click()
  const pausedTick = await page.evaluate(
    () => window.__midcreek!.snapshot().clock.tick,
  )
  await page.waitForTimeout(300)
  expect(
    await page.evaluate(() => window.__midcreek!.snapshot().clock.tick),
  ).toBe(pausedTick)
})

test('narrow viewport preserves reachable repair controls', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('?seed=417')
  await expect(
    page.getByRole('button', { name: 'Dispatch technician' }),
  ).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  )
  await page.getByRole('button', { name: 'Dispatch technician' }).click()
  await expect(page.getByTestId('work-status')).toHaveText('Repairing', {
    timeout: 20000,
  })
})
