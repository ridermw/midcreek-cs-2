import { expect, it } from 'vitest'
import { InstancedMesh, Matrix4, Scene, Vector3 } from 'three'
import { boxBatch, palette } from './geometry'

it('renders flat server details as two triangles with the correct front normal', () => {
  const scene = new Scene()
  const batch = boxBatch(scene)
  batch.panel(palette.ink, 4, 1, 3, 0.65, 0.165, -1)
  batch.finish()
  const panel = scene.children.find((child) => child instanceof InstancedMesh)
  expect(panel).toBeInstanceOf(InstancedMesh)
  if (!(panel instanceof InstancedMesh)) throw new Error('Expected panel mesh')
  expect(panel.geometry.index?.count).toBe(6)
  const matrix = new Matrix4()
  panel.getMatrixAt(0, matrix)
  const normal = new Vector3(0, 0, 1).transformDirection(matrix)
  expect(normal.z).toBeCloseTo(-1)
  expect(new Vector3().setFromMatrixPosition(matrix).toArray()).toEqual([
    4, 1, 3,
  ])
})
