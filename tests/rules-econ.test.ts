import { describe, it, expect } from 'vitest'
import {
  buyOutcome,
  nextUnlock,
  parseUnlocked,
  summarizeLog,
  pushRun,
  parsePlayLog,
  nextRun,
  type Placed,
  type PlayRun,
  type LogEvent,
  type RunResult,
} from '../src/rules'
import { CARD_KEYS, UNLOCK, REWARD, LOG, UI, type CardKey } from '../src/data'

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
  it('지뢰설치병까지 해금이면 화학병', () => {
    expect(nextUnlock(['rifle', 'sniper', 'blower', 'cook', 'miner'])).toBe('chem')
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
    expect(UNLOCK.order.slice(0, 3)).toEqual(['cook', 'miner', 'chem'])
    expect(UNLOCK.atWave).toBe(5)
  })
  it('§10·§4.2 보상', () => {
    expect(REWARD).toEqual({ adRerollMax: 3, adSupplyMax: 1, adSupplyAmount: 5, reviveHp: 10 })
  })
  it('§11 기록', () => {
    expect(LOG).toEqual({ runsKey: 'd2_playlog', unlockedKey: 'd2_unlocked', maxRuns: 50, recent: 10, lowRate: 0.05 })
  })
})

// 테스트용 판. buys는 [카드, 횟수] 목록
const mkRun = (
  result: RunResult,
  wave: number,
  sec: number,
  buys: [CardKey, number][] = [],
  t = 0,
  run?: number,
): PlayRun => {
  const events: LogEvent[] = []
  if (run !== undefined) events.push({ e: 'run_start', run })
  for (const [card, n] of buys) for (let k = 0; k < n; k++) events.push({ e: 'card_buy', card, rank: 1 })
  events.push({ e: 'merge', card: 'rifle', rank: 2 })
  return { t, result, wave, sec, events }
}

describe('summarizeLog', () => {
  it('빈 배열', () => {
    const s = summarizeLog([])
    expect(s).toMatchObject({ runs: 0, winRate: 0, avgSec: 0, avgWave: 0, buys: 0, recent: [] })
    expect(s.cards.map((c) => c.card)).toEqual([...CARD_KEYS])
    for (const c of s.cards) expect(c).toMatchObject({ buys: 0, rate: 0, low: false })
  })
  it('3판 평균. quit은 승리가 아니다', () => {
    const s = summarizeLog([mkRun('win', 10, 480), mkRun('lose', 6, 300), mkRun('quit', 3, 60)])
    expect(s.runs).toBe(3)
    expect(s.winRate).toBeCloseTo(1 / 3)
    expect(s.avgSec).toBe(280)
    expect(s.avgWave).toBeCloseTo(19 / 3)
  })
  it('card_buy만 센다. 구매율 합은 1', () => {
    const s = summarizeLog([mkRun('win', 10, 1, [['rifle', 6], ['cook', 2]]), mkRun('lose', 3, 1, [['rifle', 2]])])
    expect(s.buys).toBe(10)
    const rifle = s.cards.find((c) => c.card === 'rifle')!
    expect(rifle.buys).toBe(8)
    expect(rifle.rate).toBeCloseTo(0.8)
    expect(s.cards.reduce((a, c) => a + c.rate, 0)).toBeCloseTo(1)
  })
  it('구매율 5% 미만만 low. 정확히 5%는 아니다', () => {
    // rifle 19, cook 1 -> cook 5% (경계)
    const edge = summarizeLog([mkRun('win', 10, 1, [['rifle', 19], ['cook', 1]])])
    expect(edge.cards.find((c) => c.card === 'cook')!.low).toBe(false)
    // rifle 20, cook 1 -> 약 4.76%
    const low = summarizeLog([mkRun('win', 10, 1, [['rifle', 20], ['cook', 1]])])
    expect(low.cards.find((c) => c.card === 'cook')!.low).toBe(true)
    expect(low.cards.find((c) => c.card === 'rifle')!.low).toBe(false)
    // 구매 0인 카드도 전체 구매가 있으면 low
    expect(low.cards.find((c) => c.card === 'miner')!.low).toBe(true)
  })
  it('구매가 하나도 없으면 모두 low가 아니다', () => {
    const s = summarizeLog([mkRun('lose', 1, 1)])
    for (const c of s.cards) expect(c.low).toBe(false)
  })
  it('recent는 마지막 10판을 최신이 앞으로', () => {
    const runs = Array.from({ length: 12 }, (_, k) => mkRun('lose', 1, 1, [], k + 1))
    const s = summarizeLog(runs)
    expect(s.recent).toHaveLength(10)
    expect(s.recent[0]!.t).toBe(12)
    expect(s.recent[9]!.t).toBe(3)
  })
})

