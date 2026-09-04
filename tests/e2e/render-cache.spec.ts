import { expect, test } from '@playwright/test'
import type {} from '../../src/diagnostics/inspection'

test.use({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })

test('cached hall preserves projection, shading, and technician occlusion', async ({
  page,
}) => {
  test.skip(
    process.platform !== 'win32',
    'Fixed Windows/SwiftShader raster comparison.',
  )
  await page.goto('?seed=417&heading=0&zoom=1')
  const canvas = page.getByRole('img', { name: 'Interactive data hall' })
  await page.waitForFunction(
    () => (window.__midcreek?.snapshot().clock.tick ?? 0) > 10,
  )
  await expect(canvas).toHaveScreenshot('initial.png', {
    maxDiffPixels: 100,
  })
  await page.getByRole('button', { name: 'Rotate clockwise' }).click()
  await expect(canvas).toHaveScreenshot('rotated.png', {
    maxDiffPixels: 100,
  })
  await page.getByRole('button', { name: 'Reset view' }).click()
  await page.getByRole('button', { name: 'Dispatch technician' }).click()
  await expect(page.getByTestId('work-status')).toHaveText('Repairing', {
    timeout: 20000,
  })
  await page.getByRole('button', { name: 'Pause shift' }).click()
  await expect(canvas).toHaveScreenshot('occluded-technician.png', {
    maxDiffPixels: 100,
  })
  expect(
    await page.evaluate(() => window.__midcreek!.diagnostics().drawCalls),
  ).toBeLessThanOrEqual(15)
})

test('cache refreshes on view changes and still renders every frame', async ({
  page,
}) => {
  await page.goto('?seed=417&heading=0&zoom=1')
  await page.waitForFunction(
    () => (window.__midcreek?.diagnostics().renderedFrames ?? 0) > 10,
  )
  const initial = await page.evaluate(() => window.__midcreek!.diagnostics())
  expect(initial.startupMs).toBeGreaterThan(0)
  expect(initial.startupMs).toBeLessThan(5000)
  expect(initial.staticPasses).toBe(1)
  await page.getByRole('button', { name: 'Rotate clockwise' }).click()
  await expect
    .poll(() =>
      page.evaluate(() => window.__midcreek!.diagnostics().staticPasses),
    )
    .toBe(2)
  await page.getByRole('button', { name: 'Zoom in' }).click()
  await expect
    .poll(() =>
      page.evaluate(() => window.__midcreek!.diagnostics().staticPasses),
    )
    .toBe(3)
  await page.setViewportSize({ width: 1200, height: 800 })
  await expect
    .poll(() =>
      page.evaluate(() => window.__midcreek!.diagnostics().staticPasses),
    )
    .toBe(4)
  const final = await page.evaluate(() => window.__midcreek!.diagnostics())
  expect(final.renderedFrames).toBeGreaterThan(initial.renderedFrames)
  expect(final.camera.devicePixelRatio).toBe(1)
  expect(final.peakDrawCalls).toBeLessThanOrEqual(250)
  expect(final.peakTriangles).toBeLessThanOrEqual(1_000_000)
})
