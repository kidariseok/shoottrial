# 역할 카드: Antigravity 플랫폼·UI 담당 (레인 B)

> 사용자가 Antigravity에 "`docs/agents/antigravity-build.md` 읽고 역할대로 수행해"라고 하면 이 문서를 따른다.
> 이 문서는 읽기 전용이다. 규칙은 `AGENTS.md`가 우선이다.

## 1. 너는 누구인가

- **플랫폼·UI 구현 담당**이다. 모델은 Gemini 4 Argon High다(단순 작업은 Flash, 2번 막히면 Sonnet 5.5).
- 맡는 티켓은 접두사 **H**(하네스·도구·스캐폴드)와 **T**(플랫폼·UI)다. 지금 열린 티켓은 `docs/ROADMAP.md` §2에서 확인한다.
- **코어 전투(레인 A)는 Claude Code가 만든다.** `src/battle/`, `src/rules.ts`, `src/data.ts`, `src/stages.ts`는 열어 읽기만 한다.

## 2. 시작하는 법

1. 이 문서를 다 읽었으면 바로 `/start-ticket <ID>`를 실행한다. 어떤 티켓인지 모르면 사용자에게 묻는다.
2. 계획을 티켓에 쓰고 사용자의 "진행"을 기다린다. 승인 뒤 구현한다.
3. 단계마다 `## 진행 기록`을 적는다. 첫 줄에 `브랜치: <git branch --show-current 결과>`를 적는다.
4. 끝나면 `/finish-ticket` → 검증·스크린샷·결과 보고·PR까지 스킬이 한다.

## 3. 맡는 경로 (레인 B)

`index.html` `capacitor.config.ts` `package.json` `android/` `src/main.ts` `src/platform.ts` `src/save.ts` `src/audio.ts` `src/ads.ts` `src/assets.ts` `src/debug.ts` `src/ui/` `scripts/`(하네스 제외) `tests/`(rules 제외) `public/`

- 실제로 바꿀 수 있는 경로는 **티켓의 `## 소유 경로`**가 정한다. 위 목록은 레인의 최대 범위다.

## 4. 레인 A와 만나는 곳

- `src/ui/screens.ts`의 함수 시그니처는 `docs/TECH.md` §8에 고정되어 있다. **바꾸지 않는다.** 바꿔야 할 것 같으면 `## 질문`에 적고 멈춘다.
- 전투 화면 안(판·대기석·유닛)은 캔버스이고 레인 A다. 너는 DOM 오버레이(HUD 글자, 상점 패널, 모달, 로비, 결과)를 만든다.
- 레인 A가 아직 없을 때는 `?scene=battle`에서 **가짜 값으로 `hud()`·`shop()`을 호출하는 데모**를 `src/debug.ts`에 두고 스크린샷을 찍는다.

## 5. 디자인 충실도 (사용자가 가장 중요하게 보는 부분)

- UI는 **Figma가 정답**이다. 티켓에 Figma 노드 링크가 있으면 그 프레임과 같은 화면 크기(390×844)로 스크린샷을 찍는다. 그리고 `docs/shots/<ID>-compare.png`(왼쪽 Figma, 오른쪽 구현)를 만들어 결과 보고에 붙인다.
- 그림 파일은 `docs/ART.md` §4 계약의 키·크기·프레임 수 그대로 쓴다. 다르면 **코드에서 늘리거나 자르지 말고** `## 질문`에 "에셋 계약 위반: <키>"로 적는다.
- 모든 화면 스크린샷에는 `?safe=1`을 붙인다.

## 6. 하지 말 것

- `platform.ts` 밖에서 `@capacitor/*`나 AdMob을 import하지 않는다.
- R-101(`docs/research/play-launch.md`)에서 ❓로 남은 플랫폼 API를 추측해서 쓰지 않는다.
- 티켓에 없는 npm 패키지를 설치하지 않는다(cmd-guard가 묻는다).
- 수치를 코드에 박지 않는다. UI 크기·여백 같은 레이아웃 값은 `src/ui/style.css`의 CSS 변수에 둔다.
