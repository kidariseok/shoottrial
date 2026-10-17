# TECH: 기술 구조 v0.2

> 작성: 2026-10-17, Claude(기획). 원칙은 ponytail(가장 짧게 동작하는 구조)이다. 구현 담당은 이 문서를 수정하지 않는다.
> v0.2(2026-10-17): 세로 360×640 탑다운으로 바꿨고, §11 자동 저장을 추가했다.

## 1. 스택 (확정)

| 항목 | 선택 | 근거 |
|---|---|---|
| 언어·번들러 | TypeScript + Vite | 앱인토스는 CSR/SSG만 허용한다. 정적 번들 |
| 게임 엔진 | **Phaser 4.2.1**(버전 고정) | Arcade Physics·Group·Tween·Sound·Scale이 기본 제공된다. 같은 PC의 Live A Life에서 동작 확인됨 |
| 플랫폼 SDK | `@apps-in-toss/web-framework` **3.x**(2026-10-17 기준 latest 3.8.0) | SDK 3.x는 설정 파일 `apps-in-toss.config.ts`를 쓰고, 로컬 브라우저 devtools로 테스트한다 |
| 테스트 | Vitest | 순수 함수(`rules.ts`)·세이브·광고 흐름만 테스트한다 |
| 메뉴 UI | **순수 DOM + CSS**(React 없음) | Safe Area를 CSS로 처리할 수 있고, 한글이 선명하고, 번들이 작다 |
| 폰트 | Galmuri(OFL) | 픽셀 한글 폰트 |

**Phaser 4 주의**: 인터넷 예제는 대부분 Phaser 3다. API는 대체로 같지만 렌더러·일부 이름이 다르다. 낯선 API는 `node_modules/phaser/types`에서 확인하고 쓴다.

## 2. 폴더 구조 (이 구조 밖에 파일을 만들려면 티켓 허가가 필요하다)

```
shoottrial/
├─ index.html              # #game(캔버스) + #ui(DOM 오버레이) + Safe Area CSS 변수
├─ apps-in-toss.config.ts
├─ package.json            # scripts: dev, build, test, typecheck, verify
├─ src/
│  ├─ main.ts              # 부팅: toss.init() → save.load() → ui.show('lobby')
│  ├─ toss.ts              # ★ SDK를 import하는 유일한 파일. 식별키·저장소·safe area·햅틱·리더보드·백버튼·종료·로그
│  ├─ save.ts              # 세이브 load/save (§5)
│  ├─ audio.ts             # BGM/SFX on/off, 백그라운드·광고 중 정지 (§6)
│  ├─ ads.ts               # 보상형 광고 1그룹 (§7)
│  ├─ data.ts              # 모든 수치 표 (GDD §4·5와 1:1)
│  ├─ stages.ts            # 웨이브 표
│  ├─ rules.ts             # 순수 함수: 피해·강화 비용·점수·복무일수·계급·카드 추첨
│  ├─ debug.ts             # URL 파라미터 해석(?scene ?stage ?wave ?god ?seed ?fps ?safe)
│  ├─ ui/
│  │  ├─ screens.ts        # show(name): lobby | result | 모달들. DOM 생성은 템플릿 문자열
│  │  └─ style.css
│  └─ battle/
│     ├─ BattleScene.ts    # 전투 루프, 웨이브 진행, overlap 등록, 일시정지
│     ├─ player.ts         # 이동·구르기·무적·칼각
│     ├─ weapons.ts        # 자동 조준·발사·열기
│     ├─ enemies.ts        # 잡졸 3종(데이터 + switch)
│     ├─ boss.ts           # 보스 3종 패턴
│     ├─ pad.ts            # 플로팅 조이스틱 + 버튼 2개 (멀티터치)
│     ├─ hud.ts            # HP·웨이브·점수·보스 HP·열기·쿨
│     └─ fx.ts             # 번쩍·흔들림·파티클·데미지 숫자·칼각 팝업
├─ tests/                  # rules.test.ts · save.test.ts · ads.test.ts
├─ public/assets/          # docs/ART.md §4 에셋 계약 표의 파일만
├─ art/                    # LEDGER.json(에셋 장부), palette.json, source/(AI 원본, 빌드 제외)
├─ scripts/
│  ├─ harness/             # 훅 스크립트 (읽기 전용)
│  ├─ pixelize/            # AI 원본 → 팔레트·해상도 정리 (H-002에서 Live A Life에서 이식)
│  └─ assets-check.mjs     # 장부와 파일 대조 (H-002)
└─ docs/
```

### 2.1 원안 구조에서 뺀 것

