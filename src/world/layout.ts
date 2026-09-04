import type { Cell, Rack } from './contracts'

export const HALL = {
  width: 17,
  depth: 15,
  rackHeight: 2.1,
  technicianHeight: 1.65,
} as const

const EMPTY_PATH = Object.freeze([]) as readonly Cell[]
const DIRECTIONS = [
  { x: -1, z: 0 },
  { x: 0, z: -1 },
  { x: 1, z: 0 },
  { x: 0, z: 1 },
] as const
const ROWS = [
  { label: 'A', z: 3, front: -1 as const },
  { label: 'B', z: 5, front: 1 as const },
  { label: 'C', z: 9, front: -1 as const },
  { label: 'D', z: 11, front: 1 as const },
] as const

function freezeCell(cell: Cell): Cell {
  return Object.freeze({ x: cell.x, z: cell.z })
}

function cellKey(cell: Pick<Cell, 'x' | 'z'>): string {
  return `${cell.x},${cell.z}`
}

function isGridCoordinate(value: number, limit: number): boolean {
  return Number.isSafeInteger(value) && value >= 0 && value < limit
}

const RACKS = Object.freeze(
  ROWS.flatMap(({ label, z, front }) =>
    Array.from({ length: 8 }, (_, index): Rack =>
      Object.freeze({
        id: `${label}-${String(index + 1).padStart(2, '0')}`,
        cell: freezeCell({ x: index + 4, z }),
        front,
      }),
    ),
  ),
) as readonly Rack[]
const BLOCKED = new Set(RACKS.map(({ cell }) => cellKey(cell)))

function freezePath(path: readonly Cell[]): readonly Cell[] {
  return path.length === 0 ? EMPTY_PATH : Object.freeze(path.map(freezeCell))
}

function buildPath(
  targetKey: string,
  startKey: string,
  parents: ReadonlyMap<string, string | null>,
  cells: ReadonlyMap<string, Cell>,
): readonly Cell[] {
  const path: Cell[] = []
  let currentKey: string | null = targetKey

  while (currentKey && currentKey !== startKey) {
    const cell = cells.get(currentKey)
    const parent = parents.get(currentKey)
    if (!cell || parent === undefined) {
      throw new Error('Failed to reconstruct a deterministic hall path.')
    }
    path.push(cell)
    currentKey = parent
  }

  path.reverse()
  return freezePath(path)
}

export function createRacks(): readonly Rack[] {
  return RACKS
}

export function isWalkable(cell: Cell): boolean {
  return (
    isGridCoordinate(cell.x, HALL.width) &&
    isGridCoordinate(cell.z, HALL.depth) &&
    !BLOCKED.has(cellKey(cell))
  )
}

export function findPath(start: Cell, target: Cell): readonly Cell[] | null {
  if (!isWalkable(start) || !isWalkable(target)) return null
  if (start.x === target.x && start.z === target.z) return EMPTY_PATH

  const startCell = { x: start.x, z: start.z }
  const startKey = cellKey(startCell)
  const targetKey = cellKey(target)
  const queue: Cell[] = [startCell]
  const parents = new Map<string, string | null>([[startKey, null]])
  const cells = new Map<string, Cell>([[startKey, startCell]])

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]!
    const currentKey = cellKey(current)

    for (const direction of DIRECTIONS) {
      const next = { x: current.x + direction.x, z: current.z + direction.z }
      const nextKey = cellKey(next)
      if (parents.has(nextKey) || !isWalkable(next)) continue
      parents.set(nextKey, currentKey)
      cells.set(nextKey, next)
      if (nextKey === targetKey) {
        return buildPath(targetKey, startKey, parents, cells)
      }
      queue.push(next)
    }
  }

  return null
}
