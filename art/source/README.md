# 에셋 받은편지함 사용법 (`art/inbox/` → `public/assets/`)

Gemini Argon 이미지나 Figma에서 만든 그림을 **`art/inbox/<키>.png`로 저장한 뒤 명령어 한 번**으로 게임 규격(`docs/ART.md` §4)에 맞춰 `public/assets/`로 변환하고 장부(`art/LEDGER.json`)에 등록합니다.

---

## 한 단계 사용법

1. 그림을 계약 키 이름(`src/assets.ts` 및 `docs/tickets/A-102-art-pack.md` 참고, 예: `ally_rifle_idle.png`, `ally_rifle_attack.png`, `card_rifle.png`, `bg_gate.png`)으로 **`art/inbox/<키>.png`**에 넣습니다.
2. 터미널에서 아래 명령 한 줄을 실행합니다.

```bash
node scripts/assets.mjs
```

---

## 스크립트가 자동으로 하는 일

- **받은편지함 이관**: `art/inbox/<키>.png`를 `art/source/<키>/sheet.png`로 옮깁니다(기존 `sheet.png`가 있으면 `sheet.prev.png`로 백업). 계약에 없는 이름이면 가장 비슷한 키 3개를 알려 주고 멈춥니다.
- **마젠타 제거 및 프레임 자동 분리**:
  - `#FF00FF`(± 허용 오차) 배경과 1px 분홍 번짐을 지운 뒤, 세로로 완전히 투명한 열을 경계로 덩어리를 나눕니다.
  - 간격이 4px 미만인 조각(몸통과 떨어진 총구 등)은 하나로 합치고, 가장 큰 덩어리 면적의 3% 미만인 작은 조각(남은 글자·반짝이)은 버립니다.
  - 덩어리 수가 계약 허용 프레임 범위 밖이면 찾은 덩어리 수와 각 `x` 범위를 출력하고 실패합니다.
- **자동 축소 및 캔버스 정렬**:
  - **유닛(`ally_*`, `enemy_*`)**: 가장 큰 프레임의 내용 높이가 `96px`이 되도록 한 배율로 줄이고 발끝을 `y=116` 기준선에 맞춥니다. 같은 캐릭터의 다른 동작(`_attack` 등)은 먼저 처리된 기준 키(`_idle`·`_walk`·`_run`)의 배율(`art/LEDGER.json`의 `scale`)을 그대로 이어 씁니다.
  - **카드(`card_*`, 256×320)**: `240×300` 안에 맞추고 정중앙에 둡니다.
  - **보스·이펙트·지뢰(`boss_*`, `fx_*`, `mine*`)**: 캔버스의 90% 안에 맞추고 정중앙에 둡니다.
  - **배경(`bg_*`)**: 마젠타를 지우지 않고 `720×1560`을 꽉 채우도록(cover) 줄인 뒤 가운데 기준으로 자릅니다.
  - 이미 목표 크기보다 작으면 확대하지 않고 그대로 둡니다.
- **검사 및 갤러리 확인**:
  - `npm run assets:check`로 계약·장부 대조 검사를 실행할 수 있습니다.
  - `npm run dev` 실행 후 `http://localhost:5173/?scene=gallery`에서 변환 결과를 눈으로 확인합니다.

### (선택) 고급 옵션: `art/source/<키>/meta.json`
특정 키에 균등 분할이나 축소 금지가 필요하면 `art/source/<키>/meta.json`에 설정할 수 있습니다.
- `"split": "even"`: 자동 분리 대신 가로 너비를 프레임 수로 균등 분할
- `"fit": false`: 자동 축소를 끄고 캔버스보다 크면 에러 발생
