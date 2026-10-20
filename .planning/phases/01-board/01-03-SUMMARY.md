---
phase: 01-board
plan: 03
subsystem: battle-board
tags: [phaser, drag, merge, sell, highlight]
requires: [01-01, 01-02]
provides:
  - "src/battle/board.ts: 카드 드래그, 이동·자리 바꿈·합성·판매, 가까운 빈 칸 보정, 칸 강조·반짝임, 진급 연출"
affects: []
tech-stack:
  added: []
  patterns: ["Phaser scene.input dragstart/drag/dragend 3개만 등록, 카드 뷰가 getData('slot')으로 자기 칸을 안다", "결정은 전부 rules.ts(dropOutcome·merge·nearestEmpty·sellValue)"]
key-files:
  created: [docs/shots/M2-01-03.png, docs/shots/M2-01-03-drag.png]
  modified: [src/battle/board.ts, src/data.ts]
key-decisions:
  - "컨테이너 setSize(cell, cell) + 기본 setInteractive({ draggable: true }) 히트 영역이 이미 카드 중심에 정렬돼 별도 Rectangle이 필요 없었다(Phaser 4 실측)"
  - "방어선 라벨은 UI.text.lineLabelColor(어두운 색)로 분리했다"
requirements-completed: [BOARD-02, BOARD-03, BOARD-04]
metrics:
  tasks: 2
  files: 4
  completed: 2026-10-20
---

# Phase 1 Plan 03: 드래그·합성·판매 Summary

`board.ts`에 드래그 입력을 붙여 이동·자리 바꿈·합성(이름 상속, 병장·계급 불일치는 교환)·판매(sellValue 환급)와, 판 밖에 놓으면 가까운 빈 배치 칸 보정/원위치, 칸 강조·합성 대상 반짝임·"진급!" 연출을 완성했다.

## 커밋

| 단계 | 커밋 | 내용 |
|---|---|---|
| Task 1 | 55ad971 | `feat(01-03)`: 드래그, 이동·교환·합성·판매 + 방어선 라벨 색 분리(data.ts) |
| Task 2 | d93b03f | `feat(01-03)`: nearestEmpty 보정, 칸 강조·반짝임, 진급 연출 + 스크린샷 |

## 구현 요약

- 입력: 카드 뷰마다 `setInteractive({ draggable: true })`(`put`에서 한 번). `scene.input.on`의 dragstart/drag/dragend 3개만 등록하고 `view.getData('slot')`으로 카드 뷰를 거른다.
- `slotAt`(점이 들어 있는 칸, 없으면 null), `snap`(트윈), `relocate`/`moveTo`, `mergeInto`, `sellFrom`은 모두 모듈 함수/클로저이며 클래스는 없다.
- 판 밖·지뢰 구역·방어선 띠(target=null)는 `nearestEmpty`로 배치 칸 15개 중 가장 가까운 빈 칸(들어 올린 출발 칸이 배치 구역이면 그것도 빈 칸)으로 보내고, 빈 칸이 없으면 원위치.
- 칸 강조는 카드 뷰보다 아래의 별도 Graphics 하나, 손 아래 칸이 바뀔 때만 다시 그린다. 합성 대상의 계급 작대기에 alpha yoyo 트윈을 걸고 칸이 바뀌거나 놓을 때 `killTweensOf` + `setAlpha(1)`. 대상 view destroy 전에 해제한다.
- 진급: 새 view의 계급 작대기 scale yoyo 트윈 + "진급!" 텍스트가 `popupRise`만큼 떠오르며 사라진다(색은 `UI.text.popupColor` CSS 문자열).
- 오케스트레이터 요청 수정: `UI.text.lineLabelColor = '#2b2b2b'`를 data.ts에 추가해 방어선 라벨에만 쓴다(`label()`에 선택 인자 color). 스크린샷에서 노란 띠 위 라벨이 읽힌다.

## 검증

`npm run verify` 끝부분(종료 코드 0, 최종 커밋 d93b03f 기준):

```
 Test Files  3 passed (3)
      Tests  41 passed (41)
✓ built in 1.16s
```

수락 기준 grep(board.ts):

| 검사 | 결과 |
|---|---|
| 좌표 리터럴 + 색 리터럴(비주석, 단어 경계) | 0 |
| `draggable: true` | 1 |
| `scene.input.on('(dragstart|drag|dragend)'` | 3 |
| `(dropOutcome|merge|sellValue)(` 줄 수 | 6 |
| `onSell(` / `nearestEmpty(` / `killTweensOf` | 1 / 1 / 3 |
| `UI.text.promote` / `UI.text.popupColor` | 1 / 1 |
| `UI.colors.hl(Ok|Merge|Hover)` 줄 수 | 3 |
| src/main.ts, src/debug.ts, src/ui/, BattleScene.ts 변경 | 없음 |

## 시각·동작 확인 (실제로 실행한 것)

개발 서버(vite `--port 5199`)와 헤드리스 Chrome(`--headless=old`)을 Chrome DevTools Protocol로 직접 조작했다(Node 내장 WebSocket 사용, 새 의존성 없음, 스크립트는 scratchpad에만 둠). 뷰포트는 `Emulation.setDeviceMetricsOverride`로 720x1560(dy = 280)이다. 실제 마우스 이벤트(`Input.dispatchMouseEvent`)로 눌러 끌고 놓았고, 게임 상태는 개발 서버의 `import('/src/main.ts')`로 읽었다. 확인이 끝난 뒤 개발 서버와 Chrome은 종료했다.

