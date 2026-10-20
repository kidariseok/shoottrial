---
phase: 02-battle
plan: 04
subsystem: battle-loop
tags: [phaser, enemies, wave-loop, base-hp, last-line, headless]
requires: [02-01, 02-02, 02-03]
provides:
  - "enemies.ts: Enemy, spawnEnemy, hurtEnemy, tickEnemies, removeEnemy"
  - "BattleScene: 준비 -> 전투 -> 정산 phase switch 루프, 위병소 HP, 열별 최후 저지선, 승패, 임시 HUD, 출동! 버튼, setSpeed"
affects: [02-05, 02-06]
tech-stack:
  added: []
  patterns: ["phase 변수 하나 + switch (this.phase)", "전투 논리는 update의 dt 하나로만 진행(time.addEvent 없음)", "난수 두 줄기 분리(spawnRand = seed, dogRand = seed + 1)"]
key-files:
  created: [src/battle/enemies.ts, docs/shots/M2-02-04.png]
  modified: [src/battle/BattleScene.ts, src/data.ts]
key-decisions:
  - "보스 충격파의 y >= 4 판정은 이동 뒤(7단계 다음)에 한다. 이동 전에 판정하면 y가 4를 넘은 다음 틱에 발동해 한 틱 늦는다. 막힘 트리거는 7단계 그대로"
  - "아군 기절(combat.stun)은 이 plan에서 줄어들지 않는다. 아군 행동 틱(02-05)이 차감한다"
  - "reachLine은 같은 틱에 reached에 여러 마리가 들어와도 그 열의 첫 한 마리만 저지선을 쓰고 나머지는 sweep으로 gone 처리된다(HP 불변)"
requirements-completed: [LOOP-01, LOOP-02, LOOP-03, LOOP-04, LOOP-05, LANE-01, ENEMY-01, ENEMY-02, ENEMY-03, ENEMY-04, WAVE-01, BASE-01, BASE-02, DBG-02, FX-01]
metrics:
  tasks: 3
  files: 4
  completed: 2026-10-20
---

# Phase 2 Plan 04: 전투 루프(적 4종·위병소·최후 저지선·승패·속도) Summary

적 4종(보병·군견·RPG병·보스)의 이동·막힘·공격·특수 행동과 준비 -> 전투 -> 정산 루프, 위병소 HP와 열별 최후 저지선, 데프콘 1 출현 간격, `?speed=2`, 임시 HUD·출동! 버튼, 승패 처리를 BattleScene에 올리고 헤드리스 Chrome으로 A~J를 실제 실행해 확인했다. 아군은 아직 쏘지 않는다(02-05).

## 커밋

첫 커밋 직전 HEAD는 52053d6이다.

| 단계 | 커밋 | 내용 |
|---|---|---|
| Task 1 | a731251 | `feat(02-04)`: enemies.ts, data.ts UI 키 추가(enemyDepth, spawnFadeMs, hud, go, enemyBar, text 등) |
| Task 2 | 5978556 | `feat(02-04)`: BattleScene 루프·저지선·승패·HUD·속도 |
| Task 3 보정 | 02a7c6a | `fix(02-04)`: 보스 충격파를 이동 뒤 판정(y가 처음 4 이상이 되는 그 틱) |
| Task 3 | 8d1c03b | `test(02-04)`: 스크린샷 `docs/shots/M2-02-04.png` |

## 구현 요약

