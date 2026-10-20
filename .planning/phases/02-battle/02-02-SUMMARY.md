---
phase: 02-battle
plan: 02
subsystem: rules
tags: [rules, tdd, vitest, cards, mines, synergy]
requires: [02-01]
provides:
  - "src/rules.ts 추가: interval, sniperDamage, knockback, blowerRange, cookReach, mineTokens, hasAntiTank, pickDogLane, mineTriggered, inBlast, mineDamage (총 30개)"
affects: [02-04, 02-05, 02-06]
tech-stack:
  added: []
  patterns: ["수식은 rules.ts 한 곳, 수치는 data.ts", "pickDogLane은 동수일 때만 rand 정확히 1회(시드 재현)"]
key-files:
  created: [tests/rules-cards.test.ts, tests/rules-mines.test.ts]
  modified: [src/rules.ts]
key-decisions:
  - "mineTokens는 계급을 clampRank로 고정해 tokensByRank 인덱스 이탈을 막는다"
  - "pickDogLane은 후보가 하나이거나 아군 수가 다르면 rand를 부르지 않는다"
requirements-completed: [CARD-02, CARD-03, CARD-04, CARD-05, CARD-06, CARD-07, MINE-01, MINE-02, ENEMY-02, LOOP-04]
metrics:
  tasks: 2
  files: 3
  completed: 2026-10-20
---

# Phase 2 Plan 02: 카드 능력·지뢰·군견 열 변경 순수 계산 Summary

공격 간격(계급·시너지·데프콘 곱), 저격수 관통 감소, 밀어내기·제설 사거리, 취사 범위, 지뢰 토큰·대전차·폭발 판정·피해, 군견 열 선택을 순수 함수 11개로 만들고 TDD로 증명했다. 수치는 모두 `data.ts`에서 읽는다.

## 커밋

| 단계 | 커밋 | 내용 |
|---|---|---|
| Task 1 RED | 9829254 | `test(02-02)`: 카드 능력 실패 테스트 |
| Task 1 GREEN | 9bef25e | `feat(02-02)`: interval 외 4개 함수 |
| Task 2 RED | fa406af | `test(02-02)`: 지뢰·군견 열 실패 테스트 |
| Task 2 GREEN | b9232ea | `feat(02-02)`: 지뢰·군견 열 6개 함수 |

REFACTOR 커밋은 없다. 첫 커밋 직전 HEAD는 b9acf1a.

## RED 증거

- Task 1: `npx vitest run tests/rules-cards.test.ts`가 11개 전부 실패(함수가 export되지 않음). 종료 코드 비0.
- Task 2: `npx vitest run tests/rules-mines.test.ts`가 10개 전부 실패(같은 사유).

## 검증

`npm run verify` 종료 코드 0. typecheck 통과, vitest 8개 파일 100개 통과(이 중 새 테스트 21개), vite build 성공(번들 크기 경고는 기존과 같다).

```
Test Files  8 passed (8)
     Tests  100 passed (100)
✓ built in 1.22s
```

게이트 grep(모두 기대값):

| 검사 | 결과 |
|---|---|
| Task 1 함수 5개 export | 5 |
| `0.3072\|0.384\|62.4\|0.75` in rules-cards.test.ts | 4 |
| rules.ts `export function` 수 | 30 |
| `toBe(13)\|toBe(8)\|toBe(450)` in rules-mines.test.ts | 3 |
| rules.ts 수치 리터럴 검출(0.5 제외) | 0 |
| rules.ts의 phaser·debug·DOM·class | 0 |
| `git diff 977ba37 -- src/rules.ts` 삭제·수정 줄(import 제외) | 0 |
| src/ui·main.ts·debug.ts·assets.ts·package.json 변경(b9acf1a 대비) | 0 |

## Deviations from Plan

없음. 계획대로 실행했다. `rand() < 0.5`의 0.5는 계획의 리터럴 grep이 예외로 둔 값이다.

## Known Stubs

없음.

## Threat Flags

없음(순수 계산만).

## Self-Check: PASSED

- 파일 존재: tests/rules-cards.test.ts, tests/rules-mines.test.ts, src/rules.ts.
- 커밋 존재: 9829254, 9bef25e, fa406af, b9232ea.
