import { isNative } from './platform'

// ponytail: 온라인 웹 체험판. 오프라인 저장 캐시는 배포 후 갱신 정책을 정할 때 추가한다.
export async function startWeb(onRotate: (blocked: boolean) => void): Promise<void> {
  if (isNative()) return
  const rotate = document.createElement('div')
  rotate.className = 'web-rotate hidden'
  rotate.setAttribute('role', 'status')
  rotate.textContent = '휴대폰을 세로로 돌려 주세요. 게임은 잠시 멈춰 있습니다.'
  document.body.appendChild(rotate)
  const landscape = matchMedia('(orientation: landscape) and (pointer: coarse)')
  const update = (): void => {
    rotate.classList.toggle('hidden', !landscape.matches)
    onRotate(landscape.matches)
  }
  landscape.addEventListener('change', update)
  update()

  const wrap = document.createElement('div')
  wrap.className = 'web-welcome'
  wrap.setAttribute('role', 'dialog')
  wrap.setAttribute('aria-modal', 'true')
  wrap.setAttribute('aria-labelledby', 'web-title')
  wrap.innerHTML = `
    <section class="web-welcome-card">
      <img class="web-emblem" src="/web/icon-192.png" alt="" width="72" height="72">
      <p class="web-eyebrow">모바일 웹 체험판</p>
      <h1 id="web-title">데프콘 2<br><span>화스트 페이스</span></h1>
      <p>동료를 배치하고, 위병소를 지켜라.</p>
      <p class="web-note">세로 화면 · 소리는 첫 터치 후 재생됩니다.<br>진행 기록은 이 주소의 현재 브라우저에 저장됩니다.<br>광고 보상은 광고 없는 체험 보상으로 제공됩니다.</p>
      <details><summary>앱처럼 홈 화면에서 열기</summary><p>Android Chrome: 메뉴(⋮) → 홈 화면에 추가 또는 앱 설치.<br>iPhone Safari: 공유 → 홈 화면에 추가.<br>홈 화면 아이콘으로 열면 지원 브라우저에서 주소창 없이 실행됩니다. 인터넷 연결이 필요합니다.</p></details>
      <button type="button" class="mil-btn action-go web-start">게임 시작</button>
      <button type="button" class="mil-btn web-fullscreen">전체 화면으로 시작</button>
      <p class="web-note">이 게임은 허구이며 일부 그래픽은 생성형 AI로 제작되었습니다.</p>
    </section>`
  document.body.appendChild(wrap)
  await new Promise<void>((resolve) => {
    const start = (): void => { wrap.remove(); resolve() }
    wrap.querySelector('.web-start')!.addEventListener('click', start, { once: true })
    const full = wrap.querySelector<HTMLButtonElement>('.web-fullscreen')!
    full.hidden = !document.fullscreenEnabled
    full.addEventListener('click', () => {
      // 지원하지 않거나 거절하면 일반 브라우저 화면으로 계속한다.
      void document.documentElement.requestFullscreen().catch(() => {}).finally(start)
    }, { once: true })
    wrap.querySelector<HTMLButtonElement>('.web-start')!.focus()
  })
}
