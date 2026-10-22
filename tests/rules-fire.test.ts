import { describe, it, expect } from 'vitest'
import { LAYOUT, SUPPORT } from '../src/data'
import { colAt, parsePlayLog, summarizeLog, type LogEvent, type PlayRun } from '../src/rules'

const run = (events: LogEvent[]): PlayRun => ({ t: 0, result: 'win', wave: 10, sec: 600, events })
const fire = (col: number): LogEvent => ({ e: 'fire_support', wave: 3, col, kills: 1 })

describe('GDD §5.8 화력 지원 수치 (5단계)', () => {
  it('판당 2회, 피해 200, 지연 1초, 열 고르기 5초', () => {
    expect(SUPPORT).toEqual({ charges: 2, damage: 200, delay: 1.0, pickSec: 5 })
  })
})

describe('colAt: x -> 열', () => {
  const { marginX, cell, cols } = LAYOUT
  it('각 열 중앙은 0~4', () => {
    for (let c = 0; c < cols; c++) expect(colAt(marginX + (c + 0.5) * cell)).toBe(c)
  })
  it('왼쪽 여백 안은 -1', () => {
    expect(colAt(0)).toBe(-1)
    expect(colAt(marginX - 1)).toBe(-1)
  })
  it('오른쪽 끝 너머는 -1', () => {
    expect(colAt(marginX + cols * cell)).toBe(-1)
    expect(colAt(LAYOUT.width)).toBe(-1)
  })
  it('경계값: 열 경계 x는 오른쪽 열, 판 왼쪽 끝은 0열', () => {
    expect(colAt(marginX)).toBe(0)
    expect(colAt(marginX + cell)).toBe(1)
    expect(colAt(marginX + cell - 0.001)).toBe(0)
    expect(colAt(marginX + cols * cell - 0.001)).toBe(cols - 1)
  })
})

describe('summarizeLog.supportAvg', () => {
  it('fire_support 0개·3개 판 2개는 평균 1.5', () => {
    const s = summarizeLog([run([{ e: 'run_start', run: 1 }]), run([fire(0), fire(1), fire(2)])])
    expect(s.supportAvg).toBe(1.5)
  })
  it('판 0개는 0', () => {
    expect(summarizeLog([]).supportAvg).toBe(0)
  })
})

describe('parsePlayLog는 fire_support 이벤트를 깨지 않는다', () => {
  it('저장했다 읽어도 같다', () => {
    const runs = [run([{ e: 'run_start', run: 1 }, fire(1)])]
    expect(parsePlayLog(JSON.stringify(runs))).toEqual(runs)
  })
})
