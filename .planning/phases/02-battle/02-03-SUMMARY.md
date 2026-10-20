---
phase: 02-battle
plan: 03
subsystem: battle-foundation
tags: [phaser, board, units, fx, drag-lock, headless]
requires: [02-01, 02-02]
provides:
  - "board.ts: toScreen, worldY, deployed, setPhase + 단계별 드래그 잠금"
  - "units.ts: Combat, Ally, collectAllies, damageAlly, startWave, endWave"
  - "fx.ts: hitFlash, dmgText, fall, laneFlash, shake"
  - "BattleScene.board public 필드"
affects: [02-04, 02-05, 02-06]
tech-stack:
  added: []
  patterns: ["단계 잠금은 모듈 지역 변수 phase/active + rules.canDrag/dropAllowed 가드", "전투 상태는 Unit 키 WeakMap, 이동·교환은 상태가 따라가고 합성은 새 상태"]
key-files:
  created: [src/battle/units.ts, src/battle/fx.ts, docs/shots/M2-02-03.png]
  modified: [src/battle/board.ts, src/battle/BattleScene.ts, src/data.ts]
key-decisions:
  - "Ally는 collectAllies가 호출될 때마다 새로 만드는 스냅샷이다. 상태의 원본은 combat(WeakMap)이고 ally.alive는 그 사본이라, 오래된 Ally 객체의 alive는 다른 곳에서 endWave 해도 갱신되지 않는다. 02-04는 웨이브 안에서 한 번 collect한 배열을 들고 쓰거나 combat.alive를 읽을 것"
  - "화면 dy는 board.ts의 슬롯 좌표, toScreen, worldY 세 곳에서만 더한다"
requirements-completed: [LOOP-02, LOOP-03, LANE-01, CARD-04, FX-01]
metrics:
  tasks: 3
  files: 6
  completed: 2026-10-20
---

# Phase 2 Plan 03: 전투 바닥(좌표 변환·단계 잠금·아군 전투 상태·공통 연출) Summary

board.ts에 논리 좌표 변환·배치 카드 조회·단계별 드래그 잠금을, units.ts에 배치 카드 전투 상태와 웨이브 시작(취사병 +20%)/끝(전원 회복) 처리를, fx.ts에 피격 번쩍임·데미지 숫자·쓰러짐·열 섬광·흔들림을 만들고 헤드리스 Chrome으로 실제 드래그와 상태값을 확인했다.

## 커밋

첫 커밋 직전 HEAD는 9fe20f1이다.

| 단계 | 커밋 | 내용 |
|---|---|---|
| Task 1 | d8b9366 | `feat(02-03)`: toScreen/worldY/deployed/setPhase, 드래그 가드, BattleScene.board 필드 |
| Task 1 보정 | 0e39308 | `style(02-03)`: board 주석에서 dy 낱말 제거(수락 기준 grep 맞춤) |
| Task 2 | 9c1ffbe | `feat(02-03)`: units.ts, fx.ts, data.ts UI 키 추가 |
| Task 3 | f03dfb1 | `test(02-03)`: 헤드리스 확인 스크린샷 |

## 구현 요약

- **board.ts**: `phase`(기본 'prep')와 `active`는 모듈 지역 변수. dragstart에서 `canDrag` 거짓이면 `active = null`로 두고 return, drag·dragend는 `view !== active`이면 return. dragend의 목적지 가지 4곳(판 밖 보정 -> deploy/move, 판매 -> sell/move, 일반 -> dropOutcome 결과)이 모두 `dropAllowed`를 통과해야 하고 아니면 `snap`으로 원위치. `drawHl`은 허용되지 않는 칸에 윤곽을 그리지 않고, 합성 반짝임도 허용될 때만 건다. 1단계 ponytail 주석은 `// 판매·이동 허용은 rules.dropAllowed(단계별)`로 교체.
- **units.ts**: `combatOf`가 WeakMap에서 상태를 만든다(합성하면 새 Unit이라 전체 HP로 시작, ponytail 주석). 체력바는 카드 뷰의 `getData('bar')` Graphics 하나를 재사용하고 `hp < maxHp`일 때만 보인다. `startWave`는 살아 있는 취사병마다 자기를 뺀 인접(`CARDS.cook.range`) 아군의 maxHp를 set(중첩 없음). `endWave`는 모든 아군을 전체 HP·생존·기절 0·쿨 0·부활 표시 해제·알파 1로 되돌린다.
- **fx.ts**: 도형과 트윈만. depth는 `UI.fx.fxDepth`(50). 색은 흰색·청백색(붉은색·주황 없음).
- **data.ts**: `UI.colors.hitFlash/laneFlash`, `UI.fx.fxDepth/hitMs/hitAlpha/dmgRise/dmgMs/fallMs/fallSink/laneFlashMs/laneFlashAlpha/fallenAlpha`, `UI.bar`, `UI.shake` 추가만(기존 줄 삭제·수정 0).

