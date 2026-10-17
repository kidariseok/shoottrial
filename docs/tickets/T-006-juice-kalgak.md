# T-006 타격 피드백(주스) + 칼각 회피

상태: 대기
담당: Antigravity · gemini-4-argon-high

## 목표

쏘고, 맞히고, 부수고, 피하는 순간마다 손맛이 생긴다.
- 흰색 번쩍, 넉백, 데미지 숫자, 스파크와 튀는 나사, 화면 흔들림, 진동
- 공격이 닿기 직전에 구르면 "칼각!"이 뜨고, 잠깐 멈췄다가 점수를 받는다.

## 선행

- T-005

## 소유 경로

- `src/battle/fx.ts`
- `src/battle/BattleScene.ts`
- `src/battle/player.ts`
- `src/rules.ts`
- `src/data.ts`
- `tests/rules.test.ts`

## 허용 의존성

- 없음

## 참고 문서

- `docs/GDD.md` §4.1(칼각 회피), §8(주스 표: 소리 열은 P3, 이번에는 시각·진동만)
- `docs/TECH.md` §10(SDK를 매 프레임 호출 금지 → `toss.haptic`은 스로틀이 있다)
- `src/toss.ts`의 `haptic()`

## 할 일

1. **`fx.ts`**(모듈 함수 모음, 클래스 금지)

   | 함수 | 내용 |
   |---|---|
   | `flash(sprite)` | 60ms 흰색 |
   | `knock(sprite, dx)` | 넉백 2px |
   | `damageNumber(x, y, n)` | 텍스트 그룹 최대 30, 위로 12px 뜨며 400ms 페이드 |
   | `breakApart(x, y)` | `fx_spark` 4프레임 + `fx_bolt` 3개가 포물선으로 튐 |
   | `shake(level)` | 약 0.004 / 중 0.01. 겹쳐도 상한 유지 |
   | `muzzle()` | T-003 것을 이쪽으로 옮긴다 |

   - 파티클은 동시 80개 상한
2. **칼각 회피**
   - 구르기 시작 후 `PLAYER.kalgakWindow`(0.15초) 안에 적 공격 판정(접촉·탄)이 플레이어 히트박스와 겹치면 성공
   - 성공 시: "칼각!" 팝업 + 0.05초 히트스톱(`physics.world.timeScale` 또는 `time.timeScale`) + +150점 + `haptic`
   - 내부 쿨 1초
   - `rules.ts`의 점수에 칼각 수를 반영하고 테스트를 고친다.
3. **진동**: 유탄 자리(P3)를 빼고 피격(중)·칼각(약)만 연결한다. 설정이 없으므로 아직은 항상 켠다.

## 검증 명령

- `npm run verify`

## 완료 조건

- [ ] `npm run verify` 통과
- [ ] 적이 맞을 때마다 번쩍임과 숫자가 나온다. 처치 시 스파크와 나사가 튀고, **피 표현은 없다**
- [ ] 연속 피격·폭발에도 화면 흔들림이 상한을 넘지 않는다
- [ ] 드론 조준선이 끝나는 순간 구르면 "칼각!"이 뜬다. 일찍 구르면 뜨지 않는다
- [ ] 웨이브 3에서 FPS 55 이상(데스크톱 Chrome, CPU 4배 감속에서 측정해 기록)
- [ ] 스크린샷 `docs/shots/T-006.png`(칼각 팝업 또는 처치 파편이 보이는 순간)

디버그 URL: `http://localhost:5173/?scene=battle&stage=1&wave=2&fps=1`

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
