import { describe, it, expect } from 'vitest'
import { ART, CARD_KEYS } from '../src/data'
import { artKey, artLoops, frameCount } from '../src/rules'

describe('frameCount: 이미지 너비 / 계약 너비', () => {
  it('배수면 프레임 수', () => {
    expect(frameCount(256, 128)).toBe(2)
    expect(frameCount(384, 128)).toBe(3)
    expect(frameCount(128, 128)).toBe(1)
  })
  it('배수가 아니면 0', () => {
    expect(frameCount(300, 128)).toBe(0)
  })
  it('너비 0·계약 0·음수는 0', () => {
    expect(frameCount(0, 128)).toBe(0)
    expect(frameCount(128, 0)).toBe(0)
    expect(frameCount(-128, 128)).toBe(0)
  })
})

describe('artKey: 키 이름 표(docs/ART.md §4)', () => {
  it('아군 6종 x idle/attack', () => {
    expect(CARD_KEYS.length).toBe(6)
    for (const c of CARD_KEYS) {
      expect(artKey('ally', c, 'idle')).toBe(`ally_${c}_idle`)
      expect(artKey('ally', c, 'attack')).toBe(`ally_${c}_attack`)
    }
  })
  it('적 4종: 걷기(달리기)와 공격. 강화 군견은 군견 그림', () => {
    expect(artKey('enemy', 'infantry', 'move')).toBe('enemy_inf_walk')
    expect(artKey('enemy', 'infantry', 'act')).toBe('enemy_inf_attack')
    expect(artKey('enemy', 'dog', 'move')).toBe('enemy_dog_run')
    expect(artKey('enemy', 'dog', 'act')).toBe('enemy_dog_bite')
    expect(artKey('enemy', 'dogPlus', 'move')).toBe('enemy_dog_run')
    expect(artKey('enemy', 'dogPlus', 'act')).toBe('enemy_dog_bite')
    expect(artKey('enemy', 'rpg', 'move')).toBe('enemy_rpg_walk')
    expect(artKey('enemy', 'rpg', 'act')).toBe('enemy_rpg_fire')
  })
  it('보스 2종', () => {
    expect(artKey('boss', 'apc', 'hull')).toBe('boss_apc_hull')
    expect(artKey('boss', 'apc', 'turret')).toBe('boss_apc_turret')
  })
})

describe('artLoops: 반복하는 애니메이션 키', () => {
  it('대기·걷기·달리기·가스는 반복', () => {
    for (const k of ['ally_rifle_idle', 'enemy_inf_walk', 'enemy_rpg_walk', 'enemy_dog_run', 'fx_gas']) expect(artLoops(k)).toBe(true)
  })
  it('공격·물기·발사·이펙트는 1회', () => {
    for (const k of ['ally_rifle_attack', 'enemy_dog_bite', 'enemy_rpg_fire', 'enemy_inf_attack', 'fx_muzzle', 'fx_explosion', 'fx_heal', 'fx_wind']) expect(artLoops(k)).toBe(false)
  })
})

describe('ART 수치', () => {
  it('fps·피격 시간·그림자는 양수', () => {
    expect(ART.fps.loop).toBeGreaterThan(0)
    expect(ART.fps.once).toBeGreaterThan(0)
    expect(ART.hitMs).toBeGreaterThan(0)
    expect(ART.shadow.w).toBeGreaterThan(0)
    expect(ART.shadow.h).toBeGreaterThan(0)
    expect(ART.shadow.alpha).toBeGreaterThan(0)
    expect(ART.shadow.alpha).toBeLessThanOrEqual(1)
  })
  it('쓰러짐 각도·발 피벗', () => {
    expect(ART.fallAngle).not.toBe(0)
    expect(ART.foot).toBeCloseTo(116 / 128)
  })
})
