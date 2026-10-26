import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/platform', () => ({ onPause: vi.fn(), onResume: vi.fn() }))

let audio: typeof import('../src/audio')
let made: FakeAudioImpl[]
let rejectNextPlay: boolean
let pointer: (() => void) | undefined

class FakeAudioImpl extends EventTarget {
  loop = false
  volume = 1
  played = 0
  paused = true
  rejectPlay: (() => void) | undefined
  constructor(public src: string) {
    super()
    made.push(this)
  }
  play() {
    this.played += 1
    this.paused = false
    if (rejectNextPlay) {
      rejectNextPlay = false
      return new Promise<void>((_, reject) => {
        this.rejectPlay = () => {
          this.paused = true
          reject(new Error('재생 거절'))
        }
      })
    }
    return Promise.resolve()
  }
  pause() {
    this.paused = true
  }
  emit(type: 'ended' | 'error') {
    this.dispatchEvent(new Event(type))
  }
}

beforeEach(async () => {
  vi.resetModules()
  made = []
  rejectNextPlay = false
  pointer = undefined
  vi.useFakeTimers()
  vi.stubGlobal('Audio', FakeAudioImpl)
  vi.stubGlobal('window', {
    addEventListener: (event: string, cb: () => void) => {
      if (event === 'pointerdown') pointer = cb
    },
  })
  vi.stubGlobal('document', { addEventListener: vi.fn() })
  audio = await import('../src/audio')
  audio.initAudio({ bgm: true, sfx: true })
})

