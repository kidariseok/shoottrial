---
phase: 03-econ
plan: 05
subsystem: battle
tags: [playlog, localStorage, scene-log, wallclock, G1]
requires: [03-04]
provides:
  - "src/battle/persist.ts: loadRuns/saveRun (d2_playlog, 최근 50판, 깨진·막힌 저장소 내성)"
  - "BattleScene: runEvents 수집(run_start·wave_clear·card_buy·merge·unlock·run_end), wallSec 벽시계, finish에서 saveRun, debug.scene === 'log' 분기(logOnly)"
  - "src/battle/log.ts: drawLog(scene, runs) - ?scene=log 캔버스 표"
  - "data.ts: UI.log 배치·색, UI.text 기록 문구 19개"
affects: [03-06]
tech-stack:
  added: []
  patterns: ["필드 이름 runEvents(Scene.events 보호)", "wallSec는 update 조기 return 아래에서 누적해 일시정지·모달이 자동으로 빠진다"]
key-files:
  created: [src/battle/log.ts, docs/shots/M2-03-05-log.png, docs/shots/M2-03-05-log-1280.png, docs/shots/M2-03-05-log-real.png]
  modified: [src/battle/BattleScene.ts, src/battle/persist.ts, src/data.ts, tests/rules-econ.test.ts]
key-decisions:
  - "저장하는 PlayRun의 속성 이름은 GDD·rules 타입대로 events, 씬 필드는 runEvents"
  - "구매 0 카드는 rate 0%이고 summarizeLog 정의상 low(노랑 + ' (낮음)')로 표시된다"
requirements-completed: [LOG-01, LOG-02]
duration: ~50min
completed: 2026-10-21
---

# Phase 3 Plan 05: 판 기록 수집·저장과 ?scene=log Summary

