---
name: start-ticket
description: >-
  Use this skill when the user types "/start-ticket <ID>" or asks to start a ticket (e.g. "T-002 시작").
  It activates the ticket for the stop-gate hook, loads the ticket context, and writes a work plan into the ticket before any code change.
---

# 티켓 시작

인자: 티켓 ID(예: `T-002`). 파일은 `docs/tickets/<ID>-*.md`다.

## 단계

1. **선행 확인**: 티켓의 `## 선행`에 적힌 티켓 파일을 열어 `상태: 완료`인지 본다.
   - 아니면 사용자에게 알리고 멈춘다(이 경우 아무 파일도 바꾸지 않는다).
2. **활성화**: 아래 명령을 실행한다. Stop 훅이 이 값으로 범위를 검사한다.
   ```sh
   mkdir -p .harness && printf '%s' '<ID>' > .harness/active && git rev-parse HEAD > .harness/base && printf 0 > .harness/attempts-<ID>
   ```
3. **읽기**
   - `AGENTS.md`(자동으로 들어와 있다)
   - 티켓 전체
   - 티켓 `## 참고 문서`에 적힌 절(section)만 읽는다. 문서 전체를 읽지 않는다.
4. **계획 쓰기**: 티켓의 `## 작업 계획`에 다음을 적는다.
   - 단계 3~7개
   - 각 단계에서 바꿀 파일. 반드시 `## 소유 경로` 안이어야 한다.
   - 결과를 확인할 디버그 URL
   - 실행할 검증 명령
   - 앱인토스 API를 쓰는 티켓이면 쓸 함수 이름과 확인한 출처(`docs/research/platform-api.md` 또는 문서 MCP)
5. **진행 기록**: `## 진행 기록`의 "세션 시작" 줄에 모델 이름과 시각을 적고 `상태: 진행 중`으로 바꾼다.
6. **승인 요청**: `## 질문`에 `- [ ] 사용자: 계획을 확인하고 "진행"이라고 답해 주세요`를 추가하고 멈춘다.
   - 사용자가 처음부터 "계획 확인 생략"이라고 했다면 이 단계를 건너뛴다.
7. 사용자가 "진행"이라고 하면 그 질문을 `- [x]`로 바꾸고 계획대로 구현한다.
   - 단계를 하나 끝낼 때마다 `## 진행 기록`에 체크한다.

## 하지 말 것

- 계획에 없는 파일을 바꾸지 않는다. 필요해지면 `## 질문`에 `- [ ]`로 적고 멈춘다.
- 티켓 범위를 넓히지 않는다. 좋은 아이디어는 `## 결과 보고`의 "다음 제안"에 적는다.
