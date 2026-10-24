import { describe, it, expect } from 'vitest'
import { ASSET_CONTRACTS, CARDS } from '../src/assets'

describe('에셋 계약 표 (docs/ART.md §4)', () => {
  it('계약 표에 중복 키가 없다', () => {
    const keys = ASSET_CONTRACTS.map((c) => c.key)
    const set = new Set(keys)
    expect(set.size).toBe(keys.length)
  })

  it('아군 6종 카드(rifle, sniper, blower, cook, miner, chem)의 6개 키가 모두 존재한다', () => {
    const keys = new Set(ASSET_CONTRACTS.map((c) => c.key))
    for (const card of CARDS) {
      expect(keys.has(`ally_${card}_idle`)).toBe(true)
      expect(keys.has(`ally_${card}_attack`)).toBe(true)
      expect(keys.has(`ally_${card}_hit`)).toBe(true)
      expect(keys.has(`ally_${card}_down`)).toBe(true)
      expect(keys.has(`card_${card}`)).toBe(true)
      expect(keys.has(`icon_${card}`)).toBe(true)
    }
  })

  it('적 키 11종이 모두 존재한다', () => {
    const keys = new Set(ASSET_CONTRACTS.map((c) => c.key))
    const expectedEnemies = [
      'enemy_inf_walk',
      'enemy_inf_attack',
      'enemy_inf_down',
      'enemy_dog_run',
      'enemy_dog_bite',
      'enemy_dog_down',
      'enemy_rpg_walk',
      'enemy_rpg_fire',
      'enemy_rpg_down',
      'boss_apc_hull',
      'boss_apc_turret',
    ]
    for (const k of expectedEnemies) {
      expect(keys.has(k)).toBe(true)
    }
  })

  it('이펙트·판·UI 16종이 모두 존재한다', () => {
    const keys = new Set(ASSET_CONTRACTS.map((c) => c.key))
    const expectedOthers = [
      'fx_muzzle',
      'fx_wind',
      'fx_flame',
      'fx_explosion',
      'fx_heal',
      'fx_gas',
      'mine',
      'mine_at',
      'rank_1',
      'rank_2',
      'rank_3',
      'rank_4',
      'bg_gate',
      'tile_deploy',
      'tile_mine',
      'tile_hover',
    ]
    for (const k of expectedOthers) {
      expect(keys.has(k)).toBe(true)
    }
  })

  it('총 키 개수가 64개이고 모든 규격(w, h, frames)이 유효하다', () => {
    expect(ASSET_CONTRACTS.length).toBe(64)
    for (const item of ASSET_CONTRACTS) {
      expect(item.w).toBeGreaterThan(0)
      expect(item.h).toBeGreaterThan(0)
      expect(item.frames).toBeGreaterThan(0)
      expect(item.label.length).toBeGreaterThan(0)
    }
  })
})
