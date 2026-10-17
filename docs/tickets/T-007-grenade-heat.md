# T-007 유탄발사기 + 열기 + 특수화기 전환

상태: 대기
담당: Antigravity · gemini-4-argon-high

## 목표

특수화기 버튼(또는 E)을 누르면 유탄발사기로 바뀌어 자동 사격한다.
- 유탄은 범위 폭발로 여러 적을 밀어내고, 발사마다 열기가 오른다.
- 100%가 되면 3초 과열로 소총으로 돌아온다. 다시 누르면 언제든 소총으로 돌아온다.
- 칼각 회피에 성공하면 열기가 50% 내려간다.

## 선행

- T-006

## 소유 경로

- `src/battle/weapons.ts`
- `src/battle/pad.ts`
- `src/battle/BattleScene.ts`
- `src/battle/fx.ts`
- `src/rules.ts`
- `src/data.ts`
- `tests/rules.test.ts`

## 허용 의존성

- 없음

## 참고 문서

- `docs/GDD.md` §3(특수화기 버튼 동작), §4.2(`grenade` 줄, 열기·과열), §4.1(칼각 열기 감소), §8(유탄 폭발 주스)
- `docs/ART.md` §4(`player_arm_grenade`, `grenade`, `fx_explosion`: H-001이 이미 플레이스홀더로 만들어 두었다)

## 할 일

1. **`rules.ts`**: `heatStep(state, dt, fired, cfg)` 순수 함수 + 테스트 5개
   - 상태: `{ heat, overheatedUntil }`
   - 경우: 발사 시 상승 / 비사용 시 냉각 / 100% 도달 시 과열 / 과열 중 발사 불가 / 칼각 감소
2. **`weapons.ts`**: `grenade` 추가
   - 포물선 대신 직선 + 착탄 지점 폭발(반경 45)로 단순하게 처리한다.
   - 범위 안 적에게 피해와 강한 넉백. 청소 로봇(P3)의 방패 무시용 플래그 자리를 만든다.
   - 특수화기 사용 중이 아닐 때도 열기는 계속 식는다.
3. **`pad.ts`**
   - 특수화기 버튼에 열기 게이지(원형)
   - 과열 중에는 버튼을 회색으로 표시하고 남은 초를 보여준다.
4. **`fx.ts`**: 폭발(`fx_explosion` 6프레임) + 흔들림 약 + `haptic` 약
5. 무기 전환 시 팔 스프라이트를 바꾼다(`player_arm_grenade`).

## 검증 명령

- `npm run verify`

## 완료 조건

- [ ] `npm run verify` 통과(`heatStep` 테스트 5개 포함)
- [ ] 유탄 6발이면 과열, 3초 뒤 다시 쓸 수 있다
- [ ] 쓰지 않을 때 초당 25%씩 식는다
- [ ] 유탄 1발로 뭉친 배달 로봇 여러 기가 동시에 밀려난다
- [ ] 칼각 성공 시 열기 게이지가 눈에 띄게 줄어든다
- [ ] 스크린샷 `docs/shots/T-007.png`(폭발 순간 + 열기 게이지)

디버그 URL: `http://localhost:5173/?scene=battle&stage=1&wave=3&fps=1`

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
