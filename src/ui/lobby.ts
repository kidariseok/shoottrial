import { fetchAvailableAssets } from '../assets'
import { playSfx, setSettings } from '../audio'
import { defaultSave, load, save, type Save } from '../save'
import {
  ALL_CARDS,
  formatBriefingText,
  getCardInitial,
  getCardName,
  mergeUnlockedCards,
  sanitizeRookieName,
} from './helpers'

const LOCAL_UNLOCKED_KEY = 'd2_unlocked'

export const BRIEFING_CUTS = [
  {
    key: 'brief_1',
    sfx: 'sfx_siren',
    tag: '컷 1 / 4 · 자대 배치 첫날 밤',
    text: '6주 기초군사훈련을 마친 신병 {이름}. 자대 배치 첫날 밤, 생활관 스피커가 울린다.\n"실제 상황, 실제 상황. 데프콘 2 발령. 데프콘 2 발령."',
  },
  {
    key: 'brief_2',
    sfx: 'sfx_siren',
    tag: '컷 2 / 4 · 화스트 페이스',
    text: '화스트 페이스. 군장을 싸기도 전에 포탄이 떨어지고, 보급품이 연병장에 흩어진다.',
  },
  {
    key: 'brief_3',
    sfx: 'sfx_radio',
    tag: '컷 3 / 4 · 위병소 긴급 무전',
    text: '무전이 지지직거린다. "…적, 위병소 정문으로 진입 중. 즉각 대응 바람."',
  },
  {
    key: 'brief_4',
    sfx: 'sfx_radio',
    tag: '컷 4 / 4 · 단독 방어 투입',
    text: '손에 든 건 K2 소총 한 자루.',
  },
] as const

let currentSave: Save = defaultSave()
let onDeployCallback: (() => void) | null = null
let overlayEl: HTMLElement | null = null
let availableAssets: Set<string> | null = null

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
  const playOptionalSfx = playSfx as (key: string) => boolean
  try {
    playOptionalSfx(sfxKey)
  } catch {
    // 파일이 없거나 재생 실패 시 무시
  }
}

export function bindDeploy(onDeploy: () => void): void {
  onDeployCallback = onDeploy
}

export function hideLobbyOverlay(): void {
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

  const assets = await ensureAvailableAssets()
  const cut = BRIEFING_CUTS[cutIndex]!
  playBriefingSfxIfPresent(cut.sfx, assets)

  wrap.innerHTML = ''
  wrap.className = 'ui-lobby-overlay mode-briefing'

  const stage = document.createElement('div')
  stage.className = `briefing-stage cut-${cutIndex + 1}`

  if (assets.has(cut.key)) {
    stage.style.backgroundImage = `url('/assets/${cut.key}.png')`
  }

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
    void showLobby()
  })

  topBar.append(stepTag, skipBtn)

  const contentCard = document.createElement('div')
  contentCard.className = 'briefing-card'

  const textEl = document.createElement('p')
  textEl.className = 'briefing-text'
  textEl.textContent = formatBriefingText(cut.text, currentSave.name)

  const hintEl = document.createElement('div')
  hintEl.className = 'briefing-tap-hint'
  hintEl.textContent =
    cutIndex + 1 < BRIEFING_CUTS.length
      ? `화면을 탭하여 다음 (${cutIndex + 1}/${BRIEFING_CUTS.length})`
      : `화면을 탭하여 생활관으로 이동 (${BRIEFING_CUTS.length}/${BRIEFING_CUTS.length})`

  contentCard.append(textEl, hintEl)
  stage.append(topBar, contentCard)

  stage.addEventListener('click', () => {
    if (cutIndex + 1 < BRIEFING_CUTS.length) {
      void showBriefing(cutIndex + 1)
    } else {
      void showLobby()
    }
  })

  wrap.appendChild(stage)
}

