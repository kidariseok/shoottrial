import { describe, it, expect } from 'vitest'
import { interval, sniperDamage, knockback, blowerRange, cookReach } from '../src/rules'

// 기대값은 GDD §5.2~§5.4 값을 독립적으로 못 박은 리터럴이다

describe('interval', () => {
  it('소총수는 계급·시너지·데프콘이 곱으로 겹친다', () => {
    expect(interval('rifle', 1, 1, false)).toBeCloseTo(0.8)
    expect(interval('rifle', 4, 1, false)).toBeCloseTo(0.64)
    expect(interval('rifle', 1, 2, false)).toBeCloseTo(0.64)
    expect(interval('rifle', 1, 4, false)).toBeCloseTo(0.48)
    expect(interval('rifle', 4, 4, false)).toBeCloseTo(0.384)
    expect(interval('rifle', 1, 1, true)).toBeCloseTo(0.64)
    expect(interval('rifle', 4, 4, true)).toBeCloseTo(0.3072)
  })
  it('저격수는 기본 간격이고 데프콘 1만 x0.8이다', () => {
    expect(interval('sniper', 1, 1, false)).toBeCloseTo(2.5)
    expect(interval('sniper', 1, 1, true)).toBeCloseTo(2.0)
    expect(interval('sniper', 4, 5, false)).toBeCloseTo(2.5)
  })
  it('나머지 보직은 기본 간격', () => {
    expect(interval('blower', 1, 1, false)).toBeCloseTo(1.5)
    expect(interval('cook', 1, 1, false)).toBeCloseTo(2.0)
    expect(interval('miner', 1, 1, false)).toBeCloseTo(1.0)
  })
})

describe('sniperDamage', () => {
  it('이등병·일병은 k번째 적이 20%씩 줄고 음수가 없다', () => {
    const got = [0, 1, 2, 3, 4, 5, 6].map((k) => sniperDamage(60, k, 1))
    const want = [60, 48, 36, 24, 12, 0, 0]
    want.forEach((w, i) => expect(got[i]).toBeCloseTo(w))
  })
  it('상병 이상은 감소가 없다', () => {
    for (let k = 0; k < 5; k++) expect(sniperDamage(135, k, 3)).toBeCloseTo(135)
  })
  it('시너지 1단계는 x1.3', () => {
    expect(sniperDamage(60, 0, 1, 1)).toBeCloseTo(78)
    expect(sniperDamage(60, 1, 1, 1)).toBeCloseTo(62.4)
  })
})

describe('knockback', () => {
  it('기본 1칸에 적 배율이 곱해진다', () => {
    expect(knockback('infantry', 1, 1)).toBeCloseTo(1)
    expect(knockback('dog', 1, 1)).toBeCloseTo(1.5)
    expect(knockback('boss', 1, 1)).toBeCloseTo(0.25)
    expect(knockback('rpg', 1, 1)).toBeCloseTo(1)
  })
  it('병장은 2칸', () => {
    expect(knockback('infantry', 4, 1)).toBeCloseTo(2)
  })
  it('시너지는 2명부터 x1.5이고 4명도 x1.5', () => {
    expect(knockback('infantry', 1, 2)).toBeCloseTo(1.5)
    expect(knockback('boss', 4, 2)).toBeCloseTo(0.75)
    expect(knockback('infantry', 1, 4)).toBeCloseTo(1.5)
  })
})

describe('blowerRange', () => {
  it('4명부터 3칸', () => {
    expect([1, 2, 3, 4, 5].map(blowerRange)).toEqual([2, 2, 2, 3, 3])
  })
})

describe('cookReach', () => {
  it('기본 1, 병장 2, 시너지 2명이면 전원', () => {
    expect(cookReach(1, 1)).toBe(1)
    expect(cookReach(3, 1)).toBe(1)
    expect(cookReach(4, 1)).toBe(2)
    expect(cookReach(1, 2)).toBe(Infinity)
    expect(cookReach(4, 2)).toBe(Infinity)
  })
})