| 원안 | 대체 | 다시 고려할 조건 |
|---|---|---|
| `GameStateMachine` | Phaser 씬 `pause()/resume()` + `screens.show()` | 상태 꼬임 버그가 2번 이상 나면 |
| `ObjectPool<T>` | `this.physics.add.group({ maxSize })` + `group.get()` / `setActive(false).setVisible(false)` | 없음 |
| `CollisionSystem` | `BattleScene`에서 `physics.add.overlap` 몇 줄 | 없음 |
| `TossBridgeAdapter` 인터페이스 + `MockTossBridge` 클래스 | `toss.ts` 함수 모음 + SDK 3.x 로컬 devtools. devtools가 못 덮는 호출만 `if (!inToss)` 폴백 | 없음 |
| `SafeAreaManager` | CSS 변수 `--sa-top/right/bottom/left` + `toss.safeRect()` 함수 1개 | 없음 |
| `AdManager` 순차 큐(그룹 2개) | 광고 그룹 1개 공용 | 지점별 수익 분리가 필요해지면 |
| 세이브 체크섬 + 백업 키 | `try/catch` → 기본값 + `log('save_corrupt')` | 분석에서 `save_corrupt`가 보이면 백업 키 추가 |
| 프로시저럴 사운드 합성기 | jsfxr로 만든 `.ogg/.m4a` 효과음 | 없음 |
| `AnalyticsLogger` 클래스 | `toss.log(event, params)` | 없음 |
| `verify-release.ts` | `npm run verify` + P5의 `scripts/release-check.mjs`(grep 몇 줄) | 없음 |

## 3. 화면·좌표

| 항목 | 내용 |
|---|---|
| 방향 | **세로 고정** |
| 내부 해상도 | **360×640** 픽셀아트. `pixelArt: true`, `roundPixels: true` |
| 스케일 | 너비 360 고정, 높이는 화면 비율로 640~800. Phaser `Scale.FIT` + `pixelArt`(최근접) |
| 세계 좌표 | 0~360 × 0~640(아레나는 GDD §4.1)을 유지한다. 화면이 더 길면 카메라를 가운데로 옮기고 남는 위아래는 배경(360×800)으로 채운다. `// ponytail: 비정수 배율이라 픽셀 크기가 미세하게 다를 수 있다. 눈에 띄면 기기 픽셀 기준 정수 배율로 바꾼다` |
| 카메라 | 고정(한 화면 아레나). 흔들림 연출만 쓴다 |
| 게임 영역 | 모든 게임플레이 좌표는 360×640 안. HUD와 패드는 `safeRect()` 안. HUD는 화면 고정(`setScrollFactor(0)`) |
| 시스템 버튼 금지 구역 | 우측 상단. 세로 화면에서는 상태 표시줄·노치 아래에 있다. 정확한 크기는 R-001·T-001 실측값(`docs/research/platform-api.md`). 측정 전 임시값: 오른쪽 위 Safe Area 기준 110×52 화면 픽셀 |
| `?safe=1` | Safe Area(초록 선)와 금지 구역(붉은 반투명)을 그린다. 모든 화면 티켓의 스크린샷에 포함한다 |

## 4. 플랫폼 사실 표

✅ = 공식 문서로 확인(2026-10-17). ❓ = R-001에서 확인할 것. **❓ 항목은 확인 전에 코드로 쓰지 않는다.**

| 항목 | 상태 | 내용 / 출처 |
|---|---|---|
| 출시 체크리스트 | ✅ | `developers-apps-in-toss.toss.im/checklist/app-game` (아래 §9) |
| CSR/SSG만, `eval` 금지, 외부 도메인 이동 금지 | ✅ | 위 체크리스트 |
| 설정 파일 `apps-in-toss.config.ts`, `webBundleDir`, `webView` | ✅ | `documentation/integration/sdk-3.x` |
| 로컬 브라우저 devtools로 테스트(샌드박스 앱 불필요) | ✅ | 위 문서. **devtools가 SDK 호출을 얼마나 흉내 내는지는 ❓** |
| 실행 Origin: `<appName>.web.tossmini.com`(라이브), `<appName>.private-web.tossmini.com`(QR 테스트) | ✅ | `documentation/sdk/v3` |
| SDK 3.0 도메인 객체 API(예: `Device.openCamera()`) | ✅ | 위 문서. 2.x 함수형은 deprecated 경고 |
| 리더보드 | ✅(2.x 함수명) / ❓(3.x 이름) | 문서 예시는 `openGameCenterLeaderboard()`, 최소 버전 5.221.0. 점수 제출 함수와 3.x 이름은 R-001 |
| 화면 방향(세로 고정) | ❓ | 체크리스트에 "설정한 가로/세로 모드가 정상 작동"이 있다. 기본값이 세로인지, 기기를 돌렸을 때 회전을 막는 방법이 무엇인지 R-001에서 확인 |
| 사용자 식별키(게임용) | ❓ | `documentation/common/authentication/hash-key`. 3.x 함수명은 R-001 |
| Storage(네이티브 저장소) | ❓ | `documentation/common/file-storage/storage`. 기기를 바꾸면 사라질 수 있다(✅) |
| Safe Area 값 얻기·구독 | ❓ | R-001 |
| 안드로이드 백버튼 이벤트, 앱 종료 | ❓ | R-001 |
| 햅틱 | ❓ | R-001 |
| 보상형 광고 load/show, 이벤트 이름, 테스트 광고 ID | ❓ | R-001. 원안의 `ait-ad-test-rewarded-id`는 미검증 |
| 분석 이벤트 | ❓ | R-001 |
| QR 실기기 테스트 조건: 만 19세 이상, 워크스페이스 멤버, 토스 로그인 | ✅ | `ai-vibe-coding` 문서 |
| 공식 AI 하네스 | ✅ | `github.com/toss/apps-in-toss-harness`. MCP: `apps-in-toss-docs`(`https://developers-apps-in-toss.toss.im/~gitbook/mcp`), `ait-console` |

