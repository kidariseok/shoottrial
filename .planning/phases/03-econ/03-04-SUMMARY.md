---
phase: 03-econ
plan: 04
subsystem: battle
tags: [unlock, persist, revive, result, restart, localStorage]
requires: [03-03]
provides:
  - "src/battle/persist.ts: readKey/writeKey/loadUnlocked/saveUnlocked (localStorage d2_unlocked, 실패 내성)"
  - "BattleScene: resetRun, unlockNext(웨이브 5), pool 스냅샷, onBaseDown/revive(판당 1회), finish -> ui.result, 재시작"
  - "data.ts: RUN.reseedStep, UI.text.bannerUnlock/bannerRevive (임시 win/lose/resultPx 삭제)"
affects: [03-05, 03-06]
tech-stack:
  added: []
  patterns: ["create()가 resetRun으로 모든 판 상태를 되돌림(필드 초기값은 생성자에서 한 번뿐)", "상점 풀 pool을 준비 단계 시작에 스냅샷해 해금이 다음 단계부터 반영"]
key-files:
  created: [src/battle/persist.ts, docs/shots/M2-03-04.png, docs/shots/M2-03-04-revive.png]
  modified: [src/battle/BattleScene.ts, src/data.ts]
key-decisions:
  - "다음 판 출현 순서는 모듈 변수 runsThisPage * RUN.reseedStep으로 시드를 옮긴다(첫 판은 ?seed 재현 유지)"
  - "onLobby는 로비가 없으므로 onAgain과 같은 재시작(ponytail 주석)"
requirements-completed: [UI-01, META-01]
duration: ~45min
completed: 2026-10-21
---

# Phase 3 Plan 04: 부활·결과 화면·웨이브 5 해금·재시작 Summary

판의 끝을 B 화면에 연결했다. 위병소 HP 0이면 판당 1회 `askRevive`(전투·트윈 정지), 승리·패배·포기는 `ui.result`와 `bindBattle(null)`로 이어지며, "다시 출동"/"생활관"은 `resetRun`으로 처음 상태를 복원한 씬 재시작이다. 웨이브 5 준비 단계에서 다음 카드(취사병 -> 지뢰설치병)가 해금되어 localStorage에 저장되고, 현재 준비 단계 상점에는 나오지 않으며 다음 준비 단계 새로 채우기부터 나온다. 레인 B 파일은 바뀌지 않았다.

기준 커밋(첫 커밋 직전 HEAD): `bb46d6f`

## 수행한 작업

| Task | 이름 | 커밋 | 파일 |
|---|---|---|---|
| 1 | persist.ts + 웨이브 5 해금(저장·pool 스냅샷·배너) | f1a590b | src/battle/persist.ts, BattleScene.ts, data.ts |
| 2 | 부활 제안·결과 화면·resetRun·시드 이동·임시 결과 글자 삭제 | 0d6b2cd | BattleScene.ts, data.ts |
| 3 | 헤드리스 확인 + 스크린샷 + 주석 정리 | 4fffee5 | docs/shots/M2-03-04*.png, BattleScene.ts(주석만) |

## 최종 검증 (`npm run verify`)

종료 코드 0(`> log; echo $?`로 직접 읽음). 꼬리:

```
 Test Files  10 passed (10)
      Tests  147 passed (147)
✓ built in 3.70s
```
(청크 500kB 경고는 기존 것. 이 plan은 순수 함수를 추가하지 않아 테스트 수는 그대로다.)

## 수용 기준 grep (기준 bb46d6f 대비)

