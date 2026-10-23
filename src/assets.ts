// docs/ART.md §4 에셋 계약 표 및 런타임 플레이스홀더 생성기
import type { Scene } from 'phaser'

export interface AssetContract {
  key: string
  w: number
  h: number
  frames: number
  color: string
  label: string
}

export const CARDS = ['rifle', 'sniper', 'blower', 'cook', 'miner', 'chem'] as const

function makeAllyContracts(): AssetContract[] {
  const contracts: AssetContract[] = []
  for (const c of CARDS) {
    contracts.push(
      { key: `ally_${c}_idle`, w: 128, h: 128, frames: 1, color: '#4b5320', label: `ally_${c}_idle` },
      { key: `ally_${c}_attack`, w: 128, h: 128, frames: 2, color: '#606b29', label: `ally_${c}_attack` },
      { key: `ally_${c}_hit`, w: 128, h: 128, frames: 1, color: '#e0e0e0', label: `ally_${c}_hit` },
      { key: `ally_${c}_down`, w: 128, h: 128, frames: 1, color: '#707070', label: `ally_${c}_down` },
      { key: `card_${c}`, w: 256, h: 320, frames: 1, color: '#2b3e50', label: `card_${c}` },
      { key: `icon_${c}`, w: 64, h: 64, frames: 1, color: '#3a536b', label: `icon_${c}` },
    )
  }
  return contracts
}

const ENEMY_CONTRACTS: AssetContract[] = [
  { key: 'enemy_inf_walk', w: 128, h: 128, frames: 2, color: '#8b0000', label: 'enemy_inf_walk' },
  { key: 'enemy_inf_attack', w: 128, h: 128, frames: 2, color: '#a52a2a', label: 'enemy_inf_attack' },
  { key: 'enemy_inf_down', w: 128, h: 128, frames: 1, color: '#696969', label: 'enemy_inf_down' },
  { key: 'enemy_dog_run', w: 128, h: 128, frames: 2, color: '#8b4513', label: 'enemy_dog_run' },
  { key: 'enemy_dog_bite', w: 128, h: 128, frames: 2, color: '#a0522d', label: 'enemy_dog_bite' },
  { key: 'enemy_dog_down', w: 128, h: 128, frames: 1, color: '#696969', label: 'enemy_dog_down' },
  { key: 'enemy_rpg_walk', w: 128, h: 128, frames: 2, color: '#b22222', label: 'enemy_rpg_walk' },
  { key: 'enemy_rpg_fire', w: 128, h: 128, frames: 2, color: '#cd5c5c', label: 'enemy_rpg_fire' },
  { key: 'enemy_rpg_down', w: 128, h: 128, frames: 1, color: '#696969', label: 'enemy_rpg_down' },
  { key: 'boss_apc_hull', w: 256, h: 256, frames: 1, color: '#4a5d4e', label: 'boss_apc_hull' },
  { key: 'boss_apc_turret', w: 128, h: 128, frames: 1, color: '#3b493e', label: 'boss_apc_turret' },
]

const FX_AND_BOARD_CONTRACTS: AssetContract[] = [
  { key: 'fx_muzzle', w: 32, h: 32, frames: 2, color: '#ffd700', label: 'fx_muzzle' },
  { key: 'fx_wind', w: 128, h: 256, frames: 4, color: '#87ceeb', label: 'fx_wind' },
  { key: 'fx_flame', w: 128, h: 256, frames: 4, color: '#ff4500', label: 'fx_flame' },
  { key: 'fx_explosion', w: 256, h: 256, frames: 6, color: '#ff6347', label: 'fx_explosion' },
  { key: 'fx_heal', w: 128, h: 128, frames: 4, color: '#32cd32', label: 'fx_heal' },
  { key: 'fx_gas', w: 256, h: 256, frames: 4, color: '#7cfc00', label: 'fx_gas' },
  { key: 'mine', w: 64, h: 64, frames: 1, color: '#4682b4', label: 'mine' },
  { key: 'mine_at', w: 64, h: 64, frames: 1, color: '#b0c4de', label: 'mine_at' },
  { key: 'rank_1', w: 48, h: 48, frames: 1, color: '#a0a0a0', label: 'rank_1' },
  { key: 'rank_2', w: 48, h: 48, frames: 1, color: '#b8b8b8', label: 'rank_2' },
  { key: 'rank_3', w: 48, h: 48, frames: 1, color: '#d0d0d0', label: 'rank_3' },
  { key: 'rank_4', w: 48, h: 48, frames: 1, color: '#ffd700', label: 'rank_4' },
  { key: 'bg_gate', w: 720, h: 1560, frames: 1, color: '#1e252b', label: 'bg_gate' },
  { key: 'bg_barracks', w: 720, h: 1280, frames: 1, color: '#2a2f26', label: 'bg_barracks' },
  { key: 'tile_deploy', w: 128, h: 128, frames: 1, color: '#2e3b2e', label: 'tile_deploy' },
  { key: 'tile_mine', w: 128, h: 128, frames: 1, color: '#3b2e2e', label: 'tile_mine' },
  { key: 'tile_hover', w: 128, h: 128, frames: 1, color: '#3e4e5e', label: 'tile_hover' },
]