## 5. 세이브

```ts
// save.ts가 다루는 모양 (구현은 T 티켓)
type Save = {
  v: 1
  userKey: string
  bread: number                 // 건빵
  days: number                  // 이번 복무 누적 복무일수
  medals: number                // 전역 횟수(훈장, 최대 5)
  lastRollCall: string          // 'YYYY-MM-DD' 일일 점호
  px: { atk: number; heavy: number; armor: number }
  special: 'grenade' | 'jammer'
  cleared: number               // 클리어한 최고 스테이지(0~3)
  best: number                  // 최고 점수
  firstRun: boolean
  settings: { bgm: boolean; sfx: boolean; haptic: boolean; shake: boolean }
}
```

- 키는 `qrf_save_v1` 하나다. 값은 `JSON.stringify`.
- 저장 시점은 정산, PX 구매, 설정 변경, 특수화기 선택뿐이다. **전투 중에는 저장하지 않는다**(브릿지 과호출 금지).
- 로드할 때 파싱에 실패하면 기본값 + `log('save_corrupt')`를 쓴다. 이때 앱이 멈추면 안 된다.
- `v`가 바뀌면 `migrate(old)` 함수 하나를 추가한다(그때 가서 만든다).

## 6. 오디오

- 사용자 설정(`bgm`, `sfx`)과 시스템 정지 플래그(`hidden`, `ad`)를 OR로 합쳐 실제 음소거를 정한다.
- 정지 트리거
  - `document.visibilitychange`(hidden), `pagehide`
  - 광고 show 직전
  - 리더보드 열기 직전
- 재개는 `visible`로 돌아오고 광고가 끝났을 때만 한다. 그 뒤 첫 `pointerdown`에서 `sound.context.resume()`를 한 번 더 호출한다(iOS 대응).
- 효과음은 동시에 8개까지만 재생한다.

## 7. 보상형 광고 흐름

```
preload() ─▶ loaded=true
show(slot):
  if !loaded → 즉시 false 반환(버튼은 애초에 비활성)
  audio.mute('ad') → SDK show
  'userEarnedReward' 이벤트 → earned=true (이 시점에는 보상하지 않는다)
  닫힘/실패 이벤트 → audio.unmute('ad') → earned면 보상 1회 → preload() 다시
```

- 이벤트 이름은 R-001에서 확정한다.
- **닫힘만으로는 절대 보상하지 않는다.** 보상 지급은 한 번만 한다(중복 방지 플래그).
- 개발·QR 빌드는 테스트 광고 ID, 출시 빌드만 운영 ID를 환경변수로 넣는다(`VITE_AD_GROUP`).
- 원안이 경고한 안드로이드 특정 버전의 닫힘 이벤트 누락은 R-001에서 문서로 확인한 뒤 대응한다.

## 8. 검증 명령

| 명령 | 내용 |
|---|---|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | `vitest run` |
| `npm run build` | `vite build`(+ 콘솔 업로드용은 `ait build`, R-001에서 확인) |
| **`npm run verify`** | 위 3개를 순서대로 실행. **Stop 훅이 작업 종료 전에 자동으로 실행한다** |

성능 예산 (P5에서 실측, 그 전에는 목표치)

| 항목 | 목표 |
|---|---|
| 빌드 산출물(`dist/`) | 15MB 이하(상한 100MB) |
| 첫 화면 | 3초 안(상한 10초) |
| 프레임 | 저가 안드로이드 평균 55fps 이상 |
| 메모리 | 5판 연속 플레이 후 JS 힙 증가 5MB 이하 |

