import { describe, it, expect } from 'vitest'
import { parseDebugParams, parseDeck, createRng } from '../src/debug'

describe('debug 파라미터 파싱', () => {
  it('기본값 파싱', () => {
    const config = parseDebugParams('')
    expect(config.scene).toBe('battle')
    expect(config.wave).toBeUndefined()
    expect(config.god).toBe(false)
    expect(config.fps).toBe(false)
    expect(config.safe).toBe(false)
    expect(typeof config.seed).toBe('number')
  })

  it('모든 파라미터 정상 파싱', () => {
    const search = '?scene=gallery&wave=5&unlock=all&supply=99&deck=rifle:4,sniper:2&god=1&seed=42&speed=2&fps=1&safe=1'
    const config = parseDebugParams(search)

    expect(config.scene).toBe('gallery')
    expect(config.wave).toBe(5)
    expect(config.unlock).toBe('all')
    expect(config.supply).toBe(99)
    expect(config.deck).toEqual([
      { card: 'rifle', n: 4 },
      { card: 'sniper', n: 2 },
    ])
    expect(config.god).toBe(true)
    expect(config.seed).toBe(42)
    expect(config.speed).toBe(2)
    expect(config.fps).toBe(true)
    expect(config.safe).toBe(true)
  })

  it('계급과 특기는 유효한 값만 받는다', () => {
    expect(parseDebugParams('?rank=4&spec=A')).toMatchObject({ rank: 4, spec: 'A' })
    expect(parseDebugParams('?rank=2&spec=B')).toMatchObject({ rank: 2, spec: 'B' })
    for (const value of ['', '0', '5', '2.5', 'NaN']) expect(parseDebugParams('?rank=' + value).rank).toBeUndefined()
    for (const value of ['', 'a', 'C']) expect(parseDebugParams('?spec=' + value).spec).toBeUndefined()
  })

  it('deck 파싱', () => {
    expect(parseDeck('')).toEqual([])
    expect(parseDeck('rifle:4,sniper:2,miner')).toEqual([
      { card: 'rifle', n: 4 },
      { card: 'sniper', n: 2 },
      { card: 'miner', n: 1 },
    ])
  })
})

describe('결정적 난수 생성기 rand()', () => {
  it('같은 시드면 항상 같은 난수열을 생성한다', () => {
    const rng1 = createRng(42)
    const rng2 = createRng(42)

    const seq1 = Array.from({ length: 10 }, () => rng1())
    const seq2 = Array.from({ length: 10 }, () => rng2())

    expect(seq1).toEqual(seq2)
  })

  it('서로 다른 시드는 다른 난수를 생성한다', () => {
    const rng1 = createRng(42)
    const rng2 = createRng(9999)

    expect(rng1()).not.toBe(rng2())
  })
})
