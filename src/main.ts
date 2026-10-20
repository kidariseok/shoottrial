import { Game, Scale, AUTO, type Types } from 'phaser'
import { initAudio } from './audio'
import { BattleScene } from './battle/BattleScene'
import { debug, initDebugOverlays } from './debug'
import { startDeviceScene } from './device'
import { GalleryScene } from './gallery'
import { exitApp, init as initPlatform, isNative, onBack } from './platform'
import { load as loadSave } from './save'
import { startUiDemo } from './ui/demo'
import { handleBack } from './ui/screens'

function calculateLogicalHeight(): number {
  const targetWidth = 720
  if (typeof window === 'undefined') return 1280
  const aspect = window.innerHeight / window.innerWidth
  const calculated = Math.round(targetWidth * aspect)
  return Math.min(1560, Math.max(1280, calculated))
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

export const game: Game | null = isDomOnly ? null : new Game(config)

async function boot(): Promise<void> {
  await initPlatform()
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

void boot()
