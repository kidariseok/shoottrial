import { describe, expect, it } from 'vitest'
import { ABILITY, CHARACTERS, CARD_KEYS, SPECIALTIES } from '../src/data'
import { allyDamageTaken, attackRange, blowerTaunt, blowerVuln, chemDamageMult, chemInterval, chemReach, cleanseCells, cookHeal, cookHealing, cookReach, cookSupplyBonus, cookTargets, damageTaken, dotTick, emptyGas, engageTarget, gasCellsAfterDrop, gasHits, healOrder, interval, knockback, merge, mergeSpecialty, mineDamage, mineTokenPlan, onRay, rifleDamage, sniperDamage, sniperWidth, stats, unitInfoRows, type Unit } from '../src/rules'

describe('특기 선택과 누적 계급', () => {
  const unit = (rank: number, spec?: 'A' | 'B'): Unit => ({ card: 'rifle', rank, spec })
  it('이등병 진급은 선택하며 A+A/B+B는 상병·병장까지 유지한다', () => {
    expect(mergeSpecialty(unit(1), unit(1))).toBeUndefined()
    for (const rank of [2, 3]) for (const spec of ['A', 'B'] as const) {
      expect(merge(unit(rank, spec), unit(rank, spec))).toBe(rank + 1)
      expect(mergeSpecialty(unit(rank, spec), unit(rank, spec))).toBe(spec)
    }
  })
  it('서로 다른 특기와 미선택 재료는 재선택하며 입력을 보존한다', () => {
    const a = unit(3, 'A'), b = unit(3, 'B')
    expect(mergeSpecialty(a, b)).toBeUndefined()
    expect(mergeSpecialty(unit(2), unit(2, 'A'))).toBeUndefined()
    expect(a).toEqual(unit(3, 'A')); expect(b).toEqual(unit(3, 'B'))
    expect(merge(unit(4), unit(4))).toBeNull()
  })
  it('기존6종 인물과 특기12개·진급 대사18개만 제공한다', () => {
    expect(CARD_KEYS).toHaveLength(6)
    for (const card of CARD_KEYS) {
      expect(CHARACTERS[card].quotes).toHaveLength(3)
      expect(Object.keys(SPECIALTIES[card])).toEqual(['A', 'B'])
    }
    expect(CHARACTERS.chem.quotes[2]).toBe('독가스는 여기서 끝납니다.')
  })
})

describe('소총수', () => {
  it('A/B 사거리와 간격, 병장 시너지 데프콘이 곱해진다', () => {
    expect(attackRange('rifle', 'A')).toBe(5)
    expect(attackRange('rifle', 'B')).toBe(2.5)
    expect(interval('rifle', 2, 1, false, false, 'A')).toBeCloseTo(0.92)
    expect(interval('rifle', 2, 1, false, false, 'B')).toBeCloseTo(0.6)
    expect(interval('rifle', 4, 4, true, false, 'B')).toBeCloseTo(0.2304)
    expect(interval('rifle', 4, 4, true, true, 'B')).toBeCloseTo(0.4608)
  })
  it('돌격은 1.5칸 경계 포함, 2점사 각 발에 계급 공격이 적용된다', () => {
    const atk = stats('rifle', 3, 'B').atk
    expect(atk).toBe(22.5)
    expect(rifleDamage(atk, 1.5, 'B')).toBeCloseTo(29.25)
    expect(rifleDamage(atk, 1.50001, 'B')).toBe(atk)
    expect(rifleDamage(atk, 1, 'A')).toBe(atk)
    expect(rifleDamage(atk, 1, 'B') * ABILITY.burstCount).toBeCloseTo(58.5)
  })
})

describe('저격수', () => {
  it('정밀은 첫 대상만 1.5배, 관통은 선형 10% 감쇠', () => {
    expect(sniperDamage(90, 0, 2, 0, 'A')).toBe(135)
    expect(sniperDamage(90, 1, 2, 0, 'A')).toBe(72)
    expect(sniperDamage(90, 2, 2, 0, 'B')).toBe(72)
    expect(sniperDamage(90, 10, 2, 0, 'B')).toBe(0)
    expect(sniperDamage(135, 20, 3, 1, 'A')).toBeCloseTo(175.5)
    expect(sniperDamage(202.5, 0, 4, 1, 'A')).toBeCloseTo(394.875)
    expect(ABILITY.sniperStun).toBe(1)
  })
  it('관통 폭 경계는 0.8칸이며 기본은 0.4', () => {
    const from = { col: 0, y: 0 }, first = { col: 0, y: 1 }
    expect(sniperWidth()).toBe(0.4)
    expect(onRay(from, first, { col: 0.8, y: 2 }, sniperWidth('B'))).toBe(true)
    expect(onRay(from, first, { col: 0.80001, y: 2 }, sniperWidth('B'))).toBe(false)
  })
})

