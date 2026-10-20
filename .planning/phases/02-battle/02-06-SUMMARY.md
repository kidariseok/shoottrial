---
phase: 02-battle
plan: 06
subsystem: battle-mines
tags: [phaser, mines, tokens, fx, headless, phase-gate]
requires: [02-01, 02-02, 02-03, 02-04, 02-05]
provides:
  - "board.ts: setTokens, tokens, bury, mines, detonate + 토큰 더미 드래그"
  - "enemies.ts: tickMines"
  - "fx.ts: explosion (총 12개)"
  - "BattleScene: startPrep 토큰 계산, startFight 토큰 소멸, fightTick 지뢰 호출"
affects: [phase-03]
tech-stack:
  added: []
  patterns: ["토큰 더미는 board.ts 안 Container 하나, 더미 객체 자신의 dragstart/drag/dragend로 받아 카드 전역 핸들러와 간섭 없음", "tickMines는 board.mines() 복사본을 돌며 터진 지뢰를 detonate"]
key-files:
  created: [docs/shots/M2-02-06-mines.png, docs/shots/M2-02-06-fight.png, docs/shots/M2-02-06-boss.png]
  modified: [src/battle/board.ts, src/battle/enemies.ts, src/battle/fx.ts, src/battle/BattleScene.ts, src/data.ts]
key-decisions:
  - "tickMines는 plan 문서(tickAllies 앞)가 아니라 핸드오프 지시대로 tickAllies 뒤, 정리(4) 앞에 둔다"
  - "토큰 더미는 적 진입 구역 왼쪽 열(UI.mine.trayCol 0, trayY 1.5). 위치·크기·색은 data.ts"
  - "지뢰 발동은 같은 열 살아 있는 적 중 하나라도 y >= 칸 윗변이면 된다. 이미 지뢰 칸을 지난 적(열을 옮긴 군견 등)도 발동시키지만 피해는 inBlast 범위만"
requirements-completed: [MINE-01, MINE-02, CARD-05, CARD-06, LOOP-02, DBG-02, FX-01]
metrics:
  tasks: 3
  files: 8
  completed: 2026-10-20
---

# Phase 2 Plan 06: 지뢰와 2단계 종합 확인 Summary

준비 단계에 지뢰설치병 수·계급·시너지로 토큰 더미가 생기고, 마우스로 지뢰 구역 빈 칸에 끌어 반투명 지뢰를 묻으며, 전투가 시작되면 남은 토큰이 사라지고, 적이 밟으면 같은 열 위아래 1칸에 150(대전차는 보스에게 450)이 들어가고 폭발·흔들림이 나온다. 이어서 ROADMAP 성공 기준 1~5를 헤드리스 Chrome으로 실제 실행해 읽은 값과 스크린샷으로 확인했다.

## 커밋

첫 커밋 직전 HEAD는 1d86e7e이다.

| 단계 | 커밋 | 내용 |
|---|---|---|
| Task 1 | 8a49048 | `feat(02-06)`: board.ts 토큰 더미·매설·mines/detonate, BattleScene startPrep/startFight 토큰 흐름, data.ts `UI.mine`·색·폭발 키 |
| Task 2 | 17affa5 | `feat(02-06)`: `tickMines`, `fx.explosion`, fightTick 호출 |
| Task 3 | 544f17e | `test(02-06)`: 스크린샷 3장 |

## 구현 요약

- **board.ts**: `Board`에 `setTokens/tokens/bury/mines/detonate` 추가. 토큰 더미 = 원 + 개수 글자 Container(`toScreen(UI.mine.trayCol, UI.mine.trayY)`). 더미 자신의 `dragstart/drag/dragend`로 처리하고 `phase !== 'prep'`이거나 토큰 0이면 드래그를 시작하지 않는다. 놓은 위치 아래 지뢰 칸(중심에서 `cell / 2` 이내)에 `bury`를 시도하고 성공·실패 상관없이 원래 자리로 `snapMs` 트윈. 묻은 지뢰는 `UI.mine.alpha`의 반투명 원(일반 `mineBuried`, 대전차 `mineAnti`). `// ponytail`: 묻은 지뢰는 다시 옮기지 못한다.
- **BattleScene**: `startPrep`에서 배치 구역 지뢰설치병으로 `mineTokens` + `hasAntiTank`, `startFight`에서 `setTokens(0, false)`(묻힌 지뢰는 남음). fightTick 순서: 출현, 아군 수집, tickEnemies + reachLine, tickAllies, **tickMines**, 정리, 종료 판정.
- **enemies.ts `tickMines`**: 지뢰 복사본 순회, 같은 열 살아 있는 적 중 하나라도 `mineTriggered`면 터져 `inBlast`인 같은 열 적 전부에게 `hurtEnemy(mineDamage)`, `detonate`, `explosion`, `shake('heavy')`.
- **fx.ts `explosion`**: 열 폭 x `h` 청백색 사각형 페이드 + 가운데 원이 커지며 사라짐.
- **data.ts**: 추가만(삭제·수정 줄 0). `UI.mine`, `UI.colors.mineToken/mineBuried/mineAnti/explosion`, `UI.fx.explodeAlpha/explodeMs/explodeCoreR/explodeCoreScale`.