describe('pushRun', () => {
  it('입력을 바꾸지 않고 새 배열을 돌려준다', () => {
    const runs = [mkRun('win', 1, 1)]
    const out = pushRun(runs, mkRun('lose', 2, 2))
    expect(runs).toHaveLength(1)
    expect(out).toHaveLength(2)
  })
  it('50판을 넘기면 오래된 쪽부터 버린다', () => {
    const runs = Array.from({ length: 50 }, (_, k) => mkRun('lose', 1, 1, [], k))
    const out = pushRun(runs, mkRun('win', 1, 1, [], 999))
    expect(out).toHaveLength(50)
    expect(out[0]!.t).toBe(1)
    expect(out[49]!.t).toBe(999)
  })
})

describe('parsePlayLog', () => {
  it('null·깨진 JSON·배열 아님이면 빈 배열', () => {
    expect(parsePlayLog(null)).toEqual([])
    expect(parsePlayLog('{oops')).toEqual([])
    expect(parsePlayLog('{"a":1}')).toEqual([])
  })
  it('모양이 맞는 항목만 남긴다', () => {
    const good = mkRun('win', 5, 100, [], 7)
    const raw = JSON.stringify([
      good,
      { t: 1, result: 'draw', wave: 1, sec: 1, events: [] },
      { t: 1, result: 'win', wave: 'x', sec: 1, events: [] },
      { t: 1, result: 'win', wave: 1, sec: 1 },
      null,
      7,
    ])
    expect(parsePlayLog(raw)).toEqual([good])
  })
  it('최대 50판, 마지막 것 기준', () => {
    const runs = Array.from({ length: 60 }, (_, k) => mkRun('lose', 1, 1, [], k))
    const out = parsePlayLog(JSON.stringify(runs))
    expect(out).toHaveLength(50)
    expect(out[0]!.t).toBe(10)
  })
})

describe('nextRun', () => {
  it('빈 배열이면 1', () => {
    expect(nextRun([])).toBe(1)
  })
  it('마지막 판의 run_start + 1', () => {
    expect(nextRun([mkRun('win', 1, 1, [], 0, 4), mkRun('lose', 1, 1, [], 0, 9)])).toBe(10)
  })
  it('run_start가 없으면 길이 + 1', () => {
    expect(nextRun([mkRun('win', 1, 1), mkRun('lose', 1, 1)])).toBe(3)
  })
})

describe('기록 화면 색·문구 (ART §2)', () => {
  it('낮은 구매율 색은 노랑이고 붉은 계열이 아니다', () => {
    expect(UI.log.lowColor).toBe('#ffe066')
    const c = parseInt(UI.log.lowColor.slice(1), 16)
    const r = (c >> 16) & 0xff
    const g = (c >> 8) & 0xff
    const bl = c & 0xff
    expect(r - Math.max(g, bl) > 32).toBe(false)
  })
  it('기록 화면 문구 키가 모두 비어 있지 않다', () => {
    const keys = ['logTitle', 'logRuns', 'logWinRate', 'logAvgTime', 'logAvgWave', 'logCardHead', 'logBuys', 'logRate', 'logRecent', 'logWave', 'logWin', 'logLose', 'logQuit', 'logEmpty', 'logMin', 'logSec', 'logLow'] as const
    for (const k of keys) {
      const v = UI.text[k]
      expect(typeof v === 'string' && v.length > 0).toBe(true)
    }
  })
})
