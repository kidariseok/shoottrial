---
phase: 03-econ
plan: 02
subsystem: battle
tags: [shop, econ, battle-scene, board, ui-wiring, tdd]
requires: [03-01]
provides:
  - "src/battle/shop.ts: Shop, createShop, refill, toOffers, buyCard, useAdReroll, useAdSupply, BuyResult"
  - "board.ts: units, benchFree, promote, move, onMerge 옵션, BoardUnit 타입 (합성 연출은 promoteTo 하나로 공유)"
  - "BattleScene: store/unlocked, syncShop, buy, reroll, go, 정산 수입, ui.shop 연결"
affects: [03-03, 03-04, 03-05, 03-06]
tech-stack:
  added: []
  patterns: ["값이 바뀔 때만 ui.shop 호출(키 문자열 비교)", "가짜 board(Pick<Board,...>)로 구매 로직 테스트"]
key-files:
  created: [src/battle/shop.ts, tests/rules-shop.test.ts, docs/shots/M2-03-02.png, docs/shots/M2-03-02-canvas.png]
  modified: [src/battle/board.ts, src/battle/BattleScene.ts, src/data.ts]
key-decisions:
  - "구매 합성과 드래그 합성은 board.ts의 promoteTo 한 곳을 지난다(진급 연출·팝업·onMerge 공유)"
  - "상점 난수는 createShop(debug.seed + 2) 별도 스트림. 광고 횟수는 Shop 안에 두고 REWARD에서 읽는다"
requirements-completed: [ECON-01, ECON-02]
duration: ~35min
completed: 2026-10-21
---

# Phase 3 Plan 02: 상점·구매·리롤·정산 수입·조기 출동 Summary

준비 단계마다 무료로 새로 채워지는 상점 5칸, 구매(가득 찬 대기석에서도 즉시 합성되면 허용), 리롤 1, 정산 수입(5 + 이자 + 깃발 3), 조기 출동 +1을 BattleScene에 올려 `ui.shop()` DOM 패널에 연결했고, 캔버스 임시 출동! 버튼을 없앴다.

기준 커밋(첫 커밋 직전 HEAD): `00b0d09`

## 수행한 작업

| Task | 이름 | 커밋 | 파일 |
|---|---|---|---|
| 1 | board.ts 구매용 API + shop.ts + 테스트 | 5099435 | src/battle/board.ts, src/battle/shop.ts, tests/rules-shop.test.ts |
| 2 | BattleScene 상점 연결·구매·리롤·출동!·정산 수입, 임시 출동! 제거 | 728b365 | src/battle/BattleScene.ts, src/data.ts |
| 3 | 헤드리스 확인 + 스크린샷 | (이 SUMMARY와 함께) | docs/shots/M2-03-02.png, docs/shots/M2-03-02-canvas.png |

## TDD 증거 (Task 1)

- RED: shop.ts 없이 `npx vitest run tests/rules-shop.test.ts` -> `Test Files 1 failed`, `Tests no tests`, 종료 코드 1(`!`를 붙이면 0). RED 상태를 따로 커밋하지는 않았다(03-01과 같은 방식, 실행으로만 확인).
- 테스트 작성 중 1건을 스스로 고쳤다: "합성 불가" 케이스에 이등병 저격수가 있어 실제로는 합성이 되는 입력이었다. 입력을 바꿨다(코드 변경 아님).
- GREEN: `tests/rules-shop.test.ts` 12 passed. 전체 147 passed.

## 최종 검증 (`npm run verify`)

종료 코드 0. 꼬리:

```
 Test Files  10 passed (10)
      Tests  147 passed (147)
✓ built in 1.73s
```
(빌드의 청크 500kB 경고는 기존 것이다.)

## 수용 기준 grep (기준 00b0d09 대비)

| 검사 | 기대 | 결과 |
|---|---|---|
| shop.ts `^export (function\|type)` | 8 이상 | 8 |
| board.ts `(units\|benchFree\|promote\|move)\b` | 8 이상 | 16 |
| board.ts `promoteTo` / `onMerge` | 3 이상 / 3 이상 | 3 / 3 |
| shop.ts 숫자 리터럴 검사 | 0 | 0 |
| shop.ts·board.ts 한글/class/Manager/Service/ui import(런타임) 검사 | 0 | 0 |
| BattleScene `goBtn` | 0 | 0 |
| `UI.go\|colors.go\|text.go` (src/battle, data.ts) | 합 0 | 0 |
| `ui.shop(` / `(refill\|buyCard\|toOffers\|createShop)(` | 1 / 4 이상 | 1 / 5 |
| `income(` / `earlyBonus` / `rerollCost` | 1 / 1 / 2 이상 | 1 / 1 / 2 |
| `createShop(debug.seed + 2)` | 1 | 1 |
| BattleScene 숫자 리터럴 / 한글·Machine·Manager·Service·time.addEvent | 0 / 0 | 0 / 0 |
| data.ts 삭제 줄(주석 제외) | 3 | 3 |
| 삭제 줄 중 `go:`·`임시 출동` 아닌 것 | 0 | 0 |
| 레인 B 경로(src/ui/, main.ts, debug.ts, assets.ts, package.json) 변경 | 0 | 0 (변경 파일: BattleScene, board, shop, data, rules-shop.test) |

