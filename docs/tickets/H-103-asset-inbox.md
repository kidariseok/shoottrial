# H-103 에셋 받은편지함: AI 원본 자동 분리·자동 축소

상태: 진행 중
담당: Antigravity · gemini-4-argon-high (역할 카드: `docs/agents/antigravity-build.md`)

## 목표

사용자가 Gemini에서 받은 그림을 **`art/inbox/<키>.png`로 넣기만 하면** `node scripts/assets.mjs` 한 번으로 게임 규격 시트가 나오게 한다. 사용자는 이름만 맞춰 저장하고, 크기·프레임 판단은 스크립트가 한다(사용자 안내: `docs/tickets/A-102-art-pack.md`).

## 배경 (Claude 확인)

- Gemini 결과는 약 1024px이다. 캐릭터가 300~900px로 그려져 H-102의 "128 캔버스보다 크면 실패" 규칙에 전부 걸린다.
- 프레임 간격이 고르지 않다. H-102의 "너비를 프레임 수로 똑같이 나누기"는 캐릭터를 자른다.
- Figma 기존 시트(`art/ref/01-soldier-motion.png`, gitignore라 로컬에만 있다)도 같은 모양이다. 마젠타 배경 위에 캐릭터가 불규칙하게 놓이고 글자가 섞여 있다.
- H-102의 `removeMagenta`는 이 그림에서 잘 동작한다(Claude가 Figma 목업을 만들 때 써서 확인했다).

## 선행

- H-102(완료)

## 소유 경로

- `scripts/assets.mjs`
- `scripts/assets-check.mjs`
- `scripts/fixtures/`
- `tests/assets-pipeline.test.ts`
- `art/source/README.md`
- `art/inbox/.gitkeep`

## 허용 의존성

- 없음(`pngjs`는 이미 있다)

## 참고 문서

- `docs/tickets/A-102-art-pack.md`(파일 이름 = 키, 키마다 요청한 프레임 수)
- `docs/ART.md` §2(캔버스·피벗·몸 높이 약 96px), §4(키 목록)
- `src/assets.ts`(계약 표. **읽기만 한다**)

## 할 일

1. **받은편지함**
   - `node scripts/assets.mjs`가 `art/inbox/*.png`를 먼저 읽는다. 파일 이름(확장자 뺀 것)이 계약 키다.
   - 원본을 `art/source/<키>/sheet.png`로 옮긴다(덮어쓰기 전 기존 원본은 `sheet.prev.png`로 둔다). 그다음 기존 처리로 넘긴다.
   - 계약에 없는 이름이면 실패하고, 가장 비슷한 키 3개를 보여 준다.
2. **프레임 자동 분리**(`sheet.png`일 때 기본)
   - 마젠타를 제거한 뒤, 세로로 완전히 투명한 열을 경계로 덩어리를 나눈다. 간격이 4px 미만인 덩어리는 하나로 합친다(총구와 몸이 떨어진 경우).
   - 가장 큰 덩어리 면적의 3% 미만인 조각은 버린다(남은 글자, 반짝이).
   - 덩어리 수가 그 키의 허용 프레임 범위(`getMaxFrames` 등 H-102 규칙) 밖이면, 찾은 수와 각 덩어리의 x 범위를 출력하고 실패한다.
   - `meta.json`에 `"split": "even"`이 있으면 H-102 방식(균등 분할)을 쓴다.
3. **자동 축소**(`meta.json`의 `"fit": false`일 때만 H-102처럼 실패)
   - 유닛(`ally_*`, `enemy_*`)은 키마다 **한 배율**을 쓴다. 배율 = 96 ÷ (그 키 모든 프레임 중 가장 큰 내용 높이)이다.
     - 같은 캐릭터의 키(예: `ally_rifle_idle`과 `ally_rifle_attack`)는 같은 배율을 쓴다. 먼저 처리된 `_idle`(또는 `_walk`·`_run`)의 배율을 `art/LEDGER.json` 항목에 `scale`로 적고, 같은 접두사의 다른 키는 그 값을 쓴다. 기준 키가 아직 없으면 자기 배율을 쓴다.
   - 카드(`card_*`, 256×320)는 240×300 안에 맞추고 가운데에 둔다.
   - 보스·이펙트·지뢰(`boss_*`, `fx_*`, `mine*`)는 캔버스의 90% 안에 맞추고 가운데에 둔다.
   - 배경(`bg_*`)은 **마젠타를 지우지 않는다.** 720×1560을 꽉 채우도록(cover) 줄이고, 넘치는 쪽은 가운데 기준으로 자른다.
   - 축소 방법(픽셀풍 유지):
     - 색: 칸 평균(box)
     - 알파: 칸 평균이 0.5 이상이면 255, 아니면 0
     - 축소한 뒤 1px 분홍 번짐 정리를 한 번 더 한다
   - 확대는 하지 않는다. 내용이 이미 목표보다 작으면 그대로 둔다.
