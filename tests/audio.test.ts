import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BGM_KEYS, SFX_KEYS, mute, playBgm, playSfx, unmute } from '../src/audio'

interface FakeAudio {
  src: string
  loop: boolean
  volume: number
  played: number
  paused: boolean
}

let made: FakeAudio[] = []

class FakeAudioImpl implements FakeAudio {
  loop = false
  volume = 1
  played = 0
  paused = true
  constructor(public src: string) {
    made.push(this)
  }
  play() {
    this.played += 1
    this.paused = false
    return Promise.resolve()
  }
  pause() {
    this.paused = true
  }
  addEventListener() {}
}

beforeEach(() => {
  made = []
  vi.useFakeTimers()
  vi.stubGlobal('Audio', FakeAudioImpl)
})

afterEach(() => {
  playBgm(null)
  vi.advanceTimersByTime(1000)
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('audio 키 목록', () => {
  it('효과음 11종, 배경음 3종', () => {
    expect(SFX_KEYS).toHaveLength(11)
    expect(BGM_KEYS).toEqual(['bgm_lobby', 'bgm_defcon2', 'bgm_defcon1'])
  })
})

describe('playBgm', () => {
  it('같은 키는 무시한다', () => {
    playBgm('bgm_lobby')
    playBgm('bgm_lobby')
    expect(made).toHaveLength(1)
    expect(made[0]!.loop).toBe(true)
  })

  it('다른 키는 이전 곡을 페이드 후 멈춘다', () => {
    playBgm('bgm_lobby')
    playBgm('bgm_defcon2')
    expect(made).toHaveLength(2)
    vi.advanceTimersByTime(400)
    expect(made[0]!.paused).toBe(true)
    expect(made[1]!.paused).toBe(false)
  })

  it('null 이면 정지한다', () => {
    playBgm('bgm_lobby')
    playBgm(null)
    vi.advanceTimersByTime(400)
    expect(made[0]!.paused).toBe(true)
  })

  it('음소거되면 일시정지, 풀리면 이어서 재생한다', () => {
    playBgm('bgm_lobby')
    mute('ad')
    expect(made[0]!.paused).toBe(true)
    unmute('ad')
    expect(made[0]!.paused).toBe(false)
  })
})

describe('playSfx', () => {
  it('음소거 중 재생 요청은 무시한다', () => {
    mute('hidden')
    expect(playSfx('sfx_boom')).toBe(false)
    expect(made).toHaveLength(0)
    unmute('hidden')
  })

  it('평소에는 파일 키로 재생한다', () => {
    expect(playSfx('sfx_boom')).toBe(true)
    expect(made[0]!.src).toBe('/assets/sfx_boom.m4a')
  })
})
