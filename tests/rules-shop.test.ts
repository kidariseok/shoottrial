import { describe, it, expect } from 'vitest'
import { createShop, refill, toOffers, buyCard, useAdReroll, useAdSupply } from '../src/battle/shop'
import { CARDS, ECONOMY, REWARD, type CardKey } from '../src/data'
import type { BoardUnit } from '../src/battle/board'
import type { Spot } from '../src/rules'

const POOL: CardKey[] = ['rifle', 'blower', 'sniper']

const b = (i: number, card: CardKey, rank: number): BoardUnit => ({ zone: 'bench', i, unit: { card, rank } })
const d = (i: number, card: CardKey, rank: number): BoardUnit => ({ zone: 'deploy', i, unit: { card, rank } })

// 호출을 기록하는 가짜 board
function fakeBoard(benchFree: number | null, units: BoardUnit[]) {
  const placed: { zone: string; i: number; unit: { card: CardKey; rank: number } }[] = []
  const promoted: { zone: string; i: number; absorb?: Spot }[] = []
  return {
    placed,
    promoted,
    benchFree: () => benchFree,
    units: () => units,
    place: (zone: 'deploy' | 'bench', i: number, unit: { card: CardKey; rank: number }) => {
      placed.push({ zone, i, unit })
      return true
    },
    promote: (zone: 'bench' | 'deploy', i: number, absorb?: Spot) => {
      promoted.push({ zone, i, absorb })
    },
  }
}

const shopWith = (offers: (CardKey | null)[]) => {
  const s = createShop(1)
  s.offers = offers
  return s
}

describe('선택을 기다리는 연쇄 구매', () => {
  it('각 진급 선택 뒤에 다음 단계로 가고 중복 콜백과 재구매를 무시한다', () => {
    const board = fakeBoard(null, [b(0, 'rifle', 1), b(1, 'rifle', 2), d(0, 'rifle', 3)])
    const choices: (() => void)[] = []
    const calls: number[] = []
    const pending = {
      ...board,
      promote: (_zone: 'bench' | 'deploy', i: number, _absorb?: Spot, done?: () => void) => {
        calls.push(i)
        choices.push(done!)
        return true
      },
    }
    const shop = shopWith(['rifle'])
    let completed = 0
    expect(buyCard(shop, pending, 0, 99, () => completed++)).toEqual({ kind: 'merge', cost: 1, card: 'rifle' })
    expect(shop.offers[0]).toBeNull()
    expect(calls).toHaveLength(1)
    expect(buyCard(shop, pending, 0, 99).kind).toBe('none')
    choices[0]!(); choices[0]!()
    expect(calls).toHaveLength(2)
    expect(completed).toBe(0)
    choices[1]!()
    expect(calls).toHaveLength(3)
    choices[2]!(); choices[2]!()
    expect(completed).toBe(1)
  })
})

describe('createShop / refill', () => {
  it('같은 시드와 풀이면 같은 offers, 길이는 shopSize, 모두 풀 안', () => {
    const a = createShop(42)
    const c = createShop(42)
    refill(a, POOL)
    refill(c, POOL)
    expect(a.offers).toEqual(c.offers)
    expect(a.offers).toHaveLength(ECONOMY.shopSize)
    for (const o of a.offers) expect(POOL).toContain(o)
  })
  it('시드가 다르면 offers가 다르다', () => {
    const a = createShop(42)
    const c = createShop(43)
    refill(a, POOL)
    refill(c, POOL)
    expect(a.offers).not.toEqual(c.offers)
  })
  it('새 상점은 빈 칸 shopSize개, 광고 횟수는 REWARD에서', () => {
    const s = createShop(1)
    expect(s.offers).toEqual(Array(ECONOMY.shopSize).fill(null))
    expect(s.rerollsLeft).toBe(REWARD.adRerollMax)
    expect(s.supplyAdsLeft).toBe(REWARD.adSupplyMax)
  })
  it('refill은 산 칸(null)도 다시 채운다', () => {
    const s = shopWith(['rifle', null, 'sniper', null, 'blower'])
    refill(s, POOL)
    for (const o of s.offers) expect(o).not.toBeNull()
  })
})

describe('toOffers', () => {
  it('카드는 { card, cost }, null은 null', () => {
    const s = shopWith(['rifle', null, 'sniper', 'rifle', 'blower'])
    expect(toOffers(s)).toEqual([
      { card: 'rifle', cost: CARDS.rifle.cost },
      null,
      { card: 'sniper', cost: CARDS.sniper.cost },
      { card: 'rifle', cost: CARDS.rifle.cost },
      { card: 'blower', cost: CARDS.blower.cost },
    ])
    expect(CARDS.rifle.cost).toBe(1)
    expect(CARDS.sniper.cost).toBe(3)
  })
})

