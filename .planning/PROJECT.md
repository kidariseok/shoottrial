# 데프콘 2: 화스트 페이스 (가제)

> 이 `.planning/`은 **레인 A(Claude Code) 전용**이다. 레인 B·C·D·사용자 티켓은 `docs/tickets/`와 `docs/ROADMAP.md`에서 관리하며 여기서는 외부 의존성으로만 적는다.
> 문서 위계: `AGENTS.md` > `docs/GDD.md` > `docs/TECH.md` > `docs/ART.md` > `docs/ROADMAP.md`. 이 디렉터리의 산출물은 그 아래다. `docs/ROADMAP.md`와 충돌하면 `docs/ROADMAP.md`가 우선한다.

## What This Is

구글 플레이(Capacitor 안드로이드)용 **세로형 카드 디펜스**다. 자대 배치 첫날 데프콘 2가 발령되고 위병소가 뚫린다. 플레이어는 보직 카드(소총수·저격수·제설병·취사병·지뢰설치병)를 5열 차선에 배치하고, 같은 카드를 겹쳐 짬(계급)을 올리며 10개 웨이브를 막는다. 진지한 가상 전쟁극이고 피 표현은 없다.

지금 마일스톤(**M2 그레이박스 코어**)은 그림 없이 **도형만으로** 브라우저에서 10웨이브 한 판을 끝까지 할 수 있게 만드는 것이다. 레인 A가 전투 코어(`src/battle/`, `src/rules.ts`, `src/data.ts`, `src/stages.ts`, `tests/rules*`)를 맡는다.

## Core Value

**배치 조합이 결과를 바꾸고, 끝나면 "한 판 더"를 누르고 싶은 10웨이브 한 판.** 도형만으로도 이것이 성립해야 그림을 넣는다(G1 전 그림 대량 투입 금지).

## Current Milestone: M2 그레이박스 코어

**성공 기준 = 게이트 G1 통과**(`docs/ROADMAP.md` §1)
- 사용자 10판 + 군 경험이 없는 지인 1명 3판
- "조합이 결과를 바꿨다"와 "한 판 더"에 모두 "예"
- 판당 6~10분
- 구매율 5% 미만인 카드가 없음
- Claude가 diff 리뷰
- 실패하면 그림 투입 없이 수치·규칙 튜닝 티켓만 낸다

**실행 환경**: M2 동안은 브라우저(Vite + Phaser 4.2.1 + TypeScript, `npm run dev` + 디버그 URL). 안드로이드(Capacitor)는 레인 B의 일이다(M1 T-101, M4).

## Requirements

### Validated

(아직 없음. G1에서 검증)

### Active (M2, 레인 A)

- [ ] 판·차선·배치: `LAYOUT` 상수, 5×3 배치 구역, 5×2 지뢰 구역, 대기석 5칸, 드래그·보정·합성·판매
- [ ] `rules.ts` 순수 함수와 테스트: 합성, 시너지 집계, 이자, 웨이브 스케일, 시드 상점 추첨, 판매 환급
- [ ] 전투 루프: 준비 → 전투 → 정산 × 10웨이브, 데프콘 1 규칙(웨이브 7~), 2배속
- [ ] 카드 5종의 고유 메커니즘과 상병·병장 능력, 보직 시너지
- [ ] 지뢰 토큰·매설·폭발
- [ ] 적 3종 + 보스 장갑차, 스테이지 1 웨이브 표, 위병소 HP + 열마다 최후 저지선
- [ ] 경제(수입·이자·조기 출동·깃발 보너스), 상점 호출과 `ui/screens.ts` 연결(`bindBattle` 포함)
- [ ] 판 기록 `d2_playlog` + `?scene=log`, 튜닝 → G1 준비 완료

전체 목록과 ID는 `.planning/REQUIREMENTS.md`.

### Out of Scope (이 `.planning`에서)

- 레인 B 일(DOM 화면·HUD·상점 패널·모달, `platform.ts`·`save.ts`·`audio.ts`·`ads.ts`, Capacitor, 안드로이드): `docs/tickets/` H-·T- 티켓으로 관리
- 레인 C 조사(R-), 레인 D 아트(A-), 사용자 행정(U-)·플레이테스트(P-): `docs/ROADMAP.md`로 관리
- M3 수직 슬라이스(실제 그림·소리, 도입 4컷, 데프콘 연출, 화학병·화학탄 웨이브, 화력 지원): G1 통과 뒤 백로그
- M4 출시(보상형 광고 4곳, 분석 이벤트, 비공개 테스트): 백로그
- M5+(포병 3보직, 전차, 드론 + 대공, 부대 마크, 유공, 스테이지 2·3, 무한 모드, iOS, 인앱 결제): 백로그
- 롤토체스의 공유 풀·PvP·아이템: GDD §12에서 뺐다

## Context

