# U-01 앱인토스 콘솔·Antigravity 준비

상태: 대기
담당: 사용자

## 목표

앱인토스 콘솔에 앱이 등록되어 `appName`이 정해지고, 내 폰 토스 앱에서 QR 테스트를 할 수 있는 조건이 갖춰진다. Antigravity가 이 프로젝트에서 하네스(훅·스킬)와 앱인토스 문서 MCP를 인식한다.

## 선행

- 없음

## 소유 경로

- `docs/tickets/U-01-console-setup.md`

## 허용 의존성

- 없음

## 참고 문서

- https://developers-apps-in-toss.toss.im/ai-vibe-coding (2. 플러그인, 4-1. 토스앱으로 테스트하기)
- `docs/ROADMAP.md` §5

## 할 일

1. **콘솔**: https://apps-in-toss.toss.im/ 에서 가입하고 워크스페이스를 만든 뒤 앱을 등록한다.
   - 카테고리: 게임
   - 앱 이름: "출동! 5분대기조"(가제)
   - `appName`: 영문 소문자·하이픈. 예: `qrf-squad`
2. **QR 테스트 조건 확인**: 토스 앱 로그인, 만 19세 이상, 워크스페이스 멤버.
3. **Antigravity 신뢰 폴더**: Antigravity에서 `~/qrf` 폴더를 열고 신뢰(trust)한다.
4. **공식 앱인토스 하네스 설치 시도**(터미널): `agy plugin install toss/apps-in-toss-harness`
   - 성공하면 `/ait:welcome`이 보이는지 확인한다.
   - 실패해도 괜찮다. 프로젝트의 `.agents/plugins/ait-docs/`가 문서 MCP를 따로 연결한다.
5. **CLI를 쓸 경우에만**: `~/.gemini/antigravity-cli/settings.json`의 `permissions.allow`에 아래 3개를 추가한다.
   - `"command(npm run verify)"`, `"command(git add)"`, `"command(git commit)"`
   - 백그라운드 실행 중 권한 대기가 60초를 넘으면 산출물이 사라진 전례가 있어서다. IDE(앱)에서 직접 승인한다면 생략해도 된다.
6. **연결 확인**: 아래 결과를 이 티켓에 기록한다.
   - Antigravity 새 대화에서 "앱인토스 문서에서 게임 리더보드 문서를 찾아줘"라고 요청해 MCP가 동작하는지
   - `/start-ticket`이 스킬 목록에 보이는지

## 검증 명령

- 없음(사용자 작업)

## 완료 조건

- [ ] `appName` 확정: ______
- [ ] QR 테스트 조건 충족
- [ ] 공식 하네스 설치: 성공 / 실패(메시지: ______)
- [ ] 문서 MCP 응답 확인
- [ ] `/start-ticket` 스킬이 보임

## 작업 계획

## 질문

## 진행 기록

- 세션 시작:

## 결과 보고

- 

## 인계 메모