- **enemies.ts**: `Enemy` 타입과 4개 export 함수. `tickEnemies`는 화상 -> 밀려남 -> 기절 -> (군견 열 변경) -> 막힘/이동/공격 -> (보스 y>=4 충격파) -> 뷰·방어선 도달 순이다. 막힘 판정은 `switch (e.type)`에서 RPG병만 `inRange`로, 나머지는 `blockY`로 나눈다. 풀·클래스 없음(`// ponytail:` 주석).
- **BattleScene**: public 상태(`board, phase, wave, baseHp, supply, speed, kills, result, enemies, plan, spawned, lineUsed, prepLeft`와 `settleLeft, clock, nextIdx`). `update`는 `dt = min(delta / 1000, BATTLE.maxDt) * speed`, `switch (this.phase)` 하나. `fightTick` 순서는 출현 -> 아군 수집(매 틱) -> `tickEnemies` + `reachLine` -> 정리(처치·gone) -> 종료 판정. 02-05/02-06이 아군 행동·지뢰를 3과 4 사이에 끼운다(주석으로 표시).
- **reachLine**: 열의 첫 도달은 그 열 적 전부 `gone` 제거 + 열 섬광 + 흔들림 + 방어선 띠 위 소진 표시(HP 불변). 이후에는 `ENEMIES[type].baseDmg`만큼 HP 감소(`?god=1`이면 없음).
- **data.ts**: 추가만. `UI.colors.lineUsed/go`, `UI.fx.enemyDepth/spawnFadeMs/resultPx/lineUsedPx/lineUsedInset`, `UI.text` 한국어 문구, `UI.hud`, `UI.go`, `UI.enemyBar`.

## 검증

`npm run verify` 종료 코드 0(최종 HEAD 8d1c03b). 끝부분:

```
 Test Files  8 passed (8)
      Tests  100 passed (100)
✓ built in 1.21s
```

게이트 grep(기준 커밋 52053d6):

| 검사 | 결과 |
|---|---|
| enemies.ts `^export function` / `^export type Enemy` | 4 / 1 |
| enemies.ts `(frontAlly\|blockY\|inRange\|pickDogLane\|waveHp)\(` 줄 수 | 5 |
| enemies.ts 리터럴 grep(0.5 제외) | 0 |
| enemies.ts `class\|Manager\|Service\|ObjectPool\|ui\|debug` import | 0 |
| data.ts 삭제·수정 줄(`git diff 52053d6 -U0`) | 0 (추가만) |
| BattleScene `switch (this.phase)` | 1 |
| BattleScene `createRng(debug.seed` / `debug.(wave\|god\|speed)` | 2 / 3 |
| BattleScene `(spawnPlan\|defconOf\|collectAllies\|startWave\|endWave\|tickEnemies\|spawnEnemy)\(` | 7 |
| BattleScene 리터럴 grep(0.5, `delta / 1000` 제외) | 0 |
| BattleScene `Machine\|Manager\|Service\|time.addEvent\|ui` import | 0 |
| src/ui, main.ts, debug.ts, assets.ts, package.json 변경(52053d6 대비) | 0 |
| `pgrep -f "vite --port 5199"` / 내 Chrome(포트 9444) | 없음 / 없음 |

## 헤드리스 확인 (실제 실행, 720x1560)

방식: `npx vite --port 5199`, 헤드리스 Chrome(`--headless=old`), CDP(Node 내장 WebSocket). `game.scene.pause('battle')` 후 `scene.update(0, 100)`을 직접 불러 한 걸음 0.1초로 진행했다. 출동! 버튼 클릭(A6)과 드래그(I2)와 스크린샷만 실시간으로 했다. 스크립트는 scratchpad에만 있고 저장소에는 없다. 읽은 값 기준이다.

