---
phase: 02-battle
plan: 05
subsystem: battle-allies
tags: [phaser, allies, cards, synergy, fx, headless]
requires: [02-01, 02-02, 02-03, 02-04]
provides:
  - "units.ts: synergyCounts, tickAllies (카드별 switch)"
  - "fx.ts: muzzle, tracer, snipeLine, windWave, healText, reviveFlash"
  - "BattleScene.fightTick: 적 행동 직후 tickAllies 호출"
affects: [02-06]
tech-stack:
  added: []
  patterns: ["대상 찾기 헬퍼 ahead() 하나(같은 열 + inRange + 가까운 순)로 소총수·저격수·제설병이 공유", "쿨타임 검사는 switch 앞 한 번, 행동했을 때만 cd = interval()"]
key-files:
  created: [docs/shots/M2-02-05.png, docs/shots/M2-02-05-snipe.png, docs/shots/M2-02-05-wind.png]
  modified: [src/battle/units.ts, src/battle/fx.ts, src/battle/BattleScene.ts, src/data.ts]
key-decisions:
  - "대상 찾기는 plan의 nearest()가 아니라 ahead() 하나로 합쳤다. 정렬 배열을 돌려주고 소총수는 [0], 저격수·제설병은 전체를 쓴다"
  - "기절(combat.stun) 중에는 cd도 줄이지 않는다. 기절이 끝난 틱부터 cd 검사를 시작한다"
  - "취사병 여러 명은 각자 회복한다(2명이면 같은 아군이 한 번에 +24). 회복 중첩 금지 규정이 문서에 없어 그대로 두었다"
requirements-completed: [CARD-01, CARD-02, CARD-03, CARD-04, CARD-05, CARD-06, CARD-07, LANE-01, LOOP-04, FX-01]
metrics:
  tasks: 3
  files: 7
  completed: 2026-10-20
---

# Phase 2 Plan 05: 아군 행동(카드 5종·계급 능력·시너지)과 연출 Summary

배치 구역 카드 5종이 실제로 싸운다. 소총수·지뢰설치병(단발, 소총수 상병 2점사), 저격수(열 관통·낙폭·병장 기절·시너지), 제설병(밀어내기·공격 준비 취소·상병 화상), 취사병(범위 회복·상병 부활)을 `tickAllies`의 `switch (a.unit.card)` 하나로 처리하고 도형 연출 6종을 붙였다. 헤드리스 Chrome으로 1~9번 시나리오를 실제 실행해 읽은 값을 아래에 적었다. 지뢰 토큰 매설·폭발은 02-06이다.

## 커밋

첫 커밋 직전 HEAD는 b993036이다.

| 단계 | 커밋 | 내용 |
|---|---|---|
| Task 1 | 4c3fb5b | `feat(02-05)`: synergyCounts·tickAllies(소총수·지뢰설치병·저격수), fx muzzle/tracer/snipeLine, data.ts UI 키, BattleScene 호출 한 줄 |
| Task 2 | da46520 | `feat(02-05)`: 제설병·취사병 가지, fx windWave/healText/reviveFlash |
| Task 3 | 26a4e73 | `test(02-05)`: 스크린샷 3장, switch 식을 `a.unit.card`로 맞춤(동작 동일) |

## 구현 요약

