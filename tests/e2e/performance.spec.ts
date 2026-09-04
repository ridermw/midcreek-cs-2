import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import type {} from '../../src/diagnostics/inspection'

test.use({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })

test('development-machine 60 FPS target', async ({ page }, testInfo) => {
  test.skip(
    !process.env.CHECK_FRAME_TARGET,
    'Opt-in hardware timing gate; not a CI proxy.',
  )
  await page.goto('?seed=417&scenario=coolant-leak&heading=0&zoom=1')
  await page.waitForFunction(
    () => (window.__midcreek?.diagnostics().frames.samples ?? 0) >= 300,
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
})