판마다 GDD §11 이벤트 6종을 메모리에 모으고, 판이 끝나면(승리·패배·포기) `d2_playlog`에 최근 50판까지 쌓는다. `?scene=log`는 판을 만들지 않고 캔버스에 판 수·승률·평균 판 시간·평균 도달 웨이브·보직별 구매 수와 구매율·최근 10판을 그리며, 구매율 5% 미만 카드는 노랑(#ffe066) + " (낮음)"으로 표시한다. 레인 B 파일은 바뀌지 않았다.

기준 커밋(첫 커밋 직전 HEAD): `6323726`

## 수행한 작업

| Task | 이름 | 커밋 | 파일 |
|---|---|---|---|
| 1 | 이벤트 수집·벽시계·저장 | b53cf59 | src/battle/persist.ts, src/battle/BattleScene.ts |
| 2 | ?scene=log 화면(RED 테스트 -> GREEN) | ab753ef | src/battle/log.ts, BattleScene.ts, src/data.ts, tests/rules-econ.test.ts |
| 3 | 헤드리스 확인 + 스크린샷 | 190f79f | docs/shots/M2-03-05-log*.png |

## 최종 검증 (`npm run verify`)

종료 코드 0. 꼬리:

```
 Test Files  10 passed (10)
      Tests  149 passed (149)
...
dist/assets/index-C3lyQ3N3.js   1,745.79 kB | gzip: 402.57 kB
(!) Some chunks are larger than 500 kB after minification. (기존 경고)
✓ built in 3.78s
```

TDD RED: `tests/rules-econ.test.ts`에 색·문구 테스트 2개를 먼저 넣고 `npx vitest run tests/rules-econ.test.ts`를 돌려 `Tests 2 failed | 35 passed (37)`로 실패를 확인한 뒤(`UI.log`·문구 키 없음) data.ts를 추가해 37개 모두 통과.

## 게이트 grep (기준 커밋 6323726)

| 항목 | 결과 |
|---|---|
| persist.ts `export function (loadRuns\|saveRun)` | 2 |
| BattleScene `events` 필드 선언 | 0 |
| `runEvents` 등장 / `this.events.once` | 5 / 1 |
| `this.log(` / `e: '<6종>'` | 6 / 6 |
| `saveRun(` / `clearWave()` / `wallSec += ` | 1 / 3 / 1 |
| BattleScene·persist.ts 숫자 리터럴 grep, 한글·Manager 등 grep | 0 / 0 |
| log.ts 숫자 리터럴 grep, 한글·class·localStorage·ui import grep | 0 / 0 |
| `drawLog` export / `summarizeLog(` (log.ts) | 1 / 1 |
| `debug.scene === 'log'` / `logOnly` (BattleScene) | 1 / 4 |
| data.ts 삭제된 줄 수 | 0 |
| 레인 B 파일 변경(`src/ui/`, main.ts, debug.ts, assets.ts, package.json) | 0 |
| `grep -rn "localStorage" src \| grep -v "^src/battle/persist.ts" \| wc -l` | **1** (아래 참고) |

참고: 마지막 grep의 1건은 03-01에서 쓴 `src/data.ts:314`의 주석("키는 localStorage 키…")이다. 코드가 아니고 기준 커밋부터 있던 줄이다(data.ts 삭제 0줄 규칙 때문에 건드리지 않았다). 코드에서 localStorage를 쓰는 곳은 persist.ts뿐이다.

## 헤드리스 확인 (Chrome DevTools, 포트 5199, 720x1560, 걸음 `update(0,100)`)

스크립트는 /tmp/gsd0305(저장소 밖). 기대값은 localStorage JSON을 읽어 Node에서 독립 계산했고 `summarizeLog`를 import하지 않았다. 모든 항목에서 캔버스 1개, `Runtime.exceptionThrown`/console.error 0건.

- **A 이벤트 수집(LOG-01): 통과.** wave=1·god·seed=42, 라이플 2회 구매 -> 대기석 합성 -> 출동 -> 정산 -> 웨이브 2 준비에서 포기. 저장된 `d2_playlog`는 배열 1개, 키 순서 `["t","result","wave","sec","events"]`, `result:'quit'`, `wave:2`, `sec:2`. 이벤트 순서 `run_start{run:1}, card_buy{rifle,1}, card_buy{rifle,1}, merge{rifle,2}, wave_clear{wave:1, base_hp:20, supply:19}, run_end{quit, 2, 2}`. `wave_clear.supply`(19)는 정산 수입 가산 전 값이고 정산 뒤 supply는 26.
- **B 벽시계: 통과.** 20걸음 일시정지 동안 `wallSec` 0.145 -> 0.145(불변). 속도 2에서 50걸음 +5.000(시뮬레이션 시계 +10.0초), 속도 1에서 50걸음 +5.000. `modal=true`에서 20걸음 불변.
- **C 승리 한 판: 통과.** speed=2, 상점 구매 없음, 3290걸음. 저장 `result:'win'`, `wave:10`, `wave_clear` 10개(wave 1..10, base_hp 20, supply 6/12/19/26/33/43/50/57/64/71), `run_end.sec` 329 == `Math.round(wallSec 329.345)`, run_end는 1개.
- **D 해금·판 번호: 통과.** 저장소를 비우고 wave=5에서 포기: `unlock{cook, via:'wave5'}`, `run_start.run:1`. "다시 출동" 후 `runEvents` 새로 시작, run 2, `scene.events.once`가 여전히 함수(Scene.events 무사). 두 번째 판 포기 후 2판. 새 페이지에서 한 판 -> run 3, 배열 3개.
- **E 50판 상한·깨진 저장: 통과.** 50판(t=1..50)을 넣고 한 판 끝냄: 길이 50, 맨 앞 t=2, 맨 끝 새 판(run 51). `'not json'`이면 오류 없이 길이 1 배열(run 1)로 덮임. `getItem`/`setItem`이 throw하는 페이지에서도 한 판이 오류 없이 끝남.
- **F 기록 화면(LOG-02): 통과.** 12판(win 3, lose 5, quit 4)을 미리 넣고 `/?scene=log`: 제목 '판 기록', 판 수 12, 승률 25.0%, 평균 판 시간 4분 38초, 평균 웨이브 6.3 모두 독립 계산과 일치. 보직 줄(구매/구매율): 소총수 40/66.7%, 저격수 2/3.3% (낮음, #ffe066), 제설병 15/25.0%, 취사병 3/5.0%(정확히 5%, 낮음 아님, 흰색), 지뢰설치병 0/0.0% (낮음, #ffe066, 구매 0 줄 존재). 최근 판 줄 10개, 첫 줄이 가장 최근(포기·웨이브 1·0분 15초). `scene.board` 없음, `.hud-pause-btn` 안 보임, `.ui-shop`은 DOM에 없음(판을 만들지 않으므로 `closed` 대신 null로 통과 처리), 모든 Text가 x 0~720·아래 끝 1152(<1280) 안. 720x1560과 720x1280 둘 다 확인. 20회 `update(0,100)` 오류 없음. 저장소가 비었거나·깨졌거나·getItem이 throw해도 '판 기록' + '기록이 없습니다' 두 줄만 나오고 오류 없음.
- **G 종합: 통과.** 같은 프로필에서 실제로 4판을 걸음으로 끝냄(승리 / 포기 / 패배(부활 모달에서 포기) / 포기, 일부 판은 `buy()`로 구매). 저장 결과 `win/w10/329s, quit/w3/0s, lose/w4/0s, quit/w2/0s` -> `/?scene=log`에서 판 수 4, 승률 25.0%, 평균 1분 22초, 평균 웨이브 4.8, 보직별 소총수 5(55.6%)·저격수 1·제설병 2·취사병 1·지뢰설치병 0(낮음)이 독립 계산과 일치, 최근 4줄 최신 순.
- **H 스크린샷.** 눈으로 확인: 제목·요약·표·최근 판이 겹치거나 잘리지 않음, 노랑 줄(저격수, 지뢰설치병)과 " (낮음)" 표시가 보이고 붉은색 없음. 제목과 첫 요약 줄 사이가 약간 빡빡하지만(제목 40px, 줄 간격 44) 겹치지 않는다.
  - `docs/shots/M2-03-05-log.png` (12판, 720x1560)
  - `docs/shots/M2-03-05-log-1280.png` (12판, 720x1280)
  - `docs/shots/M2-03-05-log-real.png` (실제로 끝낸 4판)

정리: 포트 5199 vite와 내 Chrome(9336)을 종료했고(`pgrep` 0건), 사용자의 5173 서버는 건드리지 않았다. 확인 끝에 localStorage의 `d2_unlocked`/`d2_playlog`를 비웠다(임시 Chrome 프로필은 /tmp).

## 확인하지 못한 것 (not verified)

- 실제 기기·안드로이드 WebView에서의 `localStorage` 쓰기, 앱 재설치 후 기록 유지(M3 이후 save.ts 이전 시).
- 판 시간 6~10분(G1)과 구매율 5% 미만 카드 없음(G1): 이 계획은 측정 도구만 만들었고 G1 판정용 실제 플레이는 하지 않았다(03-06 튜닝·사용자 플레이).
- 부활 모달 중 `wallSec` 불변은 `modal=true`로 직접 세워서 확인했다(실제 `askRevive` 모달 상태에서의 시간 합계는 보지 않음).
- 구매로 즉시 합성이 일어나는 경로(merge가 card_buy보다 앞에 기록됨)는 헤드리스로 돌리지 않았다(A의 합성은 `board.promote` 직접 호출).
- 대용량(50판) 기록 화면 렌더링 시간은 재지 않았다(화면은 최근 10판만 그린다).

## 메모

- **G1 판정 전에 `localStorage.removeItem('d2_playlog')`.** `?god`, `?wave`, `?supply`, `?deck`, `?speed` 같은 디버그 판도 그대로 기록되므로 비우지 않으면 구매율·판 시간이 오염된다.
- 상점 구매로 즉시 합성이 일어나면 이벤트 순서는 `merge` -> `card_buy`다(`buyCard`가 합성(onMerge)을 먼저 하고 BattleScene이 성공 결과를 받아 `card_buy`를 기록한다). 집계(`summarizeLog`)는 순서에 의존하지 않는다. 필요하면 GDD 판정 때 순서 요구를 알려 달라.
- 구매 0 카드는 rate 0 -> `low`(summarizeLog의 `buys > 0 && rate < LOG.lowRate`)라서 노랑 + " (낮음)"으로 나온다. 의도한 동작으로 보지만 "구매 0"과 "5% 미만"을 다르게 보이고 싶다면 별도 판단이 필요하다.
- `sec`는 `Math.round(wallSec)`라 즉시 포기한 판은 0초다.

## 계획과 달라진 점

없음 - 계획대로 실행했다(Rule 1~3 자동 수정 없음). 타입 오류 1건(`px = L.px`가 `as const` 때문에 리터럴 타입 28로 추론됨)은 `px: number`로 바로잡았고 task 2 커밋에 포함됐다.

## Known Stubs

없음.

## Threat Flags

없음(새 네트워크·인증 경로 없음. localStorage 읽기는 `parsePlayLog`가 모양 검사로 방어한다).

## Self-Check: PASSED

- src/battle/log.ts, docs/shots/M2-03-05-log.png, M2-03-05-log-1280.png, M2-03-05-log-real.png 존재 확인
- 커밋 b53cf59, ab753ef, 190f79f 존재 확인