4. **결과 출력**: 키마다 한 줄로 쓴다. 예: `✓ ally_rifle_attack 3프레임, 배율 0.142(ally_rifle_idle 기준), 384×128`.
5. **테스트**(`tests/assets-pipeline.test.ts`, fixture는 스크립트로 생성)
   - 600×300 마젠타 위에 높이가 다른 사람 모양 3개, 사이 간격 불규칙, 작은 글자 조각 1개 → 3프레임으로 나뉘고 조각은 버려지는지
   - 가장 큰 프레임의 내용 높이가 96±1이고 발끝이 y=116인지
   - `_idle`의 배율을 `_attack`이 이어 쓰는지
   - 덩어리 수가 범위 밖이면 실패하는지
   - `bg_` 키는 cover 크기로 나오고 마젠타 제거를 하지 않는지
6. **실데이터 시험**: 로컬에 `art/ref/01-soldier-motion.png`가 있으면 첫 줄(대기·사격 8명) 영역을 잘라 `art/inbox/ally_rifle_idle.png`로 넣어 본다. 기대값은 프레임 범위 밖으로 실패하고 8덩어리가 보고되는 것이다. 그다음 앞 2명만 잘라 다시 돌려 2프레임으로 성공하는지 본다. 결과 시트를 `?scene=gallery`로 찍는다.
   - **시험에 쓴 그림은 커밋하지 않는다**(사용자 원본, 공개 저장소). `art/inbox/`·`art/source/`·`public/assets/` 변경을 되돌리고 fixture 결과만 남긴다.
7. `art/source/README.md`의 사용법을 "`art/inbox/<키>.png`에 넣고 `node scripts/assets.mjs`" 한 단계로 고친다.

## 검증 명령

- `npm run verify`

## 완료 조건

- [ ] `npm run verify` 통과
- [ ] 5번 테스트 5종 통과
- [ ] `docs/shots/H-103.png`: fixture(또는 6번 실데이터) 결과가 갤러리에 빨간 테두리 없이 보이는 화면
- [ ] 결과 보고에 6번 실데이터 시험의 출력 줄(실패 메시지와 성공 줄)을 그대로 붙임
- [ ] 저장소에 사용자 원본 그림이 커밋되지 않음(`git diff --stat origin/main`에 `art/inbox/*.png`, `art/source/**`, `art/ref/**` 없음)

디버그 URL: `http://localhost:5173/?scene=gallery`

## 작업 계획

1. **받은편지함(`art/inbox/`) 이동 및 계약 키 검증 (`scripts/assets.mjs`, `art/inbox/.gitkeep`)**
   - `art/inbox/.gitkeep` 생성
   - `art/inbox/*.png`를 스캔하여 계약 키 여부를 검사하고, 계약에 없는 키면 편집 거리(유사도) 기준 가장 비슷한 키 3개를 제안하며 실패하도록 구현
   - 유효한 키면 기존 `art/source/<키>/sheet.png`를 `sheet.prev.png`로 백업한 뒤 `art/inbox/<키>.png`를 `art/source/<키>/sheet.png`로 이동하고 처리 목록에 포함
2. **투명 열 경계 기반 프레임 자동 분리 (`scripts/assets.mjs`)**
   - `sheet.png` 처리 시(`meta.json`에 `"split": "even"`이 없을 때 기본) 마젠타 제거 후 세로로 완전히 투명한 열을 기준으로 x축 덩어리를 찾고, 간격이 4px 미만인 인접 덩어리는 병합
   - 각 덩어리의 불투명 경계 상자(면적)를 구해 최대 덩어리 면적의 3% 미만인 작은 조각(글자·반짝이 등)을 제거
   - 남은 덩어리 수가 계약의 허용 프레임 범위(`minFrames`~`maxFrames`) 밖이면 찾은 수와 각 덩어리의 x 범위를 포함해 에러를 던지고, 범위 안이면 프레임 배열로 분리
