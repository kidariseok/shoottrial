# TECH: 기술 구조 v1.0

> 작성: 2026-10-20, Claude(기획). 원칙은 ponytail(가장 짧게 동작하는 구조)이다. 구현 담당은 이 문서를 수정하지 않는다.
> v1.0: 토스 미니앱 → **구글 플레이(Capacitor 안드로이드)**로 바꿨다. 이전 판은 `docs/_archive/qrf-TECH.md`.

## 1. 스택

| 항목 | 선택 | 상태 |
|---|---|---|
| 언어·번들러 | TypeScript + Vite | 확정 |
| 게임 엔진 | **Phaser 4.2.1**(버전 고정) | 확정. 인터넷 예제는 대부분 Phaser 3다. 낯선 API는 `node_modules/phaser/types`에서 확인한다 |
| 앱 포장 | **Capacitor**(안드로이드 먼저, iOS는 M5+) | 버전은 H-101에서 최신 안정판을 확인해 고정한다 |
| 광고 | Capacitor용 AdMob 플러그인(후보: `@capacitor-community/admob`) | ❓ R-101에서 패키지·버전·테스트 광고 ID 확인 |
| 저장 | `@capacitor/preferences`(브라우저에서는 `localStorage` 폴백) | ❓ R-101 |
| 백버튼·생명주기 | `@capacitor/app`(`backButton`, `appStateChange`) | ❓ R-101에서 이벤트 이름 확인 |
| 테스트 | Vitest | 순수 함수(`rules.ts`)·세이브·광고 흐름만 테스트한다 |
| 메뉴 UI | **순수 DOM + CSS**(React 없음) | Safe Area를 CSS로 처리하고, 한글이 선명하다 |
| 폰트 | Pretendard 또는 A-101에서 정한 OFL 폰트 | A-101 |

**❓ 항목은 R-101 결과(`docs/research/play-launch.md`)로 확인하기 전에 코드로 쓰지 않는다.**

## 2. 폴더 구조와 레인 소유

이 구조 밖에 파일을 만들려면 티켓 허가가 필요하다. **레인**은 `docs/ROADMAP.md` §3이다(A = Claude 코어 전투, B = Antigravity 플랫폼·UI).

```
shoottrial/
├─ index.html              # B  #game(캔버스) + #ui(DOM 오버레이) + Safe Area CSS 변수
├─ capacitor.config.ts     # B
├─ package.json            # B  scripts: dev, build, test, typecheck, verify, assets:check
├─ android/                # B  Capacitor가 만든 안드로이드 프로젝트
├─ src/
│  ├─ main.ts              # B  부팅: platform.init() → save.load() → ui.show('lobby')
│  ├─ platform.ts          # B  ★ Capacitor 플러그인을 import하는 유일한 파일
│  ├─ save.ts              # B  세이브 load/save (§5)
│  ├─ audio.ts             # B  BGM/SFX, 백그라운드·광고 중 정지 (§6)
│  ├─ ads.ts               # B  보상형 광고 (§7)
│  ├─ assets.ts            # B  에셋 키 표 + 없는 키는 단색 플레이스홀더 (ART.md §4)
│  ├─ debug.ts             # B  URL 파라미터 해석 (§9)
│  ├─ ui/
│  │  ├─ screens.ts        # B  DOM 화면·HUD·상점·모달. A가 부르는 함수는 §8에 고정
│  │  └─ style.css         # B
│  ├─ data.ts              # A  모든 수치 표(카드·적·경제·시너지). GDD §5·§6과 1:1
│  ├─ stages.ts            # A  웨이브 표 (GDD §5.7)
│  ├─ rules.ts             # A  순수 함수: 합성·시너지 집계·이자·피해·밀어내기·상점 추첨·웨이브 스케일
│  └─ battle/
│     ├─ BattleScene.ts    # A  단계 전환(준비·전투·정산), 일시정지, 2배속
│     ├─ board.ts          # A  칸 좌표, 드래그·보정·합성, 대기석, 지뢰 구역
│     ├─ units.ts          # A  아군 행동(카드별 switch)
│     ├─ enemies.ts        # A  적 행동(종류별 switch) + 보스
│     └─ fx.ts             # A  섬광·흔들림·파티클·팝업
├─ tests/                  # A  rules.test.ts · (B) save.test.ts · ads.test.ts
├─ public/assets/          # D→B  ART.md §4 에셋 계약 표의 파일만
├─ art/                    # D  LEDGER.json(에셋 장부), source/(AI 원본, 빌드 제외)
├─ scripts/
│  ├─ harness/             # 기획 전용(읽기 전용)
│  └─ assets-check.mjs     # B  장부·계약·파일 대조 (H-102)
└─ docs/
```

