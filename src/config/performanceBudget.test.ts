import { describe, expect, it } from 'vitest'

import { DESKTOP_PERFORMANCE_BUDGET } from './performanceBudget'

describe('DESKTOP_PERFORMANCE_BUDGET', () => {
  it('defines measurable limits for the first desktop concept', () => {
    expect(DESKTOP_PERFORMANCE_BUDGET.targetFramesPerSecond).toBe(60)
    expect(DESKTOP_PERFORMANCE_BUDGET.maxDrawCalls).toBeLessThanOrEqual(250)
    expect(DESKTOP_PERFORMANCE_BUDGET.maxTriangles).toBeLessThanOrEqual(
      1_000_000,
    )
    expect(
      DESKTOP_PERFORMANCE_BUDGET.maxInitialTransferMegabytes,
    ).toBeLessThanOrEqual(15)
  })
})
