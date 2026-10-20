---
phase: 02-battle
plan: 01
subsystem: rules-data
tags: [data, rules, tdd, vitest, spawn, lane]
requires: []
provides:
  - "src/data.ts 추가: ENEMY_KEYS, EnemyType, ENEMIES, BOSS, DOG, BATTLE, GRID, ABILITY, SYN_FX, MINES"
  - "src/stages.ts: WaveDef, STAGE1, WAVES(10행)"
  - "src/rules.ts 추가: SpawnEvent, FlowPhase, ZoneName, spawnPlan, defconOf, canDrag, dropAllowed, allyY, blockY, frontAlly, inRange, withinReach"
affects: [02-02, 02-03, 02-04, 02-05, 02-06]
tech-stack:
  added: []
  patterns: ["수치는 data.ts/stages.ts 두 곳", "주입 난수로 시드 재현(spawnPlan)", "제네릭 frontAlly로 이후 Ally 객체를 그대로 수용"]
key-files:
  created: [src/stages.ts, tests/rules-stages.test.ts, tests/rules-lane.test.ts]
  modified: [src/data.ts, src/rules.ts]
key-decisions:
  - "종대 보병 5는 WAVES의 infantry에 더해진다(GDD §5.7 하단 문장과 일치). 웨이브 6 = 보병 17(12+5), 웨이브 9 = 보병 28(18+10)"
  - "적 색은 회갈색~청회색 임시색 4종(0x80786a, 0x6a5f50, 0x5f6b73, 0x4a5560), R이 G·B보다 32 초과로 크지 않다"
  - "BOSS.shockY는 GRID.deployTop에서 계산한다(= 4). 트리거 로직은 02-04 enemies.ts"
requirements-completed: [WAVE-01, ENEMY-01, ENEMY-02, ENEMY-03, ENEMY-04, BASE-01, LOOP-02, LOOP-04, LANE-01, DBG-02]
metrics:
  tasks: 3
  files: 5
  completed: 2026-10-20
---

# Phase 2 Plan 01: 전투 수치 표와 출현·열 판정 순수 함수 Summary

2단계가 쓰는 수치(적 4종, 보스 충격파, 군견 열 변경, 전투 흐름, 능력, 시너지 효과, 지뢰, 웨이브 10행)를 `data.ts`·`stages.ts`에 GDD와 1:1로 모으고, 시드 재현 출현 계획 `spawnPlan`과 열 판정·데프콘·드래그 허용 순수 함수 8개를 TDD로 만들었다.

## 커밋

| 단계 | 커밋 | 내용 |
|---|---|---|
| Task 1 RED | b07c63a | `test(02-01)`: GDD 수치 pin 실패 테스트 |
| Task 1 GREEN | e597bba | `feat(02-01)`: 전투 수치 표와 stages.ts |
| Task 2 RED | db64cde | `test(02-01)`: spawnPlan 실패 테스트 |
| Task 2 GREEN | 7cca373 | `feat(02-01)`: spawnPlan 구현 |
| Task 3 RED | 0823edb | `test(02-01)`: 열 판정·흐름 규칙 실패 테스트 |
| Task 3 GREEN | 43ed6a3 | `feat(02-01)`: 열 판정·흐름 규칙 구현 |

REFACTOR 커밋은 없다.

## RED 증거

- Task 1: `npx vitest run tests/rules-stages.test.ts`가 `Failed to load url ../src/stages ... Does the file exist?`로 실패(모듈 없음). 종료 코드 비0.
- Task 2: 같은 파일에 spawnPlan 테스트를 추가한 뒤 `TypeError: (0 , spawnPlan) is not a function`으로 8개 실패(spawnPlan 없음).
- Task 3: `tests/rules-lane.test.ts`가 `TypeError: undefined is not a function`, `(0 , frontAlly) is not a function` 등으로 실패(export 없음).

## 검증

`npm run verify` 종료 코드 0. typecheck 통과, vitest 5개 파일 76개 통과, vite build 성공(번들 크기 경고는 기존과 같다).

```
Test Files  5 passed (5)
     Tests  76 passed (76)
✓ built in 1.14s
```

게이트 grep 결과(모두 기대값과 같다):

| 검사 | 결과 |
|---|---|
| data.ts의 8개 export | 8 |
| stages.ts의 STAGE1·WAVES | 2 |
| `git diff 977ba37 -- src/data.ts` 삭제·수정 줄 | 0 (추가만) |
| stages.ts 코드 안 import | 0 |
| rules.ts 함수 export 수 | 19 (기존 10 + 9) |
| spawnPlan export | 1 |
| rules.ts 수치 리터럴(0.5 제외) 검출 | 0 |
| rules.ts의 phaser·debug·DOM·class | 0 |
| rules.ts 기존 줄 삭제·수정(import 제외) | 0 |
| src/ui·main.ts·debug.ts·package.json 변경 | 0 |
| `describe(` in rules-lane.test.ts | 8 |
| 3.5/5.5/6.5 포함 줄(rules-lane.test.ts) | 4 |
| `0.84` 포함 줄(rules-stages.test.ts) | 1 |

## 확인 필요 사항 (flag)

- **종대 해석**: 종대 보병 5는 표의 "보병 N"에 더해진다(GDD §5.7 하단 문장과 일치). 웨이브 6은 이벤트 26개, 웨이브 9는 이벤트 42개가 된다. 이 합산은 `WAVES`가 아니라 `spawnPlan` 결과에서 일어난다.
- **기존 테스트 수**: 계획 문구는 "기존 테스트 41개"라고 적혀 있으나 실제 `tests/rules.test.ts`는 31개다(파일 전체 통과). 내용 차이는 아니고 문구 오기로 본다.
- 종대 안 간격(0.5)은 데프콘 1에서도 그대로이고, 종대 뒤 다음 항목은 마지막 멤버 시각 + gap에서 시작한다.

## Deviations from Plan

없음. 계획대로 실행했다. 단 Task 3의 수락 기준(`3.5|5.5|6.5`가 3줄 이상)을 맞추기 위해 `allyY(2)`, `blockY(0)` 단일 값 검사 줄을 테스트에 더했다.

## Known Stubs

없음.

## Threat Flags

없음(순수 계산과 상수 추가만이고 네트워크·파일·권한 표면 변화 없음).

## Self-Check: PASSED

- 파일 존재: src/stages.ts, tests/rules-stages.test.ts, tests/rules-lane.test.ts 확인.
- 커밋 존재: b07c63a, e597bba, db64cde, 7cca373, 0823edb, 43ed6a3 모두 확인.
