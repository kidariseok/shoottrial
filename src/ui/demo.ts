import { debug } from '../debug'
import {
  askRevive,
  banner,
  bindBattle,
  cardInfo,
  hud,
  result,
  shop,
  type BattleCtl,
  type Hud,
  type Offer,
} from './screens'

const mockCtl: BattleCtl = {
  pause: () => console.log('[BattleCtl] pause()'),
  resume: () => console.log('[BattleCtl] resume()'),
  setSpeed: (s) => console.log('[BattleCtl] setSpeed(%d)', s),
  quit: () => console.log('[BattleCtl] quit()'),
  adReroll: () => console.log('[BattleCtl] adReroll()'),
  adSupply: () => console.log('[BattleCtl] adSupply()'),
  fireSupport: () => console.log('[BattleCtl] fireSupport()'),
}

let currentDemoHud: Hud = {
  wave: 3,
  waves: 10,
  defcon: 2,
  supply: 2,
  baseHp: 18,
  phase: 'prep',
  prepLeft: 19,
  speed: 1,
  synergies: [
    { card: 'rifle', count: 2, on: true },
    { card: 'blower', count: 1, on: false },
    { card: 'cook', count: 1, on: false },
  ],
  support: 2,
}

let demoTimer: ReturnType<typeof setInterval> | null = null

function applyDemoHud(next: Hud): void {
  currentDemoHud = next
  hud(next)
}

const DEMO_OFFERS: Offer[] = [
  { card: 'rifle', cost: 1 },
  { card: 'sniper', cost: 3 },
  { card: 'blower', cost: 2 },
  { card: 'cook', cost: 2 },
  { card: 'miner', cost: 2 },
]

function hideAllModals(): void {
  cardInfo(null)
  if (typeof document === 'undefined') return
  const modals = document.querySelectorAll('.ui-modal-backdrop')
  modals.forEach((el) => el.classList.add('hidden'))
}

function stopDemoCycle(): void {
  if (demoTimer !== null) {
    clearInterval(demoTimer)
    demoTimer = null
  }
}

function ensureDemoControls(): void {
  if (typeof document === 'undefined') return
  const uiRoot = document.getElementById('ui')
  if (!uiRoot || uiRoot.querySelector('.ui-demo-controls')) return

  const bar = document.createElement('div')
  bar.className = 'ui-demo-controls'

  const supportToggleBtn = document.createElement('button')
  supportToggleBtn.type = 'button'
  supportToggleBtn.className = 'mil-btn demo-support-toggle-btn'
  supportToggleBtn.textContent = '화력 지원 켜짐/꺼짐'
  supportToggleBtn.addEventListener('click', () => {
    stopDemoCycle()
    const isCurrentlyOn =
      currentDemoHud.phase === 'fight' && (currentDemoHud.support ?? 0) > 0
    if (isCurrentlyOn) {
      applyDemoHud({
        ...currentDemoHud,
        phase: 'fight',
        support: 0,
      })
    } else {
      applyDemoHud({
        ...currentDemoHud,
        phase: 'fight',
        prepLeft: 0,
        support: 2,
      })
    }
  })

  const defconBtn = document.createElement('button')
  defconBtn.type = 'button'
  defconBtn.className = 'mil-btn demo-defcon-banner-btn'
  defconBtn.textContent = '데프콘 1 배너'
  defconBtn.addEventListener('click', () => {
    stopDemoCycle()
    hideAllModals()
    applyDemoHud({
      ...currentDemoHud,
      wave: Math.max(7, currentDemoHud.wave),
      defcon: 1,
      phase: 'fight',
      prepLeft: 0,
      support: currentDemoHud.support ?? 2,
    })
    banner('데프콘 1 발령 — 전 장병 실탄 지급!', 'defcon')
  })

  bar.append(supportToggleBtn, defconBtn)
  uiRoot.appendChild(bar)
}

