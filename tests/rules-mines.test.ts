import { describe, it, expect, vi } from 'vitest'
import { mineTokens, hasAntiTank, pickDogLane, mineTriggered, inBlast, mineDamage } from '../src/rules'

const m = (...ranks: number[]) => ranks.map((rank) => ({ rank }))

describe('mineTokens', () => {
  it('계급 수 + 병장 +2', () => {
    expect(mineTokens([])).toBe(0)
    expect(mineTokens(m(1))).toBe(1)
    expect(mineTokens(m(2))).toBe(2)
    expect(mineTokens(m(3))).toBe(3)
    expect(mineTokens(m(4))).toBe(6)
  })
  it('시너지(2명 이상)는 전체에 한 번만 +1', () => {
    expect(mineTokens(m(1, 1))).toBe(3)
    expect(mineTokens(m(1, 1, 1))).toBe(4)
    expect(mineTokens(m(4, 1))).toBe(8)
    expect(mineTokens(m(4, 4))).toBe(13)
  })
})

describe('hasAntiTank', () => {
  it('상병 이상이 한 명이라도 있으면 대전차', () => {
    expect(hasAntiTank([])).toBe(false)
    expect(hasAntiTank(m(1, 2))).toBe(false)
    expect(hasAntiTank(m(1, 3))).toBe(true)
    expect(hasAntiTank(m(4))).toBe(true)
  })
})

describe('pickDogLane', () => {
  const allies = [3, 1, 2, 0, 5]
  const never = () => {
    throw new Error('rand를 부르면 안 된다')
  }
  it('아군이 적은 쪽 열을 고른다(난수 없음)', () => {
    expect(pickDogLane(1, allies, never)).toBe(2)
    expect(pickDogLane(3, allies, never)).toBe(2)
  })
  it('가장자리 열은 안쪽 한 열뿐이고 난수를 부르지 않는다', () => {
    const rand = vi.fn(() => 0)
    expect(pickDogLane(0, allies, rand)).toBe(1)
    expect(pickDogLane(4, allies, rand)).toBe(3)
    expect(rand).toHaveBeenCalledTimes(0)
  })
  it('같으면 난수 한 번으로 작은 열/큰 열', () => {
    const lo = vi.fn(() => 0.2)
    const hi = vi.fn(() => 0.7)
    expect(pickDogLane(1, [2, 0, 2], lo)).toBe(0)
    expect(pickDogLane(1, [2, 0, 2], hi)).toBe(2)
    expect(lo).toHaveBeenCalledTimes(1)
    expect(hi).toHaveBeenCalledTimes(1)
  })
  it('후보가 없으면 자기 열', () => {
    expect(pickDogLane(0, [4], never)).toBe(0)
  })
})

describe('mineTriggered', () => {
  it('적 중심이 칸 윗변에 닿으면 터진다', () => {
    expect(mineTriggered(1.9, 0)).toBe(false)
    expect(mineTriggered(2, 0)).toBe(true)
    expect(mineTriggered(3.5, 0)).toBe(true)
    expect(mineTriggered(2.9, 1)).toBe(false)
    expect(mineTriggered(3, 1)).toBe(true)
  })
})

describe('inBlast', () => {
  it('칸 + 위아래 1칸', () => {
    expect(inBlast(0.9, 0)).toBe(false)
    expect(inBlast(1, 0)).toBe(true)
    expect(inBlast(3.99, 0)).toBe(true)
    expect(inBlast(4, 0)).toBe(false)
    expect(inBlast(1.9, 1)).toBe(false)
    expect(inBlast(2, 1)).toBe(true)
    expect(inBlast(4.99, 1)).toBe(true)
    expect(inBlast(5, 1)).toBe(false)
  })
})

describe('mineDamage', () => {
  it('150, 대전차는 보스에게만 450', () => {
    expect(mineDamage('infantry', false)).toBe(150)
    expect(mineDamage('boss', false)).toBe(150)
    expect(mineDamage('boss', true)).toBe(450)
    expect(mineDamage('dog', true)).toBe(150)
  })
})
