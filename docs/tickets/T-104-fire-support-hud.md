# T-104 HUD 화력 지원 버튼 + 데프콘 1 연출

상태: 대기
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

- [ ] `npm run verify` 통과
- [ ] 레인 A가 아직 `support`를 넘기지 않아 `tsc`가 깨지는 일이 없다. A 쪽 수정이 필요하면 `## 질문`에 적고 멈춘다. `Hud` 객체 리터럴에 필드가 빠지면 tsc 오류가 나므로, 그래서 `support?: number`와 `fireSupport?()`는 둘 다 선택으로 두고, 없으면 버튼을 끈다. Phase 5가 넘기기 시작하면 Claude가 필수로 바꾼다.
- [ ] `docs/shots/T-104.png`: `?scene=ui` 데모에서 화력 지원 버튼(켜짐)과 데프콘 1 테두리 점멸 중인 화면(390×844)
- [ ] `git diff origin/main -- src/ui/screens.ts | grep -E '^[+-]export'` 결과가 위 1번의 세 줄 추가뿐이다

디버그 URL: `http://localhost:5173/?scene=ui`

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
