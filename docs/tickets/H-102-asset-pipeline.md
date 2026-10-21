# H-102 에셋 정리·검사 스크립트: 마젠타 제거 → 128 캔버스 정렬 → public/assets + 계약 검사

상태: 완료
담당: Antigravity · gemini-4-argon-high (역할 카드: `docs/agents/antigravity-build.md`)

## 목표

사용자가 Gemini·Figma에서 받은 **마젠타 배경 시트**를 폴더에 넣고 명령 하나를 실행하면, 다음이 한 번에 끝난다.
- `docs/ART.md` §4 계약 크기의 투명 PNG가 `public/assets/`에 생긴다
- `public/assets/index.json`과 `art/LEDGER.json`이 갱신된다
- `npm run assets:check`가 계약 위반을 잡는다

지난번에 "그림을 줬는데 게임에 제대로 안 들어간" 문제를 막는 장치다(ART §0).

## 선행

- H-101(완료)

## 소유 경로

- `scripts/assets.mjs`
- `scripts/assets-check.mjs`
- `scripts/fixtures/`
- `package.json`
- `package-lock.json`
- `tests/assets-pipeline.test.ts`
- `art/source/README.md`

## 허용 의존성

- `pngjs`

## 참고 문서

- `docs/ART.md` §0, §2, §3(파이프라인 ④~⑥), §4(계약 표·장부 필드)
- `src/assets.ts`(H-101의 계약 표. **읽기만 한다.** 스크립트는 이 표를 import하거나 같은 값을 파싱해 쓴다. 표를 두 군데에 복사하지 않는다)
- `docs/research/figma-inventory.md`(원본 시트들이 어떤 모양인지)

## 할 일

1. **입력 규칙**(`art/source/README.md`에 사용자용으로 적는다)
   - `art/source/<키>/` 폴더에 프레임 PNG를 `01.png`, `02.png` … 순서로 넣거나, 가로 한 줄 시트 하나를 `sheet.png`로 넣는다
   - 같은 폴더에 `meta.json`(선택): `{ "tool": "gemini-argon", "prompt": "prompt.txt", "source": "<Figma 노드 URL>" }`