## 헤드리스 확인 (실제 실행, 720x1560)

방식: 내 vite(5199, 수정 뒤 시작), 헤드리스 Chrome(`--headless=old`, 포트 9334) CDP + Node 내장 WebSocket. 시나리오마다 새 페이지(타깃)를 열고 `canvas` 1개를 단언했다. 결정적 진행은 `game.scene.pause('battle')` 후 `scene.update(0, 100)` 반복(한 걸음 0.1초). DOM은 `Runtime.evaluate`로 읽고 `.click()`으로 눌렀다. 모든 시나리오 페이지의 JS 예외/console.error는 0건이다. 서버·Chrome은 종료했다(`pgrep` 결과 없음).

| 항목 | 결과 | 읽은 값 |
|---|---|---|
| A 채움·재현 | 통과 | seed=42 offers `[blower,rifle,rifle,blower,sniper]`, 5칸 모두 기본 해금(소총수·제설병·저격수) 안, `.ui-shop`에 closed 없음, `.shop-card` 5개. 같은 시드 두 번 동일. seed=43 `[rifle,blower,blower,sniper,sniper]`로 다름. `unlock=all&seed=5`에서 `[rifle,rifle,miner,cook,blower]`(취사병·지뢰설치병 출현), CARD_KEYS 5종 |
| B 구매 | 통과 | 보급 6: 소총수 -> 5(bench0 소총수1, offers[0] null, `.empty` 1), 저격수 -> 2, 제설병 -> 0, 보급 0에서 4번 소총수 -> 보급 0 그대로, offers[3] 유지, 배너 '보급이 부족합니다' |
| C 대기석 가득 | 통과 | `supply=99&deck=rifle:5`: 저격수 클릭 -> 보급 99, offers[0] 'sniper' 유지, 배너 '대기석이 가득 찼습니다'. 소총수 클릭 -> 보급 98, offers[1] null, `bench0:rifle2`, bench1~4 `rifle1` 그대로, 대기석 5칸 유지 |
| D 연쇄·이름 | 통과 | 대기석 `rifle2, sniper1, blower1, cook1, miner1` + 신병 `rifle1(김신병)`에서 소총수 구매 -> 보급 98, `deploy12:rifle3(김신병)`, bench0 비어 있음(연쇄). `promote('deploy',0,{bench,0})`에서 자기 이름 없는 칸이 absorb 이름 승계 -> `deploy0:rifle2(박병장)`. 자기 이름이 있으면 자기 것 유지(`deploy1:rifle2(최일병)`, absorb '이상병'은 버려짐). 병장(4)에 `promote`는 무시 |
| E 리롤 | 통과 | 보급 6, offers `[rifle,null,sniper,null,blower]`에서 리롤 -> 보급 5, 5칸 모두 카드, `.empty` 0. 보급 0에서 리롤 -> 보급 0, 배너 '보급이 부족합니다', offers 그대로. F의 웨이브 2 준비에서 offers가 새로 5칸(아래) |
| F 수입·출동!·닫힘 | 통과 | `supply=10&god=1`: 출동! -> 보급 11, phase fight, `.ui-shop` closed. `plan=[]` 한 걸음 -> settle, 보급 18(11+5+이자 2), closed 유지. 정산 중 `buy(0)` 불변. 15걸음 뒤 prep, wave 2, closed 없음, 보급 18, offers `[sniper,sniper,sniper,sniper,blower]`(이전에는 offers[0]을 null로 비워 둠 `[null,rifle,rifle,blower,sniper]`), `.empty` 0. 전투 중 `buy(0)`은 보급·offers 불변(별도 페이지: 11/11) |
| G 깃발·마지막 | 통과 | wave=5 supply=0: 출동! -> 1, 정산 -> 9(1+5+0+3). wave=10 supply=7: 출동! -> 8, `plan=[]` 한 걸음 -> `result==='win'`, 보급 8 그대로(수입 없음), 상점 닫힘 |
| H 시간 종료 시작 | 통과 | `supply=6` 301걸음 -> phase fight, 보급 6(+1 없음), 상점 닫힘 |
| I2 UI 없음 내성 | 통과 | `#ui` 제거 후 `buy(0)`, `reroll()`, `go()` 호출 -> fight(보급 4) -> 정산(9) -> 16걸음 뒤 wave 2 prep. 오류 0건 |
| I 임시 버튼 제거 | 통과 | `scene.children.list` 중 '출동!' 텍스트 0개, DOM `.shop-btn-go` 1개, 임시 캔버스 HUD 텍스트(`웨이브 1/10 · 데프콘 2 / 준비 30초 · 위병소 20 · 보급 6`) 남아 있음 |
| J 스크린샷 | 통과 | `docs/shots/M2-03-02.png`: CDP `Page.captureScreenshot`(가로로 밀리지 않음). DOM 상점이 열린 준비 화면, 대기석에 소총수·저격수·제설병, 산 3칸은 '—', 남은 칸은 소총수(보급 1)·저격수(보급 3), HUD 보급 6. 캔버스만: `docs/shots/M2-03-02-canvas.png`(`renderer.snapshot`) |

