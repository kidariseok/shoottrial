// docs/TECH.md §9 디버그 URL 파라미터 및 헬퍼

export interface DeckItem {
  card: string
  n: number
}

export interface DebugConfig {
  scene: string
  wave?: number
  unlock?: string
  supply?: number
  deck?: DeckItem[]
  god?: boolean
  seed: number
  speed?: 1 | 2
  fps?: boolean
  safe?: boolean
  uiStep?: string
}

export function parseDeck(val: string): DeckItem[] {
  if (!val.trim()) return []
  return val.split(',').map((part) => {
    const [card = '', countStr = '1'] = part.split(':')
    const n = parseInt(countStr, 10)
    return {
      card: card.trim(),
      n: Number.isNaN(n) ? 1 : n,
    }
  }).filter((item) => item.card.length > 0)
}

export function createRng(seed: number): () => number {
  let s = seed >>> 0
  return function rand(): number {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function parseDebugParams(search: string): DebugConfig {
  const params = new URLSearchParams(search)
  const scene = params.get('scene') ?? 'battle'
  const seedParam = params.get('seed')
  const seed = seedParam !== null ? parseInt(seedParam, 10) : Date.now()

  const waveParam = params.get('wave')
  const wave = waveParam !== null ? parseInt(waveParam, 10) : undefined

  const unlock = params.get('unlock') ?? undefined

  const supplyParam = params.get('supply')
  const supply = supplyParam !== null ? parseInt(supplyParam, 10) : undefined

  const deckParam = params.get('deck')
  const deck = deckParam !== null ? parseDeck(deckParam) : undefined

  const god = params.get('god') === '1'

  const speedParam = params.get('speed')
  let speed: 1 | 2 | undefined = undefined
  if (speedParam === '2') speed = 2
  else if (speedParam === '1') speed = 1

  const fps = params.get('fps') === '1'
  const safe = params.get('safe') === '1'
  const uiStep = params.get('uiStep') ?? undefined

  return {
    scene,
    wave,
    unlock,
    supply,
    deck,
    god,
    seed: Number.isNaN(seed) ? Date.now() : seed,
    speed,
    fps,
    safe,
    uiStep,
  }
}

// 브라우저 런타임용 현재 설정
export const debug: DebugConfig =
  typeof window !== 'undefined'
    ? parseDebugParams(window.location.search)
    : { scene: 'battle', seed: 0 }

export const rand = createRng(debug.seed)

export function initDebugOverlays(
  config: DebugConfig = debug,
  getActiveObjects?: () => number
): void {
  if (typeof document === 'undefined') return
  const ui = document.getElementById('ui')
  if (!ui) return

  if (config.safe) {
    const safeEl = document.createElement('div')
    safeEl.className = 'safe-area-overlay'
    ui.appendChild(safeEl)
  }

  if (config.fps) {
    const fpsEl = document.createElement('div')
    fpsEl.className = 'debug-fps'
    fpsEl.textContent = 'FPS: -- | OBJ: 0'
    ui.appendChild(fpsEl)

    let frames = 0
    let lastTime = performance.now()

    function updateFps(now: number) {
      frames++
      if (now - lastTime >= 500) {
        const fps = Math.round((frames * 1000) / (now - lastTime))
        const objCount = getActiveObjects ? getActiveObjects() : 0
        fpsEl.textContent = `FPS: ${fps}\nOBJ: ${objCount}`
        frames = 0
        lastTime = now
      }
      requestAnimationFrame(updateFps)
    }

    requestAnimationFrame(updateFps)
  }
}
