import { afterEach, describe, expect, it, vi } from 'vitest'

// ── 최소 DOM 스텁 (Node 테스트 환경에서 lobby / screens / ads / web 검증용) ──
class FakeClassList {
  private set = new Set<string>()
  setFromString(str: string): void {
    this.set = new Set(str.split(/\s+/).filter(Boolean))
  }
  toString(): string {
    return [...this.set].join(' ')
  }
  add(...tokens: string[]): void {
    for (const t of tokens) if (t) this.set.add(t)
  }
  remove(...tokens: string[]): void {
    for (const t of tokens) this.set.delete(t)
  }
  toggle(token: string, force?: boolean): boolean {
    if (force === true) {
      this.set.add(token)
      return true
    }
    if (force === false) {
      this.set.delete(token)
      return false
    }
    if (this.set.has(token)) {
      this.set.delete(token)
      return false
    }
    this.set.add(token)
    return true
  }
  contains(token: string): boolean {
    return this.set.has(token)
  }
}

class FakeEl {
  tagName: string
  id = ''
  type = ''
  disabled = false
  hidden = false
  value = ''
  placeholder = ''
  maxLength = 0
  offsetWidth = 0
  parentElement: FakeEl | null = null
  children: FakeEl[] = []
  classList = new FakeClassList()
  attrs = new Map<string, string>()
  listeners = new Map<string, ((e: { target: FakeEl; stopPropagation: () => void }) => void)[]>()
  onclick: (() => void) | null = null
  style = {
    props: new Map<string, string>(),
    backgroundImage: '',
    cssText: '',
    setProperty(k: string, v: string) {
      this.props.set(k, v)
    },
    getPropertyValue(k: string) {
      return this.props.get(k) ?? ''
    },
  }
  private _text = ''
  private _html = ''

  constructor(tag: string) {
    this.tagName = tag.toUpperCase()
  }

  get className(): string {
    return this.classList.toString()
  }
  set className(v: string) {
    this.classList.setFromString(v)
  }

  get textContent(): string {
    if (this.children.length > 0) {
      return this.children.map((c) => c.textContent).join('')
    }
    return this._text || this._html
  }
  set textContent(v: string) {
    this._text = v
    this._html = ''
    this.children = []
  }

  get innerHTML(): string {
    return this._html
  }
  set innerHTML(v: string) {
    this._html = v
    this.children = []
    if (!v) return
    // 모달 버튼 등 단순 셀렉터 테스트용으로 class 속성 파싱
    const btnRe = /<button[^>]*class="([^"]+)"[^>]*>([^<]*)<\/button>/g
    let m: RegExpExecArray | null
    while ((m = btnRe.exec(v)) !== null) {
      const b = new FakeEl('button')
      b.className = m[1]!
      b.textContent = m[2]!
      this.appendChild(b)
    }
  }

  get isConnected(): boolean {
    return this.parentElement !== null
  }

  appendChild(child: FakeEl): FakeEl {
    child.parentElement = this
    this.children.push(child)
    return child
  }

  append(...nodes: FakeEl[]): void {
    for (const n of nodes) this.appendChild(n)
  }

  replaceChildren(...nodes: FakeEl[]): void {
    for (const c of this.children) c.parentElement = null
    this.children = []
    this.append(...nodes)
  }

  remove(): void {
    if (!this.parentElement) return
    this.parentElement.children = this.parentElement.children.filter((c) => c !== this)
    this.parentElement = null
  }

  contains(target: FakeEl): boolean {
    if (target === this) return true
    return this.children.some((c) => c.contains(target))
  }

  setAttribute(k: string, v: string): void {
    this.attrs.set(k, v)
  }

  getAttribute(k: string): string | null {
    return this.attrs.get(k) ?? null
  }

  addEventListener(type: string, cb: (e: { target: FakeEl; stopPropagation: () => void }) => void): void {
    const list = this.listeners.get(type) ?? []
    list.push(cb)
    this.listeners.set(type, list)
  }

  click(): void {
    if (this.disabled) return
    this.onclick?.()
    for (const cb of [...(this.listeners.get('click') ?? [])]) {
      cb({ target: this, stopPropagation: () => {} })
    }
  }

  focus(): void {}

  querySelectorAll(sel: string): FakeEl[] {
    const out: FakeEl[] = []
    const match = (el: FakeEl): boolean => {
      if (sel.startsWith('.')) return el.classList.contains(sel.slice(1))
      return el.tagName === sel.toUpperCase()
    }
    const walk = (node: FakeEl): void => {
      for (const c of node.children) {
        if (match(c)) out.push(c)
        walk(c)
      }
    }
    walk(this)
    return out
  }

  querySelector(sel: string): FakeEl | null {
    return this.querySelectorAll(sel)[0] ?? null
  }
}

