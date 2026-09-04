import { MathUtils, OrthographicCamera, Vector3 } from 'three'
import { ISOMETRIC_CAMERA } from './isometricCamera'

const target = new Vector3(8, 0, 7)
const elevation = MathUtils.degToRad(ISOMETRIC_CAMERA.elevationDegrees)

export function cameraHeading(camera: OrthographicCamera): number {
  const angle = MathUtils.radToDeg(
    Math.atan2(camera.position.x - target.x, camera.position.z - target.z),
  )
  return ((Math.round((angle - 45) / 90) % 4) + 4) % 4
}

function positionCamera(camera: OrthographicCamera, heading: number): void {
  const angle = MathUtils.degToRad(
    ISOMETRIC_CAMERA.orbitHeadingsDegrees[heading],
  )
  camera.position.set(
    target.x + 30 * Math.cos(elevation) * Math.sin(angle),
    30 * Math.sin(elevation),
    target.z + 30 * Math.cos(elevation) * Math.cos(angle),
  )
  camera.lookAt(target)
  camera.updateMatrixWorld()
}

export function frameCamera(
  camera: OrthographicCamera,
  width: number,
  height: number,
): void {
  const aspect = Math.max(width, 1) / Math.max(height, 1)
  const span = Math.max(18.8, 27 / aspect)
  camera.left = (-span * aspect) / 2
  camera.right = (span * aspect) / 2
  camera.top = span / 2
  camera.bottom = -span / 2
  camera.updateProjectionMatrix()
}

export function createCamera(
  width: number,
  height: number,
): OrthographicCamera {
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
  frameCamera(camera, width, height)
  positionCamera(camera, 0)
  return camera
}

export function orbitCamera(camera: OrthographicCamera, step: -1 | 1): void {
  positionCamera(camera, (cameraHeading(camera) + step + 4) % 4)
}

export function zoomCamera(camera: OrthographicCamera, delta: number): void {
  camera.zoom = MathUtils.clamp(
    camera.zoom + delta,
    ISOMETRIC_CAMERA.zoom.minimum,
    ISOMETRIC_CAMERA.zoom.maximum,
  )
  camera.updateProjectionMatrix()
}