- **A 루프·타이머** PASS: `seed=42` prep, prepLeft 29.98, HUD "웨이브 1/10 · 데프콘 2 / 준비 30초 · 위병소 20 · 보급 6". `wave=3`은 prepLeft 19.97. prepLeft를 0으로 내리면 phase 'fight'. 웨이브 1을 끝까지(279걸음) 돌리면 'settle'(result null). settle 15걸음째에 wave 2 'prep'으로 전환되고 1걸음 더 진행해 prepLeft 19.9(첫 기대값 정확히 20은 걸음 경계 때문에 19.9로 읽힘). 출동! 버튼을 실제 마우스로 눌러 'fight' 전환, 버튼 숨김 확인(좌표 360,1500).
- **B 시드 재현** PASS: `wave=2&seed=42`를 새로 열기 2번 -> `plan` JSON 동일, 끝까지 돌린 뒤 `spawned` JSON 동일(10개), `spawned == plan`. `seed=43`은 다름.
- **C 열 격리·막힘** PASS: `wave=2&seed=42&god=1`, 301걸음 매 틱 검사. 군견이 아닌 적의 `col` 변경 0건, `y` 감소 0건, 같은 열 살아 있는 맨 앞 아군 대비 `blockY + 한 걸음` 초과 0건. 신병 앞에서 막힌 보병은 막힌 지 약 1초 뒤(15.8 -> 16.9) 신병 HP -10.
- **D 군견·RPG·보스** PASS:
  - 군견: 비대칭 배치(col1 3명, col3 1명, col2 신병)에서 col 2 -> 3, col 0 -> 1, col 4 -> 3. 각 군견 한 번만 변경, 트리거 y 3.51(= deployTop - 0.5 + 한 걸음), 뷰 x도 새 열로 이동. `wave=4` 자연 진행 4건(동수 타이 1건 포함) 모두 아군이 더 적은 옆 열로 이동.
  - RPG병: 신병 앞 y 3.51에서 정지(신병 중심 6.5와 거리 2.99), 14.7초·17.7초·20.7초에 -35, -35, -30(신병 HP 100이 먼저 소진), 간격 3초.
  - 보스(i) 맨 앞 row 2 아군 열: y가 3.99까지는 `shocked` false·아군 stun 0, y가 처음 4 이상이 된 4.005 틱에 `shocked` true·같은 열 stun 1.5, 다른 열(col 1, col 2) stun 0.
  - 보스(ii) row 0 아군(col 4, 같은 열 row 2에도 아군): y 3.51에서 막혀 4 미만인데 `shocked` true, 열 두 아군 모두 stun 1.5, col 2 stun 0.
  - 두 경우 모두 stun을 수동으로 0으로 내린 뒤 30~40걸음 더 진행해도 다시 걸리지 않음(한 보스당 한 번).
- **E 위병소·저지선** PASS: `wave=4&seed=42`(god 아님, 아군은 쏘지 않음). 열 5개가 각각 126, 138, 150, 211, 319걸음에 처음 도달 -> 그 열 적 전부 사라짐(leftInCol 0)·`lineUsed` true·그 틱 HP 변화 0. 매 틱 HP 변화가 "이미 쓴 열에 닿은 적의 baseDmg 합"과 일치(위반 0). 웨이브 5에서 HP -2 -> `result === 'lose'`, 화면에 "패배" 텍스트, `update` 100번을 더 불러도 상태 불변. `god=1`로 `wave=4`부터 웨이브 10 승리까지(3505걸음) `baseHp` 20 유지.
- **F 승리** PASS: `wave=10&god=1&seed=42`, 567걸음에 `result === 'win'`, "승리" 텍스트, 38마리 전부 출현.
- **G 데프콘 1** PASS: `wave=7` 간격 0.84 + HUD "데프콘 1", `wave=6` 간격 1.2 + "데프콘 2".
- **H 속도** PASS: `speed=2`이면 `tweens.timeScale === 2`, 같은 50걸음에서 prepLeft 감소 10.0 vs 속도 1일 때 5.0(정확히 2배).
- **I 부활·잠금** PASS: 전투 중 `damageAlly(9999)`로 신병을 쓰러뜨리고(알파 0.35) 웨이브가 끝나 'settle'이 되면 `alive true`, HP 100/100, 알파 1. 드래그 잠금: 실시간 'fight' 중 신병 카드를 마우스로 col 0으로 끌어도 (2,2) 360,1208에 그대로. 양성 대조로 같은 좌표·같은 드래그가 'prep'에서는 카드를 col 0(x 104)으로 옮김.
- **J 스크린샷** `docs/shots/M2-02-04.png`: `wave=5&god=1&seed=42&speed=2`, 전투 18초(속도 2로 실시간 9초) 시점. 적 15마리가 걷고 일부는 아군 앞에서 막혀 있고 다친 아군의 체력바·숫자가 보인다. 임시 HUD 두 줄은 왼쪽(x 168~407)에 있고 우상단은 비어 있다(눈으로 확인). 저지선 소진 표시와 열 섬광의 움직임은 이 한 장으로는 확인하지 못했다(헤드리스에서 상태값으로만 확인).