- **tickAllies**: `counts`를 한 번 계산하고 이번 틱의 `allies` 배열을 순회. `combat.alive` 아닌 아군은 건너뜀, `stun > 0`이면 `stun -= dt` 후 건너뜀(핸드오프 1), 그 밖에는 `cd` 감소 후 `cd > 0`이면 건너뜀(`switch` 앞 한 번). 대상이 없으면 `cd`를 쓰지 않아 다음 틱에 바로 쏜다. `ally.alive`는 읽지 않고 `combat.alive`만 읽는다(핸드오프 2). 취사병 부활은 `combat.alive`와 사본 `alive`를 둘 다 올린다.
- **소총수·지뢰설치병**: 사거리 안 같은 열 가장 가까운 적 하나. 소총수 상병 이상 2점사(피해는 한 틱에 모두 적용, 연출만 `burstGap` 시차, `// ponytail:` 표기).
- **저격수**: 같은 열 전부 가까운 순 `sniperDamage(atk, k, rank, tier)`. 병장은 첫 명중 대상 `stun = max(stun, sniperStun)`. 흰 선 + 가벼운 흔들림.
- **제설병**: `knockLeft +=`(누적), `ready = 0`, 상병 이상 `burn =`(대입). 실제 미끄러짐은 02-04 `tickEnemies`.
- **취사병**: `cookReach` 안 다친 아군 +12(최대 HP 상한), 상병 이상 웨이브당 1회 인접(`CARDS.cook.range`) 쓰러진 아군 중 행 -> 열 순 첫 명을 `maxHp * cookRevive`로 부활. 회복·부활 중 하나라도 했을 때만 쿨타임.
- **BattleScene**: `fightTick`에서 `tickEnemies` + `reachLine` 직후, 정리(4) 직전에 `tickAllies({..., allies, defcon1}, dt)` 한 줄. 같은 틱의 `allies` 배열을 그대로 넘긴다. 전투 중 합성·투입은 틱 사이에 일어나고 `collectAllies`가 매 틱 새로 모으므로 따로 다시 모을 곳은 없다.
- **data.ts**: 추가만(삭제·수정 줄 0). `UI.colors.muzzle/tracer/snipe/wind/revive`, `UI.fx.msPerSec/muzzleR/muzzleDy/muzzleMs/tracerW/tracerMs/snipeW/snipeMs/windW/windH/windAlpha/windMs/healRise/healMs/reviveScale/reviveAlpha/reviveMs`, `UI.text.healColor`.

## 검증

`npm run verify` 종료 코드 0(최종 HEAD 26a4e73). 끝부분:

```
 Test Files  8 passed (8)
      Tests  100 passed (100)
✓ built in 1.22s
```

게이트 grep(기준 커밋 b993036):

| 검사 | 결과 |
|---|---|
| units.ts `^export function` / `synergyCounts\|tickAllies` | 6 / 2 |
| fx.ts `^export function` | 11 |
| `switch (a.unit.card)` (units.ts) | 1 |
| `tickAllies(` (BattleScene) | 1 |
| units.ts `(interval\|sniperDamage\|inRange\|synergyTier)\(` | 6 |
| units.ts `(knockback\|blowerRange\|cookReach\|withinReach)\(` | 6 |
| units.ts `knockLeft +=\|\.burn = ` / `case '(rifle\|miner\|sniper\|blower\|cook)'` | 2 / 5 |
| 리터럴 grep(units, fx, BattleScene) | 0 / 0 / 0 |
| `class \|Manager\|Service\|ObjectPool` (units, fx) | 0 |
| data.ts 삭제·수정 줄 | 0 |
| 변경 파일(b993036 대비) | src/battle/{BattleScene,fx,units}.ts, src/data.ts 와 docs/shots 만(src/ui, main.ts, debug.ts, assets.ts, package.json 0) |
| `pgrep -f "vite --port 5199"` / Chrome 9333 | 없음 / 없음(사용자 5173 서버는 그대로) |

## 헤드리스 확인 (실제 실행, 720x1560)

방식: 내 vite(5199), 헤드리스 Chrome(`--headless=old`) CDP, 시나리오마다 페이지를 새로 열어 캔버스 1개를 단언(실패 시 중단)한 뒤 `game.scene.pause('battle')` + `scene.update(0, 100)` 직접 호출. 카드는 `board.place('deploy', ...)`, 적은 `spawnEnemy`로 만들어 `scene.enemies`에 넣고 y·hp를 덮어썼다. 전투가 즉시 끝나지 않게 적이 없는 시나리오에는 먼 열에 hp 1e9 보스 더미를 두었다(처음 이걸 빼먹어 취사병 시나리오가 틱 1에 정산으로 넘어가 회복·부활을 지웠다. 더미를 넣고 다시 읽은 값만 아래에 쓴다). 스크립트는 scratchpad에만 있다. 신병(소총수, col 2 row 2)이 항상 있어 소총수 수에 포함된다. 아래에서 "신병 승급"은 `unit.rank`를 직접 4로 바꾼 것이다.

