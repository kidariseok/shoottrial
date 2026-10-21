# T-103 UI 크기 보정: 긴 화면에서 상점 패널이 대기석을 가리는 문제 + #game 정렬 중복

상태: 진행 중
담당: Antigravity · gemini-4-argon-high (역할 카드: `docs/agents/antigravity-build.md`)

## 목표

화면 높이 1280~1560(그리고 폰 실제 비율) 어디서든 DOM 상점 패널이 캔버스의 **논리 120px 띠(y 1160~1280, 판이 아래 기준이라 실제로는 캔버스 맨 아래 120px)**와 정확히 겹치고, 대기석 카드를 가리지 않는다. `#game` 정렬이 Phaser `Scale.CENTER_BOTH`와 이중으로 걸리지 않는다.

## 배경 (레인 A 03-02 확인)

- `src/ui/style.css`의 `--shop-max-height: calc(100% * 120 / 1280)`은 **화면 높이** 기준이다. 캔버스는 너비 720 기준으로 늘어나므로(`Scale.FIT`, 높이 1280~1560) 긴 화면에서 패널이 캔버스의 120px보다 커져 대기석 아래 약 20~26px를 덮는다. 스크린샷: `docs/shots/M2-03-02.png`(720×1560).
- `#game`이 `display:flex`로 가운데 정렬을 하는데 Phaser `autoCenter: CENTER_BOTH`도 margin을 넣는다. 헤드리스에서 캔버스가 밀린 적이 있다(02-04 기록).

## 선행

- T-102(완료)

## 소유 경로

- `src/ui/style.css`
- `src/ui/screens.ts`
- `src/main.ts`
- `index.html`
- `src/device.ts`
- `tests/ui.test.ts`

## 허용 의존성

- 없음

## 참고 문서

- `docs/TECH.md` §3(논리 해상도·Safe Area), §8(시그니처 — **바꾸지 않는다**)
- `docs/GDD.md` §3(화면 배치: 대기석 1040~1160, 상점 1160~1280, 판은 아래 기준)
- `src/main.ts`(높이 계산 `calculateLogicalHeight`, Scale 설정)

## 할 일

1. 캔버스의 실제 표시 배율(`game.scale.displayScale` 또는 캔버스 `getBoundingClientRect()` 너비 ÷ 720)을 CSS 변수 `--game-scale`로 내보낸다. 크기가 바뀔 때(`game.scale.on('resize')`) 갱신한다. 위치는 `main.ts`(또는 `screens.ts`의 초기화 함수 하나).
2. 상점 패널 높이를 `calc(var(--game-scale) * 120px)`로 바꾸고, 패널 아래 끝을 캔버스 아래 끝에 맞춘다(캔버스가 화면보다 작으면 그 차이만큼 위로).
3. `#game`의 flex 가운데 정렬과 Phaser `CENTER_BOTH` 중 하나만 남긴다(Phaser 쪽을 권장). 캔버스가 화면 가운데에 한 번만 정렬되는지 확인한다.
4. HUD 위쪽 요소도 같은 배율 기준인지 확인한다(이미 Safe Area 기준이면 그대로 둔다).
5. **(G0 추가) `#game`을 Safe Area 안에 배치한다.** 안드로이드 에뮬레이터에서 캔버스가 상태 표시줄·내비게이션 바 아래까지 그려졌다(`docs/reviews/G0.md`, `docs/shots/G0-emu-battle.png`). `#game`의 top/bottom을 `--sa-top`/`--sa-bottom`만큼 비우고, Phaser 높이 계산(`calculateLogicalHeight`)도 그 영역 기준으로 한다. 그래야 DOM 상점(Safe Area 기준)과 캔버스 대기석이 맞는다.
6. **(G0 추가)** `?scene=device`의 Safe Area 숫자를 `env()`가 아니라 실제 쓰는 `--sa-*` 값으로 표시한다(안드로이드 15+에서 `env()`는 0을 준다).

## 검증 명령

- `npm run verify`

## 완료 조건

- [ ] `npm run verify` 통과
- [ ] `docs/shots/T-103-1560.png`(720×1560)와 `docs/shots/T-103-1280.png`(720×1280), `docs/shots/T-103-390.png`(390×844): 세 화면 모두 상점 패널 위 끝이 대기석 띠 아래 끝과 맞고, 대기석 카드가 가려지지 않는다(전투 화면 `?scene=battle&deck=rifle:3,sniper:1,blower:1&seed=42`, 준비 단계)
- [ ] 캔버스가 한 번만 가운데 정렬된다(`getBoundingClientRect()` 좌우 여백이 같고, margin과 flex가 겹치지 않음을 결과 보고에 적음)
- [ ] `src/ui/screens.ts`의 export 시그니처 변화 없음(`git diff origin/main -- src/ui/screens.ts | grep -E '^[+-]export'` 출력 없음)

디버그 URL: `http://localhost:5173/?scene=battle&deck=rifle:3,sniper:1,blower:1&seed=42&safe=1`

## 작업 계획