| 검사 | 기대 | 결과 |
|---|---|---|
| persist.ts `export function (readKey\|writeKey\|loadUnlocked\|saveUnlocked)` | 4 | 4 |
| `localStorage` 참조 중 persist.ts 밖 | 0 | **1** (아래 편차 1) |
| BattleScene `(loadUnlocked\|saveUnlocked\|nextUnlock)\(` | 3 | 3 |
| `refill(this.store, this.unlocked)` / `refill(this.store, this.pool)` | 0 / 3 이상 | 0 / 3 |
| startPrep 안 순서 | refill이 unlockNext 앞 | `refill(` 136행 -> `unlockNext()` 137행 (reroll 112행·adReroll 222행의 refill은 별개) |
| 숫자 리터럴(BattleScene, persist) | 0 | 0 |
| 한글·Machine·Manager·Service·time.addEvent(주석 제외) | 0 | 0 |
| data.ts 삭제 줄 수(Task 1 기준) / 삭제 줄 중 win:, lose:, resultPx 아닌 것(Task 2 기준) | 0 / 0 | 0 / 0 (삭제는 `win`, `lose`, `resultPx` 3줄뿐) |
| `ui\.(askRevive\|result)\(` / `scene.restart()` | 2 / 2 | 2 / 2 |
| `resetRun` / `lineMarks` | 2 이상 / 4 이상 | 2 / 5 |
| `if (this.result \|\| this.paused \|\| this.modal) return` | 1 | 1 |
| `runsThisPage` / `RUN.reseedStep` | 3 이상 / 1 | 3 / 1 |
| `text.win\|text.lose\|resultPx` 합 | 0 | 0 |
| 레인 B 경로(src/ui/, main.ts, debug.ts, assets.ts, package.json) 변경 | 0 | 0 |

## 헤드리스 확인 (실제 실행, 720x1560)

방식: 내 vite(포트 5199, 수정 뒤 시작), 헤드리스 Chrome(`--headless=old`, CDP 포트 9336, Node 내장 WebSocket, 임시 프로필). 씬은 `import('/src/main.ts').game`으로 접근, 결정적 진행은 `game.scene.pause('battle')` + `scene.update(0, 100)` 반복. 시나리오마다 새 페이지(저장 유지가 필요한 A2~A4만 저장 비우기 생략). 모든 시나리오에서 JS 예외·console.error 0건, 캔버스 1개. 시작과 끝에 `localStorage.clear()`로 d2_unlocked를 비웠다. vite·Chrome 종료 확인(`pgrep` 없음).