## 검증

`npm run verify` 종료 코드 0(최종 HEAD 544f17e). 끝부분:

```
 Test Files  8 passed (8)
      Tests  100 passed (100)
✓ built in 1.20s
```

게이트 grep(기준 커밋 1d86e7e):

| 검사 | 결과 |
|---|---|
| board.ts `(setTokens\|tokens\|bury\|mines\|detonate)\(` 줄 수 | 6 (기준 5 이상) |
| BattleScene `(mineTokens\|hasAntiTank)\(` / `setTokens(` | 2 / 2 |
| enemies.ts `^export function` / `tickMines` / fx.ts `^export function` | 5 / 1 / 12 |
| enemies.ts `(mineTriggered\|inBlast\|mineDamage)\(` | 3 |
| BattleScene `tickMines(` | 1 |
| 리터럴 grep(board, BattleScene 합 / enemies / fx / BattleScene) | 0 / 0 / 0 / 0 |
| board.ts `class \|Manager\|Service` | 0 |
| data.ts 삭제·수정 줄 | 0 |
| 변경 파일(1d86e7e 대비) | src/battle/{BattleScene,board,enemies,fx}.ts, src/data.ts (+ docs/shots 3장). src/ui, main.ts, debug.ts, assets.ts, package.json = 0 |
| `pgrep -f "vite --port 5199"` / Chrome 9333 | 없음 / 없음 (사용자 5173 서버는 그대로) |

FX 호출 지점: plan의 `fx\.(...)\(` 패턴은 코드가 `import { muzzle, ... } from './fx'` named import라 줄 수 0이다. 그래서 `fx.ts` 밖에서 함수 이름 호출을 직접 센 결과(호출 줄 수): muzzle 1, tracer 1, snipeLine 1, windWave 1, explosion 1, laneFlash 2, hitFlash 2, dmgText 2, fall 1, shake 5. 열 가지 모두 한 번 이상 호출된다.

## 헤드리스 확인 (실제 실행, 720x1560)

방식: 내 vite(5199, 수정 뒤 재시작), 헤드리스 Chrome(`--headless=old`) CDP. 시나리오마다 페이지를 새로 열어 캔버스 1개를 단언(실패 시 중단)했다. 결정적 확인은 `game.scene.pause('battle')` + `scene.update(0, 100)` 반복. 마우스 확인(SC3)과 스크린샷·FPS는 `resume` 실시간. 스크립트는 scratchpad에만 있다. 적은 `spawnEnemy`로 만들어 `scene.enemies`에 넣고 `y`·`hp`를 덮어썼고, 전투가 끝나지 않게 `plan`을 먼 미래 더미 한 개로 바꿨다. 신병(소총수, col 2 row 2)은 항상 있다.

### 성공 기준 판정표

