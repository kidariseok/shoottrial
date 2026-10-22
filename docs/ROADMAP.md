# ROADMAP v1.0

> 작성: 2026-10-20, Claude(기획). 이전 판(토스 미니앱)은 `docs/_archive/qrf-ROADMAP.md`.
> 단계마다 **게이트**를 통과해야 다음 단계 티켓이 열린다. 상세 티켓은 다음 단계 것만 미리 쓰고, 게이트 리뷰 때 Claude가 다음 묶음을 발행한다.
> 한 번에 다 만들지 않는다. **도형으로 재미를 확인(G1)하기 전에는 그림을 대량으로 만들지 않는다.**
>
> **2026-10-21 사용자 결정: G1 사람 플레이는 최종 완성 뒤로 미룬다.** M2는 자동 플레이 봇 게이트로 닫았고(`.planning/phases/03-econ/03-TUNING.md`), 그림은 지금부터 만든다(A-102, H-103). M3·M4를 이어서 진행하고 사용자는 완성본을 플레이한다. 그래서 위 "그림 대량 금지"는 해제한다. 완성 뒤 규칙이 크게 바뀌면 그림 일부를 다시 만들 수 있다는 위험을 받아들였다.

## 1. 단계와 게이트

| 단계 | 사용자가 확인하는 결과물 | 레인 | 게이트 |
|---|---|---|---|
| **M0 정리** | 새 기획 문서, 참고 자료 md, 하네스 보정, M1 티켓 | Claude | — (2026-10-20 완료) |
| **M1 기반** | 내 안드로이드 폰에서 세로 고정 빈 화면 + 뒤로가기 → 확인 모달 + 저장 유지. 브라우저에서 디버그 URL 동작 | B, C, D | **G0** |
| **M2 그레이박스 코어** | 도형으로 10웨이브 한 판: 배치·상점·합성·시너지·카드 5종·적 3종 + 보스·지뢰·2배속 | **A**(전투) + B(상점·HUD·결과 UI) | **G1 재미** |
| **M3 수직 슬라이스** | 실제 그림·소리, 도입 4컷, 데프콘 연출, 화학 웨이브 + 화학병, 화력 지원 버튼, 해금·저장 | A + B + D | **G2** |
| **M4 출시** | 보상형 광고 4곳, 분석 이벤트, 개인정보처리방침, 스토어 등록정보, 등급, **비공개 테스트 12명 × 14일** → 프로덕션 | B + 사용자 | **G3** |
| M5+ 업데이트 | 포병 3보직(FDC·탄약 운반병·포수), 전차, 드론 + 대공, 부대 마크, 유공 영구 강화, 스테이지 2·3, 무한 모드 + 리더보드, iOS | G3 때 발행 | — |

### 게이트 통과 조건

| 게이트 | 조건 | 실패하면 |
|---|---|---|
| **G0** | 실기기(사용자 안드로이드 폰)에서 ① 세로 고정 ② 풀스크린·Safe Area(`?safe=1` 캡처) ③ 뒤로가기 → 종료 확인 모달 ④ 저장한 값이 앱 재실행 후 유지 ⑤ 백그라운드 갔다 오면 소리 정지·재개 | 실패 항목만 수정 티켓 |
| **G1** | 사용자 10판 + **군 경험이 없는 지인 1명 3판**. "조합이 결과를 바꿨다"·"한 판 더"에 예. 판당 6~10분. 구매율 5% 미만 카드 없음. Claude가 diff 리뷰 | **그림 투입 금지.** 수치·규칙 튜닝 티켓만 |
| G2 | 실제 그림으로 한 판 완주. 외부 3명. 흑백 가독성 검사. Figma 대비 UI 리뷰 통과 | 아트·UI 수정 |
| G3 | 비공개 테스트 14일 완료(테스터 12명 이상 유지), 출시 체크리스트(R-101 결과) 100%, 크래시 0 | 수정 후 재검사 |

### 사용자 행정 트랙 (M1부터 병행)

1. 구글 플레이 **개인** 개발자 계정 만들기(U-101)
2. **테스터 12명 모집은 M2 중에 시작한다.** 14일 비공개 테스트가 출시 일정의 가장 긴 막대다.
3. 게임제작업·배급업 등록, 등급 절차는 R-101 결과를 따른다.
4. 개인정보처리방침 URL(GitHub Pages로 충분한지 R-101에서 확인)

