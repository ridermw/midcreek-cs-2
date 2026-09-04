export interface SimulationClock {
  readonly tick: number
  readonly elapsedSeconds: number
}

export interface WorldSnapshot {
  readonly seed: number
  readonly clock: SimulationClock
}
