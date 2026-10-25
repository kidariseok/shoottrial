import { describe, it, expect } from 'vitest'
import {
  merge,
  stats,
  synergyTier,
  synergies,
  income,
  waveHp,
  rollShop,
  sellValue,
  nearestEmpty,
  dropOutcome,
  type Unit,
} from '../src/rules'
import { CARDS, RANKS, SYNERGY, ECONOMY, ROOKIE } from '../src/data'
import { createRng } from '../src/debug'

const u = (card: Unit['card'], rank: number): Unit => ({ card, rank })

describe('merge', () => {
  it('같은 카드·같은 계급이면 한 계급 오른다', () => {
    expect(merge(u('rifle', 1), u('rifle', 1))).toBe(2)
    expect(merge(u('rifle', 2), u('rifle', 2))).toBe(3)
    expect(merge(u('rifle', 3), u('rifle', 3))).toBe(4)
  })
  it('병장끼리는 합성하지 않는다', () => {
    expect(merge(u('rifle', 4), u('rifle', 4))).toBeNull()
  })
  it('계급이 다르면 합성하지 않는다', () => {
    expect(merge(u('rifle', 1), u('rifle', 2))).toBeNull()
  })
  it('카드가 다르면 합성하지 않는다', () => {
    expect(merge(u('rifle', 1), u('sniper', 1))).toBeNull()
  })
})

describe('stats', () => {
  it('소총수 계급별 HP·공격이 x1.5씩 오른다', () => {
    expect(stats('rifle', 1)).toEqual({ hp: 100, atk: 10 })
    expect(stats('rifle', 2)).toEqual({ hp: 150, atk: 15 })
    expect(stats('rifle', 3).hp).toBeCloseTo(225)
    expect(stats('rifle', 3).atk).toBeCloseTo(22.5)
    expect(stats('rifle', 4).hp).toBeCloseTo(337.5)
    expect(stats('rifle', 4).atk).toBeCloseTo(33.75)
  })
  it('계급 범위를 1~4로 고정한다', () => {
    expect(stats('rifle', 5)).toEqual(stats('rifle', 4))
    expect(stats('rifle', 0)).toEqual(stats('rifle', 1))
  })
  it('저격수 일병 공격은 90, 제설병 상병 공격은 4 x 2.25 = 9다', () => {
    expect(stats('sniper', 2).atk).toBeCloseTo(90)
    expect(stats('blower', 3).atk).toBeCloseTo(9)
  })
})

describe('synergyTier', () => {
  it('소총수는 2명에 1단계, 4명에 2단계', () => {
    expect([0, 1, 2, 3, 4, 5].map((n) => synergyTier('rifle', n))).toEqual([0, 0, 1, 1, 2, 2])
  })
  it('저격수는 2명 단계뿐이다', () => {
    expect(synergyTier('sniper', 1)).toBe(0)
    expect(synergyTier('sniper', 2)).toBe(1)
    expect(synergyTier('sniper', 4)).toBe(1)
  })
})

describe('synergies', () => {
  it('인원 수로만 집계하고 카드 순서를 지킨다', () => {
    expect(synergies(['sniper', 'rifle', 'rifle'])).toEqual([
      { card: 'rifle', count: 2, on: true },
      { card: 'sniper', count: 1, on: false },
    ])
  })
  it('빈 판은 빈 배열', () => {
    expect(synergies([])).toEqual([])
  })
  it('합쳐서 인원이 줄면 꺼진다', () => {
    expect(synergies(['rifle', 'rifle'])[0]?.on).toBe(true)
    expect(synergies(['rifle'])[0]?.on).toBe(false)
  })
})

describe('income', () => {
  it('보급 5당 이자 1, 최대 2', () => {
    const f = (supply: number) => income({ supply, flag: false, early: false })
    expect([0, 4, 5, 10, 15, 99].map(f)).toEqual([5, 5, 6, 7, 7, 7])
  })
  it('깃발 +3, 조기 +1', () => {
    expect(income({ supply: 10, flag: true, early: false })).toBe(10)
    expect(income({ supply: 10, flag: false, early: true })).toBe(8)
    expect(income({ supply: 10, flag: true, early: true })).toBe(11)
  })
})

describe('waveHp', () => {
  it('웨이브마다 기본 HP의 50%씩 늘어난다', () => {
    expect(waveHp(60, 1)).toBeCloseTo(60)
    expect(waveHp(60, 6)).toBeCloseTo(210)
    expect(waveHp(1200, 5)).toBeCloseTo(3600)
    expect(waveHp(1200, 10)).toBeCloseTo(6600)
  })
})

