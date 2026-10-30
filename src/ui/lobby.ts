import { fetchAvailableAssets } from '../assets'
import { playBgm, playSfx, setSettings, type SfxKey } from '../audio'
import { defaultSave, load, save, type Save } from '../save'
import { isNative } from '../platform'
import { cardInfo, cardInfoDetail } from './screens'
import {
  ALL_CARDS,
  formatBriefingText,
  getCardInitial,
  getCardName,
  getCodexRows,
  loadAlarmFx,
  mergeUnlockedCards,
  sanitizeRookieName,
  saveAlarmFx,
} from './helpers'

const LOCAL_UNLOCKED_KEY = 'd2_unlocked'

export const BRIEFING_CUTS = [
  {
    key: 'brief_1',
    sfx: 'sfx_siren',
    tag: '01 / 04 · 자대 배치 첫날 밤',
    title: '낯선 생활관, 갑작스러운 경보',
    text: '6주 기초군사훈련을 마친 신병 {이름}. 자대 배치 첫날 밤, 생활관 스피커가 울린다.\n"실제 상황, 실제 상황. 데프콘 2 발령. 데프콘 2 발령."',
  },
  {
    key: 'brief_2',
    sfx: 'sfx_siren',
    tag: '02 / 04 · 화스트 페이스',
    title: '창밖이 번쩍였다',
    text: '군장을 싸기도 전에 포성이 생활관을 흔든다.\n동료들이 장비를 챙기고 방어 위치로 향한다.',
  },
  {
    key: 'brief_3',
    sfx: 'sfx_radio',
    tag: '03 / 04 · 위병소 긴급 무전',
    title: '정문이 뚫리고 있다',
    text: '“···북방연합군, 정문으로 진입 중.\n즉각 대응 바람.” 무전이 끊겼다.',
  },
  {
    key: 'brief_4',
    sfx: 'sfx_radio',
    tag: '04 / 04 · 첫 전투 투입',
    title: '이제, 네가 막아야 한다',
    text: '손에 든 건 K2 한 자루.\n동료를 배치하고 위병소를 사수하라.',
  },
] as const

let currentSave: Save = defaultSave()
let onDeployCallback: (() => void) | null = null
let overlayEl: HTMLElement | null = null
let availableAssets: Set<string> | null = null
let briefingRequest = 0

function getUiRoot(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.getElementById('ui')
}

function ensureOverlay(): HTMLElement | null {
  const root = getUiRoot()
  if (!root) return null
  if (overlayEl && root.contains(overlayEl)) {
    return overlayEl
  }
  const el = document.createElement('div')
  el.className = 'ui-lobby-overlay hidden'
  root.appendChild(el)
  overlayEl = el
  return el
}

async function ensureAvailableAssets(): Promise<Set<string>> {
  if (availableAssets) return availableAssets
  const list = await fetchAvailableAssets()
  availableAssets = new Set(list)
  return availableAssets
}

function readLocalUnlockedRaw(): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    return localStorage.getItem(LOCAL_UNLOCKED_KEY)
  } catch {
    return null
  }
}

function playBriefingSfxIfPresent(sfxKey: string, assets: Set<string>): void {
  if (!assets.has(sfxKey)) return
  try {
    playSfx(sfxKey as SfxKey)
  } catch {
    // 파일이 없거나 재생 실패 시 무시
  }
}

export function bindDeploy(onDeploy: () => void): void {
  onDeployCallback = onDeploy
}

export function hideLobbyOverlay(): void {
  briefingRequest++
  if (!overlayEl) return
  overlayEl.classList.add('hidden')
  overlayEl.innerHTML = ''
}

