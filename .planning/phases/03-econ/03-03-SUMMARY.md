---
phase: 03-econ
plan: 03
subsystem: battle
tags: [hud, banner, card-info, battle-ctl, ui-wiring, long-press]
requires: [03-02]
provides:
  - "BattleScene: syncHud(값이 바뀔 때만 ui.hud), 배너 3종, ctl(pause/resume/setSpeed/quit/adReroll/adSupply), bindBattle"
  - "board.ts: onHold 옵션(길게 누르기 -> ui.cardInfo)"
  - "data.ts: UI.hold, UI.text.bannerIntro/Flag/Defcon (임시 HUD 키 삭제)"
affects: [03-04, 03-05, 03-06]
tech-stack:
  added: []
  patterns: ["JSON 키 비교로 값이 바뀔 때만 ui.hud 호출", "길게 누르기 취소는 pointermove 거리(임계값 0 Phaser 대응)"]
key-files:
  created: [docs/shots/M2-03-03.png, docs/shots/M2-03-03-fight.png, docs/shots/M2-03-03-safe.png]
  modified: [src/battle/BattleScene.ts, src/battle/board.ts, src/data.ts]
key-decisions:
  - "길게 누르기 취소는 dragstart가 아니라 pointermove 이동 거리(UI.hold.slop)로 한다"
  - "정보가 열린 동안(holding)에는 drag 이동을 막는다"
requirements-completed: [UI-01, UI-02]
duration: ~50min
completed: 2026-10-21
---

# Phase 3 Plan 03: HUD·배너·카드 정보·전투 제어(bindBattle) Summary

임시 캔버스 HUD를 지우고 `ui.hud()`가 값이 바뀔 때만 호출되게 했고, 배너 3종·카드 길게 누르기 정보·`bindBattle(ctl)`(일시정지·재개·2배속·포기·광고 보상 자리)을 BattleScene에 연결했다. 레인 B 파일은 바뀌지 않았다.

기준 커밋(첫 커밋 직전 HEAD): `e7d3709`

## 수행한 작업

| Task | 이름 | 커밋 | 파일 |
|---|---|---|---|
| 1 | hud·배너·bindBattle·pause/resume/quit/adReroll/adSupply, 임시 HUD 제거 | bfef853 | src/battle/BattleScene.ts, src/data.ts |
| 2 | 카드 길게 누르기 -> cardInfo (board onHold + 씬 연결) | 98676d3 | src/battle/board.ts, src/battle/BattleScene.ts |
| 2b | 길게 누르기 취소 방식 수정 (아래 편차 1) | eb2aad0 | src/battle/board.ts, src/data.ts |
| 3 | 헤드리스 확인 + 스크린샷 | (이 SUMMARY와 함께) | docs/shots/M2-03-03*.png |

## 최종 검증 (`npm run verify`)

종료 코드 0(`> log; echo $?`로 직접 읽음). 꼬리:

```
 Test Files  10 passed (10)
      Tests  147 passed (147)
✓ built in 3.74s
```
(청크 500kB 경고는 기존 것이다. 이 plan은 순수 함수를 추가하지 않아 테스트 수는 그대로다.)

## 수용 기준 grep (기준 e7d3709 대비)

| 검사 | 기대 | 결과 |
|---|---|---|
| BattleScene `showHud\|hudShown\|this\.hud\b` | 0 | 0 |
| `ui\.(hud\|bindBattle)\(` | 3 이상 | 3 |
| `ui\.banner\(` | 5 이상 | 6 |
| `useAd(Reroll\|Supply)\(` / `pauseAll\|resumeAll` | 2 / 2 | 2 / 2 |
| `hudCalls` | 2 이상 | 2 |
| data.ts 삭제 줄 중 임시 HUD 키·주석이 아닌 것 | 0 | 0 |
| BattleScene 숫자 리터럴 / 한글·Machine·Manager·Service·time.addEvent | 0 / 0 | 0 / 0 |
| board.ts `onHold` / BattleScene `onHold` | 4 이상 / 1 | 4 / 1 |
| board.ts `UI\.hold\.ms` / `delayedCall` | 1 / 1 | 1 / 1 |
| board.ts `pointerdown\|pointerupoutside\|'pointerup'` | 3 이상 | 3 |
| BattleScene `cardInfo` | 3 이상 | 3 |
| board.ts 숫자 리터럴 | 0 | 0 |
| 레인 B 경로(src/ui/, main.ts, debug.ts, assets.ts, package.json) 변경 | 0 | 0 (변경: BattleScene, board, data, docs/shots) |

## 헤드리스 확인 (실제 실행, 720x1560)

