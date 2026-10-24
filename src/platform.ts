// docs/TECH.md §2·§4·§11 — Capacitor 플러그인(@capacitor/*)을 import하는 유일한 파일
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Preferences } from '@capacitor/preferences'
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob'

export interface SafeRect {
  top: number
  right: number
  bottom: number
  left: number
  x: number
  y: number
  width: number
  height: number
}

const backListeners = new Set<() => void>()
const pauseListeners = new Set<() => void>()
const resumeListeners = new Set<() => void>()
const memPrefs = new Map<string, string>()

let initialized = false
let safeProbe: HTMLElement | null = null

export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

export async function init(): Promise<void> {
  if (initialized) return
  initialized = true

  if (Capacitor.isNativePlatform()) {
    await App.addListener('backButton', () => {
      for (const cb of backListeners) cb()
    })
    await App.addListener('pause', () => {
      for (const cb of pauseListeners) cb()
    })
    await App.addListener('resume', () => {
      for (const cb of resumeListeners) cb()
    })
  } else if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        for (const cb of pauseListeners) cb()
      } else {
        for (const cb of resumeListeners) cb()
      }
    })
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => {
        for (const cb of backListeners) cb()
      })
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          for (const cb of backListeners) cb()
        }
      })
    }
  }
}

function readInsetPx(prop: 'top' | 'right' | 'bottom' | 'left'): number {
  if (typeof document === 'undefined' || typeof window === 'undefined') return 0

  const rootStyle = document.documentElement.style
  const direct =
    rootStyle.getPropertyValue(`--sa-${prop}`).trim() ||
    rootStyle.getPropertyValue(`--safe-area-inset-${prop}`).trim()
  if (direct) {
    const parsed = parseFloat(direct)
    if (!Number.isNaN(parsed)) return parsed
  }

  if (!safeProbe && document.body) {
    safeProbe = document.createElement('div')
    safeProbe.style.cssText =
      'position:fixed;top:var(--sa-top,0px);right:var(--sa-right,0px);bottom:var(--sa-bottom,0px);left:var(--sa-left,0px);pointer-events:none;visibility:hidden;z-index:-1;'
    document.body.appendChild(safeProbe)
  }

  if (safeProbe) {
    const computed = window.getComputedStyle(safeProbe)
    const val = parseFloat(computed[prop])
    if (!Number.isNaN(val)) return val
  }

  return 0
}

export function safeRect(): SafeRect {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 720
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1280
  const top = readInsetPx('top')
  const right = readInsetPx('right')
  const bottom = readInsetPx('bottom')
  const left = readInsetPx('left')

  return {
    top,
    right,
    bottom,
    left,
    x: left,
    y: top,
    width: Math.max(0, vw - left - right),
    height: Math.max(0, vh - top - bottom),
  }
}

export function onBack(cb: () => void): () => void {
  backListeners.add(cb)
  return () => backListeners.delete(cb)
}

export function onPause(cb: () => void): () => void {
  pauseListeners.add(cb)
  return () => pauseListeners.delete(cb)
}

export function onResume(cb: () => void): () => void {
  resumeListeners.add(cb)
  return () => resumeListeners.delete(cb)
}

export function triggerBack(): void {
  for (const cb of backListeners) cb()
}

export function triggerPause(): void {
  for (const cb of pauseListeners) cb()
}

export function triggerResume(): void {
  for (const cb of resumeListeners) cb()
}

export async function exitApp(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await App.exitApp()
    return
  }
  if (typeof window !== 'undefined') {
    try {
      window.close()
    } catch {
      // 브라우저 탭 닫기 제한 무시
    }
  }
}

export async function prefsGet(key: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key })
    if (value !== null) {
      memPrefs.set(key, value)
      try {
        localStorage.setItem(key, value)
      } catch {
        // localStorage 접근 불가 무시
      }
    }
    return value
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const v = localStorage.getItem(key)
      if (v !== null) return v
    }
  } catch {
    // localStorage 접근 불가 시 메모리 폴백
  }
  return memPrefs.get(key) ?? null
}

export async function prefsSet(key: string, value: string): Promise<void> {
  memPrefs.set(key, value)
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value)
    }
  } catch {
    // localStorage 접근 불가 무시
  }
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key, value })
  }
}

// ── 보상형 광고 (T-107) ──
// 출처: docs/research/play-launch.md 42행, 플러그인 타입 정의(RewardAdPluginEvents).
// 테스트 보상형 단위 ID는 구글 공식 테스트 ID. 운영 ID는 빌드 시 VITE_ADMOB_REWARDED_ID로만 주입한다.
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917'
const rewardedId: string = (import.meta as { env?: Record<string, string> }).env?.VITE_ADMOB_REWARDED_ID || TEST_REWARDED_ID
const adsTesting = rewardedId === TEST_REWARDED_ID

export type AdResult = 'rewarded' | 'dismissed' | 'failed'

let adsReady = false

// ponytail: UMP 동의 폼은 한국 한정 출시라 생략, 해외 출시 시 추가
export async function initAds(): Promise<void> {
  if (!Capacitor.isNativePlatform() || adsReady) return
  try {
    await AdMob.initialize({ initializeForTesting: adsTesting })
    adsReady = true
    await AdMob.prepareRewardVideoAd({ adId: rewardedId, isTesting: adsTesting }).catch(() => {})
  } catch (e) {
    console.warn('[ads] init failed', e)
  }
}

export async function showRewarded(): Promise<AdResult> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[ads:web-stub] 1초 뒤 보상')
    await new Promise((r) => setTimeout(r, 1000))
    return 'rewarded'
  }
  let rewarded = false
  const handles: { remove: () => Promise<void> }[] = []
  try {
    if (!adsReady) await initAds()
    if (!adsReady) return 'failed'
    const done = new Promise<AdResult>((resolve) => {
      void (async () => {
        handles.push(await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => { rewarded = true }))
        handles.push(await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => resolve(rewarded ? 'rewarded' : 'dismissed')))
        handles.push(await AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => resolve('failed')))
        handles.push(await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => resolve('failed')))
        try {
          await AdMob.prepareRewardVideoAd({ adId: rewardedId, isTesting: adsTesting })
          await AdMob.showRewardVideoAd()
        } catch {
          resolve('failed')
        }
      })()
    })
    return await done
  } catch {
    return 'failed'
  } finally {
    for (const h of handles) void h.remove()
    // 다음 광고 미리 준비
    void AdMob.prepareRewardVideoAd({ adId: rewardedId, isTesting: adsTesting }).catch(() => {})
  }
}
