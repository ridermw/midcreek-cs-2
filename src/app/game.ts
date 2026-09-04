import {
  BufferGeometry,
  Float32BufferAttribute,
  InstancedMesh,
  Light,
  Line,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  Plane,
  Raycaster,
  Scene,
  Texture,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import {
  cameraHeading,
  createCamera,
  frameCamera,
  orbitCamera,
  zoomCamera,
} from '../camera/controller'
import { ISOMETRIC_CAMERA } from '../camera/isometricCamera'
import { summarizeFrames, transferBytes } from '../diagnostics/metrics'
import type { Diagnostics, Inspection } from '../diagnostics/inspection'
import { createHall } from '../engine/hall'
import { createHallCache } from '../engine/hallCache'
import { palette } from '../engine/geometry'
import { movementForKey } from '../input/keyboard'
import { createHud } from '../ui/hud'
import type { WorldCommand } from '../world/contracts'
import {
  commandWorld,
  createWorld,
  tickWorld,
  TICK_SECONDS,
} from '../world/simulation'

export function startGame(root: HTMLElement): () => void {
  const startupStarted = performance.now()
  let startupMs = 0
  const params = new URLSearchParams(location.search)
  const seed = Number(params.get('seed') ?? '417')
  let world = createWorld(seed)
  const hud = createHud(root, world.seed)
  const canvas = hud.element<HTMLCanvasElement>('canvas')
  const viewport = hud.element('#viewport')
  const renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  const context = renderer.getContext()
  const debugInfo = context.getExtension('WEBGL_debug_renderer_info')
  const hardware = debugInfo
    ? String(context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
    : 'Renderer details unavailable'
  const camera = createCamera(viewport.clientWidth, viewport.clientHeight)
  const requestedHeading = Number(params.get('heading') ?? 0)
  if (
    Number.isInteger(requestedHeading) &&
    requestedHeading >= 0 &&
    requestedHeading < 4
  ) {
    for (let i = 0; i < requestedHeading; i++) orbitCamera(camera, 1)
  }
  const requestedZoom = Number(params.get('zoom') ?? 1)
  if (Number.isFinite(requestedZoom)) zoomCamera(camera, requestedZoom - 1)
  const { scene, player } = createHall(world)
  const dynamicScene = new Scene()
  for (const child of scene.children) {
    if (child instanceof Light) dynamicScene.add(child.clone())
  }
  dynamicScene.add(player)
  const hallCache = createHallCache(renderer, scene, camera)
  const routeGeometry = new BufferGeometry()
  const route = new Line(
    routeGeometry,
    new LineBasicMaterial({ color: palette.teal }),
  )
  route.visible = false
  dynamicScene.add(route)
  let lastPath = world.player.path
  const fault = world.racks.find((rack) => rack.id === world.fault.rackId)!
  const frames: number[] = []
  let frame = 0
  let disposed = false
  let failed = false
  let previousTime = performance.now()
  let accumulator = 0
  let lastUiTime = 0
  const events = new AbortController()
  const { signal } = events
  const raycaster = new Raycaster()
  const floor = new Plane(new Vector3(0, 1, 0), 0)
  const pointer = new Vector2()
  const point = new Vector3()
  const screenPoint = new Vector3()

  function command(value: WorldCommand) {
    if (failed) {
      if (value.type === 'restart') location.reload()
      else
        hud.element('#message').textContent =
          'Graphics connection lost. Reload the shift to continue.'
      return
    }
    world = commandWorld(world, value)
    if (value.type === 'restart') accumulator = 0
    hud.update(world)
  }
  function cameraLabels() {
    hud.element('#heading').textContent =
      `${ISOMETRIC_CAMERA.orbitHeadingsDegrees[cameraHeading(camera)]}°`
    hud.element('#zoom').textContent = `${Math.round(camera.zoom * 100)}%`
  }
  function orbit(step: -1 | 1) {
    orbitCamera(camera, step)
    cameraLabels()
  }
  function zoom(delta: number) {
    zoomCamera(camera, delta)
    cameraLabels()
  }
  function resetView() {
    while (cameraHeading(camera) !== 0) orbitCamera(camera, 1)
    zoomCamera(camera, 1 - camera.zoom)
    cameraLabels()
  }
  function onClick(selector: string, action: () => void) {
    hud.element(selector).addEventListener('click', action, { signal })
  }
  onClick('#dispatch', () => command({ type: 'dispatch' }))
  onClick('#fault-marker', () => command({ type: 'dispatch' }))
  onClick('#again', () => command({ type: 'restart' }))
  onClick('#restart', () => command({ type: 'restart' }))
  onClick('#pause', () => command({ type: 'pause' }))
  onClick('#orbit-left', () => orbit(-1))
  onClick('#orbit-right', () => orbit(1))
  onClick('#zoom-in', () => zoom(0.15))
  onClick('#zoom-out', () => zoom(-0.15))
  onClick('#reset-view', resetView)
  onClick('#performance', () => {
    const panel = hud.element('#diagnostics')
    panel.hidden = !panel.hidden
    hud
      .element('#performance')
      .setAttribute('aria-expanded', String(!panel.hidden))
  })
  canvas.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0) return
      canvas.focus({ preventScroll: true })
      const rect = canvas.getBoundingClientRect()
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointer, camera)
      if (raycaster.ray.intersectPlane(floor, point)) {
        command({
          type: 'move',
          cell: { x: Math.round(point.x), z: Math.round(point.z) },
        })
      }
    },
    { signal },
  )
  canvas.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault()
      zoom(event.deltaY > 0 ? -0.1 : 0.1)
    },
    { signal, passive: false },
  )
  window.addEventListener(
    'keydown',
    (event) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest(
          'button, a, input, select, textarea, [contenteditable]',
        )
      )
        return
      const delta = movementForKey(
        event.key.length === 1 ? event.key.toLowerCase() : event.key,
        cameraHeading(camera),
      )
      if (delta) {
        event.preventDefault()
        command({
          type: 'move',
          cell: {
            x: world.player.cell.x + delta.x,
            z: world.player.cell.z + delta.z,
          },
        })
        return
      }
      if (event.repeat) return
      const actions: Record<string, () => void> = {
        q: () => orbit(-1),
        e: () => orbit(1),
        f: () => command({ type: 'dispatch' }),
        ' ': () => command({ type: 'pause' }),
        Home: resetView,
        '+': () => zoom(0.15),
        '-': () => zoom(-0.15),
      }
      const action = actions[event.key]
      if (action) {
        event.preventDefault()
        action()
      }
    },
    { signal },
  )
  const resize = new ResizeObserver(() => {
    frameCamera(camera, viewport.clientWidth, viewport.clientHeight)
    renderer.setSize(viewport.clientWidth, viewport.clientHeight, false)
  })
  resize.observe(viewport)
  renderer.setSize(viewport.clientWidth, viewport.clientHeight, false)
  document.addEventListener(
    'visibilitychange',
    () => {
      previousTime = performance.now()
      accumulator = 0
      frames.length = 0
    },
    { signal },
  )
  canvas.addEventListener(
    'webglcontextlost',
    (event) => {
      event.preventDefault()
      cancelAnimationFrame(frame)
      if (!world.paused) command({ type: 'pause' })
      failed = true
      hud.element<HTMLButtonElement>('#pause').disabled = true
      hud.element('#restart').setAttribute('aria-label', 'Reload shift')
      hud.element('#restart').setAttribute('title', 'Reload shift')
      hud.element('#pause-banner').textContent =
        'Graphics connection lost. Reload to restart this shift.'
      hud.element('#message').textContent =
        'WebGL context lost; reload the page to recover.'
    },
    { signal },
  )

  function project(x: number, y: number, z: number) {
    screenPoint.set(x, y, z).project(camera)
    return {
      x: ((screenPoint.x + 1) / 2) * viewport.clientWidth,
      y: ((1 - screenPoint.y) / 2) * viewport.clientHeight,
    }
  }
  function positionLabel(selector: string, x: number, y: number, z: number) {
    const position = project(x, y, z)
    hud.element(selector).style.transform =
      `translate(${position.x}px, ${position.y}px) translate(-50%, -100%)`
  }
  function diagnostics(): Diagnostics {
    const navigation = performance
      .getEntriesByType('navigation')
      .filter(
        (entry): entry is PerformanceNavigationTiming =>
          entry instanceof PerformanceNavigationTiming,
      )
    const resources = performance
      .getEntriesByType('resource')
      .filter(
        (entry): entry is PerformanceResourceTiming =>
          entry instanceof PerformanceResourceTiming,
      )
    return {
      build: __BUILD_ID__,
      seed: world.seed,
      scenario: 'coolant-leak',
      frames: summarizeFrames(frames),
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      initialTransferBytes: transferBytes(
        [...navigation, ...resources],
        navigation[0]?.loadEventEnd ?? 0,
      ),
      hardware,
      staticPasses: hallCache.staticPasses,
      renderedFrames: hallCache.renderedFrames,
      startupMs,
      peakDrawCalls: hallCache.peakDrawCalls,
      peakTriangles: hallCache.peakTriangles,
      browserViewport: { width: window.innerWidth, height: window.innerHeight },
      camera: {
        heading: ISOMETRIC_CAMERA.orbitHeadingsDegrees[cameraHeading(camera)],
        elevation: ISOMETRIC_CAMERA.elevationDegrees,
        zoom: camera.zoom,
        viewport: {
          width: viewport.clientWidth,
          height: viewport.clientHeight,
        },
        devicePixelRatio: renderer.getPixelRatio(),
      },
    }
  }
  const inspection: Inspection = Object.freeze({
    snapshot: () => world,
    diagnostics,
    project: (x: number, z: number) => project(x, 0, z),
  })
  Object.defineProperty(window, '__midcreek', {
    configurable: true,
    value: inspection,
  })
  function animate(time: number) {
    if (disposed || failed) return
    frame = requestAnimationFrame(animate)
    const elapsed = (time - previousTime) / 1000
    previousTime = time
    if (document.hidden) return
    if (elapsed > 0) {
      frames.push(elapsed * 1000)
      if (frames.length > 300) frames.shift()
    }
    accumulator += Math.min(elapsed, 0.25)
    while (accumulator >= TICK_SECONDS) {
      world = tickWorld(world)
      accumulator -= TICK_SECONDS
    }
    player.position.set(world.player.cell.x, 0, world.player.cell.z)
    if (lastPath !== world.player.path) {
      lastPath = world.player.path
      const points = [world.player.cell, ...world.player.path].flatMap(
        (cell) => [cell.x, 0.04, cell.z],
      )
      route.geometry.dispose()
      route.geometry = new BufferGeometry()
      route.geometry.setAttribute(
        'position',
        new Float32BufferAttribute(points, 3),
      )
      route.visible = world.player.path.length > 0
    }
    positionLabel('#fault-marker', fault.cell.x, 3.25, fault.cell.z)
    positionLabel('#player-marker', player.position.x, 1.98, player.position.z)
    hallCache.render(dynamicScene)
    if (time - lastUiTime > 100) {
      lastUiTime = time
      hud.update(world)
      if (!hud.element('#diagnostics').hidden) {
        const measured = diagnostics()
        hud.element('#fps').textContent = measured.frames.fps.toFixed(1)
        hud.element('#p95').textContent =
          `${measured.frames.p95Ms.toFixed(2)} ms`
        hud.element('[data-testid="draw-calls"]').textContent = String(
          measured.drawCalls,
        )
        hud.element('[data-testid="triangles"]').textContent = String(
          measured.triangles,
        )
        hud.element('[data-testid="transfer"]').textContent = (
          measured.initialTransferBytes / 1_000_000
        ).toFixed(3)
      }
    }
  }
  cameraLabels()
  hud.update(world)
  player.position.set(world.player.cell.x, 0, world.player.cell.z)
  // Prepare shaders and resolve the initial cache before starting the interactive clock.
  hallCache.render(dynamicScene)
  context.finish()
  startupMs = performance.now() - startupStarted
  previousTime = performance.now()
  frame = requestAnimationFrame(animate)
  return () => {
    disposed = true
    cancelAnimationFrame(frame)
    resize.disconnect()
    events.abort()
    hallCache.dispose()
    Reflect.deleteProperty(window, '__midcreek')
    const geometries = new Set<BufferGeometry>()
    const materials = new Set<Material>()
    const textures = new Set<Texture>()
    for (const ownedScene of [scene, dynamicScene])
      ownedScene.traverse((object) => {
        if (!(
          object instanceof Mesh ||
          object instanceof Line ||
          object instanceof LineSegments
        ))
          return
        if (object instanceof InstancedMesh) object.dispose()
        geometries.add(object.geometry)
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material]) {
          materials.add(material)
          for (const value of Object.values(material))
            if (value instanceof Texture) textures.add(value)
        }
      })
    geometries.forEach((geometry) => geometry.dispose())
    materials.forEach((material) => material.dispose())
    textures.forEach((texture) => texture.dispose())
    renderer.dispose()
  }
}
