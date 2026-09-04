import './style.css'
import { startGame } from './app/game'

const root = document.querySelector<HTMLDivElement>('#app')!

try {
  const dispose = startGame(root)
  if (import.meta.hot) import.meta.hot.dispose(dispose)
  window.addEventListener(
    'pagehide',
    (event) => {
      if (!event.persisted) dispose()
    },
    { once: true },
  )
} catch (error) {
  console.error('Midcreek could not start', error)
  root.replaceChildren()
  const notice = document.createElement('main')
  notice.className = 'startup-error'
  const heading = document.createElement('h1')
  heading.textContent = 'This shift could not start.'
  const detail = document.createElement('p')
  detail.textContent = error instanceof Error ? error.message : String(error)
  const help = document.createElement('p')
  help.textContent =
    'Use a desktop browser with WebGL 2 and hardware acceleration. If the seed in the address is invalid, remove it and reload.'
  notice.append(heading, detail, help)
  root.append(notice)
}
