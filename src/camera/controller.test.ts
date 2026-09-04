import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import {
  createCamera,
  frameCamera,
  orbitCamera,
  zoomCamera,
} from './controller'
import { ISOMETRIC_CAMERA } from './isometricCamera'

describe('constrained gameplay camera', () => {
  it('maintains the measured elevation at every heading and wraps orbit', () => {
    const camera = createCamera(1280, 720)
    const target = new Vector3(8, 0, 7)
    for (let heading = 0; heading < 4; heading++) {
      const offset = camera.position.clone().sub(target)
      expect(
        (Math.atan2(offset.y, Math.hypot(offset.x, offset.z)) * 180) / Math.PI,
      ).toBeCloseTo(ISOMETRIC_CAMERA.elevationDegrees, 3)
      expect(
        ((Math.atan2(offset.x, offset.z) * 180) / Math.PI + 360) % 360,
      ).toBeCloseTo(ISOMETRIC_CAMERA.orbitHeadingsDegrees[heading])
      orbitCamera(camera, 1)
    }
    expect(camera.position.x).toBeCloseTo(camera.position.z + 1)
    expect(camera.up.toArray()).toEqual([0, 1, 0])
  })

  it('resizes without changing heading or zoom and clamps zoom', () => {
    const camera = createCamera(1280, 720)
    orbitCamera(camera, -1)
    const position = camera.position.clone()
    zoomCamera(camera, 99)
    expect(camera.zoom).toBe(ISOMETRIC_CAMERA.zoom.maximum)
    zoomCamera(camera, -99)
    expect(camera.zoom).toBe(ISOMETRIC_CAMERA.zoom.minimum)
    frameCamera(camera, 640, 800)
    expect(camera.position.equals(position)).toBe(true)
    expect(camera.zoom).toBe(ISOMETRIC_CAMERA.zoom.minimum)
    expect(
      (camera.right - camera.left) / (camera.top - camera.bottom),
    ).toBeCloseTo(0.8)
  })
})