describe('buyCard', () => {
  const offers = (): (CardKey | null)[] => ['rifle', 'sniper', 'blower', 'rifle', 'sniper']

  it('대기석 빈 칸이 있으면 첫 빈 칸에 이등병을 놓고 산 칸을 비운다', () => {
    const s = shopWith(offers())
    const fb = fakeBoard(2, [])
    const r = buyCard(s, fb, 1, 10)
    expect(r).toEqual({ kind: 'bench', cost: CARDS.sniper.cost, card: 'sniper' })
    expect(fb.placed).toEqual([{ zone: 'bench', i: 2, unit: { card: 'sniper', rank: 1 } }])
    expect(fb.promoted).toHaveLength(0)
    expect(s.offers).toEqual(['rifle', null, 'blower', 'rifle', 'sniper'])
  })

  it('보급이 모자라면 아무것도 하지 않는다', () => {
    const s = shopWith(offers())
    const fb = fakeBoard(0, [])
    const r = buyCard(s, fb, 1, CARDS.sniper.cost - 1)
    expect(r.kind).toBe('poor')
    expect(r.cost).toBe(0)
    expect(fb.placed).toHaveLength(0)
    expect(fb.promoted).toHaveLength(0)
    expect(s.offers).toEqual(offers())
  })

  it('대기석이 가득 차도 합성되면 허용: promote만 단계 순서대로, remove는 absorb로', () => {
    const s = shopWith(offers())
    const units = [b(0, 'rifle', 2), b(1, 'sniper', 1), b(2, 'blower', 1), b(3, 'blower', 2), b(4, 'sniper', 2), d(0, 'rifle', 1)]
    const fb = fakeBoard(null, units)
    const r = buyCard(s, fb, 0, 5)
    expect(r.kind).toBe('merge')
    expect(r.cost).toBe(CARDS.rifle.cost)
    expect(r.card).toBe('rifle')
    expect(fb.placed).toHaveLength(0)
    // 배치 구역 소총수 1 -> 2, 대기석 0번 소총수 2와 합쳐져 배치 구역 칸이 3
    expect(fb.promoted).toEqual([
      { zone: 'deploy', i: 0, absorb: undefined },
      { zone: 'deploy', i: 0, absorb: { zone: 'bench', i: 0 } },
    ])
    expect(s.offers[0]).toBeNull()
    expect(s.offers.slice(1)).toEqual(offers().slice(1))
  })

  it('대기석이 가득 차고 합성도 안 되면 full, 아무것도 안 한다', () => {
    const s = shopWith(offers())
    const units = [b(0, 'rifle', 2), b(1, 'sniper', 2), b(2, 'blower', 2), b(3, 'blower', 3), b(4, 'cook', 1)]
    const fb = fakeBoard(null, units)
    const r = buyCard(s, fb, 1, 10)
    expect(r).toEqual({ kind: 'full', cost: 0, card: 'sniper' })
    expect(fb.placed).toHaveLength(0)
    expect(fb.promoted).toHaveLength(0)
    expect(s.offers).toEqual(offers())
  })

  it('빈 칸이거나 범위 밖이면 none', () => {
    const s = shopWith(['rifle', null, 'sniper', 'rifle', 'blower'])
    const fb = fakeBoard(0, [])
    expect(buyCard(s, fb, 1, 10)).toEqual({ kind: 'none', cost: 0, card: null })
    expect(buyCard(s, fb, 9, 10)).toEqual({ kind: 'none', cost: 0, card: null })
    expect(buyCard(s, fb, -1, 10)).toEqual({ kind: 'none', cost: 0, card: null })
    expect(fb.placed).toHaveLength(0)
  })
})

describe('광고 횟수', () => {
  it('리롤은 REWARD.adRerollMax번 true 뒤 false', () => {
    const s = createShop(1)
    for (let k = 0; k < REWARD.adRerollMax; k++) expect(useAdReroll(s)).toBe(true)
    expect(useAdReroll(s)).toBe(false)
  })
  it('긴급 보급은 REWARD.adSupplyMax번 true 뒤 false', () => {
    const s = createShop(1)
    for (let k = 0; k < REWARD.adSupplyMax; k++) expect(useAdSupply(s)).toBe(true)
    expect(useAdSupply(s)).toBe(false)
  })
})
