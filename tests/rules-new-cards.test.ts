import { describe, expect, it } from 'vitest'
import { CARDS, CARD_KEYS, CHARACTERS, NEW_CARDS, SPECIALTIES, SUPPORT, SYNERGY, UNLOCK, type CardKey } from '../src/data'
import { allyDamageTaken, antitankDamage, antitankStun, interval, medicDamageMult, medicProtection, medicReviveHp, medicTreatment, medicUses, mergeUnlocked, mortarDelay, mortarHits, mortarRadius, mortarShotOffsets, mortarTarget, nextUnlock, onRay, parseUnlocked, rollShop, signalIntervalMult, signalReach, stats, supportDamage, supportGrant, supportSources, synergyTier, unitInfoRows, type AuraUnit, type SupportSource } from '../src/rules'

const newCards = ['medic', 'mortar', 'antitank', 'signal'] as const
const aura = (col = 0, row = 0, rank = 1, spec?: 'A' | 'B'): AuraUnit => ({ col, row, rank, spec })
const foe = (col: number, y: number, hp = 100, gone = false) => ({ col, y, hp, gone })

describe('GDD 새4종 데이터와 기존6종 회귀', () => {
  it('10종 순서와 비용/HP/공격/간격/범위를 독립적인 수치로 고정한다', () => {
    expect(CARD_KEYS).toEqual(['rifle', 'sniper', 'blower', 'cook', 'miner', 'chem', 'medic', 'mortar', 'antitank', 'signal'])
    const numeric = (card: CardKey) => { const c = CARDS[card]; return [c.cost, c.hp, c.atk, c.interval, c.range] }
    expect(CARD_KEYS.map(numeric)).toEqual([
      [1, 100, 10, 0.8, 3.5], [3, 70, 60, 2.5, 12], [2, 180, 4, 1.5, 2],
      [2, 90, 0, 2, 1], [2, 80, 6, 1, 3], [2, 90, 6, 1, 3],
      [2, 90, 0, 1, 1], [3, 70, 45, 3, 8], [3, 80, 100, 4, 5], [2, 80, 0, 0, 1],
    ])
  })
  it('새4종도 HP/직접공격만 계급마다1.5배이며 두 명 시너지 한 단계뿐이다', () => {
    for (const card of newCards) {
      for (const rank of [1, 2, 3, 4]) {
        expect(stats(card, rank)).toEqual({ hp: CARDS[card].hp * 1.5 ** (rank - 1), atk: CARDS[card].atk * 1.5 ** (rank - 1) })
      }
      expect(SYNERGY[card]).toEqual([2])
      expect([0, 1, 2, 4].map((n) => synergyTier(card, n))).toEqual([0, 0, 1, 1])
    }
    expect(stats('antitank', 4)).toEqual({ hp: 270, atk: 337.5 })
    expect(stats('mortar', 3)).toEqual({ hp: 157.5, atk: 101.25 })
  })
  it('이름/소개/진급대사12개는 GDD 원문이다', () => {
    expect(newCards.map((c) => CHARACTERS[c])).toEqual([
      { name: '윤의무', intro: '아무도 두고 가지 않는 의무반', quotes: ['아프면 말하세요.', '누구도 두고 가지 않습니다.', '일어나세요. 아직 끝 아닙니다.'] },
      { name: '고박격', intro: '좌표를 외워 두는 81mm 박격포 담당', quotes: ['포탄 나갑니다!', '좌표 수정, 다시 갑니다.', '한 방에 정리합니다.'] },
      { name: '남전차', intro: '큰 것만 노리는 대전차 사수', quotes: ['큰 건 제 몫입니다.', '장갑도 뚫립니다.', '보스는 제게 맡기세요.'] },
      { name: '송통신', intro: '무전기를 끼고 사는 통신반', quotes: ['무전 감도 양호.', '화력 지원 요청, 즉시 연결.', '전 부대, 제 목소리를 들으십시오.'] },
    ])
    expect(newCards.map((c) => [SPECIALTIES[c].A.name, SPECIALTIES[c].B.name])).toEqual([['응급처치', '위생'], ['고폭', '조명탄'], ['철갑', '연속'], ['지휘', '화력 유도']])
  })
})

