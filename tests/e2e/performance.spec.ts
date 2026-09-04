import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import type {} from '../../src/diagnostics/inspection'

test.use({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })

test('development-machine sustained 60 FPS target', async ({
  page,
}, testInfo) => {
  test.skip(
    !process.env.CHECK_FRAME_TARGET,
    'Opt-in hardware timing gate; not a CI proxy.',
  )
  await page.goto('?seed=417&scenario=coolant-leak&heading=0&zoom=1')
  await page.waitForFunction(
    () => (window.__midcreek?.diagnostics().frames.samples ?? 0) >= 300,
  )
  const startupWindow = await page.evaluate(() =>
    window.__midcreek!.diagnostics(),
  )
  await writeFile(
    testInfo.outputPath('startup-window.json'),
    JSON.stringify(startupWindow, null, 2),
  )
  // Keep startup/JIT cost visible, then compare the same fixed 12-second warm-up.
  await page.waitForFunction(
    () => (window.__midcreek?.snapshot().clock.elapsedSeconds ?? 0) >= 12,
  )
  const report = await page.evaluate(() => window.__midcreek!.diagnostics())
  await writeFile(
    testInfo.outputPath('measurements.json'),
    JSON.stringify(report, null, 2),
  )
  await page.screenshot({ path: testInfo.outputPath('hall.png') })
  console.log(JSON.stringify(report))
  // Allow 1 FPS for refresh-clock quantization; do not silently pass slower GPUs.
  expect(report.frames.fps).toBeGreaterThanOrEqual(59)
  expect(report.frames.p95Ms).toBeLessThanOrEqual(18)
  const startFrames = report.renderedFrames
  await page.getByRole('button', { name: 'Dispatch technician' }).click()
  await page.evaluate(async () => {
    for (let i = 0; i < 300; i++) {
      await new Promise<number>(requestAnimationFrame)
    }
  })
  const active = await page.evaluate(() => window.__midcreek!.diagnostics())
  await writeFile(
    testInfo.outputPath('active-repair.json'),
    JSON.stringify(active, null, 2),
  )
  expect(active.renderedFrames - startFrames).toBeGreaterThanOrEqual(300)
  expect(active.staticPasses).toBe(1)
  expect(active.frames.fps).toBeGreaterThanOrEqual(59)
  expect(active.frames.p95Ms).toBeLessThanOrEqual(18)
})