afterEach(() => {
  audio.mute('hidden')
  audio.playBgm(null)
  expect(audio.getAudioState().activeSfx).toBe(0)
  expect(vi.getTimerCount()).toBe(0)
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('audio 키 목록', () => {
  it('효과음 11종, 배경음 3종', () => {
    expect(audio.SFX_KEYS).toHaveLength(11)
    expect(audio.BGM_KEYS).toEqual(['bgm_lobby', 'bgm_defcon2', 'bgm_defcon1'])
  })
})

describe('playBgm', () => {
  it('같은 키는 재생·페이드를 다시 시작하지 않는다', () => {
    audio.playBgm('bgm_lobby')
    vi.advanceTimersByTime(150)
    const volume = made[0]!.volume
    audio.playBgm('bgm_lobby')
    expect(made).toHaveLength(1)
    expect(made[0]!.loop).toBe(true)
    expect(made[0]!.played).toBe(1)
    expect(made[0]!.volume).toBe(volume)
  })

  it('다른 키는 이전 곡을 페이드 후 멈춘다', () => {
    audio.playBgm('bgm_lobby')
    vi.advanceTimersByTime(300)
    audio.playBgm('bgm_defcon2')
    vi.advanceTimersByTime(150)
    expect(made[0]!.paused).toBe(false)
    expect(made[0]!.volume).toBeCloseTo(0.175)
    expect(made[1]!.volume).toBeCloseTo(0.175)
    vi.advanceTimersByTime(150)
    expect(made[0]!.paused).toBe(true)
    expect(made[1]!.paused).toBe(false)
    expect(made[1]!.volume).toBeCloseTo(0.35)
  })

  it('null 이면 페이드 후 정지하고 다시 복귀하지 않는다', () => {
    audio.playBgm('bgm_lobby')
    vi.advanceTimersByTime(300)
    audio.playBgm(null)
    vi.advanceTimersByTime(300)
    audio.mute('ad')
    audio.unmute('ad')
    expect(made[0]!.paused).toBe(true)
    expect(made[0]!.played).toBe(1)
  })

  it.each(['hidden', 'ad', 'off'] as const)('%s 때 페이드 중인 이전 곡과 현재 곡을 즉시 멈춘다', (reason) => {
    audio.playBgm('bgm_lobby')
    vi.advanceTimersByTime(120)
    audio.playBgm('bgm_defcon2')
    vi.advanceTimersByTime(60)
    if (reason === 'off') audio.setSettings({ bgm: false, sfx: true })
    else audio.mute(reason)
    expect(made.every(el => el.paused)).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(1000)
    if (reason === 'off') audio.setSettings({ bgm: true, sfx: true })
    else audio.unmute(reason)
    expect(made[0]!.paused).toBe(true)
    expect(made[1]!.paused).toBe(false)
    expect(made[1]!.volume).toBeCloseTo(0.35)
  })

  it.each(['hidden', 'ad'] as const)('%s 먼저 해제해도 나머지 조건 해제까지 기다린다', (first) => {
    const last = first === 'hidden' ? 'ad' : 'hidden'
    audio.playBgm('bgm_lobby')
    audio.mute('hidden')
    audio.mute('ad')
    audio.unmute(first)
    expect(made[0]!.paused).toBe(true)
    audio.unmute(last)
    expect(made[0]!.paused).toBe(false)
    expect(made[0]!.played).toBe(2)
  })

  it('빠른 곡 전환은 오래된 페이드를 취소하고 마지막 곡만 남긴다', () => {
    audio.playBgm('bgm_lobby')
    vi.advanceTimersByTime(60)
    audio.playBgm('bgm_defcon2')
    vi.advanceTimersByTime(60)
    audio.playBgm('bgm_defcon1')
    expect(made[0]!.paused).toBe(true)
    expect(vi.getTimerCount()).toBe(2)
    vi.advanceTimersByTime(300)
    expect(made.map(el => el.paused)).toEqual([true, true, false])
    expect(made[2]!.volume).toBeCloseTo(0.35)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('음소거 중 곡을 바꾸면 마지막 곡만 복귀한다', () => {
    audio.playBgm('bgm_lobby')
    audio.mute('ad')
    audio.playBgm('bgm_defcon2')
    audio.playBgm('bgm_defcon1')
    expect(made.every(el => el.paused)).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
    audio.unmute('ad')
    expect(made.map(el => el.played)).toEqual([1, 0, 1])
  })

  it('자동재생 거절 후 첫 터치에서 현재 곡을 재시도한다', async () => {
    rejectNextPlay = true
    audio.playBgm('bgm_lobby')
    made[0]!.rejectPlay!()
    await Promise.resolve()
    pointer!()
    expect(made[0]!.played).toBe(2)
    pointer!()
    expect(made[0]!.played).toBe(2)
  })

  it('null 전환으로 현재 곡이 없어도 이전 페이드는 즉시 음소거한다', () => {
    audio.playBgm('bgm_lobby')
    vi.advanceTimersByTime(300)
    audio.playBgm(null)
    audio.mute('hidden')
    expect(made[0]!.paused).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('시스템 음소거 해제는 사용자 끄기 설정을 바꾸지 않는다', () => {
    audio.playBgm('bgm_lobby')
    audio.setSettings({ bgm: false, sfx: false })
    audio.mute('hidden')
    audio.mute('ad')
    audio.unmute('hidden')
    audio.unmute('ad')
    pointer!()
    expect(made[0]!.paused).toBe(true)
    expect(audio.playSfx('sfx_boom')).toBe(false)
  })
})

describe('playSfx', () => {
  it('평소에는 파일 키로 재생한다', () => {
    expect(audio.playSfx('sfx_boom')).toBe(true)
    expect(made[0]!.src).toBe('/assets/sfx_boom.m4a')
    expect(audio.getAudioState().activeSfx).toBe(1)
  })

  it.each(['hidden', 'ad', 'off'] as const)('%s 때 재생 중 효과음을 멈추고 복귀해도 재생하지 않는다', (reason) => {
    audio.playSfx('sfx_rifle')
    audio.playSfx('sfx_boom')
    if (reason === 'off') audio.setSettings({ bgm: true, sfx: false })
    else audio.mute(reason)
    expect(made.every(el => el.paused)).toBe(true)
    expect(audio.getAudioState().activeSfx).toBe(0)
    expect(audio.playSfx('sfx_boom')).toBe(false)
    if (reason === 'off') audio.setSettings({ bgm: true, sfx: true })
    else audio.unmute(reason)
    expect(made.map(el => el.played)).toEqual([1, 1])
    expect(audio.playSfx('sfx_boom')).toBe(true)
  })

  it('8개 상한을 지키고 종료·오류 중복은 다른 슬롯을 반환하지 않는다', () => {
    for (let i = 0; i < 8; i++) expect(audio.playSfx('sfx_rifle')).toBe(true)
    expect(audio.playSfx('sfx_rifle')).toBe(false)
    made[0]!.emit('ended')
    expect(audio.playSfx('sfx_rifle')).toBe(true)
    made[0]!.emit('error')
    made[0]!.emit('ended')
    expect(audio.getAudioState().activeSfx).toBe(8)
    expect(audio.playSfx('sfx_rifle')).toBe(false)
    made[1]!.emit('error')
    expect(audio.getAudioState().activeSfx).toBe(7)
  })

  it('재생 거절·오류가 겹쳐도 슬롯은 한 번 반환한다', async () => {
    rejectNextPlay = true
    audio.playSfx('sfx_rifle')
    audio.playSfx('sfx_boom')
    made[0]!.rejectPlay!()
    await Promise.resolve()
    made[0]!.emit('error')
    made[0]!.emit('ended')
    expect(audio.getAudioState().activeSfx).toBe(1)
  })

  it('음소거 뒤 늦은 거절·종료는 새 효과음 슬롯을 반환하지 않는다', async () => {
    rejectNextPlay = true
    audio.playSfx('sfx_click')
    audio.mute('hidden')
    audio.unmute('hidden')
    audio.playSfx('sfx_boom')
    made[0]!.rejectPlay!()
    await Promise.resolve()
    made[0]!.emit('ended')
    made[0]!.emit('error')
    expect(audio.getAudioState().activeSfx).toBe(1)
    expect(made[1]!.paused).toBe(false)
  })

  it('오류 뒤 늦은 재생 거절도 다른 슬롯을 반환하지 않는다', async () => {
    rejectNextPlay = true
    audio.playSfx('sfx_rifle')
    made[0]!.emit('error')
    audio.playSfx('sfx_boom')
    made[0]!.rejectPlay!()
    await Promise.resolve()
    expect(audio.getAudioState().activeSfx).toBe(1)
  })

  it('동기 재생 예외도 슬롯을 반환한다', () => {
    vi.spyOn(FakeAudioImpl.prototype, 'play').mockImplementationOnce(() => {
      throw new Error('재생 실패')
    })
    expect(audio.playSfx('sfx_boom')).toBe(true)
    expect(audio.getAudioState().activeSfx).toBe(0)
    expect(made[0]!.paused).toBe(true)
  })

  it('클릭 파일 실패의 합성음도 설정을 끄면 즉시 멈춘다', async () => {
    const stop = vi.fn()
    const setValueAtTime = vi.fn()
    class FakeContext {
      state = 'running'
      currentTime = 0
      destination = {}
      suspend() { return Promise.resolve() }
      createOscillator() {
        return { type: '', frequency: { setValueAtTime: vi.fn() }, connect: vi.fn(), start: vi.fn(), stop, onended: null }
      }
      createGain() {
        return { gain: { setValueAtTime, exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() }
      }
    }
    vi.stubGlobal('window', { AudioContext: FakeContext })
    rejectNextPlay = true
    audio.playSfx('sfx_click')
    made[0]!.rejectPlay!()
    await Promise.resolve()
    expect(stop).toHaveBeenCalledTimes(1)
    audio.setSettings({ bgm: true, sfx: false })
    expect(stop).toHaveBeenCalledTimes(2)
    expect(setValueAtTime).toHaveBeenLastCalledWith(0, 0)
  })
})