function setupFakeDom() {
  const body = new FakeEl('body')
  const ui = new FakeEl('div')
  ui.id = 'ui'
  body.appendChild(ui)
  const docEl = new FakeEl('html')
  const doc = {
    body,
    documentElement: docEl,
    hidden: false,
    fullscreenEnabled: false,
    createElement: (tag: string) => new FakeEl(tag),
    getElementById: (id: string) => (id === 'ui' ? ui : null),
    addEventListener: vi.fn(),
  }
  const openSpy = vi.fn()
  vi.stubGlobal('document', doc)
  vi.stubGlobal('window', {
    open: openSpy,
    innerWidth: 390,
    innerHeight: 844,
    addEventListener: vi.fn(),
  })
  return { body, ui, doc, openSpy }
}

afterEach(() => {
  vi.doUnmock('@capacitor/core')
  vi.doUnmock('@capacitor/app')
  vi.doUnmock('@capacitor/preferences')
  vi.doUnmock('@capacitor/haptics')
  vi.doUnmock('@capacitor-community/admob')
  vi.doUnmock('@apps-in-toss/web-framework')
  vi.doUnmock('../src/platform')
  vi.doUnmock('../src/audio')
  vi.doUnmock('../src/save')
  vi.doUnmock('../src/assets')
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('T-125 플랫폼 분기(iOS / Android / Toss / Web) 및 햅틱 래퍼', () => {
  async function loadPlatform(opts: {
    native: boolean
    platform: string
    toss?: boolean
    hapticsThrows?: boolean
  }) {
    vi.resetModules()
    const impact = vi.fn(async () => {
      if (opts.hapticsThrows) throw new Error('unsupported')
    })
    const notification = vi.fn(async () => {
      if (opts.hapticsThrows) throw new Error('unsupported')
    })
    const selectionChanged = vi.fn(async () => {
      if (opts.hapticsThrows) throw new Error('unsupported')
    })
    const admobInit = vi.fn(async () => {})
    const admobPrepare = vi.fn(async () => {})

    vi.doMock('@capacitor/core', () => ({
      Capacitor: {
        isNativePlatform: () => opts.native,
        getPlatform: () => opts.platform,
      },
    }))
    vi.doMock('@capacitor/app', () => ({
      App: { addListener: vi.fn(async () => {}), exitApp: vi.fn(async () => {}) },
    }))
    vi.doMock('@capacitor/preferences', () => ({
      Preferences: { get: vi.fn(async () => ({ value: null })), set: vi.fn(async () => {}) },
    }))
    vi.doMock('@capacitor/haptics', () => ({
      Haptics: { impact, notification, selectionChanged },
      ImpactStyle: { Light: 'LIGHT', Medium: 'MEDIUM', Heavy: 'HEAVY' },
      NotificationType: { Success: 'SUCCESS', Warning: 'WARNING', Error: 'ERROR' },
    }))
    vi.doMock('@capacitor-community/admob', () => ({
      AdMob: {
        initialize: admobInit,
        prepareRewardVideoAd: admobPrepare,
        showRewardVideoAd: vi.fn(async () => {}),
        addListener: vi.fn(async () => ({ remove: async () => {} })),
      },
      RewardAdPluginEvents: {
        Rewarded: 'onRewardedVideoAdReward',
        Dismissed: 'onRewardedVideoAdDismissed',
        FailedToShow: 'onRewardedVideoAdFailedToShow',
        FailedToLoad: 'onRewardedVideoAdFailedToLoad',
      },
    }))

    if (opts.toss) {
      vi.stubEnv('MODE', 'toss')
      setupFakeDom()
      vi.doMock('@apps-in-toss/web-framework', () => ({
        Environment: { environment: 'toss' },
        SafeArea: { get: () => ({ top: 0, right: 0, bottom: 0, left: 0 }), subscribe: vi.fn() },
        graniteEvent: { addEventListener: vi.fn() },
        User: { getAnonymousKey: Object.assign(vi.fn(), { isSupported: () => false }) },
        loadFullScreenAd: Object.assign(vi.fn(), { isSupported: () => false }),
        showFullScreenAd: Object.assign(vi.fn(), { isSupported: () => false }),
        Screen: { close: vi.fn(async () => {}) },
        Storage: { getItem: vi.fn(async () => null), setItem: vi.fn(async () => {}) },
      }))
    }

    const platform = await import('../src/platform')
    if (opts.toss) {
      await platform.init()
    }
    return { platform, impact, notification, selectionChanged, admobInit, admobPrepare }
  }

  it('iOS 네이티브는 isIos()=true, hasAds()=false이고 AdMob을 호출하지 않는다', async () => {
    const { platform, admobInit, admobPrepare } = await loadPlatform({ native: true, platform: 'ios' })
    expect(platform.isNative()).toBe(true)
    expect(platform.isIos()).toBe(true)
    expect(platform.hasAds()).toBe(false)
    await platform.initAds()
    expect(await platform.showRewarded()).toBe('failed')
    expect(admobInit).not.toHaveBeenCalled()
    expect(admobPrepare).not.toHaveBeenCalled()
  })

  it('Android 네이티브는 isIos()=false, hasAds()=true이다', async () => {
    const { platform } = await loadPlatform({ native: true, platform: 'android' })
    expect(platform.isNative()).toBe(true)
    expect(platform.isIos()).toBe(false)
    expect(platform.hasAds()).toBe(true)
  })

  it('토스 미니앱은 hasAdsForPlatform 기준 true이고, 4개 플랫폼 조합이 정확히 분기된다', async () => {
    const { platform } = await loadPlatform({ native: false, platform: 'web' })
    expect(platform.hasAdsForPlatform(true, 'ios', false)).toBe(false)
    expect(platform.hasAdsForPlatform(true, 'android', false)).toBe(true)
    expect(platform.hasAdsForPlatform(false, 'web', true)).toBe(true)
    expect(platform.hasAdsForPlatform(false, 'web', false)).toBe(false)
  })

  it('일반 웹은 isNative()=false, hasAds()=false이다', async () => {
    const { platform } = await loadPlatform({ native: false, platform: 'web' })
    expect(platform.isNative()).toBe(false)
    expect(platform.isIos()).toBe(false)
    expect(platform.hasAds()).toBe(false)
  })

  it('웹에서는 햅틱 래퍼가 안전하게 no-op으로 동작한다', async () => {
    const { platform, impact, notification, selectionChanged } = await loadPlatform({ native: false, platform: 'web' })
    await platform.hapticImpact('heavy')
    await platform.hapticNotification('success')
    await platform.hapticSelection()
    expect(impact).not.toHaveBeenCalled()
    expect(notification).not.toHaveBeenCalled()
    expect(selectionChanged).not.toHaveBeenCalled()
  })

  it('네이티브에서는 햅틱 래퍼가 @capacitor/haptics를 호출하고 예외도 안전하게 삼킨다', async () => {
    const { platform, impact, notification, selectionChanged } = await loadPlatform({ native: true, platform: 'ios' })
    await platform.hapticImpact('light')
    await platform.hapticImpact('medium')
    await platform.hapticImpact('heavy')
    await platform.hapticNotification('success')
    await platform.hapticNotification('warning')
    await platform.hapticNotification('error')
    await platform.hapticSelection()

    expect(impact).toHaveBeenNthCalledWith(1, { style: 'LIGHT' })
    expect(impact).toHaveBeenNthCalledWith(2, { style: 'MEDIUM' })
    expect(impact).toHaveBeenNthCalledWith(3, { style: 'HEAVY' })
    expect(notification).toHaveBeenNthCalledWith(1, { type: 'SUCCESS' })
    expect(notification).toHaveBeenNthCalledWith(2, { type: 'WARNING' })
    expect(notification).toHaveBeenNthCalledWith(3, { type: 'ERROR' })
    expect(selectionChanged).toHaveBeenCalledTimes(1)

    const failing = await loadPlatform({ native: true, platform: 'ios', hapticsThrows: true })
    await expect(failing.platform.hapticImpact('light')).resolves.toBeUndefined()
    await expect(failing.platform.hapticNotification('error')).resolves.toBeUndefined()
    await expect(failing.platform.hapticSelection()).resolves.toBeUndefined()
  })
})

describe('T-125 startWeb 회귀 방지 (iOS 무광고 네이티브에서 웹 체험 오버레이 미노출)', () => {
  it('iOS 네이티브(isNative=true, hasAds=false)에서 startWeb()은 즉시 반환한다', async () => {
    vi.resetModules()
    const createElement = vi.fn()
    vi.stubGlobal('document', { createElement, body: { appendChild: vi.fn() } })
    vi.doMock('../src/platform', () => ({
      isNative: () => true,
      hasAds: () => false,
    }))
    const { startWeb } = await import('../src/web')
    const onRotate = vi.fn()
    await startWeb(onRotate)
    expect(createElement).not.toHaveBeenCalled()
    expect(onRotate).not.toHaveBeenCalled()
  })
})

describe('T-125 오디오 배경음 기본값 복구', () => {
  it('bgmEnabled 기본값이 true이므로 별도 설정 없이도 배경음이 음소거되지 않는다', async () => {
    vi.resetModules()
    vi.doMock('../src/platform', () => ({ onPause: vi.fn(), onResume: vi.fn() }))
    const audio = await import('../src/audio')
    expect(audio.isBgmMuted()).toBe(false)
    expect(audio.getAudioState().bgmMuted).toBe(false)
  })
})

describe('T-125 무광고 iOS UI(ads / lobby / screens)', () => {
  it('iOS 네이티브에서 watchAd 확인 모달은 "작전 지원 보상"을 표시하고 "웹 체험" 문구를 노출하지 않는다', async () => {
    vi.resetModules()
    const { ui } = setupFakeDom()
    vi.doMock('../src/platform', () => ({
      isNative: () => true,
      hasAds: () => false,
      showRewarded: vi.fn(),
    }))
    vi.doMock('../src/audio', () => ({ mute: vi.fn(), unmute: vi.fn() }))
    const { watchAd } = await import('../src/ads')

    const pending = watchAd('supply')
    const modal = ui.querySelector('.web-reward-backdrop')
    expect(modal).not.toBeNull()
    expect(modal!.getAttribute('aria-label')).toBe('작전 지원 보상')
    expect(modal!.innerHTML).toContain('작전 지원 보상')
    expect(modal!.innerHTML).not.toContain('웹 체험')

    modal!.querySelector('.web-reward-confirm')!.click()
    await expect(pending).resolves.toBe(true)
  })

  it('!hasAds() 환경에서 로비 PX 패널에 "광고 보고 해금" 비활성 버튼이 노출되지 않고, 행정반 링크·진동 토글이 동작한다', async () => {
    vi.resetModules()
    const { ui, openSpy } = setupFakeDom()
    const hapticImpact = vi.fn(async () => {})
    const hapticSelection = vi.fn(async () => {})
    vi.doMock('../src/platform', () => ({
      isNative: () => true,
      hasAds: () => false,
      hapticImpact,
      hapticSelection,
      hapticNotification: vi.fn(async () => {}),
    }))
    vi.doMock('../src/audio', () => ({
      playBgm: vi.fn(),
      playSfx: vi.fn(),
      setSettings: vi.fn(),
    }))
    vi.doMock('../src/save', () => ({
      defaultSave: () => ({
        v: 1,
        name: '김신병',
        unlocked: ['rifle', 'blower', 'sniper'],
        bestWave: 0,
        runs: 0,
        firstRun: false,
        settings: { bgm: true, sfx: true, haptic: false, dmgNumbers: true },
      }),
      load: vi.fn(async () => ({
        v: 1,
        name: '김신병',
        unlocked: ['rifle', 'blower', 'sniper'],
        bestWave: 0,
        runs: 0,
        firstRun: false,
        settings: { bgm: true, sfx: true, haptic: false, dmgNumbers: true },
      })),
      save: vi.fn(async () => {}),
    }))
    vi.doMock('../src/assets', () => ({ fetchAvailableAssets: vi.fn(async () => []) }))

    const lobby = await import('../src/ui/lobby')
    lobby.openPanel('px')
    expect(ui.querySelector('.lobby-px-btn')).toBeNull()
    expect(ui.textContent).not.toContain('광고 보고 해금')
    expect(ui.textContent).not.toContain('웹 체험판')
    expect(ui.textContent).toContain('웨이브 5')

    lobby.openPanel('admin')
    const linkBtns = ui.querySelectorAll('.lobby-link-btn')
    expect(linkBtns.map((b) => b.textContent)).toEqual(['개인정보 처리방침', '고객 지원 · 문의'])
    linkBtns[0]!.click()
    linkBtns[1]!.click()
    expect(openSpy).toHaveBeenNthCalledWith(1, lobby.PRIVACY_POLICY_URL, '_blank', 'noopener,noreferrer')
    expect(openSpy).toHaveBeenNthCalledWith(2, lobby.SUPPORT_URL, '_blank', 'noopener,noreferrer')

    // 진동 토글 OFF -> ON 전환 시 즉시 light 햅틱 호출
    const settingBtns = ui.querySelectorAll('.lobby-setting-btn')
    const hapticBtn = settingBtns.find((b) => b.textContent.startsWith('진동:'))
    expect(hapticBtn).toBeDefined()
    hapticBtn!.click()
    expect(hapticImpact).toHaveBeenCalledWith('light')
  })

  it('iOS 네이티브 전투 UI 버튼은 "체험" 문구를 제거하고, 승리/자발적 포기/패배 문구 및 햅틱 설정을 준수한다', async () => {
    vi.resetModules()
    const { ui } = setupFakeDom()
    const hapticImpact = vi.fn(async () => {})
    const hapticNotification = vi.fn(async () => {})
    vi.doMock('../src/platform', () => ({
      isNative: () => true,
      hasAds: () => false,
      hapticImpact,
      hapticNotification,
      hapticSelection: vi.fn(async () => {}),
      showRewarded: vi.fn(),
    }))
    vi.doMock('../src/audio', () => ({
      playBgm: vi.fn(),
      playSfx: vi.fn(),
      setSettings: vi.fn(),
      mute: vi.fn(),
      unmute: vi.fn(),
    }))
    vi.doMock('../src/assets', () => ({ fetchAvailableAssets: vi.fn(async () => []) }))

    const screens = await import('../src/ui/screens')
    screens.hud({
      wave: 1,
      waves: 10,
      defcon: 2,
      supply: 10,
      baseHp: 20,
      phase: 'prep',
      prepLeft: 30,
      speed: 1,
      synergies: [],
      support: 1,
    })

    expect(ui.querySelector('.hud-supply-ad-btn')!.textContent).toBe('지원 보급 +5')
    expect(ui.querySelector('.shop-btn-free-reroll')!.textContent).toBe('지원 무료')

    screens.askRevive(vi.fn(), vi.fn())
    expect(ui.textContent).toContain('작전 지원 부활')
    expect(ui.textContent).not.toContain('웹 체험판')

    // 승리 햅틱 및 문구
    screens.result({ win: true, wave: 10, kills: 42 }, vi.fn(), vi.fn())
    expect(hapticNotification).toHaveBeenCalledWith('success')
    expect(ui.textContent).toContain('작전 성공 — 위병소 사수')

    // 자발적 포기 vs 패배 문구 분리
    screens.result({ win: false, wave: 3, kills: 7, gaveUp: true }, vi.fn(), vi.fn())
    expect(ui.textContent).toContain('작전 중단 — 자발적 포기')
    screens.result({ win: false, wave: 4, kills: 12, gaveUp: false }, vi.fn(), vi.fn())
    expect(ui.textContent).toContain('작전 실패 — 위병소 돌파됨')
  })
})