export async function showLobby(): Promise<void> {
  currentSave = await load()
  setSettings({
    bgm: currentSave.settings.bgm,
    sfx: currentSave.settings.sfx,
  })

  const wrap = ensureOverlay()
  if (!wrap) return

  const mergedUnlocked = mergeUnlockedCards(currentSave.unlocked, readLocalUnlockedRaw())
  const unlockedSet = new Set(mergedUnlocked)

  wrap.innerHTML = ''
  wrap.className = 'ui-lobby-overlay mode-lobby'

  const container = document.createElement('div')
  container.className = 'lobby-container'

  // 1. 상단 생활관 헤더 + 최고 기록 + 브리핑 다시 보기
  const header = document.createElement('header')
  header.className = 'lobby-header'

  const headerTop = document.createElement('div')
  headerTop.className = 'lobby-header-top'

  const titleWrap = document.createElement('div')
  titleWrap.className = 'lobby-title-wrap'

  const unitBadge = document.createElement('span')
  unitBadge.className = 'lobby-unit-badge'
  unitBadge.textContent = '제77보병사단 · 생활관'

  const title = document.createElement('h1')
  title.className = 'lobby-title'
  title.textContent = `이등병 ${sanitizeRookieName(currentSave.name)}`

  titleWrap.append(unitBadge, title)

  const rebriefBtn = document.createElement('button')
  rebriefBtn.type = 'button'
  rebriefBtn.className = 'mil-btn lobby-rebrief-btn'
  rebriefBtn.textContent = '브리핑 다시 보기'
  rebriefBtn.addEventListener('click', () => {
    void showBriefing(0)
  })

  headerTop.append(titleWrap, rebriefBtn)

  const recordRow = document.createElement('div')
  recordRow.className = 'lobby-record-row'

  const recordLabel = document.createElement('span')
  recordLabel.className = 'lobby-record-label'
  recordLabel.textContent = '최고 기록'

  const recordVal = document.createElement('span')
  recordVal.className = 'lobby-record-val'
  recordVal.textContent = `웨이브 ${currentSave.bestWave}`

  recordRow.append(recordLabel, recordVal)
  header.append(headerTop, recordRow)

  // 2. 출동 큰 버튼
  const deployBtn = document.createElement('button')
  deployBtn.type = 'button'
  deployBtn.className = 'mil-btn action-go lobby-deploy-btn'
  deployBtn.textContent = '출동'
  deployBtn.addEventListener('click', () => {
    hideLobbyOverlay()
    onDeployCallback?.()
  })

  // 3. 병과 도감 6칸
  const codexSection = document.createElement('section')
  codexSection.className = 'lobby-section'

  const codexTitle = document.createElement('h2')
  codexTitle.className = 'lobby-section-title'
  codexTitle.textContent = `병과 도감 (${unlockedSet.size} / ${ALL_CARDS.length})`

  const codexGrid = document.createElement('div')
  codexGrid.className = 'lobby-codex-grid'

  for (const cardKey of ALL_CARDS) {
    const isUnlocked = unlockedSet.has(cardKey)
    const item = document.createElement('div')
    item.className = `lobby-codex-card ${isUnlocked ? 'unlocked' : 'locked'}`

    const icon = document.createElement('div')
    icon.className = 'lobby-codex-icon'
    icon.textContent = isUnlocked ? getCardInitial(cardKey) : '🔒'

    const name = document.createElement('div')
    name.className = 'lobby-codex-name'
    name.textContent = getCardName(cardKey)

    const sub = document.createElement('div')
    sub.className = 'lobby-codex-sub'
    sub.textContent = isUnlocked ? '배치 가능' : '웨이브 5 도달로 해금'

    item.append(icon, name, sub)
    codexGrid.appendChild(item)
  }

  codexSection.append(codexTitle, codexGrid)

  // 4. 설정 (BGM·효과음·진동·데미지 숫자)
  const settingsSection = document.createElement('section')
  settingsSection.className = 'lobby-section'

  const settingsTitle = document.createElement('h2')
  settingsTitle.className = 'lobby-section-title'
  settingsTitle.textContent = '작전 설정'

  const settingsGrid = document.createElement('div')
  settingsGrid.className = 'lobby-settings-grid'

  const settingDefs: { key: keyof Save['settings']; label: string }[] = [
    { key: 'bgm', label: 'BGM' },
    { key: 'sfx', label: '효과음' },
    { key: 'haptic', label: '진동' },
    { key: 'dmgNumbers', label: '데미지 숫자' },
  ]

  for (const def of settingDefs) {
    const btn = document.createElement('button')
    btn.type = 'button'
    const updateBtn = () => {
      const on = currentSave.settings[def.key]
      btn.className = `mil-btn lobby-setting-btn ${on ? 'on' : 'off'}`
      btn.textContent = `${def.label}: ${on ? '켜짐' : '꺼짐'}`
    }
    updateBtn()
    btn.addEventListener('click', () => {
      currentSave = {
        ...currentSave,
        settings: {
          ...currentSave.settings,
          [def.key]: !currentSave.settings[def.key],
        },
      }
      setSettings({
        bgm: currentSave.settings.bgm,
        sfx: currentSave.settings.sfx,
      })
      updateBtn()
      void save(currentSave)
    })
    settingsGrid.appendChild(btn)
  }

  settingsSection.append(settingsTitle, settingsGrid)

  // 5. 크레딧 (허구 고지, AI 고지, 오픈소스 목록)
  const creditsSection = document.createElement('footer')
  creditsSection.className = 'lobby-credits'

  const creditFiction = document.createElement('div')
  creditFiction.textContent = '이 게임은 허구이며 실제 인물·부대·사건과 관계없습니다.'

  const creditAi = document.createElement('div')
  creditAi.textContent = '일부 그래픽은 생성형 AI로 제작되었습니다.'

  const creditOss = document.createElement('div')
  creditOss.textContent = '오픈소스: Phaser (MIT) · Capacitor (MIT)'

  creditsSection.append(creditFiction, creditAi, creditOss)

  container.append(header, deployBtn, codexSection, settingsSection, creditsSection)
  wrap.appendChild(container)
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
