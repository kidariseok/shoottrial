---
phase: 07-combat2
plan: 01
subsystem: battle
tags: [tdd, combat2, targeting, blower, headless-check]
requires: [06-art]
provides:
  - "data.ts: COMBAT(meleeReach 1.5, pierceWidth 0.4, blowerArmor 0.8, vulnSec 2, vulnMult 1.3, minePushSec 1, minePushMult 1.5, tieEps), 제설병 HP 180·공격 4, 저격수 사거리 12, UI.colors.vulnStroke·tauntRing, UI.taunt"
  - "rules.ts: dist, pickTarget, onRay, engageTarget, blowerCone, damageTaken, allyDamageTaken, pushMult, healOrder, Pos, LogEvent combo_mine·vuln_kill"
  - "battle: 사거리 안 모든 방향 사격, 사선 관통, 도발 우선 교전, 제설병 부채꼴·취약, 지뢰 연계"
affects: [07-02]
tech-stack:
  added: []
  patterns: ["유닛 좌표를 칸 (col, y)로 통일, 거리는 hypot", "취약은 hurtEnemy 한 곳에서 곱하고 제설병 방어는 damageAlly 한 곳에서 곱한다"]
key-files:
  created: [tests/rules-combat2.test.ts, docs/shots/M4-07-01.png, .planning/phases/07-combat2/07-TUNING.md]
  modified: [src/data.ts, src/rules.ts, src/battle/units.ts, src/battle/enemies.ts, src/battle/BattleScene.ts, src/battle/fx.ts, tests/rules.test.ts, tests/rules-lane.test.ts, tests/rules-stages.test.ts]
key-decisions:
  - "취약은 제설병 부채꼴이 준 피해 뒤에 건다(첫 타 4 그대로, 이후 모든 피해 x1.3). 화상 피해에도 곱한다"
  - "열 단위 frontAlly·blockY·BATTLE.blockGap은 쓰는 곳이 없어 삭제하고 그 테스트도 지웠다"
  - "취사병은 범위 안 다친 아군 전원을 치료하되 healOrder 순서로 돈다(한 명만 치료로 줄일지는 기획 결정)"
requirements-completed: [CMB-01, CMB-02, CMB-03, CMB-04]
metrics:
  tasks: 4
  files: 13
  tests: 266
  completed: 2026-10-23
---

# Phase 7 Plan 01: 전투 2.0 규칙 — 사거리 안 모든 방향, 제설병 부채꼴·취약·도발·지뢰 연계 Summary

아군은 사거리 안 가장 가까운 적을 옆 열·대각선까지 골라 쏘고(저격수는 그 사선의 뒤쪽 적을 폭 0.4칸 안에서 모두 관통), 적은 자기 열로 걷다가 1.5칸 안에 아군이 들어오면 멈춰 도발 중인 제설병을 먼저 때린다. 제설병은 양옆 열을 포함한 부채꼴로 피해 4 + 취약(2초, 받는 피해 x1.3)을 걸고, 받는 피해가 x0.8이며, 밀린 적이 1초 안에 지뢰에 터지면 지뢰 피해가 x1.5다.

기준 커밋(첫 커밋 직전 HEAD): `2b38950`

## 커밋

| 단계 | 커밋 | 내용 |
|---|---|---|
| Task 1 RED | 6ba72dd | `test(07-01)`: 전투 2.0 순수 함수·수치 실패 테스트(35개) |
| Task 1 GREEN | 9705107 | `feat(07-01)`: COMBAT·rules 함수, 제설병 수치, 낡은 열 단위 함수·테스트 정리 |
| Task 2 | ec42979 | `feat(07-01)`: units·enemies·BattleScene·fx 연결, 스크린샷 |
| Task 3·4 보정 | e3c9695 | `fix(07-01)`: 보스 교전 예외 방지(아래 편차 1) |
| Task 3·4 기록 | (이 SUMMARY 커밋) | 07-TUNING.md, 이 SUMMARY |

참고: 9705107 단독 시점은 `tsc`가 깨져 있다(연결 전). ec42979부터 `npm run verify` 통과.

## 구현 요약

