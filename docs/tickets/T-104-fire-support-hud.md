# T-104 HUD 화력 지원 버튼 + 데프콘 1 연출

상태: 완료
담당: Antigravity · gemini-4-argon-high (역할 카드: `docs/agents/antigravity-build.md`)

## 목표

전투 HUD에 "화력 지원" 버튼을 붙여 레인 A의 `ctl.fireSupport()`를 부르고, 데프콘 1 배너가 뜰 때 화면 테두리가 붉게 점멸하게 한다. 레인 A Phase 5(화력 지원)가 이 티켓을 기다린다.

## 선행

- T-103(완료)

## 소유 경로

- `src/ui/screens.ts`
- `src/ui/style.css`
- `src/ui/helpers.ts`
- `src/ui/demo.ts`
- `tests/ui.test.ts`

## 허용 의존성

- 없음

## 참고 문서

- `docs/TECH.md` §8: **이번에 바뀐 시그니처**
  - `Hud`에 `support?: number`(선택)가 붙었다.
  - `BattleCtl`에 `fireSupport?(): void`(선택)가 붙었다.
  - `lobby(): void`도 새로 생겼다. **이번 티켓에서는 빈 함수만 export한다.** 실제 구현은 T-105다.
- `docs/GDD.md` §5.8(화력 지원), §4.1·§9(데프콘 1 연출)

## 할 일

1. `screens.ts`의 `Hud` 타입에 `support?: number`(선택)를 더한다. `BattleCtl`에 `fireSupport?(): void`(선택)를 더한다. `export function lobby(): void {}`를 빈 함수로 둔다(주석: `// T-105에서 구현`).
2. HUD에 "화력 지원 ×n" 버튼을 둔다. 위치는 HUD 오른쪽, 배속 버튼 아래이고 Safe Area 안이다.
   - 켜는 조건: `phase === 'fight'`이고 `support > 0`일 때. 아니면 흐리게 하고 누를 수 없다.
   - 누르면 `currentCtl?.fireSupport?.()`를 부른다.
   - 터치 영역은 최소 48×48 CSS px다.
3. `banner(text, 'defcon')`이 불리면 기존 배너에 더해 `#ui` 위에 **화면 테두리 붉은 점멸 3회**(약 1.2초)를 CSS 애니메이션으로 띄운다. 클릭은 통과(`pointer-events: none`).
   - 소리: `audio.ts`에 `sfx_radio`·`sfx_siren` 키가 생기면 여기서 부른다. 지금은 파일이 없으니 부르는 줄만 두고, 없으면 조용히 넘어간다.
4. `?scene=ui` 데모에 "화력 지원 켜짐/꺼짐"과 "데프콘 1 배너" 버튼을 더해 바로 볼 수 있게 한다.
5. `tests/ui.test.ts`에 버튼 활성 조건(phase·support 조합 4가지) 순수 헬퍼 테스트를 더한다. 헬퍼는 `helpers.ts`에 둔다.

## 검증 명령

- `npm run verify`

## 완료 조건

- [x] `npm run verify` 통과
- [x] 레인 A가 아직 `support`를 넘기지 않아 `tsc`가 깨지는 일이 없다. A 쪽 수정이 필요하면 `## 질문`에 적고 멈춘다. `Hud` 객체 리터럴에 필드가 빠지면 tsc 오류가 나므로, 그래서 `support?: number`와 `fireSupport?()`는 둘 다 선택으로 두고, 없으면 버튼을 끈다. Phase 5가 넘기기 시작하면 Claude가 필수로 바꾼다.
- [x] `docs/shots/T-104.png`: `?scene=ui` 데모에서 화력 지원 버튼(켜짐)과 데프콘 1 테두리 점멸 중인 화면(390×844)
- [x] `git diff origin/main -- src/ui/screens.ts | grep -E '^[+-]export'` 결과가 위 1번의 세 줄 추가뿐이다

디버그 URL: `http://localhost:5173/?scene=ui`

## 작업 계획

1. **순수 헬퍼 및 HUD 비교 보강 (`src/ui/helpers.ts`)**
   - 화력 지원 버튼 활성 조건 헬퍼 `canFireSupport(phase: Phase, support?: number): boolean`(`phase === 'fight' && (support ?? 0) > 0`)을 추가한다.
   - `isSameHud(prev, next)`에서 `prev.support !== next.support`도 비교하도록 갱신한다.
