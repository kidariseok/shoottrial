import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  calculateLogicalHeight,
  computeBattleShopScrollY,
  computeCanvasLayout,
  computeCanvasSafeInsets,
} from '../src/device'
import { ALL_CARDS, getCardRoleMeta, getShopCardInfoRows } from '../src/ui/helpers'
import type { Offer } from '../src/ui/screens'

// 이벤트 버블링과 stopPropagation을 실제 브라우저와 동일하게 재현하는 최소 DOM 스텁
class BubbleClassList {
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

type ClickEv = {
  target: BubbleEl
  stopped: boolean
  stopPropagation: () => void
  preventDefault: () => void
  key?: string
}

class BubbleEl {
  tagName: string
  id = ''
  type = ''
  src = ''
  alt = ''
  disabled = false
  offsetWidth = 0
  parentElement: BubbleEl | null = null
  children: BubbleEl[] = []
  classList = new BubbleClassList()
  attrs = new Map<string, string>()
  listeners = new Map<string, ((e: ClickEv) => void)[]>()
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
    if (this.children.length > 0) return this.children.map((c) => c.textContent).join('')
    return this._text
  }
  set textContent(v: string) {
    this._text = v
    this.children = []
  }

  get innerHTML(): string {
    return ''
  }
  set innerHTML(_v: string) {
    this.children = []
    this._text = ''
  }

  appendChild(child: BubbleEl): BubbleEl {
    child.parentElement = this
    this.children.push(child)
    return child
  }
  append(...nodes: BubbleEl[]): void {
    for (const n of nodes) this.appendChild(n)
  }
  replaceChildren(...nodes: BubbleEl[]): void {
    for (const c of this.children) c.parentElement = null
    this.children = []
    this.append(...nodes)
  }
  remove(): void {
    if (!this.parentElement) return
    this.parentElement.children = this.parentElement.children.filter((c) => c !== this)
    this.parentElement = null
  }
  contains(target: BubbleEl): boolean {
    if (target === this) return true
    return this.children.some((c) => c.contains(target))
  }
  setAttribute(k: string, v: string): void {
    this.attrs.set(k, v)
  }
  getAttribute(k: string): string | null {
    return this.attrs.get(k) ?? null
  }
  addEventListener(type: string, cb: (e: ClickEv) => void): void {
    const list = this.listeners.get(type) ?? []
    list.push(cb)
    this.listeners.set(type, list)
  }
  click(): void {
    if (this.disabled) return
    const ev: ClickEv = {
      target: this,
      stopped: false,
      stopPropagation() {
        this.stopped = true
      },
      preventDefault() {},
    }
    let cur: BubbleEl | null = this
    while (cur && !ev.stopped) {
      cur.onclick?.()
      for (const cb of [...(cur.listeners.get('click') ?? [])]) {
        cb(ev)
      }
      cur = cur.parentElement
    }
  }
  querySelectorAll(sel: string): BubbleEl[] {
    const out: BubbleEl[] = []
    const match = (el: BubbleEl): boolean => {
      if (sel.startsWith('.')) return el.classList.contains(sel.slice(1))
      return el.tagName === sel.toUpperCase()
    }
    const walk = (node: BubbleEl): void => {
      for (const c of node.children) {
        if (match(c)) out.push(c)
        walk(c)
      }
    }
    walk(this)
    return out
  }
  querySelector(sel: string): BubbleEl | null {
    return this.querySelectorAll(sel)[0] ?? null
  }
}

function setupBubbleDom() {
  const body = new BubbleEl('body')
  const ui = new BubbleEl('div')
  ui.id = 'ui'
  body.appendChild(ui)
  const docEl = new BubbleEl('html')
  const dispatched: { type: string; detail?: unknown }[] = []
  vi.stubGlobal('document', {
    body,
    documentElement: docEl,
    createElement: (tag: string) => new BubbleEl(tag),
    getElementById: (id: string) => (id === 'ui' ? ui : null),
    addEventListener: vi.fn(),
  })
  vi.stubGlobal('window', {
    innerWidth: 393,
    innerHeight: 852,
    addEventListener: vi.fn(),
    dispatchEvent: (ev: { type: string; detail?: unknown }) => {
      dispatched.push({ type: ev.type, detail: ev.detail })
      return true
    },
  })
  return { ui, dispatched }
}

