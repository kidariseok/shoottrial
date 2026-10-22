---
phase: 05-fire
plan: 01
subsystem: battle
tags: [fire-support, defcon1, log, headless-check]
requires: [04-chem]
provides:
  - "data.ts: SUPPORT(2·200·1.0·5), UI 색·알파·문구(화력 지원)"
  - "rules.ts: colAt, LogEvent fire_support, summarizeLog.supportAvg"
  - "BattleScene: fireSupport/pickColumn/tickSupport/strike(dt 기반), ?support=N, 웨이브 7 흔들림"
  - "board.lock, fx.colBand, log.ts 화력 지원 평균 줄"
affects: []
tech-stack:
  added: []
  patterns: ["상태는 BattleScene 필드(support·picking·strikes), 클래스·상태 머신 없음", "시간은 update dt로만 줄임(타이머 없음)"]
key-files:
  created: [tests/rules-fire.test.ts, docs/shots/M3-05.png]
  modified: [src/data.ts, src/rules.ts, src/battle/BattleScene.ts, src/battle/board.ts, src/battle/fx.ts, src/battle/log.ts]
key-decisions:
  - "열 고르기는 scene.input pointerdown에서 colAt(worldX)로 처리하고, 그 사이 board는 lock으로 카드 집기·길게 누르기를 막는다"
  - "포격은 fightTick의 정리 단계 앞(tickMines 뒤)에서 hurtEnemy로 피해를 줘 처치 수·쓰러짐이 기존 경로와 같다"
  - "정산·판 끝에서 고르기와 남은 포격을 버린다(줄어든 횟수는 돌려주지 않는다)"
requirements-completed: [FIRE-01, FIRE-02, DEF-01]
metrics:
  tasks: 3
  files: 8
  tests: 215
  completed: 2026-10-22
---

# Phase 5 Plan 01: 화력 지원 + 데프콘 1 흔들림 Summary

전투 중 HUD "화력 지원" 버튼 -> 5열 노랑 강조(제한 5초, 판 밖 탭·시간 초과는 취소하고 횟수 유지) -> 열 탭 -> 붉은 예고선 -> 1초 뒤 그 열 살아 있는 적 전원에게 200 피해, 열 전체 폭발 + 강한 흔들림. 판당 2회이고 `fire_support {wave, col, kills}`가 판 기록에 남으며 `?scene=log`에 "화력 지원 평균 n.n회"가 나온다. 웨이브 7 전투 시작은 데프콘 배너 뒤에 `shake heavy`가 더해진다. `?support=N`으로 시작 횟수를 바꾼다.

## 커밋

| 단계 | 커밋 | 내용 |
|---|---|---|
| Task 1 RED | d29570d | `test(05-01)`: SUPPORT 수치·colAt·supportAvg 실패 테스트 |
| Task 1 GREEN | 87fc76d | `feat(05-01)`: SUPPORT, UI 색·문구, colAt, LogEvent·supportAvg |
| Task 2 | 85dbce9 | `feat(05-01)`: 전투 연결, board.lock, fx.colBand, log 줄, ?support, 데프콘 1 흔들림 |
| Task 3 | (이 문서와 같은 커밋 묶음) | 스크린샷 M3-05.png, SUMMARY |

## 헤드리스 확인 (F1~F6)

방식: 이 task 안에서만 띄운 vite(5199) + Chrome headless(9338). 시나리오마다 새 컨텍스트·새 페이지, `game.scene.pause('battle')` 후 `scene.update(0, 100)`으로 진행. 스크립트는 `/tmp/gsd05/check.mjs`(저장소 밖). **모든 페이지에서 캔버스 1개, 페이지 오류 0건.** 끝난 뒤 5199·9338 포트 비어 있음을 `lsof`로 확인.

