import { describe, it, expect } from 'vitest'
import {
  cloneHud,
  getCardInitial,
  getCardName,
  getRankBars,
  getRankName,
  isSameHud,
  sortSynergies,
} from '../src/ui/helpers'
import type { Hud } from '../src/ui/screens'

const sampleHud: Hud = {
  wave: 3,
  waves: 10,
  defcon: 2,
  supply: 7,
  baseHp: 18,
  phase: 'prep',
  prepLeft: 20,
  speed: 1,
  synergies: [
    { card: 'blower', count: 1, on: false },
    { card: 'rifle', count: 2, on: true },
  ],
}

describe('UI 순수 헬퍼 테스트', () => {
  it('isSameHud: 동일한 값이면 true를 반환하고 하나라도 다르면 false를 반환한다', () => {
    expect(isSameHud(null, sampleHud)).toBe(false)

    const copy = cloneHud(sampleHud)
    expect(isSameHud(sampleHud, copy)).toBe(true)

    expect(isSameHud(sampleHud, { ...copy, supply: 8 })).toBe(false)
    expect(isSameHud(sampleHud, { ...copy, defcon: 1 })).toBe(false)
    expect(
      isSameHud(sampleHud, {
        ...copy,
        synergies: [{ card: 'rifle', count: 2, on: true }],
      })
    ).toBe(false)
    expect(
      isSameHud(sampleHud, {
        ...copy,
        synergies: [
          { card: 'blower', count: 2, on: true },
          { card: 'rifle', count: 2, on: true },
        ],
      })
    ).toBe(false)
  })

  it('sortSynergies: 활성(on=true) 시너지를 먼저, 그다음 인원 수 내림차순으로 정렬한다', () => {
    const sorted = sortSynergies([
      { card: 'cook', count: 1, on: false },
      { card: 'rifle', count: 2, on: true },
      { card: 'blower', count: 4, on: true },
      { card: 'sniper', count: 1, on: false },
    ])

    expect(sorted.map((s) => s.card)).toEqual(['blower', 'rifle', 'cook', 'sniper'])
  })

  it('카드 이름·머리글자 및 계급 포맷을 반환한다', () => {
    expect(getCardName('rifle')).toBe('소총수')
    expect(getCardInitial('sniper')).toBe('저')
    expect(getCardName('unknown')).toBe('unknown')
    expect(getCardInitial('unknown')).toBe('U')

    expect(getRankName(1)).toBe('이등병')
    expect(getRankName(3)).toBe('상병')
    expect(getRankName(undefined)).toBe('—')
    expect(getRankBars(1)).toBe(1)
    expect(getRankBars(4)).toBe(4)
    expect(getRankBars(99)).toBe(4)
  })
})
