import { describe, it, expect } from 'vitest'
import { CARD_KEYS, CARDS, SYNERGY, GAS, ENEMIES, UNLOCK } from '../src/data'
import { WAVES, STAGE1 } from '../src/stages'
import { knockback, nextUnlock, spawnPlan, synergyTier, type SpawnEvent } from '../src/rules'
import { createRng } from '../src/debug'

const count = (ev: SpawnEvent[], type: SpawnEvent['type']) => ev.filter((e) => e.type === type).length

describe('GDD 수치 고정 (4단계)', () => {
  it('§5.2 화학병은 카드 6번째', () => {
    expect([...CARD_KEYS]).toEqual(['rifle', 'sniper', 'blower', 'cook', 'miner', 'chem'])
    const c = CARDS.chem
    expect({ name: c.name, initial: c.initial, cost: c.cost, hp: c.hp, atk: c.atk, interval: c.interval, range: c.range }).toEqual({
      name: '화학병',
      initial: '화',
      cost: 2,
      hp: 90,
      atk: 6,
      interval: 1.0,
      range: 3,
    })
  })
  it('§5.4 화학병 시너지는 2명 단계뿐', () => {
    expect(SYNERGY.chem).toEqual([2])
    expect([1, 2, 4].map((n) => synergyTier('chem', n))).toEqual([0, 1, 1])
  })
  it('§5.6 가스 수치', () => {
    expect(GAS).toEqual({ warn: 1.5, life: 20, slow: 2, dps: 5, cleanse: 3, reach: [1, 2], sgtBuff: 1.15, at: [0.35, 0.7], size: 2 })
  })
  it('§5.6 강화 군견', () => {
    const e = ENEMIES.dogPlus
    expect({ name: e.name, hp: e.hp, speed: e.speed, dmg: e.dmg, interval: e.interval, baseDmg: e.baseDmg, knock: e.knock, range: e.range, size: e.size }).toEqual({
      name: '강화 군견',
      hp: 80,
      speed: 0.9,
      dmg: 6,
      interval: 0.5,
      baseDmg: 1,
      knock: 1.0,
      range: 0,
      size: 0.45,
    })
    expect(e.color).not.toBe(ENEMIES.dog.color)
    expect(knockback('dogPlus', 1, 1)).toBe(1.0)
  })
  it('§5.7 웨이브 표의 화학탄 횟수·강화 군견', () => {
    expect(WAVES.map((w) => w.gas)).toEqual([0, 0, 0, 0, 0, 0, 1, 0, 1, 2])
    expect(WAVES.map((w) => w.dogPlus)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 4, 5])
    expect(WAVES[8]!.dog + WAVES[8]!.dogPlus).toBe(8)
    expect(WAVES[9]!.dog + WAVES[9]!.dogPlus).toBe(10)
    expect(WAVES[8]!.dog).toBe(4)
    expect(WAVES[9]!.dog).toBe(5)
  })
  it('§7 해금 순서 끝에 화학병', () => {
    expect(UNLOCK.order).toEqual(['cook', 'miner', 'chem'])
  })
})

describe('nextUnlock (화학병)', () => {
  it('cook -> miner -> chem -> null', () => {
    const base = ['rifle', 'sniper', 'blower'] as const
    expect(nextUnlock([...base])).toBe('cook')
    expect(nextUnlock([...base, 'cook'])).toBe('miner')
    expect(nextUnlock([...base, 'cook', 'miner'])).toBe('chem')
    expect(nextUnlock([...CARD_KEYS])).toBeNull()
  })
})

describe('spawnPlan (강화 군견)', () => {
  it('웨이브 9·10 구성', () => {
    const w9 = spawnPlan(9, createRng(7), false)
    expect([count(w9, 'infantry'), count(w9, 'dog'), count(w9, 'dogPlus'), count(w9, 'rpg'), count(w9, 'boss')]).toEqual([28, 4, 4, 6, 0])
    const w10 = spawnPlan(10, createRng(7), false)
    expect([count(w10, 'infantry'), count(w10, 'dog'), count(w10, 'dogPlus'), count(w10, 'rpg'), count(w10, 'boss')]).toEqual([20, 5, 5, 6, 2])
  })
  it('길이 = 보병 + 종대 + 군견 + 강화 군견 + RPG + 보스', () => {
    for (let w = 1; w <= WAVES.length; w++) {
      const d = WAVES[w - 1]!
      expect(spawnPlan(w, createRng(5), false)).toHaveLength(d.infantry + d.convoys * STAGE1.convoySize + d.dog + d.dogPlus + d.rpg + d.boss)
    }
  })
  it('웨이브 1~8은 어떤 시드에서도 강화 군견이 없다', () => {
    for (let w = 1; w <= 8; w++) for (let seed = 1; seed <= 20; seed++) expect(count(spawnPlan(w, createRng(seed), false), 'dogPlus')).toBe(0)
  })
})
