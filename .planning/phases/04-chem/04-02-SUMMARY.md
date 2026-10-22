---
phase: 04-chem
plan: 02
subsystem: battle
tags: [chem, gas, dogPlus, headless-check]
requires: [04-01]
provides:
  - "src/battle/gas.ts: createGas, armGas, tickGas, clearGas (예고·가스 칸·제독·피해·정리)"
  - "units.ts: chemsOf, 화학병 단발 사격, 가스 감속·병장 버프, damageAlly quiet"
  - "enemies.ts: dogPlus 열 옮김·흰 테두리 2px"
  - "BattleScene: gasPlan 연결, ?gas=N, gas_drop·gas_clear 기록, 정산·판 끝 정리"
affects: [04-03]
tech-stack:
  added: []
  patterns: ["가스 상태 = 상태 객체 + 모듈 함수(클래스 없음)", "칸 표시 15개 미리 생성 후 visible만 변경", "난수 스트림 시드+3(RUN.gasSeed)"]
key-files:
  created: [src/battle/gas.ts, docs/shots/M3-04.png, docs/shots/M3-04-warn.png]
  modified: [src/data.ts, src/battle/units.ts, src/battle/enemies.ts, src/battle/BattleScene.ts]
key-decisions:
  - "병장 버프는 직접 공격 피해(단발·저격)에만 곱한다. 저격은 atk에 곱해 sniperDamage에 넣는다(결과 동일)"
  - "?gas=N은 debug.ts(레인 B)를 건드리지 않고 BattleScene에서 location.search로 읽는다(ponytail 주석)"
requirements-completed: [CHEM-01, CHEM-03, CHEM-04, CHEM-05, DOG-01]
metrics:
  tasks: 3
  files: 7
  tests: 201
  completed: 2026-10-22
---

# Phase 4 Plan 02: 화학탄·가스·화학병·강화 군견 전투 연결 Summary

04-01의 수치와 순수 함수를 전투에 연결했다. 화학탄 1.5초 전 붉은 2x2 예고가 점멸하고, 떨어지면 가스 칸 20초(겹치면 갱신)가 생기며 가볍게 흔들린다. 가스 위 비면역 아군은 간격 x2, 초당 5 피해(쓰러질 수 있다), 화학병 범위 안 아군은 면역이다. 화학병은 3초마다 제독하고, 시너지 2명이면 떨어지는 순간 범위 안 칸이 생기지 않는다. 병장 화학병 인접 아군은 직접 공격 피해 x1.15, 화학병은 사거리 3 단발 사격, 강화 군견은 군견처럼 열을 한 번 옮기고 흰 테두리 2px로 그려진다. `?gas=1`과 판 기록 gas_drop·gas_clear도 동작한다.

## 커밋

| 단계 | 커밋 | 내용 |
|---|---|---|
| Task 1 | 3f52007 | `feat(04-02)`: 화학병 사격·가스 감속·병장 버프·강화 군견 열 옮김과 테두리, UI 상수·RUN.gasSeed |
| Task 2 | 1cc36d8 | `feat(04-02)`: gas.ts(예고·가스 칸·제독·정리), BattleScene 연결, ?gas, 기록 이벤트 |
| Task 3 | 6acc6b4 | `docs(04-02)`: 스크린샷 2장 |

## 헤드리스 확인 (S1~S4)

방식: 이 task 안에서만 띄운 vite(5199) + Chrome headless(9338). 시나리오마다 새 브라우저 컨텍스트·새 페이지. `game.scene.pause('battle')` 후 `scene.update(0, 100)`으로 진행. 스크립트는 `/tmp/gsd04/check.mjs`(저장소 밖, 커밋 안 함). **모든 페이지에서 캔버스 1개, 페이지 오류 0건**(S1a, S1b, S2, S3, S4 전부).

| 시나리오 | 확인 | 기대 | 읽은 값 | 판정 |
|---|---|---|---|---|
| S1 (a) `?seed=42` | gasDrops 길이 | 0 | 0 | 통과 |
| S1 (b) `?seed=42&gas=1` | 길이, t, plan 일치 | 1, t = 2.1, gasPlan과 같음 | 1, t = 2.0999999999999996, JSON 일치(col 0, row 1) | 통과 |
| S2 웨이브 7 `gas=1` | 일정 | 길이 2, 0.35T·0.7T | 길이 2, T = 19.32, 비율 0.35·0.7, t = 6.762·13.524, gasPlan과 JSON 일치 | 통과 |
| S2 예고 | clock이 t1-1.5 이상, t1 미만일 때 예고 1개, 가스 칸 없음 | warns 1, 칸 전부 0 | clock 5.30(t1 = 6.762), warns 1, 칸 0개 | 통과 |
| S2 떨어짐 | A 범위 안 2칸 = 0, 나머지 2칸이 (19.5, 20], 이벤트, 예고 0, 표시 2, 흔들림 | gas_drop(7,0,1), gas_clear n=2 | clock 6.86, 칸 (0,1)(0,2) = 19.9, (1,1)(1,2) = 0, gas_drop wave 7 col 0 row 1, gas_clear n = 2, 예고 0, 표시 2개, shakeEffect.isRunning true | 통과 |
| S3 떨어진 뒤 | (1,0)(2,0)(1,1)(2,1) > 19.5, gas_clear 없음 | 시너지 꺼짐 | 네 칸 모두 19.9, gas_clear 0 | 통과 |
| S3 2.0초 HP | X 0, Y -10 +-0.5, Z 0 | 면역·초당 5·가스 없음 | X 0, Y -10, Z 0 | 통과 |
| S3 첫 제독 | n = 2, armGas 뒤 3.0 +-0.1초, (1,*) = 0, (2,*) > 0 | | n = 2, 3.00초, (1,0)(1,1) = 0, (2,0)(2,1) = 17.4 | 통과 |
| S3 감속 cd 최댓값 | Y 0.96, Z 0.48 | 0.8 x 0.6 x (가스 2) | Y 0.96, Z 0.48 | 통과 |
| S3 병장 버프 | Z가 한 번 쏜 뒤 열 3 보병 HP 감소 | 11.5 | 11.5 | 통과 |
| S4 웨이브 9 plan | dog / dogPlus / rpg / 보병 | 4 / 4 / 6 / 28 | 4 / 4 / 6 / 28 (총 42) | 통과 |
| S4 도형 | 몸통 isStroked, lineWidth, strokeColor, fillColor, maxHp | true, 2, 0xffffff, 0x4a4238(ENEMIES.dogPlus.color), 156.8 | true, 2, ffffff, 4a4238, 156.8, knock 1 | 통과 |
| S4 열 옮김 | dogMoved | true | true (115걸음 만에) | 통과 |
| S4 기록 | gasDrops 길이, gas_drop wave 9 | 1, wave 9 | 길이 1, gas_drop wave 9 col 0 row 1 | 통과 |
| S4 정산 정리 | phase settle 뒤 가스 칸·예고·표시 | 전부 0 | phase settle(410걸음), 칸 전부 0, 예고 0, 표시 0 | 통과 |