### 2.1 일부러 만들지 않는 것

| 흔한 설계 | 대신 | 다시 고려할 조건 |
|---|---|---|
| `GameStateMachine` 클래스 | `BattleScene`의 `phase` 변수 하나(`'prep' \| 'fight' \| 'settle'`) + `switch` | 단계가 5개를 넘으면 |
| `ObjectPool<T>` | Phaser `Group({ maxSize })` + `get()` | 없음 |
| ECS·컴포넌트 클래스 | 카드·적은 **데이터 행 + 종류별 `switch`** | 카드가 20종을 넘고 switch가 300줄을 넘으면 |
| 2D 충돌 시스템 | **열 단위 1D 판정**(같은 열 배열에서 y 비교) | 없음(차선 게임이다) |
| 길찾기 | 직선 하강. 군견의 열 변경은 한 번 옆으로 이동하는 트윈 | 없음 |
| `AdManager`·`SaveService` 클래스 | 모듈 함수 | 없음 |
| 이벤트 버스 | 직접 함수 호출(§8) | 없음 |

## 3. 화면·좌표

| 항목 | 내용 |
|---|---|
| 방향 | **세로 고정**(`AndroidManifest`의 `screenOrientation="portrait"`) |
| 논리 해상도 | **720×1280**. 화면이 더 길면 위아래 배경을 최대 720×1560까지 보여준다. Phaser `Scale.FIT`. A-101에서 아트 결이 정해지면 재확인한다 |
| 칸 | 128×128. 판 구역 좌표는 GDD §3의 표를 `data.ts`의 `LAYOUT` 상수 하나로 둔다 |
| Safe Area | CSS `env(safe-area-inset-*)` → CSS 변수 `--sa-*`. 캔버스 HUD는 `platform.safeRect()` 안에 둔다. 안드로이드 15+ edge-to-edge에서 값이 오는지 ❓ T-101 실측 |
| `?safe=1` | Safe Area 경계를 초록 선으로 그린다. 화면 티켓의 스크린샷에 포함한다 |

## 4. 플랫폼 사실 표

✅ = 공식 문서로 확인, ❓ = R-101에서 확인. **❓는 확인 전에 코드로 쓰지 않는다.**

| 항목 | 상태 | 내용 |
|---|---|---|
| 개인 개발자 계정은 프로덕션 전 비공개 테스트(테스터 12명 × 14일) | ❓ | 2023-11 이후 만든 개인 계정에 적용된다고 알려져 있다. 현재 조건을 R-101에서 확인한다 |
| 타깃 API 레벨 요구 | ❓ | R-101 |
| AAB + Play 앱 서명 | ❓ | R-101 |
| 등급(IARC 설문)으로 한국 등급 대체 여부 | ❓ | R-101. 이전 조사(`docs/_archive/tickets/R-002-launch-legal.md`)도 참고 |
| 게임제작업·배급업 등록 필요 여부(개인, 무료 + 광고) | ❓ | R-101 |
| 데이터 보안 양식, 개인정보처리방침 URL, 광고 포함 표시 | ❓ | R-101 |
| 전쟁·실제 국가가 등장하는 게임 콘텐츠 정책 | ❓ | R-101(GDD §2.3) |
| AdMob 보상형 광고 이벤트 이름, 테스트 광고 ID | ❓ | R-101 |
| 백버튼 이벤트, 앱 백그라운드·복귀 이벤트 | ❓ | R-101 |

## 5. 세이브

```ts
// save.ts가 다루는 모양 (구현은 B 레인)
type Save = {
  v: 1
  name: string                 // 신병 이름
  unlocked: string[]           // 해금된 카드 id
  bestWave: number
  runs: number
  firstRun: boolean
  settings: { bgm: boolean; sfx: boolean; haptic: boolean; dmgNumbers: boolean }
}
```

- 키는 `d2_save_v1` 하나이고 값은 `JSON.stringify`다.
- 저장 시점은 판 종료, 해금, 설정 변경, 이름 입력뿐이다. **전투 중에는 저장하지 않는다.**
- 파싱에 실패하면 기본값 + `log('save_corrupt')`. 앱이 멈추면 안 된다.
- `v`가 바뀌면 `migrate(old)` 함수 하나를 추가한다(그때 만든다).

## 6. 오디오

