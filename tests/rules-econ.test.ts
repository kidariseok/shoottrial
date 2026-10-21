import { describe, it, expect } from 'vitest'
import {
  buyOutcome,
  nextUnlock,
  parseUnlocked,
  type Placed,
} from '../src/rules'
import { CARD_KEYS, UNLOCK, REWARD, LOG, type CardKey } from '../src/data'

const b = (i: number, card: CardKey, rank: number): Placed => ({ zone: 'bench', i, unit: { card, rank } })
const d = (i: number, card: CardKey, rank: number): Placed => ({ zone: 'deploy', i, unit: { card, rank } })

describe('buyOutcome', () => {
  it('보급이 비용보다 적으면 합성이 가능해도 poor', () => {
    expect(buyOutcome('sniper', 2, true, [])).toEqual({ kind: 'poor' })
    expect(buyOutcome('sniper', 2, false, [b(0, 'sniper', 1)])).toEqual({ kind: 'poor' })
  })
  it('보급이 비용과 같으면 통과한다 (저격수 3)', () => {
    expect(buyOutcome('sniper', 3, true, [])).toEqual({ kind: 'bench' })
  })
  it('대기석이 비어 있으면 합성 후보가 있어도 bench', () => {
    expect(buyOutcome('rifle', 5, true, [b(0, 'rifle', 1)])).toEqual({ kind: 'bench' })
  })
  it('가득 찼고 같은 카드 이등병이 없으면 full', () => {
    expect(buyOutcome('rifle', 5, false, [])).toEqual({ kind: 'full' })
    expect(buyOutcome('rifle', 5, false, [b(0, 'cook', 1), d(1, 'rifle', 2)])).toEqual({ kind: 'full' })
  })
  it('가득 찼고 같은 카드 이등병이 있으면 merge. 대기석이 배치 구역보다 앞', () => {
    expect(buyOutcome('rifle', 5, false, [b(2, 'rifle', 1), d(0, 'rifle', 1)])).toEqual({
      kind: 'merge',
      steps: [{ promote: { zone: 'bench', i: 2 } }],
    })
    expect(buyOutcome('rifle', 5, false, [d(4, 'rifle', 1)])).toEqual({
      kind: 'merge',
      steps: [{ promote: { zone: 'deploy', i: 4 } }],
    })
  })
  it('연쇄: 대기석 1계급 + 배치 구역 2계급이면 배치 구역 칸이 살아남는다', () => {
    expect(buyOutcome('rifle', 5, false, [b(0, 'rifle', 1), d(3, 'rifle', 2)])).toEqual({
      kind: 'merge',
      steps: [
        { promote: { zone: 'bench', i: 0 } },
        { promote: { zone: 'deploy', i: 3 }, remove: { zone: 'bench', i: 0 } },
      ],
    })
  })
  it('연쇄: 같은 구역이면 번호가 작은 칸이 살아남는다', () => {
    const r = buyOutcome('rifle', 5, false, [b(3, 'rifle', 1), b(1, 'rifle', 2)])
    expect(r).toEqual({
      kind: 'merge',
      steps: [
        { promote: { zone: 'bench', i: 3 } },
        { promote: { zone: 'bench', i: 1 }, remove: { zone: 'bench', i: 3 } },
      ],
    })
    const r2 = buyOutcome('rifle', 5, false, [b(1, 'rifle', 1), b(3, 'rifle', 2)])
    expect(r2).toEqual({
      kind: 'merge',
      steps: [
        { promote: { zone: 'bench', i: 1 } },
        { promote: { zone: 'bench', i: 1 }, remove: { zone: 'bench', i: 3 } },
      ],
    })
  })
  it('연쇄는 병장에서 멈춘다. 1·2·3계급이 모두 있으면 steps 3개', () => {
    const r = buyOutcome('rifle', 5, false, [b(0, 'rifle', 1), b(1, 'rifle', 2), b(2, 'rifle', 3), b(3, 'rifle', 4)])
    expect(r.kind).toBe('merge')
    if (r.kind === 'merge') {
      expect(r.steps).toHaveLength(3)
      // 병장 칸은 건드리지 않는다
      expect(JSON.stringify(r.steps)).not.toContain('"i":3')
    }
  })
  it('다른 카드는 연쇄에 끼지 않는다', () => {
    const r = buyOutcome('rifle', 5, false, [b(0, 'rifle', 1), b(1, 'cook', 2)])
    expect(r).toEqual({ kind: 'merge', steps: [{ promote: { zone: 'bench', i: 0 } }] })
  })
  it('입력 units를 바꾸지 않는다', () => {
    const units = [b(0, 'rifle', 1), d(3, 'rifle', 2)]
    const copy = JSON.parse(JSON.stringify(units))
    buyOutcome('rifle', 5, false, units)
    expect(units).toEqual(copy)
  })
})

describe('nextUnlock', () => {
  it('기본 해금이면 취사병', () => {
    expect(nextUnlock(['rifle', 'sniper', 'blower'])).toBe('cook')
  })
  it('취사병까지 해금이면 지뢰설치병', () => {
    expect(nextUnlock(['cook', 'blower', 'rifle', 'sniper'])).toBe('miner')
  })
  it('모두 해금이면 null', () => {
    expect(nextUnlock([...CARD_KEYS])).toBeNull()
  })
  it('지뢰설치병만 먼저 있어도 취사병이 먼저다', () => {
    expect(nextUnlock(['rifle', 'sniper', 'blower', 'miner'])).toBe('cook')
  })
})

describe('parseUnlocked', () => {
  const base = ['rifle', 'sniper', 'blower']
  it('null·깨진 JSON·배열 아님이면 기본', () => {
    expect(parseUnlocked(null)).toEqual(base)
    expect(parseUnlocked('{oops')).toEqual(base)
    expect(parseUnlocked('{"a":1}')).toEqual(base)
    expect(parseUnlocked('"cook"')).toEqual(base)
  })
  it('배열이면 기본과 합친다', () => {
    expect(parseUnlocked('["cook"]')).toEqual([...base, 'cook'])
  })
  it('모르는 값은 버린다', () => {
    expect(parseUnlocked('["cook","zzz",5]')).toEqual([...base, 'cook'])
  })
  it('결과는 CARD_KEYS 순서', () => {
    expect(parseUnlocked('["miner","cook"]')).toEqual(['rifle', 'sniper', 'blower', 'cook', 'miner'])
  })
})

describe('GDD 수치 고정 (3단계)', () => {
  it('§7 해금', () => {
    expect([...UNLOCK.base].sort()).toEqual(['blower', 'rifle', 'sniper'])
    expect(UNLOCK.order).toEqual(['cook', 'miner'])
    expect(UNLOCK.atWave).toBe(5)
  })
  it('§10·§4.2 보상', () => {
    expect(REWARD).toEqual({ adRerollMax: 3, adSupplyMax: 1, adSupplyAmount: 5, reviveHp: 10 })
  })
  it('§11 기록', () => {
    expect(LOG).toEqual({ runsKey: 'd2_playlog', unlockedKey: 'd2_unlocked', maxRuns: 50, recent: 10, lowRate: 0.05 })
  })
})
