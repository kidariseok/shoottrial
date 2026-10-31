// 보상형 광고 흐름(T-107): 음소거 → 표시 → 결과. 플러그인은 platform.ts만 건드린다.
import { mute, unmute } from './audio'
import { isNative, showRewarded } from './platform'

export type AdSlot = 'revive' | 'reroll' | 'supply'

let playing = false

function confirmWebReward(slot: AdSlot): Promise<boolean> {
  const root = typeof document === 'undefined' ? null : document.getElementById('ui')
  if (!root) return Promise.resolve(false)
  const labels: Record<AdSlot, string> = { revive: '부활', reroll: '무료 리롤', supply: '코인 +5' }
  const backdrop = document.createElement('div')
  backdrop.className = 'ui-modal-backdrop web-reward-backdrop'
  backdrop.setAttribute('role', 'dialog')
  backdrop.setAttribute('aria-modal', 'true')
  backdrop.setAttribute('aria-label', '웹 체험 보상')
  backdrop.innerHTML = `<div class="ui-modal-card"><div class="modal-header">웹 체험 보상</div><div class="modal-body"><p class="modal-note">웹 체험판에서는 광고 없이 다음 보상을 제공합니다: ${labels[slot]}. 사용 횟수 제한은 유지됩니다.</p></div><div class="modal-actions"><button type="button" class="mil-btn web-reward-cancel">취소</button><button type="button" class="mil-btn action-go web-reward-confirm">보상 받기</button></div></div>`
  root.appendChild(backdrop)
  return new Promise((resolve) => {
    const finish = (earned: boolean): void => { backdrop.remove(); resolve(earned) }
    backdrop.querySelector('.web-reward-cancel')!.addEventListener('click', () => finish(false), { once: true })
    backdrop.querySelector('.web-reward-confirm')!.addEventListener('click', () => finish(true), { once: true })
    backdrop.querySelector<HTMLButtonElement>('.web-reward-confirm')!.focus()
  })
}

function showFailModal(): void {
  if (typeof document === 'undefined') return
  const root = document.getElementById('ui')
  if (!root) return
  const backdrop = document.createElement('div')
  backdrop.className = 'ui-modal-backdrop ad-fail-backdrop'
  const card = document.createElement('div')
  card.className = 'ui-modal-card'
  const header = document.createElement('div')
  header.className = 'modal-header'
  header.textContent = '광고 안내'
  const body = document.createElement('div')
  body.className = 'modal-body'
  const note = document.createElement('div')
  note.className = 'modal-note ad-fail-note'
  note.textContent = '광고를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요'
  body.appendChild(note)
  const actions = document.createElement('div')
  actions.className = 'modal-actions'
  const ok = document.createElement('button')
  ok.type = 'button'
  ok.className = 'mil-btn action-go'
  ok.textContent = '확인'
  ok.addEventListener('click', () => backdrop.remove())
  actions.appendChild(ok)
  card.append(header, body, actions)
  backdrop.appendChild(card)
  root.appendChild(backdrop)
}

// 끝까지 봤을 때만 true. 연타해도 재생 중이면 false(모달 없이 무시).
export async function watchAd(_slot: AdSlot): Promise<boolean> {
  if (playing) return false
  playing = true
  if (!isNative()) {
    try { return await confirmWebReward(_slot) }
    finally { playing = false }
  }
  mute('ad')
  try {
    const res = await showRewarded()
    if (res === 'failed') showFailModal()
    return res === 'rewarded'
  } catch {
    showFailModal()
    return false
  } finally {
    unmute('ad')
    playing = false
  }
}
