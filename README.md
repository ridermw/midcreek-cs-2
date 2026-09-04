# Midcreek: Cel Shift

A public Three.js/WebGL concept game for hill-climbing the **Cel Shift** art
direction from Midcreek's concept-art exploration.

This initial commit is intentionally a foundation, not a playable build. It
establishes the architecture, measured camera contract, deterministic utilities,
quality gates, public-safe visual references, and GitHub Pages deployment path
without implementing gameplay.

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
```

The repository targets current desktop Chrome, Edge, Firefox, and Safari. The
first game milestone will be a deterministic data-hall vertical slice with an
orthographic isometric camera and a DOM/CSS HUD.

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

Foundation scaffold only. No gameplay has been implemented.

## License

Code is available under the [MIT License](LICENSE). Curated concept images in
`references/cel-shift/` are governed by the
[reference asset terms](references/cel-shift/ASSET-LICENSE.md), not the MIT
License.
