import { createDeterministicRandom } from '../core/random'
import type { Cell, WorldCommand, WorldSnapshot } from './contracts'
import { createRacks, findPath, isWalkable } from './layout'

export const TICK_SECONDS = 1 / 30
export const MOVE_TICKS = 5
export const REPAIR_TICKS = 120

type TravelIntent = 'move' | 'dispatch' | null
type PlayerMode = WorldSnapshot['player']['mode']
type FaultStatus = WorldSnapshot['fault']['status']
type InternalWorld = WorldSnapshot & { readonly [INTENT]: TravelIntent }
type SnapshotState = {
  readonly seed: number
  readonly tick: number
  readonly cell: Cell
  readonly path: readonly Cell[]
  readonly mode: PlayerMode
  readonly faultRackId: string
  readonly faultStatus: FaultStatus
  readonly faultProgress: number
  readonly paused: boolean
  readonly message: string
  readonly intent: TravelIntent
}

const INTENT = Symbol('worldTravelIntent')
const EMPTY_PATH = Object.freeze([]) as readonly Cell[]
const RACKS = createRacks()
const INITIAL_MESSAGE = 'Select the fault to dispatch a technician.'

function freezeCell(cell: Cell): Cell {
  return Object.freeze({ x: cell.x, z: cell.z })
}

function freezePath(path: readonly Cell[]): readonly Cell[] {
  if (path.length === 0) return EMPTY_PATH
  if (Object.isFrozen(path) && path.every(Object.isFrozen)) return path
  return Object.freeze(path.map(freezeCell))
}

function worldState(world: WorldSnapshot): SnapshotState {
  return {
    seed: world.seed,
    tick: world.clock.tick,
    cell: world.player.cell,
    path: world.player.path,
    mode: world.player.mode,
    faultRackId: world.fault.rackId,
    faultStatus: world.fault.status,
    faultProgress: world.fault.progress,
    paused: world.paused,
    message: world.message,
    intent: (world as Partial<InternalWorld>)[INTENT] ?? null,
  }
}

function createSnapshot(state: SnapshotState): InternalWorld {
  const snapshot: WorldSnapshot = {
    seed: state.seed,
    clock: Object.freeze({
      tick: state.tick,
      elapsedSeconds: state.tick * TICK_SECONDS,
    }),
    player: Object.freeze({
      cell: freezeCell(state.cell),
      path: freezePath(state.path),
      mode: state.mode,
    }),
    racks: RACKS,
    fault: Object.freeze({
      rackId: state.faultRackId,
      status: state.faultStatus,
      progress: state.faultProgress,
    }),
    paused: state.paused,
    message: state.message,
  }

  Object.defineProperty(snapshot, INTENT, { value: state.intent })
  return Object.freeze(snapshot) as InternalWorld
}

function updateWorld(
  world: WorldSnapshot,
  overrides: Partial<SnapshotState>,
): WorldSnapshot {
  return createSnapshot({ ...worldState(world), ...overrides })
}

function serviceCell(world: WorldSnapshot): Cell {
  const rack = world.racks.find(({ id }) => id === world.fault.rackId)
  if (!rack) throw new Error(`Missing rack ${world.fault.rackId}.`)
  return { x: rack.cell.x, z: rack.cell.z - rack.front }
}

function repairProgressTicks(progress: number): number {
  return Math.round(progress * REPAIR_TICKS)
}

function isSeedValid(seed: number): boolean {
  return Number.isSafeInteger(seed)
}

function sameCell(left: Cell, right: Cell): boolean {
  return left.x === right.x && left.z === right.z
}

export function createWorld(seed = 417): WorldSnapshot {
  if (!isSeedValid(seed)) {
    throw new Error('World seed must be a finite integer.')
  }

  const faultRack =
    RACKS[Math.floor(createDeterministicRandom(seed)() * RACKS.length)]
  if (!faultRack)
    throw new Error('Failed to choose a deterministic rack fault.')

  return createSnapshot({
    seed,
    tick: 0,
    cell: { x: 2, z: 7 },
    path: EMPTY_PATH,
    mode: 'idle',
    faultRackId: faultRack.id,
    faultStatus: 'fault',
    faultProgress: 0,
    paused: false,
    message: INITIAL_MESSAGE,
    intent: null,
  })
}

