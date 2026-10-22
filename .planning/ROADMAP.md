> docs/ROADMAP.md와 충돌하면 docs/ROADMAP.md가 우선한다.

# Roadmap: 데프콘 2: 화스트 페이스 (가제) — 레인 A

## Overview

이 로드맵은 **레인 A(Claude Code)**의 GSD 단계만 다룬다. 마일스톤·게이트(M0~M5+, G0~G3)는 `docs/ROADMAP.md` §1 그대로이며 여기서 바꾸거나 순서를 뒤집지 않는다. 레인 B(H-·T-), C(R-), D(A-), 사용자(U-·P-) 티켓은 `docs/tickets/`에서 관리하고 여기서는 외부 의존성으로만 적는다.

지금 마일스톤은 **M2 그레이박스 코어**다. 그림 없이 도형만으로 브라우저에서 10웨이브 한 판을 끝까지 할 수 있게 만들고 G1(재미 검증)에 넘긴다. 3단계 모두 `npm run dev` + 디버그 URL로 브라우저에서 따로 시연할 수 있다.

1. **판·차선·배치**: 판을 그리고 카드를 끌어 놓고 합치고 판다. 순수 규칙 함수와 테스트를 먼저 깐다.
2. **전투**: 준비·전투·정산 루프로 카드 5종과 적 4종이 열 단위로 싸우고 웨이브 1~10이 돈다.
3. **경제·연결·측정**: 보급 경제와 상점을 `ui/screens.ts`로 연결하고, 판 기록을 남겨 수치를 튜닝한 뒤 G1에 넘긴다.

**마일스톤 성공 기준(G1)**: 사용자 10판 + 군 경험이 없는 지인 1명 3판. "조합이 결과를 바꿨다"·"한 판 더"에 예. 판당 6~10분. 구매율 5% 미만 카드 없음. Claude가 diff 리뷰. 실패하면 그림 투입 없이 수치·규칙 튜닝만 한다.

## Milestones

- [x] **M2 그레이박스 코어** — Phase 1~3 (완료, G1 사람 플레이는 2026-10-21 사용자 결정으로 최종 완성 뒤로 미룸)
- [ ] **M3 수직 슬라이스(레인 A)** — Phase 4~6 → 게이트 G2
- M4 출시 — 백로그(단계 없음) → G3
- M5+ 업데이트 — 백로그(G3 때 발행)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: 판·차선·배치** - 판을 도형으로 그리고 카드를 끌어 놓고·합치고·팔 수 있다. `rules.ts` 순수 함수와 테스트
- [ ] **Phase 2: 전투** - 준비·전투·정산 루프에서 카드 5종·적 4종이 열 단위로 싸우고 웨이브 1~10이 돈다
- [x] **Phase 3: 경제·연결·측정** - 보급 경제와 상점을 `ui/screens.ts`로 연결하고, 판 기록과 튜닝으로 G1 준비를 끝낸다
- [x] **Phase 4: 화학전** - 화학병 카드(6번째), 화학탄 포격(가스 칸·예고·제독), 강화 군견, 화학병 해금
- [x] **Phase 5: 화력 지원·데프콘 1** - 판당 2회 열 포격(`ctl.fireSupport`, `Hud.support`), 데프콘 1 진입 연출 호출
- [ ] **Phase 6: 그림 반영·저장 이전** - 실제 그림이 있으면 스프라이트·애니메이션, 없으면 지금 도형. 피격·쓰러짐·계급·그림자는 코드. 해금·기록을 `save.ts`로 옮김

## Phase Details

