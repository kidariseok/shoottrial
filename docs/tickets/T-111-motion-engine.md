# T-111 모션 엔진: 프레임 상한 확장 + 동작 사이 연결(코드)

상태: 진행 중
담당: Codex 또는 Claude Code (레인 A·B에 걸친 작업이라 한 사람이 맡는다)
짝 티켓: `A-105-motion-art.md`(사용자가 만드는 그림). 이 티켓은 **그림이 없어도 먼저 끝낼 수 있다**(도형·변형 모션으로 동작하고, 그림이 들어오면 자동으로 쓴다).

## 목표

캐릭터 동작이 "전환되는 느낌"이 아니라 이어지는 움직임으로 보인다.
1. 처리 도구와 계약이 더 많은 프레임을 받는다(아군 대기 6·공격 6, 적 걷기 8 등).
2. 전투 화면에서 **준비 → 발동 → 반동 → 복귀**와 **대기 ↔ 동작 연결**이 코드로 부드럽게 이어진다(그림 프레임이 없는 도형에도 적용).

## 선행

- #36·#37 병합(카드 10종 키, 전투 화면 UI). 모션 그림(A-105)은 선행이 아니다.

## 소유 경로

- `scripts/assets.mjs`
- `src/assets.ts`
- `src/battle/art.ts`
- `src/battle/units.ts`
- `src/battle/enemies.ts`
- `src/battle/BattleScene.ts`
- `src/data.ts`
- `src/rules.ts`
- `src/gallery.ts`
- `docs/ART.md`
- `tests/assets.test.ts`
- `tests/assets-pipeline.test.ts`
- `tests/rules-art.test.ts`

## 허용 의존성

- 없음

## 참고

- `docs/GDD.md` §5.3(계급 연출), §9(손맛·화려함 기준: ADD 혼합, 파티클, 히트스톱)
- `docs/tickets/A-105-motion-art.md`(프레임 수·연결 규칙·동작 목록)
- 현재 구조: `src/battle/art.ts`(`loadArt`·`setupArt`·`addSprite`·`playAct`·`hitSprite`·`tickHit`), `src/data.ts`의 `ART` 상수, `src/rules.ts`의 `artKey`·`artLoops`·`frameCount`, `scripts/assets.mjs`의 `getMaxFrames`(아군 대기·쓰러짐 2, 공격 4, 적 걷기 4, 적 공격·쓰러짐 3)

## 할 일

### 1. 계약과 처리 도구(레인 B)

1. `getMaxFrames`와 `src/assets.ts` 계약의 최소 프레임을 아래 표로 늘린다. 프레임 수는 이미지 너비 ÷ 캔버스 너비로 계산되므로(`frameCount`) 코드는 따로 바꿀 곳이 거의 없다.

| 키 | 최소~최대 |
|---|---|
| `ally_<카드>_idle` | 2~6 |
| `ally_<카드>_attack` | 3~6 |
| `ally_<카드>_hit` | 1~3 |
| `ally_<카드>_down` | 1~4 |
| `ally_<카드>_promote`(**새 키**) | 4~4 |
| `enemy_inf_walk`·`enemy_rpg_walk`·`enemy_dog_run` | 2~8 |
| `enemy_inf_attack`·`enemy_dog_bite`·`enemy_rpg_fire` | 2~5 |
| `enemy_inf_hit`·`enemy_dog_hit`·`enemy_rpg_hit`(**새 키**) | 2~3 |
| `enemy_inf_down`·`enemy_dog_down`·`enemy_rpg_down` | 1~5 |

2. `docs/ART.md` §4 표와 `tests/assets.test.ts`의 키 개수를 맞춘다(`ally_*_promote` 10개 + `enemy_*_hit` 3개 = **+13키**, 현재 88키 → 101키).
3. 새 키는 `loopSuffix`에 넣지 않는다(반복은 `_idle`·`_walk`·`_run`만). `artKey`에 `hit`·`promote` 상태를 더한다.
4. `tests/assets-pipeline.test.ts`에 "6프레임 대기 시트가 통과한다"와 "상한 초과는 거절한다" 케이스를 더한다.

### 2. 모션 연결(레인 A, 전부 `data.ts`의 상수로)

> 원칙: **프레임이 많든 적든, 그림이 있든 없든 연결 규칙은 코드가 지킨다.** 그림이 늘면 더 부드러워질 뿐이다.

