# 출동! 5분대기조 (QRF)

토스 미니앱(앱인토스)용 가로형 픽셀아트 런앤건. 해킹으로 폭주한 도시 로봇을 상대로 육군 5분대기조 신병이 2분짜리 출동을 반복한다.

## 먼저 읽을 것

| 문서 | 내용 |
|---|---|
| `docs/ROADMAP.md` | 단계·게이트·티켓 순서·**하루 루틴(§5)** |
| `docs/GDD.md` | 게임 기획(세계관, 조작, 수치, 화면) |
| `docs/TECH.md` | 기술 구조, 플랫폼 확인 사실, 금지 목록 |
| `docs/ART.md` | 아트 바이블, AI 생성 파이프라인, 에셋 계약 |
| `AGENTS.md` | 에이전트 규칙(Antigravity가 자동으로 읽는다) |

## 작업 방식 요약

- 구현은 Antigravity가 **티켓 하나 = 새 대화 하나**로 한다.
  - 시작: `/start-ticket T-00X`
  - 끝: `/finish-ticket`
  - 막히면: `/stuck`
- `.agents/hooks.json`의 Stop 훅(`scripts/harness/stop-gate.mjs`)이 작업을 끝내기 전에 검사한다. 어기면 에이전트를 다시 일하게 돌려보낸다.
  - 티켓 소유 경로 밖의 변경
  - 허용 안 된 의존성
  - 진행 기록 누락
  - `npm run verify` 실패
- 게이트(G0~G4)마다 Claude Code에서 "G○ 리뷰해줘" → `docs/reviews/`에 리뷰가 생기고 다음 티켓이 발행된다.

## 하네스 단독 점검

```sh
# Stop 훅: 변경이 없으면 {"decision":"stop"}
echo '{"terminationReason":"NO_TOOL_CALL"}' | node scripts/harness/stop-gate.mjs
# 명령 가드: git push는 deny
echo '{"toolCall":{"name":"run_command","args":{"CommandLine":"git push"}}}' | node scripts/harness/cmd-guard.mjs
```
