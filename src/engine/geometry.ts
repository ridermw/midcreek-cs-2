import {
  BoxGeometry,
  BufferGeometry,
  DataTexture,
  EdgesGeometry,
  Float32BufferAttribute,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  MeshToonMaterial,
  NearestFilter,
  PlaneGeometry,
  RedFormat,
  Scene,
  Vector3,
} from 'three'

export const palette = {
  ink: 0x193344,
  white: 0xeaf5f1,
  concrete: 0xbdced0,
  teal: 0x4caaa5,
  yellow: 0xf9c847,
  blue: 0x61b8e5,
  green: 0x88d879,
  red: 0xf1624f,
  shadow: 0x809fae,
}

export function toonMaterial(color: number): MeshToonMaterial {
  const gradientMap = new DataTexture(
    new Uint8Array([110, 255]),
    2,
    1,
    RedFormat,
  )
  gradientMap.minFilter = gradientMap.magFilter = NearestFilter
  gradientMap.needsUpdate = true
  return new MeshToonMaterial({ color, gradientMap })
}

// Batch all repeated box details by palette color, including their crisp edges.
export function boxBatch(scene: Scene) {
  const boxes = new Map<number, Matrix4[]>()
  const panels = new Map<number, Matrix4[]>()
  const edges: number[] = []
  const geometry = new BoxGeometry(1, 1, 1)
  const panelGeometry = new PlaneGeometry(1, 1)
  const unitEdges = new EdgesGeometry(geometry)
  const points = unitEdges.getAttribute('position')
  const point = new Vector3()

  function box(
    color: number,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    outline = false,
  ): void {
    const matrix = new Matrix4().makeScale(width, height, depth)
    matrix.setPosition(x, y, z)
    const group = boxes.get(color) ?? []
    group.push(matrix)
    boxes.set(color, group)
    if (outline) {
      for (let i = 0; i < points.count; i++) {
        point.fromBufferAttribute(points, i).applyMatrix4(matrix)
        edges.push(point.x, point.y, point.z)
      }
    }
  }

  function panel(
    color: number,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    front: -1 | 1,
  ): void {
    const matrix = new Matrix4().makeScale(width * front, height, front)
    matrix.setPosition(x, y, z)
    const group = panels.get(color) ?? []
    group.push(matrix)
    panels.set(color, group)
  }

  function instancesFor(
    source: Map<number, Matrix4[]>,
    shape: BufferGeometry,
  ): void {
    if (source.size === 0) shape.dispose()
    for (const [color, matrices] of source) {
      const instances = new InstancedMesh(
        shape,
        toonMaterial(color),
        matrices.length,
      )
      matrices.forEach((matrix, i) => instances.setMatrixAt(i, matrix))
      instances.computeBoundingSphere()
      scene.add(instances)
    }
  }

  function finish(): void {
    instancesFor(boxes, geometry)
    instancesFor(panels, panelGeometry)
    const lines = new BufferGeometry()
    lines.setAttribute('position', new Float32BufferAttribute(edges, 3))
    scene.add(
      new LineSegments(lines, new LineBasicMaterial({ color: palette.ink })),
    )
    unitEdges.dispose()
  }
  return { box, panel, finish }
}
