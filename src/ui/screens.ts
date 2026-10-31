// docs/TECH.md §8 레인 A·B 경계 고정 시그니처
import { watchAd } from '../ads'
import { fetchAvailableAssets } from '../assets'
import { playSfx } from '../audio'
import { isNative } from '../platform'
import { BATTLE, ECONOMY, REWARD, SPECIALTIES, type CardKey } from '../data'
import {
  canFireSupport,
  cloneHud,
  getCardInitial,
  getCardName,
  getCharacterName,
  getCharacterIntro,
  getRankBars,
  getRankName,
  isSameHud,
  sortSynergies,
} from './helpers'
import { closePanel, showLobby } from './lobby'

// 승인된 B안. 금액의 의미는 부모의 접근성 이름으로 제공하고 그림 자체는 장식으로 둔다.
function coinIcon(): HTMLSpanElement {
  const wrap = document.createElement('span')
  wrap.className = 'currency-coin'
  wrap.setAttribute('aria-hidden', 'true')
  const image = document.createElement('img')
  image.src = '/assets/icon_coin.png'
  image.alt = ''
  image.width = image.height = 64
  image.addEventListener('error', () => {
    image.remove()
    wrap.textContent = '●'
    wrap.classList.add('coin-fallback')
  }, { once: true })
  wrap.appendChild(image)
  return wrap
}

// T-110: 카드 그림이 실제로 있는 키(assets/index.json). 없으면 글자 상자로 폴백한다
// ponytail: 첫 상점이 열리기 전에 목록이 안 왔으면 그 판 첫 상점만 그림 없이 열린다, 그 뒤 렌더부터 적용
let artKeys = new Set<string>()
if (typeof window !== 'undefined') void fetchAvailableAssets().then((list) => (artKeys = new Set(list)))
// 위병소 HP 막대의 최대치(시작 HP). 시작값이 data.ts에 있다
let hpMax: number = BATTLE.baseHp

export type Phase = 'prep' | 'fight' | 'settle'
export type Hud = {
  wave: number
  waves: number
  defcon: 2 | 1
  supply: number
  baseHp: number
  phase: Phase
  prepLeft: number
  speed: 1 | 2
  synergies: { card: string; count: number; on: boolean }[]
  support?: number
}
export type Offer = { card: string; cost: number } | null

let currentCtl: BattleCtl | null = null
let lastHud: Hud | null = null
let currentSpeed: 1 | 2 = 1
let bannerTimer: ReturnType<typeof setTimeout> | null = null
let defconFlashTimer: ReturnType<typeof setTimeout> | null = null

interface UiRefs {
  root: HTMLElement
  hudEl: HTMLElement
  pauseBtn: HTMLButtonElement
  waveBox: HTMLElement
  defconBadge: HTMLElement
  supplyVal: HTMLElement
  hpVal: HTMLElement
  prepPill: HTMLElement
  supplyAdBtn: HTMLButtonElement
  speedBtn: HTMLButtonElement
  supportBtn: HTMLButtonElement
  synergyRail: HTMLElement
  shopEl: HTMLElement
  shopCards: HTMLElement
  rerollBtn: HTMLButtonElement
  freeRerollBtn: HTMLButtonElement
  goBtn: HTMLButtonElement
  specialtyBackdrop: HTMLElement
  cardInfoBackdrop: HTMLElement
  bannerEl: HTMLElement
  defconFlashEl: HTMLElement
  pauseBackdrop: HTMLElement
  reviveBackdrop: HTMLElement
  resultBackdrop: HTMLElement
  exitBackdrop: HTMLElement
}

let refs: UiRefs | null = null

function getUiRoot(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.getElementById('ui')
}