- 거리·타깃: `dist`(hypot), `pickTarget`(사거리 안 가장 가까운 적, 같으면 y 큰 쪽, 죽은 적·`gone` 제외). 소총수·지뢰설치병·화학병 단발과 소총수 2점사는 같은 대상.
- 저격수: 첫 대상은 `pickTarget`(사거리 12 = 판 전체), 뒤쪽은 `onRay`(반직선 위·대상 이상으로 먼 점·수직 거리 <= 0.4)를 거른 뒤 거리순으로 감쇠 피해(`sniperDamage` 기존 규칙). 저격선은 대각선으로 마지막 관통 대상까지 그린다(`fx.snipeLine` 끝점 인자).
- 교전: `engageTarget`(1.5칸, RPG병 3칸 안 산 아군, 도발 우선, 가까운 순, 같으면 위·왼쪽). 보스 충격파는 교전에 들어서거나 배치 구역에 들어설 때 한 번(대상 열 기절은 이전과 같음).
- 제설병: `blowerCone`(자기 열 +-1, 앞쪽 range칸). 매번 피해 4(x 계급 배율·화학병 버프) 후 `vuln = vulnSec`. 아직 안 밀린 적만 밀고(`pushedAt = clock`, 화상·`ready = 0` 포함), 받는 피해 x0.8(`damageAlly`).
- 취약: `hurtEnemy`가 `damageTaken`을 거쳐 모든 피해(아군 사격·지뢰·화력 지원)에, 화상 틱에도 x1.3. 표시는 몸통 크기 붉은 테두리(임시).
- 지뢰 연계: 지뢰 피해에 `pushMult(pushedAt, clock)`, 연계면 `combo_mine {wave}` 기록(적 1마리당 1건). 팝업 "연계!"는 07-02.
- 취사병: `healOrder`(HP 비율 낮은 순, 같으면 제설병 먼저) 순서로 치료.
- 도발 표시: 제설병 발밑 노란 타원(임시), 전투 중에만(endWave가 지운다).
- 판 기록: `vuln_kill {wave, n}`은 웨이브 끝(승리 마지막 웨이브·패배 포함)에 취약으로 죽은 적이 있을 때만 1건.

## 테스트

- `tests/rules-combat2.test.ts` 35개(COMBAT 고정, 제설병 카드 표, dist, pickTarget, onRay, engageTarget, blowerCone, damageTaken·allyDamageTaken, pushMult, healOrder).
- 기존 테스트에서 고친 것(GDD §5.1·§5.2 개정에 맞춤):
  - `tests/rules.test.ts` §5.2 카드 표: 제설병 HP 120 -> 180, 공격 0 -> 4, 저격수 사거리 Infinity -> 12. "제설병 공격은 계속 0" -> 상병 제설병 공격 4 x 2.25 = 9.
  - `tests/rules-lane.test.ts`: `blockY`·`frontAlly`(열 단위 막힘) 테스트 삭제, `inRange`는 그대로.
  - `tests/rules-stages.test.ts` §4 전투 흐름: `BATTLE`에서 `blockGap` 삭제.
- `npm run verify` 통과: typecheck, 17개 파일 266개 테스트, assets:check(35키), build. (로그 `/tmp/gsd07/verify.log`)

## 헤드리스 확인 (C1~C6)

방식: 이 task 안에서만 띄운 vite(5199) + Chrome headless(9338), 시나리오마다 새 브라우저 컨텍스트, `game.scene.pause('battle')` 후 `scene.update(0, 100)`으로 진행. 보드는 `board.place`로 카드를 직접 놓고, 신병은 필요하면 대기석으로 옮겼다. 스크립트 `/tmp/gsd07/check.mjs`(저장소 밖). **모든 페이지에서 캔버스 1개, 페이지 오류 0건.** 끝난 뒤 5199·9338 포트 비어 있음(`lsof`).