2. **`node scripts/assets.mjs <키>`**(키를 생략하면 전부)
   - 마젠타(#FF00FF ± 허용 오차) → 투명. 경계의 마젠타 번짐(분홍 테두리)을 1px 정리
   - 프레임마다 내용 경계를 잘라 계약 캔버스(예: 128×128)에 넣는다. **발끝(가장 아래 불투명 픽셀)을 기준선 y=116, 가로는 가운데**에 맞춘다. 보스·이펙트·UI처럼 피벗이 "중앙"인 키는 가운데 정렬
   - 내용이 캔버스보다 크면 **최근접 축소를 하지 않고 실패**한다(이유와 실제 크기 출력). 확대·축소 판단은 사람이 한다
   - 가로 한 줄 시트로 이어 붙여 `public/assets/<키>.png`로 쓴다
   - `public/assets/index.json`에 키를 추가하고, `art/LEDGER.json`에 장부 항목(ART §4.5 필드)을 쓴다
3. **`npm run assets:check`**(`scripts/assets-check.mjs`)
   - `index.json`의 모든 키: 파일이 있는지, 높이 = 계약 h, 너비 = 계약 w × n(n은 계약 프레임 범위 안), 알파 채널이 있는지, 장부 항목이 있는지
   - 장부에만 있고 파일이 없는 항목, 계약에 없는 키도 잡는다
   - 실패하면 0이 아닌 종료 코드
   - `package.json`의 `verify`를 `typecheck && test && assets:check && build`로 바꾼다(지금은 index.json이 비어 있으니 통과해야 한다)
4. **테스트 fixtures**: `scripts/fixtures/`에 작은 마젠타 배경 테스트 이미지(스크립트로 생성해도 된다) → `tests/assets-pipeline.test.ts`에서 마젠타 제거·발끝 정렬·크기 초과 실패를 검사한다
5. **실데이터 1건 시험**(가능하면): 사용자가 `art/source/`에 넣은 그림이 있으면 그중 하나로 돌려 보고 `?scene=gallery` 스크린샷을 찍는다. 없으면 fixture 결과로 찍는다

## 검증 명령

- `npm run verify`
- `npm run assets:check`

## 완료 조건

- [x] `npm run verify`(assets:check 포함) 통과
- [x] fixture 테스트 통과(마젠타 제거·기준선·크기 초과 실패)
- [x] `art/source/README.md`에 사용자가 따라 할 3단계 사용법
- [x] `docs/shots/H-102.png`: 처리된 키가 갤러리에 빨간 테두리 없이 보이는 화면

디버그 URL: `http://localhost:5173/?scene=gallery`

## 작업 계획

1. **의존성 설치 및 사용자 안내 문서 작성** (`package.json`, `package-lock.json`, `art/source/README.md`)
   - 허용 의존성 `pngjs` 설치 및 `package.json`에 `"assets:check": "node scripts/assets-check.mjs"` 추가, `"verify"`를 `"npm run typecheck && npm run test && npm run assets:check && npm run build"`로 변경
   - `art/source/README.md`에 사용자가 따라 할 3단계 에셋 넣기·변환·검사 사용법(`01.png`… 또는 `sheet.png`, 선택적 `meta.json`, 명령 실행 및 갤러리 확인) 작성
2. **에셋 정리 스크립트 구현** (`scripts/assets.mjs`)
   - `src/assets.ts`의 계약 표(캔버스 크기 `w`, `h`, 최소 프레임 수)와 `docs/ART.md` §4의 최대 프레임 범위·피벗 기준(유닛은 발끝 `y=116` + 가로 중앙, 보스·이펙트·카드·아이콘·배경·타일·계급장은 정중앙 정렬)을 읽어 처리
   - 마젠타(`#FF00FF` ± 허용 오차) 투명화 및 불투명 픽셀 인접 경계의 마젠타 번짐(1px 분홍 테두리) 제거
   - 프레임별 불투명 내용 경계(bounding box) 추출 후 계약 캔버스 배치, 내용이 캔버스보다 크면 최근접 축소 없이 이유와 실제 크기를 출력하고 즉시 실패 처리
   - 가로 한 줄 시트로 이어 붙여 `public/assets/<키>.png` 저장 및 `public/assets/index.json`·`art/LEDGER.json`(`id`, `file`, `source`, `tool`, `prompt`, `license`, `edited`, `checked`) 갱신
3. **에셋 계약 검사 스크립트 구현** (`scripts/assets-check.mjs`)
   - `public/assets/index.json`의 모든 키에 대해 PNG 파일 존재 여부, 높이 = 계약 `h`, 너비 = 계약 `w × n`(`n`이 계약 프레임 범위 안), 알파 채널(colorType 4 또는 6) 여부, `art/LEDGER.json` 장부 항목 존재 여부 검사
   - 장부에만 있고 실제 파일이 없는 항목, 계약 표(`src/assets.ts`)에 없는 키 검출 시 0이 아닌 종료 코드 반환
4. **테스트 Fixtures 및 파이프라인 단위 테스트 작성** (`scripts/fixtures/`, `tests/assets-pipeline.test.ts`)
   - `scripts/fixtures/`에 마젠타 배경·테두리 번짐·발끝 기준선·크기 초과 검증용 테스트 fixture 구성
   - `tests/assets-pipeline.test.ts`에서 마젠타 제거(1px 번짐 정리 포함), 발끝 `y=116` 및 가로 중앙 정렬, 캔버스 크기 초과 시 실패, `assets-check` 검증 로직을 테스트
5. **실데이터/Fixture 갤러리 검증 및 스크린샷 캡처** (`docs/shots/H-102.png`, `docs/tickets/H-102-asset-pipeline.md`)
   - 변환된 에셋을 `?scene=gallery`에서 로드하여 빨간 테두리(계약 위반) 없이 표시되는 화면을 `docs/shots/H-102.png`로 캡처(캡처 후 소유 경로 밖인 `public/assets/index.json`·`art/LEDGER.json` 등은 초기 빈 상태로 유지)하고 `npm run verify`·`npm run assets:check` 통과 확인

- **결과 확인 디버그 URL**: `http://localhost:5173/?scene=gallery`
- **검증 명령**:
  - `npm run verify`
  - `npm run assets:check`
- **플랫폼 API**: 없음

## 질문

- [x] 사용자: 계획을 확인하고 "진행"이라고 답해 주세요

## 진행 기록

- 기준 커밋: 4b7d27fec183
- 브랜치: kidariseok/h-102-ticket-start
- 세션 시작: Gemini 4 Argon (High), 2026-10-21 08:26
- [x] 단계 1: `pngjs` 설치, `package.json`에 `assets:check` 및 `verify` 스크립트 갱신, `art/source/README.md` 3단계 사용법 작성
- [x] 단계 2: `scripts/assets.mjs` 에셋 정리 스크립트 구현 (계약 표 파싱, 마젠타·1px 번짐 제거, 발끝 y=116/중앙 정렬, 크기 초과 실패, 시트 병합 및 장부 갱신)
- [x] 단계 3: `scripts/assets-check.mjs` 에셋 계약 검사 스크립트 구현 (파일·높이·너비·프레임 범위·알파 채널·장부 대조 검사)
- [x] 단계 4: `scripts/fixtures/` 테스트 마젠타 이미지 생성 및 `tests/assets-pipeline.test.ts` 단위 테스트 작성 (`npm run verify` 통과)
- [x] 단계 5: Fixture 에셋을 변환해 `?scene=gallery`에서 빨간 테두리 없이 표시되는 화면을 `docs/shots/H-102.png`(390×844)로 캡처하고 최종 검증(`npm run verify`, `npm run assets:check`) 완료

## 결과 보고

- 바뀐 파일:
  - `package.json`, `package-lock.json`: `pngjs` 개발 의존성 추가, `assets:check` 스크립트 추가 및 `verify`에 `npm run assets:check` 연결
  - `art/source/README.md`: 사용자가 따라 할 3단계 에셋 넣기·정리·검사 사용법 작성
  - `scripts/assets.mjs`: `src/assets.ts` 계약 표 파싱, 마젠타(`#FF00FF` ± 오차) 투명화 및 경계 1px 분홍 번짐 제거, 발끝 기준선(`y=116`)/정중앙 정렬, 크기 초과 시 최근접 축소 없이 실패, 가로 한 줄 시트 병합(`public/assets/<키>.png`), `public/assets/index.json`·`art/LEDGER.json` 갱신 구현
  - `scripts/assets-check.mjs`: `index.json`·`public/assets/*.png`·`art/LEDGER.json`·`src/assets.ts` 계약 대조 검사(파일 존재, 높이·너비·프레임 범위, 알파 채널 여부, 장부 필수 필드, 장부에만 있는 파일 및 계약 외 키 검출) 구현
  - `scripts/fixtures/`: 마젠타 배경·1px 분홍 테두리·크기 초과 테스트용 fixture PNG 및 생성·테스트 하네스(`generate-fixtures.mjs`, `pipeline-harness.mjs`, `pipeline-harness.d.mts`, `source/`, `oversize/`)
  - `tests/assets-pipeline.test.ts`: 계약 파싱 일치, 마젠타·1px 번짐 제거, 발끝 `y=116` 및 중앙 정렬, 크기 초과 실패, 엔드투엔드 변환 및 `assets:check` 위반 검출 단위 테스트 6종
  - `docs/shots/H-102.png`: 변환된 에셋(`ally_rifle_idle`, `ally_rifle_attack`)이 갤러리(`?scene=gallery`)에서 빨간 테두리 없이 표시되는 390×844 스크린샷
- 검증 결과:
  ```
  > shoottrial@0.1.0 verify
  > npm run typecheck && npm run test && npm run assets:check && npm run build
  > tsc --noEmit
  > vitest run --passWithNoTests
  Test Files  9 passed (9)
       Tests  106 passed (106)
  > node scripts/assets-check.mjs
  ✓ assets:check 통과 (검사한 에셋 키: 0개)
  > vite build
  ✓ built in 1.56s
  ```
- 스크린샷:
  - `docs/shots/H-102.png` (`/?scene=gallery&fps=1&safe=1`, 390×844)
- 사용자 확인 방법:
  - `art/source/<키>/` 폴더에 마젠타 배경 `01.png`… 또는 `sheet.png`를 넣고 `node scripts/assets.mjs <키>` 실행 후 `npm run assets:check` 및 `http://localhost:5173/?scene=gallery`에서 확인 (`art/source/README.md` 참고)
- 확인하지 못한 점:
  - `art/source/`에 사용자 실데이터 원본이 아직 들어와 있지 않아 fixture 마젠타 시트로 변환 및 갤러리 렌더링을 검증함.
- 다음 제안:
  - A-101 스타일 타깃 승인 후 생성된 마젠타 시트를 `art/source/<키>/`에 넣고 `node scripts/assets.mjs`로 일괄 변환 진행.

## 인계 메모