3. **종류별 자동 축소·배율 공유 및 배경 cover 처리 (`scripts/assets.mjs`, `scripts/assets-check.mjs`)**
   - 박스 평균(색: 칸 평균, 알파: 평균 ≥ 0.5이면 255 아니면 0) 축소 함수와 축소 후 1px 분홍 번짐 추가 정리 로직 구현 (확대 금지, `meta.json`의 `"fit": false`면 H-102처럼 크기 초과 시 실패)
   - 유닛(`ally_*`, `enemy_*`): `96 ÷ (해당 키 모든 프레임 중 최대 내용 높이)` 배율 계산. 같은 캐릭터 접두사(`ally_rifle`, `enemy_inf` 등)의 기준 키(`_idle`, `_walk`, `_run`)가 `art/LEDGER.json`에 기록한 `scale`이 있으면 이어 쓰고, 기준 키 처리 시 `LEDGER.json` 항목에 `scale` 저장 (기준 키가 먼저 처리되도록 정렬 보장)
   - 카드(`card_*`): 240×300 안에 맞추고 정중앙 정렬 / 보스·이펙트·지뢰(`boss_*`, `fx_*`, `mine*`): 캔버스 90% 안에 맞추고 정중앙 정렬 / 배경(`bg_*`): 마젠타 제거 없이 720×1560 cover 축소 및 중앙 크롭
   - 결과 출력 포맷(`✓ <키> <N>프레임, 배율 <S>[ (<기준키> 기준)], <W>×<H>`) 적용
4. **파이프라인 테스트 5종 및 fixture 생성기 확장 (`scripts/fixtures/generate-fixtures.mjs`, `scripts/fixtures/pipeline-harness.mjs`, `tests/assets-pipeline.test.ts`)**
   - 600×300 마젠타 위 불규칙 간격 사람 모양 3개 + 작은 조각 1개 → 3프레임 분리 및 조각 제거 테스트
   - 최대 프레임 내용 높이 96±1 및 발끝 `y=116` 정렬 테스트
   - `_idle` 배율(`scale`)을 `_attack`이 이어 쓰는지 테스트
   - 덩어리 수 범위 초과 시 실패(덩어리 수·x 범위 보고) 테스트
   - `bg_` 키의 마젠타 비제거 및 720×1560 cover 출력 테스트
5. **실데이터(`art/ref/01-soldier-motion.png`) 시험 및 갤러리 확인 (`docs/tickets/H-103-asset-inbox.md`)**
   - `art/ref/01-soldier-motion.png` 첫 줄(8명) 크롭본을 `art/inbox/ally_rifle_idle.png`에 넣어 8덩어리 범위 초과 실패 메시지 확인
   - 앞 2명만 잘라 다시 넣어 2프레임 변환 성공 출력 확인 및 `?scene=gallery` 확인 후, 사용자 원본 파일(`art/inbox/`, `art/source/`, `public/assets/` 등) 변경분 원복
6. **문서 갱신 및 최종 검증 (`art/source/README.md`)**
   - `art/source/README.md` 사용법을 "`art/inbox/<키>.png`에 넣고 `node scripts/assets.mjs`" 한 단계 워크플로 중심으로 갱신하고 `npm run verify` 실행

- **디버그 URL**: `http://localhost:5173/?scene=gallery`
- **검증 명령**: `npm run verify`
- **플랫폼 API**: 해당 없음 (순수 Node 에셋 빌드 스크립트)

## 질문

- [x] 사용자: 계획을 확인하고 "진행"이라고 답해 주세요

## 진행 기록

- 기준 커밋: d358e0e4ff0a
- 브랜치: kidariseok/h103-asset-inbox
- 세션 시작: Gemini 4 Argon (High), 2026-10-21 23:31
- [x] 티켓 활성화 및 작업 계획 작성 완료 (사용자 승인 대기)

## 결과 보고

- 바뀐 파일:
- 검증 결과:
- 스크린샷:
- 사용자 확인 방법:
- 확인하지 못한 점:
- 다음 제안:

## 인계 메모
