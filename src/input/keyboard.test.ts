import { expect, it } from 'vitest'
import { movementForKey } from './keyboard'

it('maps navigation consistently through all four camera headings', () => {
  expect(movementForKey('w', 0)).toEqual({ x: 0, z: -1 })
  expect(movementForKey('ArrowRight', 0)).toEqual({ x: 1, z: 0 })
  expect(movementForKey('w', 1)).toEqual({ x: -1, z: 0 })
  expect(movementForKey('w', 2)).toEqual({ x: 0, z: 1 })
  expect(movementForKey('w', 3)).toEqual({ x: 1, z: 0 })
  expect(movementForKey('Tab', 0)).toBeNull()
})
