# UI boundary

The HUD is DOM/CSS layered over the WebGL canvas. UI reads immutable world
snapshots and emits commands; it does not mutate Three.js objects or simulation
state directly.