| 기준 | 판정 | 읽은 값 |
|---|---|---|
| SC1 시드 재현·열 격리·막힘 | PASS | `wave=2&seed=42&god=1` 두 번: `plan`과 전투 후 `spawned`가 같고(260걸음 정산), `seed=43`은 `plan`이 다름. `wave=6&seed=42` 두 번도 같음(459걸음). 5개 실행 모두 `spawned == plan`. 매 걸음 검사: 군견이 아닌 적의 `col` 변경 0, 신병이 살아 있는 동안 col 2 보병이 `blockY + 0.2`를 넘긴 걸음 0, 한 걸음에 두 마리 이상 맞은 걸음 0, 다른 열(col != 2) 적이 맞은 횟수 0, 가장 가까운 적이 아닌 적을 맞힌 횟수 0 |
| SC2a 저격수 종대 관통 | PASS | 웨이브 6 `plan`에서 종대(col 0, t 12.0~14.0, 0.5초 간격 5명)를 찾고 col 0 row 0에 저격수. 종대가 다 나온 뒤 한 번 사격: 같은 열 9명 피해 `[60, 48, 36, 24, 12, 0, 0, 0, 0]` (60 x (1 - 0.2k), 바닥 0) |
| SC2b 군견 열 변경 | PASS | col 1에 아군 2, col 2 신병, col 3에 1명 배치. 군견 col 0 -> 1(안쪽 한 열뿐), col 4 -> 3, col 2 -> 3(아군이 적은 쪽). 각 군견 한 번만(`moves [1,1,1]`) |
| SC2b 제설병 밀기·화상 | PASS | 이등병 제설병(col 3 row 1), 군견 y 3.6: `knockLeft` 1.5, 세 걸음 뒤 y 2.19(3.69 -> 2.19 = 1.5칸), `burn` 0, hp 변화 0. 상병: 같은 밀림에 `burn` 3, 이후 3초 동안 hp 1000 -> 976(24 = 8 x 3초) |
| SC2c RPG병·취사병 | PASS | RPG병이 y 3.52에서 정지(맨 앞 아군 중심까지 2.98칸, 3칸 안). 취사병 없음: 신병 hp 100 -> 65 -> 30 -> 0(약 11.5초, 14.5초, 17.5초 = 3초 간격, 35씩). 취사병 인접(col 1 row 2): 최대 120에서 120 -> 97(35 맞고 +12) -> 109 -> 74 -> 86 -> 63 -> 75 ... 2초마다 +12로 회복 |
| SC2d 보스 충격파 | PASS | 아군 없는 열: y 3.99(`shocked` false) 다음 틱 y 4.005에 `shocked` true(한 번). 맨 앞 row 2 아군 열: 같은 틱에 같은 열 `stun` 1.5, 다른 열 0. row 0 아군 열: y 3.51(막힘)에서 같은 열 두 아군 `stun` 1.5. 세 경우 모두 `stun`을 0으로 내려도 40틱 안에 다시 걸리지 않음(한 보스당 한 번). stun 1.5는 `tickEnemies`를 직접 한 번 불러 읽은 값이다(`scene.update` 전체로 돌리면 같은 틱 tickAllies가 0.1을 깎아 1.4로 읽힌다) |
| SC2d 지뢰 150 vs 450 | PASS | 이등병 지뢰설치병 -> `anti false` -> 보스 피해 150. 상병 지뢰설치병 -> `anti true` -> 보스 피해 450(`startPrep` -> `bury` -> 보스 y 1.99에서 한 걸음). 같은 열 y 1.5 보병은 150, 폭발 밖(y 4.3, 5.1)은 0, 다른 열 0. 행 1 지뢰도 같음 |
| SC3 토큰·매설·잠금 | PASS | `deck=rifle:5,miner:3&seed=42`: 첫 준비 `tokens() === 4`. 실제 마우스로 더미를 (col 2, row 0)으로 끌면 `mines` 1개, `tokens` 3, 묻힌 원 `fillAlpha` 0.5(1 미만). 같은 칸에 다시 놓으면 `mines` 1개 그대로, 지뢰 구역 밖(진입 구역, 배치 구역)에 놓아도 안 묻힘. (1, 1)에 묻으면 2개/토큰 2. 상병 지뢰설치병을 놓고 `startPrep()`: 토큰 7(= 이등병 3명 3 + 상병 3 + 시너지 1), 묻은 지뢰 `anti true`, 보라색(`c79bff`)이고 일반은 `9fe0c8`. 단독 상병 지뢰설치병(fresh 페이지)은 토큰 3, `anti true`. `startFight()`: `tokens() === 0`, 더미 `visible false`. 전투 중 마우스: 더미 끌기 -> `mines` 3개 그대로, 배치 카드 이동 -> 제자리, 판매 칸으로 끌기 -> 신병 그대로·보급 6 그대로. 묻힌 지뢰는 웨이브 1 -> 2로 넘어가도 3개 그대로 |
| SC3 전투 중 대기석 투입·합성 (02-05 핸드오프) | PASS | 전투 중 마우스로 대기석 0번을 빈 배치 칸 (0,1)에 끌어 투입: 소총수 등장. 다음 실시간 1.5초 동안 같은 열 적 hp가 999976.5 -> 999929.5로 줄어 사격에 참여. 대기석 1번을 그 카드에 끌어 합성: `rank 2`, 전투 상태 hp 150/150·`alive true`, 다시 1.5초 동안 999904.5 -> 999847.5. 매 틱 `collectAllies`가 새 카드를 쓴다 |
| SC4 저지선·HP·승패 | PASS | `wave=4&seed=42`(god 없음, 신병 사격 포함): 열 4, 1, 3, 0이 126, 138, 150, 211걸음에 처음 도달할 때마다 그 열 `leftInCol` 0, HP 변화 0, `lineUsed` true, 소진 표시 텍스트 4개(열 수와 같음). 신병을 계속 쓰러뜨려 아군 없이 돌리면 열 4, 1, 0, 2, 3 모두 첫 도달에 HP 변화 0, 539걸음에 처음 HP 감소(이후 감소), 웨이브 5에서 HP -2 -> `result === 'lose'`, "패배" 텍스트, 50걸음 더 불러도 상태 불변. `god=1`: 웨이브 4~5 1023걸음 동안 `baseHp` 20 유지 |
| SC5 데프콘 1·속도·부활 | PASS | `wave=7`: `plan` 첫 간격 0.84, 소총수 간격 `cd` 0.64. `speed=2`: `tweens.timeScale === 2`, 같은 10걸음에서 준비 시간 감소 2.0(속도 1은 1.0), 보병 이동 0.70(속도 1은 0.35). 전투 중 신병을 쓰러뜨리면 알파 0.35, 웨이브가 끝나 정산이 되면 `alive true`, hp 100/100, 알파 1 |
| FX-01 | PASS(호출 지점) / 일부 눈으로 확인 | 위 grep으로 10개 함수 호출 지점 있음. 눈으로 본 것: 지뢰 폭발(M2-02-06-boss.png, 청백색 사각형 + 원, 흔들림으로 화면이 약간 밀림), 피격 숫자·적 체력바(fight.png). 이전 plan 스크린샷에서 본 것: 탄 궤적·총구 섬광, 저격 흰 선, 송풍 파동 |
| 종합 시나리오 `win` | PASS | `/?scene=battle&wave=1&seed=42&god=1&speed=2`, 3269걸음(상한 60000) 만에 `result === 'win'`, 시뮬레이션 654초(`0.1 x speed x 걸음`), `baseHp` 20, 총 `kills` 15. 웨이브별 `kills`(1~10): 2, 2, 2, 1, 2, 1, 2, 2, 1, 0(웨이브 10은 승리 판정 틱 기준). 웨이브 종료 시 `lineUsed` 열 수: 3, 4, 4, 4, 5, 5, 5, 5, 5, 5. 신병 한 명만 있어 대부분 적이 저지선·방어선으로 사라지고 처치는 적다(아군을 늘린 전투 값은 위 SC2·SC3 참고) |
| 실시간 FPS | 참고값(판정 안 함) | `wave=6&god=1&fps=1&speed=2`, 전투 시작 후 20초 실시간: 오버레이 `FPS: 60`, `OBJ: 21`(그 시점 적 5마리). 헤드리스 소프트웨어 렌더링 수치이며 실기기·목표 수치 판정이 아니다 |

