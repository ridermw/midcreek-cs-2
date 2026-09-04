# Hill-climb protocol

Each iteration should change one measurable dimension and preserve a reproducible
comparison against the previous best.

## Required evidence

1. Fixed seed and scenario.
2. Fixed camera heading, zoom, and viewport.
3. Before/after screenshots.
4. Frame-time, draw-call, triangle, and transfer-size measurements.
5. Automated tests for changed deterministic behavior.
6. A short verdict: promote, retain for another test, or reject.

## Initial quality bars

- 60 FPS target on the Windows development VM.
- No more than 250 draw calls in the first vertical slice.
- No more than 1,000,000 visible triangles.
- No more than 15 MB initial transfer.
- No camera drift from the measured Cel Shift projection.
- Fault and work states distinguishable by both shape and color.

The first playable milestone should prove navigation, readability, and one fault
interaction before adding content breadth.
