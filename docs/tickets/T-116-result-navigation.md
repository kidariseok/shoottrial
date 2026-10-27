# T-116 전투 결과 문구·생활관 복귀 수정

상태: 진행 중
담당: Codex

## 목표

전투 직행 디버그에서도 결과→생활관→재투입이 가능하고, 자발적 포기와 위병소 함락을 결과 화면에서 구분한다.

## 선행

- T-114 완료·PR #42 병합 확인. 기준 origin/main 6488f08c01e6.
- T-115 점검 결과는 PR #43에서 확인했다. 문서 전용 PR이며 아직 병합 전이다. 이 티켓은 #43 제품 코드에 의존하지 않는다.

## 소유 경로

- `src/main.ts`
- `src/battle/BattleScene.ts`
- `src/ui/screens.ts`
- `docs/TECH.md`
- `docs/HANDOFF.md`
- `docs/tickets/T-116-result-navigation.md`
- `docs/shots/T-116*.png`

## 허용 의존성

- 없음

## 참고 문서

- `docs/GDD.md` §4·§8
- `docs/TECH.md` §8·§9
- PR #43의 `docs/reviews/T-115-integration.md` 발견 문제 1·2

## 할 일

1. 전투 직행 시 WalkScene도 등록한다. 첫 활성 씬은 전투로 유지한다. 갤러리·일반 진입의 기존 시작 화면을 보존한다.
2. 기존 gaveUp 판정값을 결과 요청에 전달한다. 결과 제목은 포기 시 ‘작전 중단 — 자발적 포기’, 결과 항목은 ‘포기’로 표시한다. 승리·위병소 함락 문구와 판 기록·해금·보상 계산은 유지한다.
3. TECH §8의 result 입력에 선택적 `gaveUp?: boolean`을 먼저 명시한다. 기존 호출은 호환된다. 사용자 승인 전에는 읽기 전용 문서와 제품 코드를 수정하지 않는다.
4. 직행/일반 진입 복귀와 재투입, 승리/패배/포기의 표시를 실제 브라우저에서 확인한다.

## 검증 명령

- `npm run verify`
- `git diff --check`

## 완료 조건

- [ ] 전투 직행→포기 결과→생활관→재투입 가능
- [ ] 일반 생활관 진입·갤러리 첫 화면 유지
- [ ] 포기·실패·승리 문구 구분, 기존 기록/해금 처리 유지
- [ ] `npm run verify` 통과
- [ ] 결과/복귀 스크린샷과 미확인 사항 기록

디버그 URL:
- `http://localhost:5199/?scene=battle&safe=1&seed=7`
- `http://localhost:5199/?scene=walk&safe=1&seed=7`
- `http://localhost:5199/?scene=gallery&safe=1`

## 작업 계획

1. 기준선 `npm run verify` 및 별도 브라우저 저장 영역에서 직행 복귀/포기 문구 재현. 실패 조건을 기록한다.
2. 승인된 TECH §8 result 입력에 선택적 gaveUp을 추가하고, BattleScene의 기존 gaveUp 전달과 screens의 제목/결과 표시를 수정한다. main의 전투 직행 씬 목록에 WalkScene을 추가한다.
3. 실제 포기 버튼→결과→생활관→재투입을 직행/일반 진입에서 확인한다. 승리·HP0 패배도 표시를 확인하고, 상태 주입이나 게임 함수 직접 호출 시 그 조건을 명시한다. 갤러리 첫 화면도 확인한다. 화면은 브라우저/사진으로 검사하며 화면 구현을 그대로 따라 쓰는 단위 테스트는 추가하지 않는다.
4. 최종 verify·diff 검사, 사진·티켓 결과·HANDOFF 갱신 후 자동 저장과 PR 생성. #43 문서와 충돌하면 완료된 T-115 기록을 보존한다.

## 질문

- [ ] 사용자: 위 계획 및 `src/battle/BattleScene.ts` 수정, 읽기 전용 `docs/TECH.md` §8의 선택적 gaveUp 인자 추가를 승인하고 ‘진행’이라고 답해 주세요. AGENTS 절대 규칙 3·7과 TECH 고정 시그니처 규칙 때문에 명시적으로 확인한다.

## 진행 기록

- 기준 커밋: 6488f08c01e6428a0d8e16d70ffeda053d63ef59
- 브랜치: kidariseok/t116-result-navigation
- 세션 시작: Codex, 2026-10-27
- [x] T-115 작업자 완료 보고 수신·ack. PR #43 OPEN을 GitHub에서 확인했다. 다른 창의 문서는 수정하지 않는다.
- [x] git fetch 후 origin/main에서 새 브랜치 생성. 보고된 두 문제의 코드 근거 확인 및 계획 작성. 제품 코드·TECH 미변경, npm run verify 미실행.
- 다음: 사용자 계획/범위 승인 후 기준선 검증·재현부터 진행.

## 결과 보고

- 바뀐 파일: 계획 티켓·HANDOFF만 작성.
- 검증 결과: 계획 단계, npm run verify 미실행.
- 스크린샷: 아직 없음.
- 사용자 확인 방법: 승인 후 위 URL에서 결과→생활관→재투입 확인 예정.
- 확인하지 못한 점: 구현·브라우저 재현·실기기 모두 미실행.
- 다음 제안: 사람 플레이테스트는 T-115 안내에서 별도로 진행.

## 인계 메모

- PR #43은 아직 병합 전이다. T-115 완료 자료는 해당 PR 브랜치에 보존돼 있다.
