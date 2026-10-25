import { describe, it, expect } from 'vitest'
import {
  calculateLogicalHeight,
  computeCanvasLayout,
  readEffectiveSafeArea,
} from '../src/device'
import {
  ALL_CARDS,
  canFireSupport,
  cloneHud,
  formatBriefingText,
  getCardInitial,
  getCharacterName,
  getCharacterIntro,
  getCardName,
  getCodexRows,
  getRankBars,
  getRankName,
  isSameHud,
  mergeUnlockedCards,
  moveStep,
  nearestZone,
  nextLine,
  pulseAlpha,
  readAlarmFx,
  sanitizeRookieName,
  sortSynergies,
  stickVector,
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

  it('T-104: canFireSupport는 phase === "fight"이고 support > 0일 때만 true를 반환한다 (조합 4가지)', () => {
    // 1. 전투 단계 + 남은 횟수 > 0 -> 활성
    expect(canFireSupport('fight', 2)).toBe(true)
    expect(canFireSupport('fight', 1)).toBe(true)

    // 2. 전투 단계 + 남은 횟수 0 또는 미지정 -> 비활성
    expect(canFireSupport('fight', 0)).toBe(false)
    expect(canFireSupport('fight', undefined)).toBe(false)

    // 3. 비전투 단계(prep/settle) + 남은 횟수 > 0 -> 비활성
    expect(canFireSupport('prep', 2)).toBe(false)
    expect(canFireSupport('settle', 2)).toBe(false)

    // 4. 비전투 단계(prep/settle) + 남은 횟수 0 또는 미지정 -> 비활성
    expect(canFireSupport('prep', 0)).toBe(false)
    expect(canFireSupport('settle', undefined)).toBe(false)

    // isSameHud도 support 변경을 감지한다
    const copy = cloneHud(sampleHud)
    expect(isSameHud(sampleHud, { ...copy, support: 2 })).toBe(false)
    expect(isSameHud({ ...sampleHud, support: 2 }, { ...copy, support: 2 })).toBe(true)
  })

  it('T-105: sanitizeRookieName은 앞뒤 공백을 제거하고 1~6자로 자르며 빈 값이면 기본값 "김신병"을 반환한다', () => {
    expect(sanitizeRookieName('')).toBe('김신병')
    expect(sanitizeRookieName('   ')).toBe('김신병')
    expect(sanitizeRookieName('  이일병  ')).toBe('이일병')
    expect(sanitizeRookieName('가나다라마바사아자')).toBe('가나다라마바')
    expect(sanitizeRookieName('  홍길동장군님  ')).toBe('홍길동장군님')
  })

  it('T-105: mergeUnlockedCards는 save.unlocked와 localStorage d2_unlocked JSON 배열의 합집합을 반환한다', () => {
    const base = ['rifle', 'blower', 'sniper']
    expect(mergeUnlockedCards(base, null)).toEqual(['rifle', 'blower', 'sniper'])
    expect(mergeUnlockedCards(base, 'invalid-json')).toEqual(['rifle', 'blower', 'sniper'])
    expect(mergeUnlockedCards(base, JSON.stringify(['sniper', 'cook', 'miner']))).toEqual([
      'rifle',
      'blower',
      'sniper',
      'cook',
      'miner',
    ])
  })

  it('T-105: formatBriefingText는 문구 안의 {이름}을 정리된 신병 이름으로 치환한다', () => {
    const tpl = '6주 기초군사훈련을 마친 신병 {이름}. {이름} 이등병 출동!'
    expect(formatBriefingText(tpl, '박신병')).toBe(
      '6주 기초군사훈련을 마친 신병 박신병. 박신병 이등병 출동!'
    )
    expect(formatBriefingText(tpl, '   ')).toBe(
      '6주 기초군사훈련을 마친 신병 김신병. 김신병 이등병 출동!'
    )
  })
})