function ensureRefs(): UiRefs | null {
  const root = getUiRoot()
  if (!root) return null
  if (refs && refs.root === root && root.contains(refs.hudEl)) {
    return refs
  }

  // HUD
  const hudEl = document.createElement('div')
  hudEl.className = 'ui-hud hidden'

  const rowTop = document.createElement('div')
  rowTop.className = 'hud-row-top'

  const leftGroup = document.createElement('div')
  leftGroup.className = 'hud-left-group'

  const pauseBtn = document.createElement('button')
  pauseBtn.type = 'button'
  pauseBtn.className = 'mil-btn hud-pause-btn'
  pauseBtn.textContent = 'Ⅱ'
  pauseBtn.setAttribute('aria-label', '일시정지')
  pauseBtn.addEventListener('click', () => {
    if (!currentCtl) return
    currentCtl.pause()
    openPauseModal()
  })
  leftGroup.appendChild(pauseBtn)

  const centerGroup = document.createElement('div')
  centerGroup.className = 'hud-center-group'

  const waveBox = document.createElement('div')
  waveBox.className = 'hud-wave-box'
  waveBox.textContent = '웨이브 1/10'

  const defconBadge = document.createElement('div')
  defconBadge.className = 'hud-defcon-badge defcon-2'
  defconBadge.textContent = '데프콘 2'

  centerGroup.append(waveBox, defconBadge)

  const rightGroup = document.createElement('div')
  rightGroup.className = 'hud-right-group'

  const speedBtn = document.createElement('button')
  speedBtn.type = 'button'
  speedBtn.className = 'mil-btn hud-speed-btn'
  speedBtn.textContent = '1x'
  speedBtn.addEventListener('click', () => {
    if (!currentCtl) return
    const nextSpeed: 1 | 2 = currentSpeed === 1 ? 2 : 1
    currentSpeed = nextSpeed
    speedBtn.textContent = `${nextSpeed}x`
    speedBtn.classList.toggle('active-2x', nextSpeed === 2)
    currentCtl.setSpeed(nextSpeed)
  })
  rightGroup.appendChild(speedBtn)

  rowTop.append(leftGroup, centerGroup, rightGroup)

  const rowBottom = document.createElement('div')
  rowBottom.className = 'hud-row-bottom'

  const statsGroup = document.createElement('div')
  statsGroup.className = 'hud-left-group'

  const supplyPill = document.createElement('div')
  supplyPill.className = 'hud-stat-pill currency-balance'
  supplyPill.setAttribute('role', 'img')
  supplyPill.setAttribute('aria-label', '보유 코인 0개')
  const supplyVal = document.createElement('span')
  supplyVal.className = 'val'
  supplyVal.textContent = '0'
  supplyPill.append(coinIcon(), supplyVal)

  const hpPill = document.createElement('div')
  hpPill.className = 'hud-stat-pill hp-pill'
  const hpLabel = document.createElement('span')
  hpLabel.textContent = '위병소 HP'
  const hpVal = document.createElement('span')
  hpVal.className = 'val'
  hpVal.textContent = '20'
  hpPill.append(hpLabel, hpVal)

  const prepPill = document.createElement('div')
  prepPill.className = 'hud-prep-pill'
  prepPill.textContent = '준비 30초'

  statsGroup.append(supplyPill, hpPill, prepPill)

  const supplyAdBtn = document.createElement('button')
  supplyAdBtn.type = 'button'
  supplyAdBtn.className = 'mil-btn brass hud-supply-ad-btn'
  supplyAdBtn.append(isNative() ? '📺 ' : '체험 ', coinIcon(), `+${REWARD.adSupplyAmount}`)
  supplyAdBtn.setAttribute('aria-label', `${isNative() ? '광고 보고' : '체험'} 코인 ${REWARD.adSupplyAmount}개 받기`)
  supplyAdBtn.addEventListener('click', () => {
    if (!currentCtl || supplyAdBtn.disabled) return
    supplyAdBtn.disabled = true
    void watchAd('supply').then((ok) => {
      supplyAdBtn.disabled = false
      if (ok) currentCtl?.adSupply()
    })
  })

  rowBottom.append(statsGroup, supplyAdBtn)

  const supportBtn = document.createElement('button')
  supportBtn.type = 'button'
  supportBtn.className = 'mil-btn hud-support-btn disabled'
  supportBtn.disabled = true
  supportBtn.textContent = '화력 지원 ×0'
  supportBtn.addEventListener('click', () => {
    if (supportBtn.disabled) return
    currentCtl?.fireSupport?.()
  })

  hudEl.append(rowTop, rowBottom, supportBtn)

  // 좌측 활성 시너지 줄
  const synergyRail = document.createElement('div')
  synergyRail.className = 'ui-synergy-rail'

  // 하단 상점 패널
  const shopEl = document.createElement('div')
  shopEl.className = 'ui-shop closed'

  const shopCards = document.createElement('div')
  shopCards.className = 'shop-cards'

  const shopActions = document.createElement('div')
  shopActions.className = 'shop-actions'

  const rerollBtn = document.createElement('button')
  rerollBtn.type = 'button'
  rerollBtn.className = 'mil-btn shop-btn-reroll'
  rerollBtn.append('리롤 ', coinIcon(), String(ECONOMY.rerollCost))
  rerollBtn.setAttribute('aria-label', `상점 리롤, 코인 ${ECONOMY.rerollCost}개 사용`)

  const freeRerollBtn = document.createElement('button')
  freeRerollBtn.type = 'button'
  freeRerollBtn.className = 'mil-btn brass shop-btn-free-reroll'
  freeRerollBtn.textContent = isNative() ? '📺 무료' : '체험 무료'
  freeRerollBtn.addEventListener('click', () => {
    if (!currentCtl || freeRerollBtn.disabled) return
    freeRerollBtn.disabled = true
    void watchAd('reroll').then((ok) => {
      freeRerollBtn.disabled = false
      if (ok) currentCtl?.adReroll()
    })
  })

  const goBtn = document.createElement('button')
  goBtn.type = 'button'
  goBtn.className = 'mil-btn action-go shop-btn-go'
  goBtn.textContent = '전투 투입!'

  shopActions.append(rerollBtn, freeRerollBtn, goBtn)
  shopEl.append(shopCards, shopActions)

  // 카드 정보 시트
  const cardInfoBackdrop = document.createElement('div')
  cardInfoBackdrop.className = 'ui-card-info-backdrop hidden'
  cardInfoBackdrop.addEventListener('click', (e) => {
    if (e.target === cardInfoBackdrop) cardInfo(null)
  })

  const specialtyBackdrop = document.createElement('div')
  specialtyBackdrop.className = 'ui-modal-backdrop specialty-backdrop hidden'

  // 중앙 배너
  const bannerEl = document.createElement('div')
  bannerEl.className = 'ui-banner hidden'

  // 데프콘 1 화면 테두리 붉은 점멸 오버레이
  const defconFlashEl = document.createElement('div')
  defconFlashEl.className = 'ui-defcon-flash hidden'

  // 일시정지 모달
  const pauseBackdrop = document.createElement('div')
  pauseBackdrop.className = 'ui-modal-backdrop hidden'

  // 부활 모달
  const reviveBackdrop = document.createElement('div')
  reviveBackdrop.className = 'ui-modal-backdrop hidden'

  // 결과 모달
  const resultBackdrop = document.createElement('div')
  resultBackdrop.className = 'ui-modal-backdrop hidden'

  // 종료 확인 모달 (레인 B 전용)
  const exitBackdrop = document.createElement('div')
  exitBackdrop.className = 'ui-modal-backdrop hidden'

  root.append(
    hudEl,
    synergyRail,
    shopEl,
    cardInfoBackdrop,
    specialtyBackdrop,
    bannerEl,
    defconFlashEl,
    pauseBackdrop,
    reviveBackdrop,
    resultBackdrop,
    exitBackdrop
  )

  refs = {
    root,
    hudEl,
    pauseBtn,
    waveBox,
    defconBadge,
    supplyVal,
    hpVal,
    prepPill,
    supplyAdBtn,
    speedBtn,
    supportBtn,
    synergyRail,
    shopEl,
    shopCards,
    rerollBtn,
    freeRerollBtn,
    goBtn,
    cardInfoBackdrop,
    specialtyBackdrop,
    bannerEl,
    defconFlashEl,
    pauseBackdrop,
    reviveBackdrop,
    resultBackdrop,
    exitBackdrop,
  }

  syncCtlButtons()
  return refs
}

