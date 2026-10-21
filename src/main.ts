import { Game, Scale, AUTO, type Types } from 'phaser'
import { initAudio } from './audio'
import { BattleScene } from './battle/BattleScene'
import { CARD_KEYS, CARDS } from './data'
import { debug, initDebugOverlays } from './debug'
import { calculateLogicalHeight, computeCanvasLayout, startDeviceScene } from './device'
import { GalleryScene } from './gallery'
import { exitApp, init as initPlatform, isNative, onBack, safeRect } from './platform'
import { defconOf } from './rules'
import { load as loadSave } from './save'
import { WAVES } from './stages'
import { startUiDemo } from './ui/demo'
import { bindBattle, handleBack, hud, shop } from './ui/screens'

export { calculateLogicalHeight, computeCanvasLayout }

const hasExplicitScene =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('scene')
const activeScene = !hasExplicitScene && isNative() ? 'device' : debug.scene

const height = calculateLogicalHeight()
const isUiDemo = activeScene === 'ui'
const isDevice = activeScene === 'device'
const isDomOnly = isUiDemo || isDevice
const isGallery = activeScene === 'gallery'
const scenes = isGallery ? [GalleryScene, BattleScene] : [BattleScene, GalleryScene]

const config: Types.Core.GameConfig = {
  type: AUTO,
  parent: 'game',
  width: 720,
  height,
  pixelArt: true,
  backgroundColor: '#0b0d12',
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
    width: 720,
    height,
  },
  scene: scenes,
}

export const game: Game | null =
  typeof window === 'undefined' || isDomOnly ? null : new Game(config)

export function syncGameScale(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  const rootStyle = document.documentElement.style
  const gameEl = document.getElementById('game')
  const canvas = game?.canvas ?? gameEl?.querySelector('canvas') ?? null

  if (canvas) {
    const rect = canvas.getBoundingClientRect()
    if (rect.width > 0) {
      const gameRect = gameEl ? gameEl.getBoundingClientRect() : null
      const areaRect =
        gameRect && gameRect.width > 0 && gameRect.height > 0
          ? gameRect
          : {
              left: 0,
              right: window.innerWidth,
              bottom: window.innerHeight,
              width: window.innerWidth,
              height: window.innerHeight,
            }
      const { scale, bottomGap, leftGap, rightGap } = computeCanvasLayout(rect, areaRect)
      rootStyle.setProperty('--game-scale', String(scale))
      rootStyle.setProperty('--canvas-bottom-gap', `${bottomGap}px`)
      rootStyle.setProperty('--canvas-left-gap', `${leftGap}px`)
      rootStyle.setProperty('--canvas-right-gap', `${rightGap}px`)
      return
    }
  }

  const safe = safeRect()
  const logicalH = calculateLogicalHeight(safe.width, safe.height)
  const scale =
    safe.width > 0 && safe.height > 0 ? Math.min(safe.width / 720, safe.height / logicalH) : 1
  rootStyle.setProperty('--game-scale', String(scale))
  rootStyle.setProperty('--canvas-bottom-gap', '0px')
  rootStyle.setProperty('--canvas-left-gap', '0px')
  rootStyle.setProperty('--canvas-right-gap', '0px')
}

if (game) {
  game.scale.on('resize', () => {
    syncGameScale()
  })
  game.events.once('ready', () => {
    syncGameScale()
  })
  // ponytail: M2 3단계(BattleScene의 직접 ui.hud/ui.shop 호출) 병합 전에도 ?scene=battle에서 DOM 상점·HUD 배치를 검증할 수 있게 폴백 연결
  let fallbackBound = false
  game.events.on('poststep', () => {
    const s = game.scene.getScene('battle') as (BattleScene & { store?: unknown }) | undefined
    if (!s || !s.scene.isActive() || 'store' in s) return
    if (!fallbackBound) {
      fallbackBound = true
      bindBattle({
        pause: () => s.scene.pause(),
        resume: () => s.scene.resume(),
        setSpeed: (spd) => s.setSpeed(spd),
        quit: () => {},
        adReroll: () => {},
        adSupply: () => {},
      })
    }
    hud({
      wave: s.wave,
      waves: WAVES.length,
      defcon: defconOf(s.wave),
      supply: s.supply,
      baseHp: s.baseHp,
      phase: s.phase,
      prepLeft: s.prepLeft,
      speed: s.speed,
      synergies: [],
    })
    const isPrep = s.phase === 'prep' && !s.result
    const shopEl = document.querySelector('#ui .ui-shop')
    const isClosed = !shopEl || shopEl.classList.contains('closed')
    if (isPrep && isClosed) {
      const offers = CARD_KEYS.map((card) => ({ card, cost: CARDS[card].cost }))
      shop(
        true,
        offers,
        s.supply,
        () => {},
        () => {},
        () => {
          if (s.phase === 'prep' && !s.result) s.startFight()
        }
      )
    } else if (!isPrep && shopEl && !isClosed) {
      shop(false, [], s.supply, () => {}, () => {}, () => {})
    }
  })
}

if (typeof window !== 'undefined') {
  syncGameScale()
  window.requestAnimationFrame(() => syncGameScale())
  window.addEventListener('resize', () => {
    game?.scale.refresh()
    syncGameScale()
  })

  if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    const obs = new MutationObserver(() => {
      game?.scale.refresh()
      syncGameScale()
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
  }

  if (typeof ResizeObserver !== 'undefined' && typeof document !== 'undefined') {
    const gameEl = document.getElementById('game')
    if (gameEl) {
      const ro = new ResizeObserver(() => {
        game?.scale.refresh()
        syncGameScale()
      })
      ro.observe(gameEl)
    }
  }
}

async function boot(): Promise<void> {
  await initPlatform()
  syncGameScale()
  const saved = await loadSave()
  initAudio(saved.settings)

  onBack(() => {
    handleBack(() => {
      void exitApp()
    })
  })

  if (isUiDemo) {
    startUiDemo()
  } else if (isDevice) {
    await startDeviceScene()
  }

  initDebugOverlays(
    {
      ...debug,
      scene: activeScene,
      safe: debug.safe || (isNative() && isDevice),
    },
    () => {
      if (!game) return 0
      const activeScenes = game.scene.getScenes(true)
      let count = 0
      for (const s of activeScenes) {
        count += s.children.length
      }
      return count
    }
  )
}

if (typeof window !== 'undefined') {
  void boot()
}