describe('T-109 걷는 생활관 헬퍼', () => {
  const bounds = { x: 0, y: 0, w: 100, h: 100 }
  const wall = { x: 40, y: 0, w: 10, h: 100 }

  it('stickVector: 세기는 0~1이고 최대 반경에서 잘린다', () => {
    expect(stickVector({ x: 0, y: 0 }, { x: 0, y: 0 }, 50)).toEqual({ x: 0, y: 0 })
    expect(stickVector({ x: 0, y: 0 }, { x: 25, y: 0 }, 50)).toEqual({ x: 0.5, y: 0 })
    const far = stickVector({ x: 0, y: 0 }, { x: 300, y: 400 }, 50)
    expect(Math.hypot(far.x, far.y)).toBeCloseTo(1)
    expect(far.x / far.y).toBeCloseTo(0.75)
  })

  it('moveStep: 자유롭게 움직이고, 정지하면 그대로다', () => {
    expect(moveStep({ x: 10, y: 10 }, { x: 1, y: 0 }, 100, 100, [], bounds, 5)).toEqual({ x: 20, y: 10 })
    expect(moveStep({ x: 10, y: 10 }, { x: 0, y: 0 }, 100, 100, [], bounds, 5)).toEqual({ x: 10, y: 10 })
  })

  it('moveStep: 범위 밖으로 나가지 않는다', () => {
    expect(moveStep({ x: 98, y: 50 }, { x: 1, y: 0 }, 100, 100, [], bounds, 5).x).toBe(100)
    expect(moveStep({ x: 50, y: 2 }, { x: 0, y: -1 }, 100, 100, [], bounds, 5).y).toBe(0)
  })

  it('moveStep: 벽에 막히고 비스듬히 비비면 벽을 따라 미끄러진다', () => {
    const blocked = moveStep({ x: 30, y: 50 }, { x: 1, y: 0 }, 100, 100, [wall], bounds, 5)
    expect(blocked).toEqual({ x: 30, y: 50 })
    const slide = moveStep({ x: 30, y: 50 }, { x: 1, y: 1 }, 100, 100, [wall], bounds, 5)
    expect(slide.x).toBe(30)
    expect(slide.y).toBeGreaterThan(50)
  })

  it('nearestZone: 반경 밖이면 null, 겹치면 가까운 쪽', () => {
    const zones = [
      { id: 'a', x: 0, y: 0, r: 50 },
      { id: 'b', x: 30, y: 0, r: 50 },
    ]
    expect(nearestZone({ x: 500, y: 500 }, zones)).toBeNull()
    expect(nearestZone({ x: 5, y: 0 }, zones)?.id).toBe('a')
    expect(nearestZone({ x: 25, y: 0 }, zones)?.id).toBe('b')
  })

  it('pulseAlpha: 0~max 범위에서 주기마다 반복하고, 너무 짧은 주기는 1/3초로 올린다', () => {
    expect(pulseAlpha(0, 2400, 0.16)).toBeCloseTo(0)
    expect(pulseAlpha(1200, 2400, 0.16)).toBeCloseTo(0.16)
    expect(pulseAlpha(2400, 2400, 0.16)).toBeCloseTo(0)
    for (let t = 0; t < 5000; t += 37) {
      const a = pulseAlpha(t, 100, 0.2)
      expect(a).toBeGreaterThanOrEqual(0)
      expect(a).toBeLessThanOrEqual(0.2)
    }
    // 주기 100은 333으로 올라가므로 166.5ms가 반주기(최대)다
    expect(pulseAlpha(166.5, 100, 0.2)).toBeCloseTo(0.2)
  })

  it('nextLine: 줄이 순환하고 빈 목록은 0이다', () => {
    expect(nextLine(0, ['a', 'b', 'c'])).toBe(1)
    expect(nextLine(2, ['a', 'b', 'c'])).toBe(0)
    expect(nextLine(5, [])).toBe(0)
  })

  it('readAlarmFx: "0"일 때만 끈다', () => {
    expect(readAlarmFx(null)).toBe(true)
    expect(readAlarmFx('1')).toBe(true)
    expect(readAlarmFx('0')).toBe(false)
  })
})