describe('의무병 처치·HP·횟수·보호', () => {
  it('기본4초/A2초, 시너지는 각각3초/1초이고 인원이 늘어도 중첩하지 않는다', () => {
    expect([1, 2, 4].map((n) => medicTreatment(n))).toEqual([4, 3, 3])
    expect([1, 2, 4].map((n) => medicTreatment(n, 'A'))).toEqual([2, 1, 1])
    expect(medicTreatment(2, 'B')).toBe(3)
    expect(medicReviveHp(200)).toBe(60)
    expect(medicReviveHp(200, 'A')).toBe(100)
    expect(medicReviveHp(337.5, 'B')).toBe(101.25)
    expect([1, 2, 3, 4].map(medicUses)).toEqual([1, 1, 1, 2])
    expect(medicProtection(2)).toEqual({ sec: 0, mult: 1 })
    expect(medicProtection(3)).toEqual({ sec: 3, mult: 0.5 })
    expect(medicProtection(4)).toEqual({ sec: 3, mult: 0.5 })
  })
  it('위생은 살아 있는 다른 의무병의 인접8칸만, 여러 명이어도0.9배다', () => {
    const medics = [aura(0, 0, 2, 'B'), aura(2, 0, 4, 'B')]
    expect(medicDamageMult(medics, 1, 1)).toBe(0.9)
    expect(medicDamageMult([medics[0]!], 0, 0)).toBe(1)
    expect(medicDamageMult([medics[0]!], 1.00001, 1)).toBe(1)
    expect(medicDamageMult([{ ...medics[0]!, alive: false }], 1, 1)).toBe(1)
    expect(medicDamageMult([aura(0, 0, 4, 'A')], 1, 1)).toBe(1)
  })
  it('제설병 장갑·위생·소생 보호는 곱하며 기본 호출은 회귀를 유지한다', () => {
    expect(allyDamageTaken(100, 'blower')).toBe(90)
    expect(allyDamageTaken(100, 'rifle')).toBe(100)
    expect(allyDamageTaken(100, 'blower', 'A', 0.9, 0.5)).toBe(33.75)
    expect(allyDamageTaken(100, 'rifle', undefined, 0.9, 0.5)).toBe(45)
  })
})

describe('박격포 고정 탄착점·사거리·연속탄', () => {
  it('반지름은 기본1/A1.6/병장1.5/병장A2.1, 지연은0.8→0.5초다', () => {
    expect(mortarRadius(1)).toBe(1)
    expect(mortarRadius(2, 'A')).toBe(1.6)
    expect(mortarRadius(4, 'B')).toBe(1.5)
    expect(mortarRadius(4, 'A')).toBe(2.1)
    expect([1, 2, 3, 4].map(mortarDelay)).toEqual([0.8, 0.8, 0.8, 0.5])
    expect([1, 2, 3, 4].map(mortarShotOffsets)).toEqual([[0], [0], [0, 0.5], [0, 0.5]])
    expect(SPECIALTIES.mortar.B.vulnSec).toBe(4)
  })
  it('최소2/최대8칸 경계 포함, 가까운 부적격 적을 건너뛰고 죽은 적은 빼며 동률은 아래쪽', () => {
    const from = { col: 0, y: 0 }, near = foe(0, 1.99999), min = foe(0, 2), max = foe(0, 8)
    expect(mortarTarget(from, [near, max, min])).toBe(min)
    expect(mortarTarget(from, [max])).toBe(max)
    expect(mortarTarget(from, [near, foe(0, 8.00001), foe(0, 2, 0), foe(0, 3, 100, true)])).toBeNull()
    const below = foe(0, 2), side = foe(2, 0)
    expect(mortarTarget(from, [side, below])).toBe(below)
  })
  it('발사 시점 위치에서 원형 거리로 검사해 이동한 적은 빗나가고 경계는 포함한다', () => {
    const target = foe(0, 2), point = { col: target.col, y: target.y }
    target.y = 3.00001
    const edge = foe(1, 2), diagonal = foe(1, 3)
    expect(mortarHits(point, [target, edge, diagonal, foe(0, 2, 0), foe(0, 2, 100, true)], 1)).toEqual([edge])
    expect(point).toEqual({ col: 0, y: 2 })
  })
  it('시너지·데프콘·가스·통신 오라는 곱하고 의무 처치에는 영향을 주지 않는다', () => {
    expect(interval('mortar', 4, 2, true, true, 'A', 0.75)).toBeCloseTo(2.88)
    expect(interval('mortar', 1, 1, false)).toBe(3)
    expect(interval('mortar', 4, 4, false)).toBeCloseTo(2.4)
    expect(medicTreatment(2, 'A')).toBe(1)
  })
})

