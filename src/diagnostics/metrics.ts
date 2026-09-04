export interface FrameSummary {
  readonly samples: number
  readonly medianMs: number
  readonly p95Ms: number
  readonly fps: number
}

export function summarizeFrames(frames: readonly number[]): FrameSummary {
  if (!frames.length) return { samples: 0, medianMs: 0, p95Ms: 0, fps: 0 }
  const sorted = [...frames].sort((a, b) => a - b)
  return {
    samples: frames.length,
    medianMs: sorted[Math.floor(sorted.length / 2)],
    p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1],
    fps: 1000 / (frames.reduce((sum, frame) => sum + frame, 0) / frames.length),
  }
}

export function transferBytes(
  entries: readonly {
    transferSize: number
    encodedBodySize: number
    startTime?: number
  }[],
  loadEventEnd = Infinity,
): number {
  return entries.reduce(
    (sum, entry) =>
      sum +
      ((entry.startTime ?? 0) <= loadEventEnd
        ? Math.max(entry.transferSize, entry.encodedBodySize)
        : 0),
    0,
  )
}
