import { describe, it, expect } from 'vitest'
import {
  calculateLogicalHeight,
  computeCanvasLayout,
  readEffectiveSafeArea,
} from '../src/device'
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

  it('T-103: Safe Area 비율 기준 논리 높이를 1280~1560 범위로 계산한다', () => {
    expect(calculateLogicalHeight(720, 1280)).toBe(1280)
    expect(calculateLogicalHeight(720, 1560)).toBe(1560)
    expect(calculateLogicalHeight(390, 844)).toBe(1558)
    // Safe Area(상하 24px 제외: 411 x 866) 기준 높이 계산
    expect(calculateLogicalHeight(411, 866)).toBe(1517)
    // 범위를 벗어나는 비율은 1280~1560으로 클램프
    expect(calculateLogicalHeight(800, 1000)).toBe(1280)
    expect(calculateLogicalHeight(360, 900)).toBe(1560)
  })

  it('T-103: 캔버스 표시 배율(--game-scale)과 상점 패널 하단·좌우 여백을 계산한다', () => {
    // 720x1560: 배율 1, 여백 0, 상점 패널 높이 120px -> 위 끝 1440 (대기석 1320~1440 아래 끝과 일치)
    const layout1560 = computeCanvasLayout(
      { left: 0, right: 720, bottom: 1560, width: 720 },
      { left: 0, right: 720, bottom: 1560, width: 720, height: 1560 }
    )
    expect(layout1560).toEqual({ scale: 1, bottomGap: 0, leftGap: 0, rightGap: 0 })
    expect(layout1560.scale * 120).toBe(120)

    // 390x844: 배율 390/720, 상점 패널 높이 65px
    const layout390 = computeCanvasLayout(
      { left: 0, right: 390, bottom: 844, width: 390 },
      { left: 0, right: 390, bottom: 844, width: 390, height: 844 }
    )
    expect(layout390.scale).toBeCloseTo(390 / 720, 6)
    expect(Math.round(layout390.scale * 120)).toBe(65)
    expect(layout390.bottomGap).toBe(0)

    // 캔버스가 Safe Area보다 작아 위아래 여백이 있는 경우 그 차이만큼 위로 올라간다
    const layoutLetterbox = computeCanvasLayout(
      { left: 0, right: 390, bottom: 872, width: 390 },
      { left: 0, right: 390, bottom: 900, width: 390, height: 900 }
    )
    expect(layoutLetterbox.bottomGap).toBe(28)
  })

  it('T-103: readEffectiveSafeArea가 폴백 SafeRect를 반환한다', () => {
    const rect = readEffectiveSafeArea(null)
    expect(rect.width).toBe(720)
    expect(rect.height).toBe(1280)
    expect(rect.top).toBe(0)
    expect(rect.bottom).toBe(0)
  })
})
