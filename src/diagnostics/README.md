# Diagnostics boundary

`metrics.ts` summarizes actual requestAnimationFrame intervals (including slow
frames), and counts navigation plus resource payloads. Transfer reporting uses
the greater of transferred bytes and encoded body bytes for each request, so a
warm cache does not make the initial payload appear free. Source maps and
reference renders are not loaded by gameplay.

`window.__midcreek` exposes immutable world snapshots, current camera/render
measurements, GPU identification, and floor-to-screen projection. It has no
command or state-mutation API. The visible Performance panel consumes the same
measurements. The timing window contains at most 300 visible frames and resets
when page visibility changes.

Caching does not turn the FPS display into a callback-only counter: each visible
callback renders the cached color/depth plus the current dynamic scene.
`renderedFrames`, `staticPasses`, `peakDrawCalls`, and `peakTriangles` expose
that distinction. `startupMs` reports the initial CPU/GPU preparation time.

`tests/e2e/evidence.spec.ts` captures reproducible screenshots and JSON using
real browser input. Frame-time targets are reported, not hard-coded as passing
in CI: software rendering and headless environments must be identified rather
than passed off as the development VM's GPU.

The opt-in performance test preserves `startup-window.json` (the first 300
frames), waits for a fixed 12 simulation seconds, and records the latest 300
frames in `measurements.json`. It applies the unchanged >=59 FPS / <=18 ms p95
gate to that sustained window and to a further 300 frames during a real repair
dispatch (`active-repair.json`). Before/after builds use the same warm-up.