- **1 대상 선택·간격** PASS
  - 신병(col 2, y 6.5) 앞 col 2의 A(y 3.0), B(y 4.0), D(y 2.4), 다른 열 C: 한 걸음 뒤 B 990, A·C·D 1000 그대로. 쿨타임 `cd` 0.8. 20걸음 동안 B가 맞은 걸음은 10, 19번째 걸음. 한 걸음에 두 번 맞은 적 없음.
  - 사거리 밖(거리 4.1)은 맞지 않고(1000), 안(거리 약 3.9)은 990.
  - 제설병(40걸음): 발동 걸음 1, 16, 31(`cd` 1.5, 15걸음 간격). 취사병(50걸음): 발동 1, 21, 41(`cd` 2.0, 20걸음 간격).
  - 소총수 간격이 정확히 8걸음이 아니라 9걸음(0.9초)으로 읽힌 것은 0.8에서 0.1을 8번 빼도 부동소수 오차로 0이 되지 않아 한 걸음 늦게 쏘는 것이다. 걸음 0.1초 한계이며 실제 프레임(약 16ms)에서는 무시된다.
- **2 계급** PASS: 소총수 일병 15, 상병 45(= 22.5 × 2발), 병장(신병 승급, 소총수 1명) 67.5(= 2점사 33.75 × 2)와 `cd` 0.64. 신병 + 소총수 1명(시너지 2)일 때 상병·병장 `cd`는 0.64·0.512. 지뢰설치병 이등병: 거리 3.46은 0 피해, 거리 약 2.97은 6 피해, `cd` 1.0.
- **3 저격수** PASS: 이등병 60/48/36(가까운 적이 60), 상병 135/135/135, 병장 첫 적 `stun` 1·둘째 0(피해는 202.5로 둘 다), 서로 다른 열 저격수 2명이면 각 열 한 명에게 78씩. 저격수 1명 60.
- **4 제설병** PASS
  - 이등병: 보병 `knockLeft` 1, 군견 1.5(군견은 열을 옮기지 않게 `dogMoved`를 미리 true로 둠), `ready`는 미리 넣은 0.5에서 0으로. 실제로 미끄러진 거리(걸어온 0.035 보정 전): 보병 0.965, 군견 1.41.
  - 보스 0.25: 보스가 사거리에 들어오면 충격파가 같은 열 제설병을 1.5초 기절시키므로 발동은 16걸음째에 `knockLeft` 0.25, 실제 미끄러짐 0.25.
  - 상병: `burn` 3, 걸음 11에서 2, 끝에 `hp` 976(24 감소 = 8 × 3초), `burn` 0. 병장: 보병 2. 시너지 2명: 보병 1.5, 사거리 밖 y 4.0(거리 2.5)은 밀리지 않음. 4명: 같은 거리 2.5의 적이 1.5 밀림.
- **5 취사병** PASS
  - 1명: 인접 소총수(hp 50)가 2초마다 +12(50, 62, 62, 74...)이고 최대 120(취사병 짬밥 +20%)에서 멈춰 초과 없음. col 4 아군은 50 그대로.
  - 2명: col 4 아군이 한 걸음에 74(각 취사병 +12씩, 50 -> 74). 취사병 간 회복 비중첩 규정이 없어 그대로 둠(결정 참조).
  - 병장 단독: col 3(거리 2)은 62, col 4(거리 3)는 50.
  - 상병: 인접 아군을 쓰러뜨리면 다음 걸음에 `alive`, hp 60(= maxHp 120 × 0.5), 뷰 알파 1, `revived` true. 두 번째로 쓰러뜨리면 40걸음 뒤에도 쓰러진 채. `endWave` 후 `revived` false, hp 100.
