import { Game, Scale, AUTO, type Types } from 'phaser'
import { initAudio } from './audio'
import { BattleScene } from './battle/BattleScene'
import { debug, initDebugOverlays } from './debug'
import { startDeviceScene } from './device'
import { GalleryScene } from './gallery'
import { exitApp, init as initPlatform, isNative, onBack, safeRect } from './platform'
import { load as loadSave } from './save'
import { startUiDemo } from './ui/demo'
import { handleBack } from './ui/screens'

export function calculateLogicalHeight(areaWidth?: number, areaHeight?: number): number {
  const targetWidth = 720
  if (typeof areaWidth === 'number' && typeof areaHeight === 'number') {
    if (areaWidth <= 0 || areaHeight <= 0) return 1280
    const calculated = Math.round(targetWidth * (areaHeight / areaWidth))
    return Math.min(1560, Math.max(1280, calculated))
  }
  if (typeof window === 'undefined') return 1280
  const gameEl = typeof document !== 'undefined' ? document.getElementById('game') : null
  const gameRect = gameEl ? gameEl.getBoundingClientRect() : null
  const safe = safeRect()
  const w =
    gameRect && gameRect.width > 0
      ? gameRect.width
      : safe.width > 0
        ? safe.width
        : window.innerWidth
  const h =
    gameRect && gameRect.height > 0
      ? gameRect.height
      : safe.height > 0
        ? safe.height
        : window.innerHeight
  if (w <= 0 || h <= 0) return 1280
  const calculated = Math.round(targetWidth * (h / w))
  return Math.min(1560, Math.max(1280, calculated))
}

export function computeCanvasLayout(
  canvasRect: { left: number; right: number; bottom: number; width: number },
  areaRect: { left: number; right: number; bottom: number; width: number; height: number }
): { scale: number; bottomGap: number; leftGap: number; rightGap: number } {
  const scale = canvasRect.width > 0 ? canvasRect.width / 720 : 1
  const bottomGap = Math.max(0, areaRect.bottom - canvasRect.bottom)
  const leftGap = Math.max(0, canvasRect.left - areaRect.left)
  const rightGap = Math.max(0, areaRect.right - canvasRect.right)
  return { scale, bottomGap, leftGap, rightGap }
}

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
