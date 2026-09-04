import { describe, expect, it } from 'vitest'

import { ISOMETRIC_CAMERA } from './isometricCamera'

describe('ISOMETRIC_CAMERA', () => {
  it('matches the measured Cel Shift camera contract', () => {
    expect(ISOMETRIC_CAMERA.projection).toBe('orthographic')
    expect(ISOMETRIC_CAMERA.elevationDegrees).toBeCloseTo(35.264, 3)
    expect(ISOMETRIC_CAMERA.orbitHeadingsDegrees).toEqual([45, 135, 225, 315])
    expect(ISOMETRIC_CAMERA.allowTilt).toBe(false)
  })
})