describe('대전차 장갑·특기·기절·후속 관통', () => {
  it('보스/강화군견만2배/A3배, 시너지+0.5는 각 대상에 따로 계산한다', () => {
    for (const type of ['boss', 'dogPlus'] as const) {
      expect(antitankDamage(100, type)).toBe(200)
      expect(antitankDamage(100, type, 2)).toBe(250)
      expect(antitankDamage(100, type, 2, 'A')).toBe(350)
      expect(antitankDamage(100, type, 4, 'A', true)).toBe(175)
    }
    for (const type of ['infantry', 'dog', 'rpg'] as const) {
      expect(antitankDamage(100, type, 4, 'A')).toBe(100)
      expect(antitankDamage(100, type, 4, 'A', true)).toBe(50)
    }
    expect(antitankDamage(stats('antitank', 4).atk, 'boss', 2, 'A')).toBe(1181.25)
  })
  it('B간격0.7·데프콘·가스·통신이 곱해지며 상병부터1초 기절이다', () => {
    expect(interval('antitank', 2, 2, false, false, 'B')).toBeCloseTo(2.8)
    expect(interval('antitank', 4, 2, true, true, 'B', 0.75)).toBeCloseTo(3.36)
    expect([1, 2, 3, 4].map(antitankStun)).toEqual([0, 0, 1, 1])
  })
  it('기존 사선 폭으로 첫 대상 뒤쪽만 관통시킨다', () => {
    const from = { col: 0, y: 0 }, first = { col: 0, y: 2 }
    expect(onRay(from, first, { col: 0.4, y: 3 }, 0.4)).toBe(true)
    expect(onRay(from, first, { col: 0.40001, y: 3 }, 0.4)).toBe(false)
    expect(onRay(from, first, { col: 0, y: 1 }, 0.4)).toBe(false)
  })
})

describe('통신 오라와 판당 지원 출처', () => {
  it('기본0.85/A0.75 중 가장 강한 하나, 상병2칸·8방향·자신/사망 제외다', () => {
    expect([1, 2, 3, 4].map(signalReach)).toEqual([1, 1, 2, 2])
    expect(signalIntervalMult([aura(), aura(2, 0, 2, 'A')], 1, 1)).toBe(0.75)
    expect(signalIntervalMult([aura()], 0, 0)).toBe(1)
    expect(signalIntervalMult([aura()], 1.00001, 1)).toBe(1)
    expect(signalIntervalMult([aura(0, 0, 3)], 2, 2)).toBe(0.85)
    expect(signalIntervalMult([aura(0, 0, 3)], 2.00001, 2)).toBe(1)
    expect(signalIntervalMult([{ ...aura(0, 0, 4, 'A'), alive: false }], 1, 1)).toBe(1)
  })
  it('배치/2명/B특기 출처를 각각 최초1회, 합계+3과 기본2=5 상한이다', () => {
    let previous: SupportSource[] = []
    const first = supportGrant(previous, [aura()]); previous = first.sources
    expect(first).toEqual({ sources: ['deployed'], bonus: 1 })
    expect(supportGrant(previous, [])).toEqual({ sources: ['deployed'], bonus: 0 })
    expect(supportGrant(previous, [aura(1, 0)])).toEqual({ sources: ['deployed'], bonus: 0 })
    const next = supportGrant(previous, [aura(0, 0, 2, 'B'), aura(1, 0, 2, 'B')])
    expect(next).toEqual({ sources: ['deployed', 'synergy', 'specialty'], bonus: 2 })
    expect(previous).toEqual(['deployed'])
    previous = next.sources
    for (const signals of [[], [aura()], [aura(0, 0, 4, 'B'), aura(1, 0, 4, 'B')]]) {
      expect(supportGrant(previous, signals)).toEqual({ sources: previous, bonus: 0 })
    }
    expect(SUPPORT.charges + previous.length).toBe(5)
    expect(NEW_CARDS.signal.maxBonus).toBe(3)
    expect(supportSources([{ ...aura(0, 0, 4, 'B'), alive: false }])).toEqual([])
    expect(supportGrant(['deployed', 'deployed'], [aura()]).bonus).toBe(0)
  })
  it('지원 피해는 살아 있는 배치 병장이 있을 때만300이며 예약 숫자는 나중에 바뀌지 않는다', () => {
    const signals = [aura(0, 0, 4)], damage = supportDamage(signals)
    signals[0]!.alive = false
    expect(damage).toBe(300)
    expect(supportDamage(signals)).toBe(200)
    expect(supportDamage([aura(0, 0, 3, 'B')])).toBe(200)
    expect(supportDamage([])).toBe(200)
  })
})

