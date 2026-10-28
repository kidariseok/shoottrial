# T-117 승인 시안의 브리핑·생활관·생활 모션 반영

상태: 완료
담당: Codex

## 목표

A-106에서 승인한 브리핑4컷·생활관 배경·신병 걷기/회전·동료 대화 방향을 실제 게임에서 볼 수 있게 한다.

## 선행

- T-116 병합 완료, origin/main ba969953bbda.
- A-106 사용자 시안 승인 완료(2026-10-28). 문서·Figma 증거는 PR #45에 보존. 제품 코드 의존성 없음.

## 소유 경로

- `docs/tickets/T-117-approved-visuals.md`
- `docs/HANDOFF.md`
- `docs/shots/T-117*.png`
- `docs/tickets/A-106-visual-review.md`
- `docs/shots/A-106*.png`
- `src/assets.ts`
- `src/ui/lobby.ts`
- `src/ui/style.css`
- `src/ui/walk.ts`
- `src/ui/walk-motion.ts`
- `src/main.ts`
- `scripts/prepare-lobby-art.mjs`
- `tests/assets.test.ts`
- `tests/lobby-art.test.ts`
- `tests/walk-motion.test.ts`
- `public/assets/brief_*.png`
- `public/assets/bg_barracks.png`
- `public/assets/walk_*.png`
- `public/assets/index.json`
- `art/LEDGER.json`
- `art/inbox/a106/`

## 허용 의존성

- 없음

## 참고 문서

- AGENTS.md, HANDOFF §4·6
- GDD §2.1·4·8, TECH §3·9, ART §1~4
- A-106 승인 보드 https://www.figma.com/design/6RrU20Hv8way6vlYjcTJU3/?node-id=54-3
- PR #45 승인 시안 기록

## 할 일

1. 원본을 보존한 채 배경 크기/투명 처리/128px 시트/발 기준선/국자 방향을 정리하고 장부 기록.
2. 브리핑4컷에 승인 설명·제목·진행 버튼과 삽화 연결, 건너뛰기/다시보기 유지.
3. 생활관 가구에 맞춘 충돌·상호작용 좌표, 읽을 수 있는 구역 표지 연결.
4. 신병4방향6프레임 보행,8방향 정지/순차 회전, NPC가 주인공과 마주 보고 대화 후 원래 방향 복귀.
5. 세로 Safe Area·실제 키보드/조이스틱·패널/대화·생활관↔전투·그림 누락 대체 동작 검증.

## 검증 명령

- `node scripts/prepare-lobby-art.mjs`
- `npm run verify`
- `git diff --check`

## 완료 조건

- [x] 승인 삽화4컷과 생활관 배경 실제 표시
- [x] 걷기/정지/방향전환 및 두 NPC 대화 방향 확인
- [x] 가구 충돌·구역/패널·전투 투입 유지
- [x] 원본 미추적·가공본/장부/계약 일치
- [x] npm run verify 통과 및 세로 Safe Area 사진
- [x] 결과 보고·HANDOFF·PR

디버그 URL: `?scene=walk&safe=1`, `?scene=walk&zones=1`, `?scene=lobby&brief=1&safe=1`, `?scene=gallery`, `?scene=walk&art=0`.

## 작업 계획

1. 에셋 처리 작업자는 src/assets.ts·처리 스크립트·가공본·장부·에셋 테스트, 브리핑 작업자는 lobby.ts·style.css·main.ts를 맡아 독립 병렬 구현. 조정자는 walk.ts·walk-motion.ts·검증·티켓 기록을 담당한다.
2. 처리 결과를 실제 시트로 살펴 발 위치/외형/국자 손 일관성을 확인한다. 원본은 그대로 보존한다.
3. 승인 배경에 맞춰 중앙 통로·가구 충돌/구역 표지를 조정하고, 이동/멈춤/회전/대화 방향을 연결한다.
4. 브라우저 실제 입력과 상태 확인 후 npm run verify, 스크린샷·한계 기록·자동 저장·PR.

## 질문

- [x] 사용자 “응 승인할게 이제 실제 게임에 반영해봐”로 시안 승인 및 실제 반영 지시. 구현 전 재승인 생략.
- 문서 계약/전투 규칙/함수 시그니처 변경 없음. 새 시각 에셋 계약은 src/assets.ts 및 이 티켓에만 추가한다.

## 진행 기록

- 기준 커밋: ba969953bbda
- 브랜치: kidariseok/t117-approved-visuals
- 세션 시작: Codex, 2026-10-28
- [x] AGENTS/HANDOFF/ART/TECH·GDD 관련 절 및 기존 코드 확인, origin/main 새 브랜치 생성. A-106 시안 승인 문서는 PR #45로 저장 완료. 원본 art/inbox/a106 보존 확인.

- [x] 에셋 Orca run_9d7433822934 / ctx_72266b39b38a 성공 보고 수신·release·ack. 원본9개→가공본12개(브리핑4·배경1·보행4·정지3), 계약/장부/95에셋. 브리핑 작업자 ctx_6b7ea964b020·ctx_8915fb9f5229는 실행 전 agent-update-prompt로2회 실패, 같은 시작 방법 중단·두 빈 창 release 완료. 브리핑은 조정자가 직접 담당한다.
- [x] 4방향 보행/8방향 순차회전·정지·대화 시 상대방향·이동 또는5초 후 복귀 연결. 가구/상자 충돌과 각 구역 접근점·표지를 새 배경에 맞춤. 브리핑 제목/삽화/다음 버튼·빠른중복입력/늦은응답 가드·직행 URL 연결. 타입 검사 완료 후 실제 브라우저 검증 예정.