2. **레인 경계 시그니처 확장 및 HUD 화력 지원 버튼·데프콘 1 테두리 연출 구현 (`src/ui/screens.ts`)**
   - `Hud` 타입에 `support?: number`, `BattleCtl` 타입에 `fireSupport?(): void`를 추가하고, `// T-105에서 구현` 주석과 함께 `export function lobby(): void {}`를 추가한다(기존 `export` 줄 변경 없이 추가만 유지).
   - HUD 오른쪽, 배속 버튼 아래(Safe Area 안)에 최소 48×48 CSS px 크기의 `화력 지원 ×n` 버튼을 만들고, `canFireSupport(h.phase, h.support)`가 참일 때만 활성화하며 클릭 시 `currentCtl?.fireSupport?.()`를 호출한다.
   - `banner(text, 'defcon')` 호출 시 `#ui` 위에 `pointer-events: none`인 테두리 붉은 점멸 오버레이(3회, 약 1.2초 CSS 애니메이션)를 표시하고, `audio.ts`의 `playSfx`로 `sfx_radio`·`sfx_siren` 호출 줄을 두되 파일 미존재 시 조용히 넘어가게 처리한다.
3. **화력 지원 버튼 및 데프콘 1 테두리 점멸 스타일 추가 (`src/ui/style.css`)**
   - `.hud-support-btn`(Safe Area 안 우측, 배속 버튼 아래, 최소 48×48px, 비활성 시 흐림·클릭 불가) 및 데프콘 1 화면 테두리 붉은 점멸 3회(`@keyframes defcon-screen-flash`, 0.4s × 3 = 1.2s, `pointer-events: none`) 스타일을 추가한다.
4. **UI 데모 컨트롤 추가 (`src/ui/demo.ts`)**
   - `?scene=ui` 데모 화면에 "화력 지원 켜짐/꺼짐" 토글 버튼과 "데프콘 1 배너" 버튼을 두어 즉시 확인 및 스크린샷 촬영이 가능하게 한다.
5. **단위 테스트 추가 및 검증 (`tests/ui.test.ts`)**
   - `canFireSupport`의 `phase`·`support` 조합(전투/비전투 × 남은 횟수 양수/0·미지정 등) 및 `isSameHud`의 `support` 변경 감지 테스트를 추가하고 `npm run verify`를 실행한다.

- 확인할 디버그 URL: `http://localhost:5173/?scene=ui&safe=1`
- 검증 명령: `npm run verify`
- 플랫폼 API: 사용하지 않음 (DOM/CSS 및 기존 `src/audio.ts` 호출만 사용)

## 질문

- [x] 사용자: 계획을 확인하고 "진행"이라고 답해 주세요

## 진행 기록

- 기준 커밋: ae7c023f0538
- 브랜치: kidariseok/t104-ticket-work
- 세션 시작: Gemini 4 Argon (High), 2026-10-22 17:04
- [x] 1단계: `src/ui/helpers.ts`에 `canFireSupport(phase, support)` 추가 및 `isSameHud`에 `support` 비교 반영
- [x] 2단계: `src/ui/screens.ts`에 `Hud.support`, `BattleCtl.fireSupport`, `lobby()` 추가 및 화력 지원 버튼·데프콘 1 테두리 점멸/오디오 호출 구현
- [x] 3단계: `src/ui/style.css`에 `.hud-support-btn`, `.ui-defcon-flash`(3회 점멸 애니메이션), `.ui-demo-controls` 스타일 추가
- [x] 4단계: `src/ui/demo.ts`에 "화력 지원 켜짐/꺼짐" 및 "데프콘 1 배너" 데모 버튼 추가
- [x] 5단계: `tests/ui.test.ts`에 `canFireSupport` 4가지 조합 및 `isSameHud` 테스트 추가, `npm run verify` 통과

## 결과 보고

- 바뀐 파일:
- 검증 결과:
- 스크린샷:
- 사용자 확인 방법:
- 확인하지 못한 점:
- 다음 제안:

## 인계 메모