### Phase 1: 판·차선·배치
**Goal**: 사용자가 브라우저에서 도형으로 된 판 위에 카드를 끌어 놓고, 같은 카드를 겹쳐 진급시키고, 팔 수 있다. 이 모든 수치·계산은 `data.ts`와 테스트된 `rules.ts`에서 온다.
**Depends on**: 없음(첫 단계). **외부 선행: H-101(레인 B 스캐폴드: `package.json`·`npm run verify`·`src/debug.ts`·`src/ui/screens.ts` 빈 시그니처)이 main에 머지되어 있어야 한다.** M2 공식 시작은 `docs/ROADMAP.md`상 G0 통과 뒤다.
**Requirements**: BOARD-01, BOARD-02, BOARD-03, BOARD-04, BOARD-05, RULE-01, RULE-02, RULE-03, RULE-04, RULE-05, RULE-06, RULE-07, DBG-01
**Debug URL**: `/?scene=battle&deck=rifle:4,sniper:2&supply=99`
**Success Criteria** (what must be TRUE):
  1. 디버그 URL을 열면 720×1280 판에 적 진입 2행, 지뢰 구역 5×2, 배치 구역 5×3, 위병소 방어선, 대기석 5칸이 도형으로 보이고, 가운데 열 맨 아래에 신병 소총수(이등병)가 있다. `deck=rifle:4,sniper:2`의 카드는 대기석 5칸을 앞부터 채우고(소총수 4, 저격수 1), 넘친 저격수 1장은 배치 구역 맨 아래 행의 빈 칸(왼쪽부터)에 놓인다.
  2. 대기석 카드를 배치 구역으로 끌면 놓을 수 있는 칸이 강조되고, 판 밖에 놓으면 가장 가까운 빈 칸으로 보정되며, 빈 칸이 없으면 원위치로 돌아간다.
  3. 소총수 이등병 2장을 겹치면 일병 1장이 되고(계급 표시 반짝 → "진급!"), 일병 2장을 다시 겹치면 상병이 된다. 계급이 다른 카드끼리는 합쳐지지 않는다.
  4. 카드를 팔면 사라지고 보급이 비용만큼(합성 카드는 재료 합) 돌아온다.
  5. `npm run verify`가 통과하고, `tests/rules*.test.ts`가 합성·시너지 집계(합치면 인원이 줄어 꺼지는 경우 포함)·이자·웨이브 스케일·시드 상점 추첨·판매 환급을 검사한다.
**Plans**: 3/3 완료 (01-01 수치·규칙 TDD, 01-02 판·신병·덱, 01-03 드래그·합성·판매) — 사람 확인 대기
**UI hint**: yes
**Discuss/plan 때 정할 것**: 판매 제스처를 어디에 둘지(상점 패널은 DOM이라 캔버스 드래그로 닿지 않는다), 대기석 띠 높이 120px과 128px 카드의 관계(OQ-5), `LAYOUT`·`SPRITE_SCALE`을 레인 B가 언제 import하는지(OQ-10).

### Phase 2: 전투
**Goal**: 사용자가 브라우저에서 준비 → 전투 → 정산을 10웨이브 반복하며, 카드마다 다른 역할(관통·밀어내기·회복·지뢰)이 적 종류별 위협(종대·군견·RPG·보스)을 막는 것을 도형으로 본다.
**Depends on**: Phase 1
**Requirements**: LOOP-01, LOOP-02, LOOP-03, LOOP-04, LOOP-05, LANE-01, CARD-01, CARD-02, CARD-03, CARD-04, CARD-05, CARD-06, CARD-07, MINE-01, MINE-02, ENEMY-01, ENEMY-02, ENEMY-03, ENEMY-04, WAVE-01, BASE-01, BASE-02, FX-01, DBG-02
**Debug URL**: `/?scene=battle&wave=5&god=1&seed=42` (+ `&deck=…&speed=2`)
**Success Criteria** (what must be TRUE):
  1. 같은 `?seed=42`로 두 번 열면 적이 같은 열·같은 순서로 나온다. 적은 자기 열에서만 걷고 가장 앞의 아군 앞에서 멈춰 싸우며, 아군은 자기 열의 가장 가까운 적만 쏜다.
  2. 웨이브 6의 종대는 저격수 관통으로 한 번에 깎이고, 군견은 배치 구역에서 옆 열로 한 번 옮기며 제설병에게 밀려나고(상병이면 화상), RPG병은 3칸 밖에서 멈춰 쏘고 취사병이 그 피해를 회복하며, 웨이브 5 보스는 등장 때 같은 열 아군을 기절시키고 묻어 둔 (대전차) 지뢰에 크게 깎인다.
  3. 준비 단계에 받은 지뢰 토큰을 지뢰 구역에 묻을 수 있고(반투명), 전투가 시작되면 남은 토큰이 사라지며, 전투 중에는 대기석 카드 투입만 되고 이동·판매·매설은 막힌다.
  4. 적이 방어선에 닿으면 열마다 처음 한 번은 최후 저지선이 그 열을 쓸어내고(표시가 남음) 이후에는 위병소 HP가 깎인다. `?god=1`이면 깎이지 않는다. HP 0이면 패배, 웨이브 10을 넘기면 승리로 끝난다.
  5. 웨이브 7부터 데프콘 1 규칙(아군 간격 ×0.8, 출현 간격 ×0.7)이 적용되고, `?speed=2`이면 전투·타이머가 두 배로 흐른다. 웨이브가 끝나면 쓰러진 아군이 제자리에서 다시 일어난다.