1. **프레임 속도는 상태가 정한다**(순수 함수, `rules.ts`, 테스트): `clipFps(frames, seconds)`로 공격 클립이 공격 간격의 약 55% 안에 끝나게 하고(간격이 짧으면 빨리), 걷기는 `walkFps(speed)`로 적 속도에 비례하게(느린 보병은 천천히, 군견은 빠르게). 상수는 `ART.fps`에 둔다.
2. **대기 → 공격 → 대기가 이어진다**: `playAct`는 공격 클립이 끝나면 대기로 `chain`한다(이미 있음). 여기에 **예비 동작 tween**(공격 직전 6~8% 눌림 `scaleY`)과 **반동**(사격 방향 반대쪽으로 2~3px 밀렸다가 `Back.easeOut`으로 복귀)을 더한다. 그림이 없는 도형 유닛에도 같은 tween을 적용한다.
3. **대기는 동기화되지 않는다**: 유닛마다 대기 클립의 시작 프레임·타이밍을 무작위로 어긋나게 한다(`?seed` 난수 사용). 발 밑 그림자는 숨쉬기에 맞춰 폭이 아주 조금 변한다.
4. **피격**: 지금의 흰색 틴트는 유지하고, **밀려나는 미세 이동**(80ms, 3~4px)과 `_hit` 클립(있을 때)을 더한다. 클립이 끝나면 직전 상태(걷기·대기)로 돌아간다.
5. **쓰러짐**: `_down` 클립이 있으면 그 클립을 재생하고 마지막 프레임에서 페이드한다(`ART.fallAngle` 기울이기를 대체). 없으면 지금처럼 기울이기 + 페이드. 아군 쓰러짐은 의무병 소생과 맞물리므로 마지막 프레임을 유지한 채 소생을 기다릴 수 있게 한다(GDD §5.2).
6. **등장·진급**: 배치될 때 `easeOutBack`으로 0.6→1.0 크기가 튀어 오른다(180ms). 진급 때 `_promote` 클립이 있으면 재생하고(없으면 생략), 계급 연출(링·후광·오라)은 GDD §5.3 구현 단계에서 붙는다. 이 티켓은 **연결 지점만** 열어 둔다(`promoteFx(view, rank)` 같은 함수 하나).
7. **적 걷기**: 걷기 클립 재생 속도가 `walkFps`를 따르고, 클립이 없을 때는 위아래 출렁임 tween(몸 높이 3%)을 얹는다. 군견의 옆 열 이동은 지금의 tween에 몸 기울기를 더한다.
8. **끄고 비교**: `?motion=0`이면 새 연결 tween을 끄고 이전 동작으로 돌린다(A/B 확인용). `docs/TECH.md` §9 표에 줄을 더한다.
9. **갤러리**: `?scene=gallery`에서 시트가 **재생되는 미리보기**를 볼 수 있게 한다(프레임 수 표시 포함). 새 그림이 들어오면 눈으로 바로 확인하기 위함이다.

### 3. 테스트

- 순수 함수(`clipFps`, `walkFps`, 쿨다운 대비 클립 길이, `?motion=0` 분기)를 `tests/rules-art.test.ts`에서 검사한다.
- 화면은 테스트하지 않는다. 디버그 URL과 스크린샷으로 증명한다.

## 검증 명령

- `npm run verify`

## 완료 조건

- [ ] `npm run verify` 통과(키 101개, 프레임 상한 케이스 포함)
- [ ] `?scene=battle&wave=3&unlock=all&supply=99&seed=7`에서 공격 직전 눌림·반동·복귀가 눈에 보인다(`?motion=0`과 비교한 스크린샷 또는 짧은 연속 캡처 5장 이상: `docs/shots/T-111-*.png`)
- [ ] 같은 카드가 여러 장 있어도 대기 동작이 서로 어긋나 있다
- [ ] 그림이 없는 카드(도형)에도 예비·반동 tween이 적용된다
- [ ] `?scene=gallery`에서 시트가 재생된다

디버그 URL: `http://localhost:5173/?scene=battle&wave=3&unlock=all&supply=99&seed=7`, 같은 주소에 `&motion=0`

## 작업 계획

