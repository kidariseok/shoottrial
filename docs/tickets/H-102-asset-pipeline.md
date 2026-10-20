# H-102 에셋 정리·검사 스크립트: 마젠타 제거 → 128 캔버스 정렬 → public/assets + 계약 검사

상태: 대기
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

- [ ] `npm run verify`(assets:check 포함) 통과
- [ ] fixture 테스트 통과(마젠타 제거·기준선·크기 초과 실패)
- [ ] `art/source/README.md`에 사용자가 따라 할 3단계 사용법
- [ ] `docs/shots/H-102.png`: 처리된 키가 갤러리에 빨간 테두리 없이 보이는 화면

디버그 URL: `http://localhost:5173/?scene=gallery`

## 작업 계획

## 질문

## 진행 기록

- 기준 커밋: (/start-ticket이 적는다)
- 브랜치: (/start-ticket이 적는다)
- 세션 시작: (모델, 시각)

## 결과 보고

- 바뀐 파일:
- 검증 결과:
- 스크린샷:
- 사용자 확인 방법:
- 확인하지 못한 점:
- 다음 제안:

## 인계 메모
