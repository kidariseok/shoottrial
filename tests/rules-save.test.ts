import { describe, it, expect } from 'vitest'
import { CARD_KEYS, UNLOCK } from '../src/data'
import { afterRun, mergeUnlocked } from '../src/rules'

const base = ['rifle', 'sniper', 'blower'] // CARD_KEYS 순서

describe('mergeUnlocked: save.unlocked + 예전 d2_unlocked', () => {
  it('빈 save + ["cook"] -> 기본 3 + cook', () => {
    expect(mergeUnlocked([], '["cook"]')).toEqual(['rifle', 'sniper', 'blower', 'cook'])
  })
  it('깨진·없는 legacy는 save 그대로(기본 포함)', () => {
    expect(mergeUnlocked(['cook'], '{oops')).toEqual([...base, 'cook'])
    expect(mergeUnlocked(['cook'], null)).toEqual([...base, 'cook'])
    expect(mergeUnlocked([], null)).toEqual(base)
  })
  it('중복 없이 합치고 CARD_KEYS 순서', () => {
    const r = mergeUnlocked(['miner', 'cook'], '["cook","miner"]')
    expect(r).toEqual(CARD_KEYS.filter((k) => UNLOCK.base.includes(k) || k === 'cook' || k === 'miner'))
    expect(new Set(r).size).toBe(r.length)
  })
  it('모르는 id는 버린다', () => {
    expect(mergeUnlocked(['zzz'], '["cook","yyy"]')).toEqual([...base, 'cook'])
  })
})

describe('afterRun: 최고 웨이브·판 수', () => {
  it('bestWave가 낮으면 갱신', () => {
    expect(afterRun({ bestWave: 3, runs: 2 }, 5)).toEqual({ bestWave: 5, runs: 3 })
  })
  it('bestWave가 높으면 유지', () => {
    expect(afterRun({ bestWave: 8, runs: 2 }, 5)).toEqual({ bestWave: 8, runs: 3 })
  })
  it('같으면 유지, runs는 항상 +1', () => {
    expect(afterRun({ bestWave: 5, runs: 0 }, 5)).toEqual({ bestWave: 5, runs: 1 })
  })
})
