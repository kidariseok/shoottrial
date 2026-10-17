# T-003 제식소총 자동 조준 + 아군 탄

상태: 대기
담당: Antigravity · gemini-4-argon-high

## 목표

`/?scene=battle&targets=3`에서 플레이어가 사거리 안의 가장 가까운 더미 표적을 자동으로 조준해 쏜다.
- 표적은 맞으면 번쩍이고, HP가 0이 되면 사라졌다가 2초 뒤 다시 생긴다.
- 사거리 안에 표적이 없으면 쏘지 않는다.

## 선행

- T-002

## 소유 경로

- `src/battle/weapons.ts`
- `src/battle/BattleScene.ts`
- `src/rules.ts`
- `src/data.ts`
- `src/debug.ts`
- `tests/rules.test.ts`

## 허용 의존성

- 없음

## 참고 문서

- `docs/GDD.md` §4.2(무기 표: `rifle` 줄, 자동 조준 규칙)
- `docs/TECH.md` §2.1(Group으로 풀링), §10
- `docs/ART.md` §4(`player_arm_rifle` 앵커, `bullet_ally`, `fx_muzzle`)

## 할 일

1. **`data.ts`**: `WEAPONS.rifle`(연사 간격, 피해, 탄속, 사거리, 락 유지 +20)
2. **`rules.ts`**: `pickTarget(px, py, targets, currentId, range, keep)` 순수 함수
   - 규칙
     - 가장 가까운 활성 표적을 고른다.
     - 현재 표적이 살아 있고 `range + keep` 안에 있으면 바꾸지 않는다.
     - 사거리 안에 없으면 `null`을 돌려준다.
   - `tests/rules.test.ts`에서 4가지 경우를 검사한다: 가장 가까운 것, 락 유지, 락 해제, 없음
3. **`weapons.ts`**
   - 아군 탄: `physics.add.group({ maxSize: 60 })` + `get()` / 화면 밖·명중 시 비활성
   - `player_arm_rifle`을 어깨 앵커 기준으로 표적 방향으로 회전한다.
   - 총구 섬광(2프레임), 연사 간격 타이머
   - **새 객체를 매 발사마다 만들지 않는다.**
4. **`?targets=N`**: 더미 표적 N개(HP 30, 회색 상자)를 바닥 영역의 고정 위치에 놓는다. 피격 60ms 흰색 번쩍. `debug.ts`에 추가.
5. **`?fps=1` 확장**: 활성 아군 탄 수를 표시한다.

## 검증 명령

- `npm run verify`

## 완료 조건

- [ ] `npm run verify` 통과(`pickTarget` 테스트 4개 포함)
- [ ] 표적 3개 중 가까운 것부터 쏜다. 이동해서 다른 표적이 더 가까워져도 현재 표적이 죽기 전까지는 바꾸지 않는다
- [ ] 모든 표적이 사거리 밖이면 발사가 멈춘다
- [ ] 1분 동안 쏴도 활성 탄 수가 60을 넘지 않는다(`?fps=1`)
- [ ] 스크린샷 `docs/shots/T-003.png`

디버그 URL: `http://localhost:5173/?scene=battle&targets=3&fps=1`

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