export function showFirstRun(): void {
  const wrap = ensureOverlay()
  if (!wrap) return

  wrap.innerHTML = ''
  wrap.className = 'ui-lobby-overlay mode-first-run'

  const card = document.createElement('div')
  card.className = 'first-run-card'

  const badge = document.createElement('div')
  badge.className = 'first-run-badge'
  badge.textContent = '제77보병사단 · 신병 전입 신고'

  const title = document.createElement('h1')
  title.className = 'first-run-title'
  title.textContent = '신병 성명 입력'

  const desc = document.createElement('label')
  desc.className = 'first-run-label'
  desc.setAttribute('for', 'rookie-name-input')
  desc.textContent = '성명 (1~6자, 비우면 기본값 "김신병")'

  const input = document.createElement('input')
  input.id = 'rookie-name-input'
  input.type = 'text'
  input.className = 'first-run-input'
  input.maxLength = 6
  input.placeholder = '김신병'
  input.value = sanitizeRookieName(currentSave.name)

  const notices = document.createElement('div')
  notices.className = 'first-run-notices'

  const noticeFiction = document.createElement('p')
  noticeFiction.className = 'first-run-notice-line'
  noticeFiction.textContent = '이 게임은 허구이며 실제 인물·부대·사건과 관계없습니다.'

  const noticeAi = document.createElement('p')
  noticeAi.className = 'first-run-notice-line'
  noticeAi.textContent = '일부 그래픽은 생성형 AI로 제작되었습니다.'

  notices.append(noticeFiction, noticeAi)

  const confirmBtn = document.createElement('button')
  confirmBtn.type = 'button'
  confirmBtn.className = 'mil-btn action-go first-run-confirm-btn'
  confirmBtn.textContent = '확인'
  confirmBtn.addEventListener('click', () => {
    const cleanName = sanitizeRookieName(input.value)
    currentSave = {
      ...currentSave,
      name: cleanName,
      firstRun: false,
    }
    void save(currentSave).then(() => {
      void showBriefing(0)
    })
  })

  card.append(badge, title, desc, input, notices, confirmBtn)
  wrap.appendChild(card)
}

export async function showBriefing(cutIndex = 0): Promise<void> {
  const wrap = ensureOverlay()
  if (!wrap) return

  if (cutIndex < 0 || cutIndex >= BRIEFING_CUTS.length) {
    await showLobby()
    return
  }

  panelOpen = true
  const request = ++briefingRequest
  const assets = await ensureAvailableAssets()
  if (request !== briefingRequest) return
  const cut = BRIEFING_CUTS[cutIndex]!
  playBriefingSfxIfPresent(cut.sfx, assets)

  wrap.innerHTML = ''
  wrap.className = 'ui-lobby-overlay mode-briefing'

  const stage = document.createElement('div')
  stage.className = `briefing-stage cut-${cutIndex + 1}`

  const art = document.createElement('div')
  art.className = 'briefing-art'
  const image = document.createElement('img')
  image.alt = cut.title
  image.className = 'briefing-image'
  image.addEventListener('error', () => { image.remove(); art.classList.add('missing-art') })
  if (assets.has(cut.key)) image.src = `/assets/${cut.key}.png`
  else art.classList.add('missing-art')
  if (assets.has(cut.key)) art.appendChild(image)
  stage.appendChild(art)

  const topBar = document.createElement('div')
  topBar.className = 'briefing-top-bar'

  const stepTag = document.createElement('span')
  stepTag.className = 'briefing-step-tag'
  stepTag.textContent = cut.tag

  const skipBtn = document.createElement('button')
  skipBtn.type = 'button'
  skipBtn.className = 'mil-btn briefing-skip-btn'
  skipBtn.textContent = '건너뛰기'
  skipBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    if (advanced) return
    advanced = true
    briefingRequest++
    void showLobby()
  })

  topBar.append(stepTag, skipBtn)

  const contentCard = document.createElement('div')
  contentCard.className = 'briefing-card'

  const titleEl = document.createElement('h1')
  titleEl.className = 'briefing-title'
  titleEl.textContent = cut.title

  const textEl = document.createElement('p')
  textEl.className = 'briefing-text'
  textEl.textContent = formatBriefingText(cut.text, currentSave.name)

  const hintEl = document.createElement('button')
  hintEl.type = 'button'
  hintEl.className = 'briefing-tap-hint'
  hintEl.textContent =
    cutIndex + 1 < BRIEFING_CUTS.length
      ? '다음 장면 →'
      : '생활관으로 이동 →'

  contentCard.append(titleEl, textEl, hintEl)
  stage.append(topBar, contentCard)

  let advanced = false
  const advance = (): void => {
    if (advanced) return
    advanced = true
    if (cutIndex + 1 < BRIEFING_CUTS.length) {
      void showBriefing(cutIndex + 1)
    } else {
      void showLobby()
    }
  }
  hintEl.addEventListener('click', (event) => { event.stopPropagation(); advance() })
  art.addEventListener('click', advance)

  wrap.appendChild(stage)
  // 컷이 바뀌면 버튼도 새로 생긴다. 키보드로도 연속해서 넘길 수 있다.
  hintEl.focus({ preventScroll: true })
}

