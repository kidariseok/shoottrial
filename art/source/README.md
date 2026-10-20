# 에셋 원본 넣기·정리 3단계 사용법 (`art/source/`)

Gemini Argon 이미지나 Figma에서 만든 **마젠타(`#FF00FF`) 배경 원본 그림**을 게임 규격(`docs/ART.md` §4)에 맞춰 `public/assets/`로 변환하고 장부(`art/LEDGER.json`)에 등록하는 안내서입니다.

---

## 1단계: `art/source/<키>/` 폴더에 원본 넣기

계약 키 이름(`src/assets.ts` 및 `docs/ART.md` §4 참고, 예: `ally_rifle_idle`, `enemy_inf_walk`, `fx_explosion`)으로 폴더를 만들고, 아래 **두 가지 방법 중 하나**로 PNG 파일을 넣습니다.

1. **프레임별 낱장 파일**: `01.png`, `02.png`, `03.png` … 순서대로 넣기
2. **가로 한 줄 시트 1장**: `sheet.png` 이름으로 넣기 (프레임 수만큼 가로로 균등 분할해 처리합니다)

### (선택) `meta.json` 함께 넣기
같은 폴더(`art/source/<키>/meta.json`)에 출처와 생성 도구를 적어 두면 `art/LEDGER.json` 장부에 자동으로 기록됩니다. 생략하면 기본값으로 채워집니다.

```json
{
  "tool": "gemini-argon",
  "prompt": "art/source/ally_rifle_idle/prompt.txt",
  "source": "https://www.figma.com/design/6RrU20Hv8way6vlYjcTJU3/?node-id=5-18",
  "license": "proprietary",
  "edited": true
}
```

---

## 2단계: 정리 스크립트 실행하기

터미널에서 아래 명령을 실행합니다.

```bash
# 특정 키 하나만 변환할 때
node scripts/assets.mjs ally_rifle_idle

# art/source/ 아래의 모든 키를 한꺼번에 변환할 때
node scripts/assets.mjs
```

### 스크립트가 자동으로 하는 일
- **마젠타 제거**: `#FF00FF`(± 허용 오차) 배경을 투명하게 바꾸고, 캐릭터 외곽선의 분홍 번짐(1px 테두리)을 정리합니다.
- **캔버스 정렬**: 각 프레임의 불투명 내용 경계를 찾아 계약 캔버스(예: `128×128`)에 맞춥니다.
  - **유닛(`ally_*`, `enemy_*`)**: 가로 중앙, **발끝(가장 아래 불투명 픽셀)을 `y=116` 기준선**에 맞춥니다.
  - **보스·이펙트·카드·아이콘·계급장·타일·배경**: 가로·세로 **정중앙**에 맞춥니다.
- **크기 초과 방지**: 잘라낸 내용이 계약 캔버스(또는 발끝 기준선 위 높이 116px)보다 크면 **임의로 축소하지 않고 에러와 실제 크기를 출력하며 멈춥니다**. 원본 크기를 조절한 뒤 다시 실행해 주세요.
- **결과 저장**: 가로 한 줄 시트 `public/assets/<키>.png`를 생성하고, `public/assets/index.json`과 `art/LEDGER.json`을 갱신합니다.

---

## 3단계: 계약 검사 및 갤러리 화면 확인하기

변환이 끝나면 계약 검사와 갤러리 화면으로 결과를 확인합니다.

```bash
# 1) 에셋 계약·장부 검사 (높이·너비·프레임 수·알파 채널·장부 대조)
npm run assets:check

# 2) 개발 서버 실행 후 갤러리에서 눈으로 확인
npm run dev
```

브라우저에서 `http://localhost:5173/?scene=gallery` 를 열었을 때, 변환한 에셋이 **빨간 테두리(규격 위반 경고) 없이** 선명하게 보이면 완료입니다.