확인하지 못한 것:
- 창 높이 1280(dy = 0)과 실기기 터치, 안드로이드 백버튼·백그라운드 소리는 이 plan 범위 밖이라 하지 않음.
- 열 섬광·카메라 흔들림·적 쓰러짐(`fall`)·군견 열 옮김 트윈의 움직임 자체는 눈으로 보지 않았다(예외 없이 동작하고 값이 맞는 것만 확인). 쓰러짐은 아군이 아직 쏘지 않아 이 plan에서는 `kills`가 0이다(burn 화상·히트백도 02-05가 채운다).
- 보스 색(0x4a5560)이 진입 구역 배경과 가까워 스크린샷에서 대비가 약해 보인다. 아트 단계(색)에서 다룰 사항으로 남긴다.
- 실제 프레임 저하(적 최대 ~15마리일 때 확인, 60마리는 못 봄).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - 계획과 동작 불일치] 보스 충격파 y >= 4 판정을 이동 뒤로 옮김**
- **Found during:** Task 3 D(i)
- **Issue:** 계획의 4단계 순서(이동 전 판정)대로 두면 y가 처음 4 이상이 되는 틱이 아니라 그 다음 틱에 충격파가 발동했다(읽은 값 yPre 4.005).
- **Fix:** 판정을 7단계 이동 뒤로 옮김(밀려나거나 기절 중에는 걷지 않으므로 의미 동일). 막힘 트리거는 그대로 7단계.
- **Files modified:** src/battle/enemies.ts
- **Commit:** 02a7c6a

### 확인 환경에서 겪은 것(코드 변경 없음)

- **두 번째 Phaser Game 문제**: 개발 서버가 수정된 파일에 `?t=` 타임스탬프를 붙여 페이지의 진입 모듈 URL이 `main.ts?t=...`가 된다. 그 상태에서 `import('/src/main.ts')`로 상태를 읽으면 `main.ts`가 한 번 더 평가되어 캔버스가 2개(Game 2개)가 되고, 플렉스 정렬 때문에 첫 캔버스가 -360px로 밀려 실제 마우스 좌표도 어긋났다(드래그 양성 대조가 실패해서 발견). 서버를 재시작해 `?t=`를 없앤 뒤 캔버스가 1개임을 단언하고 A~J를 전부 다시 실행했다. 위 결과는 모두 재실행분이다. 첫 실행(2개 Game 상태)의 PASS는 쓰지 않았다.
- **스크린샷**: CDP `Page.captureScreenshot`은 위 문제로 이 환경에서 화면이 가로로 밀려 찍혔다. 최종 스크린샷은 `game.renderer.snapshot`으로 캔버스에서 직접 뽑았다.
- 이 plan에서 테스트 스크립트 오류 몇 개(걸음 수 경계, RPG가 신병을 죽이고 계속 걷는 것을 실패로 본 것 등)는 기대값을 고쳤다. 코드 결함이 아니다.

## 02-05 이후를 위한 메모

- `combat.stun`(보스가 건 기절)은 어디서도 줄지 않는다. 02-05의 아군 행동 틱에서 `stun > 0`이면 `stun -= dt`하고 공격·능력을 건너뛰어야 한다.
- 적의 `burn`·`knockLeft`·`stun`·`hurtEnemy`는 구현돼 있고 02-05가 채우기만 하면 된다. `hurtEnemy`는 hp만 줄이고, 제거는 `fightTick` 4단계(`hp <= 0 && !gone` -> `kills++`, `fall`)가 한다.
- `fightTick`의 `collectAllies`는 매 틱 새로 만들므로 한 틱 안에서는 같은 배열을 02-05 호출에도 넘길 것(`ally.alive`는 사본).
- 개발 서버가 `?t=`를 붙인 상태에서 헤드리스로 상태를 읽을 때는 페이지 스크립트의 실제 URL로 import하거나 서버를 재시작할 것.

## Known Stubs

없음. 임시 HUD·출동! 버튼·승패 텍스트는 계획된 `// ponytail:` 임시물이며 3단계에서 `ui.hud()`·`ui.shop`·`ui.result()`로 대체된다.

## Threat Flags

없음(로컬 렌더링·입력만, 네트워크·파일·권한 표면 변화 없음).

## Self-Check: PASSED

- 파일 존재: src/battle/enemies.ts, src/battle/BattleScene.ts, docs/shots/M2-02-04.png.
- 커밋 존재: a731251, 5978556, 02a7c6a, 8d1c03b.
