---
name: finish-ticket
description: >-
  Use this skill when the user types "/finish-ticket" or when all completion criteria of the active ticket are met.
  It runs verification, captures a screenshot from the debug URL, fills the result report, and makes exactly one commit.
---

# 티켓 마무리

활성 티켓 ID는 `.harness/active`에 있다.

## 단계

1. **완료 조건 점검**: 티켓 `## 완료 조건`을 하나씩 확인하고 체크한다.
   - 못 채운 항목이 있으면 마무리하지 않는다. 구현을 계속하거나 `/stuck`을 실행한다.
2. **검증**: 티켓 `## 검증 명령`을 모두 실행한다. 기본은 `npm run verify`다. 마지막 몇 줄을 `## 결과 보고`에 붙인다.
3. **스크린샷**
   - `npm run dev`를 백그라운드로 띄운다.
   - 티켓에 적힌 디버그 URL을 브라우저 도구로 연다. 뷰포트는 가로 844×390(폰 가로 비율)으로 한다.
   - `docs/shots/<ID>.png`로 저장한다. 화면 티켓이면 `?safe=1`도 붙인다.
   - 브라우저 도구를 쓸 수 없으면 그 사실을 결과 보고에 적는다. 찍었다고 쓰지 않는다.
4. **결과 보고**: 티켓 `## 결과 보고`를 채운다.
   - 바뀐 파일
   - 검증 결과
   - 스크린샷 경로
   - 사용자가 직접 확인할 방법(디버그 URL)
   - 확인하지 못한 점
   - 다음 제안
5. **상태**: 티켓 맨 위 `상태:`를 `완료`로 바꾼다.
6. **커밋 1개**: 소유 경로·티켓 파일·스크린샷만 명시해서 add한다(`git add -A`, `git add .` 금지).
   ```sh
   git add <소유 경로들> docs/tickets/<티켓 파일> docs/shots/<ID>*.png
   git commit -m "<ID>: <티켓 제목>"
   ```
7. **비활성화**: 다음 티켓이 깨끗하게 시작하도록 기준점을 옮긴다.
   ```sh
   git rev-parse HEAD > .harness/base && : > .harness/active
   ```
8. 사용자에게 3줄 이내로 보고한다: 한 일, 확인 URL, 남은 점.

push는 하지 않는다.