| 시나리오 | 설정 | 읽은 값 | 판정 |
|---|---|---|---|
| C1 대각선 | 소총수 (2,2) y 6.5, 보병 열 3 y 3.5(거리 3.16, 기절) | HP 60 -> 50, 탄 궤적 Line 1개 | 통과 |
| C2 도발 | 소총수 (2,2) + 제설병 (3,2), 보병 열 2 y 5.5(소총수 1.0, 제설병 1.41, 밀림 없게 knocked) | 12틱 뒤 소총수 HP 100 그대로, 제설병 180 -> 172(10 x 0.8) | 통과 |
| C3 부채꼴 | 제설병 (2,1), 열 1·2·3 y 4.0 보병 | HP 1000 -> 996 셋 모두, knocked 셋 모두, knockLeft 1, `vuln` 2, pushedAt 0.1 | 통과 |
| C4 취약 | 취약 적과 일반 적에게 소총 10 | 취약 적 987(-13 = 10 x 1.3). 일반 적은 1000(소총수가 가장 가까운 한 마리만 쏘므로 맞지 않았다) | 통과 |
| C5a 지뢰 연계 순수 | 지뢰 (2,1), 보병 y 3.2, pushedAt을 직접 0.05로 | 피해 225(150 x 1.5), `combo_mine` 1건, 지뢰 소모 | 통과 |
| C5b 실제 경로 | 제설병 (2,0) + 지뢰 (2,1), 보병 y 3.2 | 피해 296.5 = 제설병 4 + 225 x 1.3(밀린 적은 취약이라 지뢰도 x1.3), `combo_mine` 1건 | 통과(아래 편차 2) |
| C5c 대조 | 지뢰만, 밀린 적 아님 | 피해 150, `combo_mine` 0건 | 통과 |
| C6 통과 없음 | 소총수 (2,2) y 6.5, 보병 열 2 y 4에서 8초 걷게 | 최대 y 5.015(정지 거리 1.485 = 근접 1.5), 소총수 HP 100 -> 50(5회 피격), 위병소 HP 20 | 통과 |
| V1 저격 관통 | 저격수 (0,2), 보병 (1,5.5)·(2,4.5)·(4,2.5)(모두 같은 사선) | HP 1000 -> 940·952·964(60 / 48 / 36, 감쇠 -20%씩) | 통과 |

스크린샷: `docs/shots/M4-07-01.png`(Read로 직접 확인). 소총수 둘의 노란 탄 궤적(수직 하나, 대각선 하나), 저격수의 흰 대각선 저격선, 제설병 발밑 노란 고리, 취약 보병 둘의 붉은 테두리가 보인다. 탄 궤적은 트윈이 멈춘 상태라 `scene.tweens.update(time, 5)`로 시작시킨 뒤 찍었다.

## 게이트 확인

- 숫자 리터럴 게이트(`src/battle/*.ts`) 합 0, 한글 코드 게이트 합 0(04-02와 같은 명령).
- 레인 B diff(`src/ui src/main.ts src/debug.ts src/assets.ts src/save.ts src/audio.ts package.json public`) vs origin/main: 비어 있음. 새 의존성 없음.
- 헤드리스·튜닝 뒤 정리: vite(5199)·Chrome(9338, 9337) 종료, 포트 비어 있음(`lsof`). 5173 vite·안드로이드 에뮬레이터는 건드리지 않았다.

## 튜닝 재측정 (07-TUNING.md)

`tune-bot.mjs 5199 gate`를 수치 변경 없이 1회(보스 예외 수정 후): **초행자 20시드 중앙값 10(20/20 승리, 위병소 HP 20이 19시드), god 5/5 승리, mid 7.05분, GATE pass=true.** 기준(>= 5, 5/5)은 통과했지만 이전(중앙값 5, 승리 0)과 비교해 난이도가 크게 쉬워졌다. 수치는 바꾸지 않았다. 자세한 값과 원인 가설은 `07-TUNING.md`.

## 계획과 달라진 점