function syncCtlButtons(): void {
  if (!refs) return
  const hasCtl = currentCtl !== null
  refs.pauseBtn.classList.toggle('hidden', !hasCtl)
  refs.speedBtn.classList.toggle('hidden', !hasCtl)
  refs.supplyAdBtn.classList.toggle('hidden', !hasCtl)
  refs.freeRerollBtn.classList.toggle('hidden', !hasCtl)
  if (!hasCtl) {
    refs.pauseBackdrop.classList.add('hidden')
  }
}

function openPauseModal(): void {
  const r = ensureRefs()
  if (!r) return
  r.pauseBackdrop.innerHTML = ''

  const card = document.createElement('div')
  card.className = 'ui-modal-card'

  const header = document.createElement('div')
  header.className = 'modal-header'
  header.textContent = '작전 일시정지'

  const body = document.createElement('div')
  body.className = 'modal-body'
  const note = document.createElement('div')
  note.className = 'modal-note'
  note.textContent = '전투가 일시정지되었습니다. 작전을 계속하거나 포기할 수 있습니다.'
  body.appendChild(note)

  const actions = document.createElement('div')
  actions.className = 'modal-actions'

  const resumeBtn = document.createElement('button')
  resumeBtn.type = 'button'
  resumeBtn.className = 'mil-btn action-go'
  resumeBtn.textContent = '계속'
  resumeBtn.addEventListener('click', () => {
    r.pauseBackdrop.classList.add('hidden')
    currentCtl?.resume()
  })

  const quitBtn = document.createElement('button')
  quitBtn.type = 'button'
  quitBtn.className = 'mil-btn'
  quitBtn.textContent = '포기'
  quitBtn.addEventListener('click', () => {
    r.pauseBackdrop.classList.add('hidden')
    chooseSpecialty(null)
    currentCtl?.quit()
  })

  actions.append(resumeBtn, quitBtn)
  card.append(header, body, actions)
  r.pauseBackdrop.appendChild(card)
  r.pauseBackdrop.classList.remove('hidden')
}