- 사용자 설정(`bgm`, `sfx`)과 시스템 정지 플래그(`hidden`, `ad`)를 OR로 합쳐 음소거를 정한다.
- 정지 트리거: 앱 백그라운드(`platform.onPause`), 광고 show 직전
- 재개는 앱이 돌아오고 광고가 끝났을 때만 한다. 그 뒤 첫 `pointerdown`에서 `sound.context.resume()`를 한 번 더 부른다.
- 효과음은 동시에 8개까지만 재생한다.

## 7. 보상형 광고 흐름

```
preload() ─▶ loaded=true
show(slot):
  if !loaded → 즉시 false(버튼은 애초에 비활성)
  audio.mute('ad') → 플러그인 show
  보상 이벤트 → earned=true (이 시점에는 보상하지 않는다)
  닫힘/실패 이벤트 → audio.unmute('ad') → earned면 보상 1회 → preload() 다시
```

- **닫힘만으로는 보상하지 않는다.** 보상은 한 번만 준다(중복 방지 플래그).
- 개발·테스트 빌드는 테스트 광고 ID를, 출시 빌드만 운영 ID를 환경변수(`VITE_ADMOB_*`)로 넣는다.
- 슬롯은 GDD §10의 4개다: `revive`, `reroll`, `supply`, `unlock`.

## 8. 레인 A·B 경계 (고정 시그니처)

`src/battle/`(A)은 DOM을 직접 만지지 않는다. `src/ui/screens.ts`(B)의 아래 함수만 부른다. H-101이 이 시그니처의 빈 구현을 만들고, B가 채운다. **시그니처를 바꾸려면 A가 이 표를 먼저 고친다.**

```ts
export type Phase = 'prep' | 'fight' | 'settle'
export type Hud = { wave: number; waves: number; defcon: 2 | 1; supply: number; baseHp: number; phase: Phase; prepLeft: number; speed: 1 | 2; synergies: { card: string; count: number; on: boolean }[] }
export type Offer = { card: string; cost: number } | null

export function hud(h: Hud): void                                              // 매 프레임이 아니라 값이 바뀔 때만
export function shop(open: boolean, offers: Offer[], supply: number, onBuy: (i: number) => void, onReroll: () => void, onGo: () => void): void
export function cardInfo(card: string | null, rank?: number): void            // null이면 닫기
export function banner(text: string, kind: 'flag' | 'defcon' | 'info'): void
export function result(r: { win: boolean; wave: number; kills: number; unlocked?: string }, onAgain: () => void, onLobby: () => void): void
export function askRevive(onYes: () => void, onNo: () => void): void

// 전투 제어: BattleScene이 시작할 때 bindBattle(ctl), 끝날 때 bindBattle(null)을 부른다.
// HUD의 일시정지·2배속 버튼, 일시정지 모달(계속·포기), 전투 중 뒤로가기, 광고 보상 버튼은 B가 그리고 이 함수들을 부른다.
export type BattleCtl = {
  pause(): void
  resume(): void
  setSpeed(s: 1 | 2): void
  quit(): void          // 포기 → A가 결과 화면(result)으로 간다
  adReroll(): void      // 광고를 끝까지 본 뒤 B가 부른다. A가 무료 리롤 1회를 적용한다
  adSupply(): void      // 광고를 끝까지 본 뒤 B가 부른다. A가 보급 +5를 적용한다
}
export function bindBattle(ctl: BattleCtl | null): void
```

- 대기석·판매 칸·배치 구역·지뢰 토큰은 **캔버스(A)**다. 드래그가 한 좌표계 안에서 끝나야 하기 때문이다.
- HUD 버튼·모달·상점 패널은 **DOM(B)**이다. 전투로 가는 입력은 `onBuy`·`onReroll`·`onGo` 콜백과 `bindBattle`의 `ctl`뿐이다.
- 상점 카드를 누르면 `onBuy(i)` → A가 보급을 차감하고 대기석에 넣는다.
- 전투 중 안드로이드 뒤로가기 → B가 `ctl.pause()` 후 일시정지 모달을 띄운다(로비에서는 종료 확인 모달).
- A는 해금·최고 기록 저장에 B의 `save.ts`(`load()`/`save()`)를 import해 쓴다. `?scene=log`는 B의 `main.ts`가 `battle` 씬으로 시작하고, A가 그 안에서 기록 화면을 그린다.
- 광고 슬롯 중 `revive`는 `askRevive`, `unlock`은 로비(B)가 처리한다. `reroll`·`supply`만 `ctl`을 거친다.

## 9. 디버그 URL