**Plans**: 6/6 완료 (02-01 적·웨이브 규칙, 02-02 카드·지뢰 계산, 02-03 판 확장·아군 상태, 02-04 루프·적 4종·위병소, 02-05 카드 능력·시너지, 02-06 지뢰·종합 확인) — 성공 기준 1~5 헤드리스 PASS, 사람 확인 대기
Plans:
- [ ] 02-01-PLAN.md — 전투 수치(data.ts·stages.ts)와 spawnPlan·열 판정·데프콘·드래그 허용 규칙 (TDD)
- [ ] 02-02-PLAN.md — 카드 능력·시너지·지뢰·군견 열 변경 계산 함수 (TDD)
- [ ] 02-03-PLAN.md — board 논리 좌표·단계별 드래그 잠금, 아군 전투 상태(units.ts), 공통 연출(fx.ts)
- [ ] 02-04-PLAN.md — 준비/전투/정산 루프, 적 4종 이동·막힘·특수 행동, 위병소 HP·최후 저지선, 승패·HUD·속도
- [ ] 02-05-PLAN.md — 카드 5종 행동·상병/병장 능력·시너지·데프콘 1 간격·연출
- [ ] 02-06-PLAN.md — 지뢰 토큰·매설·폭발, 성공 기준 1~5 종합 헤드리스 확인
**Discuss/plan 때 정할 것**: 보스에도 웨이브 HP 스케일을 적용하는지(OQ-3: W5 1776, W10 2496), 지뢰설치병 병장 토큰 수가 4 + 2 = 6인지(GDD §5.3 누적 규칙에 따른 해석) 확인.

### Phase 3: 경제·연결·측정
**Goal**: 사용자가 상점에서 카드를 사고·리롤하고·조기 출동하며 보급을 굴려 10웨이브 한 판을 끝까지 하고, 판 기록으로 카드별 구매율과 판당 시간을 확인할 수 있다. 그 상태로 G1 플레이테스트에 넘긴다.
**Depends on**: Phase 2. **외부 의존: T-102(레인 B 상점·HUD·결과·카드 정보 DOM UI).** T-102 전에는 H-101 빈 함수로 연결과 판 진행을 증명하고, G1 넘기기(TUNE-01)는 T-102 머지 뒤에 한다.
**Requirements**: ECON-01, ECON-02, UI-01, UI-02, META-01, LOG-01, LOG-02, TUNE-01
**Debug URL**: `/?scene=battle&seed=42` (+ `&supply=99&unlock=all`), `/?scene=log`
**Success Criteria** (what must be TRUE):
  1. 준비 단계마다 상점 5칸이 무료로 새로 채워지고, 구매하면 보급이 차감되며 카드가 대기석에 들어오고(가득 차도 즉시 합성되면 허용), 리롤은 보급 1, "출동!"은 바로 전투 + 보급 +1이다. 정산 때 기본 5 + 이자(5당 +1, 최대 +2) + 깃발 +3이 더해진다.
  2. `ui/screens.ts` 빈 함수 상태에서도 판이 멈추지 않고 끝까지 진행되며, T-102가 머지되면 HUD(웨이브·데프콘·보급·HP·시너지·속도)가 값이 바뀔 때만 갱신되고 깃발 배너·결과 화면·부활 제안·카드 정보가 뜬다. 일시정지·재개·2배속·포기·광고 리롤·긴급 보급이 `bindBattle`의 `ctl`로 동작한다.
  3. 웨이브 5에 도달하면 다음 카드가 해금되어 결과에 표시되고, 이후 상점에 그 카드가 나온다.
  4. 몇 판 하고 `?scene=log`를 열면 `d2_playlog`(최근 50판)의 카드별 구매율, 평균 판 시간, 판별 결과·도달 웨이브가 보인다.
  5. 튜닝을 마친 상태에서 사용자가 브라우저로 한 판을 6~10분 안에 끝내고, 처음 하는 사람이 웨이브 5에 도달할 수 있으며, 헤드리스 봇으로 끝까지 가는 판(`god=1`) 중앙값이 6~10분, 초행 봇 20시드 중앙값 도달 웨이브가 5 이상이다. **구매율 5% 미만 카드 없음은 G1에서 사람이 한 판 기록(`?scene=log`)으로 판정한다**(봇 구매율은 봇 규칙을 반영할 뿐이라 판정에 쓰지 않는다) → G1 플레이테스트(P 티켓) 준비 완료.
