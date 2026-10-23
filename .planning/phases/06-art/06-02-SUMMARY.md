---
phase: 06-art
plan: 02
subsystem: battle
tags: [save, unlock, lobby, headless-check]
requires: [06-01]
provides:
  - "rules.ts: mergeUnlocked, afterRun"
  - "BattleScene: save 로드 대기(ready), 해금·최고 기록·판 수·신병 이름을 save로, 결과 생활관 -> 로비"
  - "persist.ts: removeKey (loadUnlocked/saveUnlocked 삭제)"
affects: []
tech-stack:
  added: []
  patterns: ["create는 load()를 기다린 뒤 begin()에서 판을 만든다, update는 ready 전 return", "저장 쓰기는 기다리지 않는다(void save().catch)"]
key-files:
  created: [tests/rules-save.test.ts]
  modified: [src/rules.ts, src/battle/BattleScene.ts, src/battle/persist.ts]
key-decisions:
  - "d2_unlocked는 있을 때만(readKey !== null) save로 합쳐 쓰고 지운다. 없으면 쓰기 없음"
  - "?unlock=all은 scene.unlocked만 전체로 하고 save.unlocked에는 합친 실제 목록만 둔다"
requirements-completed: [SAVE-01]
metrics:
  tasks: 3
  files: 4
  tests: 235
  completed: 2026-10-23
---

# Phase 6 Plan 02: 해금·기록·이름을 save.ts로, 결과 "생활관" -> 로비 Summary

해금 목록·최고 웨이브·판 수·신병 이름이 `localStorage d2_unlocked` 대신 `save.ts`(`d2_save_v1`)를 쓰고, 결과 화면 "생활관"은 전투 씬을 멈추고 로비(`ui.lobby()`)로 간다. 예전 `d2_unlocked`는 처음 한 번 `save.unlocked`와 합쳐 옮기고 키를 지운다. 판 기록 `d2_playlog`는 그대로 localStorage다.

## 커밋

| 단계 | 커밋 | 내용 |
|---|---|---|
| Task 1 RED | 313e886 | `test(06-02)`: mergeUnlocked·afterRun 실패 테스트 |
| Task 1 GREEN | 524b1b3 | `feat(06-02)`: mergeUnlocked, afterRun |
| Task 1 보정 | 8cd32eb | `test(06-02)`: 기대 순서를 CARD_KEYS 순서로 고침 |
| Task 2 | 15972af | `feat(06-02)`: BattleScene·persist 연결, 생활관 -> 로비 |
| Task 3 | (이 SUMMARY 커밋) | 헤드리스 확인 기록 |

## 구현 요약

- `create()`는 판 상태(시드, 상점)까지 동기로 만든 뒤 `load()`를 기다린다(실패하면 `defaultSave()`, throw 없음). 끝나면 `begin(sv, dy)`가 해금 합치기 -> 보드 -> 신병(`sv.name || ROOKIE.name`) -> 가스 -> 덱 -> `bindBattle` -> `ready = true` -> `startPrep`를 실행한다. `update`는 `!ready`면 return. `scene.ready`·`scene.sv`는 public.
- 해금: `begin`에서 `mergeUnlocked(sv.unlocked, readKey('d2_unlocked'))`. 예전 키가 있었으면 `removeKey` 후 `void save(sv)`. 웨이브 5 해금은 `sv.unlocked`를 갱신하고 저장한다. `?unlock=all`은 저장하지 않는다.
- 판 끝(`finish`, 승·패·포기 공통): `Object.assign(sv, afterRun(sv, wave))` 후 저장.
- 결과 "생활관": `scene.stop()` 후 `ui.lobby()`. "다시 출동"은 `scene.restart()` 그대로. 낡은 ponytail 주석 삭제.
- `?scene=log`는 `create()` 앞부분에서 return하므로 save를 기다리지 않는다(그대로).

## 헤드리스 확인 (S1~S4)

방식: 이 task 안에서만 띄운 vite(5199) + Chrome headless(9338), 시나리오마다 새 브라우저 컨텍스트, localStorage는 `addScriptToEvaluateOnNewDocument`로 준비. 스크립트 `/tmp/gsd06/check02.mjs`(저장소 밖). **모든 페이지에서 캔버스 1개, 페이지 오류 0건, console.error 0건.** 끝난 뒤 5199·9338 포트 비어 있음(`lsof`).

