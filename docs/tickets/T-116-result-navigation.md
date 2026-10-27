# T-116 전투 결과 문구·생활관 복귀 수정

상태: 완료
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

- [x] 전투 직행→포기 결과→생활관→재투입 가능
- [x] 일반 생활관 진입·갤러리 첫 화면 유지
- [x] 포기·실패·승리 문구 구분, 기존 기록/해금 처리 유지
- [x] `npm run verify` 통과
- [x] 결과/복귀 스크린샷과 미확인 사항 기록

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

- [x] 사용자: ‘진행’으로 계획·BattleScene 수정·TECH §8의 선택적 gaveUp 인자 추가 승인(2026-10-27).

## 진행 기록

- 기준 커밋: 6488f08c01e6428a0d8e16d70ffeda053d63ef59
- 브랜치: kidariseok/t116-result-navigation
- 세션 시작: Codex, 2026-10-27
- [x] T-115 작업자 완료 보고 수신·ack. PR #43 OPEN을 GitHub에서 확인했다. 다른 창의 문서는 수정하지 않는다.
- [x] git fetch 후 origin/main에서 새 브랜치 생성. 보고된 두 문제의 코드 근거 확인 및 계획 작성. 제품 코드·TECH 미변경, npm run verify 미실행.
- [x] 기준선 verify:21파일358테스트·83에셋·타입/빌드 통과, 기존 번들500kB 경고. 별도 Chromium 컨텍스트390×844에서 HP가 남은 채 실제 일시정지→포기→생활관 클릭으로 두 문제 재현(‘위병소 돌파됨’, 활성 씬0·walk 미등록).
- [x] TECH 계약에 gaveUp 선택적 인자 먼저 반영 후 제품3파일 최소 수정. 기록/해금/보상 계산은 변경하지 않았다.
- [x] Chromium 별도 컨텍스트390×844/safe1: 실제 일시정지/포기/생활관 버튼 및 생활관 캔버스 전투 투입 버튼으로 직행·scene=walk 두 동선 재투입 확인. 새 판 wave1/HP20/result=null/gaveUp=false/reviveUsed=false. 승리 결과에서도 생활관 복귀 확인.
- [x] HP0 직접 설정→onBaseDown→부활 제안의 ‘포기’ 클릭은 패배, wave10 직접 설정→finish(true)는 승리로 표시·기록됨. 자발적 포기의 기록은 quit 유지. 세 결과 사진 저장. 이 검사는 정상 플레이 난이도/승패 검증이 아니다.
- [x] 기본 진입의 이름 입력 화면, 갤러리 단독 활성/캔버스1개 유지 확인. gaveUp 생략 기존 result 호출의 패배 문구 호환 확인.
- [x] 최종 verify21파일358테스트·83에셋·타입/빌드 통과. 기존500kB 번들 경고 유지. 코드 차이 검토와 diff 공백 검사 통과.
- [x] 전용 브라우저 컨텍스트·개발 서버 종료 완료.
- 다음: 완료 자동 저장·PR 생성. 병합은 사용자 담당.

## 결과 보고

- 바뀐 파일: main의 전투 직행 씬 등록에 WalkScene 추가, BattleScene의 기존 gaveUp을 screens.result에 전달, 포기 제목/결과 항목 분기. TECH §8은 사용자 승인한 선택적 gaveUp 계약만 갱신. HANDOFF·티켓·사진6장 포함. 기록/해금/보상 계산·의존성은 변경 없음.
- 검증 결과: `npm run verify` 최종 통과 — Test Files 21 passed (21), Tests 358 passed (358), assets:check 83키, built in 1.67s. tsc 통과. 기존500kB 청크 경고. `git diff --check` 통과. UI는 실제 브라우저 입력 및 아래 명시한 상태 주입으로 검사, 단위 테스트 추가 없음.
- 스크린샷: `docs/shots/T-116-quit.png`, `T-116-loss.png`, `T-116-win.png`, `T-116-return-walk.png`, `T-116-redeploy.png`, `T-116-gallery.png`. 대표 포기·복귀 사진 직접 열어 표시 확인.
- 사용자 확인 방법: 개발 서버에서 `?scene=battle&safe=1&seed=7`→일시정지→포기. 결과 ‘작전 중단 — 자발적 포기’/‘포기’ 확인→생활관→전투 투입. `?scene=walk`에서도 같은 동선 확인 가능.
- 확인하지 못한 점: 정상10웨이브 사람 플레이·재미/난이도·귀로 듣는 음량·안드로이드 실기기/광고SDK는 미검증. 패배는 HP0 상태 주입 후 실제 부활 거절 UI, 승리는 wave10/finish(true) 직접 호출로 표시 경로만 확인했다. 별도 브라우저 저장 영역을 사용해 사용자 저장을 읽거나 수정하지 않았다.
- 다음 제안: #43 및 이 수정 PR 병합 후 docs/PLAYTEST.md의 일반1판 기록. A-103 배경은 아직 미입고.

## 인계 메모

- PR #43은 아직 병합 전이다. T-115 완료 자료는 해당 PR 브랜치에 보존돼 있다.
