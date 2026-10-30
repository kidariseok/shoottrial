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

export const SFX_KEYS = [
  'sfx_rifle',
  'sfx_sniper',
  'sfx_wind',
  'sfx_boom',
  'sfx_heal',
  'sfx_merge',
  'sfx_siren',
  'sfx_radio',
  'sfx_hit',
  'sfx_click',
  'sfx_buy',
  'sfx_cannon_shot',
  'sfx_armored_arrival',
] as const
export type SfxKey = (typeof SFX_KEYS)[number]

export const BGM_KEYS = ['bgm_lobby', 'bgm_defcon2', 'bgm_defcon1'] as const
export type BgmKey = (typeof BGM_KEYS)[number]

const MAX_CONCURRENT_SFX = 8
const SFX_VOLUME = 0.5
const BGM_VOLUME = 0.35
const BGM_FADE_MS = 300
const BGM_FADE_STEP_MS = 30
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
let bgmKey: BgmKey | null = null
let bgmEl: HTMLAudioElement | null = null
const fadingBgm = new Set<HTMLAudioElement>()
const fadeTimers = new Map<HTMLAudioElement, ReturnType<typeof setInterval>>()
const sfxStops = new Set<() => void>()

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

function cancelFade(el: HTMLAudioElement): void {
  clearInterval(fadeTimers.get(el))
  fadeTimers.delete(el)
}

function stopFadingBgm(): void {
  for (const el of fadingBgm) {
    cancelFade(el)
    el.pause()
  }
  fadingBgm.clear()
}

function fadeTo(el: HTMLAudioElement, to: number, then?: () => void): void {
  cancelFade(el)
  const steps = Math.max(1, Math.round(BGM_FADE_MS / BGM_FADE_STEP_MS))
  const delta = (to - el.volume) / steps
  let n = 0
  const timer = setInterval(() => {
    n += 1
    el.volume = n >= steps ? to : Math.min(1, Math.max(0, el.volume + delta))
    if (n >= steps) {
      cancelFade(el)
      then?.()
    }
  }, BGM_FADE_STEP_MS)
  fadeTimers.set(el, timer)
}

// 현재 배경음 요소를 음소거 상태에 맞춰 일시정지·재개한다
function syncBgm(): void {
  if (isBgmMuted()) {
    stopFadingBgm()
    if (bgmEl) {
      cancelFade(bgmEl)
      bgmEl.pause()
      bgmEl.volume = BGM_VOLUME
    }
    return
  }
  const el = bgmEl
  if (!el || !el.paused) return
  const p = el.play()
  if (p && typeof p.catch === 'function') {
    // 자동재생이 막히면 다음 터치에서 다시 시도한다
    p.catch(() => {
      if (el === bgmEl) needsPointerResume = true
    })
  }
}

export function playBgm(key: BgmKey | null): void {
  if (key === bgmKey) return
  bgmKey = key
  needsPointerResume = false
  stopFadingBgm()

  const old = bgmEl
  bgmEl = null
  if (old) {
    if (isBgmMuted()) {
      cancelFade(old)
      old.pause()
    } else {
      fadingBgm.add(old)
      fadeTo(old, 0, () => {
        old.pause()
        fadingBgm.delete(old)
      })
    }
  }
  if (key === null || typeof Audio === 'undefined') return

  try {
    const el = new Audio(`/assets/${key}.m4a`)
    el.loop = true
    el.volume = 0
    bgmEl = el
    if (!isBgmMuted()) fadeTo(el, BGM_VOLUME)
    else el.volume = BGM_VOLUME
    syncBgm()
  } catch {
    bgmEl = null
  }
}

function syncLoopNode(): void {
  if (isSfxMuted()) {
    for (const stop of sfxStops) stop()
  }
  syncBgm()
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
        if (needsPointerResume && !isBgmMuted()) syncBgm()
        if (ctx && (needsPointerResume || ctx.state === 'suspended') && !isBgmMuted()) {
          needsPointerResume = false
          void ctx.resume().catch(() => {})
        }
      },
      { passive: true }
    )
    // 버튼 클릭음: .mil-btn 이 눌리면 sfx_click
    document.addEventListener('click', (e) => {
      const t = e.target as Element | null
      if (t && typeof t.closest === 'function' && t.closest('.mil-btn')) playSfx('sfx_click')
    })
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

export function playSfx(key: SfxKey = 'sfx_click'): boolean {
  if (isSfxMuted()) return false
  if (activeSfx >= MAX_CONCURRENT_SFX) return false

  activeSfx += 1
  let released = false
  let el: HTMLAudioElement | null = null
  const release = () => {
    if (released) return
    released = true
    activeSfx -= 1
    sfxStops.delete(release)
    if (el) {
      el.removeEventListener('ended', release)
      el.removeEventListener('error', release)
      el.pause()
    }
  }
  sfxStops.add(release)

  if (typeof Audio !== 'undefined') {
    try {
      el = new Audio(`/assets/${key}.m4a`)
      el.volume = SFX_VOLUME
      el.addEventListener('ended', release, { once: true })
      el.addEventListener('error', release, { once: true })
      const p = el.play()
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          if (released) return
          if (key === 'sfx_click') playClickSynthFallback()
          release()
        })
      }
      return true
    } catch {
      if (key === 'sfx_click') playClickSynthFallback()
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
    const stop = () => {
      gain.gain.setValueAtTime(0, audioCtx.currentTime)
      osc.stop()
      sfxStops.delete(stop)
    }
    sfxStops.add(stop)
    osc.onended = () => sfxStops.delete(stop)
    osc.stop(audioCtx.currentTime + 0.05)
  } catch {
    // 오디오 컨텍스트 생성 불가 무시
  }
}