afterEach(() => {
  vi.doUnmock('../src/platform')
  vi.doUnmock('../src/audio')
  vi.doUnmock('../src/assets')
  vi.doUnmock('../src/ads')
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('T-126 Edge-to-Edge 캔버스 및 필러박스 0px 검증', () => {
  it('iPhone 15 Pro(393×852, 19.5:9) Edge-to-Edge에서 좌우 필러박스가 0px이다', () => {
    const w = 393
    const h = 852
    const logicalH = calculateLogicalHeight(w, h)
    expect(logicalH).toBe(1560)

    // Phaser Scale.FIT 계산: 720×1560 -> 393×852 컨테이너
    const scale = Math.min(w / 720, h / logicalH)
    const renderedW = 720 * scale
    const renderedH = logicalH * scale
    const left = (w - renderedW) / 2
    const top = (h - renderedH) / 2

    const layout = computeCanvasLayout(
      { left, right: left + renderedW, bottom: top + renderedH, width: renderedW },
      { left: 0, right: w, bottom: h, width: w, height: h }
    )
    expect(renderedW).toBeCloseTo(393, 6)
    expect(layout.leftGap).toBe(0)
    expect(layout.rightGap).toBe(0)
    expect(layout.scale).toBeCloseTo(393 / 720, 6)
    expect(layout.bottomGap).toBeLessThan(1)
  })

  it('iPhone 15 Pro Safe Area(상단 59pt, 하단 34pt)를 생활관 논리 좌표로 정확히 환산한다', () => {
    const insets = computeCanvasSafeInsets(
      { top: 59, right: 0, bottom: 34, left: 0 },
      { top: 0.25, left: 0, right: 393, bottom: 851.75, width: 393 },
      { width: 393, height: 852 },
      720
    )
    expect(insets.top).toBe(108)
    expect(insets.bottom).toBe(62)
    expect(insets.left).toBe(0)
    expect(insets.right).toBe(0)
  })

  it('전투 상점 열림 시 15 Pro(393×852)와 SE(375×667) 모두 대기석·판매·위병소 방어선과 겹치지 않는 scrollY를 산출한다', () => {
    // iPhone 15 Pro: #shop 높이 133pt, bottom 34pt -> shopTopCss = 852 - 34 - 133 = 685pt
    const scale15 = 393 / 720
    const scroll15 = computeBattleShopScrollY({
      canvasTop: 0.25,
      canvasHeight: 1560 * scale15,
      logicalHeight: 1560,
      shopTopCss: 852 - 34 - 133,
      shopOpen: true,
    })
    expect(scroll15).toBeGreaterThan(0)
    const benchBottomAfter15 = 0.25 + (1560 - 120 - scroll15) * scale15
    expect(benchBottomAfter15).toBeLessThanOrEqual(852 - 34 - 133)

    // iPhone SE: #shop 컴팩트 높이 98pt, bottom 0pt -> shopTopCss = 667 - 98 = 569pt
    const logicalSe = calculateLogicalHeight(375, 667)
    const scaleSe = Math.min(375 / 720, 667 / logicalSe)
    const scrollSe = computeBattleShopScrollY({
      canvasTop: 0,
      canvasHeight: logicalSe * scaleSe,
      logicalHeight: logicalSe,
      shopTopCss: 667 - 98,
      shopOpen: true,
    })
    expect(scrollSe).toBeGreaterThan(0)
    const benchBottomAfterSe = (logicalSe - 120 - scrollSe) * scaleSe
    expect(benchBottomAfterSe).toBeLessThanOrEqual(667 - 98)

    // 상점이 닫히면 scrollY는 0으로 복귀한다
    expect(
      computeBattleShopScrollY({
        canvasTop: 0.25,
        canvasHeight: 1560 * scale15,
        logicalHeight: 1560,
        shopTopCss: 685,
        shopOpen: false,
      })
    ).toBe(0)
  })
})

describe('T-126 전투 하단 2단 카드바 · 역할 배지 · i 상세 정보 버튼', () => {
  it('10종 모든 병과가 역할 배지·색상 계열·기능 요약·상점 상세 행을 제공한다', () => {
    for (const card of ALL_CARDS) {
      const meta = getCardRoleMeta(card)
      expect(meta.role.length).toBeGreaterThan(0)
      expect(meta.summary.length).toBeGreaterThan(0)
      expect(meta.tip.length).toBeGreaterThan(0)
      const rows = new Map(getShopCardInfoRows(card))
      expect(rows.has('보급 비용')).toBe(true)
      expect(rows.has('특기 A')).toBe(true)
      expect(rows.has('특기 B')).toBe(true)
    }
  })

  it('2단 #shop에 5장 카드의 역할 배지·기능 요약·i 버튼이 렌더링되고, i 클릭 시 onBuy 없이 상세 정보 모달이 열린다', async () => {
    vi.resetModules()
    const { ui, dispatched } = setupBubbleDom()
    const hapticImpact = vi.fn(async () => {})
    vi.doMock('../src/platform', () => ({
      isNative: () => true,
      hasAds: () => false,
      hapticImpact,
      hapticNotification: vi.fn(async () => {}),
      hapticSelection: vi.fn(async () => {}),
    }))
    vi.doMock('../src/audio', () => ({
      playSfx: vi.fn(),
      playBgm: vi.fn(),
      setSettings: vi.fn(),
    }))
    vi.doMock('../src/assets', () => ({
      fetchAvailableAssets: vi.fn(async () => ['card_rifle', 'card_sniper', 'card_blower', 'card_cook', 'card_antitank']),
    }))
    vi.doMock('../src/ads', () => ({
      watchAd: vi.fn(async () => true),
    }))

    const screens = await import('../src/ui/screens')
    const offers: Offer[] = [
      { card: 'rifle', cost: 1 },
      { card: 'sniper', cost: 3 },
      { card: 'blower', cost: 2 },
      { card: 'cook', cost: 2 },
      { card: 'antitank', cost: 3 },
    ]
    const onBuy = vi.fn()
    const onReroll = vi.fn()
    const onGo = vi.fn()

    screens.shop(true, offers, 2, onBuy, onReroll, onGo)

    // 2단 구조 확인: 1단(.shop-actions)이 먼저, 2단(.shop-cards)이 아래
    const shopEl = ui.querySelector('.ui-shop')!
    expect(shopEl.children[0]!.classList.contains('shop-actions')).toBe(true)
    expect(shopEl.children[1]!.classList.contains('shop-cards')).toBe(true)
    expect(ui.querySelector('.shop-supply-badge')!.textContent).toBe('보급 2')
    expect(dispatched.some((e) => e.type === 'd2:shop-visibility')).toBe(true)

    // 5장 카드 모두 역할 배지·기능 요약·보급 비용·i 버튼 보유
    const cards = ui.querySelectorAll('.shop-card')
    expect(cards).toHaveLength(5)
    expect(cards.map((c) => c.querySelector('.shop-card-role')!.textContent)).toEqual([
      '딜러',
      '원거리',
      '탱커',
      '지원',
      '결전',
    ])
    expect(cards.map((c) => c.querySelector('.shop-card-summary')!.textContent)).toEqual([
      '안정 화력',
      '전열 관통',
      '넉백·도발',
      '아군 치료',
      '장갑 ×3',
    ])
    expect(cards.map((c) => c.querySelector('.shop-card-cost')!.textContent)).toEqual([
      '보급 1',
      '보급 3',
      '보급 2',
      '보급 2',
      '보급 3',
    ])
    // 보급 2일 때 비용 3 카드(저격수·대전차병)는 insufficient 스타일 유지
    expect(cards[0]!.classList.contains('insufficient')).toBe(false)
    expect(cards[1]!.classList.contains('insufficient')).toBe(true)
    expect(cards[4]!.classList.contains('insufficient')).toBe(true)

    // 우상단 i 버튼 클릭 -> stopPropagation으로 onBuy 호출 없이 상세 정보 모달 열림
    const sniperInfoBtn = cards[1]!.querySelector('.shop-card-info-btn')!
    sniperInfoBtn.click()
    expect(onBuy).not.toHaveBeenCalled()

    const sheetBackdrop = ui.querySelector('.ui-card-info-backdrop')!
    expect(sheetBackdrop.classList.contains('hidden')).toBe(false)
    expect(sheetBackdrop.textContent).toContain('저격수')
    expect(sheetBackdrop.textContent).toContain('원거리')
    expect(sheetBackdrop.textContent).toContain('전열 관통')
    expect(sheetBackdrop.textContent).toContain('특기 A')

    // 카드 본체 클릭 -> 정상 구매(onBuy) 호출
    cards[0]!.click()
    expect(onBuy).toHaveBeenCalledTimes(1)
    expect(onBuy).toHaveBeenCalledWith(0)

    // 리롤·전투 투입 버튼 정상 동작
    ui.querySelector('.shop-btn-reroll')!.click()
    ui.querySelector('.shop-btn-go')!.click()
    expect(onReroll).toHaveBeenCalledTimes(1)
    expect(onGo).toHaveBeenCalledTimes(1)
  })
})