- **피벗 이력**: 2026-10-20 v1.0에서 토스 미니앱 탑다운 슈터("출동! 5분대기조", 360×640)를 버렸다. 토스·앱인토스·`src/toss.ts`·360×640을 언급하는 자료는 낡은 것이다(`docs/_archive/`).
- **디스크 상태(2026-10-20)**: `src/battle/BattleScene.ts` 스텁(씬 키 `'battle'`)만 있다. `package.json`, `src/debug.ts`, `src/ui/screens.ts`는 H-101(레인 B)이 만든다. `art/LEDGER.json`은 비어 있다. `docs/research/play-launch.md`(R-101)는 아직 없다.
- **레인 경계**: A↔B의 유일한 접점은 `docs/TECH.md` §8의 `ui/screens.ts` 시그니처(`hud`, `shop`, `cardInfo`, `banner`, `result`, `askRevive`, `bindBattle`/`BattleCtl`)다. A가 정하고 B가 따른다. 시그니처를 바꾸려면 **기획 역할로** TECH §8을 먼저 고친다(B가 쓰기 전에).
- **캔버스 vs DOM**: 대기석·배치 구역·지뢰 토큰은 캔버스(A). HUD 버튼·모달·상점 패널은 DOM(B). 전투로 들어오는 입력은 `onBuy`·`onReroll`·`onGo`와 `bindBattle`의 `ctl`뿐이다.
- **디버그 파라미터 해석**은 H-101의 `src/debug.ts`(`debug` 객체, `rand()`)가 TECH §9 전체를 해석한다. 레인 A는 값을 읽어 효과만 구현한다(`?wave`, `?supply`, `?deck`, `?god`, `?speed`, `?scene=log`).
- **수치는 실험 가설**이다(GDD 머리말). G1 뒤 Claude가 GDD를 갱신한다.
- **도구**: GSD budget 프로필, 조사 에이전트 끔. `rules.ts`는 ecc:tdd-guide(테스트 먼저). 단계 시작 전 ecc:architect로 판·차선·합성 구조를 검토한다. 설계는 Opus 5.5, 반복 구현·튜닝은 Sonnet 5.5.

## Constraints

- **스택**: TypeScript + Vite + Phaser 4.2.1(버전 고정). 인터넷 예제는 대부분 Phaser 3이므로 낯선 API는 `node_modules/phaser/types`로 확인한다.
- **화면**: 세로 고정, 논리 720×1280(긴 화면은 최대 720×1560 배경), 칸 128×128, 5열, 좌우 여백 40px. 모든 UI는 Safe Area 안. 일시정지 버튼은 좌상단.
- **소유 경로**: `src/rules.ts`, `src/data.ts`, `src/stages.ts`, `src/battle/`, `tests/rules*`, `.planning/`. 레인 B 경로(`src/ui/`, `src/debug.ts`, `src/main.ts`, `src/save.ts`, `package.json`, `index.html` 등)는 읽고 import만 한다.
- **수치 위치**: 공격력·쿨타임·비용·웨이브 구성 등 모든 숫자는 `data.ts`·`stages.ts`에만 둔다.
- **테스트**: 순수 계산은 `rules.ts` + `tests/rules*.test.ts`(Vitest). 화면·물리는 디버그 URL + 스크린샷으로 증명한다.
- **검증**: `npm run verify`(typecheck → test → build)를 통과해야 한다. 실행하지 않은 검증은 했다고 쓰지 않는다.
- **의존성**: 새 npm 패키지 금지.
- **성능 예산**(M4 실측, 설계 때 참고): 저가 안드로이드에서 적 40 + 아군 15일 때 평균 55fps 이상. `ui.hud()`는 값이 바뀔 때만 부른다.
- **콘텐츠**: 피·시체 없음(쓰러짐 + 페이드, 파편). 레퍼런스 게임의 그림·이름·UI는 복제하지 않고 메커니즘만 쓴다.

## Key Decisions

<decisions>
<!-- AGENTS.md(문서 위계 1위)에서 온 잠긴 결정이다. 바꾸려면 사용자(또는 기획 역할의 Claude)가 AGENTS.md를 먼저 고친다. -->

