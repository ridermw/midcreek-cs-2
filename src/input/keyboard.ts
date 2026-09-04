import type { Cell } from '../world/contracts'

export function movementForKey(key: string, heading: number): Cell | null {
  const directions: Record<string, Cell> = {
    w: { x: 0, z: -1 },
    ArrowUp: { x: 0, z: -1 },
    s: { x: 0, z: 1 },
    ArrowDown: { x: 0, z: 1 },
    a: { x: -1, z: 0 },
    ArrowLeft: { x: -1, z: 0 },
    d: { x: 1, z: 0 },
    ArrowRight: { x: 1, z: 0 },
  }
  let delta = directions[key]
  if (!delta) return null
  for (let i = 0; i < heading; i++) delta = { x: delta.z, z: -delta.x }
  return { x: delta.x || 0, z: delta.z || 0 }
}
