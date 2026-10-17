# T-002 멀티터치 패드 + 플레이어 이동·구르기

상태: 대기
담당: Antigravity · gemini-4-argon-high

## 목표

`/?scene=battle`에서 할 수 있는 것
- 왼쪽 45% 어디를 눌러도 생기는 조이스틱으로 플레이어가 움직인다.
- 오른쪽 아래 구르기 버튼(쿨타임 게이지 포함)으로 0.25초 무적 구르기를 한다.
- 데스크톱에서는 WASD·방향키 + Space로 같은 조작이 된다.

## 선행

- G0 통과(P-001)

## 소유 경로

- `src/battle/pad.ts`
- `src/battle/player.ts`
- `src/battle/BattleScene.ts`
- `src/data.ts`
- `src/debug.ts`

## 허용 의존성

- 없음

## 참고 문서

- `docs/GDD.md` §3(조작), §4.1(플레이어 수치), §7.1(HUD 배치·버튼 크기)
- `docs/TECH.md` §3(좌표), §10(금지)
- `src/toss.ts`의 `safeRect()`

## 할 일

1. **`src/data.ts` 생성**: `PLAYER`(GDD §4.1 표 전체)와 `PAD`(버튼 지름·위치 비율)를 `as const` 객체로 만든다. 이후 티켓이 같은 파일에 섹션을 추가한다.
2. **`pad.ts`**
   - 멀티 포인터: `input.addPointer(2)`
   - 왼쪽 45% 영역의 첫 포인터 → 플로팅 조이스틱. 베이스는 누른 자리에 생기고, 결과는 정규화 벡터 `{x, y, mag}`.
   - 구르기 버튼(지름 72 화면 px)·특수화기 버튼(지름 56, 이번 티켓에서는 눌림 표시만)
     - 위치는 `safeRect()` 안 오른쪽 아래
     - 각 버튼은 자기 포인터 ID를 기억한다.
   - `pointerup`·`pointerupoutside`·`pointercancel`·포커스 잃음에서 모두 해제한다(조이스틱이 멈춰 붙는 버그 방지).
   - 키보드: WASD·방향키 = 이동, Space = 구르기, E = 특수화기
   - 내보내는 것: `pad.move`, `pad.rollPressed`(그 프레임에 눌림), `pad.specialPressed`
3. **`player.ts`**
   - 이동: 속도 `PLAYER.speed`, 영역 클램프
   - 히트박스: Arcade body 12×16. 스프라이트는 플레이스홀더 `player_legs` + `player_body`
   - 구르기: 이동 방향(입력이 없으면 바라보는 방향)으로 `rollTime` 동안 속도 ×`rollMul`
     - `invincible = true`
     - 잔상 3개(알파 트윈)
     - 쿨타임 `rollCooldown`
   - 좌우를 바라보는 방향은 마지막 이동 방향으로 뒤집는다.
4. **`BattleScene`**: 패드와 플레이어를 연결한다. 구르기 쿨 게이지를 버튼 위에 원형으로 그린다.
5. **`?hitbox=1`**: 플레이어 히트박스와 무적 상태(무적이면 노란 테두리)를 표시한다. `debug.ts`에 추가.

## 검증 명령

- `npm run verify`

## 완료 조건

- [ ] `npm run verify` 통과
- [ ] 브라우저(마우스): 왼쪽 드래그로 이동, 손을 떼면 즉시 정지
- [ ] 브라우저(키보드): Space 구르기 + 쿨 게이지가 2초에 걸쳐 차오른다
- [ ] `?hitbox=1`: 구르는 0.25초 동안만 노란 테두리
- [ ] Chrome 기기 에뮬레이션(가로 844×390, 터치)에서 조이스틱 동작
- [ ] **멀티터치(이동하면서 구르기)는 P-002에서 실기기로 확인**한다고 결과 보고에 적는다
- [ ] 스크린샷 `docs/shots/T-002.png`(구르는 순간, `?hitbox=1&safe=1`)

디버그 URL: `http://localhost:5173/?scene=battle&hitbox=1&safe=1`

## 작업 계획

## 질문

## 진행 기록

- 세션 시작:

## 결과 보고

- 바뀐 파일:
- 검증 결과:
- 스크린샷:
- 사용자 확인 방법:
- 확인하지 못한 점:
- 다음 제안:

## 인계 메모
