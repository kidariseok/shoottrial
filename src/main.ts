import { Game, Scale, Scene, AUTO, type Types } from 'phaser'
import { initAudio } from './audio'
import { BattleScene } from './battle/BattleScene'
import { debug, initDebugOverlays } from './debug'
import { calculateLogicalHeight, computeCanvasLayout, startDeviceScene } from './device'
import { GalleryScene } from './gallery'
import { exitApp, init as initPlatform, isNative, onBack, safeRect } from './platform'
import { load as loadSave } from './save'
import { startUiDemo } from './ui/demo'
import { bindDeploy, bindWalk, showLobby, showBriefing, startEntryFlow } from './ui/lobby'
import { handleBack } from './ui/screens'
import { WalkScene } from './ui/walk'
import { startWeb } from './web'

export { calculateLogicalHeight, computeCanvasLayout }

// T-105: 처음 전투 투입하기 전까지 BattleScene이 돌지 않도록 대기하는 빈 씬
class IdleScene extends Scene {
  constructor() {
    super('idle')
  }
}

const hasExplicitScene =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('scene')
const activeScene = hasExplicitScene ? debug.scene : 'lobby'

const height = calculateLogicalHeight()
const isWalk = activeScene === 'walk' // T-109: 첫 실행·브리핑을 건너뛰고 걷는 생활관을 바로 연다
const isLobby = activeScene === 'lobby' || isWalk
const isUiDemo = activeScene === 'ui'
const isDevice = activeScene === 'device'
const isDomOnly = isUiDemo || isDevice
const isGallery = activeScene === 'gallery'
const scenes = isGallery
  ? [GalleryScene, BattleScene]
  : isLobby
    ? [IdleScene, WalkScene, BattleScene, GalleryScene]
    : [BattleScene, WalkScene, GalleryScene]

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

  const rotatedScenes = new Set<string>()
  // 가로 안내가 가리는 동안에만 정지한다. 기존 일시정지/특기 선택 상태는 풀지 않는다.
  await startWeb((blocked) => {
    if (!game) return
    if (blocked) {
      for (const scene of game.scene.getScenes(true)) {
        const key = scene.sys.settings.key
        if (key === 'idle') continue
        rotatedScenes.add(key)
        game.scene.pause(key)
      }
    } else {
      for (const key of rotatedScenes) {
        if (game.scene.isPaused(key)) game.scene.resume(key)
      }
      rotatedScenes.clear()
    }
  })

  onBack(() => {
    handleBack(() => {
      void exitApp()
    })
  })

  bindDeploy(() => {
    if (!game) return
    game.scene.stop('idle')
    game.scene.stop('walk')
    game.scene.start('battle')
  })

  // 생활관(걷는 화면)으로: 전투가 돌고 있으면 멈추고 걷는 씬을 시작한다(결과 화면 "생활관"도 이 길로 온다)
  bindWalk(() => {
    if (!game) return
    game.scene.stop('idle')
    game.scene.stop('battle')
    if (!game.scene.isActive('walk')) game.scene.start('walk')
  })

  if (isWalk) {
    await showLobby()
  } else if (isLobby) {
    const brief = new URLSearchParams(location.search).get('brief')
    if (brief && /^[1-4]$/.test(brief)) await showBriefing(Number(brief) - 1)
    else await startEntryFlow(saved)
  } else if (isUiDemo) {
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
