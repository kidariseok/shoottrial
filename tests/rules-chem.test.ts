import { describe, it, expect } from 'vitest'
import { CARD_KEYS, CARDS, SYNERGY, GAS, ENEMIES, UNLOCK, LAYOUT, ABILITY } from '../src/data'
import { WAVES, STAGE1 } from '../src/stages'
import {
  chemDamageMult,
  chemReach,
  cleanseCells,
  emptyGas,
  gasCellsAfterDrop,
  gasHits,
  gasPlan,
  inChemReach,
  interval,
  knockback,
  nextUnlock,
  spawnPlan,
  synergyTier,
  type Chem,
  type SpawnEvent,
} from '../src/rules'
import { createRng } from '../src/debug'

const count = (ev: SpawnEvent[], type: SpawnEvent['type']) => ev.filter((e) => e.type === type).length

describe('GDD 수치 고정 (4단계)', () => {
  it('§5.2 화학병은 카드 6번째', () => {
    expect(CARD_KEYS.slice(0, 6)).toEqual(['rifle', 'sniper', 'blower', 'cook', 'miner', 'chem'])
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
      hp: 160,
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
  it('§7 기존 해금 세 번째는 화학병', () => {
    expect(UNLOCK.order.slice(0, 3)).toEqual(['cook', 'miner', 'chem'])
  })
})

describe('nextUnlock (화학병)', () => {
  it('cook -> miner -> chem, 전체 해금이면 null', () => {
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
    expect([count(w9, 'infantry'), count(w9, 'dog'), count(w9, 'dogPlus'), count(w9, 'rpg'), count(w9, 'boss')]).toEqual([33, 4, 4, 8, 0])
    const w10 = spawnPlan(10, createRng(7), false)
    expect([count(w10, 'infantry'), count(w10, 'dog'), count(w10, 'dogPlus'), count(w10, 'rpg'), count(w10, 'boss')]).toEqual([26, 5, 5, 8, 2])
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

// 마지막 출현 시각 T
const lastT = (wave: number, defcon1: boolean) => spawnPlan(wave, createRng(42), defcon1).at(-1)!.t
const chem = (col: number, row: number, rank = 1): Chem => ({ col, row, rank })

describe('gasPlan', () => {
  it('gas 0이면 빈 목록', () => {
    expect(gasPlan(1, spawnPlan(1, createRng(42), false), createRng(45))).toEqual([])
  })
  it('웨이브 7: 1발, 35% 지점', () => {
    const g = gasPlan(7, spawnPlan(7, createRng(42), true), createRng(45))
    expect(g).toHaveLength(1)
    expect(g[0]!.t).toBeCloseTo(0.35 * lastT(7, true))
  })
  it('웨이브 10: 2발, 35%·70% 순', () => {
    const g = gasPlan(10, spawnPlan(10, createRng(42), true), createRng(45))
    expect(g).toHaveLength(2)
    expect(g[0]!.t).toBeCloseTo(0.35 * lastT(10, true))
    expect(g[1]!.t).toBeCloseTo(0.7 * lastT(10, true))
  })
  it('extra: 웨이브 1에 1발 더하면 35% 지점(1.4초)', () => {
    const g = gasPlan(1, spawnPlan(1, createRng(42), false), createRng(45), 1)
    expect(g).toHaveLength(1)
    expect(g[0]!.t).toBeCloseTo(1.4)
  })
  it('extra: 웨이브 10에 1발 더하면 3발, 시점은 회차 순환 후 정렬', () => {
    const T = lastT(10, true)
    const g = gasPlan(10, spawnPlan(10, createRng(42), true), createRng(45), 1)
    expect(g.map((d) => d.t)).toEqual([0.35 * T, 0.35 * T, 0.7 * T])
  })
  it('같은 rand 시드면 같은 결과', () => {
    const plan = spawnPlan(10, createRng(42), true)
    expect(gasPlan(10, plan, createRng(45))).toEqual(gasPlan(10, plan, createRng(45)))
  })
  it('col 0..3, row 0..1 정수 (시드 1..50, 웨이브 7·9·10)', () => {
    for (const w of [7, 9, 10]) {
      for (let seed = 1; seed <= 50; seed++) {
        for (const d of gasPlan(w, spawnPlan(w, createRng(seed), true), createRng(seed + 3))) {
          expect(Number.isInteger(d.col) && d.col >= 0 && d.col <= LAYOUT.cols - GAS.size).toBe(true)
          expect(Number.isInteger(d.row) && d.row >= 0 && d.row <= LAYOUT.deployRows - GAS.size).toBe(true)
        }
      }
    }
  })
  it('범위 밖 웨이브는 빈 목록', () => {
    const plan = spawnPlan(7, createRng(42), true)
    expect(gasPlan(0, plan, createRng(1))).toEqual([])
    expect(gasPlan(11, plan, createRng(1))).toEqual([])
  })
})

describe('chemReach · inChemReach · gasHits', () => {
  it('계급별 범위: 이등병·일병 1, 상병 이상 2', () => {
    expect([1, 2, 3, 4].map((rank) => chemReach(rank))).toEqual([1, 1, 2, 2])
  })
  it('이등병 범위는 인접 8칸과 자기 칸', () => {
    const c = [chem(2, 1)]
    for (const [col, row] of [[2, 1], [3, 2], [1, 0]] as const) expect(inChemReach(c, col, row)).toBe(true)
    for (const [col, row] of [[4, 1], [0, 1]] as const) expect(inChemReach(c, col, row)).toBe(false)
  })
  it('상병은 거리 2까지', () => {
    const c = [chem(2, 1, 3)]
    for (const [col, row] of [[4, 1], [0, 1], [4, 2]] as const) expect(inChemReach(c, col, row)).toBe(true)
    expect(inChemReach([chem(0, 0, 3)], 3, 0)).toBe(false)
  })
  it('화학병이 없으면(쓰러져 입력에서 빠짐) 면역도 없다', () => {
    expect(inChemReach([], 2, 1)).toBe(false)
  })
  it('gasHits: 가스가 있고 면역이 아닐 때만', () => {
    const cells = emptyGas()
    cells[1]![2] = 10
    expect(gasHits(cells, [], 2, 1)).toBe(true)
    expect(gasHits(cells, [], 3, 1)).toBe(false) // 가스 없는 칸
    expect(gasHits(cells, [chem(1, 1)], 2, 1)).toBe(false) // 면역
    expect(gasHits(cells, [chem(0, 0)], 2, 1)).toBe(true) // 범위 밖
  })
})

describe('interval 가스 감속', () => {
  it('gassed면 x slow, 기본값은 기존 결과', () => {
    expect(interval('rifle', 1, 1, false, true)).toBeCloseTo(1.6)
    expect(interval('rifle', 1, 1, true, true)).toBeCloseTo(1.28)
    expect(interval('chem', 1, 1, false)).toBe(1.0)
    expect(interval('chem', 1, 1, false, true)).toBe(2.0)
    expect(interval('rifle', 1, 1, false)).toBeCloseTo(0.8)
  })
})

describe('gasCellsAfterDrop', () => {
  const lit = (r: number[][]) => r.flat().filter((v) => v > 0).length
  it('화학병 없으면 2x2가 life로 채워진다', () => {
    const { cells, cleared } = gasCellsAfterDrop(emptyGas(), { col: 1, row: 0 }, [], false)
    expect(cleared).toBe(0)
    expect(lit(cells)).toBe(4)
    for (const [c, r] of [[1, 0], [2, 0], [1, 1], [2, 1]] as const) expect(cells[r]![c]).toBe(GAS.life)
  })
  it('겹쳐 떨어지면 더하지 않고 life로 갱신', () => {
    const base = emptyGas()
    base[0]![1] = 5
    const { cells } = gasCellsAfterDrop(base, { col: 1, row: 0 }, [], false)
    expect(cells[0]![1]).toBe(GAS.life)
  })
  it('입력 배열을 바꾸지 않는다', () => {
    const base = emptyGas()
    gasCellsAfterDrop(base, { col: 0, row: 0 }, [], false)
    expect(lit(base)).toBe(0)
  })
  it('시너지 2명이면 범위 안 칸은 즉시 제독', () => {
    const { cells, cleared } = gasCellsAfterDrop(emptyGas(), { col: 1, row: 0 }, [chem(0, 0)], true)
    expect(cleared).toBe(2)
    expect(cells[0]![1]).toBe(0)
    expect(cells[1]![1]).toBe(0)
    expect(cells[0]![2]).toBe(GAS.life)
    expect(cells[1]![2]).toBe(GAS.life)
  })
  it('시너지여도 범위 안 화학병이 없으면 시너지 꺼진 것과 같다', () => {
    const far = [chem(4, 2)]
    expect(gasCellsAfterDrop(emptyGas(), { col: 1, row: 0 }, far, true)).toEqual(gasCellsAfterDrop(emptyGas(), { col: 1, row: 0 }, far, false))
  })
  it('시너지가 꺼져 있으면 화학병이 옆에 있어도 4칸 모두 가스', () => {
    const { cells, cleared } = gasCellsAfterDrop(emptyGas(), { col: 1, row: 0 }, [chem(0, 0)], false)
    expect(cleared).toBe(0)
    expect(lit(cells)).toBe(4)
  })
})

describe('cleanseCells', () => {
  const mk = () => {
    const c = emptyGas()
    c[0]![0] = 10
    c[1]![1] = 10
    c[0]![2] = 10
    return c
  }
  it('이등병: 범위 1 안만 지우고 n은 실제로 지운 칸 수', () => {
    const r = cleanseCells(mk(), chem(0, 0))
    expect(r.n).toBe(2)
    expect(r.cells[0]![0]).toBe(0)
    expect(r.cells[1]![1]).toBe(0)
    expect(r.cells[0]![2]).toBe(10)
  })
  it('상병: 범위 2라 (2,0)도 지운다', () => {
    const r = cleanseCells(mk(), chem(0, 0, 3))
    expect(r.n).toBe(3)
    expect(r.cells[0]![2]).toBe(0)
  })
  it('가스가 없으면 n 0, 입력은 바뀌지 않는다', () => {
    expect(cleanseCells(emptyGas(), chem(1, 1)).n).toBe(0)
    const base = mk()
    cleanseCells(base, chem(0, 0))
    expect(base[0]![0]).toBe(10)
  })
})

describe('chemDamageMult', () => {
  const sgt = (col: number, row: number) => chem(col, row, ABILITY.sergeant)
  it('병장 옆 아군은 x sgtBuff', () => {
    expect(chemDamageMult([sgt(1, 1)], 2, 1)).toBeCloseTo(GAS.sgtBuff)
  })
  it('병장이 둘이어도 한 번만', () => {
    expect(chemDamageMult([sgt(1, 1), sgt(3, 1)], 2, 1)).toBeCloseTo(GAS.sgtBuff)
  })
  it('병장 자신은 받지 않는다', () => {
    expect(chemDamageMult([sgt(1, 1)], 1, 1)).toBe(1)
  })
  it('상병이거나 거리 2면 1', () => {
    expect(chemDamageMult([chem(1, 1, 3)], 2, 1)).toBe(1)
    expect(chemDamageMult([sgt(0, 0)], 2, 0)).toBe(1)
  })
})

describe('emptyGas', () => {
  it('3행x5열 0, 부를 때마다 새 배열', () => {
    const a = emptyGas()
    expect(a).toHaveLength(LAYOUT.deployRows)
    for (const row of a) expect(row).toEqual(Array(LAYOUT.cols).fill(0))
    a[0]![0] = 1
    expect(emptyGas()[0]![0]).toBe(0)
  })
})
