import { describe, it, expect } from 'vitest'
import {
  allyY,
  blockY,
  frontAlly,
  inRange,
  withinReach,
  defconOf,
  canDrag,
  dropAllowed,
  type FlowPhase,
  type ZoneName,
  type Outcome,
} from '../src/rules'

describe('allyY', () => {
  it('배치 행 중심 y', () => {
    expect([0, 1, 2].map(allyY)).toEqual([4.5, 5.5, 6.5])
    expect(allyY(2)).toBe(6.5)
  })
})

describe('blockY', () => {
  it('맨 앞 아군 위쪽 경계 0.5칸 앞에서 멈춘다', () => {
    expect([0, 1, 2].map(blockY)).toEqual([3.5, 4.5, 5.5])
    expect(blockY(0)).toBe(3.5)
  })
})

describe('frontAlly', () => {
  const a = (col: number, row: number, alive = true) => ({ col, row, alive })
  it('같은 열에서 가장 위(행 번호 작은) 산 아군', () => {
    const list = [a(1, 2), a(1, 1), a(1, 0, false)]
    expect(frontAlly(list, 1)).toBe(list[1])
  })
  it('앞 아군이 쓰러지면 다음 행', () => {
    const list = [a(1, 1, false), a(1, 2)]
    expect(frontAlly(list, 1)).toBe(list[1])
  })
  it('다른 열은 무시하고 없으면 null', () => {
    expect(frontAlly([a(0, 0)], 1)).toBeNull()
    expect(frontAlly([a(1, 0, false)], 1)).toBeNull()
    expect(frontAlly([], 1)).toBeNull()
  })
})

describe('inRange', () => {
  it('아군 위쪽에서 사거리 안', () => {
    expect(inRange(4.5, 0.5, 4)).toBe(true)
    expect(inRange(4.5, 0.4, 4)).toBe(false)
  })
  it('적이 아군보다 아래면 밖', () => {
    expect(inRange(4.5, 5, 4)).toBe(false)
  })
  it('무제한 사거리는 위쪽 모든 적', () => {
    expect(inRange(4.5, 0, Infinity)).toBe(true)
    expect(inRange(4.5, 5, Infinity)).toBe(false)
  })
  it('같은 높이는 안', () => {
    expect(inRange(4.5, 4.5, 0)).toBe(true)
  })
})

describe('withinReach', () => {
  it('열·행 차이의 큰 쪽이 범위 이하', () => {
    expect(withinReach(1, 1, 1)).toBe(true)
    expect(withinReach(2, 0, 1)).toBe(false)
    expect(withinReach(2, 1, 2)).toBe(true)
    expect(withinReach(-1, -1, 1)).toBe(true)
    expect(withinReach(5, 5, Infinity)).toBe(true)
  })
})

describe('defconOf', () => {
  it('웨이브 7부터 데프콘 1', () => {
    expect([1, 6, 7, 10].map(defconOf)).toEqual([2, 2, 1, 1])
  })
})

const phases: FlowPhase[] = ['prep', 'fight', 'settle']
const zones: ZoneName[] = ['deploy', 'bench', 'sell']
const outcomes: Outcome[] = ['move', 'merge', 'swap']

describe('canDrag', () => {
  it('준비는 모두, 전투는 대기석만, 정산은 없음', () => {
    const table: [FlowPhase, ZoneName, boolean][] = [
      ['prep', 'deploy', true],
      ['prep', 'bench', true],
      ['prep', 'sell', true],
      ['fight', 'deploy', false],
      ['fight', 'bench', true],
      ['fight', 'sell', false],
      ['settle', 'deploy', false],
      ['settle', 'bench', false],
      ['settle', 'sell', false],
    ]
    for (const [p, z, want] of table) expect(canDrag(p, z)).toBe(want)
  })
})

describe('dropAllowed', () => {
  it('준비는 어디든 허용', () => {
    for (const from of zones) for (const to of zones) for (const o of outcomes) expect(dropAllowed('prep', from, to, o)).toBe(true)
  })
  it('정산은 모두 금지', () => {
    for (const from of zones) for (const to of zones) for (const o of outcomes) expect(dropAllowed('settle', from, to, o)).toBe(false)
  })
  it('전투는 대기석 -> 배치 구역의 이동·합성만', () => {
    for (const from of zones)
      for (const to of zones)
        for (const o of outcomes) {
          const want = from === 'bench' && to === 'deploy' && o !== 'swap'
          expect(dropAllowed('fight', from, to, o)).toBe(want)
        }
    expect(dropAllowed('fight', 'bench', 'deploy', 'move')).toBe(true)
    expect(dropAllowed('fight', 'bench', 'deploy', 'merge')).toBe(true)
    expect(dropAllowed('fight', 'bench', 'deploy', 'swap')).toBe(false)
    expect(dropAllowed('fight', 'bench', 'sell', 'move')).toBe(false)
    expect(dropAllowed('fight', 'bench', 'bench', 'move')).toBe(false)
    expect(dropAllowed('fight', 'deploy', 'deploy', 'move')).toBe(false)
  })
  it('모든 단계를 한 번씩 훑는다', () => {
    expect(phases).toHaveLength(3)
  })
})