// 걷는 생활관(T-109): showLobby는 저장을 읽고 걷는 씬을 시작한다. 메뉴는 구역 앞에서 여는 패널이다
export type PanelKind = 'codex' | 'board' | 'admin' | 'px'

let onWalkCallback: (() => void) | null = null
let panelOpen = false

export function bindWalk(onWalk: () => void): void {
  onWalkCallback = onWalk
}

export const getLobbySave = (): Save => currentSave
export const isPanelOpen = (): boolean => panelOpen

// 전투 투입: 걷는 화면 어디서나 같은 동작
export function deploy(): void {
  playBgm(null)
  closePanel()
  hideLobbyOverlay()
  onDeployCallback?.()
}

export async function showLobby(): Promise<void> {
  currentSave = await load()
  setSettings({ bgm: currentSave.settings.bgm, sfx: currentSave.settings.sfx })
  playBgm('bgm_lobby')
  closePanel()
  hideLobbyOverlay()
  onWalkCallback?.()
}

export function closePanel(): boolean {
  const was = panelOpen
  panelOpen = false
  if (was) {
    cardInfo(null)
    hideLobbyOverlay()
  }
  return was
}

const el = (tag: string, cls: string, text?: string): HTMLElement => {
  const e = document.createElement(tag)
  e.className = cls
  if (text !== undefined) e.textContent = text
  return e
}

function codexBody(): HTMLElement {
  const unlocked = new Set(mergeUnlockedCards(currentSave.unlocked, readLocalUnlockedRaw()))
  const grid = el('div', 'lobby-codex-grid')
  for (const cardKey of ALL_CARDS) {
    const on = unlocked.has(cardKey)
    const item = el('button', `lobby-codex-card ${on ? 'unlocked' : 'locked'}`) as HTMLButtonElement
    item.type = 'button'
    item.disabled = !on
    const icon = el('div', 'lobby-codex-icon', on ? getCardInitial(cardKey) : '🔒')
    if (on) {
      const image = document.createElement('img')
      image.src = `/assets/card_${cardKey}.png`
      image.alt = ''
      image.addEventListener('error', () => image.remove(), { once: true })
      icon.appendChild(image)
      item.addEventListener('click', () => cardInfoDetail(cardKey, 1, {
        name: cardKey === 'rifle' ? currentSave.name : undefined,
        rows: getCodexRows(cardKey),
      }))
    }
    item.append(
      icon,
      el('div', 'lobby-codex-name', getCardName(cardKey)),
      el('div', 'lobby-codex-sub', on ? '인물 · 능력 보기' : '웨이브 5 도달로 해금')
    )
    grid.appendChild(item)
  }
  return grid
}

function boardBody(): HTMLElement {
  const box = el('div', 'lobby-panel-stack')
  const row = el('div', 'lobby-record-row')
  row.append(el('span', 'lobby-record-label', '최고 기록'), el('span', 'lobby-record-val', `웨이브 ${currentSave.bestWave}`))
  const notice = el('p', 'lobby-panel-note', '[당직] 위병소에 적 침투 징후. 전 장병은 전투 투입 준비.')
  const rebrief = el('button', 'mil-btn lobby-rebrief-btn', '브리핑 다시 보기') as HTMLButtonElement
  rebrief.type = 'button'
  rebrief.addEventListener('click', () => {
    closePanel()
    void showBriefing(0)
  })
  box.append(row, notice, rebrief)
  return box
}

