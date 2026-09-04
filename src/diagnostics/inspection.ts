import type { WorldSnapshot } from '../world/contracts'
import type { FrameSummary } from './metrics'

export interface Diagnostics {
  readonly build: string
  readonly seed: number
  readonly scenario: string
  readonly frames: FrameSummary
  readonly drawCalls: number
  readonly triangles: number
  readonly initialTransferBytes: number
  readonly hardware: string
  readonly browserViewport: { readonly width: number; readonly height: number }
  readonly camera: {
    readonly heading: number
    readonly elevation: number
    readonly zoom: number
    readonly viewport: { readonly width: number; readonly height: number }
    readonly devicePixelRatio: number
  }
}

export interface Inspection {
  snapshot(): WorldSnapshot
  diagnostics(): Diagnostics
  project(x: number, z: number): { x: number; y: number }
}

declare global {
  interface Window {
    readonly __midcreek?: Inspection
  }
}