export const ASSET_CONTRACTS: AssetContract[] = [
  ...makeAllyContracts(),
  ...ENEMY_CONTRACTS,
  ...FX_AND_BOARD_CONTRACTS,
]

export const invalidTextures = new Set<string>()

export function createPlaceholderTexture(scene: Scene, contract: AssetContract): void {
  if (scene.textures.exists(contract.key)) {
    return
  }

  const canvas = document.createElement('canvas')
  const totalW = contract.w * contract.frames
  canvas.width = totalW
  canvas.height = contract.h

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = contract.color
  ctx.fillRect(0, 0, totalW, contract.h)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.lineWidth = 1

  const fontSize = Math.max(9, Math.min(13, Math.floor(contract.h / 7)))
  ctx.font = `${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let f = 0; f < contract.frames; f++) {
    const fx = f * contract.w
    ctx.strokeRect(fx + 0.5, 0.5, contract.w - 1, contract.h - 1)

    ctx.fillStyle = '#ffffff'
    const midY = contract.frames > 1 ? contract.h / 2 - 8 : contract.h / 2
    ctx.fillText(contract.label, fx + contract.w / 2, midY)

    if (contract.frames > 1) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.fillText(`(${f + 1}/${contract.frames})`, fx + contract.w / 2, contract.h / 2 + 10)
    }
  }

  const tex = scene.textures.addCanvas(contract.key, canvas)
  if (tex) {
    for (let f = 0; f < contract.frames; f++) {
      tex.add(f, 0, f * contract.w, 0, contract.w, contract.h)
    }
  }
}

export async function fetchAvailableAssets(): Promise<string[]> {
  try {
    const res = await fetch('/assets/index.json')
    if (!res.ok) return []
    const json = await res.json()
    if (Array.isArray(json)) return json
    return []
  } catch {
    return []
  }
}

export function validateLoadedTexture(scene: Scene, contract: AssetContract): boolean {
  const tex = scene.textures.get(contract.key)
  if (!tex) return false
  const src = tex.getSourceImage()
  if (!src) return false

  const w = src.width
  const h = src.height

  let valid = true
  if (h !== contract.h) {
    console.warn(`[Assets] ${contract.key} height mismatch: expected ${contract.h}, got ${h}`)
    valid = false
  }
  if (w % contract.w !== 0 || w < contract.w * contract.frames) {
    console.warn(`[Assets] ${contract.key} width mismatch: expected multiple of ${contract.w} (min ${contract.w * contract.frames}), got ${w}`)
    valid = false
  }

  if (!valid) {
    invalidTextures.add(contract.key)
  }
  return valid
}

export async function loadOrGenerateAssets(scene: Scene): Promise<void> {
  const available = await fetchAvailableAssets()
  const availableSet = new Set(available)

  const toLoad: AssetContract[] = []
  for (const contract of ASSET_CONTRACTS) {
    if (availableSet.has(contract.key)) {
      toLoad.push(contract)
    } else {
      createPlaceholderTexture(scene, contract)
    }
  }

  if (toLoad.length > 0) {
    for (const item of toLoad) {
      scene.load.image(item.key, `/assets/${item.key}.png`)
    }

    await new Promise<void>((resolve) => {
      scene.load.once('complete', () => {
        for (const item of toLoad) {
          validateLoadedTexture(scene, item)
        }
        resolve()
      })
      scene.load.start()
    })
  }
}
