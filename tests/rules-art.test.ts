import { describe, it, expect } from 'vitest'
import { ART, CARD_KEYS } from '../src/data'
import { artKey, artLoops, frameCount, clipFps, walkFps, motionEnabled, motionPhase } from '../src/rules'

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
  it('아군 10종 x idle/attack', () => {
    expect(CARD_KEYS.length).toBe(10)
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


describe('T-111 모션 시간·시드', () => {
  it('공격 클립은 빠른 간격과 느린 간격 모두 55% 안에 끝난다', () => {
    for (const frames of [1, 3, 6]) for (const interval of [0.15, 0.5, 0.8, 2.5, 4]) {
      const seconds = interval * ART.fps.attackShare
      expect(frames / clipFps(frames, seconds)).toBeCloseTo(seconds)
      expect(seconds + Math.min(ART.motion.anticipateSec, seconds * ART.motion.recoilShare)).toBeLessThan(interval)
    }
  })
  it('0초 입력도 유한한 속도이고 걷기는 실제 이동 속도에 비례한다', () => {
    expect(Number.isFinite(clipFps(6, 0))).toBe(true)
    expect(walkFps(0.9)).toBeCloseTo(walkFps(0.3) * 3)
    expect(walkFps(0)).toBe(ART.fps.minWalk)
  })
  it('motion=0만 새 모션을 끈다', () => {
    expect(motionEnabled('0')).toBe(false)
    for (const value of [null, '', '1']) expect(motionEnabled(value)).toBe(true)
  })
  it('동일 시드는 재현되며 카드 간 위상이 다르고 난수 호출이 없다', () => {
    const phases = Array.from({ length: 10 }, (_, i) => motionPhase(7, i))
    expect(new Set(phases).size).toBe(10)
    expect(phases).toEqual(Array.from({ length: 10 }, (_, i) => motionPhase(7, i)))
    expect(phases.every((p) => p >= 0 && p < 1)).toBe(true)
    expect(motionPhase(42, 0)).not.toBe(phases[0])
  })
  it('피격·쓰러짐・진급 키는 반복하지 않는다', () => {
    expect(artKey('enemy', 'dogPlus', 'hit')).toBe('enemy_dog_hit')
    expect(artKey('enemy', 'rpg', 'down')).toBe('enemy_rpg_down')
    expect(artKey('ally', 'rifle', 'promote')).toBe('ally_rifle_promote')
    for (const key of ['enemy_inf_hit', 'enemy_dog_down', 'ally_rifle_promote']) expect(artLoops(key)).toBe(false)
  })
})
