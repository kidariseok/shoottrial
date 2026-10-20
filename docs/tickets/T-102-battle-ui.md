# T-102 전투 UI(DOM): HUD·상점 패널·카드 정보·배너·결과·부활·일시정지 모달 + UI 데모

상태: 진행 중
담당: Antigravity · gemini-4-argon-high (역할 카드: `docs/agents/antigravity-build.md`)

## 목표

`src/ui/screens.ts`의 빈 함수(`docs/TECH.md` §8)가 실제 DOM 화면으로 채워진다. 레인 A(Claude)의 전투 코드가 아직 없어도 `/?scene=ui&safe=1`에서 가짜 값으로 모든 화면을 차례로 볼 수 있다. 결은 Figma "계급 및 조종 패널/메뉴"(`6:33`)의 올리브·카키 군용 패널이다(그림 파일 없이 CSS로).

## 선행

- H-101(완료)

## 소유 경로

- `src/ui/`
- `src/main.ts`
- `src/debug.ts`
- `tests/ui.test.ts`

## 허용 의존성

- 없음

## 참고 문서

- `docs/TECH.md` §8(시그니처·`BattleCtl`·경계 규칙 전부), §9, §11
- `docs/GDD.md` §3(화면 배치 그림), §4.2(부활), §5.3(합성·계급), §5.4(시너지 표시), §8(화면 명세), §10(광고 지점)
- `docs/research/figma-inventory.md` `6:33` 행, `docs/ART.md` §1·§2(색 규칙: 붉은색은 적·경보에만)
- Figma 노드 `6:33`(접근 가능하면 스크린샷으로 색·모서리·두께를 따른다. 불가하면 inventory 설명만으로)

## 할 일

1. **`hud(h)`**
   - 좌상단 일시정지 버튼, 상단 중앙 "웨이브 n/10" + 데프콘 배지(2 = 주황, 1 = 붉은 점멸)
   - 보급·위병소 HP, 준비 단계 남은 초, 2배속 토글
   - 왼쪽 세로 줄에 활성 시너지(아이콘 자리 + 인원 수, 켜진 것은 밝게)
   - 값이 바뀔 때만 DOM을 갱신한다
2. **`shop(open, …)`**
   - 준비 단계에 화면 하단에서 올라오는 패널
   - 카드 5칸(이름·비용·보직 머리글자 자리), 리롤(비용 표시), 무료 리롤(광고 아이콘, 지금은 버튼만), "출동!" 버튼
   - 보급이 모자란 카드는 어둡게 표시한다
   - 패널 높이는 GDD §3의 하단 영역(y=1160~1280, 논리 좌표)을 넘지 않게 CSS 변수로 둔다
3. **`cardInfo(card, rank)`**: 카드 정보 시트(계급, 수치 자리, 고유 능력, 시너지). 수치는 아직 없으니 인자로 받은 이름·계급만 쓰고 나머지 칸은 "—"로 둔다
4. **`banner(text, kind)`**: 화면 가운데 1.5초 배너. flag = 붉은 경고, defcon = 붉은 테두리 점멸, info = 카키
5. **`result(r, …)`**: 승패, 도달 웨이브, 처치 수, 새 해금 카드, "다시 출동"·"생활관" 버튼
6. **`askRevive(onYes, onNo)`**: "광고 보고 부활" 모달(지금은 광고 없이 바로 `onYes` 호출 버튼 + 안내 문구 "광고는 M4에서 연결")
7. **`bindBattle(ctl)`**
   - 일시정지 버튼 → `ctl.pause()` + 일시정지 모달(계속 → `ctl.resume()`, 포기 → `ctl.quit()`)
   - 2배속 버튼 → `ctl.setSpeed()`
   - 무료 리롤·긴급 보급 버튼은 지금은 광고 없이 `ctl.adReroll()`·`ctl.adSupply()`를 바로 호출한다(M4에서 광고 연결)
   - `ctl`이 `null`이면 이 버튼들을 숨긴다
8. **UI 데모 `?scene=ui`**: `main.ts`에서 `scene=ui`이면 Phaser를 띄우지 않고(또는 빈 배경만) `src/ui/demo.ts`가 위 함수들을 가짜 값으로 3초 간격으로 차례 호출한다. 가짜 `BattleCtl`은 `console.log`만 한다
9. **테스트 `tests/ui.test.ts`**: DOM 없이 검사할 수 있는 순수 부분만(예: 숫자 포맷, 시너지 정렬). 없으면 `hud()`의 "같은 값이면 갱신 안 함" 판정 함수를 분리해 테스트한다