describe('rollShop', () => {
  it('난수로 해금 목록에서 5칸을 고른다', () => {
    const seq = [0, 0.34, 0.67, 0.99, 0.5]
    let i = 0
    const rand = () => seq[i++] ?? 0
    expect(rollShop(['rifle', 'blower', 'sniper'], rand)).toEqual(['rifle', 'blower', 'sniper', 'sniper', 'blower'])
  })
  it('같은 시드면 같은 상점이 나온다', () => {
    const pool: Unit['card'][] = ['rifle', 'sniper', 'blower', 'cook', 'miner', 'chem']
    const a = rollShop(pool, createRng(42))
    const b = rollShop(pool, createRng(42))
    expect(a).toEqual(b)
    expect(a).toHaveLength(5)
    for (const c of a) expect(pool).toContain(c)
  })
  it('해금 목록이 비면 빈 배열', () => {
    expect(rollShop([], () => 0.5)).toEqual([])
  })
})

describe('sellValue', () => {
  it('비용 x 이등병 환산 장수', () => {
    expect([1, 2, 3, 4].map((r) => sellValue('rifle', r))).toEqual([1, 2, 4, 8])
    expect([1, 2, 3, 4].map((r) => sellValue('sniper', r))).toEqual([3, 6, 12, 24])
    expect([1, 2, 3, 4].map((r) => sellValue('blower', r))).toEqual([2, 4, 8, 16])
  })
})

describe('nearestEmpty', () => {
  const cells = [
    { x: 0, y: 0, free: false },
    { x: 100, y: 0, free: true },
    { x: 0, y: 100, free: true },
  ]
  it('가장 가까운 빈 칸의 인덱스', () => {
    expect(nearestEmpty(cells, 5, 40)).toBe(2)
  })
  it('거리가 같으면 앞 인덱스', () => {
    expect(nearestEmpty(cells, 50, 50)).toBe(1)
  })
  it('빈 칸이 없거나 칸이 없으면 null', () => {
    expect(nearestEmpty(cells.map((c) => ({ ...c, free: false })), 0, 0)).toBeNull()
    expect(nearestEmpty([], 0, 0)).toBeNull()
  })
})

describe('dropOutcome', () => {
  it('빈 칸이면 이동', () => {
    expect(dropOutcome(u('rifle', 1), null)).toBe('move')
  })
  it('같은 카드·같은 계급이면 합성', () => {
    expect(dropOutcome(u('rifle', 1), u('rifle', 1))).toBe('merge')
    expect(dropOutcome(u('rifle', 2), u('rifle', 2))).toBe('merge')
  })
  it('그 밖에는 자리 바꿈(병장끼리 포함)', () => {
    expect(dropOutcome(u('rifle', 1), u('rifle', 2))).toBe('swap')
    expect(dropOutcome(u('rifle', 4), u('rifle', 4))).toBe('swap')
    expect(dropOutcome(u('rifle', 1), u('sniper', 1))).toBe('swap')
  })
})

describe('GDD 수치 고정', () => {
  it('§5.2 카드 표', () => {
    const gdd = {
      rifle: { name: '소총수', cost: 1, hp: 100, atk: 10, interval: 0.8, range: 3.5 },
      sniper: { name: '저격수', cost: 3, hp: 70, atk: 60, interval: 2.5, range: 12 },
      blower: { name: '제설병', cost: 2, hp: 180, atk: 4, interval: 1.5, range: 2 },
      cook: { name: '취사병', cost: 2, hp: 90, atk: 0, interval: 2.0, range: 1 },
      miner: { name: '지뢰설치병', cost: 2, hp: 80, atk: 6, interval: 1.0, range: 3 },
      chem: { name: '화학병', cost: 2, hp: 90, atk: 6, interval: 1.0, range: 3 },
    }
    for (const [k, v] of Object.entries(gdd)) {
      const c = CARDS[k as keyof typeof CARDS]
      expect({ name: c.name, cost: c.cost, hp: c.hp, atk: c.atk, interval: c.interval, range: c.range }).toEqual(v)
    }
  })
  it('§5.3 계급', () => {
    expect(RANKS.copies).toEqual([1, 2, 4, 8])
    expect(RANKS.mult).toBe(1.5)
    expect(RANKS.max).toBe(4)
    expect(RANKS.names).toEqual(['이등병', '일병', '상병', '병장'])
  })
  it('§5.4 시너지', () => {
    expect(SYNERGY).toMatchObject({ rifle: [2, 4], sniper: [2], blower: [2, 4], cook: [2], miner: [2], chem: [2] })
  })
  it('§6 경제', () => {
    expect(ECONOMY).toEqual({
      startSupply: 6,
      baseIncome: 5,
      interestStep: 5,
      interestMax: 2,
      flagBonus: 3,
      earlyBonus: 1,
      rerollCost: 1,
      shopSize: 5,
      waveHpGrowth: 0.5,
    })
  })
  it('신병 위치', () => {
    expect(ROOKIE).toEqual({ card: 'rifle', name: '김신병', col: 2, row: 2 })
  })
  it('카드 색에 붉은 계열이 없다', () => {
    for (const c of Object.values(CARDS)) {
      const r = (c.color >> 16) & 0xff
      const g = (c.color >> 8) & 0xff
      const b = c.color & 0xff
      expect(r > Math.max(g, b)).toBe(false)
    }
  })
})
