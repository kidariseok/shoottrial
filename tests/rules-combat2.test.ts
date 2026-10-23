import { describe, it, expect } from 'vitest'
import { CARDS, COMBAT } from '../src/data'
import { allyDamageTaken, blowerCone, chemDamageMult, damageTaken, dist, engageTarget, healOrder, onRay, pickTarget, pushMult, stats } from '../src/rules'

const foe = (col: number, y: number, extra: Record<string, unknown> = {}) => ({ col, y, hp: 10, ...extra })
const ally = (col: number, y: number, extra: Record<string, unknown> = {}) => ({ col, y, alive: true, taunt: false, ...extra })

describe('COMBAT 수치 고정 (GDD §5.1·§5.2)', () => {
  it('값', () => {
    expect(COMBAT).toEqual({
      meleeReach: 1.5,
      pierceWidth: 0.4,
      tieEps: 1e-9,
      blowerArmor: 0.9,
      vulnSec: 2,
      vulnMult: 1.2,
      minePushSec: 1,
      minePushMult: 1.5,
    })
  })
  it('제설병 카드 표: HP 180, 공격 4, 간격 1.5, 사거리 2 / 저격수 사거리는 판 전체', () => {
    const b = CARDS.blower
    expect({ hp: b.hp, atk: b.atk, interval: b.interval, range: b.range }).toEqual({ hp: 180, atk: 4, interval: 1.5, range: 2 })
    expect(Number.isFinite(CARDS.sniper.range)).toBe(true)
    expect(CARDS.sniper.range).toBeGreaterThanOrEqual(Math.hypot(5, 7)) // 판 대각선 이상
  })
})

describe('dist', () => {
  it('칸 단위 유클리드 거리', () => {
    expect(dist({ col: 0, y: 0 }, { col: 3, y: 4 })).toBe(5)
    expect(dist({ col: 1, y: 1 }, { col: 2, y: 2 })).toBeCloseTo(Math.SQRT2)
  })
})

describe('pickTarget', () => {
  const me = { col: 2, y: 6.5 }
  it('대각선 대상도 사거리 안이면 고른다', () => {
    const e = foe(3, 4.5)
    expect(pickTarget(me, [e], 4)).toBe(e)
  })
  it('가장 가까운 적을 고른다', () => {
    const far = foe(2, 3)
    const near = foe(1, 5)
    expect(pickTarget(me, [far, near], 4)).toBe(near)
  })
  it('같은 거리면 아래쪽(y가 큰) 적', () => {
    const up = foe(2, 4.5) // 거리 2
    const side = foe(2 + 2, 6.5) // 거리 2, 더 아래
    expect(pickTarget(me, [up, side], 4)).toBe(side)
    expect(pickTarget(me, [side, up], 4)).toBe(side)
  })
  it('사거리 밖·죽은 적·제거된 적은 제외, 없으면 null', () => {
    expect(pickTarget(me, [foe(2, 1)], 4)).toBeNull()
    expect(pickTarget(me, [foe(2, 5, { hp: 0 })], 4)).toBeNull()
    expect(pickTarget(me, [foe(2, 5, { gone: true })], 4)).toBeNull()
    expect(pickTarget(me, [], 4)).toBeNull()
  })
  it('사거리 경계는 포함', () => {
    expect(pickTarget(me, [foe(2, 2.5)], 4)).not.toBeNull()
  })
  it('무한대 같은 큰 사거리는 판 전체', () => {
    expect(pickTarget(me, [foe(0, 0)], CARDS.sniper.range)).not.toBeNull()
  })
})

describe('onRay (저격 관통)', () => {
  const o = { col: 2, y: 6.5 }
  const t = { col: 2, y: 4.5 }
  it('사선 위 뒤쪽 적은 포함', () => {
    expect(onRay(o, t, { col: 2, y: 1 }, COMBAT.pierceWidth)).toBe(true)
    // 대각선 사선
    const d = { col: 4, y: 4.5 }
    expect(onRay(o, d, { col: 5, y: 3.5 }, COMBAT.pierceWidth)).toBe(true)
  })
  it('옆으로 폭을 넘으면 제외, 폭 안이면 포함', () => {
    expect(onRay(o, t, { col: 2.5, y: 1 }, COMBAT.pierceWidth)).toBe(false)
    expect(onRay(o, t, { col: 2.3, y: 1 }, COMBAT.pierceWidth)).toBe(true)
  })
  it('첫 대상보다 앞(아군 쪽)이나 뒤통수 방향은 제외', () => {
    expect(onRay(o, t, { col: 2, y: 5.5 }, COMBAT.pierceWidth)).toBe(false)
    expect(onRay(o, t, { col: 2, y: 7 }, COMBAT.pierceWidth)).toBe(false)
  })
  it('첫 대상과 같은 점은 뒤쪽으로 친다', () => {
    expect(onRay(o, t, t, COMBAT.pierceWidth)).toBe(true)
  })
  it('출발점과 대상이 같으면 폭 안만', () => {
    expect(onRay(o, o, { col: 2.2, y: 6.5 }, COMBAT.pierceWidth)).toBe(true)
    expect(onRay(o, o, { col: 3, y: 6.5 }, COMBAT.pierceWidth)).toBe(false)
  })
})