describe('T-112 인물 표시', () => {
  it('소총수는 신병 이름을 상속하고 말년은 표시에서만 붙는다', () => {
    const name = '김신병'
    expect(getCharacterName('rifle', 2, name)).toBe(name)
    expect(getCharacterName('rifle', 4, name)).toBe('말년 김신병')
    expect(name).toBe('김신병')
    expect(getCharacterName('rifle', 1)).toBe('김신병')
  })
  it('보직 인물·소개를 표시하고 모르는 카드는 안전하게 반환한다', () => {
    expect(getCharacterName('sniper', 3)).toBe('이상병')
    expect(getCharacterName('sniper', 4)).toBe('말년 이상병')
    expect(getCharacterIntro('cook')).toBe('밥심을 믿는 취사반장')
    expect(getCharacterName('unknown')).toBe('unknown')
    expect(getCharacterIntro('unknown')).toBe('—')
  })
})

describe('T-113 열 보직 도감', () => {
  it('기존 여섯 종과 새 네 종을 빠짐없이 표시한다', () => {
    expect(ALL_CARDS).toEqual(['rifle', 'sniper', 'blower', 'cook', 'miner', 'chem', 'medic', 'mortar', 'antitank', 'signal'])
    for (const [card, label, initial, name, intro] of [
      ['medic', '의무병', '의', '윤의무', '아무도 두고 가지 않는 의무반'],
      ['mortar', '박격포병', '박', '고박격', '좌표를 외워 두는 81mm 박격포 담당'],
      ['antitank', '대전차병', '대', '남전차', '큰 것만 노리는 대전차 사수'],
      ['signal', '통신병', '통', '송통신', '무전기를 끼고 사는 통신반'],
    ] as const) {
      expect(getCardName(card)).toBe(label)
      expect(getCardInitial(card)).toBe(initial)
      expect(getCharacterName(card, 1)).toBe(name)
      expect(getCharacterName(card, 4)).toBe(`말년 ${name}`)
      expect(getCharacterIntro(card)).toBe(intro)
    }
  })

  it('도감 기준 수치는 실제 이등병이며 해금과 별도로 조회한다', () => {
    for (const [card, hp, atk] of [
      ['medic', '90', '0'], ['mortar', '70', '45'], ['antitank', '80', '100'], ['signal', '80', '0'],
    ] as const) {
      const rows = new Map(getCodexRows(card))
      expect(rows.get('최대 HP')).toBe(hp)
      expect(rows.get('직접 공격')).toBe(atk)
      expect(rows.has('상병 능력')).toBe(false)
      expect(rows.has('병장 능력')).toBe(false)
      expect([...rows.values()].every((value) => typeof value === 'string' && !/undefined|NaN/.test(value))).toBe(true)
    }
    expect(mergeUnlockedCards(['rifle', 'blower', 'sniper'], null)).toEqual(['rifle', 'blower', 'sniper'])
    expect(mergeUnlockedCards(['rifle', 'chem'], '["medic","signal"]')).toEqual(['rifle', 'chem', 'medic', 'signal'])
  })

  it('새 보직의 실제 역할 수치를 도감에 전달한다', () => {
    const medic = new Map(getCodexRows('medic'))
    expect(medic.get('소생 처치')).toBe('4초')
    expect(medic.get('소생 HP')).toBe('30%')
    expect(medic.get('소생 횟수')).toBe('웨이브 1회')
    const mortar = new Map(getCodexRows('mortar'))
    expect(mortar.get('사거리')).toBe('2~8칸')
    expect(mortar.get('낙하 지연')).toBe('0.8초')
    expect(mortar.get('폭발 반지름')).toBe('1칸')
    expect(new Map(getCodexRows('antitank')).get('장갑 배율')).toBe('×2')
    const signal = new Map(getCodexRows('signal'))
    expect(signal.get('공격 간격')).toBe('직접 공격 없음')
    expect(signal.get('아군 공격 간격')).toBe('×0.85')
    expect(signal.get('지휘 범위')).toBe('1칸')
    expect(signal.get('지원 보너스')).toContain('+1회')
  })
})