## 2. 티켓 목록 (M1)

| ID | 제목 | 레인 | 모델 | 선행 |
|---|---|---|---|---|
| U-101 | 플레이 개인 계정 만들기 + 테스터 후보 명단 시작(M2 중에) | 사용자 | — | — |
| R-101 | 구글 플레이 출시 요건·정책·등급·행정·Capacitor 플러그인 확인표 | C | Flash High | — |
| R-102 | 한국군 고증·은어·짬 문화·대드론·화생방·포병 → 카드 데이터 후보 | C | Flash Medium | — |
| A-101 | 전투 목업 + 북한군 보병 시트 + 뒷모습 사격 + 계급장(G1 전까지) | D(사용자) | Gemini Argon 이미지 | — |
| H-101 | Vite + Phaser 4 스캐폴드, verify, 디버그 파라미터, 에셋 플레이스홀더·갤러리, `ui/screens.ts` 빈 시그니처 | B | **Argon High** | — |
| T-101 | Capacitor 안드로이드: 세로·Safe Area·뒤로가기 모달·저장·백그라운드 음소거 → 실기기 | B | Argon High | H-101, R-101, **T-102**(main.ts·debug.ts 충돌 방지), JDK 21·Android Studio |
| T-102 | 전투 UI(DOM): HUD·상점·카드 정보·배너·결과·부활·일시정지 + `?scene=ui` 데모 | B | Argon High | H-101 |
| H-102 | 에셋 정리·검사 스크립트(마젠타 제거·128 정렬·assets:check) | B | Argon High | H-101 |
| T-103 | UI 크기 보정: 긴 화면에서 상점 패널이 대기석을 가림 + #game 정렬 중복 | B | Argon High | T-102 |
| A-102 | 그림 만들기: 사용자 안내 + 프롬프트 묶음(약 42장, `art/inbox/<키>.png`) | D(사용자) | Gemini 이미지 | A-101 목업(Figma `37:2`) |
| H-103 | 에셋 받은편지함: AI 원본 자동 분리·자동 축소 | B | Argon High | H-102 |
| T-104 | HUD 화력 지원 버튼 + 데프콘 1 테두리 점멸(+ `lobby()` 빈 함수) | B | Argon High | T-103 |
| T-105 | 생활관(로비)·첫 실행(이름·고지)·브리핑 4컷 | B | Argon High | **T-104**(같은 파일) |
| P-101 | 실기기 확인 → G0 (**완료: 에뮬레이터 대체, `docs/reviews/G0.md`. 실기기는 M4 비공개 테스트로 이월**) | 사용자 | — | T-101 |

**M2 레인 A는 G0를 기다리지 않는다.** 브라우저만 쓰므로 H-101이 main에 병합되면 바로 시작한다. G0(실기기)·그림(A-101)·계정(U-101)은 M2와 병행하고, G1 전까지만 끝내면 된다.

**M2 미리보기**(G0 때 확정): Claude 레인 A의 GSD 단계 `M2-core`(판·차선·카드 5종·합성·시너지·웨이브 10), B의 T-102(상점·HUD·결과·카드 정보 UI), H-102(`assets-check` + 마젠타 정리 스크립트).

**동시에 해도 되는 것**: R-101·R-102·A-101·H-101은 소유 경로가 겹치지 않는다. 각각 다른 Orca 워크트리에서 동시에 돌린다. **같은 경로를 쓰는 티켓은 한 번에 하나만.**

## 3. 레인 (Orca 워크트리 = 브랜치 = 담당 하나)

| 레인 | 담당 | 소유 경로 | 시작 방법 |
|---|---|---|---|
| **A 코어 전투** | **Claude Code** | `src/rules.ts` `src/data.ts` `src/stages.ts` `src/battle/` `tests/rules*` `.planning/` | Claude Code에서 "M2-core 진행해줘" → GSD |
| **B 플랫폼·UI** | Antigravity Argon High | `index.html` `capacitor.config.ts` `package.json` `android/` `src/main.ts` `src/platform.ts` `src/save.ts` `src/audio.ts` `src/ads.ts` `src/assets.ts` `src/debug.ts` `src/ui/` `scripts/`(하네스 제외) `tests/`(rules 제외) `public/` | Antigravity 새 대화 → `/start-ticket H-101` |
| **C 조사** | Antigravity Flash | `docs/research/<주제>.md` 1개 | Antigravity 새 대화 → `/start-ticket R-101` |
| **D 아트** | 사용자 + Gemini Argon 이미지, Figma | `art/` Figma | A 티켓 체크리스트 |
| 기획·게이트 | Claude Code | `AGENTS.md` `docs/*.md` `docs/tickets/` `docs/reviews/` `docs/agents/` `scripts/harness/` `.agents/` | "G0 리뷰해줘" |

