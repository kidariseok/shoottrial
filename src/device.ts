// T-101 할 일 7: ?scene=device (G0 5대 검증용 DOM 화면)
import { getAudioState, onAudioChange, playSfx, toggleLoopTone } from './audio'
import { isNative, onPause, onResume, safeRect, triggerBack } from './platform'
import { defaultSave, load, save, type Save } from './save'

export async function startDeviceScene(): Promise<void> {
  if (typeof document === 'undefined') return
  const root = document.getElementById('ui')
  if (!root) return

  let currentSave: Save = defaultSave()
  try {
    currentSave = await load()
  } catch {
    currentSave = defaultSave()
  }

  let lastLifecycleEvent = '포그라운드 (정상 동작 중)'

  const wrap = document.createElement('div')
  wrap.className = 'device-screen'

  // 상단 헤더
  const header = document.createElement('header')
  header.className = 'device-header'

  const headerTop = document.createElement('div')
  headerTop.className = 'device-header-top'

  const badge = document.createElement('span')
  badge.className = 'device-badge'
  badge.textContent = isNative() ? 'ANDROID NATIVE' : 'WEB BROWSER'

  const toBattleBtn = document.createElement('button')
  toBattleBtn.type = 'button'
  toBattleBtn.className = 'mil-btn'
  toBattleBtn.textContent = '전투 화면 ▸'
  toBattleBtn.addEventListener('click', () => {
    playSfx('sfx_click')
    window.location.search = '?scene=battle&safe=1'
  })

  headerTop.append(badge, toBattleBtn)

  const title = document.createElement('h1')
  title.className = 'device-title'
  title.textContent = '데프콘 2 — 단말기 스파이크 (G0)'

  const sub = document.createElement('p')
  sub.className = 'device-sub'
  sub.textContent = '세로 고정 · Safe Area · 뒤로가기 모달 · 영구 저장 · 백그라운드 음소거'

  header.append(headerTop, title, sub)

  // 1. Safe Area 카드 (값 4개 + 해상도)
  const safeCard = document.createElement('section')
  safeCard.className = 'device-card'

  const safeTitle = document.createElement('h2')
  safeTitle.className = 'device-card-title'
  safeTitle.textContent = '1. Safe Area 및 세로 화면'

  const safeGrid = document.createElement('div')
  safeGrid.className = 'device-safe-grid'

  const saTopVal = document.createElement('span')
  const saRightVal = document.createElement('span')
  const saBottomVal = document.createElement('span')
  const saLeftVal = document.createElement('span')

  const makeSafeCell = (label: string, valEl: HTMLElement) => {
    const box = document.createElement('div')
    box.className = 'device-safe-cell'
    const l = document.createElement('span')
    l.className = 'device-safe-label'
    l.textContent = label
    valEl.className = 'device-safe-val'
    box.append(l, valEl)
    return box
  }

  safeGrid.append(
    makeSafeCell('상단 (Top)', saTopVal),
    makeSafeCell('우측 (Right)', saRightVal),
    makeSafeCell('하단 (Bottom)', saBottomVal),
    makeSafeCell('좌측 (Left)', saLeftVal)
  )

  const viewportInfo = document.createElement('div')
  viewportInfo.className = 'device-meta-row'

  function renderSafeArea(): void {
    const r = safeRect()
    saTopVal.textContent = `${r.top}px`
    saRightVal.textContent = `${r.right}px`
    saBottomVal.textContent = `${r.bottom}px`
    saLeftVal.textContent = `${r.left}px`
    const orient = r.height >= r.width ? '세로 (Portrait)' : '가로 (Landscape)'
    viewportInfo.textContent = `유효 영역: ${r.width}×${r.height}px · 방향: ${orient}`
  }

  safeCard.append(safeTitle, safeGrid, viewportInfo)

  // 2. 세이브 카운터 카드 (+1 버튼과 현재 값)
  const saveCard = document.createElement('section')
  saveCard.className = 'device-card'

  const saveTitle = document.createElement('h2')
  saveTitle.className = 'device-card-title'
  saveTitle.textContent = '2. 영구 저장 카운터 (d2_save_v1)'

  const saveRow = document.createElement('div')
  saveRow.className = 'device-save-row'

  const countBox = document.createElement('div')
  countBox.className = 'device-count-box'
  const countLabel = document.createElement('span')
  countLabel.className = 'device-count-label'
  countLabel.textContent = '현재 저장된 판 수 (runs)'
  const countVal = document.createElement('span')
  countVal.className = 'device-count-val'
  countVal.id = 'device-save-count'
  countBox.append(countLabel, countVal)

  const incBtn = document.createElement('button')
  incBtn.type = 'button'
  incBtn.id = 'device-save-inc-btn'
  incBtn.className = 'mil-btn action-go device-main-btn'
  incBtn.textContent = '+1 저장'

  const saveMeta = document.createElement('div')
  saveMeta.className = 'device-meta-row'

  function renderSaveState(): void {
    countVal.textContent = String(currentSave.runs)
    saveMeta.textContent = `신병: ${currentSave.name} · 해금: ${currentSave.unlocked.length}종 · 앱 재실행 후 숫자 유지 확인`
  }

  incBtn.addEventListener('click', async () => {
    playSfx('sfx_click')
    currentSave = {
      ...currentSave,
      runs: currentSave.runs + 1,
    }
    await save(currentSave)
    renderSaveState()
  })

  saveRow.append(countBox, incBtn)
  saveCard.append(saveTitle, saveRow, saveMeta)

  // 3. 오디오 및 백그라운드 음소거 카드 (반복음 켜기 버튼 + 효과음)
  const audioCard = document.createElement('section')
  audioCard.className = 'device-card'

  const audioTitle = document.createElement('h2')
  audioTitle.className = 'device-card-title'
  audioTitle.textContent = '3. 오디오 & 백그라운드 음소거'

  const audioActions = document.createElement('div')
  audioActions.className = 'device-btn-row'

  const loopBtn = document.createElement('button')
  loopBtn.type = 'button'
  loopBtn.id = 'device-loop-btn'
  loopBtn.className = 'mil-btn brass device-main-btn'

  const sfxBtn = document.createElement('button')
  sfxBtn.type = 'button'
  sfxBtn.id = 'device-sfx-btn'
  sfxBtn.className = 'mil-btn device-main-btn'
  sfxBtn.textContent = '효과음 (sfx_click)'

  const audioStatus = document.createElement('div')
  audioStatus.className = 'device-meta-row'

  function renderAudioState(): void {
    const st = getAudioState()
    loopBtn.textContent = st.loopOn ? '🔊 반복음 끄기 (ON)' : '🔈 소리 켜기 (반복음)'
    loopBtn.classList.toggle('action-go', st.loopOn)
    const stateDesc = st.hidden
      ? '일시정지됨 (백그라운드 음소거)'
      : st.loopPlaying
        ? '반복음 재생 중 (홈 화면 이동 시 즉시 정지)'
        : '대기 중'
    audioStatus.textContent = `상태: ${stateDesc} · 최근 전환: ${lastLifecycleEvent}`
  }

  loopBtn.addEventListener('click', () => {
    toggleLoopTone()
    renderAudioState()
  })

  sfxBtn.addEventListener('click', () => {
    playSfx('sfx_click')
    renderAudioState()
  })

  onAudioChange(renderAudioState)
  onPause(() => {
    lastLifecycleEvent = 'onPause (백그라운드 진입 → 음소거)'
    renderAudioState()
  })
  onResume(() => {
    lastLifecycleEvent = 'onResume (포그라운드 복귀 → 소리 재개)'
    renderAudioState()
  })

  audioActions.append(loopBtn, sfxBtn)
  audioCard.append(audioTitle, audioActions, audioStatus)

  // 4. 안드로이드 뒤로가기 모달 안내 카드
  const backCard = document.createElement('section')
  backCard.className = 'device-card'

  const backTitle = document.createElement('h2')
  backTitle.className = 'device-card-title'
  backTitle.textContent = '4. 안드로이드 뒤로가기 모달'

  const backGuide = document.createElement('p')
  backGuide.className = 'device-guide-text'
  backGuide.textContent =
    '기기의 뒤로가기(Back) 제스처·버튼을 누르면 즉시 종료되지 않고 종료 확인 모달("계속" / "나가기")이 표시됩니다. 브라우저에서는 Esc 키 또는 아래 버튼으로 동일하게 확인할 수 있습니다.'

  const backTestBtn = document.createElement('button')
  backTestBtn.type = 'button'
  backTestBtn.id = 'device-back-btn'
  backTestBtn.className = 'mil-btn device-main-btn'
  backTestBtn.textContent = '뒤로가기 모달 열기'
  backTestBtn.addEventListener('click', () => {
    playSfx('sfx_click')
    triggerBack()
  })

  backCard.append(backTitle, backGuide, backTestBtn)

  // 하단 고지 문구 (AGENTS.md 콘텐츠 원칙: 허구 고지 + 생성형 AI 고지)
  const footer = document.createElement('footer')
  footer.className = 'device-footer'
  footer.textContent =
    '이 게임은 허구의 가상 전쟁 시나리오이며 실제 인물·부대·사건과 무관합니다. · 일부 그래픽·텍스트 제작에 생성형 AI가 활용되었습니다.'

  wrap.append(header, safeCard, saveCard, audioCard, backCard, footer)
  root.appendChild(wrap)

  renderSafeArea()
  renderSaveState()
  renderAudioState()

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', renderSafeArea)
    // Capacitor SystemBars가 페이지 커밋 직후 CSS 변수를 주입할 때 반영
    setTimeout(renderSafeArea, 150)
  }
}
