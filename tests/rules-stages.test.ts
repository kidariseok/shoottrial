import { describe, it, expect } from 'vitest'
import { ENEMIES, ENEMY_KEYS, BOSS, DOG, BATTLE, GRID, ABILITY, SYN_FX, MINES, SYNERGY } from '../src/data'
import { STAGE1, WAVES } from '../src/stages'

describe('GDD 수치 고정', () => {
  it('§5.6 적 표', () => {
    const gdd = {
      infantry: { name: '보병', hp: 60, speed: 0.35, dmg: 10, interval: 1, baseDmg: 1, knock: 1, range: 0 },
      dog: { name: '군견', hp: 40, speed: 0.9, dmg: 6, interval: 0.5, baseDmg: 1, knock: 1.5, range: 0 },
      rpg: { name: 'RPG병', hp: 50, speed: 0.3, dmg: 35, interval: 3, baseDmg: 2, knock: 1, range: 3 },
      boss: { name: '장갑차', hp: 1200, speed: 0.15, dmg: 40, interval: 1, baseDmg: 5, knock: 0.25, range: 0 },
    }
    expect([...ENEMY_KEYS]).toEqual(['infantry', 'dog', 'rpg', 'boss'])
    for (const [k, v] of Object.entries(gdd)) {
      const e = ENEMIES[k as keyof typeof ENEMIES]
      expect({
        name: e.name,
        hp: e.hp,
        speed: e.speed,
        dmg: e.dmg,
        interval: e.interval,
        baseDmg: e.baseDmg,
        knock: e.knock,
        range: e.range,
      }).toEqual(v)
    }
  })
  it('적 색은 서로 다르고 붉은 계열이 아니다', () => {
    const colors = ENEMY_KEYS.map((k) => ENEMIES[k].color)
    expect(new Set(colors).size).toBe(4)
    for (const c of colors) {
      const r = (c >> 16) & 0xff
      const g = (c >> 8) & 0xff
      const b = c & 0xff
      expect(r - Math.max(g, b) > 32).toBe(false)
    }
  })
  it('적 크기(칸 대비 비율)', () => {
    expect(ENEMY_KEYS.map((k) => ENEMIES[k].size)).toEqual([0.55, 0.45, 0.55, 0.9])
  })
  it('보스 충격파·군견 열 변경', () => {
    expect(BOSS).toEqual({ shockStun: 1.5, shockY: 4 })
    expect(DOG).toEqual({ triggerGap: 0.5, laneMs: 250 })
  })
  it('§4 전투 흐름', () => {
    expect(BATTLE).toEqual({
      prepFirst: 30,
      prepNext: 20,
      settleSec: 1.5,
      baseHp: 20,
      defcon1From: 7,
      defcon1AllyInterval: 0.8,
      defcon1SpawnGap: 0.7,
      blockGap: 0.5,
      maxDt: 0.1,
      slideSpeed: 8,
    })
  })
  it('칸 단위 구역 y', () => {
    expect(GRID).toEqual({ mineTop: 2, deployTop: 4, lineY: 7 })
  })
  it('§5.3 능력', () => {
    expect(ABILITY).toEqual({
      corporal: 3,
      sergeant: 4,
      burstCount: 2,
      burstGap: 0.12,
      sergeantRifleInterval: 0.8,
      sniperFalloff: 0.2,
      sniperStun: 1,
      knockBase: 1,
      knockSergeant: 2,
      burnSec: 3,
      burnDps: 8,
      cookHeal: 12,
      cookBuff: 0.2,
      cookRevive: 0.5,
      cookReachSergeant: 2,
    })
  })
  it('§5.4 시너지 효과', () => {
    expect(SYN_FX).toEqual({
      rifleInterval: [1, 0.8, 0.6],
      sniperDamage: [1, 1.3],
      blowerKnock: [1, 1.5, 1.5],
      blowerRange: [0, 0, 1],
    })
    expect(SYN_FX.rifleInterval).toHaveLength(SYNERGY.rifle.length + 1)
    expect(SYN_FX.sniperDamage).toHaveLength(SYNERGY.sniper.length + 1)
    expect(SYN_FX.blowerKnock).toHaveLength(SYNERGY.blower.length + 1)
    expect(SYN_FX.blowerRange).toHaveLength(SYNERGY.blower.length + 1)
  })
  it('§5.5 지뢰', () => {
    expect(MINES).toEqual({
      tokensByRank: [1, 2, 3, 4],
      sergeantBonus: 2,
      synergyBonus: 1,
      damage: 150,
      bossMult: 3,
      blast: 1,
    })
  })
  it('§5.7 스테이지 1 출현', () => {
    expect(STAGE1).toEqual({ spawnGap: 1.2, convoySize: 5, convoyGap: 0.5 })
  })
  it('§5.7 웨이브 표 10행', () => {
    const w = (infantry: number, dog: number, rpg: number, boss = 0, convoys = 0, flag = false) => ({
      infantry,
      dog,
      rpg,
      boss,
      convoys,
      flag,
    })
    expect(WAVES).toEqual([
      w(6, 0, 0),
      w(8, 2, 0),
      w(8, 0, 2),
      w(10, 4, 0),
      w(10, 3, 2, 1, 0, true),
      w(12, 6, 3, 0, 1),
      w(14, 6, 4),
      w(16, 8, 4),
      w(18, 8, 6, 0, 2),
      w(20, 10, 6, 2, 0, true),
    ])
  })
})