## 검증 명령

- `npm run verify`

## 완료 조건

- [ ] `npm run verify` 통과
- [ ] `docs/shots/T-102-hud.png`(`/?scene=ui&safe=1`, 390×844, HUD + 상점 열림)
- [ ] `docs/shots/T-102-result.png`(결과 화면), `docs/shots/T-102-pause.png`(일시정지 모달)
- [ ] Figma `6:33`과 나란히 놓은 비교 사진 `docs/shots/T-102-compare.png`(Figma 접근이 안 되면 결과 보고에 그 사실을 적는다)
- [ ] `screens.ts`의 export 시그니처가 TECH §8과 글자 그대로 같다(결과 보고에 `git diff origin/main -- src/ui/screens.ts`의 export 줄 변화 없음 확인)

디버그 URL: `http://localhost:5173/?scene=ui&safe=1`

## 작업 계획

1. **군용 패널 스타일시트 작성 (`src/ui/style.css`)**: Figma `6:33`(올리브·카키 군용 패널) 및 `docs/ART.md` §1·§2(외곽선 `#1b1d26`, 붉은색·주황은 적·경보 전용)를 반영하여 Safe Area 기준 레이아웃 변수, HUD, 하단 상점 패널(논리 좌표 y=1160~1280 비율 높이 제한 CSS 변수), 배너, 카드 정보 시트, 모달(일시정지·부활·결과) 스타일을 작성한다.
2. **전투 UI DOM 및 순수 헬퍼 구현 (`src/ui/screens.ts`)**: `docs/TECH.md` §8의 고정 export 시그니처를 글자 그대로 유지하면서, HUD 동일 값 갱신 판정 순수 함수(`isSameHud` 등)와 `hud(h)`, `shop(open, ...)`, `cardInfo(card, rank)`, `banner(text, kind)`, `result(r, ...)`, `askRevive(onYes, onNo)`, `bindBattle(ctl)`을 구현한다.
3. **UI 데모 및 디버그 파라미터 연결 (`src/ui/demo.ts`, `src/main.ts`, `src/debug.ts`)**: `?scene=ui`일 때 Phaser를 띄우지 않고 `src/ui/demo.ts`가 3초 간격으로 모든 화면 상태를 가짜 값으로 차례로 호출하도록 연결한다(개별 화면 캡처 편의를 위해 `&uiStep=hud|pause|revive|result` 디버그 파라미터도 지원).
4. **순수 로직 단위 테스트 작성 (`tests/ui.test.ts`)**: DOM 없이 검사 가능한 `isSameHud` 판정, 시너지 정렬, 카드·계급 라벨 포맷 함수를 `tests/ui.test.ts`에서 검증하고 `npm run verify`를 실행한다.
5. **스크린샷 캡처 및 시그니처 검증 (`docs/tickets/T-102-battle-ui.md`)**: `http://localhost:5173/?scene=ui&safe=1`(390×844)에서 `docs/shots/T-102-hud.png`, `docs/shots/T-102-result.png`, `docs/shots/T-102-pause.png`를 캡처하고 `git diff origin/main -- src/ui/screens.ts`로 export 시그니처 불변을 확인한다(Figma MCP 미연결 시 결과 보고에 명시).

- 디버그 URL: `http://localhost:5173/?scene=ui&safe=1`
- 검증 명령: `npm run verify`
- 플랫폼 API: 해당 없음 (순수 DOM/CSS 구현)

## 질문

- [x] 사용자: 계획을 확인하고 "진행"이라고 답해 주세요

## 진행 기록

- 기준 커밋: 18b77739cec5
- 브랜치: kidariseok/r102-military-flavor
- 세션 시작: Gemini 4 Argon High, 2026-10-20 22:04
- [x] 티켓 활성화 및 작업 계획 작성 (`docs/tickets/T-102-battle-ui.md`)
- [x] 1단계: 올리브·카키 군용 패널 스타일시트 및 CSS 변수 작성 (`src/ui/style.css`)
- [x] 2단계: 전투 UI DOM(`src/ui/screens.ts`) 및 순수 헬퍼(`src/ui/helpers.ts`) 구현 (export 시그니처 불변 확인)

## 결과 보고

- 바뀐 파일:
- 검증 결과:
- 스크린샷:
- 사용자 확인 방법:
- 확인하지 못한 점:
- 다음 제안:

## 인계 메모
