# Phase 3: 경제·연결·측정 — CONTEXT (기획 결정)

> 작성: 2026-10-21, Claude(기획 = 레인 A). 우선순위: AGENTS.md > docs/GDD.md > docs/TECH.md > 이 문서.
> 1·2단계 SUMMARY(특히 02-04, 02-05, 02-06)를 먼저 읽는다. T-102(레인 B 전투 UI)가 main에 병합되어 `src/ui/screens.ts`가 실제 DOM UI다.

## Phase Boundary

- **하는 것**: 보급 경제(정산 수입·이자·깃발·조기 출동), 상점(무료 새로 채우기·구매·리롤·해금 카드만), `ui/screens.ts` 연결(hud·shop·banner·cardInfo·result·askRevive·bindBattle), 일시정지·재개·포기·광고 보상 자리(광고 없이 바로 적용), 해금(웨이브 5 도달), 판 기록 `d2_playlog` + `?scene=log`, 수치 튜닝 → G1 준비.
- **안 하는 것**: 실제 광고(M4), 로비·이름 입력(M3, 레인 B), 그림·소리(M3), `save.ts`(T-101, 레인 B).
- 레인 B 파일(`src/ui/`, `main.ts`, `debug.ts`, `assets.ts`, `package.json`)은 고치지 않는다. **`src/ui/screens.ts`를 import해서 부르기만 한다.** 시그니처는 TECH §8 그대로.

## 확정한 열린 질문
- **OQ-4**: HP 0 → `askRevive`. 예: 위병소 HP 10 + 모든 열 최후 저지선 복구, 판당 1회(GDD §4.2·§10 `BATTLE`/`ECONOMY` 수치). 아니오 또는 두 번째 HP 0 → `result`. 광고는 M4에서 B가 연결(지금 T-102 버튼은 바로 onYes).
- **결과 화면 기록 표**: 두지 않는다. `?scene=log`만(GDD §11). `result()` 시그니처 그대로.
- **`?scene=log`**: main.ts가 battle 씬으로 시작한다(H-101 반영됨). `BattleScene.create()`에서 `debug.scene === 'log'`이면 판을 만들지 않고 기록 표만 캔버스(또는 텍스트)로 그린다.
- **해금 저장**: `save.ts`가 아직 없으므로 M2 동안 레인 A가 `localStorage` 키 `d2_unlocked`(문자열 배열 JSON)를 직접 읽고 쓴다. try/catch로 실패하면 기본 해금. `// ponytail: T-101의 save.ts가 생기면 save.unlocked로 옮긴다`. **신병 이름 입력은 M3(로비)로 미룬다** — META-01의 이름 연결은 M3로 이월(REQUIREMENTS 개정).

## Implementation Decisions

### 경제 (GDD §6, rules `income` 재사용)
- 정산 진입 때 `supply += income({supply, flag, early:false})`. 조기 출동 보너스는 `onGo` 시점에 즉시 +1.
- 상점: 준비 단계 시작마다 `rollShop(unlocked, rand)` 무료 5칸. 리롤 = 보급 1(`ECONOMY.reroll`). 산 칸은 빈 칸(`null`)이 된다. 무료 리롤(`ctl.adReroll`)은 판당 3회, 긴급 보급(`ctl.adSupply`) 판당 1회 보급 +5 — 횟수는 data.ts.
- 구매: 보급 ≥ 비용이면 차감하고 대기석 빈 칸에 넣는다. 대기석이 가득 차도 같은 카드 이등병이 대기석·배치 구역에 있어 **사는 즉시 합성**되면 허용(합성 연쇄 포함). 아니면 구매 거부 + `banner('대기석이 가득 찼습니다', 'info')`.
- 상점 난수는 `createRng(debug.seed + 2)` 별도 스트림(출현 재현성 유지).

