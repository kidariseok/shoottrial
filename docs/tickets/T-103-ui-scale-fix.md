# T-103 UI 크기 보정: 긴 화면에서 상점 패널이 대기석을 가리는 문제 + #game 정렬 중복

상태: 대기
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

## 검증 명령

- `npm run verify`

## 완료 조건

- [ ] `npm run verify` 통과
- [ ] `docs/shots/T-103-1560.png`(720×1560)와 `docs/shots/T-103-1280.png`(720×1280), `docs/shots/T-103-390.png`(390×844): 세 화면 모두 상점 패널 위 끝이 대기석 띠 아래 끝과 맞고, 대기석 카드가 가려지지 않는다(전투 화면 `?scene=battle&deck=rifle:3,sniper:1,blower:1&seed=42`, 준비 단계)
- [ ] 캔버스가 한 번만 가운데 정렬된다(`getBoundingClientRect()` 좌우 여백이 같고, margin과 flex가 겹치지 않음을 결과 보고에 적음)
- [ ] `src/ui/screens.ts`의 export 시그니처 변화 없음(`git diff origin/main -- src/ui/screens.ts | grep -E '^[+-]export'` 출력 없음)

디버그 URL: `http://localhost:5173/?scene=battle&deck=rifle:3,sniper:1,blower:1&seed=42&safe=1`

## 작업 계획

## 질문

## 진행 기록

- 기준 커밋: (/start-ticket이 적는다)
- 브랜치: (/start-ticket이 적는다)
- 세션 시작: (모델, 시각)

## 결과 보고

- 바뀐 파일:
- 검증 결과:
- 스크린샷:
- 사용자 확인 방법:
- 확인하지 못한 점:
- 다음 제안:

## 인계 메모