참고: C의 합성 판정 식에 `|| true`를 잘못 넣어 한 줄(소총수 합성)이 무조건 통과하게 작성됐으나, 같은 페이지의 읽은 값(보급 98, bench0 rank 2, bench1~4 rank 1, 5칸 유지)과 바로 아래 별도 판정(`supply === 98`)으로 위 값을 직접 확인했다.

## 계획 대비 편차

없음. 계획대로 실행했다. 한 가지 구현 선택: `buyCard`는 `none/poor/full`이면 offers를 바꾸지 않고, 성공(bench·merge)일 때만 `offers[i] = null`로 비운다.

## 확인 못 한 것 (not verified)

- 실제 마우스·터치로 상점 버튼을 누르는 실시간 입력. 클릭은 DOM `.click()`과 직접 메서드 호출로만 했다.
- 구매 합성의 진급 연출(작대기 확대 + 진급! 팝업)이 눈에 보이는지. 캔버스에서 상태값(rank, name)만 읽었고 애니메이션 프레임은 보지 않았다.
- 대기석에 구매한 카드를 실제 드래그로 옮긴 뒤의 동작(드래그 합성이 promoteTo로 바뀐 뒤 회귀). 헤드리스에서 드래그 합성을 다시 돌리지 않았다. 입력 경로(`mergeInto`)의 로직은 같고 typecheck·build는 통과했다.
- 실시간(비일시정지) 루프에서 `syncShop`이 매 프레임 `ui.shop`을 부르지 않는지. 키 문자열 비교 로직으로 설계했고 일시정지 상태 걸음에서만 동작을 읽었다.
- 배속 2에서의 상점·수입.
- `board.move`(프로그램용 이동): 정의·typecheck만, 실행해 보지 않았다(04~ 튜닝 봇이 쓸 때 확인).
- `useAdReroll`/`useAdSupply`: 단위 테스트만(BattleScene 연결은 03 plan의 `ctl`).
- 실제 기기에서의 상점 패널이 대기석 띠 아래쪽 약 20px를 가리는 것은 스크린샷에서 보이지만(레인 B의 `.ui-shop` 위치와 `LAYOUT` 관계), 이 plan의 소유 범위가 아니라 고치지 않았다. 레인 B/기획 확인 대상으로 남긴다.

## Known Stubs

없음. (임시 캔버스 HUD 텍스트와 캔버스 결과 문구는 03 plan에서 `ui.hud`/`ui.result`로 교체되는 의도된 임시물이다.)

## Threat Flags

없음. 네트워크·저장소 접점 없음. 해금 풀은 메모리 값(`parseUnlocked(null)` 또는 `?unlock=all`)이며 localStorage 연결은 04 plan.

## 정리

- 임시 스크립트·로그는 삭제했다. Chrome 프로파일 디렉터리 `/tmp/gsd0302/profile`은 AGENTS.md 규칙 10(`rm -rf` 금지) 때문에 지우지 않았다(저장소 밖 임시 경로).

## Self-Check: PASSED

- src/battle/shop.ts, tests/rules-shop.test.ts, docs/shots/M2-03-02.png, docs/shots/M2-03-02-canvas.png 존재 확인.
- 커밋 5099435, 728b365 존재 확인.
