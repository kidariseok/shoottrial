import { describe, it, expect } from 'vitest'
import { ENEMIES, ENEMY_KEYS, BOSS, DOG, BATTLE, GRID, ABILITY, SYN_FX, MINES, SYNERGY } from '../src/data'
import { STAGE1, WAVES } from '../src/stages'
import { spawnPlan, type SpawnEvent } from '../src/rules'
import { createRng } from '../src/debug'

describe('GDD 수치 고정', () => {
  it('§5.6 적 표', () => {
    const gdd = {
      infantry: { name: '보병', hp: 120, speed: 0.35, dmg: 10, interval: 1, baseDmg: 1, knock: 1, range: 0 },
      dog: { name: '군견', hp: 80, speed: 0.9, dmg: 6, interval: 0.5, baseDmg: 1, knock: 1.5, range: 0 },
      rpg: { name: 'RPG병', hp: 100, speed: 0.3, dmg: 35, interval: 3, baseDmg: 2, knock: 1, range: 3 },
      boss: { name: '장갑차', hp: 2400, speed: 0.15, dmg: 40, interval: 1, baseDmg: 5, knock: 0.25, range: 0 },
      dogPlus: { name: '강화 군견', hp: 160, speed: 0.9, dmg: 6, interval: 0.5, baseDmg: 1, knock: 1.0, range: 0 },
    }
    expect([...ENEMY_KEYS]).toEqual(['infantry', 'dog', 'rpg', 'boss', 'dogPlus'])
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
    expect(new Set(colors).size).toBe(ENEMY_KEYS.length)
    for (const c of colors) {
      const r = (c >> 16) & 0xff
      const g = (c >> 8) & 0xff
      const b = c & 0xff
      expect(r - Math.max(g, b) > 32).toBe(false)
    }
  })
  it('적 크기(칸 대비 비율)', () => {
    expect(ENEMY_KEYS.map((k) => ENEMIES[k].size)).toEqual([0.55, 0.45, 0.55, 0.9, 0.45])
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
    expect(STAGE1).toEqual({ spawnGap: 0.8, convoySize: 5, convoyGap: 0.5 })
  })
  it('§5.7 웨이브 표 10행', () => {
    const w = (infantry: number, dog: number, rpg: number, boss = 0, convoys = 0, flag = false, dogPlus = 0, gas = 0) => ({
      infantry,
      dog,
      dogPlus,
      rpg,
      boss,
      convoys,
      gas,
      flag,
    })
    expect(WAVES).toEqual([
      w(6, 0, 0),
      w(8, 2, 0),
      w(8, 0, 2),
      w(10, 4, 0),
      w(13, 4, 3, 1, 0, true),
      w(16, 8, 4, 0, 1),
      w(18, 8, 5, 0, 0, false, 0, 1),
      w(21, 10, 6),
      w(23, 4, 8, 0, 2, false, 4, 1),
      w(26, 5, 8, 2, 0, true, 5, 2),
    ])
  })
})

// 유형별 개수 세기
const count = (ev: SpawnEvent[], type: SpawnEvent['type']) => ev.filter((e) => e.type === type).length

// 같은 열에서 0.5초 간격으로 이어지는 보병 묶음(5명)의 수
const convoyGroups = (ev: SpawnEvent[]) => {
  let groups = 0
  for (let i = 0; i + 4 < ev.length; i++) {
    const run = ev.slice(i, i + 5)
    const ok = run.every(
      (e, k) => e.type === 'infantry' && e.col === run[0]!.col && Math.abs(e.t - (run[0]!.t + k * 0.5)) < 1e-9,
    )
    if (ok) {
      groups++
      i += 4
    }
  }
  return groups
}

describe('spawnPlan', () => {
  it('범위 밖 웨이브는 빈 목록', () => {
    expect(spawnPlan(0, createRng(1), false)).toEqual([])
    expect(spawnPlan(11, createRng(1), false)).toEqual([])
  })
  it('웨이브 1: 보병 6, 0.8초 간격', () => {
    const ev = spawnPlan(1, createRng(42), false)
    expect(ev).toHaveLength(6)
    expect(ev.every((e) => e.type === 'infantry')).toBe(true)
    ev.forEach((e, i) => expect(e.t).toBeCloseTo(i * 0.8))
    expect(ev.map((e) => e.t.toFixed(1))).toEqual(['0.0', '0.8', '1.6', '2.4', '3.2', '4.0'])
  })
  it('웨이브 구성 개수(종대 보병 포함)', () => {
    const want: Record<number, [number, number, number, number]> = {
      1: [6, 0, 0, 0],
      5: [13, 4, 3, 1],
      6: [21, 8, 4, 0],
      9: [33, 4, 8, 0],
      10: [26, 5, 8, 2],
    }
    for (const [w, [inf, dog, rpg, boss]] of Object.entries(want)) {
      const ev = spawnPlan(Number(w), createRng(7), false)
      expect([count(ev, 'infantry'), count(ev, 'dog'), count(ev, 'rpg'), count(ev, 'boss')]).toEqual([inf, dog, rpg, boss])
    }
    for (let w = 1; w <= WAVES.length; w++) {
      const d = WAVES[w - 1]!
      const ev = spawnPlan(w, createRng(3), false)
      expect(ev).toHaveLength(d.infantry + d.convoys * STAGE1.convoySize + d.dog + d.dogPlus + d.rpg + d.boss)
    }
  })
  it('데프콘 1은 출현 간격 x0.7, 아니면 0.8', () => {
    const fast = spawnPlan(7, createRng(42), true)
    const slow = spawnPlan(7, createRng(42), false)
    expect(fast[1]!.t - fast[0]!.t).toBeCloseTo(0.56)
    expect(slow[1]!.t - slow[0]!.t).toBeCloseTo(0.8)
  })
  it('종대: 웨이브 6은 한 묶음, 웨이브 9는 두 묶음, 간격은 데프콘 1에서도 0.5', () => {
    expect(convoyGroups(spawnPlan(6, createRng(42), false))).toBe(1)
    expect(convoyGroups(spawnPlan(9, createRng(42), false))).toBe(2)
    expect(convoyGroups(spawnPlan(9, createRng(42), true))).toBe(2)
    expect(convoyGroups(spawnPlan(8, createRng(42), false))).toBe(0)
  })
  it('보스 위치: 웨이브 5는 인덱스 10, 웨이브 10은 14와 30', () => {
    const w5 = spawnPlan(5, createRng(42), false)
    expect(w5.findIndex((e) => e.type === 'boss')).toBe(10)
    const w10 = spawnPlan(10, createRng(42), false)
    const idx = w10.flatMap((e, i) => (e.type === 'boss' ? [i] : []))
    expect(idx).toEqual([14, 30])
  })
  it('같은 시드면 같은 목록, 다른 시드면 다른 목록', () => {
    expect(spawnPlan(5, createRng(42), false)).toEqual(spawnPlan(5, createRng(42), false))
    expect(spawnPlan(5, createRng(42), false)).not.toEqual(spawnPlan(5, createRng(43), false))
  })
  it('열은 0..4 정수, 시각은 비감소', () => {
    for (let w = 1; w <= WAVES.length; w++) {
      const ev = spawnPlan(w, createRng(w), w >= BATTLE.defcon1From)
      ev.forEach((e, i) => {
        expect(Number.isInteger(e.col) && e.col >= 0 && e.col <= 4).toBe(true)
        if (i > 0) expect(e.t).toBeGreaterThanOrEqual(ev[i - 1]!.t)
      })
    }
  })
})
