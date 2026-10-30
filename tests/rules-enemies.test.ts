import { describe, expect, it } from 'vitest'
import { ENEMIES, ENEMY_KEYS } from '../src/data'
import { WAVES } from '../src/stages'
import { antitankDamage, enemyAttackDamage, enemyAttackStep, enemyAttackTargets, enemyDirectDamage, engageTarget, mineDamage, spawnPlan } from '../src/rules'
import { createRng } from '../src/debug'

const ally = (col: number, y: number, alive = true) => ({ col, y, alive, taunt: false })

describe('T-121 원거리 교전', () => {
  it('보병이 1.5칸 근접 이전에 앞줄과 사격 교전한다', () => {
    const front = ally(2, 4.5)
    expect(engageTarget({ col: 2, y: 1.1 }, [front], ENEMIES.infantry.range)).toBe(front)
    expect(engageTarget({ col: 2, y: 0.9 }, [front], ENEMIES.infantry.range)).toBeNull()
  })
  it('RPG는 4.5칸, 지정사수는 5.25칸의 옆 열 대상도 공격한다', () => {
    const target = ally(3, 4.5)
    const enemy = { col: 2, y: 0 }
    expect(engageTarget(enemy, [target], ENEMIES.rpg.range)).toBeNull()
    expect(engageTarget(enemy, [target], ENEMIES.marksman.range)).toBe(target)
    expect(engageTarget({ col: 3, y: 0 }, [target], ENEMIES.rpg.range)).toBe(target)
  })
  it.each(ENEMY_KEYS)('%s 첫 발은 정해진 조준 뒤, 두 번째 발은 정상 간격 뒤', (type) => {
    const { firstShot, interval } = ENEMIES[type]
    let step = enemyAttackStep(type, 0, firstShot / 2, true)
    expect(step.fire).toBe(false)
    step = enemyAttackStep(type, step.ready, firstShot / 2, false)
    expect(step.fire).toBe(true)
    step = enemyAttackStep(type, step.ready, interval / 2, false)
    expect(step.fire).toBe(false)
    expect(enemyAttackStep(type, step.ready, interval / 2, false).fire).toBe(true)
  })
  it('공격 대상을 바꾸면 이전 조준 누적을 가져오지 않는다', () => {
    expect(enemyAttackStep('rpg', 2.99, 0.1, true).fire).toBe(false)
    expect(enemyAttackStep('rpg', 2.99, 0.1, false).fire).toBe(true)
  })
  it('후반 피해가 증가하되 초반 기본 피해는 유지한다', () => {
    expect(enemyAttackDamage('infantry', 1)).toBe(10)
    expect(enemyAttackDamage('infantry', 10)).toBe(19)
    expect(enemyAttackDamage('marksman', 7)).toBeCloseTo(44.8)
  })
})

describe('T-121 적 역할과 대응', () => {
  it('RPG는 맞은 칸과 인접 아군을 타격하고 대각/먼 아군·쓰러진 아군을 제외한다', () => {
    const center = ally(2, 5.5), side = ally(3, 5.5), back = ally(2, 6.5)
    const diagonal = ally(3, 6.5), fallen = ally(1, 5.5, false), far = ally(0, 5.5)
    const team = [center, side, back, diagonal, fallen, far]
    expect(enemyAttackTargets('rpg', center, team)).toEqual([center, side, back])
    expect(enemyAttackTargets('marksman', center, team)).toEqual([center])
    expect(enemyAttackTargets('rpg', fallen, team)).toEqual([])
  })
  it('방패는 일반 직접 피해를 줄이고 대전차/대전차지뢰는 장갑 배율을 받는다', () => {
    expect(enemyDirectDamage('shield', 100, 0)).toBeCloseTo(55)
    expect(enemyDirectDamage('shield', 100, 1)).toBeCloseTo(66)
    expect(enemyDirectDamage('infantry', 100, 0)).toBe(100)
    expect(antitankDamage(100, 'shield')).toBe(200)
    expect(mineDamage('shield', true)).toBe(450)
    expect(mineDamage('shield', false)).toBe(150)
  })
  it('새3종 수치와 역할이 구분된다', () => {
    expect([ENEMIES.assault.hp, ENEMIES.assault.speed, ENEMIES.assault.dmg, ENEMIES.assault.interval, ENEMIES.assault.range]).toEqual([170, 0.65, 14, 0.7, 2.75])
    expect([ENEMIES.shield.hp, ENEMIES.shield.armor, ENEMIES.shield.knock, ENEMIES.shield.range]).toEqual([360, 0.55, 0.5, 2])
    expect([ENEMIES.marksman.hp, ENEMIES.marksman.dmg, ENEMIES.marksman.interval, ENEMIES.marksman.range]).toEqual([160, 28, 2.4, 5.25])
  })
})

describe('T-121 단계적 편성', () => {
  it('돌격4·방패6·지정7웨이브부터 등장한다', () => {
    for (const [type, from] of [['assault', 4], ['shield', 6], ['marksman', 7]] as const) {
      for (let wave = 1; wave <= 10; wave++) {
        const count = spawnPlan(wave, createRng(7), wave >= 7).filter((e) => e.type === type).length
        expect(count).toBe(WAVES[wave - 1]![type])
        expect(count > 0).toBe(wave >= from)
      }
    }
  })
  it('보병 일부를 교체해 전체 적 수를 유지하고 후반 병과가 늘어난다', () => {
    const expected = [6, 10, 10, 14, 21, 33, 31, 37, 49, 46]
    expected.forEach((count, i) => expect(spawnPlan(i + 1, createRng(7), i >= 6)).toHaveLength(count))
    expect(new Set(spawnPlan(10, createRng(7), true).map((e) => e.type)).size).toBe(8)
  })
})