describe('engageTarget', () => {
  const e = { col: 1, y: 4 }
  it('대각선 이웃(약 1.41)은 근접 거리 안', () => {
    const a = ally(2, 5)
    expect(engageTarget(e, [a])).toBe(a)
  })
  it('같은 열 바로 아래도 안, 1.5 밖이면 null', () => {
    expect(engageTarget(e, [ally(1, 5.5)])).not.toBeNull()
    expect(engageTarget(e, [ally(1, 5.6)])).toBeNull()
    expect(engageTarget(e, [])).toBeNull()
  })
  it('가장 가까운 아군', () => {
    const near = ally(1, 5)
    const far = ally(2, 5.2)
    expect(engageTarget(e, [far, near])).toBe(near)
  })
  it('도발 중인 제설병이 근접 안에 있으면 더 먼 제설병을 고른다', () => {
    const rifle = ally(1, 5)
    const blower = ally(2, 5.1, { taunt: true })
    expect(engageTarget(e, [rifle, blower])).toBe(blower)
  })
  it('도발이 여럿이면 가장 가까운 도발', () => {
    const far = ally(0, 5.1, { taunt: true })
    const near = ally(1, 5.2, { taunt: true })
    expect(engageTarget(e, [far, near])).toBe(near)
  })
  it('도발 제설병이 근접 밖이면 무시', () => {
    const rifle = ally(1, 5)
    const blower = ally(4, 5, { taunt: true })
    expect(engageTarget(e, [rifle, blower])).toBe(rifle)
  })
  it('쓰러진 아군은 제외', () => {
    expect(engageTarget(e, [ally(1, 5, { alive: false })])).toBeNull()
    const b = ally(2, 5, { taunt: true, alive: false })
    const r = ally(1, 5)
    expect(engageTarget(e, [b, r])).toBe(r)
  })
  it('사거리를 넘기면(RPG 3칸) 더 먼 아군도 고른다', () => {
    const a = ally(1, 6.5)
    expect(engageTarget(e, [a])).toBeNull()
    expect(engageTarget(e, [a], 3)).toBe(a)
  })
  it('같은 거리면 위쪽(y 작은) 아군, 그다음 왼쪽 열', () => {
    const up = ally(0, 4.7)
    const dn = ally(2, 4.7)
    expect(engageTarget({ col: 1, y: 4 }, [dn, up])).toBe(up)
    const l = ally(0, 5)
    const r = ally(2, 5)
    expect(engageTarget(e, [r, l])).toBe(l)
  })
})

describe('blowerCone', () => {
  const me = { col: 2, y: 5.5 }
  it('양옆 열과 자기 열의 앞쪽 range칸', () => {
    const l = foe(1, 4)
    const c = foe(2, 4)
    const r = foe(3, 4)
    expect(blowerCone(me, [l, c, r], 2)).toEqual([l, c, r])
  })
  it('두 칸 떨어진 열은 제외', () => {
    expect(blowerCone(me, [foe(0, 4), foe(4, 4)], 2)).toEqual([])
  })
  it('뒤쪽(아군보다 아래)과 사거리 밖은 제외, 경계는 포함', () => {
    expect(blowerCone(me, [foe(2, 6)], 2)).toEqual([])
    expect(blowerCone(me, [foe(2, 3.4)], 2)).toEqual([])
    const edge = foe(3, 3.5)
    expect(blowerCone(me, [edge], 2)).toEqual([edge])
  })
  it('죽은 적·제거된 적은 제외', () => {
    expect(blowerCone(me, [foe(2, 4, { hp: 0 }), foe(2, 4, { gone: true })], 2)).toEqual([])
  })
})

describe('damageTaken / allyDamageTaken', () => {
  it('취약 중이면 x1.2, 아니면 그대로', () => {
    expect(damageTaken(10, 1)).toBeCloseTo(12)
    expect(damageTaken(10, 0)).toBe(10)
    expect(damageTaken(10, -0.1)).toBe(10)
  })
  it('병장 화학병 버프와 함께 곱한다 (10 x 1.15 x 1.2)', () => {
    const chems = [{ col: 0, row: 0, rank: 4 }]
    const buff = chemDamageMult(chems, 1, 0)
    expect(damageTaken(stats('rifle', 1).atk * buff, 2)).toBeCloseTo(10 * 1.15 * 1.2)
  })
  it('제설병이 받는 피해는 x0.9, 다른 카드는 그대로', () => {
    expect(allyDamageTaken(10, 'blower')).toBeCloseTo(9)
    expect(allyDamageTaken(10, 'rifle')).toBe(10)
  })
})

describe('pushMult (지뢰 연계)', () => {
  it('밀린 지 1초 안이면 x1.5, 넘으면 1', () => {
    expect(pushMult(10, 10.5)).toBeCloseTo(1.5)
    expect(pushMult(10, 11)).toBeCloseTo(1.5) // 경계 포함
    expect(pushMult(10, 11.01)).toBe(1)
  })
  it('밀린 적이 없으면(-Infinity) 1', () => {
    expect(pushMult(-Infinity, 5)).toBe(1)
  })
})

describe('healOrder', () => {
  const h = (hp: number, maxHp: number, taunt = false) => ({ hp, maxHp, taunt })
  it('HP 비율이 낮은 아군부터', () => {
    const a = h(50, 100)
    const b = h(20, 100)
    const c = h(90, 100)
    expect(healOrder([a, b, c])).toEqual([b, a, c])
  })
  it('비율이 같으면 도발 중인 제설병 먼저', () => {
    const a = h(50, 100)
    const b = h(100, 200, true)
    expect(healOrder([a, b])).toEqual([b, a])
  })
  it('입력 배열은 바꾸지 않는다', () => {
    const list = [h(50, 100), h(20, 100)]
    const copy = [...list]
    healOrder(list)
    expect(list).toEqual(copy)
  })
})