S2 배치(실제): 화학병 A (2,1)(2x2가 col 0~1이라 A는 오른쪽 열 바로 오른쪽, 범위가 col 1만 덮음), 화학병 B (3,0)(2x2와 거리 2 이상), 소총수 (0,1)(가스를 맞는 아군). 기본 소총수 (0,2)와 신병 (2,2)이 같이 있다.

스크린샷(Read로 직접 열어 확인):
- `docs/shots/M3-04-warn.png`: 왼쪽 두 열 x 아래 두 행(col 0~1, row 1~2) 자리에 붉은 반투명 2x2 예고가 떠 있고, 화학병 2명과 소총수가 보인다. HUD 시너지에 소총수 x3, 화학병 x2.
- `docs/shots/M3-04.png`: 예고가 사라지고 col 0의 두 칸만 황록 가스가 남았다. 화학병 옆 col 1 두 칸은 비어 있다(즉시 제독). 가스 위 소총수 체력바가 보인다.

## 게이트 확인

- `npm run verify` 통과: typecheck, 13개 파일 201개 테스트, assets:check, build.
- 숫자 리터럴 게이트(`src/battle/*.ts`) 합 0, 한글 코드 게이트 합 0.
- `gas.ts`에 `class`·Manager·Service 없음(grep 0). 함수 4개 export.
- 레인 B: 이 브랜치가 분기한 지점(merge-base) 대비 `src/ui src/main.ts src/debug.ts src/assets.ts src/save.ts package.json` diff는 비어 있다. `git diff origin/main --stat`로 보면 `src/ui/*` 4개 파일이 다르게 나오는데, 이는 origin/main에 T-104 등 레인 B 커밋이 이 브랜치 분기 뒤에 더 들어왔기 때문이다(이 plan의 변경이 아님).
- 헤드리스 뒤 정리: vite(5199)·Chrome(9338) 종료, `pgrep`·`lsof`로 두 포트와 프로세스 없음 확인.

## 계획과 달라진 점

없음. 계획대로 수행했다. 04-01 SUMMARY가 알려준 `enemies.ts`의 `e.type === 'dog'` 한 곳을 `dog || dogPlus`로 넓혀 DOG-01을 연결했다(계획 Task 1에 들어 있는 일).

## 사람 확인 대기

<human-check> 헤드리스로 판정할 수 없는 점멸·흔들림·색 구분·손맛은 사람이 본다. 기다리지 않고 기록만 한다.

- URL 1: `npm run dev` 후 `/?scene=battle&wave=7&unlock=all&deck=chem:2,rifle:4&supply=99&seed=42&gas=1`. 준비 단계에 대기석의 화학병 2장을 배치 구역의 서로 떨어진 칸에 끌어 놓고 소총수도 몇 장 놓은 뒤 "출동!".
- URL 2: `/?scene=battle&wave=9&seed=42&god=1&speed=2`.
- 기대: (1) 화학탄 1.5초 전 붉은 2x2 예고가 점멸하고, 떨어질 때 화면이 살짝 흔들리며 황록 가스 칸이 생긴다. (2) 화학병 근처 칸은 떨어지는 순간 가스가 생기지 않는다(시너지 2명). (3) 가스 칸 위 소총수는 체력바가 천천히 줄고 쏘는 간격이 눈에 띄게 느리다. (4) 웨이브가 끝나면 가스가 모두 사라진다. (5) 웨이브 9에 흰 테두리의 진한 군견이 보이고 열을 한 번 옮긴다. (6) 붉은색은 예고에만 쓰이고 피 표현이 없다. (7) HUD 시너지에 화학병이 보인다.

## Known Stubs

없음.

## Threat Flags

없음(새 네트워크·권한·저장 경계 없음. `?gas=`는 URL 숫자 파라미터를 `Number()`로 읽는 디버그 값).

## Self-Check: PASSED

- `src/battle/gas.ts`, `docs/shots/M3-04.png`, `docs/shots/M3-04-warn.png` 존재 확인.
- 커밋 3f52007, 1cc36d8, 6acc6b4 존재 확인.
