// docs/TECH.md §6 오디오 (음소거 OR 규칙, 백그라운드·광고 정지 및 복귀 재개)
import { onPause, onResume } from './platform'

export type MuteReason = 'hidden' | 'ad'

export interface AudioState {
  bgm: boolean
  sfx: boolean
  hidden: boolean
  ad: boolean
  bgmMuted: boolean
  sfxMuted: boolean
  loopOn: boolean
  loopPlaying: boolean
  activeSfx: number
}

const MAX_CONCURRENT_SFX = 8
const LOOP_FREQ_HZ = 440
const LOOP_GAIN = 0.12

let userBgm = true
let userSfx = true
let flagHidden = false
let flagAd = false
let loopOn = false
let activeSfx = 0
let needsPointerResume = false
let audioInitialized = false

let ctx: AudioContext | null = null
let loopOsc: OscillatorNode | null = null
let loopGain: GainNode | null = null

const changeListeners = new Set<() => void>()

function notifyChange(): void {
  for (const cb of changeListeners) cb()
}

export function isBgmMuted(): boolean {
  return !userBgm || flagHidden || flagAd
}

export function isSfxMuted(): boolean {
  return !userSfx || flagHidden || flagAd
}

export function getAudioState(): AudioState {
  const bgmMuted = isBgmMuted()
  const sfxMuted = isSfxMuted()
  return {
    bgm: userBgm,
    sfx: userSfx,
    hidden: flagHidden,
    ad: flagAd,
    bgmMuted,
    sfxMuted,
    loopOn,
    loopPlaying: loopOn && !bgmMuted,
    activeSfx,
  }
}

export function onAudioChange(cb: () => void): () => void {
  changeListeners.add(cb)
  return () => changeListeners.delete(cb)
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Ctor) {
      ctx = new Ctor()
    }
  }
  return ctx
}

function syncLoopNode(): void {
  const muted = isBgmMuted()
  if (!loopOn || muted) {
    if (loopGain && ctx) {
      loopGain.gain.setTargetAtTime(0, ctx.currentTime, 0.01)
    }
    if (ctx && ctx.state === 'running' && (flagHidden || flagAd)) {
      void ctx.suspend().catch(() => {})
    }
    notifyChange()
    return
  }

  const audioCtx = getContext()
  if (!audioCtx) {
    notifyChange()
    return
  }

  if (audioCtx.state === 'suspended') {
    void audioCtx.resume().catch(() => {})
  }

  if (!loopOsc || !loopGain) {
    loopGain = audioCtx.createGain()
    loopGain.gain.setValueAtTime(LOOP_GAIN, audioCtx.currentTime)
    loopGain.connect(audioCtx.destination)

    loopOsc = audioCtx.createOscillator()
    loopOsc.type = 'sine'
    loopOsc.frequency.setValueAtTime(LOOP_FREQ_HZ, audioCtx.currentTime)
    loopOsc.connect(loopGain)
    loopOsc.start()
  } else {
    loopGain.gain.setTargetAtTime(LOOP_GAIN, audioCtx.currentTime, 0.015)
  }

  notifyChange()
}

export function initAudio(settings?: { bgm: boolean; sfx: boolean }): void {
  if (settings) {
    userBgm = settings.bgm
    userSfx = settings.sfx
  }
  if (audioInitialized) {
    syncLoopNode()
    return
  }
  audioInitialized = true

  onPause(() => {
    mute('hidden')
  })

  onResume(() => {
    unmute('hidden')
  })

  if (typeof window !== 'undefined') {
    window.addEventListener(
      'pointerdown',
      () => {
        if (ctx && (needsPointerResume || ctx.state === 'suspended') && !isBgmMuted()) {
          needsPointerResume = false
          void ctx.resume().catch(() => {})
        }
      },
      { passive: true }
    )
  }

  syncLoopNode()
}

export function setSettings(settings: { bgm: boolean; sfx: boolean }): void {
  userBgm = settings.bgm
  userSfx = settings.sfx
  syncLoopNode()
}

export function mute(reason: MuteReason): void {
  if (reason === 'hidden') flagHidden = true
  if (reason === 'ad') flagAd = true
  syncLoopNode()
}

export function unmute(reason: MuteReason): void {
  if (reason === 'hidden') flagHidden = false
  if (reason === 'ad') flagAd = false
  if (!flagHidden && !flagAd) {
    needsPointerResume = true
  }
  syncLoopNode()
}

export function setLoopTone(on: boolean): void {
  loopOn = on
  syncLoopNode()
}

export function toggleLoopTone(): boolean {
  setLoopTone(!loopOn)
  return loopOn
}

export function playSfx(key: 'sfx_click' = 'sfx_click'): boolean {
  if (isSfxMuted()) return false
  if (activeSfx >= MAX_CONCURRENT_SFX) return false

  activeSfx += 1
  const release = () => {
    activeSfx = Math.max(0, activeSfx - 1)
  }

  if (typeof Audio !== 'undefined') {
    try {
      const el = new Audio(`/assets/${key}.m4a`)
      el.volume = 0.5
      el.addEventListener('ended', release, { once: true })
      el.addEventListener('error', release, { once: true })
      const p = el.play()
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          playClickSynthFallback()
          release()
        })
      }
      return true
    } catch {
      playClickSynthFallback()
      release()
      return true
    }
  }

  release()
  return false
}

function playClickSynthFallback(): void {
  if (isSfxMuted()) return
  const audioCtx = getContext()
  if (!audioCtx) return
  try {
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume().catch(() => {})
    }
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(880, audioCtx.currentTime)
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.05)
  } catch {
    // 오디오 컨텍스트 생성 불가 무시
  }
}
