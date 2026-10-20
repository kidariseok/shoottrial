# SETUP: 설치·재설치 복구·이어하기

> 공용 컴퓨터에서 작업한다. 앱(Antigravity)이 지워졌거나 다른 컴퓨터로 옮겼다면 이 문서를 위에서부터 따라 한다.
> **작업 내용은 GitHub(`kidariseok/shoottrial`)에 자동으로 저장된다.** 컴퓨터에 남는 것은 없다고 생각하고 일한다.

## 0. 무엇이 어디에 남는가

| 남는 곳 | 무엇 | 재설치하면 |
|---|---|---|
| GitHub 저장소 | 코드, 문서, 티켓의 **진행 기록**, 스크린샷, 그림 | **그대로 남음** |
| 이 컴퓨터의 `.harness/` | 활성 티켓·기준 커밋·자동 저장 시각 | 사라짐 → `/start-ticket`이 티켓 파일에서 복원 |
| Antigravity 대화 기록 | 에이전트와 나눈 대화 | **사라짐** → 티켓 진행 기록으로 이어감 |
| Antigravity 설정 | 신뢰 폴더, 플러그인, 명령 허용 목록 | 사라짐 → 아래 §3 다시 하기 |
| GitHub 로그인 정보 | push 권한 | 사라짐(그래야 안전하다) → §2 다시 하기 |

## 1. 프로그램 확인

터미널(macOS는 `⌘ + Space` → "터미널")에서 확인한다.

```sh
node -v    # v22 이상이어야 한다. 없으면 https://nodejs.org 에서 LTS 설치
git --version
```

## 2. GitHub 인증 (공용 컴퓨터용 안전한 방법)

**비밀번호나 토큰을 컴퓨터에 영구 저장하지 않는다.**

1. GitHub → Settings → Developer settings → **Fine-grained personal access tokens** → Generate new token
   - Repository access: **Only select repositories → `shoottrial`**
   - Permissions: **Contents: Read and write**(나머지는 없음)
   - Expiration: 30일
   - 토큰은 내 폰 메모 등 안전한 곳에만 보관한다.
2. 터미널에서 로그인 정보를 **메모리에만 8시간** 기억하게 설정한다.
   ```sh
   git config --global credential.helper 'cache --timeout=28800'
   ```
   - macOS 키체인에 자동 저장되는 것을 막으려면 키체인 저장 창이 뜰 때 "거부"를 누른다.
3. 저장소를 받는다(처음 한 번, 또는 재설치 후).
   ```sh
   cd ~ && git clone https://github.com/kidariseok/shoottrial.git && cd shoottrial
   ```
   - 이미 폴더가 있으면 `cd ~/shoottrial && git pull`
4. push 권한을 확인한다. 아래 명령을 실행하고, 비밀번호를 물으면 **아이디 = GitHub 아이디, 비밀번호 = 토큰**을 넣는다.
   ```sh
   git push --dry-run origin main
   ```
   - "Everything up-to-date"가 나오면 성공이다.
   - **이 단계를 건너뛰면 자동 저장의 push가 실패한다.** 훅은 비밀번호를 물을 수 없기 때문이다.

## 3. Antigravity 준비

1. Antigravity를 열고 **`shoottrial` 폴더를 작업 폴더로 연다**(File → Open Folder). 신뢰(Trust)를 누른다.
   - **URL만 채팅에 붙여 넣으면 안 된다.** 폴더를 열어야 `AGENTS.md`·훅·스킬이 적용된다.
2. (조사 담당만) 네이버 검색 API 키를 환경변수 `NAVER_CLIENT_ID`·`NAVER_CLIENT_SECRET`로 넣는다. 키는 저장소에 쓰지 않는다.
3. 새 대화에서 `/start-ticket`이 스킬 목록에 보이는지 확인한다.
4. (CLI `agy`를 쓸 때만) `~/.gemini/antigravity-cli/settings.json`의 `permissions.allow`에 `"command(npm run verify)"`, `"command(node scripts/harness/autosave.mjs)"`를 추가한다.
5. 패키지 설치(H-001 이후): `npm install`

## 4. 이어서 하기

1. 진행 중이던 티켓과 브랜치를 찾는다. 티켓 진행 기록은 **그 티켓의 브랜치에** 있다(main에는 PR이 병합된 뒤에 들어간다).
   ```sh
   git fetch origin
   git branch -r                                   # 작업 브랜치 목록
   git log origin/<브랜치> -1 --format='%ci %s'     # 마지막 저장 시각
   ```
   - 티켓 ID로 찾으려면: `git grep -l "상태: 진행 중" $(git branch -r --format='%(refname:short)') -- docs/tickets/`
   - 없으면 `docs/ROADMAP.md` §2에서 다음 티켓을 고른다.
2. Orca에서 그 브랜치로 워크트리를 열거나(권장), 메인 폴더에서 `git switch <브랜치>`(origin/ 없이)를 한다.
3. 그 폴더를 Antigravity로 열고 **새 대화**에서 `/start-ticket <ID>`를 입력한다.
   - 이미 진행 중인 티켓이면 에이전트가 **이어하기 모드**로 진행 기록을 읽고 남은 단계부터 계속한다.
3. 전에 쓰던 모델과 같은 모델을 고른다(티켓 진행 기록의 "세션 시작" 줄에 적혀 있다).

## 5. 저장이 안 될 때 (push 실패)

`.harness/push-failed` 파일이 생기거나 에이전트가 "push 실패"를 알리면 아래를 확인한다.

| 원인 | 확인 | 해결 |
|---|---|---|
| 인증 만료(8시간 지남) | `git push --dry-run origin main`이 비밀번호를 묻는다 | §2-4를 다시 해서 토큰 입력 |
| 토큰 만료(30일) | 토큰을 넣어도 거부된다 | §2-1로 새 토큰 발급 |
| 원격이 앞섬(다른 컴퓨터에서 같은 브랜치로 작업함) | 메시지에 `rejected`, `fetch first` | `git pull --no-rebase origin <브랜치>` 후 `node scripts/harness/autosave.mjs` |
| 브랜치가 없음(detached HEAD) | `.harness/push-failed`에 detached HEAD | `git switch -c <새 브랜치>` 후 다시 저장 |
| 오프라인 | 인터넷 연결 | 연결 후 `node scripts/harness/autosave.mjs` |

- push가 실패해도 **이 컴퓨터에는 커밋이 남아 있다.** 해결하기 전에 앱을 지우지 않는다.

## 6. 작업을 끝낼 때 (컴퓨터를 떠나기 전, 꼭)

```sh
node scripts/harness/autosave.mjs      # "저장 완료 … push: ok" 또는 "up-to-date"가 나와야 한다
git status -sb                          # 첫 줄에 [ahead N]이 없어야 한다
git credential-cache exit               # 이 컴퓨터에서 로그인 정보 지우기
```

- 에이전트가 일하는 중이면 먼저 대화를 멈추게 한다. "지금까지 진행 기록에 적고 멈춰줘"라고 말한다.
- 마지막으로 GitHub 웹에서 최근 커밋 시각이 방금인지 확인하면 확실하다.