**Plans**: 6/6 완료 (03-01 순수 규칙 TDD, 03-02 상점·경제, 03-03 HUD·배너·카드 정보·bindBattle, 03-04 부활·결과·해금, 03-05 판 기록·?scene=log, 03-06 튜닝·종합 확인) — 제설병 1회 밀림 규칙 추가, 초행자 게이트 통과, 판 시간 10.5분 추정(G1 사람 확인)
Plans:
- [x] 03-01-PLAN.md — buyOutcome·nextUnlock·parseUnlocked·summarizeLog·pushRun·parsePlayLog 순수 계산과 UNLOCK/REWARD/LOG 수치 (TDD)
- [x] 03-02-PLAN.md — 상점 5칸·구매(가득 찬 대기석 즉시 합성 허용)·리롤·출동! +1·정산 수입을 ui.shop으로 연결, 임시 출동! 버튼 제거
- [x] 03-03-PLAN.md — ui.hud(값이 바뀔 때만)·banner·cardInfo(길게 누르기)·bindBattle(pause/resume/setSpeed/quit/adReroll/adSupply)
- [x] 03-04-PLAN.md — 웨이브 5 해금·저장, askRevive(판당 1회), ui.result, 재시작 안전한 create
- [x] 03-05-PLAN.md — d2_playlog 이벤트 수집·저장(50판), ?scene=log 기록 화면
- [x] 03-06-PLAN.md — 자동 플레이 봇 튜닝(TUNE-01), 03-TUNING.md, 실시간 종합 한 판, 성공 기준 5 사람 확인
**UI hint**: yes
**Discuss/plan 때 정할 것**: M2에서 HP 0일 때 `askRevive`를 부를지 바로 결과로 갈지(OQ-4. 광고는 M4), 결과 화면의 접힌 "기록" 표를 위해 TECH §8 `result()`에 필드를 추가할지(필요하면 **기획 역할로** T-102 전에 §8 개정), `?scene=log`를 띄우려면 `main.ts`(레인 B)의 씬 등록이 필요한지(아니면 `BattleScene` 안에서 처리), 해금 저장(`save.ts`, 레인 B)을 누가 쓰는지.

## Backlog (단계 없음)

G1 통과 뒤 게이트 리뷰에서 `docs/ROADMAP.md`에 따라 마일스톤을 열고 그때 단계를 만든다.

- **M3 수직 슬라이스** → G2: 실제 그림·소리, 도입 4컷, 데프콘 연출, 화학탄 웨이브 + 화학병, 강화 군견, 화력 지원 버튼, 해금·저장. 레인 A 몫: CHEM-01, ENEMY-05, FIRE-01, FX-02(REQUIREMENTS.md v2).
- **M4 출시** → G3: 보상형 광고 4곳, 분석 이벤트, 개인정보처리방침, 스토어 등록정보, 등급, 비공개 테스트 12명 × 14일 → 프로덕션. 레인 A 몫: REVIVE-01, ADLIM-01, ANLY-01.
- **M5+**: 포병 3보직, 전차, 드론 + 대공, 부대 마크, 유공 영구 강화, 스테이지 2·3, 무한 모드 + 리더보드, iOS.

## External Dependencies (다른 레인, `docs/tickets/`)

| 티켓 | 레인 | 이 로드맵에 미치는 영향 |
|------|------|------------------------|
| H-101 스캐폴드 | B | **Phase 1 시작 전 머지 필수.** `npm run verify`, `debug`·`rand()`, `ui/screens.ts` 빈 시그니처 |
| G0 게이트(T-101, P-101) | B·사용자 | `docs/ROADMAP.md`상 M2 티켓은 G0 통과 뒤 열린다 |
| T-102 상점·HUD·결과·카드 정보 UI | B | Phase 3 화면 연결 확인과 TUNE-01(G1 넘기기)의 선행 |
| H-102 assets-check·마젠타 정리 | B | 영향 없음(도형만 쓴다) |
| P 티켓(G1 플레이테스트) | 사용자 | Phase 3 완료 뒤. 결과로 G1 판정 |
| U-101 테스터 모집 | 사용자 | M2 중에 시작(출시 일정의 가장 긴 막대). 이 로드맵의 선행은 아님 |

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 판·차선·배치 | 0/TBD | Not started | - |
| 2. 전투 | 0/TBD | Not started | - |
| 3. 경제·연결·측정 | 0/TBD | Not started | - |

