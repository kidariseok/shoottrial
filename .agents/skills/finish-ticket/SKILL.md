---
name: finish-ticket
description: >-
  Use this skill when the user types "/finish-ticket" or when all completion criteria of the active ticket are met.
  It runs verification, captures a screenshot from the debug URL, fills the result report, and saves a final commit to GitHub.
---

# 티켓 마무리

활성 티켓 ID는 `.harness/active`에 있다.

## 단계

1. **완료 조건 점검**: 티켓 `## 완료 조건`을 하나씩 확인하고 체크한다.
   - 못 채운 항목이 있으면 마무리하지 않는다. 구현을 계속하거나 `/stuck`을 실행한다.
2. **검증**: 티켓 `## 검증 명령`을 모두 실행한다. 기본은 `npm run verify`다. 마지막 몇 줄을 `## 결과 보고`에 붙인다.
3. **스크린샷**
   - `npm run dev`를 백그라운드로 띄운다.
   - 티켓의 디버그 URL을 브라우저 도구로 연다. 뷰포트는 **세로 390×844**(폰 세로 비율)로 한다.
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
6. **완료 저장**(커밋 + push를 한 번에 한다)
   ```sh
   node scripts/harness/autosave.mjs -m "<ID>: <티켓 제목>"
   ```
   - 출력이 `push 실패`면 사용자에게 알리고 7단계를 건너뛴다(`docs/SETUP.md` §5). 로컬 커밋은 남아 있다.
7. **PR 만들기**(지금 브랜치가 `main`이 아닐 때만)
   ```sh
   gh pr create --base main --head "$(git branch --show-current)" --title "<ID>: <티켓 제목>" --body "티켓: docs/tickets/<파일명>
   스크린샷: docs/shots/<ID>.png
   검증: npm run verify 통과"
   ```
   - 이미 PR이 있으면 그대로 둔다(`gh pr view`로 주소만 확인).
   - `gh`가 없거나 로그인이 안 되어 실패하면, 아래 주소를 사용자에게 주고 "이 주소에서 Create pull request를 눌러 주세요"라고 안내한다.
     `https://github.com/kidariseok/shoottrial/compare/main...<브랜치>`
   - **병합(merge)은 하지 않는다.** 사용자가 GitHub에서 한다.
8. **비활성화**: 다음 티켓이 깨끗하게 시작하도록 기준점을 옮긴다.
   ```sh
   git rev-parse HEAD > .harness/base && : > .harness/active
   ```
9. 사용자에게 3줄 이내로 보고한다: 한 일, 확인 URL, PR 주소.