export function hud(h: Hud): void {
  const r = ensureRefs()
  if (!r) return
  if (isSameHud(lastHud, h) && !r.hudEl.classList.contains('hidden')) {
    return
  }
  lastHud = cloneHud(h)
  currentSpeed = h.speed

  r.hudEl.classList.remove('hidden')
  r.waveBox.textContent = `웨이브 ${h.wave}/${h.waves}`

  r.defconBadge.textContent = `데프콘 ${h.defcon}`
  r.defconBadge.className = `hud-defcon-badge defcon-${h.defcon}`

  r.supplyVal.textContent = String(h.supply)
  r.supplyVal.parentElement?.setAttribute('aria-label', `보유 코인 ${h.supply}개`)
  r.hpVal.textContent = String(h.baseHp)
  // 위병소 HP 막대: 시작 HP 대비 비율, 30% 이하면 붉게
  hpMax = Math.max(hpMax, h.baseHp)
  const hpPillEl = r.hpVal.parentElement
  hpPillEl?.style.setProperty('--hp', `${Math.max(0, Math.min(100, (h.baseHp / hpMax) * 100))}%`)
  hpPillEl?.classList.toggle('danger', h.baseHp / hpMax <= 0.3)

  if (h.phase === 'prep') {
    r.prepPill.textContent = `준비 ${Math.max(0, Math.ceil(h.prepLeft))}초`
  } else if (h.phase === 'fight') {
    r.prepPill.textContent = '교전 중'
  } else {
    r.prepPill.textContent = '웨이브 정산'
  }

  r.speedBtn.textContent = `${h.speed}x`
  r.speedBtn.classList.toggle('active-2x', h.speed === 2)

  const supportCount = Math.max(0, h.support ?? 0)
  const canSupport = canFireSupport(h.phase, h.support)
  r.supportBtn.textContent = `화력 지원 ×${supportCount}`
  r.supportBtn.disabled = !canSupport
  r.supportBtn.classList.toggle('disabled', !canSupport)
  r.supportBtn.classList.toggle('active-support', canSupport)

  // 시너지 갱신
  r.synergyRail.innerHTML = ''
  const sorted = sortSynergies(h.synergies)
  for (const syn of sorted) {
    const chip = document.createElement('div')
    chip.className = `synergy-chip${syn.on ? ' on' : ''}`

    const icon = document.createElement('span')
    icon.className = 'synergy-icon'
    icon.textContent = getCardInitial(syn.card)

    const label = document.createElement('span')
    label.textContent = `${getCardName(syn.card)} ×${syn.count}`

    chip.append(icon, label)
    r.synergyRail.appendChild(chip)
  }
}

