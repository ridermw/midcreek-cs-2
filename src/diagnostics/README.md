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

`tests/e2e/evidence.spec.ts` captures reproducible screenshots and JSON using
real browser input. Frame-time targets are reported, not hard-coded as passing
in CI: software rendering and headless environments must be identified rather
than passed off as the development VM's GPU.
