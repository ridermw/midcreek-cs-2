import {
  AmbientLight,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RingGeometry,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { WorldSnapshot } from '../world/contracts'
import { HALL } from '../world/layout'
import { boxBatch, palette, toonMaterial } from './geometry'

function floorLabel(
  scene: Scene,
  text: string,
  x: number,
  z: number,
  width: number,
): void {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 80
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#426575'
  ctx.font = '600 33px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(text, 256, 51)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  const material = new MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  })
  const label = new Mesh(new PlaneGeometry(width, width / 6), material)
  label.rotation.x = -Math.PI / 2
  label.position.set(x, 0.012, z)
  scene.add(label)
}

export function createHall(world: WorldSnapshot) {
  const scene = new Scene()
  scene.background = new Color(0xdeebeb)
  scene.add(new AmbientLight(0xd9eeff, 1.65))
  const sunlight = new DirectionalLight(0xfffaf0, 2.5)
  sunlight.position.set(-6, 18, 10)
  scene.add(sunlight)
  const { box, panel, finish } = boxBatch(scene)
  const p = palette
  box(p.shadow, 8, -0.36, 7, 18.2, 0.7, 16.2, true)
  box(p.concrete, 8, -0.045, 7, 18, 0.08, 16, true)
  // Hairline concrete seams and the clear circulation perimeter.
  for (let x = 0; x <= 16; x += 2) box(0xafc2c8, x, 0.002, 7, 0.016, 0.004, 16)
  for (let z = 0; z <= 14; z += 2) box(0xafc2c8, 8, 0.003, z, 18, 0.004, 0.016)
  for (const z of [1, 13]) box(p.yellow, 8, 0.009, z, 14.8, 0.018, 0.09)
  for (const x of [1, 15]) box(p.yellow, x, 0.009, 7, 0.09, 0.018, 12)
  for (const z of [2.3, 5.7, 8.3, 11.7]) {
    box(p.yellow, 7.5, 0.06, z, 8.9, 0.12, 0.12, true)
  }
  const hoseSegments: TubeGeometry[] = []
  for (const rack of world.racks) {
    const { x, z } = rack.cell
    const f = rack.front
    box(p.teal, x, 0.09, z, 0.94, 0.18, 0.96, true)
    box(p.white, x, HALL.rackHeight / 2, z, 0.92, HALL.rackHeight, 0.9, true)
    box(p.ink, x, 1.04, z + f * 0.46, 0.73, 1.8, 0.028, true)
    box(p.teal, x - 0.4, 1.02, z + f * 0.485, 0.035, 1.85, 0.035)
    box(p.teal, x + 0.4, 1.02, z + f * 0.485, 0.035, 1.85, 0.035)
    for (let unit = 0; unit < 8; unit++) {
      const y = 0.27 + unit * 0.21
      panel(0x395566, x, y, z + f * 0.496, 0.65, 0.165, f)
      panel(p.green, x - 0.245, y, z + f * 0.51, 0.045, 0.07, f)
      panel(0x90a9b1, x + 0.2, y, z + f * 0.51, 0.12, 0.025, f)
    }
    box(p.shadow, x, 2.105, z, 0.63, 0.015, 0.65)
    for (let vent = -2; vent <= 2; vent++) {
      box(p.ink, x + vent * 0.1, 2.117, z, 0.018, 0.008, 0.48)
    }
    box(p.shadow, x, 1.05, z - f * 0.463, 0.55, 1.65, 0.025, true)
    // Coolant drops are only on backs, inside the narrow paired service aisles.
    const back = z - f * 0.51
    const hose = new CatmullRomCurve3([
      new Vector3(x - 0.18, 2.75, back),
      new Vector3(x - 0.21, 2.25, back - f * 0.18),
      new Vector3(x + 0.2, 1.4, back - f * 0.2),
      new Vector3(x + 0.17, 0.55, back),
    ])
    hoseSegments.push(new TubeGeometry(hose, 12, 0.036, 5, false))
  }
  const hoses = mergeGeometries(hoseSegments)
  scene.add(new Mesh(hoses, toonMaterial(p.ink)))
  hoseSegments.forEach((geometry) => geometry.dispose())
  for (const z of [4, 10]) {
    // Two distinct tray tiers with ladder rungs and a visible yellow cable run.
    for (const y of [2.65, 3.05]) {
      for (const dz of [-0.22, 0.22])
        box(p.ink, 7.5, y, z + dz, 9.2, 0.07, 0.065)
      for (let x = 3; x <= 12; x += 0.4)
        box(p.shadow, x, y, z, 0.05, 0.045, 0.45)
      box(p.yellow, 7.5, y + 0.055, z, 9.1, 0.055, 0.08)
    }
  }
  // Cooling plant lives beyond the walkable floor, not in invisible collision cells.
  for (const z of [3, 7, 11]) {
    box(p.white, 16.8, 0.65, z, 0.8, 1.3, 1.5, true)
    box(p.teal, 16.85, 0.4, z, 0.82, 0.15, 1.5, true)
    box(p.ink, 16.8, 1.31, z, 0.53, 0.025, 1.05, true)
    for (let vent = -3; vent <= 3; vent++)
      box(p.shadow, 16.8, 1.33, z + vent * 0.13, 0.45, 0.02, 0.04)
  }
  box(p.teal, 17.15, 0.2, 7, 0.14, 0.16, 13, true)
  finish()
  floorLabel(scene, 'COLD AISLE / 01', 7.5, 7, 5.5)
  floorLabel(scene, 'MIDCREEK / HALL 04', 7, 13.9, 6)
  return { scene, player: createTechnician(scene) }
}

function createTechnician(scene: Scene): Group {
  const player = new Group()
  const materials = new Map<number, ReturnType<typeof toonMaterial>>()
  function material(color: number) {
    let value = materials.get(color)
    if (!value) {
      value = toonMaterial(color)
      materials.set(color, value)
    }
    return value
  }
  function part(
    color: number,
    x: number,
    y: number,
    z: number,
    r: number,
    height: number,
  ) {
    const mesh = new Mesh(
      new CylinderGeometry(r, r * 0.92, height, 6),
      material(color),
    )
    mesh.position.set(x, y, z)
    player.add(mesh)
  }
  for (const x of [-0.12, 0.12]) {
    part(palette.ink, x, 0.12, 0.06, 0.105, 0.21)
    part(0x3b647e, x, 0.47, 0, 0.09, 0.6)
    part(0x355368, x * 2.3, 1.01, 0, 0.07, 0.46)
    part(palette.ink, x * 2.3, 0.75, 0, 0.075, 0.12)
  }
  part(palette.yellow, 0, 1.02, 0, 0.23, 0.53)
  part(palette.white, 0, 0.91, 0, 0.237, 0.055)
  part(0xb77f5f, 0, 1.4, 0, 0.135, 0.22)
  part(palette.blue, 0, 1.51, 0, 0.21, 0.05)
  const hat = new Mesh(
    new SphereGeometry(0.17, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    material(palette.blue),
  )
  hat.position.y = HALL.technicianHeight - 0.16
  player.add(hat)
  const ring = new Mesh(
    new RingGeometry(0.32, 0.4, 32),
    new MeshBasicMaterial({ color: palette.yellow }),
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.023
  player.add(ring)
  scene.add(player)
  return player
}
