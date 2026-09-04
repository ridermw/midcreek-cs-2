import type { WorldSnapshot } from '../world/contracts'

export const wrench = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6 4 4 4-4a7 7 0 0 1-9 9l-7 7-4-4 7-7a7 7 0 0 1 9-9z" fill="currentColor"/></svg>`

export function createHud(root: HTMLElement, seed: number) {
  root.innerHTML = `
    <header class="topbar">
      <a class="brand" href="${import.meta.env.BASE_URL}" aria-label="Midcreek home">
        <span class="brand-mark"><i></i><i></i><i></i><i></i></span>
        <span>MIDCREEK<small>CEL SHIFT</small></span>
      </a>
      <div class="topbar-center"><span class="live-dot"></span> OPERATIONS <span class="separator">/</span> HALL 04</div>
      <button class="text-button" id="performance" aria-expanded="false" aria-controls="diagnostics">Performance</button>
      <span class="build-tag">FIRST PLAYABLE <span>${__BUILD_ID__}</span></span>
    </header>
    <main class="game-frame" aria-label="Midcreek operations">
      <div id="viewport">
        <canvas role="img" aria-label="Interactive data hall" tabindex="0"></canvas>
        <div id="world-labels">
          <button id="fault-marker" class="world-marker fault" aria-label="Dispatch to faulty rack"><span>!</span></button>
          <span id="player-marker" class="player-marker">YOU <span>01</span></span>
        </div>
      </div>
      <section class="mission panel">
        <p class="eyebrow">YOUR FIRST SHIFT <span>01 / 01</span></p>
        <h1>Keep the cool.</h1>
        <p class="muted">One hall. One technician.<br>Keep the coolant flowing.</p>
        <div class="mission-rule"></div>
        <ol class="objectives">
          <li data-step="1"><span class="step">1</span><span>Locate the fault<small>Red octagon on the floor</small></span></li>
          <li data-step="2"><span class="step">2</span><span>Send your technician<small>A safe route, automatically</small></span></li>
          <li data-step="3"><span class="step">3</span><span>Restore the loop<small>Repair from the service aisle</small></span></li>
        </ol>
        <div class="scenario-label">FIXED SCENARIO <strong>COOLANT LEAK</strong><span>SEED ${seed}</span></div>
      </section>
      <aside class="operations">
        <section class="telemetry panel">
          <div class="panel-heading"><h2>HALL HEALTH</h2><span id="hall-state">ATTENTION</span></div>
          <div class="metric"><span class="metric-icon power">ϟ</span><div><label>Power <strong>98%</strong></label><div class="meter"><i style="width:98%"></i></div></div></div>
          <div class="metric"><span class="metric-icon cooling">◈</span><div><label>Coolant flow <strong id="flow-value">76%</strong></label><div class="meter teal"><i id="flow-meter" style="width:76%"></i></div></div></div>
          <div class="metric"><span class="metric-icon load">▥</span><div><label>Rack availability <strong id="availability">31 / 32</strong></label><div class="meter green"><i id="availability-meter" style="width:97%"></i></div></div></div>
          <p class="telemetry-note">Scenario indicators · not live infrastructure</p>
        </section>
        <section class="ticket panel" aria-labelledby="ticket-heading">
          <div class="ticket-label"><span class="small-octagon">!</span><span id="ticket-label">ACTIVE INCIDENT</span><span class="ticket-number">#001</span></div>
          <h2 id="ticket-heading">Coolant pressure drop</h2>
          <p class="muted" id="fault-location"></p>
          <dl class="ticket-details"><div><dt>Priority</dt><dd id="priority">Service required</dd></div><div><dt>Technician</dt><dd data-testid="work-status" id="work-status">Ready</dd></div></dl>
          <div class="repair-progress" id="repair-progress" hidden><label>Replacing coupling <strong id="repair-percent">0%</strong></label><progress aria-label="Repair progress" id="repair-bar" max="1" value="0"></progress></div>
          <button class="primary-button" id="dispatch">${wrench} <span>Dispatch technician</span><span class="shortcut">F</span></button>
          <div class="completion" id="completion" hidden><h2>Hall restored</h2><p>Coupling secured. All 32 racks online.</p><button id="again" class="primary-button">Restart shift</button></div>
        </section>
        <section id="diagnostics" class="panel diagnostics" hidden>
          <h2>MEASURED / LAST 300 FRAMES</h2>
          <dl><div><dt>Mean FPS</dt><dd id="fps">Warming up</dd></div><div><dt>Frame p95</dt><dd id="p95">--</dd></div><div><dt>Draw calls</dt><dd data-testid="draw-calls">0</dd></div><div><dt>Triangles</dt><dd data-testid="triangles">0</dd></div><div><dt>Initial payload / MB</dt><dd data-testid="transfer">0</dd></div></dl>
          <p>60 FPS target · ≤250 calls · ≤1M tris · ≤15 MB</p>
        </section>
      </aside>
      <div class="scene-caption"><span class="live-dot"></span> HALL 04 <span>/ LIQUID COOLED</span></div>
      <div id="pause-banner" hidden>SHIFT PAUSED</div>
      <div class="view-controls panel" aria-label="Camera and shift controls">
        <span class="control-label">VIEW</span>
        <button id="orbit-left" title="Rotate counterclockwise (Q)" aria-label="Rotate counterclockwise">↶</button>
        <span data-testid="heading" id="heading">45°</span>
        <button id="orbit-right" title="Rotate clockwise (E)" aria-label="Rotate clockwise">↷</button>
        <span class="control-divider"></span>
        <button id="zoom-out" aria-label="Zoom out">−</button><span data-testid="zoom" id="zoom">100%</span><button id="zoom-in" aria-label="Zoom in">+</button>
        <button id="reset-view" aria-label="Reset view" title="Reset view (Home)">⌂</button>
        <span class="control-divider"></span><button id="pause" aria-label="Pause shift" title="Pause shift (Space)">Ⅱ</button>
        <button id="restart" aria-label="Restart scenario" title="Restart scenario">⟲</button>
      </div>
    </main>
    <footer class="bottom-bar">
      <div class="status-message" role="status" id="message">Select the fault to dispatch a technician.</div>
      <div class="legend"><span><i class="healthy-dot"></i>Online</span><span><i class="legend-fault">!</i>Fault</span><span><i class="legend-work">${wrench}</i>Working</span></div>
      <span class="help-text">CLICK FLOOR TO WALK <b>·</b> Q / E ORBIT <b>·</b> SCROLL ZOOM</span>
    </footer>`
  const element = <T extends HTMLElement = HTMLElement>(selector: string) => {
    const result = root.querySelector<T>(selector)
    if (!result) throw new Error(`Missing HUD element: ${selector}`)
    return result
  }
  let lastStatus = ''
  let lastMessage = ''
  function update(world: WorldSnapshot) {
    const resolved = world.fault.status === 'resolved'
    const working = world.fault.status === 'working'
    const walking = world.player.mode === 'walking'
    element('#fault-location').textContent =
      `RACK ${world.fault.rackId} / BACK SERVICE AISLE`
    const state = `${world.fault.status}:${world.player.mode}:${world.paused}`
    if (state !== lastStatus) {
      lastStatus = state
      element('#work-status').textContent = working
        ? 'Repairing'
        : walking
          ? 'En route'
          : 'Ready'
      const button = element<HTMLButtonElement>('#dispatch')
      button.disabled = world.paused || working || walking
      button.hidden = resolved
      element('#completion').hidden = !resolved
      element('#repair-progress').hidden = !working
      element('#pause-banner').hidden = !world.paused
      element('#pause').setAttribute(
        'aria-label',
        world.paused ? 'Resume shift' : 'Pause shift',
      )
      element('#pause').textContent = world.paused ? '▷' : 'Ⅱ'
      element('#hall-state').textContent = resolved
        ? 'ALL SYSTEMS GO'
        : working
          ? 'IN REPAIR'
          : 'ATTENTION'
      element('#hall-state').classList.toggle('restored', resolved)
      element('#ticket-label').textContent = resolved
        ? 'INCIDENT RESOLVED'
        : working
          ? 'REPAIR IN PROGRESS'
          : 'ACTIVE INCIDENT'
      element('#priority').textContent = resolved
        ? 'Resolved'
        : 'Service required'
      element('#flow-value').textContent = resolved ? '100%' : '76%'
      element('#flow-meter').style.width = resolved ? '100%' : '76%'
      element('#availability').textContent = resolved ? '32 / 32' : '31 / 32'
      element('#availability-meter').style.width = resolved ? '100%' : '97%'
      const marker = element<HTMLButtonElement>('#fault-marker')
      marker.className = `world-marker ${working ? 'working' : resolved ? 'resolved' : 'fault'}`
      marker.innerHTML = working
        ? wrench
        : `<span>${resolved ? '✓' : '!'}</span>`
      marker.setAttribute(
        'aria-label',
        resolved
          ? 'Repaired rack'
          : working
            ? 'Repair in progress'
            : 'Dispatch to faulty rack',
      )
      marker.disabled = working || resolved || world.paused
      root.querySelector('[data-step="1"]')?.classList.add('done')
      root
        .querySelector('[data-step="2"]')
        ?.classList.toggle('done', walking || working || resolved)
      root.querySelector('[data-step="3"]')?.classList.toggle('done', resolved)
    }
    element<HTMLProgressElement>('#repair-bar').value = world.fault.progress
    element('#repair-percent').textContent =
      `${Math.round(world.fault.progress * 100)}%`
    if (lastMessage !== world.message) {
      lastMessage = world.message
      element('#message').textContent = world.message
    }
  }
  return { element, update }
}