export function shop(
  open: boolean,
  offers: Offer[],
  supply: number,
  onBuy: (i: number) => void,
  onReroll: () => void,
  onGo: () => void
): void {
  const r = ensureRefs()
  if (!r) return

  r.shopEl.classList.toggle('closed', !open)
  r.rerollBtn.onclick = () => onReroll()
  r.goBtn.onclick = () => onGo()

  r.shopCards.innerHTML = ''
  for (let i = 0; i < 5; i++) {
    const offer = offers[i] ?? null
    const btn = document.createElement('button')
    btn.type = 'button'

    if (!offer) {
      btn.className = 'shop-card empty'
      btn.disabled = true
      btn.textContent = '—'
    } else {
      const insufficient = offer.cost > supply
      const art = artKeys.has(`card_${offer.card}`)
      btn.className = `shop-card${insufficient ? ' insufficient' : ''}${art ? ' has-art' : ''}`
      if (art) btn.style.backgroundImage = `url('/assets/card_${offer.card}.png')`

      const initialEl = document.createElement('div')
      initialEl.className = 'shop-card-initial'
      initialEl.textContent = getCardInitial(offer.card)

      const nameEl = document.createElement('div')
      nameEl.className = 'shop-card-name'
      nameEl.textContent = getCardName(offer.card)

      const costEl = document.createElement('div')
      costEl.className = 'shop-card-cost'
      costEl.append(coinIcon(), String(offer.cost))
      btn.setAttribute('aria-label', `${getCardName(offer.card)} 구매, 코인 ${offer.cost}개${insufficient ? ', 코인 부족' : ''}`)

      btn.append(initialEl, nameEl, costEl)
      btn.addEventListener('click', () => onBuy(i))
    }

    r.shopCards.appendChild(btn)
  }
}

export function cardInfo(card: string | null, rank?: number): void {
  cardInfoDetail(card, rank)
}

export type CardDetail = { name?: string; spec?: 'A' | 'B'; rows?: [string, string][] }

export function cardInfoDetail(card: string | null, rank?: number, detail?: CardDetail): void {
  const r = ensureRefs()
  if (!r) return

  if (card === null) {
    r.cardInfoBackdrop.classList.add('hidden')
    r.cardInfoBackdrop.innerHTML = ''
    return
  }

  r.cardInfoBackdrop.innerHTML = ''
  const sheet = document.createElement('div')
  sheet.className = 'ui-card-sheet'

  const header = document.createElement('div')
  header.className = 'card-sheet-header'

  const titleWrap = document.createElement('div')
  const bars = document.createElement('span')
  bars.className = 'rank-bars'
  const barCount = getRankBars(rank)
  for (let i = 0; i < barCount; i++) {
    const line = document.createElement('span')
    line.className = 'rank-bar-line'
    bars.appendChild(line)
  }

  const title = document.createElement('span')
  title.className = 'card-sheet-title'
  title.textContent = getCardName(card)
  titleWrap.append(bars, title)

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'mil-btn'
  closeBtn.textContent = '닫기'
  closeBtn.addEventListener('click', () => cardInfo(null))

  header.append(titleWrap, closeBtn)

  const grid = document.createElement('div')
  grid.className = 'card-sheet-grid'

  const rows: [string, string][] = [
    ['인물', getCharacterName(card, rank, detail?.name)],
    ['소개', getCharacterIntro(card)],
    ['보직명', getCardName(card)],
    ['계급(짬)', getRankName(rank)],
    ['특기', detail?.spec ? `${detail.spec} · ${SPECIALTIES[card as CardKey]?.[detail.spec]?.name ?? '—'}` : '미선택'],
    ...(detail?.spec ? [['특기 효과', SPECIALTIES[card as CardKey]?.[detail.spec]?.description ?? '—'] as [string, string]] : []),
    ...(detail?.rows ?? []),
  ]

  for (const [label, val] of rows) {
    const lEl = document.createElement('div')
    lEl.className = 'card-sheet-label'
    lEl.textContent = label
    const vEl = document.createElement('div')
    vEl.className = 'card-sheet-val'
    vEl.textContent = val
    grid.append(lEl, vEl)
  }

  sheet.append(header, grid)
  r.cardInfoBackdrop.appendChild(sheet)
  r.cardInfoBackdrop.classList.remove('hidden')
}

