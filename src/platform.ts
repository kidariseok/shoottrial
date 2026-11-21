// docs/TECH.md §2·§4·§11 — Capacitor 플러그인(@capacitor/*)과 앱인토스 SDK(@apps-in-toss/*, T-123)를 import하는 유일한 파일
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
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

export function isIos(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'
}

// ── 앱인토스 (T-123) ──
// 출처: 앱인토스 개발자센터(게임 출시 가이드·스토리지·Safe Area·인앱 광고)와 설치한 SDK 3.9.0의 dist/index.d.ts.
// SDK는 `vite --mode toss` 빌드에서만 동적으로 불러와 웹·안드로이드 번들에는 들어가지 않는다.
type AitSdk = typeof import('@apps-in-toss/web-framework')
type Env = Record<string, string | undefined>
const viteEnv: Env = (import.meta as { env?: Env }).env ?? {}
// Vite가 `import.meta.env.MODE`를 빌드 때 상수로 바꾸므로, 토스가 아닌 빌드에서는 아래 동적 import 청크가 통째로 사라진다.
const tossBuild = (import.meta as unknown as { env: { MODE: string } }).env.MODE === 'toss'
const USER_KEY_PREF = 'd2_toss_user_key'
let ait: AitSdk | null = null
let tossUserKey: string | null = null

// 우측 상단에 프레임워크의 닫기(X) 버튼이 떠 있다. 게임 UI가 겹치면 검수에서 반려되므로 위쪽 Safe Area를 이만큼 늘린다.
// ponytail: 문서 기준(top+5~10, 버튼 약 36px)으로 잡은 값이다. 실기기 QR에서 겹치거나 너무 비면 이 숫자만 조정한다.
export const TOSS_CLOSE_BAND = 48

export function isToss(): boolean {
  return ait !== null
}

// 플랫폼 상태 조합별 보상형 광고 지원 여부(안드로이드·토스만 true, iOS 1단계 무광고·웹은 false)
export function hasAdsForPlatform(native: boolean, platform: string, toss: boolean): boolean {
  if (native && platform === 'ios') return false
  return native || toss
}

// 실제 보상형 광고를 쓸 수 있는 환경(안드로이드 앱 또는 토스 미니앱). iOS(1단계 무광고)와 웹 체험판은 false.
export function hasAds(): boolean {
  return hasAdsForPlatform(Capacitor.isNativePlatform(), Capacitor.getPlatform(), ait !== null)
}

// ── 햅틱 피드백 (iOS/Android 네이티브, T-125) ──
export type HapticImpactPattern = 'light' | 'medium' | 'heavy'
export type HapticNotificationPattern = 'success' | 'warning' | 'error'

export async function hapticImpact(pattern: HapticImpactPattern = 'light'): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const styleMap: Record<HapticImpactPattern, ImpactStyle> = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    }
    await Haptics.impact({ style: styleMap[pattern] })
  } catch {
    // 햅틱 하드웨어 미지원 기기 무시
  }
}

export async function hapticNotification(type: HapticNotificationPattern = 'success'): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const typeMap: Record<HapticNotificationPattern, NotificationType> = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    }
    await Haptics.notification({ type: typeMap[type] })
  } catch {
    // 햅틱 하드웨어 미지원 기기 무시
  }
}

export async function hapticSelection(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await Haptics.selectionChanged()
  } catch {
    // 햅틱 하드웨어 미지원 기기 무시
  }
}

export function userKey(): string | null {
  return tossUserKey
}

type Insets = { top: number; right: number; bottom: number; left: number }

export function tossSafeInsets(raw: Insets): Insets {
  return { top: raw.top + TOSS_CLOSE_BAND, right: raw.right, bottom: raw.bottom, left: raw.left }
}

function applyTossSafe(raw: Insets): void {
  const s = tossSafeInsets(raw)
  const style = document.documentElement.style
  for (const side of ['top', 'right', 'bottom', 'left'] as const) style.setProperty(`--sa-${side}`, `${s[side]}px`)
}

