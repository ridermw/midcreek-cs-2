# Midcreek: Cel Shift

A public Three.js/WebGL concept game for hill-climbing the **Cel Shift** art
direction from Midcreek's concept-art exploration.

A bright, procedural liquid-cooled data hall: navigate the aisles, dispatch a
technician to a coolant fault, and restore all 32 racks. The first playable
milestone keeps one reproducible scenario rather than adding content breadth.

**Play:** <https://ridermw.github.io/midcreek-cs-2/>

Click the floor to walk, or select **Dispatch technician** / the red fault badge
to route to the back service aisle. Work takes four simulation seconds after
arrival. A blue triangular wrench identifies active repair; a green check marks
completion. **Restart shift** reproduces the same seed.

## Stack

- Three.js and WebGL
- Vite and strict TypeScript
- Vitest for deterministic unit tests
- Playwright configuration for browser smoke and visual checks
- ESLint and Prettier
- GitHub Actions and GitHub Pages

## Commands

```powershell
npm install
npm run dev
npm test
npm run check
npm run test:e2e
```

Run `npx playwright install chromium` if the browser test runner reports a
missing browser. Browser checks use the production build: run `npm run build`
before `npm run test:e2e`.

The runtime requires WebGL 2. Desktop browsers are the primary target; narrow
screens retain the scene and accessible DOM controls in a stacked layout.

| Control                               | Action                         |
| ------------------------------------- | ------------------------------ |
| Click floor / WASD / arrow keys       | Move around solid rack rows    |
| F / fault badge / Dispatch technician | Find a route and repair        |
| Q / E                                 | Rotate by exactly 90 degrees   |
| Scroll / + / -                        | Bounded orthographic zoom      |
| Home / house button                   | Restore measured view          |
| Space / pause button                  | Pause or resume the simulation |
| Restart scenario / Restart shift      | Repeat the same seed           |

Keyboard controls apply while the canvas or page is focused, not while operating
a focused button. Camera controls remain usable while paused. Leaving the page
hidden suspends simulation time rather than fast-forwarding on return.

## Architecture

| Area                   | Responsibility                                      |
| ---------------------- | --------------------------------------------------- |
| `src/app`              | Startup and lifecycle composition                   |
| `src/engine`           | Renderer, scene, frame loop, and resource ownership |
| `src/world`            | Deterministic simulation and immutable snapshots    |
| `src/camera`           | Measured isometric camera and orbit/zoom policy     |
| `src/input`            | Browser input normalized into commands              |
| `src/ui`               | DOM/CSS HUD reading snapshots and emitting commands |
| `src/assets`           | Runtime-ready asset contracts and metadata          |
| `src/diagnostics`      | Performance, replay, and screenshot instrumentation |
| `references/cel-shift` | Public-safe visual targets, never runtime assets    |

See [`docs/architecture.md`](docs/architecture.md),
[`docs/art-direction.md`](docs/art-direction.md), and
[`docs/hill-climb.md`](docs/hill-climb.md).

## Status

First playable: a 30 Hz immutable simulation, deterministic
pathfinding and repair, constrained isometric camera, instanced procedural racks,
rear-only coolant drops, tiered cable trays, a PPE-clad technician, shape-coded
status, and an accessible DOM HUD. The health gauges are scenario indicators, not
live infrastructure telemetry.

**Performance** in the header shows measured frame timing, draw calls, triangles,
and initial payload. `window.__midcreek` exposes read-only snapshots, diagnostics,
and floor projection for repeatable browser evidence; it cannot issue commands.
Build IDs in the header identify the deployed source commit.

The execution record, comparison settings, measurements, and promotion verdict
live in [`docs/hill-climb.md`](docs/hill-climb.md). Reference renders are never
included in the runtime bundle.

**60 FPS checkpoint:** full-resolution color/depth caching now sustains 60.0 FPS
on the same SwiftShader development VM, including dispatch and active repair.
The static hall is cached with 4-sample antialiasing; the technician and route
are still rendered every frame with correct rack occlusion. Steady rendering
uses 15 calls / 442 triangles; cache-refresh peaks are 29 calls / 12,374
triangles. Initial payload is about 152 KB.

The first 300 frames, including startup/JIT cost, averaged 56.1 FPS. The explicit
sustained gate uses a fixed 12-second warm-up and saves both windows rather than
hiding startup costs. It also measures 300 frames during actual repair. See the
hillclimb record for the before/after comparison and rejected quality reductions.

### Reproduce the hillclimb

Open `?seed=417&scenario=coolant-leak&heading=0&zoom=1` at 1280 x 720,
device scale 1. `npm run test:e2e` records fixed-view screenshots and measured JSON
in the ignored `test-results` directory. To run those same acceptance tests
against the published build:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://ridermw.github.io/midcreek-cs-2/'
npm run test:e2e
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

## License

Code is available under the [MIT License](LICENSE). Curated concept images in
`references/cel-shift/` are governed by the
[reference asset terms](references/cel-shift/ASSET-LICENSE.md), not the MIT
License.