## 9. 출시 체크리스트 (공식, 2026-10-17 확인)

| 영역 | 항목 |
|---|---|
| 접속·사운드 | 10초 안 첫 화면 / 소리 On·Off 설정 / 백그라운드 전환 시 즉시 정지, 복귀 시 재생 / 무음 모드·진동 꺼짐에서도 정상 |
| UX | 우측 상단 닫기 버튼 / Safe Area(다이내믹 아일랜드 포함) 침범 금지 / 진입 즉시 바텀시트 금지 / 모든 화면에서 나갈 방법 / 예측 가능한 CTA / 예상 못 한 전면 광고 금지 |
| 식별키 | 식별자 저장 후 게임 시작 / 랭킹·레벨·스테이지 유지 / 재접속 후 유지 |
| 보안·안정성 | 브릿지 과호출 금지(반복문·타이머·화면 갱신에서 중복 호출 금지) / 실패 시 재시도 횟수·간격 제어 / `eval` 금지 / 외부 도메인 이동·임베드 금지 / SSR 금지 / HTTPS·WSS만 |
| 동작 | 안드로이드 백버튼 / 풀스크린 / 설정한 가로·세로 모드 정상 / **종료 시 확인 모달** / 인터랙션 2초 이상 지연 금지 / 네트워크·메모리 급증 금지 / 점수·스테이지 흐름 오류 없음 |
| 인앱 광고 | 재생 중 음악 정지 / 사전 로딩 / 종료 후 화면 복귀·음악 재생 / 리워드 끝까지 시청 시 보상 / 배너는 상·하단만 / 토스 애즈 SSP 정책 준수 |

## 10. 금지 목록 (요약은 AGENTS.md)

| 금지 | 대신 |
|---|---|
| React·Vue·Svelte, 상태관리 라이브러리, ECS | DOM + 모듈 변수 |
| `*Manager`·`*Service` 클래스 | 모듈 함수 |
| 직접 만든 풀·상태 머신 클래스 | Phaser Group / 씬 pause·resume |
| `setInterval`·`requestAnimationFrame` 안에서 SDK 호출 | 이벤트 시점에 1회 호출 |
| 하드코딩 수치 | `data.ts` |
| 새 npm 패키지 | 티켓 `## 허용 의존성`에 있을 때만 |
| `localStorage`를 진짜 저장소로 쓰기 | SDK Storage(브라우저 폴백에서만 `localStorage`) |
| `window.location` 변경, 외부 iframe, `eval`, `new Function` | — |

## 11. 자동 저장 (공용 컴퓨터 대비)

작업하던 컴퓨터에서 앱을 지워도 진행이 남도록, **저장은 사람이나 에이전트의 기억이 아니라 훅이 한다.**

| 언제 | 무엇이 | 하는 일 |
|---|---|---|
| 에이전트가 턴을 끝낼 때마다 | `stop-gate.mjs` → `autosave.mjs` | 바뀐 파일 전부 커밋(`wip(<티켓>): 자동 저장 <시각>`) → `git push origin HEAD:main`. 검사보다 먼저 실행한다 |
| 작업 중 5분마다 | `post-tool.mjs` → `autosave.mjs` | 같음. 한 턴이 길어도 최대 5분치만 잃는다 |
| 티켓 마무리 | `/finish-ticket` → `autosave.mjs -m "<ID>: <제목>"` | 완료 커밋 + push |
| 사람이 원할 때 | `node scripts/harness/autosave.mjs` | 즉시 저장 |

- **브랜치는 `main` 하나만 쓴다.** 중간 커밋(`wip`)은 미완성일 수 있다. 확실히 동작하는 지점은 게이트 태그(`g0`, `g1`…)와 티켓 완료 커밋(`T-00X: …`)이다.
- push가 실패하면(인증 만료·오프라인·원격이 앞섬) `.harness/push-failed`에 이유가 남는다. 로컬 커밋은 남아 있다. `/start-ticket`이 시작할 때 이 파일을 확인해 알려준다. 복구는 `docs/SETUP.md` §5.
- **티켓 파일의 `## 진행 기록`이 작업의 기억이다.** Antigravity 대화 기록은 컴퓨터에만 있어 재설치하면 사라진다.
- `.harness/`(활성 티켓·기준 커밋)는 컴퓨터마다 따로다. 재설치 후 `/start-ticket <ID>`를 다시 하면 티켓의 `기준 커밋:` 줄로 복원한다.
- 비밀값(`.env*`)은 `.gitignore`에 있어 올라가지 않는다. 토큰·비밀번호를 코드나 문서에 쓰지 않는다.