export function banner(text: string, kind: 'flag' | 'defcon' | 'info'): void {
  const r = ensureRefs()
  if (!r) return

  if (bannerTimer !== null) {
    clearTimeout(bannerTimer)
    bannerTimer = null
  }

  r.bannerEl.textContent = text
  r.bannerEl.className = `ui-banner kind-${kind}`

  if (kind === 'defcon') {
    const playOptionalSfx = playSfx as (key: string) => boolean
    try {
      playOptionalSfx('sfx_radio')
      playOptionalSfx('sfx_siren')
    } catch {
      // sfx_radio·sfx_siren 파일이 없으면 조용히 넘어간다
    }

    if (defconFlashTimer !== null) {
      clearTimeout(defconFlashTimer)
      defconFlashTimer = null
    }
    r.defconFlashEl.classList.remove('hidden', 'active')
    void r.defconFlashEl.offsetWidth
    r.defconFlashEl.classList.add('active')
    defconFlashTimer = setTimeout(() => {
      r.defconFlashEl.classList.remove('active')
      r.defconFlashEl.classList.add('hidden')
      defconFlashTimer = null
    }, 1200)
  }

  bannerTimer = setTimeout(() => {
    r.bannerEl.classList.add('hidden')
    bannerTimer = null
  }, 1500)
}

export function result(
  r: { win: boolean; wave: number; kills: number; unlocked?: string; gaveUp?: boolean },
  onAgain: () => void,
  onLobby: () => void
): void {
  const refsObj = ensureRefs()
  if (!refsObj) return

  refsObj.resultBackdrop.innerHTML = ''
  const card = document.createElement('div')
  card.className = 'ui-modal-card'

  const header = document.createElement('div')
  header.className = `modal-header ${r.win ? 'win' : 'lose'}`
  header.textContent = r.gaveUp ? '작전 중단 — 자발적 포기' : r.win ? '작전 성공 — 위병소 사수' : '작전 실패 — 위병소 돌파됨'

  const body = document.createElement('div')
  body.className = 'modal-body'

  const stats: [string, string][] = [
    ['결과', r.gaveUp ? '포기' : r.win ? '승리' : '패배'],
    ['도달 웨이브', `${r.wave} / 10`],
    ['처치 수', `${r.kills}`],
    ['새 해금 카드', r.unlocked ? getCardName(r.unlocked) : '—'],
  ]

  for (const [k, v] of stats) {
    const row = document.createElement('div')
    row.className = 'modal-stat-row'
    const lEl = document.createElement('span')
    lEl.className = 'modal-stat-label'
    lEl.textContent = k
    const vEl = document.createElement('span')
    vEl.className = 'modal-stat-val'
    vEl.textContent = v
    row.append(lEl, vEl)
    body.appendChild(row)
  }

  const actions = document.createElement('div')
  actions.className = 'modal-actions'

  const againBtn = document.createElement('button')
  againBtn.type = 'button'
  againBtn.className = 'mil-btn action-go'
  againBtn.textContent = '다시 투입'
  againBtn.addEventListener('click', () => {
    refsObj.resultBackdrop.classList.add('hidden')
    onAgain()
  })

  const lobbyBtn = document.createElement('button')
  lobbyBtn.type = 'button'
  lobbyBtn.className = 'mil-btn'
  lobbyBtn.textContent = '생활관'
  lobbyBtn.addEventListener('click', () => {
    refsObj.resultBackdrop.classList.add('hidden')
    onLobby()
  })

  actions.append(againBtn, lobbyBtn)
  card.append(header, body, actions)
  refsObj.resultBackdrop.appendChild(card)
  refsObj.resultBackdrop.classList.remove('hidden')
}