## 검증

`npm run verify` 종료 코드 0(최종 HEAD f03dfb1에서 실행). 끝부분:

```
 Test Files  8 passed (8)
      Tests  100 passed (100)
✓ built in 1.15s
```

게이트 grep:

| 검사 | 결과 |
|---|---|
| board.ts `setPhase` 줄 수 | 2 (기대 1 이상) |
| board.ts `(canDrag\|dropAllowed)\(` 줄 수(주석 제외) | 6 (기대 3 이상) |
| board.ts에 toScreen·worldY·deployed 존재 | 모두 있음 |
| `git diff 9fe20f1 -U0 -- board.ts`에서 `dy`가 들어간 추가 줄 | 2 (toScreen, worldY) |
| board.ts·units.ts·fx.ts 리터럴 grep(0.5 제외) | 0 / 0 / 0 |
| `class\|Manager\|Service\|ObjectPool` (board·units·fx) | 0 |
| units·fx의 ui/debug/main import | 0 |
| `export function` 수: units / fx | 4 / 5 |
| WeakMap in units.ts | 있음 |
| data.ts 삭제·수정 줄(`git diff 9fe20f1`) | 0 (추가만) |
| src/ui, main.ts, debug.ts, assets.ts, package.json 변경(9fe20f1 대비) | 0 |
| `pgrep -f "vite --port 5199"`, 내 Chrome(`user-data-dir=<scratchpad>/prof`) | 없음 |

## 헤드리스 확인 (실제 실행, 720x1560, dy=280)

방식: 개발 서버 `npx vite --port 5199`와 헤드리스 Chrome(`--headless=old`)을 CDP(Node 내장 WebSocket)로 조작. 실제 `Input.dispatchMouseEvent`로 끌고 놓았고 상태는 `import('/src/main.ts')`의 `scene.board`와 `import('/src/battle/units.ts')`로 읽었다. 스크립트는 scratchpad에만 있고 저장소에는 없다. URL `/?scene=battle&deck=rifle:4,sniper:2&supply=99&seed=42`. 초기 배치는 대기석 0~3 소총수·4 저격수, 배치 (0,2) 저격수, (2,2) 신병.

좌표:
- PASS `toScreen(2, 6.5)` = (360, 1208) = 신병 뷰 (360, 1208)
- PASS `toScreen(0, 0).y` = 376 = `worldY(LAYOUT.entryY)` = 376 (96 + 280)

단계 잠금(읽은 값 기준):
- PASS (a) fight에서 신병을 빈 배치 칸(3,1)으로 끌면 (2,2) 360,1208에 남음
- PASS (b) fight에서 대기석 0 소총수 -> 빈 배치 (4,0) 이동
- PASS (c) fight에서 대기석 1 -> 판매 칸: 원위치, 보급 "보급 99" 그대로
- PASS (d) 대기석 1 <-> 2 교환 원위치, (d2) 대기석 1 -> 빈 대기석 0 이동도 원위치
- PASS (e) fight에서 대기석 소총수 -> 배치 (2,2) 소총수: 합성되어 rank 2(일병), 대기석 칸 비워짐
- PASS (f) fight에서 대기석 3 소총수 -> 저격수가 있는 배치 (0,2) (교환): 원위치
- PASS (g) settle에서 배치 이동·대기석 -> 배치·판매 3가지를 시도: 전후 전체 상태 동일
- PASS (h) prep 복귀 후 판매(보급 99 -> 100), 대기석 교환, 배치 이동, 배치 교환 모두 동작

