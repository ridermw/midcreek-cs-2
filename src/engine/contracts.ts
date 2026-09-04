import type { Scene, WebGLRenderer } from 'three'

export interface EngineContext {
  readonly renderer: WebGLRenderer
  readonly scene: Scene
}

export interface EngineSystem {
  initialize(context: EngineContext): void | Promise<void>
  update(deltaSeconds: number): void
  dispose(): void
}
