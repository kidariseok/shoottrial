---
phase: 04-chem
plan: 01
subsystem: rules-data
tags: [tdd, chem, gas, dogPlus, pure-functions]
requires: [03-06]
provides:
  - "data.ts: CARDS.chem, SYNERGY.chem, GAS, ENEMIES.dogPlus, UNLOCK.order 끝 chem"
  - "stages.ts: WaveDef.dogPlus·gas, 웨이브 표 10행 갱신"
  - "rules.ts: gasPlan, chemReach, inChemReach, gasHits, gasCellsAfterDrop, cleanseCells, chemDamageMult, emptyGas, GasDrop, Chem, LogEvent gas_drop·gas_clear, interval(gassed)"
  - "tests/rules-chem.test.ts: 41개 테스트"
affects: [04-02, 04-03]
tech-stack:
  added: []
  patterns: ["가스 칸은 배치 구역 3x5 표(남은 시간)", "쓰러진 화학병은 입력 배열에서 빠지는 것으로 표현", "수치는 GAS 한 객체에만"]
key-files:
  created: [tests/rules-chem.test.ts]
  modified: [src/data.ts, src/stages.ts, src/rules.ts, src/battle/units.ts, tests/rules.test.ts, tests/rules-stages.test.ts, tests/rules-econ.test.ts]
key-decisions:
  - "화학병 색은 0xb0b420(노랑 계열). CONTEXT 예시 0xb8a02a는 r > g라 기존 '카드 색에 붉은 계열이 없다' 테스트에 걸린다"
  - "강화 군견 색은 0x4a4238(군견 0x6a5f50보다 진한 회갈색, 붉은 계열 판정 통과)"
  - "gasPlan에 기본값 0인 네 번째 인자 extra(?gas=1 디버그용 추가 횟수)를 더했다. 시점이 GAS.at 개수보다 많으면 순환"
  - "GAS.at([0.35, 0.7])과 GAS.size(2)도 수치라 GAS에 둔다"
requirements-completed: [CHEM-01, CHEM-02, CHEM-04, DOG-01]
metrics:
  tasks: 2
  files: 8
  tests: 201
  completed: 2026-10-22
---

# Phase 4 Plan 01: 화학병 수치와 가스 순수 함수 Summary

화학병 카드(6번째, 비용 2·HP 90·공격 6·간격 1.0·사거리 3), 가스 수치 `GAS`, 강화 군견, 웨이브 표의 화학탄 횟수와 강화 군견 마릿수, 해금 순서 끝의 화학병을 GDD와 1:1로 고정했다. 가스 일정·위치 추첨·면역·즉시 제독·주기 제독·병장 버프·가스 감속 간격은 `rules.ts` 순수 함수로 만들어 `tests/rules-chem.test.ts`로 증명했다. 04-02는 이 함수들을 import해 전투에 연결만 하면 된다.

기준 커밋(첫 커밋 직전 HEAD): `832f992`

## 커밋

| 단계 | 커밋 | 내용 |
|---|---|---|
| Task 1 RED | f098b74 | `test(04-01)`: 수치 고정·nextUnlock·spawnPlan 테스트, 기존 고정 테스트 GDD 값 갱신 |
| Task 1 GREEN | 3965ac3 | `feat(04-01)`: data.ts·stages.ts·spawnPlan·units.ts synergyCounts |
| Task 2 RED | ef61285 | `test(04-01)`: 가스 순수 함수 테스트 |
| Task 2 GREEN | b874074 | `feat(04-01)`: rules.ts 가스 함수·타입·LogEvent·interval(gassed) |

## RED 기록

- Task 1: `npx vitest run tests/rules-chem.test.ts tests/rules.test.ts tests/rules-stages.test.ts tests/rules-econ.test.ts` → 4개 파일 실패, 17개 테스트 실패(예: `§5.2 카드 표`는 `CARDS.chem` 없음으로 TypeError, `§5.4 시너지`, `§5.6 적 표`, `§5.7 웨이브 표 10행`, `UNLOCK.order`, `GDD 수치 고정 (4단계)` 전부).
- Task 2: `npx vitest run tests/rules-chem.test.ts` → 38개 중 28개 실패(새 describe 7개 전부: gasPlan, chemReach·inChemReach·gasHits, interval 가스 감속, gasCellsAfterDrop, cleanseCells, chemDamageMult, emptyGas).

## 바꾼 기존 기대값 (카드 6종·적 5종, CONTEXT가 허용한 GDD 고정값만)

- `tests/rules.test.ts`: §5.2 카드 표에 `chem` 행, §5.4 SYNERGY에 `chem: [2]`, 상점 추첨 카드 목록에 `chem`.
- `tests/rules-stages.test.ts`: ENEMY_KEYS 목록과 `dogPlus` 행, 적 색 Set 크기를 `ENEMY_KEYS.length`로, 적 크기 끝에 0.45, 웨이브 표 헬퍼 w()에 `dogPlus`·`gas`(웨이브 7 gas 1, 9 dog 4+dogPlus 4 gas 1, 10 dog 5+dogPlus 5 gas 2), spawnPlan 개수 표의 웨이브 9 dog 4·10 dog 5, 길이 공식에 dogPlus. "보스 위치 12와 25" 줄은 그대로 통과한다(단발 목록 길이가 같아 rand 호출 수가 같다).
- `tests/rules-econ.test.ts`: `UNLOCK.order`를 `['cook','miner','chem']`로, `nextUnlock`에 miner 다음 chem 케이스 추가.

## 결정

- 화학병 색 `0xb0b420`: 노랑 계열. CONTEXT 예시 `0xb8a02a`는 r > max(g, b)라 "카드 색에 붉은 계열이 없다" 테스트에 걸린다.
- 강화 군견 색 `0x4a4238`.
- `gasPlan(wave, plan, rand, extra = 0)`: `?gas=1` 디버그용 추가 횟수를 기본값 0인 네 번째 인자로 둔다. 시점은 `GAS.at`을 순환한다(웨이브 10에 +1이면 0.35T, 0.35T, 0.7T 순).
- `UI.log` 주석의 줄 수 계산을 카드 6종 기준(23줄, 1212 < 1280)으로 고쳤다(값은 그대로).

## 계획과 달라진 점

없음. 계획대로 수행했다.

## 검증

- `npm run verify` 통과: typecheck, 13개 파일 201개 테스트(이 plan 이전 173개 → 201개; tests/rules-chem.test.ts 41개 `it`), assets:check, build.
- 레인 B 불변: `git diff origin/main --stat -- src/ui src/main.ts src/debug.ts src/assets.ts src/save.ts package.json` 출력 없음.
- rules.ts에 가스 수치 리터럴(0.35·0.7·1.15) 없음, phaser·DOM·debug import 없음.
- 웨이브 1~8의 출현 목록은 바뀌지 않았다(강화 군견은 단발 목록 끝 근처에 이어 붙이고 웨이브 1~8에서는 0개라 Fisher-Yates·열 추첨의 rand 호출 수가 같다).

## Known Stubs

없음. 04-02 전까지 `ENEMIES.dogPlus`는 `enemies.ts`의 `e.type === 'dog'` 열 옮기기에 포함되지 않는다(웨이브 9~10에서 강화 군견이 열을 옮기지 않음). 같은 단계의 04-02에서 연결한다.

## Self-Check: PASSED

- `src/data.ts`, `src/stages.ts`, `src/rules.ts`, `tests/rules-chem.test.ts` 존재 확인.
- 커밋 f098b74, 3965ac3, ef61285, b874074 존재 확인.