describe('해금 저장·균등 상점·정보창', () => {
  it('구6종 저장 다음 의무→통신→박격포→대전차, 기본3종과 웨이브5 유지다', () => {
    const unlocked: CardKey[] = [...CARD_KEYS.slice(0, 6)]
    expect(UNLOCK.order).toEqual(['cook', 'miner', 'chem', 'medic', 'signal', 'mortar', 'antitank'])
    expect(UNLOCK.base).toEqual(['rifle', 'blower', 'sniper'])
    expect(UNLOCK.atWave).toBe(5)
    for (const next of ['medic', 'signal', 'mortar', 'antitank'] as const) {
      expect(nextUnlock(unlocked)).toBe(next); unlocked.push(next)
    }
    expect(nextUnlock(unlocked)).toBeNull()
    expect(parseUnlocked(JSON.stringify(CARD_KEYS.slice(0, 6)))).toEqual(CARD_KEYS.slice(0, 6))
    expect(mergeUnlocked(['signal', 'mortar', 'unknown'], '["chem"]')).toEqual(['rifle', 'sniper', 'blower', 'chem', 'mortar', 'signal'])
  })
  it('10종이 모두 같은 폭의 난수 구간으로 추첨되며 새4종도 제외되지 않는다', () => {
    for (let i = 0; i < 10; i++) expect(rollShop([...CARD_KEYS], () => (i + 0.5) / 10)).toEqual(Array(5).fill(CARD_KEYS[i]))
  })
  it('정보 행은 특기·계급·시너지 계산을 반영하며 통신병은 직접 사격 없음으로 표시한다', () => {
    const rows = (card: CardKey, rank = 1, spec?: 'A' | 'B', count = 1) => Object.fromEntries(unitInfoRows({ card, rank, spec }, count))
    expect(rows('medic', 4, 'A', 2)).toMatchObject({ '소생 처치': '1초', '소생 HP': '50%', '소생 횟수': '웨이브 2회', '상병 능력': '소생 후 3초 받는 피해 −50%' })
    expect(rows('mortar', 4, 'A')).toMatchObject({ '사거리': '2~8칸', '폭발 반지름': '2.1칸', '낙하 지연': '0.5초' })
    expect(rows('antitank', 4, 'A', 2)['장갑 배율']).toBe('×3.5')
    expect(rows('signal', 3, 'A')).toMatchObject({ '공격 간격': '직접 공격 없음', '지휘 범위': '2칸', '아군 공격 간격': '×0.75' })
    expect(rows('signal', 4, 'B')['병장 능력']).toBe('화력 지원 피해 300')
    expect(rows('signal', 4, 'B', 2)['2명 시너지']).toBe('화력 지원 +1회 · 판당 출처별 1회')
    expect(Object.fromEntries(unitInfoRows({ card: 'rifle', rank: 4, spec: 'B' }, 4, true, 0.75))['공격 간격']).toBe('0.173초')
  })
})