- [x] 중단 재개: 브랜치·변경파일·브라우저 상태 확인. verify23파일364테스트·95에셋·타입/빌드 통과(기존 번들 경고). 브리핑4컷→생활관 실제 버튼 흐름·삽화 로드/캔버스1개 확인. 보행 n키/프레임변화, 정지 복귀, 박취사 서로5/1방향·이상병3/7방향 대화, 이동시 대화 종료/원방향 복귀 확인. 사진8장 저장. 도감은 실제 열렸고 제목 전체가 “관물대 · 병과 도감”이라 단독 “병과 도감” 대기만 시간 초과한 검사 문제였다. 다음은 구역별/충돌·조이스틱/전투왕복·누락대체·좁은세로 검사.

- [x] 최종 동선 검사: 실제 키보드·조이스틱(위 이동 약72px, walk_rook_walk_n 재생/손 떼면 정지), 두 NPC 마주 보기·5초 뒤 원방향·동료 발 주변 충돌,4구역 메뉴 열기·게시판 브리핑 재생/Enter 다음/건너뛰기·브리핑 중 이동 잠금 확인. 출입구 투입→일시정지→포기→생활관→재보행·캔버스1개 확인.
- [x] 320×568 버튼 화면 안 배치, 브리핑 그림 요청 실패시 제목/본문/버튼 유지, art=0 이동/구역 대체·오류0 확인. 갤러리112계약키와 신규12텍스처 실제 로드 확인. 배경5장은 색 단계 축소로 각각512KB 이하, 원본 보존. 최종 verify23파일364테스트·95에셋·타입/빌드 통과, 기존500KB 번들 경고.
- [x] 시안 승인 이력이 구현 PR과 따로 병합되며 HANDOFF 충돌하지 않도록 A-106 문서/검토 사진을 선행 브랜치에서 함께 보존한다. 이 두 소유 경로를 명시했으며 제품 구현 범위는 동일하다. PR #45는 통합 PR에 포함 후 대체 종료한다.

## 결과 보고

- 바뀐 파일: assets.ts·main.ts, ui/lobby.ts·style.css·walk.ts·walk-motion.ts, 처리 스크립트·3개 테스트, 가공본12장·index·장부, A-106/T-117 티켓·HANDOFF·사진. 전투 규칙/의존성/읽기 전용 문서 변경 없음.
- 검증 결과: 처리 스크립트 성공. 최종 npm run verify23파일364테스트·95에셋·타입/빌드 통과(기존500KB 번들 경고). git diff --check 통과. PNG512KB 이하·발끝116/투명/자홍번짐없음 검사. 원본은 보존·미추적.
- 화면 검사:390×844 키보드/조이스틱 이동·정지/순차회전, 두NPC 마주보기·5초뒤복귀, 가구/동료 충돌, 관물대·게시판·행정반·PX 실제 접근/열기, 게시판 재생/Enter/건너뛰기/브리핑중이동잠금, 출입구 투입→일시정지→포기→생활관→재보행·캔버스1개. 320×568 버튼 하단552px로 화면내 표시, 삽화 요청 실패시 설명/버튼 유지, art0 이동·구역 대체, 해당 검사 pageerror0. 갤러리112계약/신규12실제텍스처 로드 확인.
- 스크린샷: docs/shots/T-117-brief-{1,2,3,4}.png, brief-small, walk, walking, talk-lee, talk-park, joystick, codex, fallback, gallery, check (같은 T-117 접두사·png 확장자, 총14장). 갤러리는 끝부분을 보도록 미리보기 컨테이너를 아래로 옮겨 촬영했다.
- 사용자 확인 방법: npm run dev 후 위 디버그 URL. 방향키/WASD 또는 빈바닥 드래그, NPC 근처 대화, 가구 구역 열기, 출입구/전투투입.
- 확인하지 못한 점: 실기기·노치 실측·실제 사람의 보행/대화속도·음색 체감·10웨이브 난이도. 대각 보행은 마지막 유효축 자세를 유지하며 정지/회전/대화는8방향이다. 박취사 옆면은 좌우 반전 보정했으나 정면·대각 국자 손 차이는 원본 한계로 남는다.
- 다음 제안: 사용자 일반 플레이 후 속도/밝기 체감 조정. 출시 준비는 기존 보류 유지.

## 인계 메모

- 승인 시안 원본 art/inbox/a106/brief-1~4.png·barracks.png·rook-walk.png·rook-turn.png·lee-turn.png·park-turn.png. v1은 비교용 보존. 원본 커밋 금지.
- 최종 상태: 구현·검증 완료. A-106 승인문서/사진을 구현브랜치로 통합했고 HANDOFF 충돌은 양쪽 승인·구현 이력을 보존해 해결했다. Orca3창 released·reclaimable0. 다음은 사용자 PR 병합과 일반 플레이다.
