---
phase: 04-chem
plan: 03
subsystem: measurement
tags: [chem, tuning-bot, gate]
requires: [04-02]
provides:
  - "04-TUNING.md: 4단계 gate 재측정(초행자 20시드, god 5시드), 3단계 대비, 성공 기준 1~4 증거 표"
affects: []
tech-stack:
  added: []
  patterns: []
key-files:
  created: [.planning/phases/04-chem/04-TUNING.md]
  modified: []
key-decisions:
  - "수치 변경 없음. 판정 기준(초행자 중앙값 >= 5, god 5/5 승리) 통과"
requirements-completed: [CHEM-03, DOG-01]
metrics:
  tasks: 2
  files: 1
  completed: 2026-10-22
---

# Phase 4 Plan 03: 화학전 뒤 튜닝 봇 재측정 Summary

04-01·04-02의 화학탄·화학병·강화 군견이 들어간 상태로 3단계 튜닝 봇 `gate`를 그대로 돌린 결과, 초행자 20시드 중앙값 5(분포 4:1, 5:11, 6:7, 7:1, 3단계와 동일)와 god 5시드 5/5 승리(stall·timeout 0)로 판정 기준을 통과했다. 수치·코드는 바꾸지 않았다.

## 게이트 수치

`node .planning/phases/03-econ/tune-bot.mjs 5199 gate` (HEAD 9709662)

`GATE firstTimerMedianWave=5 godMidMedianMin=10.47 pass=false`, `exit=1`

| 항목 | 3단계 최종 | 4단계 | 판정 |
|---|---|---|---|
| 초행자 중앙값 | 5 | 5 | 통과(기준 >= 5) |
| 초행자 분포 | 4:1, 5:11, 6:7, 7:1 | 4:1, 5:11, 6:7, 7:1 | 회귀 없음 |
| 초행자 승리 / stall·timeout | 0/20 / 0 | 0/20 / 0 | 같음 |
| god 승리 | 5/5 | 5/5 (stall·timeout 0) | 통과 |
| god mid / fast / slow | 10.50 / 8.75 / 12.25분 | 10.47 / 8.72 / 12.22분 | 참고(6~10분 밖, 3단계 결정 유지) |

종료 코드 1은 god mid가 10분을 0.47분 넘어서다. 판정 기준이 아니다(3단계 결정). 판정 상세는 `04-TUNING.md` `## 판단`.

한계: 초행자 봇 20판은 모두 웨이브 4~7에서 져서 화학탄·강화 군견 구간(7~10)을 지나지 못한다. 그 구간은 god 5판에서만 통과했다.

## 단계 전체 확인 (Task 2)

| 확인 | 결과 |
|---|---|
| `npm run verify` | 종료 코드 0, 13 파일 207 테스트 통과, 빌드 성공 |
| 레인 B 불변 `git diff origin/main...HEAD --stat -- src/ui src/main.ts src/debug.ts src/assets.ts src/save.ts package.json` | 빈 출력 (아래 참고 1) |
| `src/`·`tests/` 변경(이 plan) `git diff HEAD --name-only -- src tests` | 0건 |
| 레인 A 허용 경로 밖 변경(merge-base 기준 `origin/main...HEAD`) | 3건: `.gitignore`, `docs/GDD.md`, `docs/TECH.md` (아래 참고 2) |
| `src/battle/*.ts` 숫자 리터럴 게이트 | 합 0 |
| 한글 코드 게이트 | 합 0 |
| 금지 패턴(`*Manager`·`*Service`·react·vue) | 0건 |
| 도구 불변 `git diff origin/main --name-only -- .planning/phases/03-econ/tune-bot.mjs` | 0건 |
| 프로세스(5199 vite, 9337·9338 Chrome) | 없음 |

참고 1: 지시된 `git diff origin/main --stat ...`도 레인 B 경로에서 빈 출력이다. 다만 `origin/main`이 그 사이 `art-b1` PR #20(4커밋: `art/LEDGER.json`, `public/assets/ally_rifle_*.png`, `public/assets/index.json`)으로 앞서 있어 이 브랜치에 병합되지 않았다. 그래서 `git diff origin/main --name-only` 전체는 그 4개 파일을 "역방향 차이"로 보여 허용 경로 밖 변경 수가 7로 나온다. 이 브랜치가 만든 변경만 보려면 3점 diff(`origin/main...HEAD`)를 써야 하고 그 값이 위의 3건이다.

참고 2: 3건은 이 plan이 아니라 기획 커밋이다. `docs/GDD.md`·`docs/TECH.md`는 `832f992`(docs(04): CONTEXT·PLAN, GDD·TECH 반영), `.gitignore`는 `9709662`(node_modules 심볼릭 링크 무시). 04-03은 src·tests·docs를 고치지 않았다. 계획의 "docs 불변" 인수 조건은 이 두 기획 커밋 때문에 `origin/main` 대비로는 0이 아니다.

## 커밋

| 내용 | 커밋 |
|---|---|
| 04-TUNING.md, 04-03-SUMMARY.md | 최종 `docs(04-03)` 커밋 (autosave가 push) |

## 계획과 달라진 점

없음. 계획대로 실행했다(게이트 1회, 수치 변경 없음). 위 참고 1·2는 환경 차이(origin/main 전진, 기획 커밋)의 기록이다.

## Known Stubs

없음.

## Self-Check: PASSED

- `.planning/phases/04-chem/04-TUNING.md`: `GATE firstTimerMedianWave=` 줄, `## 4단계 성공 기준 증거` 있음
- 초행자 표 20행, god 표 5행
