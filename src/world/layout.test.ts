import { describe, expect, it } from 'vitest'

import type { Cell } from './contracts'
import { HALL, createRacks, findPath, isWalkable } from './layout'

const ENTRY = { x: 2, z: 7 } as const

function stepDistance(from: Cell, to: Cell) {
  return Math.abs(from.x - to.x) + Math.abs(from.z - to.z)
}

describe('world layout', () => {
  it('creates the fixed first-playable hall racks and reachable back aisles', () => {
    const racks = createRacks()

    expect(HALL).toEqual({
      width: 17,
      depth: 15,
      rackHeight: 2.1,
      technicianHeight: 1.65,
    })
    expect(racks).toHaveLength(32)
    expect(racks[0]).toEqual({ id: 'A-01', cell: { x: 4, z: 3 }, front: -1 })
    expect(racks[7]).toEqual({ id: 'A-08', cell: { x: 11, z: 3 }, front: -1 })
    expect(racks[8]).toEqual({ id: 'B-01', cell: { x: 4, z: 5 }, front: 1 })
    expect(racks[31]).toEqual({ id: 'D-08', cell: { x: 11, z: 11 }, front: 1 })

    for (const rack of racks) {
      const back = { x: rack.cell.x, z: rack.cell.z - rack.front }
      const path = findPath(ENTRY, back)

      expect(path).not.toBeNull()
      expect(path?.at(-1)).toEqual(back)
    }
  })

  it('treats rack cells as blocked and only allows in-bounds integer floor cells', () => {
    expect(isWalkable({ x: 0, z: 0 })).toBe(true)
    expect(isWalkable({ x: 16, z: 14 })).toBe(true)
    expect(isWalkable({ x: 4, z: 3 })).toBe(false)
    expect(isWalkable({ x: -1, z: 7 } as Cell)).toBe(false)
    expect(isWalkable({ x: 17, z: 7 } as Cell)).toBe(false)
    expect(isWalkable({ x: 2.5, z: 7 } as Cell)).toBe(false)
    expect(isWalkable({ x: 2, z: Number.NaN } as Cell)).toBe(false)
  })

  it('finds shortest deterministic 4-connected routes and rejects invalid endpoints', () => {
    const start = { x: 8, z: 7 }
    const target = { x: 8, z: 4 }
    const expected = [
      { x: 8, z: 6 },
      { x: 9, z: 6 },
      { x: 10, z: 6 },
      { x: 11, z: 6 },
      { x: 12, z: 6 },
      { x: 12, z: 5 },
      { x: 12, z: 4 },
      { x: 11, z: 4 },
      { x: 10, z: 4 },
      { x: 9, z: 4 },
      { x: 8, z: 4 },
    ]

    const path = findPath(start, target)

    expect(path).toEqual(expected)
    expect(findPath(start, target)).toEqual(expected)
    expect(findPath(start, start)).toEqual([])
    expect(findPath(start, { x: 4, z: 3 })).toBeNull()
    expect(findPath({ x: 8.5, z: 7 } as Cell, target)).toBeNull()

    let previous = start
    for (const cell of path ?? []) {
      expect(stepDistance(previous, cell)).toBe(1)
      expect(isWalkable(cell)).toBe(true)
      previous = cell
    }
    expect(path).toHaveLength(11)
  })
})