| 항목 | 결과 | 읽은 값 |
|---|---|---|
| A 해금(`wave=5&seed=42`, 저장 비움) | 통과 | `unlocked` = ['rifle','sniper','blower','cook'], `newUnlock` 'cook', 저장 `["rifle","sniper","blower","cook"]`, `.ui-banner` '새 보직 해금: 취사병'(`kind-info`). 해금 전 채운 offers `["blower","rifle","rifle","blower","sniper"]`, `pool`에 cook 없음. 보급 99로 리롤 20번: cook 0회. 출동! -> `plan=[]` 1걸음 -> `settle` -> 15걸음 -> 웨이브 6 `prep`, `pool`에 cook, offers `["rifle","sniper","sniper","sniper","rifle"]` + 리롤 20번 중 cook 16회 |
| A 재열기 | 통과 | 두 번째: cook 이미 포함, `newUnlock` 'miner'(`pool`에는 miner 없음), 저장에 miner까지, 배너 '새 보직 해금: 지뢰설치병'. 세 번째: 5종, `newUnlock` null |
| A `unlock=all` / `wave=4` | 통과 | `wave=5&unlock=all`: 5종, `newUnlock` null, 저장 열기 전후 동일 문자열. 저장이 빈 상태에서도 저장 null 그대로. `wave=4`: 3종, `newUnlock` null, 저장 null |
| B 저장 실패 내성 | 통과 | `d2_unlocked`='not json': 기본 3종, 오류 0, 캔버스 1. `Storage.prototype.getItem/setItem`이 throw: 기본 3종으로 시작, `wave=5`에서 메모리상 4종(cook)으로 정산을 지나 웨이브 6 `prep`까지 진행, 오류 0 |
| C 승리 결과(`wave=10&god=1`) | 통과 | `go(); plan=[]; kills=7`(표시 연결 확인용으로 처치 수를 7로 설정) 1걸음 -> `result 'win'`, 열린 모달 1개: '작전 성공 — 위병소 사수', '도달 웨이브 10 / 10', '처치 수 7', '새 해금 카드 —'. `.ui-shop` `closed`, `.hud-pause-btn` `hidden`, 캔버스 Text 중 '승리'/'패배' 0 |
| C 포기+해금(`wave=5`) | 통과 | 일시정지 -> 모달 '작전 일시정지' -> '포기': `result 'lose'`, `gaveUp true`, `paused false`, `tweens.paused false`, 모달 '작전 실패', '도달 웨이브 5 / 10', '새 해금 카드 취사병' |
| D 부활(`wave=4&seed=42`) | 통과 | 열 0·1 보병 y를 방어선 직전으로: `lineUsed` [t,t,f,f,f], `lineMarks` 4(사각형+글자 2열분), HP 20. `baseHp=0` 1걸음: `modal true`, `result null`, `tweens.paused true`, 모달 '위병소 방어선 붕괴 — 긴급 부활'. 20걸음 `clock` 0.4 -> 0.4(불변). '📺 광고 보고 부활': HP 10, `lineUsed` 전부 false, `lineMarks` 0, 캔버스 '저지선 소진' Text 0, `modal false`, `tweens.paused false`, `reviveUsed true`. 20걸음 `clock` 0.4 -> 2.4, 배너 '위병소 부활 — 최후 저지선 복구'. 다시 `baseHp=0` 1걸음: 부활 모달 없이 `result 'lose'`, 결과 모달 '작전 실패' |
| D2 포기(아니오) | 통과 | 다른 페이지, 첫 HP 0 -> 부활 모달 -> '포기': 곧바로 `result 'lose'`, `modal false`, 결과 모달 '작전 실패 — 위병소 돌파됨' |
| E 재시작(C 이후 '다시 출동') | 통과 | `phase 'prep'`, `result null`, `kills 0`, `enemies 0`, `baseHp 20`, `lineUsed` 전부 false, `paused`·`modal`·`reviveUsed`·`gaveUp` false, `wave 10`, `newUnlock null`, `rerollsLeft 3`, `plan` 0개, 결과 모달 `hidden`, `.hud-pause-btn` 보임, `.ui-shop` 열림. `scene.children.list.length` 4(첫 create 직후와 같음), 캔버스 1. 재시작한 판을 `go; plan=[]`로 끝까지 진행해 `win`, 모달 '처치 수 3'. '생활관' 버튼도 같은 재시작(`prep`, `result null`, `kills 0`, children 4) |
| E2 배속·다음 판 변화·누수(`speed=2`, 포기 -> 다시 출동 3회) | 통과 | 매 재시작 후 `speed 2`, `tweens.timeScale 2`. 네 판의 출현 계획이 모두 서로 다름(첫 판 `2infantry,1infantry,4infantry,3infantry,...`, 둘째 `2infantry,1infantry,4infantry,2infantry,...`, 셋째 `3infantry,3infantry,1infantry,...`, 넷째 `3infantry,0infantry,4dog,...`), 상점 offers도 네 판 모두 다름. `input.listenerCount('pointermove')` 1, `events.listenerCount('shutdown')` 13이 첫 판과 매 재시작 후 동일, children 4 동일(누수 없음). 재시작 후 `hudCalls` 1(리셋 후 첫 호출). 같은 URL을 새로 열면 첫 판의 출현 계획이 동일(시드 재현 유지) |
| F2 `#ui` 없음 | 통과 | `#ui` 제거 후 `wave=10&god=1` 출동 -> `plan=[]` 1걸음: `result 'win'`, 오류 0. HP 0 시 `modal true`·`result null`로 멈추고 throw 없음(기대한 동작) |
| F 종합(`wave=1&god=1&speed=2&seed=42`) | 통과 | 100걸음 묶음으로 3300걸음에 `result 'win'`, 웨이브 10, 열린 모달 1개 '작전 성공 — 위병소 사수', 오류 0. 이 중 웨이브 5에서 해금이 일어나 '새 해금 카드 취사병' 표시(저장 비운 상태) |
| G 스크린샷 | 통과 | `docs/shots/M2-03-04.png`(결과 모달: 승리, 10 / 10, 처치 수 7, 새 해금 카드 —, '다시 출동'·'생활관'), `docs/shots/M2-03-04-revive.png`(부활 모달: HP 0 상태, 열 0·1 '저지선 소진' 표시와 멈춘 번쩍임 트윈이 모달 뒤에 보임). 모두 CDP `Page.captureScreenshot`(DOM 포함, 가로 밀림 없음). 눈으로 확인: 두 모달 모두 Safe Area 안 가운데에 있고 버튼 둘이 겹치지 않는다 |