1. **[Rule 1 - 버그, 잠복] 보스 교전 예외.** 첫 튜닝 실행이 `artKey('enemy', 'boss', 'act')`(`ART.enemy`에 boss 없음)로 `TypeError`를 던졌다. 06-01 이후 보스가 아군을 때리는 순간 누구나 죽는 오류였고 이번 변경이 만든 것은 아니지만 튜닝(Task 4)을 막아 `enemies.ts`에서 보스는 `playAct`를 건너뛰게 고쳤다(e3c9695). 이전 규칙에서도 같은 호출이었다. 실제 웨이브 5 보스 교전에서도 터졌을 것이다.
2. **C5 값 225 대신 296.5(실제 경로).** 계획 C5는 "피해 225(150 x 1.5)"였다. 제설병이 밀면 같은 적이 취약(x1.3)이 되고 취약은 "받는 모든 피해"라 실제 경로는 4 + 292.5 = 296.5다. 계획의 225는 취약이 없는 경우(C5a, pushedAt 직접 설정)로 증명했고 C5b는 실제 경로의 296.5로 증명했다. 취약이 지뢰에도 곱해지는 것이 의도인지 기획 확인이 필요하다.
3. 저격수 사거리: 계획 "판 전체 크기 값" -> `12`(판 대각선 약 8.6보다 큼). `Infinity`를 12로 바꿔 `tests/rules.test.ts` 고정값도 바꿨다.
4. `frontAlly`·`blockY`·`BATTLE.blockGap`(열 단위 막힘)을 삭제했다. 계획은 "기존 테스트 중 '같은 열만' 가정이 깨지면 기대값을 고친다"였고 이 셋은 호출처가 없어져 죽은 코드라 테스트와 함께 지웠다.
5. 근접 거리: 계획 문장은 "근접 거리 1.5면 같은 열 바로 위 칸(거리 1)에서 멈춘다"였으나 실제로는 `dist <= 1.5`가 되는 첫 틱에 멈춰 정지 거리가 약 1.5다(C6: 5.015, 아군 y 6.5와 1.485). GDD §5.1("근접 거리 1.5칸 안에 들어오면 멈추고")과 일치한다. 이전의 blockGap 방식(정지 거리 1.0)보다 적이 반 칸 일찍 선다. 통과(아군 칸 진입)는 없다.
6. 취사병 `healOrder`: 현재 치료는 범위 안 다친 아군 전원에게 한 틱에 12씩이라 순서가 효과에 영향을 주지 않는다(표시·처리 순서만). GDD "먼저"가 한 명만 치료를 뜻하는지는 불명확해 동작은 그대로 두고 순서만 붙였다.
7. 취약은 화상(상병 제설병) 피해에도 곱한다(계획의 "모든 피해").
8. `vuln_kill`은 계획의 "취약 상태에서 죽은 적 수"를 웨이브당 합계 1건 `{wave, n}`으로 기록(처치마다 1건이면 기록이 커진다).

## 알려진 한계

- ponytail: 취약·도발 표시는 임시 도형이다(07-02에서 다듬는다). 도발 고리는 전투 중 합성으로 생긴 제설병에는 다음 틱부터 붙는다.
- ponytail: 지뢰 연계 판정은 적마다 "처음 밀린 시각" 하나만 기록한다(`knocked`가 적마다 1회라 같다).
- 레인 B가 카드 정보 창에서 `CARDS.sniper.range`·제설병 공격을 보여 준다면 값이 바뀐 것을 알아야 한다(`src/ui`는 `.range`를 읽지 않음, grep 0건).

## 사람 확인 대기

<human-check> 손맛·체감은 사람이 본다. 기다리지 않고 기록만 한다.

- URL: `npm run dev` 후 `/?scene=battle&wave=3&unlock=all&deck=rifle:4,blower:2,sniper:1&supply=99&seed=42` 에서 배치 후 "출동!".
- 기대: (1) 소총수가 옆 열·대각선 적도 쏜다. (2) 적이 아군 옆 열 근처에서도 멈춰 때린다. (3) 제설병 앞 3열의 적이 한꺼번에 밀리고 붉은 테두리가 2초 뜬다. (4) 적이 제설병을 우선 때린다. (5) 난이도가 너무 쉽지 않은가(튜닝 결과 참고).

## Known Stubs

없음.

## Threat Flags

없음(새 네트워크·권한·저장 경계 없음).

## Self-Check: PASSED

- 파일 존재: `tests/rules-combat2.test.ts`, `docs/shots/M4-07-01.png`, `07-TUNING.md`, 이 SUMMARY.
- 커밋 6ba72dd, 9705107, ec42979, e3c9695 존재 확인(`git log`).