### 스크린샷

- `docs/shots/M2-02-06-mines.png`: 준비 단계. 토큰 더미(대전차 보라, 개수 6), 묻힌 반투명 지뢰 3개(일반 2 = 청록, 대전차 1 = 보라). 눈으로 확인.
- `docs/shots/M2-02-06-fight.png`: `wave=6&god=1&speed=2` 전투 중. 카드 여러 종이 배치되고 적이 걷고 있다. 지뢰 1개가 남아 있다(보라 원). 눈으로 확인.
- `docs/shots/M2-02-06-boss.png`: `wave=5` 보스 + 지뢰 폭발 직후. 열 2에 청백색 사각형과 가운데 원, 화면 흔들림. 폭발 칸 안 보스 몸통은 밝은 사각형 뒤라 윤곽이 잘 안 보인다. 보스 hp는 1776 -> 1326(대전차 450). 눈으로 확인.

## 디버그 URL

새 파라미터는 없다. `?deck=rifle:5,miner:3&seed=42`이면 대기석에 소총수 5장, 배치 구역 맨 아래 행 빈 칸(왼쪽부터, 신병 칸 제외)에 지뢰설치병 3장이 놓여 첫 준비 단계 토큰이 4개(3 + 시너지 1)다. 기존: `?scene=battle`, `?wave=`, `?god=1`, `?seed=`, `?speed=2`, `?fps=1`, `?safe=1`.

## 확정된 결정