- **6 간격** PASS: 소총수 2명 0.64, 4명 0.48, `wave=7`(데프콘 1, 신병 1명) 0.64.
- **7 기절** PASS: 신병에게 `stun = 1.5`를 주고 같은 열 적을 사거리 안에 둠 -> 걸음 1~15 피해 0, 걸음 16부터 10씩. 보스 충격파 경로(소총수 row 0, 보스 y 3.5): `shocked` true, `stun` 1.4에서 0.1씩 줄어 14걸음에 0, 첫 피해는 16걸음째.
- **8 한 판 흐름** PASS: `wave=1&seed=42`, 소총수 5장 추가(총 6명), 145걸음에 'settle', `kills` 6, `lineUsed` 전부 false, `baseHp` 20.
- **9 스크린샷** `docs/shots/M2-02-05.png`: `wave=6&god=1&seed=42&speed=2`, 소총수·저격수·제설병·취사병·지뢰설치병을 놓고 실시간 전투 중(속도 2). 매 프레임 폴링으로 순간을 잡은 3장:
  - `M2-02-05.png`: 소총수가 쏜 노란 탄 궤적과 총구 섬광 원, 적 위 숫자 10·6(소총수 10, 지뢰설치병 6). 눈으로 확인.
  - `M2-02-05-snipe.png`: 저격수 위치에서 열 맨 위까지 흰 굵은 선, 대상에 60. 카메라 흔들림 때문에 화면이 약간 밀려 찍힘.
  - `M2-02-05-wind.png`: 제설병 위쪽에 청백색 가로 띠(송풍 파동). 은은하다. 적이 미끄러지는 움직임은 정지 화면이라 보이지 않는다.

확인하지 못한 것:
- 회복 숫자(`healText`)·부활 번쩍임(`reviveFlash`)·탄 궤적 두 번째 발 시차의 시각 확인: 예외 없이 값이 맞는 것만 읽었다(눈으로 보지 못함).
- 지뢰설치병의 지뢰 토큰·폭발(02-06), 창 높이 1280, 실기기, 프레임 저하(적 60마리).
- 전투 중 합성·벤치 투입 직후 다음 틱 `collectAllies`가 새 카드를 쓰는지는 이 plan에서 따로 돌리지 않았다(매 틱 수집 구조라 코드상으로만 확인).

## Deviations from Plan

### Auto-fixed Issues

없음(계획 그대로 구현). 아래는 구현 중 판단한 차이.

**1. [판단] nearest() 대신 ahead() 하나**
- plan은 `nearest`를 따로 두라고 했으나 저격수·제설병도 같은 필터가 필요해 정렬 배열을 돌려주는 `ahead()` 하나로 합쳤다. 소총수·지뢰설치병은 `[0]`.

**2. [판단] switch 표현식을 `switch (a.unit.card)`로 둠**
- 처음에 `switch (card)`로 썼다가 plan의 grep(`switch (a.unit.card)`)에 맞춰 바꿨다(동작 동일, verify 재통과).

### 확인 환경에서 겪은 것(코드 변경 없음)

- 적이 없는 시나리오는 첫 틱에 전투가 끝나 `endWave`가 취사병 부활 상태와 HP를 지웠다. 더미 보스를 두고 다시 읽었다.
- 보스를 사거리 안에 두면 충격파가 같은 열 아군을 1.5초 기절시켜 제설병 시나리오가 처음에 0으로 읽혔다(코드 결함 아님, 보스 항목은 기절이 끝난 뒤로 따로 읽음).
- 군견은 막힘 전에 열을 옮겨 제설병 시나리오에서 빠졌다(`dogMoved`를 미리 true로).
- 두 번째 Phaser Game 문제는 02-04 핸드오프대로 vite를 새로 띄우고 시나리오마다 캔버스 1개를 단언해 피했다.

## Known Stubs

없음.

## Threat Flags

없음(로컬 렌더링·계산만).

## Self-Check: PASSED

- 파일 존재: src/battle/units.ts, src/battle/fx.ts, docs/shots/M2-02-05.png, M2-02-05-snipe.png, M2-02-05-wind.png.
- 커밋 존재: 4c3fb5b, da46520, 26a4e73.