| 시나리오 | 확인 | 기대 | 읽은 값 | 판정 |
|---|---|---|---|---|
| F1 준비 단계 | `fireSupport()` | picking 0, support 2 | phase prep, picking 0, support 2, 강조 0 | 통과 |
| F2 시작 | 열 1 hp 250·150, 열 3 hp 150 후 `fireSupport()` | picking 5, 강조 5개, board 잠금 | picking 5, 강조 5, 잠금 중 카드 누르기의 길게 누르기 타이머 0개(잠금 없을 때 1개) | 통과 |
| F2 열 선택 | 열 1을 탭(pointerdown, worldX = 열 1 중앙)으로 고름 | support 1, 예고선 | support 1, strikes 1, 예고선 active, 강조 0, 잠금 풀림 | 통과 |
| F2 0.9초 | 열 1 hp 그대로 | 250·150·150 | 250·150·150, 남은 지연 0.1 | 통과 |
| F2 1.1초 | 열 1 hp 50·처치, 열 3 150 | | a 50, b -50, c 150, strikes 0, 흔들림 진행 | 통과 |
| F2 처치·기록 | kills +1, `fire_support {col:1, kills:1}` | | kills +1, `{wave 1, col 1, kills 1}`, 남은 적 2 | 통과 |
| F3 시간 초과 | 5.1초 진행 | picking 0, support 2 | picking 0, support 2, 강조 0, strikes 0 | 통과 |
| F3 판 밖 | `pickColumn(-1)` | support 그대로 | picking 0, support 2, 강조 0, strikes 0 | 통과 |
| F3 판당 2회 | 열 선택 2번 뒤 세 번째 | support 0, 세 번째 무시 | support 0, strikes 2, 세 번째 picking 0 | 통과 |
| F4 HUD | 준비 / 전투 2 / 1 / 0 | 준비 꺼짐, ×2 켜짐, ×1 켜짐, ×0 꺼짐 | "화력 지원 ×2" disabled true / ×2 false / ×1 false / ×0 true | 통과 |
| F5 `?support=0` | 시작부터 꺼짐 | | support 0, 준비·전투 모두 disabled, `fireSupport()` 뒤 picking 0 | 통과 |
| F6 웨이브 7 | `go()` | 흔들림 진행, 배너 defcon | 시작 전 false, 시작 뒤 true, 배너 `ui-banner kind-defcon` "데프콘 1 — 칵트 피스톨" | 통과 |
| L1 기록 화면 | `drawLog`(화력 0회 판 + 3회 판) | 평균 1.5회 줄 | "화력 지원 평균", "1.5회" 텍스트 확인 | 통과 |

스크린샷: `docs/shots/M3-05.png`(Read로 직접 확인). 열 3에 붉은 예고선이 서 있고, 같은 순간 두 번째 열 고르기 강조(5열 노랑 반투명)와 HUD "화력 지원 ×1"이 켜져 있다. 적 5마리는 보병 임시 도형.

## 게이트 확인

- `npm run verify` 통과: typecheck, 14개 파일 215개 테스트(rules-fire 8개 추가), assets:check, build.
- 숫자 리터럴 게이트(`src/battle/*.ts`) 합 0, 한글 코드 게이트 합 0(04-02와 같은 명령).
- 레인 B: `git diff origin/main --stat -- src/ui src/main.ts src/debug.ts src/assets.ts src/save.ts package.json` 비어 있음. 새 의존성 없음.
- 헤드리스 뒤 정리: vite(5199)·Chrome(9338) 종료, 두 포트 비어 있음.

## 계획과 달라진 점

없음. 계획대로 수행했다. 자잘한 보정만 있었다.

- `UI.log` 높이 주석의 줄 수를 23 -> 24줄(1256 < 1280)로 고쳤다(평균 줄 추가분).
- F2는 계획의 `pickColumn(1)` 대신 실제 입력 경로(`pointerdown` 이벤트, worldX = 열 1 중앙)로 열을 골랐고, 같은 이벤트로 board 잠금도 함께 확인했다. `pickColumn(-1)`은 F3에서 직접 불렀다.

## 사람 확인 대기

<human-check> 헤드리스로 판정할 수 없는 손맛과 체감은 사람이 본다. 기다리지 않고 기록만 한다.

- URL: `npm run dev` 후 `/?scene=battle&wave=4&unlock=all&deck=rifle:4&supply=99&seed=42` 에서 배치 후 "출동!", 전투 중 HUD "화력 지원 x2" 버튼 -> 열 탭. 웨이브 7 진입은 `/?scene=battle&wave=7&seed=42&god=1`.
- 기대: (1) 버튼을 누르면 5열이 노랗게 강조되고 열 탭 시 붉은 예고선이 서며, 1초 뒤 그 열이 폭발·흔들린다. (2) 열 밖(여백)을 탭하면 취소되고 버튼 숫자가 그대로다. (3) 5초 제한이 열을 고르기에 충분한지(너무 짧거나 길지 않은지). (4) 고르는 동안 카드를 잘못 집지 않는다. (5) 배속 2배에서도 1초 지연이 어색하지 않다. (6) 웨이브 7 진입 흔들림이 경보 점멸과 겹쳐 과하지 않은지. (7) 붉은색은 예고선에만 쓰이고 피 표현이 없다.
- 아직 없는 것: GDD §5.8의 휘파람 소리(소리는 이 plan의 범위 밖).

## Known Stubs

없음.

## Threat Flags

없음(`?support=`는 URL 숫자 파라미터를 `Number()`로 읽는 디버그 값, 새 네트워크·권한·저장 경계 없음).

## Self-Check: PASSED

- `tests/rules-fire.test.ts`, `docs/shots/M3-05.png` 존재 확인.
- 커밋 d29570d, 87fc76d, 85dbce9 존재 확인.