describe('제설병', () => {
  it('방벽 HP·장갑·도발은 최초·계급 HP 계산에 적용된다', () => {
    expect(stats('blower', 2, 'A').hp).toBe(324)
    expect(stats('blower', 4, 'A').hp).toBe(729)
    expect(allyDamageTaken(100, 'blower', 'A')).toBe(75)
    expect(allyDamageTaken(100, 'blower', 'B')).toBe(90)
    expect(blowerTaunt('A')).toBe(2.5)
    expect(blowerTaunt('B')).toBe(1.5)
  })
  it('일반 근접 필터 밖 2.5칸에서도 방벽 도발을 우선한다', () => {
    const guard = { col: 0, y: 2.5, alive: true, taunt: true, tauntReach: 2.5 }
    const normal = { col: 0, y: 1, alive: true }
    expect(engageTarget({ col: 0, y: 0 }, [normal, guard])).toBe(guard)
    expect(engageTarget({ col: 0, y: 0 }, [{ ...guard, y: 2.50001 }])).toBeNull()
    expect(engageTarget({ col: 0, y: 0 }, [{ ...guard, alive: false }, normal])).toBe(normal)
  })
  it('돌풍은 취약·간격·병장/시너지/적 밀기 배율을 누적한다', () => {
    expect(blowerVuln('B')).toBe(3.5)
    expect(blowerVuln('A')).toBe(2)
    expect(interval('blower', 2, 1, false, false, 'B')).toBeCloseTo(1.2)
    expect(knockback('dog', 4, 2, 'B')).toBeCloseTo(6.75)
    expect(knockback('boss', 4, 2, 'B')).toBeCloseTo(1.125)
    expect(knockback('dogPlus', 3, 1, 'B')).toBeCloseTo(1.5)
  })
})

describe('취사병', () => {
  it('회복량·인원·병장 범위·시너지를 분리한다', () => {
    expect(cookHeal('A')).toBe(18); expect(cookHeal('B')).toBe(12)
    expect([1, 2, 3, 4].map((r) => cookTargets(r, 1))).toEqual([1, 1, 2, 2])
    expect(cookTargets(1, 2)).toBe(Infinity)
    expect(cookReach(4, 1)).toBe(2)
    expect(cookReach(1, 2)).toBe(Infinity)
  })
  it('HP비율이 먼저이고 동률은 도발 우선이며 정렬이 입력을 바꾸지 않는다', () => {
    const input = [{ hp: 50, maxHp: 100 }, { hp: 100, maxHp: 200, taunt: true }, { hp: 9, maxHp: 90 }]
    expect(healOrder(input)).toEqual([input[2], input[1], input[0]])
    expect(input[0]!.hp).toBe(50)
  })
  it('사망·완전 회복자는 제외하고 과회복하지 않으며 소생시키지 않는다', () => {
    const patients = [{ hp: 0, maxHp: 100, alive: false }, { hp: 95, maxHp: 100, alive: true }, { hp: 100, maxHp: 100, alive: true }, { hp: 30, maxHp: 100, alive: true }]
    expect(cookHealing(patients, 2, 1, 'A')).toEqual([{ target: patients[3], amount: 18 }])
    expect(cookHealing(patients, 3, 1, 'A')).toEqual([{ target: patients[3], amount: 18 }, { target: patients[1], amount: 5 }])
    expect(patients[0]!.alive).toBe(false)
    expect(patients[3]!.hp).toBe(30)
  })
  it('배치된 보급 특기만 한 명당 +1이며 등급과 생존 여부를 요구하지 않는다', () => {
    expect(cookSupplyBonus([{ card: 'cook', rank: 2, spec: 'B' }, { card: 'cook', rank: 4, spec: 'B' }, { card: 'cook', rank: 4, spec: 'A' }, { card: 'rifle', rank: 2, spec: 'B' }])).toBe(2)
    expect(cookSupplyBonus([])).toBe(0)
  })
})