### UI 연결 (TECH §8)
- 임시 캔버스 HUD 텍스트와 캔버스 "출동!" 버튼은 **제거**하고 `ui.hud`·`ui.shop`의 `onGo`로 대체.
- `hud(h)`: 매 프레임 객체를 만들되 **이전 값과 다를 때만 호출**(prepLeft는 올림 정수 초). `synergies`는 rules `synergies(...)` 결과.
- `shop(true, offers, supply, onBuy, onReroll, onGo)`: 준비 시작·구매·리롤·보급 변화 때. 전투·정산 진입 때 `shop(false, …)`.
- `banner`: 웨이브 1 준비 시작 "적 침투 — 병력을 배치하라"(info), 깃발 웨이브 전투 시작 "대규모 적 접근!"(flag), 웨이브 7 전투 시작 "데프콘 1 — 칵트 피스톨"(defcon). 문구는 data.ts.
- `cardInfo`: 카드를 **0.4초 이상 누르고 움직이지 않으면** `cardInfo(card, rank)`, 손을 떼면 `cardInfo(null)`. 드래그가 시작되면 열지 않는다. 시간은 data.ts.
- `bindBattle(ctl)`: create에서 바인드(전투 화면 전체 수명), 결과로 끝나면 `bindBattle(null)`.
  - `pause()`: `this.paused = true` → update 즉시 return, `tweens.pauseAll()`. `resume()`: 반대.
  - `setSpeed(s)`: 기존 `setSpeed`.
  - `quit()`: `finish(false)` 경로로 결과 화면.
  - `adReroll()`: 무료 리롤(남은 횟수 차감). `adSupply()`: 보급 +5(1회).
- `result(r, onAgain, onLobby)`: `onAgain` = `this.scene.restart()`. `onLobby` = 로비가 아직 없으므로 같은 재시작(`// ponytail: M3 로비 생기면 연결`).
- `?god` `?wave` `?supply` `?deck` `?unlock=all` `?speed` 기존 동작 유지.

### 해금 (GDD §7)
- 순서: `['rifle','blower','sniper']` 기본 → `cook` → `miner`(data.ts `UNLOCK_ORDER`). 웨이브 5 **도달**(웨이브 5 준비 단계 시작) 때 다음 잠긴 카드 1종 해금 → 저장 → 이번 판 결과의 `unlocked`. 이번 판 상점에도 그 다음 준비 단계부터 나온다.
- `?unlock=all`이면 전부 해금, 저장은 건드리지 않는다.

### 판 기록 (GDD §11)
- 이벤트: `run_start{run}`, `wave_clear{wave, base_hp, supply}`, `run_end{result, wave, sec}`, `card_buy{card, rank}`, `merge{card, rank}`, `unlock{card, via}`. 메모리 배열 → 판 끝에 `d2_playlog`(최근 50판, 판 단위 객체 `{t, result, wave, sec, events}`) 저장. sec = 실제 경과 초(일시정지 제외, 배속 무관한 벽시계).
- `?scene=log` 표: 판 수, 승률, 평균 판 시간(분:초), 평균 도달 웨이브, 카드별 구매 수·구매율(구매율 = 그 카드 구매 수 / 전체 구매 수), 최근 10판 목록. 구매율 5% 미만 카드는 붉은색이 아니라 **노랑**으로 표시(붉은색은 적 전용 규칙).
- 순수 집계 함수 `summarizeLog(runs)`는 rules.ts에 두고 테스트한다.

### 튜닝 (TUNE-01)
- 헤드리스 **자동 플레이 봇**(scratch 스크립트, 저장소에 넣지 않아도 됨)으로 시드 20개를 돌려 도달 웨이브·판 시간 분포를 본다. 봇 규칙: 준비 단계에 살 수 있는 가장 싼 카드부터 사서 배치 구역 아래 행부터 채우고, 합성 가능하면 합성, 지뢰는 앞 열부터 묻고 바로 출동.
- 목표: 봇 중앙값 웨이브 5~8 도달(처음 하는 사람이 5에 닿는 수준), 출동 시 실제 판 시간 6~10분(조기 출동 포함 추정). 크게 벗어날 때만 data.ts·stages.ts 수치 조정. 바꾼 수치·이유는 `03-TUNING.md`에 기록(GDD 갱신은 Claude가 게이트 때).

### 구조 (ponytail)
- 새 파일 후보: `src/battle/shop.ts`(상점 상태·구매·리롤), `src/battle/log.ts`(기록 수집·저장·log 화면). BattleScene은 연결만.
- `rules.ts` 추가: `buyOutcome(...)`(구매 가능/즉시 합성 판정), `summarizeLog(runs)`, `nextUnlock(unlocked)`. 테스트 먼저.
- 리터럴은 data.ts에만(기존 grep 유지). 문구도 data.ts `UI.text`.

## Canonical References
- docs/GDD.md §4, §4.2, §6, §7, §8, §10, §11
- docs/TECH.md §8, §9
- src/ui/screens.ts(실제 구현, 시그니처만 의존), src/ui/helpers.ts
- .planning/phases/02-battle/02-04-SUMMARY.md, 02-05-SUMMARY.md, 02-06-SUMMARY.md

## Deferred
- 실제 광고 연결·횟수 제한 UI(M4), 로비·신병 이름 입력(M3), save.ts 이전(T-101 뒤).
