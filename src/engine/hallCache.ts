import {
  AlwaysDepth,
  Camera,
  DepthTexture,
  Matrix4,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  UnsignedIntType,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'

export function createHallCache(
  renderer: WebGLRenderer,
  hall: Scene,
  camera: OrthographicCamera,
) {
  const size = new Vector2()
  renderer.getDrawingBufferSize(size)
  const target = new WebGLRenderTarget(size.x, size.y, {
    samples: 4,
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    depthTexture: new DepthTexture(size.x, size.y, UnsignedIntType),
  })
  const material = new ShaderMaterial({
    uniforms: {
      colorMap: { value: target.texture },
      depthMap: { value: target.depthTexture },
    },
    vertexShader: `
      varying vec2 screenUv;
      void main() {
        screenUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }`,
    fragmentShader: `
      uniform sampler2D colorMap;
      uniform sampler2D depthMap;
      varying vec2 screenUv;
      void main() {
        gl_FragColor = texture2D(colorMap, screenUv);
        gl_FragDepth = texture2D(depthMap, screenUv).r;
        #include <colorspace_fragment>
      }`,
    depthFunc: AlwaysDepth,
  })
  const quad = new Mesh(new PlaneGeometry(2, 2), material)
  quad.frustumCulled = false
  const copy = new Scene()
  copy.add(quad)
  const copyCamera = new Camera()
  const projection = new Matrix4()
  const view = new Matrix4()
  let staticPasses = 0
  let renderedFrames = 0
  let peakDrawCalls = 0
  let peakTriangles = 0
  renderer.autoClear = false
  renderer.info.autoReset = false

  function render(dynamic: Scene): void {
    renderer.info.reset()
    renderer.getDrawingBufferSize(size)
    const resized = target.width !== size.x || target.height !== size.y
    if (resized) target.setSize(size.x, size.y)
    if (
      resized ||
      staticPasses === 0 ||
      !projection.equals(camera.projectionMatrix) ||
      !view.equals(camera.matrixWorld)
    ) {
      projection.copy(camera.projectionMatrix)
      view.copy(camera.matrixWorld)
      renderer.setRenderTarget(target)
      renderer.clear()
      renderer.render(hall, camera)
      renderer.setRenderTarget(null)
      staticPasses++
    }
    // Restore both color and depth: technicians still disappear behind solid racks.
    renderer.clear()
    renderer.render(copy, copyCamera)
    renderer.render(dynamic, camera)
    renderedFrames++
    peakDrawCalls = Math.max(peakDrawCalls, renderer.info.render.calls)
    peakTriangles = Math.max(peakTriangles, renderer.info.render.triangles)
  }

  return {
    render,
    get staticPasses() {
      return staticPasses
    },
    get renderedFrames() {
      return renderedFrames
    },
    get peakDrawCalls() {
      return peakDrawCalls
    },
    get peakTriangles() {
      return peakTriangles
    },
    dispose() {
      target.dispose()
      quad.geometry.dispose()
      material.dispose()
    },
  }
}