- **A·B 경계**는 `docs/TECH.md` §8의 `ui/screens.ts` 함수 시그니처뿐이다. A가 정하고 B가 따른다.
- 역할 카드: Antigravity는 `docs/agents/antigravity-build.md`(B), `docs/agents/antigravity-research.md`(C)를 읽는다.

## 4. 모델 고르기

| 상황 | 도구·모델 |
|---|---|
| 기획·설계·게이트 리뷰, 레인 A의 설계 판단 | Claude Code **Opus 5.5**(high) |
| 레인 A의 반복 구현·수치 튜닝 | Claude Code **Sonnet 5.5**(`/model`로 바꾼다) |
| 레인 B 구현 | Antigravity `gemini-4-argon-high` |
| 레인 C 조사, 오타·수치 이동 | Antigravity Flash(`-high` 또는 `-medium`) |
| 같은 문제로 2번 막힘(`/stuck` 이후) | Antigravity 안의 `claude-sonnet-5-5-high`(Claude Pro 사용량을 쓰지 않는다) |
| 설계 판단이 필요함 | 멈추고 티켓 `## 질문`에 적는다 → 사용자가 Claude Code로 가져온다 |

## 5. Claude Code 쪽 도구 사용 (ecc · gsd · ponytail)

| 도구 | 언제 | 무엇을 |
|---|---|---|
| **GSD** | 레인 A의 단계마다 | `.planning/`에 단계 계획. `gsd-plan-phase` → `gsd-execute-phase` → `gsd-verify-work`. 설정은 budget 프로필, 조사 에이전트 끔(토큰 절약). **`docs/ROADMAP.md`와 충돌하면 이 문서가 우선이다** |
| **ponytail** | 레인 A의 모든 코딩 | 가장 짧게 동작하는 코드. AGENTS.md 금지 목록 |
| **ecc:tdd-guide** | `rules.ts` | 순수 함수 테스트 먼저 |
| **ecc:architect** | 단계 시작 전 | 판·차선·합성 구조 검토 |
| **ecc:typescript-reviewer** | 게이트 때 | 레인 B PR 리뷰 |
| **ecc:browser-qa / e2e-runner** | 게이트 때 | 디버그 URL 스크린샷 확인 |
| **gsd-ui-review** | G2 | Figma 대비 화면 리뷰 |
| Firecrawl(Alexandria) | 조사 최종 종합 때만 1~2회 | 레인 C 결과의 빈칸 메우기 |

## 6. 사용자의 하루 루틴 (Orca 병렬)

0. **새 컴퓨터·재설치**: `docs/SETUP.md` §1~§3. 아니면 메인 폴더에서 `git pull`만 한다.
1. 이 문서 §2에서 선행이 끝난 티켓을 고른다. 레인이 다르면 여러 개를 동시에 고른다.
2. **Orca에서 티켓마다 워크트리를 하나씩 만든다**(브랜치 이름은 Orca가 정한다).
3. 워크트리마다 담당 도구를 연다.
   - 레인 B·C: Antigravity로 그 워크트리 폴더를 열고 **새 대화** → 모델 고르기 → `/start-ticket <ID>`
   - 레인 A: 그 워크트리에서 Claude Code → "M2-core 진행해줘"
4. 에이전트가 계획을 티켓에 쓰면 읽고 "진행"이라고 답한다.
5. 끝나면 `/finish-ticket`이 **PR**을 만든다. `docs/shots/<ID>.png`와 결과 보고를 확인하고 GitHub에서 PR을 병합한다. 다른 워크트리는 `git pull origin main`으로 받는다.
6. 이상하면 같은 대화에서 고쳐 달라고 하거나 `## 질문`에 적어 두었다가 게이트 때 Claude에게 가져온다.
7. 게이트 티켓(P-1xx)이 끝나면 Claude Code에서 "G0 리뷰해줘"라고 한다.