function runStep(stepName: string): void {
  hideAllModals()
  bindBattle(mockCtl)
  ensureDemoControls()

  switch (stepName) {
    case 'hud': {
      applyDemoHud({
        wave: 7,
        waves: 10,
        defcon: 1,
        supply: 5,
        baseHp: 18,
        phase: 'fight',
        prepLeft: 0,
        speed: 1,
        synergies: [
          { card: 'rifle', count: 2, on: true },
          { card: 'blower', count: 1, on: false },
          { card: 'cook', count: 1, on: false },
        ],
        support: 2,
      })
      shop(
        true,
        DEMO_OFFERS,
        5,
        (i) => console.log('[shop] onBuy(%d)', i),
        () => console.log('[shop] onReroll()'),
        () => console.log('[shop] onGo()')
      )
      banner('데프콘 1 발령 — 전 장병 실탄 지급!', 'defcon')
      break
    }

    case 'card': {
      applyDemoHud({
        wave: 7,
        waves: 10,
        defcon: 1,
        supply: 5,
        baseHp: 14,
        phase: 'fight',
        prepLeft: 0,
        speed: 2,
        synergies: [
          { card: 'rifle', count: 4, on: true },
          { card: 'blower', count: 2, on: true },
          { card: 'sniper', count: 1, on: false },
        ],
        support: 2,
      })
      shop(
        false,
        DEMO_OFFERS,
        5,
        (i) => console.log('[shop] onBuy(%d)', i),
        () => console.log('[shop] onReroll()'),
        () => console.log('[shop] onGo()')
      )
      cardInfo('rifle', 3)
      banner('데프콘 1 발령 — 전 장병 실탄 지급!', 'defcon')
      break
    }

    case 'pause': {
      applyDemoHud({
        wave: 5,
        waves: 10,
        defcon: 2,
        supply: 4,
        baseHp: 15,
        phase: 'fight',
        prepLeft: 0,
        speed: 1,
        synergies: [
          { card: 'rifle', count: 2, on: true },
          { card: 'sniper', count: 2, on: true },
        ],
        support: 1,
      })
      shop(
        false,
        DEMO_OFFERS,
        4,
        (i) => console.log('[shop] onBuy(%d)', i),
        () => console.log('[shop] onReroll()'),
        () => console.log('[shop] onGo()')
      )
      banner('경고: 대규모 적 접근!', 'flag')
      const pauseBtn = document.querySelector<HTMLButtonElement>('.hud-pause-btn')
      pauseBtn?.click()
      break
    }

    case 'revive': {
      applyDemoHud({
        wave: 8,
        waves: 10,
        defcon: 1,
        supply: 1,
        baseHp: 0,
        phase: 'fight',
        prepLeft: 0,
        speed: 1,
        synergies: [{ card: 'rifle', count: 2, on: true }],
        support: 0,
      })
      shop(
        false,
        DEMO_OFFERS,
        1,
        (i) => console.log('[shop] onBuy(%d)', i),
        () => console.log('[shop] onReroll()'),
        () => console.log('[shop] onGo()')
      )
      askRevive(
        () => console.log('[askRevive] onYes()'),
        () => console.log('[askRevive] onNo()')
      )
      break
    }

    case 'result': {
      applyDemoHud({
        wave: 10,
        waves: 10,
        defcon: 1,
        supply: 8,
        baseHp: 12,
        phase: 'settle',
        prepLeft: 0,
        speed: 1,
        synergies: [
          { card: 'rifle', count: 4, on: true },
          { card: 'cook', count: 2, on: true },
        ],
        support: 0,
      })
      shop(
        false,
        DEMO_OFFERS,
        8,
        (i) => console.log('[shop] onBuy(%d)', i),
        () => console.log('[shop] onReroll()'),
        () => console.log('[shop] onGo()')
      )
      result(
        { win: true, wave: 10, kills: 142, unlocked: 'miner' },
        () => console.log('[result] onAgain()'),
        () => console.log('[result] onLobby()')
      )
      break
    }
  }
}

export function startUiDemo(): void {
  if (typeof document !== 'undefined') {
    const gameEl = document.getElementById('game')
    if (gameEl) {
      const bg = document.createElement('div')
      bg.className = 'ui-demo-backdrop'
      gameEl.appendChild(bg)
    }
  }

  const steps = ['hud', 'card', 'pause', 'revive', 'result'] as const
  if (debug.uiStep && steps.includes(debug.uiStep as (typeof steps)[number])) {
    runStep(debug.uiStep)
    return
  }

  let idx = 0
  runStep(steps[idx]!)
  demoTimer = setInterval(() => {
    idx = (idx + 1) % steps.length
    runStep(steps[idx]!)
  }, 3000)
}
