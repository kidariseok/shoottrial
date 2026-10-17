---
name: stuck
description: >-
  Use this skill when the same error persists after two different attempts, when the stop-gate hook blocks three times,
  when the ticket conflicts with GDD/TECH, or when a change outside the owned paths seems necessary. It records a clean handoff and stops.
---

# 막혔을 때

같은 방법을 세 번째로 시도하지 않는다. 아래를 기록하고 멈춘다.

## 단계

1. 티켓 `## 질문`에 열린 항목을 추가한다.
   ```
   - [ ] 막힘: <증상 한 줄>
     - 시도 1: <무엇을 했고 결과는>
     - 시도 2: <무엇을 했고 결과는>
     - 추정 원인: <한 줄>
     - 필요한 결정: <사용자/기획이 정해야 할 것, 또는 "다른 모델로 재시도">
   ```
2. 티켓 `## 인계 메모`에 다음을 적는다.
   - 현재 상태: 무엇이 되고 무엇이 안 되는지
   - 재현 방법: 명령 또는 디버그 URL
   - 지금까지 바꾼 파일
   - 다음 담당 제안: 기본은 "Antigravity에서 `claude-sonnet-5-5-high`로 새 대화를 열고 `/start-ticket <ID>`". 설계 문제면 "게이트 때 Claude Code 검토"
3. 작업 내용은 되돌리지 않는다. 커밋도 하지 않는다. 다음 담당이 이어받는다.
4. 사용자에게 막힌 이유를 2줄로 알리고 멈춘다.
   - 열린 질문이 있으면 Stop 훅이 멈춤을 허용한다.
