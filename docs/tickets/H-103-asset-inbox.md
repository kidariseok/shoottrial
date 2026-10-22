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

1. **받은편지함(`art/inbox/`) 폴더 및 키 이관 처리 구현** (`art/inbox/.gitkeep`, `scripts/assets.mjs`)
   - `art/inbox/.gitkeep` 생성.
   - `scripts/assets.mjs` 실행 시 `art/inbox/*.png`를 먼저 스캔해 확장자를 뺀 파일명을 계약 키와 대조하고, 없는 키일 경우 편집 거리(유사도) 기준 가장 비슷한 키 3개를 제안하며 실패하도록 구현.
   - 유효한 키는 `art/source/<키>/sheet.png`로 이동(기존 `sheet.png`가 있으면 `sheet.prev.png`로 백업)한 뒤 파이프라인 처리로 연결.
2. **프레임 자동 분리(`sheet.png` 기본) 구현** (`scripts/assets.mjs`)
   - 마젠타 제거 후 세로로 완전히 투명한 열을 경계로 덩어리(가로 x 구간)를 분리하고, 간격이 4px 미만인 인접 덩어리는 병합.
   - 최대 덩어리 면적(불투명 픽셀 수 또는 바운딩 박스 면적)의 3% 미만인 작은 조각(글자·반짝이 등) 제거.
   - 남은 덩어리 수가 계약 허용 프레임 범위(`minFrames`~`maxFrames`) 밖이면 찾은 수와 각 덩어리의 x 범위를 출력하고 실패 처리.
   - `meta.json`에 `"split": "even"`이 지정된 경우 기존 H-102 균등 분할(`splitHorizontalSheet`) 사용.
3. **자동 축소(픽셀풍 box 평균 + 알파 임계치 + 1px 분홍 번짐 재정리) 및 배율 공유 구현** (`scripts/assets.mjs`, `scripts/assets-check.mjs`)
   - `meta.json`의 `"fit": false`일 때만 H-102처럼 크기 초과 시 실패.
   - 유닛(`ally_*`, `enemy_*`): 배율 = `min(1, 96 / 최대 내용 높이)`. 같은 캐릭터 접두사(`ally_<카드>_*`, `enemy_<종류>_*`)에서 기준 키(`_idle`, `_walk`, `_run`)의 배율을 `art/LEDGER.json` 항목에 `scale`로 기록·참조하여 동일 배율 적용.
   - 카드(`card_*`, 256×320): 240×300 안에 맞추고 정중앙 배치.
   - 보스·이펙트·지뢰(`boss_*`, `fx_*`, `mine*`): 캔버스의 90% 안에 맞추고 정중앙 배치.
   - 배경(`bg_*`): 마젠타 제거 생략, 720×1560을 꽉 채우도록(cover) 축소 후 중앙 크롭.
   - 축소 알고리즘: 색상 칸 평균(box filter), 알파 칸 평균 ≥ 0.5이면 255 아니면 0(이진 알파), 축소 후 1px 분홍 번짐 정리 1회 추가 실행, 확대 금지(scale ≤ 1).
   - 결과 한 줄 요약 출력(`✓ <키> <N>프레임, 배율 <S>(<기준키> 기준), <W>×<H>`) 포맷 적용.
4. **단위·통합 테스트 5종 및 fixture 생성기 확장** (`scripts/fixtures/generate-fixtures.mjs`, `scripts/fixtures/pipeline-harness.mjs`, `tests/assets-pipeline.test.ts`)
   - 600×300 마젠타 위 높이 다른 사람 모양 3개(불규칙 간격) + 작은 글자 조각 1개 → 3프레임 분리 및 조각 제거 검증.
   - 가장 큰 프레임 내용 높이 96±1 및 발끝 `y=116` 정렬 검증.
   - `_idle` 배율을 `_attack`이 이어 쓰는지 검증.
   - 덩어리 수가 허용 범위 밖이면 실패하고 x 범위를 보고하는지 검증.
   - `bg_` 키가 cover 크기로 나오고 마젠타 제거를 하지 않는지 검증.
5. **실데이터(`art/ref/01-soldier-motion.png`) 시험, 갤러리 확인 및 사용법 문서 갱신** (`art/source/README.md`)
   - 로컬 `art/ref/01-soldier-motion.png` 첫 줄(8명)과 앞 2명을 잘라 `art/inbox/ally_rifle_idle.png`로 시험하여 실패/성공 출력을 기록하고 `?scene=gallery` 확인 후 실데이터 변경분은 모두 되돌림(커밋 제외).
   - `art/source/README.md` 사용법을 "`art/inbox/<키>.png`에 넣고 `node scripts/assets.mjs`" 한 단계 중심으로 간소화.
   - `npm run verify` 실행 및 갤러리 스크린샷(`docs/shots/H-103.png`) 확인.

- 디버그 URL: `http://localhost:5173/?scene=gallery`
- 검증 명령: `npm run verify`
- 플랫폼 API: 해당 없음

## 질문

- [ ] 사용자: 계획을 확인하고 "진행"이라고 답해 주세요

## 진행 기록

- 기준 커밋: ae7c023f0538
- 브랜치: kidariseok/h-103-asset-inbox
- 세션 시작: Gemini 4 Argon (High), 2026-10-22 17:05

## 결과 보고

- 바뀐 파일:
- 검증 결과:
- 스크린샷:
- 사용자 확인 방법:
- 확인하지 못한 점:
- 다음 제안:

## 인계 메모