describe('지뢰 생산자 스냅샷', () => {
  it('병장 A7/B6, 시너지 추가는 일반 토큰 하나다', () => {
    expect(mineTokenPlan([{ rank: 4, spec: 'A' }])).toHaveLength(7)
    expect(mineTokenPlan([{ rank: 4, spec: 'B' }])).toEqual(Array.from({ length: 6 }, () => ({ anti: true, stun: true })))
    const miners = [{ rank: 1 }, { rank: 2, spec: 'B' as const }, { rank: 3, spec: 'A' as const }]
    const plan = mineTokenPlan(miners)
    expect(plan).toHaveLength(8)
    expect(plan.slice(0, 1)).toEqual([{ anti: false, stun: false }])
    expect(plan.slice(1, 3)).toEqual([{ anti: false, stun: true }, { anti: false, stun: true }])
    expect(plan.slice(3, 7).every((m) => m.anti && !m.stun)).toBe(true)
    expect(plan[7]).toEqual({ anti: false, stun: false })
    miners[0]!.rank = 4
    expect(plan[0]).toEqual({ anti: false, stun: false })
    plan[1]!.anti = true
    expect(plan[2]!.anti).toBe(false)
  })
  it('강화 군견은 장갑, 일반 군견은 비장갑이고 취약·밀기 배율이 누적된다', () => {
    expect(mineDamage('dogPlus', true)).toBe(450)
    expect(mineDamage('dog', true)).toBe(150)
    expect(damageTaken(mineDamage('boss', true) * 1.5, 2)).toBe(810)
    expect(SPECIALTIES.miner.B.stun).toBe(1)
  })
})

describe('화학병과 독립 지속 피해', () => {
  it('제독 A는 면역과 제독 모두 +1칸이며 제독 주기는 사격과 독립이다', () => {
    expect(chemReach(2, 'A')).toBe(2); expect(chemReach(3, 'A')).toBe(3)
    expect(chemInterval('A')).toBe(2); expect(chemInterval('B')).toBe(3)
    expect(interval('chem', 2, 1, false, false, 'A')).toBe(1)
    const cells = emptyGas(); cells[0]![2] = 20
    const chem = { col: 0, row: 0, rank: 2, spec: 'A' as const }
    expect(gasHits(cells, [chem], 2, 0)).toBe(false)
    expect(cleanseCells(cells, chem).cells[0]![2]).toBe(0)
    expect(gasHits(cells, [], 2, 0)).toBe(true)
  })
  it('이미 가스가 있는 칸에 재낙하해도 즉시 제독 최종 값은 0이다', () => {
    const cells = emptyGas(); cells[0]![1] = 10
    const result = gasCellsAfterDrop(cells, { col: 1, row: 0 }, [{ col: 0, row: 0, rank: 2, spec: 'A' }], true)
    expect(result.cleared).toBe(4)
    expect(result.cells[0]![1]).toBe(0)
    expect(cells[0]![1]).toBe(10)
  })
  it('중독3초 총12·갱신 비중첩·큰dt와 화상 만료를 정확히 계산한다', () => {
    let left = 3, damage = 0
    for (const dt of [0.7, 0.6, 0.9, 1.5]) { const tick = dotTick(left, dt, 4); left = tick.remaining; damage += tick.damage }
    expect(left).toBe(0); expect(damage).toBeCloseTo(12)
    expect(dotTick(3, 10, 4)).toEqual({ remaining: 0, damage: 12 })
    expect(dotTick(3, 10, 8)).toEqual({ remaining: 0, damage: 24 })
    expect(dotTick(0, 1, 4).damage).toBe(0)
    expect(dotTick(3, 1, 4).remaining).toBe(2)
    expect(dotTick(3, 3, 4).damage).toBe(12) // 재명중은 3초로 대입
    expect(dotTick(3, 3, 4, 1).damage).toBeCloseTo(12.8)
  })
  it('병장 직접 공격 버프는 중첩하지 않고 확대 제독 범위로 늘어나지 않는다', () => {
    const chems = [{ col: 0, row: 0, rank: 4, spec: 'A' as const }, { col: 2, row: 0, rank: 4 }]
    expect(chemDamageMult(chems, 1, 0)).toBe(1.15)
    expect(chemDamageMult([chems[0]!], 2, 0)).toBe(1)
    expect(dotTick(3, 3, 4).damage).toBe(12)
    expect(mineDamage('boss', true)).toBe(450)
  })
  it('카드 정보는 특기 실제 HP·간격·범위를 제공한다', () => {
    const rows = Object.fromEntries(unitInfoRows({ card: 'rifle', rank: 2, spec: 'A' }, 1, false))
    expect(rows['최대 HP']).toBe('150'); expect(rows['공격 간격']).toBe('0.92초'); expect(rows['사거리']).toBe('5칸')
  })
})
