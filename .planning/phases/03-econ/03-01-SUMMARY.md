---
phase: 03-econ
plan: 01
subsystem: rules
tags: [rules, data, econ, unlock, playlog, tdd]
requires: []
provides:
  - "rules.ts: buyOutcome, nextUnlock, parseUnlocked, summarizeLog, pushRun, parsePlayLog, nextRun + Spot/Placed/BuyStep/BuyOutcome/RunResult/LogEvent/PlayRun/LogSummary 타입"
  - "data.ts: UNLOCK, REWARD, LOG 상수"
affects: [03-02, 03-03, 03-04, 03-05, 03-06]
tech-stack:
  added: []
  patterns: ["순수 함수 + 문자열 입력(localStorage는 호출 쪽)", "입력 불변 시뮬레이션"]
key-files:
  created: [tests/rules-econ.test.ts]
  modified: [src/rules.ts, src/data.ts]
key-decisions:
  - "buyOutcome 연쇄: 승격 칸이 병장 미만이고 같은 카드·같은 계급의 다른 칸이 있으면 합친다. 살아남는 칸은 배치 구역 우선, 같은 구역이면 번호가 작은 칸"
  - "parseUnlocked 결과는 항상 CARD_KEYS 순서(상점 난수 재현성). UNLOCK.base는 GDD 표기 순서대로 두고 순서 정렬은 CARD_KEYS로 한다"
requirements-completed: [ECON-02, META-01, LOG-01, LOG-02]
duration: ~10min
completed: 2026-10-21
---

# Phase 3 Plan 01: 구매 판정·해금·판 기록 순수 계산 Summary

구매 가능/즉시 합성 연쇄(buyOutcome), 해금 순서·저장값 복원, 판 기록 집계·보관·복원을 rules.ts에 테스트 먼저로 만들고, GDD §7·§10·§11 수치를 data.ts에 고정했다.

기준 커밋(작업 시작 직전 HEAD): `f2aace93bda5bcddf6c70585fe5bac9f4dad6833`

## 수행한 작업

| Task | 이름 | 커밋 | 파일 |
|---|---|---|---|
| 1 | buyOutcome · nextUnlock · parseUnlocked + UNLOCK/REWARD/LOG | 658f9ce | src/rules.ts, src/data.ts, tests/rules-econ.test.ts |
| 2 | summarizeLog · pushRun · parsePlayLog · nextRun | d2a9523 | src/rules.ts, tests/rules-econ.test.ts |

## TDD 증거 (RED -> GREEN)

- Task 1 RED: 테스트 파일만 있고 구현 없음. `npx vitest run tests/rules-econ.test.ts` 가 `Tests 21 failed (21)`, 종료 코드 1(`!`를 붙이면 0). GREEN: `21 passed (21)`.
- Task 2 RED: 테스트를 추가한 뒤 `Tests 14 failed | 21 passed (35)`, 종료 코드 1(새 describe만 실패). GREEN: `35 passed (35)`.
- 테스트 파일은 두 커밋에 나눠 담았다(Task 1 커밋에는 Task 1 테스트만 있다). 별도로 RED 상태를 커밋하지는 않았다(RED는 실행으로만 확인, 커밋은 GREEN 시점).

## 최종 검증 (`npm run verify`)

종료 코드 0. 꼬리:

```
 Test Files  9 passed (9)
      Tests  135 passed (135)
✓ built in 1.35s
```
(기존 100개 + 신규 35개. 기존 ECONOMY 고정 테스트 포함 통과. 빌드의 청크 500kB 경고는 기존 것이다.)

## 수용 기준 grep (기준 커밋 f2aace9 대비)

| 검사 | 기대 | 결과 |
|---|---|---|
| `grep -Ec "^export function (buyOutcome\|nextUnlock\|parseUnlocked)" src/rules.ts` | 3 | 3 |
| `grep -Ec "^export const (UNLOCK\|REWARD\|LOG)\b" src/data.ts` | 3 | 3 |
| `git diff f2aace9 -U0 -- src/data.ts \| grep '^-[^-]' \| wc -l` (data.ts 삭제 줄) | 0 | 0 |
| rules.ts에서 phaser/debug/document/window import 검사 | 0 | 0 |
| `grep -c ECONOMY tests/rules-econ.test.ts` | 0 | 0 |
| `grep -Ec "^export function (summarizeLog\|pushRun\|parsePlayLog\|nextRun)" src/rules.ts` | 4 | 4 |
| `grep -Ec "^export type (RunResult\|LogEvent\|PlayRun\|LogSummary)" src/rules.ts` | 4 | 4 |
| rules.ts에서 localStorage/phaser/debug 검사 | 0 | 0 |
| rules.ts의 0.05·50 리터럴 검사 | 0 | 0 |
| `git diff f2aace9 --name-only` | rules.ts, data.ts, rules-econ.test.ts | 정확히 그 셋 |
| 레인 B 경로(src/ui/, main.ts, debug.ts, assets.ts, package.json) 변경 | 0 | 0 |

## 계획 대비 편차

없음. 계획대로 실행했다. (참고: `LOG` import는 Task 1 단계에서 쓰이지 않아 typecheck 경고를 피하려고 Task 2에서 추가했다.)

## Known Stubs

없음.

## Threat Flags

없음. 화면·localStorage·네트워크 접점이 없는 순수 계산이다. 저장값 파싱 함수(parseUnlocked, parsePlayLog)는 깨진 입력에도 throw하지 않는다.

## 이후 plan을 위한 메모

- `buyOutcome`의 `units`는 board.units() 순서(대기석 번호 순 -> 배치 구역 번호 순)를 가정한다. 호출 쪽(02~)이 이 순서를 지켜야 한다.
- BuyStep은 순서대로 적용한다: `promote` 칸 계급 +1, `remove`가 있으면 그 칸을 치운다. 첫 단계는 새로 산 카드가 칸을 차지하지 않고 기존 이등병이 오른다.
- `summarizeLog`는 평균을 반올림하지 않는다. 분:초·퍼센트 포맷은 표시 쪽에서 한다.

## Self-Check: PASSED

- tests/rules-econ.test.ts, src/rules.ts, src/data.ts 존재 확인.
- 커밋 658f9ce, d2a9523 존재 확인.