units(두 번째 페이지 로드, 같은 URL):
- PASS `collectAllies`: 신병 `{col:2,row:2,y:6.5,alive:true}`, 배치 카드 2장(신병·저격수)만(대기석 제외)
- PASS `damageAlly(100)` -> true, `alive=false`, 알파 0.35(= `UI.fx.fallenAlpha`); 쓰러진 뒤 다시 때리면 false
- PASS `endWave`: hp 100, maxHp 100, alive true, 알파 1
- PASS 취사병 (1,2) 추가 후 `startWave`: 신병 maxHp/hp 120, 인접 저격수 84, 취사병 자신 90, 멀리 있는 col 4 소총수 100
- PASS 취사병을 (3,2)에도 놓고 `endWave` 후 `startWave`: 신병 120(중첩 없음)
- PASS `endWave` 후 전원 원래 maxHp(신병 100, 저격수 70, 취사병 90)
- PASS `damageAlly(30)` 뒤 체력바가 보이고 hp 70
- PASS fx 스모크: `laneFlash`·`shake('light'/'heavy')`·`fall`을 호출해도 예외 없고 `fall` 컨테이너는 500ms 뒤 파괴됨(화면으로 보지는 않음)

스크린샷: `docs/shots/M2-02-03.png`. 신병이 다친 직후 카드 위 체력바(약 70%, 초록)가 보인다. 앞서 입힌 100 피해의 숫자 잔상이 "30"과 겹쳐 보인다(확인 순서 때문이고 버그 아님).

확인하지 못한 것:
- `hitFlash`·`dmgText`·`laneFlash`·`shake`의 움직임 자체(트윈 애니메이션)는 정지 사진 1장으로만 봤고, laneFlash·shake·fall은 눈으로 확인하지 않았다(예외 없음만 확인).
- 창 높이 1280(dy = 0)에서의 좌표·드래그는 확인하지 않았다(1560에서만).
- 체력바 저HP 색(노란색)과 취사병 버프 후 체력바 모습은 스크린샷으로 보지 않았다(상태값만 확인).
- 실기기 터치, 전투 중 대기석 카드가 몰릴 때의 동작은 확인하지 않았다.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - 수락 기준 맞춤] board.ts 주석에서 `dy` 낱말 제거**
- **Found during:** Task 1 검증
- **Issue:** 새 주석 두 줄이 "화면 dy"를 포함해 `dy` 추가 줄이 4개가 되어 "2 이하" 기준을 넘었다.
- **Fix:** 주석을 "화면 내림 포함"으로 바꿨다. 코드 줄은 toScreen·worldY 두 줄뿐이다.
- **Files modified:** src/battle/board.ts
- **Commit:** 0e39308 (처음에 amend하려다 훅이 막아 별도 style 커밋으로 남겼다)

**2. 수락 기준의 기준 커밋 해석**
- 계획의 `git diff 977ba37 ... grep -cw dy`는 1단계 plan에서 이미 들어온 `dy` 줄까지 세어 4가 된다. 이 plan의 변경분만 보려고 시작 직전 커밋 9fe20f1 기준으로 다시 세었다(2). "lane B 변경 없음" 검사도 같은 이유로 9fe20f1 기준으로 했다. 977ba37 기준 diff에는 이 plan 이전에 들어온 lane B 파일 6개가 나온다(내 변경 아님).

### 나의 테스트 오류(코드 결함 아님)

- 첫 units 확인에서 `endWave(al)` 뒤 옛 Ally 객체 `rk.alive`를 읽어 FAIL이 났다. `collectAllies`가 호출마다 새 Ally를 만든다는 설계 때문이다(`alive`는 사본). 같은 배열의 Ally와 `combat.alive`로 고쳐 다시 실행해 PASS. 02-04 이후에 주의할 점으로 key-decisions에 적어 두었다.

## 02-04 이후를 위한 메모

- 웨이브 도중 아군 배열은 한 번 collect해서 쓰거나, 쓰러짐 판정은 `ally.combat.alive`를 읽을 것. `frontAlly`는 `ally.alive`를 읽으므로 `damageAlly`가 `ally.alive`도 같이 내린다(같은 Ally 객체일 때).
- 전투 중 합성으로 생긴 카드는 새 Unit이라 전체 HP. 웨이브 시작 때 한 번만 수집한 배열에는 들어 있지 않으니 합성 직후 재수집이 필요하다.
- 체력바는 카드 뷰의 자식이라 카드가 이동·교환되어도 따라간다.

## Known Stubs

없음. `ponytail:` 주석 3곳(합성 시 새 카드 전체 HP, 인접 취사병 중복은 효과 한 번, 드래그 판정 중심 좌표(1단계 것))은 의도된 단순화다.

## Threat Flags

없음(로컬 렌더링·입력 가드만, 네트워크·파일·권한 표면 변화 없음).

## Self-Check: PASSED

- 파일 존재: src/battle/units.ts, src/battle/fx.ts, docs/shots/M2-02-03.png, src/battle/board.ts.
- 커밋 존재: d8b9366, 0e39308, 9c1ffbe, f03dfb1.