방식: 내 vite(포트 5199, 수정 뒤 재시작), 헤드리스 Chrome(`--headless=old`, CDP 포트 9335, Node 내장 WebSocket). 시나리오마다 새 페이지를 열고 `canvas` 1개를 단언했다. 씬은 `import('/src/main.ts').game`으로 접근. 결정적 진행은 `game.scene.pause('battle')` 후 `scene.update(0, 100)` 반복. E와 F2의 길게 누르기·드래그는 일시정지하지 않은 실시간 + `Input.dispatchMouseEvent`. 모든 시나리오 페이지에서 JS 예외·console.error 0건. 서버·Chrome 종료 확인(`pgrep` 없음).

| 항목 | 결과 | 읽은 값 |
|---|---|---|
| A HUD 내용 | 통과 | seed=42 준비: `.hud-wave-box` '웨이브 1/10', 배지 '데프콘 2'(`defcon-2`), 보급 '6', HP '20', `.hud-prep-pill` '준비 30초'. 배치 구역에 소총수 추가 후 한 걸음 -> `.synergy-chip.on` '소총수 ×2'. `board.promote`로 합치면 `on` 칩 0개(남은 칩 '소총수 ×1'). `wave=7`: '데프콘 1', `defcon-1`. 캔버스 Text 중 웨이브/데프콘/준비 포함 0개 |
| B 갱신 빈도 | 통과 | 준비 10걸음: hudCalls 1 -> 2(+1, 올림 초 30 -> 29가 한 번). 전투(`plan`을 `t:1e9` 더미 한 개로 교체) 첫 걸음 뒤 20걸음: 3 -> 3(+0). `supply += 1` 한 걸음: 3 -> 4(정확히 +1) |
| C 배너 | 통과 | `startPrep()` 직후 '적 침투 — 병력을 배치하라' `kind-info`. wave=5 출동!: '대규모 적 접근!' `kind-flag`. wave=7: '데프콘 1 — 칵트 피스톨' `kind-defcon`. wave=10: '대규모 적 접근!' `kind-flag`. wave=4 출동!: 전후 모두 글 '' / `hidden`(변화 없음) |
| D 일시정지·재개·속도·포기 | 통과 | `.hud-pause-btn` 보임. 누르면 `paused true`, `tweens.paused true`, 모달 '작전 일시정지'. 10걸음 `prepLeft` 29.9120 -> 29.9120(불변). 모달 '계속': `paused false`, `tweens.paused false`, 10걸음에 -1.0000. `.hud-speed-btn` 클릭: `speed 2`, `tweens.timeScale 2`, 버튼 '2x'. 같은 10걸음에 -2.0000. 일시정지 후 '포기': `paused false`, `tweens.paused false`, `result 'lose'`(임시 finish) |
| E 카드 정보(실시간) | 통과(수정 뒤) | 신병 위치 press 600ms: `.ui-card-info-backdrop` 열림, 제목 '소총수', 값 칸에 '이등병'. mouseReleased 100ms 뒤 `hidden` 생김(window mouseup 경로가 닫는다. **B에 요청할 것 없음**). 50ms 뒤 30px 움직이면 600ms 뒤에도 안 열림. 100ms 짧게 누름: 안 열림. 대기석 카드(`deck=rifle:1`, 카드 위쪽 30% 지점) 열림·닫힘. 전투 중(잠긴 카드) 길게 누르기도 열리고 닫힘 |
| E2 실제 마우스 드래그 합성(03-02 이월) | 통과 | 대기석 `bench0:rifle1` + 신병 `deploy12:rifle1김신병` -> 12단계 마우스 이동·놓기 후 `deploy12:rifle2김신병` 한 개만 남음(이름 승계). 드래그 중·뒤 카드 정보 안 열림, '진급!' 팝업 생성, 오류 0 |
| F 광고 보상 | 통과 | `.hud-supply-ad-btn` 클릭: 보급 6 -> 11, `supplyAdsLeft` 0, 두 번째 클릭 11 그대로. `.shop-btn-free-reroll` 3번: `rerollsLeft` 2, 1, 0 / 보급 11 불변 / offers 매번 바뀜. 네 번째 클릭: 전부 불변. 전투 중 클릭: `rerollsLeft` 3 그대로 |
| F2 UI 없음 내성 | 통과 | `#ui` 제거 후 실시간 길게 누르기, `pause/resume/setSpeed(2)/adSupply/adReroll/go` 호출, 정산을 지나 웨이브 2 준비까지 진행(`prep`, wave 2). 오류 0 |
| G 스크린샷 | 통과 | `docs/shots/M2-03-03.png`(준비: HUD·'적 침투' 배너·시너지 칩 '소총수 ×2'·상점·대기석), `M2-03-03-fight.png`(웨이브 3 전투 중: HUD '교전 중'·시너지 칩 '저격수 ×2' 활성·'소총수 ×1' 비활성·적 4기·상점 닫힘), `M2-03-03-safe.png`(`?safe=1`). 모두 CDP `Page.captureScreenshot`(DOM 포함, 가로 밀림 없음). 눈으로 본 것: 가운데 웨이브/데프콘, 좌측 일시정지, 우측 속도 버튼이 서로 겹치지 않고 시너지 칩은 HUD 띠 바로 아래 좌측에 있다. 헤드리스에는 노치가 없어 실제 Safe Area 침범은 못 본다 |