### Phase 4: 화학전
**Goal**: 웨이브 7·9·10에 화학탄이 떨어져 배치 구역 2×2가 가스 칸이 되고, 해금된 화학병이 제독·면역으로 그걸 막는다. 웨이브 9·10 군견 절반이 강화 군견이다.
**Depends on**: Phase 3. 외부 의존 없음(UI는 이미 `chem` 이름·머리글자를 안다).
**Requirements**: CHEM-01, CHEM-02, CHEM-03, CHEM-04, CHEM-05, DOG-01
**Debug URL**: `/?scene=battle&wave=7&unlock=all&deck=chem:2,rifle:4&supply=99&seed=42`, `?gas=1`(웨이브 1에서 바로 가스 1회)
**Success Criteria**:
  1. `data.ts`에 화학병 카드·가스·강화 군견 수치, `stages.ts`의 `WaveDef`에 `gas`·`dogPlus`가 있고 GDD §5.2·§5.3·§5.4·§5.6과 1:1이다. 순수 함수(가스 위치 추첨·가스 일정·제독 범위·면역 판정)는 테스트로 증명한다.
  2. 화학탄 1.5초 전 붉은 예고 → 2×2 가스 칸(20초). 가스 칸 아군은 공격 간격 ×2, 초당 5 피해. 화학병 범위 안 아군은 면역이고 화학병이 3초마다 범위 안 가스를 지운다. 시너지 2명이면 떨어지는 즉시 지운다. 상병 범위 2칸, 병장 인접 피해 ×1.15.
  3. 강화 군견(HP 80, 밀림 ×1.0)이 웨이브 9·10에 나온다. 해금 순서 끝에 화학병이 붙는다.
  4. 튜닝 봇 게이트를 다시 돌려 초행자 중앙값 웨이브 5 이상을 유지하고, god 봇이 화학병 없이도 웨이브 10을 끝낼 수 있음을 기록한다.
**Plans**: 3 plans (순차: 04-01 → 04-02 → 04-03, 브랜치 kidariseok/m3-core에서 바로)
Plans:
- [x] 04-01-PLAN.md — 화학병·GAS·강화 군견 수치, WaveDef.gas·dogPlus, spawnPlan 강화 군견, 해금 순서, 가스 순수 함수(gasPlan·inChemReach·gasCellsAfterDrop·cleanseCells·chemDamageMult·interval 감속) (TDD)
- [x] 04-02-PLAN.md — 전투 연결(gas.ts 예고·가스 칸·감속·피해·면역·제독·시너지·병장 버프·정리, 화학병 사격, 강화 군견 열 옮김·테두리, `?gas=1`, gas_drop·gas_clear) + 헤드리스 확인·스크린샷 M3-04
- [x] 04-03-PLAN.md — 튜닝 봇 gate 재측정 → 04-TUNING.md(초행자 중앙값 < 5 또는 god 미완주면 멈추고 보고), 단계 전체 게이트

### Phase 5: 화력 지원·데프콘 1
**Goal**: 전투 중 HUD 버튼으로 열을 골라 포격하고(판당 2회), 웨이브 7 진입 때 데프콘 1 연출이 확실히 보인다.
**Depends on**: Phase 4, **외부: T-104(HUD 화력 지원 버튼·`Hud.support`·`BattleCtl.fireSupport`·데프콘 1 테두리 점멸)가 main에 머지되어야 한다.**
**Requirements**: FIRE-01, FIRE-02, DEF-01
**Plans**: 1 plan (Claude 직접 작성, CONTEXT 겸용)
- [x] 05-01-PLAN.md — SUPPORT 수치·colAt·supportAvg(TDD), 열 고르기·포격·입력 잠금·?support=N, 데프콘 1 흔들림, 헤드리스 F1~F6
**Debug URL**: `/?scene=battle&wave=7&deck=rifle:4&seed=42`

### Phase 6: 그림 반영·저장 이전
**Goal**: `public/assets/<키>.png`가 있으면 아군·적·보스·이펙트·지뢰·배경이 그림으로 보이고, 없으면 지금 도형 그대로다. 해금·판 기록·이름이 `save.ts`(Capacitor Preferences)에 저장된다.
**Depends on**: Phase 5, 외부: H-103(받은편지함 도구)과 A-102 그림 일부. 그림이 없어도 fixture로 진행한다.
**Requirements**: SPR-01, SPR-02, SAVE-01

