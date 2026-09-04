import { describe, expect, it } from 'vitest'
import { summarizeFrames, transferBytes } from './metrics'

describe('measured performance', () => {
  it('reports real frame intervals including slow frames without inventing FPS', () => {
    expect(summarizeFrames([])).toEqual({
      samples: 0,
      medianMs: 0,
      p95Ms: 0,
      fps: 0,
    })
    const report = summarizeFrames([16, 17, 16, 16, 100])
    expect(report.samples).toBe(5)
    expect(report.medianMs).toBe(16)
    expect(report.p95Ms).toBe(100)
    expect(report.fps).toBeCloseTo(1000 / 33)
  })

  it('counts navigation and resources, including cache-backed payload sizes', () => {
    expect(
      transferBytes([
        { transferSize: 700, encodedBodySize: 400 },
        { transferSize: 0, encodedBodySize: 2000 },
      ]),
    ).toBe(2700)
  })

  it('excludes resources requested after the initial document load', () => {
    expect(
      transferBytes(
        [
          { startTime: 0, transferSize: 700, encodedBodySize: 400 },
          { startTime: 15, transferSize: 0, encodedBodySize: 2000 },
          { startTime: 2000, transferSize: 5000, encodedBodySize: 4800 },
        ],
        100,
      ),
    ).toBe(2700)
  })
})
