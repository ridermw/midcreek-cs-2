import { describe, expect, it } from 'vitest'

import { createDeterministicRandom } from '../core/random'
import type { Cell, WorldSnapshot } from './contracts'
import { createRacks, findPath } from './layout'
import {
  MOVE_TICKS,
  REPAIR_TICKS,
  TICK_SECONDS,
  commandWorld,
  createWorld,
  tickWorld,
} from './simulation'

function advanceTicks(world: WorldSnapshot, ticks: number) {
  let current = world
  for (let index = 0; index < ticks; index += 1) current = tickWorld(current)
  return current
}

function serviceCell(world: WorldSnapshot): Cell {
  const rack = world.racks.find(({ id }) => id === world.fault.rackId)
  if (!rack) throw new Error(`Missing rack ${world.fault.rackId}`)
  return { x: rack.cell.x, z: rack.cell.z - rack.front }
}

function createRepairingWorld(seed = 417) {
  const base = createWorld(seed)
  const path = findPath(base.player.cell, serviceCell(base))
  if (!path) throw new Error('Fault back aisle should be reachable')
  const dispatched = commandWorld(base, { type: 'dispatch' })
  return advanceTicks(dispatched, path.length * MOVE_TICKS)
}

describe('world simulation', () => {
  it('creates replayable snapshots with deterministic seeded faults', () => {
    const seed = 417
    const racks = createRacks()
    const index = Math.floor(createDeterministicRandom(seed)() * racks.length)
    const expectedFaultId = racks[index]?.id
    const run = () =>
      advanceTicks(
        commandWorld(createWorld(seed), {
          type: 'move',
          cell: { x: 3, z: 7 },
        }),
        MOVE_TICKS,
      )

    expect(TICK_SECONDS).toBe(1 / 30)
    expect(MOVE_TICKS).toBe(5)
    expect(REPAIR_TICKS).toBe(120)
    expect(expectedFaultId).toBeDefined()
    expect(createWorld(seed).fault.rackId).toBe(expectedFaultId)
    expect(run()).toEqual(run())
    expect(
      new Set(
        [417, 418, 419, 420].map((value) => createWorld(value).fault.rackId),
      ).size,
    ).toBeGreaterThan(1)
    expect(() => createWorld(Number.NaN)).toThrow(/finite integer/i)
    expect(() => createWorld(1.25)).toThrow(/finite integer/i)
  })

  it('deep freezes snapshots and does not mutate previous worlds', () => {
    const world = createWorld()
    const moved = commandWorld(world, { type: 'move', cell: { x: 3, z: 7 } })

    expect(world.seed).toBe(417)
    expect(world.clock).toEqual({ tick: 0, elapsedSeconds: 0 })
    expect(world.player).toEqual({
      cell: { x: 2, z: 7 },
      path: [],
      mode: 'idle',
    })
    expect(world.fault.status).toBe('fault')
    expect(world.fault.progress).toBe(0)
    expect(world.paused).toBe(false)
    expect(world.message).toBe('Select the fault to dispatch a technician.')
    expect(Object.isFrozen(world)).toBe(true)
    expect(Object.isFrozen(world.clock)).toBe(true)
    expect(Object.isFrozen(world.player)).toBe(true)
    expect(Object.isFrozen(world.player.cell)).toBe(true)
    expect(Object.isFrozen(world.player.path)).toBe(true)
    expect(Object.isFrozen(world.racks)).toBe(true)
    expect(Object.isFrozen(world.racks[0]!)).toBe(true)
    expect(Object.isFrozen(world.racks[0]!.cell)).toBe(true)
    expect(Object.isFrozen(world.fault)).toBe(true)
    expect(() =>
      Object.defineProperty(world.player.path, '0', {
        value: { x: 9, z: 9 },
      }),
    ).toThrow(TypeError)
    expect(world.player.mode).toBe('idle')
    expect(world.player.path).toEqual([])
    expect(moved.player.mode).toBe('walking')
    expect(moved.player.path).toEqual([{ x: 3, z: 7 }])
  })

  it('preserves the immutable route until a movement step changes it', () => {
    const moving = commandWorld(createWorld(), {
      type: 'move',
      cell: { x: 3, z: 7 },
    })
    const beforeStep = advanceTicks(moving, MOVE_TICKS - 1)
    expect(beforeStep.player.path).toBe(moving.player.path)
    const stepped = tickWorld(beforeStep)
    expect(stepped.player.path).not.toBe(moving.player.path)
    expect(stepped.player.cell).toEqual({ x: 3, z: 7 })
  })

  it('dispatches along the routed path and only starts repair on arrival', () => {
    const initial = createWorld()
    const target = serviceCell(initial)
    const path = findPath(initial.player.cell, target)
    if (!path) throw new Error('Fault back aisle should be reachable')

    const dispatched = commandWorld(initial, { type: 'dispatch' })
    const beforeArrival = advanceTicks(dispatched, path.length * MOVE_TICKS - 1)
    const arrived = tickWorld(beforeArrival)

    expect(dispatched.player.mode).toBe('walking')
    expect(dispatched.player.path).toEqual(path)
    expect(dispatched.fault.status).toBe('fault')
    expect(dispatched.fault.progress).toBe(0)
    expect(beforeArrival.player.mode).toBe('walking')
    expect(beforeArrival.fault.status).toBe('fault')
    expect(beforeArrival.fault.progress).toBe(0)
    expect(arrived.player.cell).toEqual(target)
    expect(arrived.player.path).toEqual([])
    expect(arrived.player.mode).toBe('repairing')
    expect(arrived.fault.status).toBe('working')
    expect(arrived.fault.progress).toBe(0)
    expect(arrived.clock).toEqual({
      tick: path.length * MOVE_TICKS,
      elapsedSeconds: path.length * MOVE_TICKS * TICK_SECONDS,
    })
  })

  it('can start repair immediately from the service aisle and resolves after 120 ticks', () => {
    const initial = createWorld()
    const target = serviceCell(initial)
    const path = findPath(initial.player.cell, target)
    if (!path) throw new Error('Fault back aisle should be reachable')

    const arrivedIdle = advanceTicks(
      commandWorld(initial, { type: 'move', cell: target }),
      path.length * MOVE_TICKS,
    )
    const repairing = commandWorld(arrivedIdle, { type: 'dispatch' })
    const almostResolved = advanceTicks(repairing, REPAIR_TICKS - 1)
    const resolved = tickWorld(almostResolved)
    const afterResolved = tickWorld(resolved)

    expect(arrivedIdle.player.cell).toEqual(target)
    expect(arrivedIdle.player.mode).toBe('idle')
    expect(arrivedIdle.fault.status).toBe('fault')
    expect(repairing.player.mode).toBe('repairing')
    expect(repairing.fault.status).toBe('working')
    expect(repairing.fault.progress).toBe(0)
    expect(almostResolved.fault.status).toBe('working')
    expect(almostResolved.fault.progress).toBe(
      (REPAIR_TICKS - 1) / REPAIR_TICKS,
    )
    expect(resolved.fault.status).toBe('resolved')
    expect(resolved.fault.progress).toBe(1)
    expect(resolved.player.mode).toBe('idle')
    expect(afterResolved.clock.tick).toBe(resolved.clock.tick + 1)
    expect(afterResolved.clock.elapsedSeconds).toBe(
      (resolved.clock.tick + 1) * TICK_SECONDS,
    )
  })

  it('cancels repair on move without resetting active dispatch progress and keeps resolved travel intact', () => {
    const repairing = advanceTicks(createRepairingWorld(), 9)
    const target = serviceCell(repairing)
    const repeatedDispatch = commandWorld(repairing, { type: 'dispatch' })
    const cancelled = commandWorld(repairing, {
      type: 'move',
      cell: { x: target.x + 1, z: target.z },
    })
    const resolved = advanceTicks(repairing, REPAIR_TICKS - 9)
    const postResolvedDispatch = commandWorld(resolved, { type: 'dispatch' })
    const movedResolved = commandWorld(resolved, {
      type: 'move',
      cell: { x: target.x + 1, z: target.z },
    })

    expect(repairing.fault.progress).toBe(9 / REPAIR_TICKS)
    expect(repeatedDispatch.player.mode).toBe('repairing')
    expect(repeatedDispatch.fault.status).toBe('working')
    expect(repeatedDispatch.fault.progress).toBe(repairing.fault.progress)
    expect(cancelled.player.mode).toBe('walking')
    expect(cancelled.fault.status).toBe('fault')
    expect(cancelled.fault.progress).toBe(0)
    expect(resolved.fault.status).toBe('resolved')
    expect(postResolvedDispatch.message).toMatch(/resolved/i)
    expect(movedResolved.player.mode).toBe('walking')
    expect(movedResolved.fault.status).toBe('resolved')
    expect(movedResolved.fault.progress).toBe(1)
  })

  it('rejects paused and impossible commands and restarts to the same seeded world', () => {
    const initial = createWorld()
    const paused = commandWorld(initial, { type: 'pause' })
    const pausedMove = commandWorld(paused, {
      type: 'move',
      cell: { x: 3, z: 7 },
    })
    const pausedDispatch = commandWorld(paused, { type: 'dispatch' })
    const resumed = commandWorld(paused, { type: 'pause' })
    const blocked = commandWorld(resumed, {
      type: 'move',
      cell: { x: 4, z: 3 },
    })
    const outOfBounds = commandWorld(resumed, {
      type: 'move',
      cell: { x: -1, z: 7 },
    })
    const nonInteger = commandWorld(resumed, {
      type: 'move',
      cell: { x: 2.5, z: 7 },
    })
    const sameCell = commandWorld(resumed, {
      type: 'move',
      cell: { x: 2, z: 7 },
    })
    const restarted = commandWorld(paused, { type: 'restart' })

    expect(paused.paused).toBe(true)
    expect(tickWorld(paused)).toBe(paused)
    expect(pausedMove.message).toMatch(/paused/i)
    expect(pausedDispatch.message).toMatch(/paused/i)
    expect(resumed.paused).toBe(false)
    expect(blocked.message).toMatch(/walkable/i)
    expect(outOfBounds.message).toMatch(/walkable/i)
    expect(nonInteger.message).toMatch(/walkable/i)
    expect(sameCell.message).toMatch(/already/i)
    expect(restarted).toEqual(createWorld(initial.seed))
  })
})
