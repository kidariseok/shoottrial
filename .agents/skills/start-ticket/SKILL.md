---
name: start-ticket
description: >-
  Use this skill when the user types "/start-ticket <ID>" or asks to start or resume a ticket (e.g. "T-002 시작", "이어서 해줘").
  It syncs with GitHub, activates (or resumes) the ticket for the stop-gate hook, loads the ticket context, and writes a work plan before any code change.
---

# 티켓 시작·이어하기

인자: 티켓 ID(예: `T-002`). 파일은 `docs/tickets/<ID>-*.md`다. 공용 컴퓨터라서 앱이 재설치됐을 수 있다. **대화 기록이 아니라 티켓 파일이 기억이다.**

## 단계

1. **최신 상태 받기**
   ```sh
   git fetch origin
   git merge --ff-only "origin/$(git branch --show-current)" 2>/dev/null || true   # 다른 컴퓨터에서 이 브랜치에 저장한 것 따라잡기
   ```
   - **새로 시작할 때만**(이어하기가 아닐 때) main의 최신 문서·코드도 받는다: `git merge --no-edit origin/main`
     - 이어하기 중에는 main을 합치지 않는다. 다른 티켓의 변경이 섞이면 Stop 훅이 소유 경로 위반으로 본다.
   - 충돌하거나 실패하면 사용자에게 알리고 멈춘다(`docs/SETUP.md` §5).
   - `.harness/push-failed` 파일이 있으면 그 내용을 사용자에게 먼저 알린다.
2. **이어하기 판단**: 티켓 맨 위가 `상태: 진행 중`이고 `## 진행 기록`에 `기준 커밋:` 줄이 있으면 **이어하기**다. 아래를 실행한다.
   ```sh
   mkdir -p .harness && printf '%s' '<ID>' > .harness/active && printf '%s' '<기준 커밋 sha>' > .harness/base && printf 0 > .harness/attempts-<ID>
   ```
   - 그다음 `## 진행 기록`·`## 질문`·`## 인계 메모`를 읽고 남은 단계부터 계속한다.
   - 진행 기록에 `- 이어하기: (모델, 시각)` 한 줄을 추가한다.
   - **4~6단계는 건너뛴다.**
3. **선행 확인**(새로 시작할 때): 티켓의 `## 선행`에 적힌 티켓 파일을 열어 `상태: 완료`인지 본다.
   - 아니면 사용자에게 알리고 멈춘다. 이 경우 아무 파일도 바꾸지 않는다.
4. **활성화**(새로 시작할 때)
   ```sh
   mkdir -p .harness && printf '%s' '<ID>' > .harness/active && git rev-parse HEAD > .harness/base && printf 0 > .harness/attempts-<ID>
   ```
   - `## 진행 기록`에 `- 기준 커밋: <위 sha 앞 12자리>`와 `- 브랜치: <git branch --show-current 결과>`를 적는다. 재설치 후에도 Stop 훅이 범위를 계산하고, 사람이 브랜치를 찾는 데 쓴다.
   - 브랜치가 `main`이면 사용자에게 "Orca에서 이 티켓용 워크트리를 만들고 그 폴더에서 다시 시작하는 것을 권합니다"라고 한 번 알린다. 사용자가 그대로 하라고 하면 main에서 진행한다.
5. **읽기**
   - `AGENTS.md`(자동으로 들어와 있다)
   - 티켓 전체
   - 티켓 `## 참고 문서`에 적힌 절만 읽는다. 문서 전체를 읽지 않는다.
6. **계획 쓰기**: 티켓의 `## 작업 계획`에 다음을 적는다.
   - 단계 3~7개
   - 각 단계에서 바꿀 파일. 반드시 `## 소유 경로` 안이어야 한다.
   - 결과를 확인할 디버그 URL
   - 검증 명령
   - 플랫폼 API(Capacitor 플러그인·AdMob)를 쓰는 티켓이면 쓸 함수 이름과 확인한 출처(`docs/research/play-launch.md` 또는 공식 문서)
   - 그다음 `상태: 진행 중`으로 바꾸고, 진행 기록의 "세션 시작"에 모델과 시각을 적는다.
7. **승인 요청**: `## 질문`에 `- [ ] 사용자: 계획을 확인하고 "진행"이라고 답해 주세요`를 추가하고 멈춘다.
   - 사용자가 처음부터 "계획 확인 생략"이라고 했다면 건너뛴다.
8. 사용자가 "진행"이라고 하면 그 질문을 `- [x]`로 바꾸고 계획대로 구현한다.
   - **단계를 하나 끝낼 때마다 `## 진행 기록`에 체크하고 한 줄로 적는다.** 앱이 갑자기 지워져도 다음 세션이 이 기록만 보고 이어갈 수 있게 쓴다.

## 저장

- 저장은 훅이 자동으로 한다. 매 턴 끝 + 작업 중 5분마다 커밋하고 GitHub에 push한다.
- 큰 단계를 끝냈을 때 바로 저장하고 싶으면 `node scripts/harness/autosave.mjs`를 실행한다. `git push`는 직접 쓰지 않는다.

## 하지 말 것

- 계획에 없는 파일을 바꾸지 않는다. 필요해지면 `## 질문`에 `- [ ]`로 적고 멈춘다.
- 티켓 범위를 넓히지 않는다. 좋은 아이디어는 `## 결과 보고`의 "다음 제안"에 적는다.
