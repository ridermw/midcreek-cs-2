import { describe, expect, it } from 'vitest'

import { createDeterministicRandom } from './random'

describe('createDeterministicRandom', () => {
  it('replays the same sequence for the same seed', () => {
    const first = createDeterministicRandom(20260904)
    const second = createDeterministicRandom(20260904)

    expect([first(), first(), first()]).toEqual([second(), second(), second()])
  })

  it('returns values in the half-open unit interval', () => {
    const random = createDeterministicRandom(1)

    for (let sample = 0; sample < 100; sample += 1) {
      const value = random()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})