1. **`#game` Safe Area 배치 및 중복 정렬 제거 (`src/ui/style.css`)**
   - `#game`의 `display: flex; align-items: center; justify-content: center;`를 제거하여 Phaser `Scale.CENTER_BOTH`와 이중 정렬되지 않게 한다.
   - `#game`의 위치와 크기를 Safe Area 안쪽(`top: var(--sa-top); right: var(--sa-right); bottom: var(--sa-bottom); left: var(--sa-left); width: calc(100% - var(--sa-left) - var(--sa-right)); height: calc(100% - var(--sa-top) - var(--sa-bottom));`)으로 지정한다.
2. **캔버스 표시 배율(`--game-scale`)·오프셋 동기화 및 Safe Area 기준 논리 높이 계산 (`src/main.ts`, `src/ui/style.css`)**
   - `src/main.ts`의 `calculateLogicalHeight()`가 전체 창이 아니라 Safe Area 영역(`#game` 크기 또는 `safeRect()`)의 가로세로 비율을 기준으로 논리 높이(1280~1560)를 계산하도록 수정한다.
   - 캔버스의 실제 표시 배율(`canvas.getBoundingClientRect().width / 720` 또는 `game.scale.displayScale`)을 CSS 변수 `--game-scale`로, 캔버스 하단과 뷰포트 하단 사이의 간격을 `--shop-bottom`(및 좌우 간격 `--shop-left`, `--shop-right`)으로 내보내고 `game.scale.on('resize')` 및 창 리사이즈·Safe Area 변수 갱신 시 동기화한다.
   - `src/ui/style.css`에서 `--shop-max-height: calc(var(--game-scale) * 120px)`로 바꾸고 `.ui-shop`의 아래 끝이 캔버스 아래 끝(`bottom: var(--shop-bottom, var(--sa-bottom))`)에 정확히 맞도록 보정한다. HUD(`.ui-hud`)는 기존 Safe Area 기준 배치를 유지하되 `--hud-height: calc(var(--game-scale) * 96px)`로 배율 기준을 통일한다.
3. **`?scene=device` Safe Area 표시값 `--sa-*` 실효값 연동 (`src/device.ts`)**
   - `src/device.ts`에서 Safe Area 숫자를 표시할 때 `--sa-top`, `--sa-right`, `--sa-bottom`, `--sa-left`의 실제 적용값(CSS 변수 및 computed 값)을 읽도록 하고, Capacitor SystemBars가 `document.documentElement.style`을 갱신할 때 `MutationObserver`로 즉시 반영되게 한다.
4. **단위 테스트 추가 및 검증·스크린샷 촬영 (`tests/ui.test.ts`)**
   - `tests/ui.test.ts`에 논리 높이/스케일 보정 관련 검증을 추가하고, `npm run verify` 통과를 확인한다.
   - 디버그 URL에서 `720×1560`, `720×1280`, `390×844` 해상도로 `docs/shots/T-103-1560.png`, `docs/shots/T-103-1280.png`, `docs/shots/T-103-390.png` 스크린샷을 촬영하여 상점 패널이 대기석 띠(y 1040~1160)를 가리지 않는지, 캔버스 가운데 정렬이 한 번만 적용되는지 확인한다.

- **디버그 URL**:
  - `http://localhost:5173/?scene=battle&deck=rifle:3,sniper:1,blower:1&seed=42&safe=1`
  - `http://localhost:5173/?scene=device&safe=1`
- **검증 명령**: `npm run verify`
- **플랫폼 API**: 신규 Capacitor 플러그인 호출 없음 (`src/platform.ts`의 기존 `safeRect()` 활용)

## 질문

- [x] 사용자: 계획을 확인하고 "진행"이라고 답해 주세요

## 진행 기록

- 기준 커밋: 88edaf85454f
- 브랜치: kidariseok/t103-safe-area-panel
- 세션 시작: Gemini 4 Argon (High), 2026-10-21 22:46
- [x] 1단계: `src/ui/style.css`에서 `#game`의 flex 중앙 정렬을 제거하고 Safe Area 안쪽으로 배치, `--game-scale` 및 `--shop-max-height: calc(var(--game-scale) * 120px)` 적용 (다음: 2단계 `src/main.ts` 논리 높이·배율 동기화)
- [x] 2단계: `src/main.ts`에서 `calculateLogicalHeight`를 Safe Area 기준으로 변경하고, 캔버스 표시 배율(`--game-scale`)과 오프셋(`--canvas-*-gap`)을 `resize` 및 `MutationObserver`/`ResizeObserver`로 동기화 (다음: 3단계 `src/device.ts` `--sa-*` 실효값 표시)
- [x] 3단계: `src/device.ts`에서 `readEffectiveSafeArea`로 실제 `--sa-*` 값을 읽고 `MutationObserver`/`ResizeObserver`로 즉시 갱신되도록 수정 (다음: 4단계 단위 테스트 추가 및 `npm run verify`, 3개 해상도 스크린샷 촬영)

## 결과 보고

- 바뀐 파일:
- 검증 결과:
- 스크린샷:
- 사용자 확인 방법:
- 확인하지 못한 점:
- 다음 제안:

## 인계 메모