1. **시작 상태 확인**: `origin/main` 기준으로 기존 검증(`npm run verify`)을 실행하고 실패가 있으면 먼저 기록한다. 새 의존성은 설치하지 않는다.
2. **프레임 계약 확장**: `scripts/assets.mjs`, `src/assets.ts`, `tests/assets.test.ts`, `tests/assets-pipeline.test.ts`에서 101키와 티켓 표의 프레임 범위를 맞춘다. 기존 처리된 시트의 프레임 수와 새 최소치의 호환성을 먼저 확인한다. `docs/ART.md` 표 갱신은 아래 규칙 충돌에 대한 사용자 승인 후에 한다.
3. **모션 계산과 설정**: `src/data.ts`, `src/rules.ts`, `tests/rules-art.test.ts`에 공격 간격 대비 클립 속도, 이동 속도 대비 걷기 속도, 모션 켜기/끄기 계산을 둔다. 시각적 난수 때문에 전투 난수 순서가 달라지지 않도록 시드 기반 동작 어긋남을 분리한다.
4. **전투 연결**: `src/battle/art.ts`, `units.ts`, `enemies.ts`, `BattleScene.ts`에서 예비 동작·반동·복귀·대기 어긋남·그림자·피격·쓰러짐·등장·진급 연결 지점을 구현한다. 컨테이너의 실제 판 위치와 몸 그림의 변형을 구분해 드래그·군견 이동·정지·2배속이 충돌하지 않게 한다. 소생 기능 자체와 계급 링·후광·오라는 다음 티켓 범위다.
5. **갤러리와 비교**: `src/gallery.ts`에서 실제 프레임 수와 재생 미리보기를 표시한다. 아래 URL의 모션 켜짐/꺼짐을 같은 시드·배치로 비교하고, 추가로 `&art=0` 도형 경로와 여러 동일 카드의 대기 어긋남을 확인한다. A-105 원본 처리와 처리 결과 커밋은 이 티켓에서 하지 않는다.
6. **검증·보고·PR**: `npm run verify`를 실행하고 `docs/shots/T-111-*.png`에 5장 이상의 연속 캡처와 갤러리 화면을 남긴다. 티켓 결과 보고와 `docs/HANDOFF.md` 진행 상황을 갱신하고 자동 저장 도구로 저장한 뒤 PR을 만든다. 실행한 검증과 미확인 항목을 구분하고, 확인용 서버·브라우저를 종료한다.

- 비교 URL: `?scene=battle&wave=3&unlock=all&supply=99&seed=7`, 같은 URL에 `&motion=0`, 도형 확인은 `&art=0`. 갤러리: `?scene=gallery`.
- 검증 명령: `npm run verify`(시작 기준선 및 구현 완료 후). 플랫폼 API 추가 없음.
- 승인 후 소유 경로 보완: 이 티켓 파일, `docs/HANDOFF.md`, `docs/shots/T-111-*.png`. `docs/TECH.md` §9 갱신은 아래 질문 승인 후 소유 경로에 추가한다.

## 질문

- [ ] 사용자: 작업 계획을 확인하고 "진행"이라고 답해 주세요.
- [ ] 규칙 충돌 승인: AGENTS.md는 레인 A를 Claude Code 전용, ART·TECH 문서를 읽기 전용으로 정하지만 T-111과 HANDOFF는 Codex 구현 및 문서 갱신을 요구한다. 이번 T-111에 한해 명시된 레인 A 파일과 `docs/ART.md` §4, `docs/TECH.md` §9를 수정해도 되는지 계획 승인 때 함께 확인한다. 승인 전에는 해당 코드·문서를 수정하지 않는다.
- [ ] 소유 경로 보완 승인: `docs/TECH.md`, `docs/HANDOFF.md`, `docs/shots/T-111-*.png`, 이 티켓 파일을 소유 경로에 한 줄씩 추가한다. TECH는 티켓의 할 일에 있지만 현재 소유 경로에는 없다.

## 진행 기록

- 기준 커밋: f101faf9c0de
- 브랜치: kidariseok/t111-motion

- [x] 세션 시작: Codex, 2026-10-25T15:21+09:00. origin/main에서 새 브랜치 생성. #36·#37 병합 확인.
- [x] 규칙·인계·GDD·TECH·ART·A-105와 관련 모션 코드를 읽고 작업 계획 작성. 다음은 사용자 계획 승인 및 규칙 충돌 해소 후 기준선 검증이다.
- [ ] 구현 시작 전 승인 대기. 코드 수정·에셋 처리·검증 실행은 아직 하지 않았다.

## 결과 보고

- 바뀐 파일:
- 검증 결과:
- 스크린샷:
- 사용자 확인 방법:
- 확인하지 못한 점:
- 다음 제안:

## 인계 메모

<!-- 막히면 채운다. -->