- 보스 충격파: y가 처음 4 이상이 되는 틱 또는 맨 앞 아군에게 막히는 틱 중 먼저, 한 보스당 한 번(02-04에서 확정, 이번 SC2d에서 다시 확인).
- 종대 보병은 단발 보병과 같은 열 순서로 한 저격에 합산(60/48/36/24/12).
- 토큰 더미 위치: 적 진입 구역 아래쪽 왼쪽 열. 준비 단계에는 적이 없고 전투가 시작되면 더미가 사라져 적과 겹치지 않는다.
- RPG병은 맨 앞 행 아군이 있으면 지뢰 구역에 들어오지 않을 수 있다(의도된 상성).
- GDD §8의 일시정지·2배속 버튼·시너지 표시는 3단계(T-102 UI 연결).

## Deviations from Plan

**1. [핸드오프 우선] tickMines 호출 위치**
- plan 문장은 "3번(tickEnemies + reachLine) 직후, tickAllies 직전"이었으나, 호출자 지시(핸드오프)대로 tickAllies 뒤, 정리(4) 앞에 넣었다. 효과: 이번 틱 아군 사격이 먼저 적용되고 그 위에 지뢰 피해가 더해지며, 터진 지뢰로 죽은 적도 같은 틱 정리가 처치로 센다. 읽은 값은 위 결과 그대로이며 이 위치로 확인했다.

**2. [판단] 이미 지뢰 칸을 지난 적도 지뢰를 발동시킨다**
- `mineTriggered(e.y, row)`는 `y >= 윗변`이므로 같은 열에 이미 y가 더 큰 적(예: 배치 구역 앞에서 열을 옮겨 온 군견, 위 시나리오의 y 4.3·5.1 보병)이 있어도 터진다. 피해는 `inBlast` 범위 안의 적에게만 간다. 지나간 적이 없는 열에서는 문제가 없고 GDD 문구("윗변에 닿으면")와 충돌하지 않아 그대로 두었다. 바꾸고 싶으면 `tickMines`에서 `mineTriggered`에 상한을 둔다.

**3. [검증 환경] 숫자 읽기 차이**
- 보스 충격파 stun 1.5는 `tickEnemies`를 직접 호출해 읽었다(전체 update는 같은 틱 tickAllies가 0.1을 깎아 1.4로 보인다). 코드 변경 없음.
- 시나리오 SC1·SC4 스크립트 오류 몇 개(새로 생긴 적의 `col` 비교, 신병이 죽은 뒤의 막힘 검사)는 기대값 쪽을 고쳤다. 코드 결함이 아니다.

## 확인 못 함

- **사람 눈 확인(human-check)**: plan이 요구한 세 URL(`wave=5` 토큰 드래그·합성·보스 지뢰, `wave=6` 저격 종대·제설·취사, `wave=7` 저지선) 직접 플레이는 하지 않았다. 사용자 몫으로 남는다. "조합이 결과를 바꾸는 느낌"과 도형 연출의 손맛은 3단계 튜닝 전 메모 사항이다.
- 열 섬광(`laneFlash`)·쓰러짐 페이드(`fall`)·회복 숫자·부활 번쩍임·군견 열 옮김 트윈의 움직임을 이 plan에서 눈으로 보지 못했다(값·호출 지점만 확인). 저격 흰 선·송풍 파동·탄 궤적은 02-05 스크린샷에서만 확인.
- 창 높이 1280(dy = 0) 배치, 실기기 터치(손가락에 더미가 가려지는지), 안드로이드 백버튼, 백그라운드 소리 정지.
- 60마리 규모 프레임 저하. FPS 60은 헤드리스 소프트웨어 렌더링에서 적 5마리 때의 값이다.
- 토큰 더미가 진입 구역 안에 있어 보스·적 몸통과 시각적으로 겹치는지는 전투 중에는 더미가 숨으므로 문제가 없다고 판단했지만, 준비 단계에 이전 웨이브 잔여 적이 있는 경우는 구조상 없어 시험하지 않았다.
- 같은 틱에 지뢰가 여러 개 동시에 터지는 경우의 연출 겹침은 눈으로 보지 않았다(값은 위 `MINE2`에서 한 걸음에 3개 소진 확인).
- 보스 색(0x4a5560)과 진입 구역 대비가 약한 점은 아트 단계로 남긴다(02-04 메모 유지).

## Known Stubs

없음. 임시 HUD·출동! 버튼·승패 텍스트는 이전 plan의 `// ponytail` 임시물이며 3단계에서 대체된다.

## Threat Flags

없음(로컬 렌더링·입력·계산만).

## Self-Check: PASSED

- 파일 존재: src/battle/board.ts, enemies.ts, fx.ts, BattleScene.ts, docs/shots/M2-02-06-mines.png, M2-02-06-fight.png, M2-02-06-boss.png.
- 커밋 존재: 8a49048, 17affa5, 544f17e.
