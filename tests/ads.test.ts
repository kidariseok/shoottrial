import { describe, it, expect, vi, beforeEach } from 'vitest'

const showRewarded = vi.fn()
const mute = vi.fn()
const unmute = vi.fn()
const isNative = vi.fn(() => true)
vi.mock('../src/platform', () => ({ showRewarded: () => showRewarded(), isNative: () => isNative() }))
vi.mock('../src/audio', () => ({ mute: (r: string) => mute(r), unmute: (r: string) => unmute(r) }))

import { watchAd } from '../src/ads'

describe('watchAd', () => {
  beforeEach(() => {
    showRewarded.mockReset()
    mute.mockReset()
    unmute.mockReset()
    isNative.mockReturnValue(true)
  })

  it('rewarded일 때만 true', async () => {
    showRewarded.mockResolvedValue('rewarded')
    expect(await watchAd('supply')).toBe(true)
    showRewarded.mockResolvedValue('dismissed')
    expect(await watchAd('supply')).toBe(false)
  })

  it('실패하면 false이고 음소거를 푼다', async () => {
    showRewarded.mockResolvedValue('failed')
    expect(await watchAd('revive')).toBe(false)
    expect(mute).toHaveBeenCalledWith('ad')
    expect(unmute).toHaveBeenCalledWith('ad')
  })

  it('예외여도 음소거를 푼다', async () => {
    showRewarded.mockRejectedValue(new Error('x'))
    expect(await watchAd('reroll')).toBe(false)
    expect(unmute).toHaveBeenCalledWith('ad')
  })

  it('연타해도 한 번만 재생', async () => {
    showRewarded.mockImplementation(() => new Promise((r) => setTimeout(() => r('rewarded'), 20)))
    const [a, b] = await Promise.all([watchAd('supply'), watchAd('supply')])
    expect(showRewarded).toHaveBeenCalledTimes(1)
    expect([a, b]).toEqual([true, false])
  })

  it('웹에서 확인할 화면이 없으면 보상하지 않고 광고 SDK도 호출하지 않는다', async () => {
    isNative.mockReturnValue(false)
    expect(await watchAd('supply')).toBe(false)
    expect(showRewarded).not.toHaveBeenCalled()
    expect(mute).not.toHaveBeenCalled()
  })
})