## 계획 대비 편차

**1. [Rule 1 - Bug] 길게 누르기 취소를 dragstart로 하면 항상 취소된다 (계획의 전제 오류)**
- **발견:** Task 3 E. 30px 움직였는데도 정보가 열리고, 드래그 중에도 열렸다.
- **원인:** 계획은 "Phaser는 드래그 임계값 0이라 조금만 움직여도 dragstart가 난다"고 가정했으나, `InputPlugin.processDragDownEvent`(임계값 0이면 상태 3으로 즉시 전환)는 **누르는 즉시** dragstart를 낸다. 그래서 dragstart를 취소 신호로 쓰면 타이머가 거는 순서에 따라 항상 취소되거나(반대 순서면) 전혀 취소되지 않는다. 실제로는 `pointerdown`이 dragstart 뒤에 와서 타이머가 안 취소됐다.
- **수정:** 취소를 `scene.input.on('pointermove')`로 옮겨 누른 지점에서 `UI.hold.slop`(12px, data.ts) 넘게 움직이면 취소한다. 또 정보가 열려 있는 동안(`holding`)에는 `drag` 이동을 막는다(Phaser가 이미 dragstart를 낸 상태라 카드를 끌 수 있었다). `dragstart` 핸들러는 원래대로 되돌렸다.
- **파일:** src/battle/board.ts, src/data.ts. **커밋:** eb2aad0
- 허용 거리 12px는 임의 값이다. 터치 실기기에서 손가락 떨림에 맞춰 조정해야 한다(`// ponytail` 주석에 적음).

그 밖의 편차 없음. 구현 선택: `onHold` 콜백은 한 줄 삼항이 아니라 if/else 블록으로 써서 `cardInfo` 줄 수 기준(3)을 맞췄다.

## 확인 못 한 것 (not verified)

- 실제 터치 기기의 길게 누르기(손가락 떨림, 멀티터치, `UI.hold.slop` 12px 적정성). 마우스 입력만 확인했다.
- 실제 노치·상태 표시줄이 있는 기기의 Safe Area. `?safe=1` 가이드선만 눈으로 봤다.
- 안드로이드 뒤로가기·백그라운드 소리 끄기(B/04 plan 범위). 이 plan에서 걸지 않았다.
- 광고 재생 중 `pause`/소리 처리(M4). `adReroll`/`adSupply`는 광고 없이 바로 보상만 적용한다.
- 카드 정보 시트의 실제 능력치 표('—'로 채워짐)는 B의 몫이다. 이름·계급만 확인했다.
- 일시정지 중 진행 중이던 트윈(합성 팝업·적 낙하)이 재개 뒤 이어지는 모습. `tweens.paused` 값만 읽었다.
- 배속 2에서의 상점·카드 정보 상호작용.
- 일시정지(`paused`) 중 `startPrep` 시 배너·HUD 갱신(HUD는 `update`가 멈춰 갱신되지 않는다, 의도).
- 결과 화면·부활·해금·판 기록은 04 plan이다. 포기는 임시 `finish(false)` 경로다.
- 03-02 SUMMARY의 알려진 B 쪽 문제(상점 패널이 1560 높이에서 대기석 띠를 약 20px 가림)는 이번 스크린샷에서도 보인다(`M2-03-03.png` 대기석 카드 아랫부분). 고치지 않았다(T-103).

## B에 요청할 것

없음. 카드 정보 닫기는 window mouseup 경로로 정상 동작했다.

## Known Stubs

없음. 포기가 임시 `finish`로 가는 것은 의도이며 04 plan이 `ui.result`로 대체한다(`ponytail` 주석). `UI.text.win`/`lose`는 임시 결과 글자용으로 남겼다.

## Threat Flags

없음. 새 네트워크·저장소 접점 없음.

## 정리

- 임시 스크립트(`/tmp/gsd0303`)·Chrome 프로파일은 저장소 밖이며 삭제하지 않았다(AGENTS.md 규칙 10, `rm -rf` 금지). 저장소 안 잔여물 없음(`git status`는 docs/shots만 추가).

## Self-Check: PASSED

- docs/shots/M2-03-03.png, M2-03-03-fight.png, M2-03-03-safe.png 존재 확인.
- 커밋 bfef853, 98676d3, eb2aad0 존재 확인.
