# T-001 `toss.ts` + 세로·풀스크린·Safe Area·백버튼 모달·저장 (실기기 스파이크)

상태: 대기
담당: Antigravity · gemini-4-argon-high

## 목표

토스 앱에서 열었을 때 갖춰지는 것

| 항목 | 기대 동작 |
|---|---|
| 화면 | 세로 고정 풀스크린(폰을 눕혀도 회전하지 않음) |
| Safe Area | 실제 값을 따른다 |
| 백버튼 | 누르면 "5분대기조를 종료할까요?" 모달 |
| 저장 | 화면 중앙의 "실행 횟수 N"이 앱을 다시 열어도 1씩 늘어난다 |

- 브라우저(devtools)에서도 같은 화면이 오류 없이 뜬다.
- `.ait` 파일이 만들어지고, 사용자가 QR로 테스트할 절차가 정리된다.

## 선행

- H-001
- R-001
- U-01(`appName`)

## 소유 경로

- `src/toss.ts`
- `src/main.ts`
- `src/debug.ts`
- `src/ui/screens.ts`
- `src/ui/style.css`
- `index.html`
- `apps-in-toss.config.ts`
- `package.json`
- `tests/toss.test.ts`

## 허용 의존성

- 없음(SDK 3.x devtools가 별도 패키지라면 R-001에 적힌 이름만 허용. 그 경우 `## 질문`에 먼저 적는다)

## 참고 문서

- `docs/research/platform-api.md` 전체(**여기 없는 API 이름은 쓰지 않는다**)
- `docs/TECH.md` §3, §4, §9
- `docs/GDD.md` §7.5(백버튼 모달 문구)
- `AGENTS.md` '화면 원칙'

## 할 일

1. **`src/toss.ts`**: SDK를 import하는 유일한 파일. 아래 함수만 만든다. 토스 밖(브라우저)에서는 devtools 또는 최소 폴백으로 동작한다.

   | 함수 | 하는 일 |
   |---|---|
   | `init()` | 세로 고정, iOS 스와이프 뒤로가기 끄기, 화면 꺼짐 방지(R-001에 있는 것만) |
   | `inToss` | 실행 환경이 토스 앱인지 |
   | `userKey()` | 게임용 사용자 식별키 |
   | `storageGet(key)` / `storageSet(key, value)` | 저장소 읽기·쓰기. 브라우저 폴백은 `localStorage` |
   | `safeInsets()` + `onSafeInsets(cb)` | Safe Area 값을 CSS 변수 `--sa-*`에 반영 |
   | `safeRect()` | 게임 좌표(360×640)로 변환한 안전 사각형과 시스템 버튼 금지 사각형 |
   | `haptic(type)` | **80ms 스로틀** |
   | `onBack(cb)` | 안드로이드 백버튼 |
   | `closeApp()` | 미니앱 종료 |
   | `log(event, params)` | 분석 로그 |

   - 모든 SDK 호출은 `try/catch`로 감싼다. 실패하면 최대 2회까지 지수 백오프로 재시도하고(필요한 것만), 그래도 안 되면 조용히 폴백한다.
2. **`src/ui/screens.ts`**: 확인 모달 1개를 만든다.
   - `confirm(title, okLabel, cancelLabel): Promise<boolean>`
   - DOM, Safe Area 안, 버튼 사이 24px 이상, 최소 44×44 터치 영역
   - 백버튼 → "5분대기조를 종료할까요?" [취소] [종료] → `closeApp()`
   - 모달이 열려 있을 때 백버튼을 다시 누르면 모달을 닫는다(중복 생성 금지).
3. **`src/main.ts`**
   - 부팅 순서: `init()` → `userKey()` → `storageGet('qrf_launch')` +1 저장 → 화면 중앙에 "실행 횟수 N · 키 앞 6자리"
   - 브라우저에서는 `Escape` 키를 백버튼으로 매핑한다.
4. **`?safe=1` 오버레이**를 SDK 값 기준으로 바꾸고, 실측한 금지 구역 크기를 화면 구석에 숫자로 표시한다.
5. **`tests/toss.test.ts`**: 햅틱 스로틀(가짜 타이머)과 `safeRect()` 변환 검사
6. **`.ait` 빌드**: R-001 §11의 명령으로 만든다. 파일 크기를 기록한다.
7. **QR 절차**: 사용자가 따라 할 실기기 테스트 절차를 `## 결과 보고`에 번호 목록으로 적는다(콘솔 업로드 → QR/푸시 → 확인할 항목).

## 검증 명령

- `npm run verify`
- R-001에 적힌 `.ait` 빌드 명령

## 완료 조건

- [ ] `npm run verify` 통과
- [ ] 브라우저 `/?safe=1`: 실행 횟수가 새로고침마다 1씩 늘고, `Escape` → 모달 → [취소]가 동작한다
- [ ] 콘솔에 오류 없음
- [ ] SDK import가 `src/toss.ts` 한 곳뿐이다(`grep -r "@apps-in-toss" src`로 확인해 결과를 붙인다)
- [ ] `.ait` 생성 및 크기 기록
- [ ] 사용자용 QR 테스트 절차 작성
- [ ] 스크린샷 `docs/shots/T-001.png`

디버그 URL: `http://localhost:5173/?safe=1`

## 작업 계획

## 질문

## 진행 기록

- 기준 커밋: (/start-ticket이 적는다)
- 세션 시작:

## 결과 보고

- 바뀐 파일:
- 검증 결과:
- 스크린샷:
- 사용자 확인 방법:
- 확인하지 못한 점:
- 다음 제안:

## 인계 메모