| 파라미터 | 효과 | 담당 |
|---|---|---|
| `?scene=battle` | 로비를 건너뛰고 전투를 바로 연다 | B(H-101) |
| `?scene=gallery` | 모든 에셋 키를 격자로 표시 | B(H-101) |
| `?wave=5` | 지정 웨이브부터 시작 | A |
| `?unlock=all` | 모든 카드 해금 | B |
| `?supply=99` | 시작 보급 | A |
| `?deck=rifle:4,sniper:2` | 시작할 때 대기석에 카드 지급 | A |
| `?god=1` | 위병소 무적 | A |
| `?seed=42` | 난수 고정 | B(H-101이 `debug.seed`로 제공) |
| `?speed=2` | 2배속으로 시작 | A |
| `?scene=log` | 로컬 판 기록(`d2_playlog`)의 카드별 구매율·평균 시간(GDD §11) | A |
| `?fps=1` | FPS·활성 오브젝트 수 | B |
| `?safe=1` | Safe Area 표시 | B |

새 기능을 만들면 볼 수 있는 파라미터를 함께 추가하고 이 표가 아니라 **티켓**에 적는다. 게이트 때 Claude가 이 표로 옮긴다.

## 10. 검증 명령

| 명령 | 내용 |
|---|---|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | `vitest run` |
| `npm run build` | `vite build` |
| `npm run assets:check` | 에셋 계약·장부 대조(H-102 이후) |
| **`npm run verify`** | 위를 순서대로 실행. **Stop 훅이 작업 종료 전에 자동으로 실행한다** |
| `npx cap sync android && npx cap run android` | 실기기 실행(T-101 이후). verify에는 넣지 않는다 |

**성능 예산**(M4에서 실측)

| 항목 | 목표 |
|---|---|
| AAB 크기 | 40MB 이하 |
| 첫 화면 | 3초 안 |
| 프레임 | 저가 안드로이드에서 적 40 + 아군 15일 때 평균 55fps 이상 |
| 메모리 | 5판 연속 후 JS 힙 증가 5MB 이하 |

## 11. 금지 목록 (요약은 AGENTS.md)

| 금지 | 대신 |
|---|---|
| React·Vue·Svelte, 상태관리 라이브러리, ECS | DOM + 모듈 변수 |
| `*Manager`·`*Service` 클래스 | 모듈 함수 |
| 직접 만든 풀·상태 머신 클래스 | Phaser Group / `phase` 변수 |
| 하드코딩 수치 | `data.ts`·`stages.ts` |
| 새 npm 패키지 | 티켓 `## 허용 의존성`에 있을 때만 |
| `platform.ts` 밖에서 `@capacitor/*` import | `platform.ts` 함수 |
| 매 프레임 플러그인 호출, 매 프레임 `ui.hud()` | 값이 바뀔 때 1회 |
| `eval`, `new Function`, 원격 스크립트 | — |

## 12. 자동 저장과 브랜치 (공용 컴퓨터 + Orca 병렬)

작업하던 컴퓨터에서 앱을 지워도 진행이 남도록, **저장은 사람이나 에이전트의 기억이 아니라 훅이 한다.**

| 언제 | 무엇이 | 하는 일 |
|---|---|---|
| 에이전트가 턴을 끝낼 때마다 | `stop-gate.mjs` → `autosave.mjs` | 바뀐 파일 전부 커밋 → **지금 브랜치로 push**(`origin HEAD:<브랜치>`) |
| 작업 중 5분마다 | `post-tool.mjs` → `autosave.mjs` | 같음 |
| 티켓 마무리 | `/finish-ticket` | 완료 커밋 + push + **main으로 가는 PR 생성** |
| 사람이 원할 때 | `node scripts/harness/autosave.mjs` | 즉시 저장 |

- **티켓 1개 = 브랜치 1개 = Orca 워크트리 1개**다. 브랜치 이름은 Orca가 정한 것을 그대로 쓰고, 티켓 `## 진행 기록`의 `브랜치:` 줄에 적는다.
- main에는 PR로만 들어간다. 병합은 사용자(또는 게이트 때 Claude)가 한다.
- detached HEAD에서는 push하지 않고 `.harness/push-failed`에 이유를 남긴다.
- 재설치 후에는 `git fetch` → 티켓 진행 기록의 `브랜치:`로 `git switch <브랜치>` → `/start-ticket <ID>`(`docs/SETUP.md` §4).
- 비밀값(`.env*`, 키스토어)은 `.gitignore`에 있어 올라가지 않는다. 저장소는 **PUBLIC**이다.