- **[LOCKED] DEC-product-identity**: 구글 플레이(Capacitor 안드로이드)용 세로형 카드 디펜스. 보직 카드 5종, 5열 차선, 같은 카드 합성으로 짬(계급) 상승, 10웨이브. 진지한 가상 전쟁극이고 피 표현은 없다.
- **[LOCKED] DEC-doc-hierarchy**: AGENTS.md > GDD > TECH > ART > 티켓 > references. 충돌하면 고르지 말고 질문으로 남기고 멈춘다.
- **[LOCKED] DEC-ticket-worktree-flow**: 티켓 1개 = 대화 1개 = Orca 워크트리 1개. 자동 저장 훅이 현재 브랜치에 커밋·push한다. main에는 PR로만 들어간다. `git push`, `git reset --hard`, `rm -rf`는 직접 쓰지 않는다.
- **[LOCKED] DEC-owned-paths-only**: 소유 경로만 수정한다. 밖을 고쳐야 하면 이유를 질문으로 남기고 멈춘다.
- **[LOCKED] DEC-read-only-docs**: AGENTS.md, docs/GDD·TECH·ART·ROADMAP·SETUP, docs/references/, docs/agents/, docs/_archive/, .agents/, scripts/harness/는 기획(Claude)과 사용자만 고친다.
- **[LOCKED] DEC-dependency-allowlist**: 새 의존성 금지. 티켓의 허용 의존성만 설치한다.
- **[LOCKED] DEC-platform-api-verification**: 플랫폼 API(Capacitor, AdMob, 플레이 요건)는 R-101이나 공식 문서로 확인한 뒤에만 쓴다. Capacitor 플러그인은 `src/platform.ts`에서만 import한다.
- **[LOCKED] DEC-lane-a-protection**: `src/battle/`, `src/rules.ts`, `src/data.ts`, `src/stages.ts`는 Claude Code만 고친다. 레인 B는 TECH §8 시그니처를 바꾸지 않는다.
- **[LOCKED] DEC-verification-honesty**: 실행하지 않은 검증은 쓰지 않는다. `npm run verify` 결과와 스크린샷 경로를 붙인다. 같은 오류로 2번 막히면 `/stuck` 후 멈춘다.
- **[LOCKED] DEC-ponytail-code**: 가장 짧게 동작하는 코드. 금지 목록: React/Vue/상태관리 라이브러리, ECS·컴포넌트 클래스 계층, `*Manager`/`*Service` 클래스, 직접 만든 풀(Phaser Group 사용), 상태 머신 클래스(`phase` 변수 + `switch` 사용), 구현이 하나뿐인 인터페이스, "나중을 위한" 추상화. 수치는 `data.ts`·`stages.ts`에만. 순수 계산은 `rules.ts` + 테스트. 단순화는 `// ponytail: <한계>, <확장 조건>`. 주석·UI 문구는 한국어.
- **[LOCKED] DEC-content-policy**: 군 생활 디테일은 양념. 군 비하·가혹행위·폭언은 웃음 소재로 쓰지 않는다. 피·시체·고통 표현 없음. 한국군 제식 장비명은 쓰되 상표·실제 부대 마크는 쓰지 않는다. 적은 북한군으로 명시하되 실존 정치 지도자·국기 훼손·우상화·실제 견장 원본은 쓰지 않는다. 군사 정보는 공개 자료 수준만. 레퍼런스 게임은 메커니즘만 참고한다. 허구 고지와 생성형 AI 고지를 둔다.
- **[LOCKED] DEC-screen-rules**: 세로 고정, 논리 720×1280. 모든 UI는 Safe Area 안. 일시정지 좌상단. 안드로이드 뒤로가기는 확인 모달. 백그라운드·광고 중 소리 정지. 광고는 보상형만.
- **[LOCKED] DEC-debug-urls**: 새 기능마다 볼 수 있는 디버그 파라미터를 추가한다. 전체 목록은 TECH §9.
- **[LOCKED] DEC-roles**: 레인 A 코어 전투 = Claude Code(GSD). H·T = Antigravity, R = Antigravity Flash, A = 사용자 + 이미지 도구, U·P = 사용자, G(게이트 리뷰) = Claude Code.
</decisions>

| 결정 | 근거 | 결과 |
|------|------|------|
| M2 레인 A를 3단계(판·차선·배치 → 전투 → 경제·연결·측정)로 나눈다 | 단계마다 도형 + 디버그 URL로 브라우저에서 따로 시연할 수 있다 | — 진행 중 |
| 신병 소총수는 **매 판** 배치 구역 가운데 열 맨 아래에서 시작한다 | GDD §5.2(2026-10-20 확정) | ✓ 확정 |
| 계급 능력은 **누적**된다(병장 = 상병 능력 + 병장 능력) | GDD §5.3(2026-10-20 확정) | ✓ 확정 |
| M2 측정은 로컬 판 기록(`d2_playlog`, 최근 50판) + `?scene=log` | GDD §11(2026-10-20 확정). 분석 SDK는 M4 | ✓ 확정 |
| 일시정지·2배속·포기·광고 리롤·긴급 보급은 DOM(B)이 그리고 `BattleCtl`을 거쳐 A로 간다 | TECH §8 `bindBattle`(2026-10-20 추가) | ✓ 확정 |
| 프레임 수 = 이미지 너비 ÷ 그 키의 캔버스 너비 | ART §4(2026-10-20 수정) | ✓ 확정(레인 B 소관) |
| 720×1280은 잠긴 값으로 다룬다. A-101은 확인만 한다 | AGENTS.md(잠김) > GDD/TECH/ART의 "A-101에서 확정" | ✓ 확정 |

---
*Last updated: 2026-10-20 after new-project-from-ingest (gsd-roadmapper)*
