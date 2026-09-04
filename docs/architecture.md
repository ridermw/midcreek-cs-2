# Architecture

## Principle

Rendering, simulation, input, UI, assets, and diagnostics evolve independently.
The simulation produces immutable snapshots. Rendering and UI consume those
snapshots. Input produces commands. No presentation layer mutates simulation
state directly.

## Runtime flow

```text
browser input -> normalized commands -> fixed-step simulation
                                          |
                                          v
                                  immutable snapshot
                                     /         \
                                    v           v
                            Three.js scene    DOM/CSS HUD
                                    \           /
                                     v         v
                                  diagnostics
```

## Camera invariant

Cel Shift uses a classic two-to-one isometric view:

- Orthographic projection
- 35.264 degree elevation
- Ground axes at 45 degrees to the frame
- Four 90 degree orbit headings
- Zoom and orbit only; no free tilt or roll

These values are measured from approved concept art and are encoded in
`src/camera/isometricCamera.ts`.

## Ownership

- The engine owns GPU resources and disposes them explicitly.
- The world owns deterministic game state and advances on fixed ticks.
- The UI owns accessible text and controls outside the canvas.
- Diagnostics observe behavior but cannot alter it.
- Reference art never ships in the runtime bundle unless explicitly promoted
  through the asset pipeline.

## Static hall cache

`src/engine/hallCache.ts` owns a full-resolution, 4-sample color/depth render
target. The immutable hall is refreshed only when the camera matrices or drawing
buffer size change. Every visible animation frame restores the cached color and
depth, then draws the technician and route; rack occlusion is not bypassed.
Dynamic lights mirror the hall lighting. Simulation ticks and snapshots are
unchanged by caching.

The cache owns and disposes its render target (including the depth texture),
quad geometry, and material. The application owns both scene graphs and disposes
their remaining geometry/material/texture resources. Diagnostics report every
actual rendered frame, static-pass count, and both steady and peak GPU work.
