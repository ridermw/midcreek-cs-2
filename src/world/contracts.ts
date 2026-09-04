export interface Cell {
  readonly x: number
  readonly z: number
}

export interface Rack {
  readonly id: string
  readonly cell: Cell
  readonly front: -1 | 1
}

export interface WorldSnapshot {
  readonly seed: number
  readonly clock: { readonly tick: number; readonly elapsedSeconds: number }
  readonly player: {
    readonly cell: Cell
    readonly path: readonly Cell[]
    readonly mode: 'idle' | 'walking' | 'repairing'
  }
  readonly racks: readonly Rack[]
  readonly fault: {
    readonly rackId: string
    readonly status: 'fault' | 'working' | 'resolved'
    readonly progress: number
  }
  readonly paused: boolean
  readonly message: string
}

export type WorldCommand =
  | { type: 'move'; cell: Cell }
  | { type: 'dispatch' }
  | { type: 'pause' }
  | { type: 'restart' }
