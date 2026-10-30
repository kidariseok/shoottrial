import { describe, expect, it } from 'vitest'
import { isMobileUa, lowFpsStreak, scaledCount, textAllowed } from '../src/battle/budget'

describe('연출 예산(렉 방지)', () => {
  it('lowFpsStreak: 기준 아래면 시간이 쌓이고, 기준 이상이면 0으로 돌아간다', () => {
    let s = 0
    s = lowFpsStreak(s, 30, 0.5, 40)
    s = lowFpsStreak(s, 25, 0.5, 40)
    expect(s).toBeCloseTo(1)
    expect(lowFpsStreak(s, 60, 0.1, 40)).toBe(0)
  })

  it('lowFpsStreak: 측정 전(fps 0 이하)이거나 정확히 기준이면 세지 않는다', () => {
    expect(lowFpsStreak(0, 0, 0.5, 40)).toBe(0)
    expect(lowFpsStreak(1, 40, 0.5, 40)).toBe(0)
  })

  it('textAllowed: 켜져 있고 상한 아래일 때만 허용한다', () => {
    expect(textAllowed(0, 24, true)).toBe(true)
    expect(textAllowed(23, 24, true)).toBe(true)
    expect(textAllowed(24, 24, true)).toBe(false)
    expect(textAllowed(0, 24, false)).toBe(false)
  })

  it('scaledCount: 배율을 곱하고 최소 1이다', () => {
    expect(scaledCount(14, 1, false, 0.5)).toBe(14)
    expect(scaledCount(14, 0.4, false, 0.5)).toBe(6)
    expect(scaledCount(14, 0.4, true, 0.5)).toBe(3)
    expect(scaledCount(1, 0.1, true, 0.5)).toBe(1)
  })

  it('isMobileUa: 아이폰·안드로이드 폰은 true, 데스크톱·아이패드(Mac 표기)는 false', () => {
    expect(isMobileUa('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1')).toBe(true)
    expect(isMobileUa('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36')).toBe(true)
    expect(isMobileUa('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17 Safari/605.1.15')).toBe(false)
    expect(isMobileUa('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36')).toBe(false)
  })
})