export function askRevive(onYes: () => void, onNo: () => void): void {
  const r = ensureRefs()
  if (!r) return

  r.reviveBackdrop.innerHTML = ''
  const card = document.createElement('div')
  card.className = 'ui-modal-card'

  const header = document.createElement('div')
  header.className = 'modal-header lose'
  header.textContent = '위병소 방어선 붕괴 — 긴급 부활'

  const body = document.createElement('div')
  body.className = 'modal-body'

  const desc = document.createElement('div')
  desc.className = 'modal-stat-row'
  desc.innerHTML = '<span class="modal-stat-label">부활 효과</span><span class="modal-stat-val">HP 10 + 저지선 복구</span>'

  const note = document.createElement('div')
  note.className = 'modal-note'
  note.textContent = isNative() ? '광고를 끝까지 보면 부활합니다' : '웹 체험판에서는 광고 없이 부활을 체험할 수 있습니다'

  body.append(desc, note)

  const actions = document.createElement('div')
  actions.className = 'modal-actions'

  const yesBtn = document.createElement('button')
  yesBtn.type = 'button'
  yesBtn.className = 'mil-btn brass'
  yesBtn.textContent = isNative() ? '📺 광고 보고 부활' : '체험 부활'
  yesBtn.addEventListener('click', () => {
    if (yesBtn.disabled) return
    yesBtn.disabled = true
    noBtn.disabled = true
    void watchAd('revive').then((ok) => {
      r.reviveBackdrop.classList.add('hidden')
      if (ok) onYes()
      else onNo()
    })
  })

  const noBtn = document.createElement('button')
  noBtn.type = 'button'
  noBtn.className = 'mil-btn'
  noBtn.textContent = '포기'
  noBtn.addEventListener('click', () => {
    r.reviveBackdrop.classList.add('hidden')
    onNo()
  })

  actions.append(yesBtn, noBtn)
  card.append(header, body, actions)
  r.reviveBackdrop.appendChild(card)
  r.reviveBackdrop.classList.remove('hidden')
}

// 전투 제어: BattleScene이 시작할 때 bindBattle(ctl), 끝날 때 bindBattle(null)을 부른다.
// HUD의 일시정지·2배속 버튼, 일시정지 모달(계속·포기), 전투 중 뒤로가기, 광고 보상 버튼은 B가 그리고 이 함수들을 부른다.
export type BattleCtl = {
  pause(): void
  resume(): void
  setSpeed(s: 1 | 2): void
  quit(): void          // 포기 → A가 결과 화면(result)으로 간다
  adReroll(): void      // 광고를 끝까지 본 뒤 B가 부른다. A가 무료 리롤 1회를 적용한다
  adSupply(): void      // 광고를 끝까지 본 뒤 B가 부른다. A가 보급 +5를 적용한다
  fireSupport?(): void  // M3(선택): HUD "화력 지원" 버튼
}

export function bindBattle(ctl: BattleCtl | null): void {
  if (ctl !== currentCtl || ctl === null) chooseSpecialty(null)
  currentCtl = ctl
  ensureRefs()
  syncCtlButtons()
}

export function lobby(): void {
  chooseSpecialty(null)
  currentCtl = null
  hpMax = BATTLE.baseHp
  lastHud = null
  if (bannerTimer !== null) {
    clearTimeout(bannerTimer)
    bannerTimer = null
  }
  if (defconFlashTimer !== null) {
    clearTimeout(defconFlashTimer)
    defconFlashTimer = null
  }
  const r = ensureRefs()
  if (r) {
    r.hudEl.classList.add('hidden')
    r.synergyRail.innerHTML = ''
    r.shopEl.classList.add('closed')
    r.cardInfoBackdrop.classList.add('hidden')
    r.bannerEl.classList.add('hidden')
    r.defconFlashEl.classList.remove('active')
    r.defconFlashEl.classList.add('hidden')
    r.pauseBackdrop.classList.add('hidden')
    r.reviveBackdrop.classList.add('hidden')
    r.resultBackdrop.classList.add('hidden')
    syncCtlButtons()
  }
  void showLobby()
}

