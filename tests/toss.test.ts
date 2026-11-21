import { describe, it, expect } from 'vitest'
import { hasAds, isToss, TOSS_CLOSE_BAND, tossSafeInsets } from '../src/platform'

describe('앱인토스 보조 함수', () => {
  it('닫기 버튼 줄만큼 위쪽 Safe Area를 늘리고 나머지는 그대로 둔다', () => {
    expect(tossSafeInsets({ top: 44, right: 3, bottom: 34, left: 5 })).toEqual({
      top: 44 + TOSS_CLOSE_BAND,
      right: 3,
      bottom: 34,
      left: 5,
    })
  })

  it('SDK를 초기화하기 전(웹·테스트)에는 토스도 광고 환경도 아니다', () => {
    expect(isToss()).toBe(false)
    expect(hasAds()).toBe(false)
  })
})