function adminBody(): HTMLElement {
  const box = el('div', 'lobby-panel-stack')
  const grid = el('div', 'lobby-settings-grid')
  const defs: { key: keyof Save['settings']; label: string }[] = [
    { key: 'bgm', label: 'BGM' },
    { key: 'sfx', label: '효과음' },
    { key: 'haptic', label: '진동' },
    { key: 'dmgNumbers', label: '데미지 숫자' },
  ]
  const toggle = (label: string, get: () => boolean, set: () => void): HTMLButtonElement => {
    const btn = el('button', '') as HTMLButtonElement
    btn.type = 'button'
    const paint = (): void => {
      btn.className = `mil-btn lobby-setting-btn ${get() ? 'on' : 'off'}`
      btn.textContent = `${label}: ${get() ? '켜짐' : '꺼짐'}`
    }
    paint()
    btn.addEventListener('click', () => {
      set()
      paint()
    })
    return btn
  }
  for (const d of defs) {
    grid.appendChild(
      toggle(
        d.label,
        () => currentSave.settings[d.key],
        () => {
          currentSave = { ...currentSave, settings: { ...currentSave.settings, [d.key]: !currentSave.settings[d.key] } }
          setSettings({ bgm: currentSave.settings.bgm, sfx: currentSave.settings.sfx })
          void save(currentSave)
        }
      )
    )
  }
  // 비상 연출(붉은 비상등·방송 자막): 기기별 설정이라 세이브 형식과 따로 localStorage에 둔다
  let alarm = loadAlarmFx()
  grid.appendChild(
    toggle(
      '비상 연출',
      () => alarm,
      () => {
        alarm = !alarm
        saveAlarmFx(alarm)
      }
    )
  )
  const credits = el('footer', 'lobby-credits')
  credits.append(
    el('div', '', '이 게임은 허구이며 실제 인물·부대·사건과 관계없습니다.'),
    el('div', '', '일부 그래픽은 생성형 AI로 제작되었습니다.'),
    el('div', '', '오픈소스: Phaser (MIT) · Capacitor (MIT)')
  )
  box.append(grid, credits)
  return box
}

// ponytail: PX는 자리만. 광고 보고 카드 해금은 T-108이 이 패널의 버튼에 `watchAd`를 연결한다
function pxBody(): HTMLElement {
  const unlocked = new Set(mergeUnlockedCards(currentSave.unlocked, readLocalUnlockedRaw()))
  const locked = ALL_CARDS.filter((c) => !unlocked.has(c))
  const box = el('div', 'lobby-panel-stack')
  box.appendChild(
    el(
      'p',
      'lobby-panel-note',
      locked.length > 0 ? `아직 못 쓰는 병과: ${locked.map(getCardName).join(', ')}` : '모든 병과를 쓸 수 있다. 수고했다.'
    )
  )
  if (!isNative()) box.appendChild(el('p', 'lobby-panel-note', '웹 체험판은 일반 플레이에서 웨이브 5에 도달하면 다음 병과를 해금합니다.'))
  const btn = el('button', 'mil-btn action-go lobby-px-btn', isNative() ? '광고 보고 해금 (준비 중)' : '플레이로 병과 해금') as HTMLButtonElement
  btn.type = 'button'
  btn.disabled = true
  box.appendChild(btn)
  return box
}

const PANELS: Record<PanelKind, { title: string; body: () => HTMLElement }> = {
  codex: { title: '관물대 · 병과 도감', body: codexBody },
  board: { title: '게시판', body: boardBody },
  admin: { title: '행정반 · 설정', body: adminBody },
  px: { title: 'PX', body: pxBody },
}

// 구역 앞에서 "열기"를 누르면 걷는 화면 위에 패널을 띄운다. 바깥을 누르거나 닫기를 누르면 닫힌다
export function openPanel(kind: PanelKind): void {
  const wrap = ensureOverlay()
  if (!wrap) return
  const def = PANELS[kind]
  wrap.innerHTML = ''
  wrap.className = 'ui-lobby-overlay mode-panel'
  const card = el('div', 'lobby-panel-card')
  const head = el('div', 'lobby-panel-head')
  const close = el('button', 'mil-btn lobby-panel-close', '닫기') as HTMLButtonElement
  close.type = 'button'
  close.addEventListener('click', () => closePanel())
  head.append(el('h2', 'lobby-section-title', def.title), close)
  card.append(head, def.body())
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) closePanel()
  })
  wrap.appendChild(card)
  panelOpen = true
}

export async function startEntryFlow(initialSave?: Save): Promise<void> {
  currentSave = initialSave ?? (await load())
  setSettings({
    bgm: currentSave.settings.bgm,
    sfx: currentSave.settings.sfx,
  })
  if (currentSave.firstRun) {
    showFirstRun()
  } else {
    await showLobby()
  }
}
