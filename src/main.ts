import { Game, Scale, AUTO, type Types } from 'phaser'
import { BattleScene } from './battle/BattleScene'
import { GalleryScene } from './gallery'
import { debug, initDebugOverlays } from './debug'
import { startUiDemo } from './ui/demo'

function calculateLogicalHeight(): number {
  const targetWidth = 720
  if (typeof window === 'undefined') return 1280
  const aspect = window.innerHeight / window.innerWidth
  const calculated = Math.round(targetWidth * aspect)
  return Math.min(1560, Math.max(1280, calculated))
}

const height = calculateLogicalHeight()
const isUiDemo = debug.scene === 'ui'
const isGallery = debug.scene === 'gallery'
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

export const game: Game | null = isUiDemo ? null : new Game(config)

if (isUiDemo) {
  startUiDemo()
}

initDebugOverlays(debug, () => {
  if (!game) return 0
  const activeScenes = game.scene.getScenes(true)
  let count = 0
  for (const s of activeScenes) {
    count += s.children.length
  }
  return count
})
