---
phase: 01-board
plan: 01
subsystem: rules-data
tags: [data, rules, tdd, vitest]
requires: []
provides:
  - "src/data.ts: LAYOUT, SPRITE_SCALE, CARD_KEYS, CARDS, RANKS, SYNERGY, ECONOMY, ROOKIE, UI"
  - "src/rules.ts: merge, stats, synergyTier, synergies, income, waveHp, rollShop, sellValue, nearestEmpty, dropOutcome"
affects: [01-02, 01-03]
tech-stack:
  added: []
  patterns: ["수치는 data.ts 한 곳", "순수 함수 + 주입 난수(rollShop)"]
key-files:
  created: [src/data.ts, src/rules.ts, tests/rules.test.ts]
  modified: []
key-decisions:
  - "카드 색은 R 성분이 G·B보다 크지 않은 임시색(녹/청/청록/올리브/보라)으로 정했다"
requirements-completed: [RULE-01, RULE-02, RULE-03, RULE-04, RULE-05, RULE-06, RULE-07]
metrics:
  tasks: 3
  files: 3
  completed: 2026-10-20
---

# Phase 1 Plan 01: data.ts 수치 표와 rules.ts 순수 함수 Summary

GDD §3·§5.2~§5.4·§6 수치를 `src/data.ts`에 1:1로 고정하고, 합성·스탯 x1.5·시너지 집계·이자 수입·웨이브 HP 스케일·시드 상점 추첨·판매 환급·가까운 빈 칸·놓기 결과를 `src/rules.ts` 순수 함수 10개로 만들어 vitest 31개로 증명했다.

## 커밋

| 단계 | 커밋 | 내용 |
|---|---|---|
| Task 1 | 5695a1b | `feat(01-01)`: data.ts 수치 표와 화면 상수 |
| Task 2 (RED) | bdd3a6d | `test(01-01)`: rules 실패 테스트 |
| Task 3 (GREEN) | 4426f71 | `feat(01-01)`: rules 구현 |

REFACTOR 커밋은 없다(정리할 부분이 없었다).

## RED 증거

`rules.ts`가 없는 상태에서 `npx vitest run tests/rules.test.ts` 실패 사유: `Failed to load url ../src/rules ... Does the file exist?` (Test Files 1 failed, no tests). 통과하지 않는 것을 확인한 뒤 GREEN으로 넘어갔다.

## TDD Gate Compliance

`test(...)` 커밋(bdd3a6d) 뒤에 `feat(...)` 커밋(4426f71)이 있다. RED/GREEN 게이트 충족.

## 검증 (npm run verify 끝부분)

```
 ✓ tests/assets.test.ts (5 tests) 4ms
 ✓ tests/debug.test.ts (5 tests) 14ms
 ✓ tests/rules.test.ts (31 tests) 5ms

 Test Files  3 passed (3)
      Tests  41 passed (41)

vite v6.4.4 building for production...
✓ 9 modules transformed.
dist/index.html                     0.47 kB │ gzip:   0.34 kB
dist/assets/index-NXTXPhU0.css      1.16 kB │ gzip:   0.54 kB
dist/assets/index-CydJFe25.js   1,693.52 kB │ gzip: 384.94 kB
✓ built in 1.40s
```

typecheck, test, build 모두 종료 코드 0. (청크 500kB 경고는 phaser 때문이며 이 plan과 무관한 기존 상태다.)

수락 기준 grep: `export const LAYOUT` 1, 텍스트 `color: '#` 1, `supply: {` 1, 8개 export 8, 비주석 `red|0xff0000` 0, rules.ts `export function` 10, phaser/debug/DOM import 0, `class ` 0, 테스트 describe 11, 리터럴(1776/2496/337.5/22.5) 4줄.

## Deviations from Plan

없음. 계획대로 실행했다. 한 가지 해석 사항이 있다.

- 계획 Task 1의 색 안내는 "황토/갈색 계열"을 예시로 들었지만, Task 2의 검사(R 성분이 G·B 중 큰 값보다 크지 않다)와 황토·갈색은 양립하지 않는다(R이 더 크다). 검사 쪽을 따라 cook은 올리브(0x8a8a3a, R=G), miner는 보라(0x6a5a8a)로 정했다. 아트 전 임시색이라 영향이 없다.
- 비주석 줄에 `red`가 포함되면 수락 기준 grep(대소문자 무시)에 걸리므로 data.ts에서 `hovered` 같은 단어를 쓰지 않았다.

## Known Stubs

없음. (ROOKIE 이름 고정은 의도된 단순화이며 `// ponytail` 주석으로 표시했고, save.ts 연결은 3단계 META-01에서 해소된다.)

## Threat Flags

없음.

## Self-Check: PASSED

- 파일 존재: src/data.ts, src/rules.ts, tests/rules.test.ts
- 커밋 존재: 5695a1b, bdd3a6d, 4426f71
