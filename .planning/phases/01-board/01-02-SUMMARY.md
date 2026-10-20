---
phase: 01-board
plan: 02
subsystem: battle-board
tags: [phaser, board, graphics, debug-url]
requires: [01-01]
provides:
  - "src/battle/board.ts: createBoard, deployIndex, drawRank, Unit, Zone, Slot, Board"
  - "src/battle/BattleScene.ts: dy 전달, 판 생성, 신병 배치, ?deck, ?supply 보급 텍스트"
affects: [01-03]
tech-stack:
  added: []
  patterns: ["판 전체를 layer 컨테이너 하나로 dy만큼 내림", "칸 목록(slots)이 plan 03 히트 판정의 단일 출처"]
key-files:
  created: [src/battle/board.ts, docs/shots/M2-01-02.png]
  modified: [src/battle/BattleScene.ts, src/data.ts]
key-decisions:
  - "카드 도형 치수·격자선 굵기가 계획에 없어 data.ts에 UI.card, UI.stroke 상수만 추가했다(리터럴 금지 규칙 준수)"
requirements-completed: [BOARD-01, BOARD-05, DBG-01]
metrics:
  tasks: 2
  files: 4
  completed: 2026-10-20
---

# Phase 1 Plan 02: 판 그리기·신병·디버그 덱 Summary

`board.ts`가 720x1280 판(적 진입 2행, 지뢰 5x2, 배치 5x3, 방어선, 대기석 5칸 + 판매 칸)과 칸 목록(deploy 15 + bench 5 + sell 1)·카드 도형을 만들고, `BattleScene`이 dy를 넘겨 판을 생성한 뒤 신병과 `?deck`, `?supply`를 적용한다. 드래그는 plan 03.

## 커밋

| 단계 | 커밋 | 내용 |
|---|---|---|
| Task 1 | 7112f19 | `feat(01-02)`: board.ts + data.ts UI.card·UI.stroke |
| Task 2 | 64d7b4b | `feat(01-02)`: BattleScene |

(스크린샷 `docs/shots/M2-01-02.png`와 이 SUMMARY는 메타 커밋 대상이다.)

## dy 사용 지점 (board.ts, 줄 번호)

- 35: `const layer = scene.add.container(0, dy)` (판 전체)
- 48: `const entryTop = LAYOUT.hudH - dy` (진입 구역 위 끝 보정)
- 73, 79: 칸 중심 월드 좌표 계산(배치 칸 / 대기석·판매 칸). 카드 뷰가 layer 밖이라 여기서 한 번 더한다
- BattleScene은 `dy`를 계산에 쓰지 않고 `createBoard`에 넘기기만 한다.

## 검증

`npm run verify` 끝부분(종료 코드 0):

```
 Test Files  3 passed (3)
      Tests  41 passed (41)
vite v6.4.4 building for production...
✓ 11 modules transformed.
dist/assets/index-BU9s7b7t.js   1,697.81 kB │ gzip: 386.70 kB
✓ built in 1.14s
```

(청크 500kB 경고는 phaser 때문이며 기존 상태다.)

수락 기준 grep 결과:

| 검사 | 결과 |
|---|---|
| export 7개(타입 4 + 함수 3) | 7 |
| board.ts 좌표 리터럴(비주석, 단어 경계) | 0 |
| board.ts + BattleScene 좌표 리터럴 | 0 |
| board.ts + BattleScene 색 리터럴(`0x......`, `'#..`) | 0 |
| `scene.add.container(0, dy)` | 1 |
| BattleScene의 `dy +/-` 계산 | 0 |
| `class `·Manager·Service(board.ts, 비주석) | 0 |
| `from '../data'` | 1 |
| BattleScene `debug.(deck|supply)` | 2 |
| BattleScene `ROOKIE` / `UI.supply` / `createBoard(` | 2 / 1 / 1 |
| `git diff`에 src/main.ts, src/debug.ts, src/ui/ | 없음 |

## 시각 확인

- 스크린샷: `docs/shots/M2-01-02.png` — 로컬 vite(`--port 5199`) + 헤드리스 Chrome(`--headless=old --window-size=720,1560`)으로 `/?scene=battle&deck=rifle:4,sniper:2&supply=99`를 찍었다. 개발 서버는 끝낸 뒤 종료했다.
- 요청한 390x844는 찍지 못했다. 헤드리스 Chrome이 창 폭 약 500 이하를 받아주지 않아 캔버스가 잘려 나왔다(찍힌 사진은 폐기). 대신 720x1560(논리 높이 최대, dy = 280인 긴 화면)으로 찍었다. 사진 위아래의 검은 띠는 Scale.FIT 여백이다.
- 사진에서 확인된 것: (1) HUD 띠가 위에 고정되고 그 아래로 진입 구역이 위로 늘어나 있다(dy 반영, 판 전체가 아래로 내려감) (2) 지뢰 5x2, 배치 5x3, 방어선 띠, 대기석 5칸 + "판매" 칸 (3) 가운데 열 맨 아래에 "김신병" 소총수 (4) 대기석에 소총수 4 + 저격수 1, 배치 맨 아래 행 왼쪽 열에 저격수 1 (5) 왼쪽 위 "보급 99".
- 기본 URL은 별도로 720x1280에서 찍어 "보급 6", 신병 1장, 진입 정확히 2행(dy = 0)임을 눈으로 확인했다(임시 파일, 저장소에는 넣지 않음).
- 카드 도형: 보직 색 + 머리글자(소·저) + 이등병 작대기 1개 + (신병만) 이름이 보인다.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - 차단] 카드 도형 치수·격자선 굵기 상수 추가**
- **Found during:** Task 1
- **Issue:** 카드 안쪽 여백, 머리글자·이름 글꼴 크기, 작대기 크기·위치, 격자선 굵기를 계획이 정하지 않았고, board.ts에 숫자를 박을 수 없다.
- **Fix:** data.ts `UI`에 `card`(inset, initialPx, namePx, nameY, rankX, rankY, rankW, rankH, rankGap)와 `stroke`만 추가(상수 추가만, 기존 값 변경 없음).
- **Files modified:** src/data.ts
- **Commit:** 7112f19

## 발견했으나 고치지 않은 것

- 방어선 라벨 `UI.text.labelColor`(#cfd8dc)가 노란 띠(UI.colors.line) 위라 대비가 낮아 읽기 어렵다(스크린샷 확인). 판매 칸 라벨과 같은 색을 공유해서 data.ts 값을 건드리지 않았다. 기획이 라벨 색을 분리하거나 방어선 띠 색을 바꾸면 해결된다.
- 대기석 칸 사이 구분선과 칸 윤곽 색이 같아(bg) 구분이 약하다. 외형 조정은 아트 단계에서.

## Known Stubs

없음. 보급 텍스트(`// ponytail`)와 `onSell` 연결은 의도된 1단계 단순화이며 plan 03(판매)·3단계(HUD)에서 해소된다.

## Threat Flags

없음.

## Self-Check: PASSED

- 파일 존재: src/battle/board.ts, src/battle/BattleScene.ts, docs/shots/M2-01-02.png
- 커밋 존재: 7112f19, 64d7b4b