async function initToss(): Promise<void> {
  try {
    const sdk = await import('@apps-in-toss/web-framework')
    const env = sdk.Environment.environment // 토스 앱 밖이면 던지거나 값이 없다 → 웹으로 계속
    if (env !== 'toss' && env !== 'sandbox') return
    ait = sdk
  } catch (e) {
    console.warn('[toss] SDK를 쓸 수 없어 웹으로 계속합니다', e)
    return
  }
  const sdk = ait
  applyTossSafe(sdk.SafeArea.get())
  sdk.SafeArea.subscribe({ onEvent: applyTossSafe })
  // 기본 뒤로가기는 막히고 이 콜백만 불린다. 종료 확인 모달은 handleBack(main.ts)이 띄운다.
  sdk.graniteEvent.addEventListener('backEvent', {
    onEvent: () => { for (const cb of backListeners) cb() },
    onError: (e) => console.warn('[toss] backEvent', e),
  })
  // 게임 미니앱은 시작할 때 사용자 식별키를 확인해 저장한다(게임 출시 가이드). 실패해도 게임은 계속한다.
  if (sdk.User.getAnonymousKey.isSupported()) {
    try {
      tossUserKey = (await sdk.User.getAnonymousKey()).hash
      await prefsSet(USER_KEY_PREF, tossUserKey)
    } catch (e) {
      console.warn('[toss] 사용자 식별키 실패', e)
    }
  }
  loadTossAd()
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
    if (tossBuild) await initToss()
    if (!ait && typeof window !== 'undefined') {
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
  if (ait) {
    await ait.Screen.close().catch((e: unknown) => console.warn('[toss] 화면 닫기 실패', e))
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
  if (ait) {
    // 토스는 앱 단위 Storage가 원본이다. 없으면 아래 localStorage(웹 체험판과 같은 origin이 아니면 비어 있다)로 내려간다.
    try {
      const v = await ait.Storage.getItem(key)
      if (v !== null) {
        memPrefs.set(key, v)
        return v
      }
    } catch (e) {
      console.warn('[toss] Storage.getItem 실패', e)
    }
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
  if (ait) {
    try {
      await ait.Storage.setItem(key, value)
    } catch (e) {
      console.warn('[toss] Storage.setItem 실패', e)
    }
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
  if (!Capacitor.isNativePlatform() || isIos() || adsReady) return
  try {
    await AdMob.initialize({ initializeForTesting: adsTesting })
    adsReady = true
    await AdMob.prepareRewardVideoAd({ adId: rewardedId, isTesting: adsTesting }).catch(() => {})
  } catch (e) {
    console.warn('[ads] init failed', e)
  }
}

// 토스 보상형 광고. 개발 중에는 공식 테스트 그룹 ID, 운영 ID는 .env.toss의 VITE_AIT_REWARDED_ID로만 주입한다(.env*는 gitignore).
const TEST_AIT_REWARDED_ID = 'ait-ad-test-rewarded-id'
const aitRewardedId = viteEnv.VITE_AIT_REWARDED_ID || TEST_AIT_REWARDED_ID
let aitAdLoaded = false
let aitAdLoading = false

// load → show → load 순서를 지킨다. 같은 그룹 ID는 한 번에 하나만 미리 불러둔다.
function loadTossAd(): void {
  if (!ait || aitAdLoaded || aitAdLoading || !ait.loadFullScreenAd.isSupported()) return
  aitAdLoading = true
  ait.loadFullScreenAd({
    options: { adGroupId: aitRewardedId },
    onEvent: (e) => {
      if (e.type === 'loaded') {
        aitAdLoaded = true
        aitAdLoading = false
      }
    },
    onError: (e) => {
      aitAdLoading = false
      console.warn('[toss] 광고 로드 실패', e)
    },
  })
}

// 보상은 userEarnedReward에서만 인정한다(dismissed만으로는 지급 금지).
function showTossRewarded(sdk: AitSdk): Promise<AdResult> {
  if (!aitAdLoaded || !sdk.showFullScreenAd.isSupported()) {
    loadTossAd() // 재생 시점에 불러 기다리지 않는다. 이번엔 실패 안내, 다음 시도를 위해 미리 불러둔다.
    return Promise.resolve('failed')
  }
  aitAdLoaded = false
  return new Promise<AdResult>((resolve) => {
    let rewarded = false
    let done = false
    const finish = (r: AdResult): void => {
      if (done) return
      done = true
      loadTossAd()
      resolve(r)
    }
    sdk.showFullScreenAd({
      options: { adGroupId: aitRewardedId },
      onEvent: (e) => {
        if (e.type === 'userEarnedReward') {
          rewarded = true
          // ponytail: 안드로이드 토스 5.255.0은 dismissed가 안 온다(문서 FAQ). 3초 안에 안 오면 보상으로 마무리해 음소거·연타 잠금이 풀리게 한다.
          setTimeout(() => finish('rewarded'), 3000)
        } else if (e.type === 'dismissed') finish(rewarded ? 'rewarded' : 'dismissed')
        else if (e.type === 'failedToShow') finish('failed')
      },
      onError: () => finish('failed'),
    })
  })
}

export async function showRewarded(): Promise<AdResult> {
  if (ait) return showTossRewarded(ait)
  if (!Capacitor.isNativePlatform() || isIos()) {
    // 무광고 환경(iOS 1단계·웹 체험판)은 ads.ts의 확인 모달로만 처리한다. 광고 SDK를 호출하지 않는다.
    return 'failed'
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