export function commandWorld(
  world: WorldSnapshot,
  command: WorldCommand,
): WorldSnapshot {
  switch (command.type) {
    case 'restart':
      return createWorld(world.seed)
    case 'pause':
      return updateWorld(world, {
        paused: !world.paused,
        message: world.paused ? 'Shift resumed.' : 'Shift paused.',
      })
    case 'dispatch': {
      if (world.paused) {
        return updateWorld(world, {
          message: 'Shift is paused. Resume before dispatching the technician.',
        })
      }
      if (world.fault.status === 'resolved') {
        return updateWorld(world, { message: 'The fault is already resolved.' })
      }
      if (world.fault.status === 'working') {
        return updateWorld(world, {
          message: 'Technician is already repairing the fault.',
        })
      }

      const target = serviceCell(world)
      if (sameCell(world.player.cell, target)) {
        return updateWorld(world, {
          path: EMPTY_PATH,
          mode: 'repairing',
          faultStatus: 'working',
          faultProgress: 0,
          message: `Technician started repairing rack ${world.fault.rackId}.`,
          intent: null,
        })
      }

      const path = findPath(world.player.cell, target)
      if (!path) {
        return updateWorld(world, {
          message: 'No route to the fault service aisle is available.',
        })
      }

      return updateWorld(world, {
        path,
        mode: 'walking',
        message: `Technician dispatched to rack ${world.fault.rackId}.`,
        intent: 'dispatch',
      })
    }
    case 'move': {
      const { cell } = command
      if (world.paused) {
        return updateWorld(world, {
          message: 'Shift is paused. Resume before moving the technician.',
        })
      }
      if (!isWalkable(cell)) {
        return updateWorld(world, {
          message: 'Choose a walkable floor cell inside the hall.',
        })
      }
      if (sameCell(world.player.cell, cell)) {
        return updateWorld(world, {
          message: 'Technician is already at that cell.',
        })
      }

      const path = findPath(world.player.cell, cell)
      if (!path) {
        return updateWorld(world, {
          message: 'No route to that floor cell is available.',
        })
      }

      const cancellingRepair = world.fault.status === 'working'
      const resolved = world.fault.status === 'resolved'

      return updateWorld(world, {
        path,
        mode: 'walking',
        faultStatus: resolved
          ? 'resolved'
          : cancellingRepair
            ? 'fault'
            : 'fault',
        faultProgress: resolved
          ? 1
          : cancellingRepair
            ? 0
            : world.fault.progress,
        message: cancellingRepair
          ? `Repair cancelled. Technician moving to (${cell.x}, ${cell.z}).`
          : `Technician moving to (${cell.x}, ${cell.z}).`,
        intent: 'move',
      })
    }
  }
}

export function tickWorld(world: WorldSnapshot): WorldSnapshot {
  if (world.paused) return world

  const nextTick = world.clock.tick + 1
  let cell = world.player.cell
  let path = world.player.path
  let mode = world.player.mode
  let faultStatus = world.fault.status
  let faultProgress = world.fault.progress
  let message = world.message
  let intent = worldState(world).intent
  let startedRepair = false

  if (mode === 'walking' && path.length > 0 && nextTick % MOVE_TICKS === 0) {
    cell = path[0]!
    path = path.slice(1)
    if (path.length === 0) {
      const target = serviceCell(world)
      if (
        intent === 'dispatch' &&
        faultStatus === 'fault' &&
        sameCell(cell, target)
      ) {
        mode = 'repairing'
        faultStatus = 'working'
        faultProgress = 0
        message = `Technician started repairing rack ${world.fault.rackId}.`
        intent = null
        startedRepair = true
      } else {
        mode = 'idle'
        message = `Technician arrived at (${cell.x}, ${cell.z}).`
        intent = null
      }
    }
  }

  if (!startedRepair && mode === 'repairing' && faultStatus === 'working') {
    const nextProgress = Math.min(
      REPAIR_TICKS,
      repairProgressTicks(faultProgress) + 1,
    )
    faultProgress = nextProgress / REPAIR_TICKS
    if (nextProgress === REPAIR_TICKS) {
      faultStatus = 'resolved'
      mode = 'idle'
      message = `Rack ${world.fault.rackId} repaired. Hall restored.`
      intent = null
    } else {
      message = `Repairing rack ${world.fault.rackId}.`
    }
  }

  return createSnapshot({
    seed: world.seed,
    tick: nextTick,
    cell,
    path,
    mode,
    faultRackId: world.fault.rackId,
    faultStatus,
    faultProgress,
    paused: false,
    message,
    intent,
  })
}