스크린샷(`/?scene=battle&deck=rifle:4,sniper:2&supply=99`):

- `docs/shots/M2-01-03-drag.png`: 대기석 소총수를 다른 소총수 위로 끄는 중. 대기석·배치 15칸·판매 칸이 초록 윤곽, 합성 가능한 소총수 칸은 노란 윤곽, 손 아래 칸은 흰 굵은 윤곽(저격수 칸은 초록).
- `docs/shots/M2-01-03.png`: 합성 직후. 대상 소총수가 일병(작대기 2개)이 되고 "진급!" 팝업이 떠 있다.

스크립트로 확인한 동작(상태값으로 확인, 사진 없는 것 포함):

- 히트 영역: 배치 카드(중심 + 네 모서리 ±60)와 대기석 0.875배 카드(중심 + 네 모서리 ±45) 10곳 모두에서 눌러 드래그가 시작되고 카드가 포인터를 따라 움직였다. 반 칸 어긋남 없음, 기본 `setInteractive({ draggable: true })` 영역이 중심에 맞는다.
- 빈 칸 이동, 자리 바꿈, 소총수 r1 + r1 -> r2, 소총수 r1 + 신병 r1 -> 신병 칸에 r2 + "김신병" 유지(이름 상속), r2 + r2 -> r3.
- 계급 불일치(r1 vs r3), 소총수 vs 저격수는 합쳐지지 않고 자리 바뀜.
- 소총수 16장을 병장(r4)까지 합성한 뒤 병장 2장을 겹치면 합쳐지지 않고 자리 바뀜(이름 달린 쪽이 위치 교환).
- 판매: 저격수 이등병 +3(99 -> 102), 일병 +2(6 -> 8).
- 판 밖(지뢰 구역)에 놓으면 가장 가까운 빈 배치 칸으로 이동(가운데 열 아래 칸 -> 가운데 열 맨 위 칸).
- 20칸을 모두 채운 뒤(소총수 20): 대기석 카드를 판 밖에 놓으면 원위치, 배치 카드를 판 밖에 놓아도 원위치.
- 반짝임: 합성 대상 위로 끌면 대상 계급 표시의 alpha가 0.3~1로 오르내리고, 합성 불가 칸(저격수)으로 옮기면 1로 복구, 놓은 뒤에도 1.

시각으로 보지 못한 것(한계):

- 반짝임·진급 확대 트윈의 움직임 자체는 사진으로 볼 수 없었다(alpha 값 샘플링으로 동작만 확인, 진급 확대는 사진에 "진급!" 팝업만 보임, scale 트윈은 코드 확인만).
- 판 밖에 놓은 뒤 카드가 날아가는 도중 모습, 창 높이 1280(dy = 0)에서의 드래그는 확인하지 않았다. 1560(dy = 280)에서만 확인했다.
- 실기기 터치(손가락에 카드가 가려짐)는 확인하지 못했다(코드에 ponytail 주석).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - 차단] 강조선 굵기·반짝임 알파 상수를 data.ts에 추가**
- **Found during:** Task 2
- **Issue:** 칸 윤곽 굵기(기본/손 아래)와 반짝임의 낮은 알파 값이 계획의 UI.fx 목록에 없고, board.ts에 숫자를 박을 수 없다.
- **Fix:** `UI.fx.hlWidth`, `hlHoverWidth`, `flashAlpha` 추가(상수 추가만, 기존 값 변경 없음). 오케스트레이터가 요청한 `UI.text.lineLabelColor`도 같은 커밋에서 추가했다.
- **Files modified:** src/data.ts
- **Commit:** 55ad971 (lineLabelColor·hl 상수는 Task 1 커밋에 함께 들어감)

**2. [Rule 1 - 다듬기] mergeInto에서 대상 view의 진행 중 스냅 트윈 해제**
- **Found during:** Task 1
- **Issue:** 방금 옮겨진 카드 위에 합성하면 대상 view를 destroy할 때 스냅 트윈이 살아 있을 수 있다.
- **Fix:** destroy 전에 `killTweensOf(target.view)`를 호출한다.

## 발견했으나 고치지 않은 것

- 합성 가능한 칸 윤곽이 노란색(hlMerge)이라 노란 방어선 띠 옆에서는 구분이 약할 수 있다. 외형 조정은 아트 단계에서.
- 드래그한 카드는 드래그 중 칸 강조 위에 그려지지만, 강조 윤곽은 카드 아래라 카드가 가리는 칸은 윤곽 일부가 가려진다(의도된 depth).

## Known Stubs

없음. `ponytail` 주석 2개(판매 칸이 항상 활성 -> 2단계 prep 제한, 드래그 판정이 카드 중심 좌표 -> 실기기에서 손가락 위로 띄우기)는 의도된 1단계 단순화다.

## Threat Flags

없음.

## Self-Check: PASSED

- 파일 존재: src/battle/board.ts, docs/shots/M2-01-03.png, docs/shots/M2-01-03-drag.png
- 커밋 존재: 55ad971, d93b03f