// 레인 B 전용: 안드로이드 뒤로가기 종료 확인 모달 (T-101 할 일 6)
export function confirmExit(onYes: () => void, onNo: () => void): void {
  const r = ensureRefs()
  if (!r) return

  r.exitBackdrop.innerHTML = ''
  const card = document.createElement('div')
  card.className = 'ui-modal-card'

  const header = document.createElement('div')
  header.className = 'modal-header'
  header.textContent = '종료 확인'

  const body = document.createElement('div')
  body.className = 'modal-body'

  const note = document.createElement('div')
  note.className = 'modal-note'
  note.textContent = '데프콘 2 작전을 종료하시겠습니까?'
  body.appendChild(note)

  const actions = document.createElement('div')
  actions.className = 'modal-actions'

  const noBtn = document.createElement('button')
  noBtn.type = 'button'
  noBtn.className = 'mil-btn action-go'
  noBtn.textContent = '계속'
  noBtn.addEventListener('click', () => {
    r.exitBackdrop.classList.add('hidden')
    onNo()
  })

  const yesBtn = document.createElement('button')
  yesBtn.type = 'button'
  yesBtn.className = 'mil-btn'
  yesBtn.textContent = '나가기'
  yesBtn.addEventListener('click', () => {
    r.exitBackdrop.classList.add('hidden')
    onYes()
  })

  actions.append(noBtn, yesBtn)
  card.append(header, body, actions)
  r.exitBackdrop.appendChild(card)
  r.exitBackdrop.classList.remove('hidden')
}

export function handleBack(onExit: () => void): void {
  if (!currentCtl && refs && !refs.cardInfoBackdrop.classList.contains('hidden')) {
    cardInfo(null)
    return
  }
  if (closePanel()) return
  if (currentCtl) {
    currentCtl.pause()
    openPauseModal()
    return
  }
  confirmExit(onExit, () => {})
}

// 선택은 한 번만 처리한다. 숨겨진 옛 버튼과 종료된 판의 콜백은 폐기한다.
let specialtyPick: ((spec: 'A' | 'B') => void) | undefined
export function chooseSpecialty(
  request: { card: string; rank: number; name?: string } | null,
  onPick?: (spec: 'A' | 'B') => void
): void {
  specialtyPick = undefined
  const r = ensureRefs()
  if (!r) return
  r.specialtyBackdrop.replaceChildren()
  r.specialtyBackdrop.classList.add('hidden')
  if (!request) return
  cardInfo(null)
  const choices = SPECIALTIES[request.card as CardKey]
  if (!choices) return
  specialtyPick = onPick
  const panel = document.createElement('div')
  panel.className = 'ui-modal-card specialty-card'
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')
  panel.setAttribute('aria-label', '특기 선택')
  const header = document.createElement('div')
  header.className = 'modal-header'
  header.textContent = `${getCharacterName(request.card, request.rank, request.name)} · ${getRankName(request.rank)}`
  const note = document.createElement('div')
  note.className = 'modal-note'
  note.textContent = '특기를 선택하십시오. 선택하는 동안 작전은 멈춥니다.'
  const options = document.createElement('div')
  options.className = 'specialty-options'
  for (const spec of ['A', 'B'] as const) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'mil-btn specialty-option'
    const name = document.createElement('strong')
    name.textContent = `${spec} · ${choices[spec].name}`
    const description = document.createElement('span')
    description.textContent = choices[spec].description
    button.append(name, description)
    button.addEventListener('click', () => {
      if (!panel.isConnected || !specialtyPick || !r.pauseBackdrop.classList.contains('hidden')) return
      const pick = specialtyPick
      options.querySelectorAll('button').forEach((b) => { b.disabled = true })
      chooseSpecialty(null)
      pick(spec)
    })
    options.append(button)
  }
  panel.append(header, note, options)
  r.specialtyBackdrop.append(panel)
  r.specialtyBackdrop.classList.remove('hidden')
  options.querySelector('button')?.focus()
}