## 계획 대비 편차

**1. [수용 기준 해석] `localStorage` grep이 1건 나온다 (코드 사용 아님)**
- `grep -rn "localStorage" src | grep -v persist.ts`가 `src/data.ts:313`의 03-01 때 쓴 **주석**("키는 localStorage 키")을 1건 센다. 코드에서 localStorage를 만지는 곳은 persist.ts뿐이다. 주석을 고치면 data.ts 삭제 줄이 생겨 같은 task의 "삭제 0" 기준과 충돌하므로 건드리지 않았다.

**2. [Rule 3 - 정리] `scene.restart()` 주석 문구**
- resetRun 주석에 같은 표기가 들어가 grep이 3이 되어 Task 2 커밋 뒤 주석 문구만 "씬 재시작은"으로 바꿨다(4fffee5). 동작 변경 없음.

**3. [범위 안 보강] `finish` 첫 줄에 `if (this.result) return`**
- 결과가 이미 났으면 두 번 `ui.result`를 띄우지 않게 막는 한 줄. 계획 문구에는 없지만 포기와 HP 0 판정이 겹칠 때를 위한 방어다.

그 밖의 편차 없음. 임시 결과 글자 키(`win`, `lose`, `resultPx`)는 계획대로 삭제했다.

## 확인 못 한 것 (not verified)

- 실제 광고 흐름(M4). 부활 "예"는 B가 광고 없이 바로 `onYes`를 부르는 현재 동작만 확인했다.
- 실기기 터치, 안드로이드 뒤로가기·백그라운드 소리 끄기(B/T-101 범위).
- 부활 모달이 떠 있는 동안 안드로이드 뒤로가기/일시정지 버튼 상호작용(모달 뒤 일시정지 버튼은 B DOM이 덮는지만 스크린샷으로 봤다. 클릭은 안 했다).
- 일시정지 모달이 열린 채 HP 0이 되는 경로(일시정지 중에는 update가 멈춰 발생하지 않는다고 판단, 실행하지 않음).
- 재시작 시 트윈·Phaser 내부 객체의 누수는 `children.list`와 `input`/`events` 리스너 개수로만 확인했다. GPU/텍스처 메모리는 못 봤다.
- 시드 이동(`RUN.reseedStep`)이 만드는 다음 판 출현 순서 분포가 항상 서로 다른지는 4판 표본으로만 봤다(시드 충돌은 이론상 없다고 판단).
- 이 판에서 해금된 카드가 실제 상점에서 쓰이는 구매·합성 흐름(취사병·지뢰설치병 구매 후 전투)은 이 plan에서 돌리지 않았다(03-02에서 상점 구매는 확인).
- `localStorage`가 막힌 환경에서 해금이 다음 판에 유지되지 않는 것은 설계상 당연해 따로 확인하지 않았다(그 판 안에서는 메모리 해금이 동작함을 확인).

## 알려진 사실

- `.planning/STATE.md`에 작업 시작 전부터 없던 변경이 working tree에 있다(front matter 추가). 이 plan이 만든 변경이 아니며 지시대로 건드리거나 스테이징하지 않았다.
- 결과 화면이 뜬 뒤에도 HUD 띠에는 마지막 phase(예 '교전 중')가 남는다. `bindBattle(null)`로 일시정지·속도 버튼만 숨는다(B 표시 규약).

## Known Stubs

없음. `onLobby`가 `onAgain`과 같은 재시작인 것은 로비가 M3(레인 B)에 있기 때문이며 `ponytail` 주석이 있다.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: storage | src/battle/persist.ts | 사용자가 localStorage `d2_unlocked`를 직접 바꿔 해금을 얻을 수 있다. 오프라인 싱글 게임이라 허용(`parseUnlocked`는 CARD_KEYS에 없는 값을 버린다) |

## Self-Check: PASSED

- src/battle/persist.ts, docs/shots/M2-03-04.png, docs/shots/M2-03-04-revive.png 존재 확인.
- 커밋 f1a590b, 0d6b2cd, 4fffee5 존재 확인.
- 임시 스크립트·프로필은 `/tmp/gsd0304`(저장소 밖)에만 있고, vite·Chrome 프로세스 종료를 확인했다.