| 시나리오 | 확인 | 읽은 값 | 판정 |
|---|---|---|---|
| S1 `d2_unlocked='["cook"]'`만 있음 | `scene.unlocked` | rifle, sniper, blower, cook | 통과 |
| S1 | `d2_unlocked` 키 | null(삭제됨) | 통과 |
| S1 | `d2_save_v1.unlocked` | rifle, sniper, blower, cook | 통과 |
| S2 `d2_save_v1.name='박일병'` | 신병 `unit.name`, 카드 Text | "박일병", ["박일병"] | 통과 |
| S2b 저장 없음 | 신병 이름 | "김신병"(ROOKIE) | 통과 |
| S3 `?wave=4&god=1`, 저장 bestWave 2·runs 3 | settle 강제 -> 웨이브 5 | wave 5, newUnlock cook, 해금 저장 즉시 반영(midSave에 cook) | 통과 |
| S3 포기(`quit`) 뒤 | `d2_save_v1` | bestWave 5, runs 4, unlocked에 cook | 통과 |
| S4 결과 "생활관" 클릭(DOM) | battle 씬 | `sys.isActive()` false, `game.scene.isActive('battle')` false (status 8) | 통과 |
| S4 | 로비 DOM | `.ui-lobby-overlay.mode-lobby` 존재·hidden 아님, `.lobby-deploy-btn` 있음, 최고 기록 "웨이브 2"(포기 웨이브 1이라 max 유지), 도감 3/6 | 통과 |
| S4 로비 "출동" | battle 재시작 | `ready` true·`phase` prep, HUD `.ui-hud` 보임("웨이브 1/10 ... 준비 30초"), 캔버스 1개, 저장 runs 3 -> 4 | 통과 |

## 게이트 확인

- `npm run verify` 통과: typecheck, 16개 파일 235개 테스트(rules-save 7개 추가), assets:check, build. (06-01 때 있던 추적 안 되는 그림 fixture 문제는 지금 작업 폴더에서는 나타나지 않았다.)
- 숫자 리터럴 게이트(`src/battle/*.ts`) 합 0, 한글 코드 게이트 합 0(04-02와 같은 명령).
- 레인 B: `git diff origin/main --stat -- src/ui src/main.ts src/debug.ts src/assets.ts src/save.ts package.json public` 비어 있음. 새 의존성 없음.

## 계획과 달라진 점

- [Rule 1 - 테스트 버그] GREEN 커밋(524b1b3) 직후 테스트 2건이 실패했다. 내 테스트의 기대값이 `UNLOCK.base` 순서(rifle, blower, sniper)였고 실제 결과는 `CARD_KEYS` 순서(rifle, sniper, blower)여서다. 구현은 맞고 기대값을 고쳤다(별도 `test` 커밋). 즉 524b1b3 단독 시점에는 테스트가 2건 빨갛다.
- 계획의 "`loadUnlocked`·`saveUnlocked`는 지우거나 이전 전용으로 줄임" -> 둘 다 삭제하고 `removeKey`만 추가했다.
- `begin`을 `create`에서 분리했다(계획의 "load가 끝나면 지금의 판 만들기 실행"). `shutdown` 리스너는 로드 전에 이미 등록해 둔다.

## 알려진 한계

- ponytail: 로드가 끝나기 전에 씬이 멈추면 `begin`이 멈춘 씬에서 돈다. 로드는 즉시(localStorage) 끝나고 결과 화면은 `ready` 뒤에만 뜨므로 실제로는 일어나지 않는다. 비동기 저장소가 느려지면 가드를 둔다.

## 사람 확인 대기

<human-check> 실기기(안드로이드 Preferences) 저장 반영은 에뮬레이터에서만 확인 가능. 기다리지 않고 기록만 한다.

- URL: `npm run dev` 후 `/` (로비) -> 출동 -> 포기 -> 결과 "생활관" -> 최고 기록·도감이 갱신된 로비가 뜨는지.
- 기대: 앱 재설치 없이 다시 열어도 해금·최고 기록 유지. 처음 열 때 예전 `d2_unlocked`가 있던 사용자의 해금이 보존된다.

## Known Stubs

없음.

## Threat Flags

없음(새 네트워크·권한 없음. 저장 경계는 기존 `save.ts`를 import만 한다).

## Self-Check: PASSED

- `tests/rules-save.test.ts` 존재 확인.
- 커밋 313e886, 524b1b3, 8cd32eb, 15972af 존재 확인.
