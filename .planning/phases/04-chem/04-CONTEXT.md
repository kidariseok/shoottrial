# Phase 4: 화학전 — CONTEXT (기획 결정)

> 작성: 2026-10-22, Claude(기획 = 레인 A). 우선순위: AGENTS.md > docs/GDD.md > docs/TECH.md > 이 문서.
> 먼저 읽을 것: 1~3단계 SUMMARY, 특히 02-05(카드 능력), 02-06(지뢰), 03-06(튜닝 봇·제설병 1회 밀림 규칙).

## Phase Boundary

- **하는 것**: 화학병 카드(6번째), 화학탄 포격(예고 → 2×2 가스 칸 → 제독), 가스 피해·감속, 화학병 면역·제독·병장 버프·시너지, 강화 군견, 해금 순서에 화학병 추가, `?gas=1` 디버그, 판 기록 이벤트, 튜닝 봇 재측정.
- **안 하는 것**: 화력 지원(Phase 5), 그림(Phase 6), 저장 이전(Phase 6), 소리, UI 변경(레인 B).
- 레인 B 파일(`src/ui/`, `main.ts`, `debug.ts`, `assets.ts`, `save.ts`, `package.json`)은 고치지 않는다. UI는 이미 `chem` 이름("화학병")·머리글자("화")를 안다(`src/ui/helpers.ts`).

## 확정 결정 (GDD §5.2·§5.3·§5.4·§5.6이 출처)

### 화학병 카드
- `CARD_KEYS`에 `'chem'`을 **6번째**로 넣는다(`['rifle','sniper','blower','cook','miner','chem']`).
- 수치: 비용 2, HP 90, 공격 6, 간격 1.0, 사거리 3, 색은 노랑 계열(예: 0xb8a02a), 이름·머리글자는 data.ts.
- 공격 방식은 **지뢰설치병과 같은 단발 사격**(사거리 3, 같은 열 가장 가까운 적)이다. 따로 만들지 말고 소총수·지뢰설치병 경로를 재사용한다.
- 해금: `UNLOCK.order = ['cook', 'miner', 'chem']`.
- 시너지 표(`SYN` 또는 기존 구조)에 chem 2명 단계가 있다. 4명 단계는 없다.

### 가스 (`data.ts`의 `GAS` 한 객체)
- 수치는 아래와 같다.
  - `warn: 1.5`: 예고 초
  - `life: 20`: 지속 초
  - `slow: 2`: 공격 간격 배율
  - `dps: 5`: 초당 피해
  - `cleanse: 3`: 제독 주기 초
  - `reach: [1, 2]`: 이등병·일병 1, 상병 이상 2. 체비셰프 거리
  - `sgtBuff: 1.15`: 병장 범위 1 안 아군의 피해 배율
- 가스는 **배치 구역 5×3 칸 단위**다. 칸마다 남은 시간을 가진다(`gas: number[][]`, 3행×5열, 0이면 없음). 겹쳐 떨어지면 남은 시간을 `life`로 갱신한다(더하지 않음).
- 화학탄 일정
  - 횟수는 `WaveDef.gas`다: 웨이브 7=1, 9=1, 10=2, 나머지 0.
  - 그 웨이브 `spawnPlan`의 마지막 출현 시각 T의 35%·70% 지점에 떨어진다(gas=1이면 35%만).
  - **순수 함수** `gasPlan(wave, plan, rand)` → `{ t, col, row }[]`. `col ∈ 0..3`, `row ∈ 0..1`이고 2×2의 왼쪽 위 칸이다.
  - 시드 난수는 출현과 **다른 스트림**(`createRng(seed + 3)`)을 쓴다.
- 떨어지는 과정: `t - warn`에 2×2 붉은 예고(반투명 사각 + 점멸) → `t`에 가스 칸 생성 + 짧은 흔들림.
- 가스 효과: 아군이 가스 칸 위에 있고 면역이 아니면 공격 간격 × `slow`, 초당 `dps` 피해(쓰러질 수 있다). `interval()` 결과에 곱하는 식으로 붙여 기존 함수를 크게 바꾸지 않는다.
- **면역**: 어느 화학병이든 그 범위 안이면 면역이다(자기 포함, 쓰러진 화학병은 제외). 순수 함수 `inChemReach(chems: {col,row,rank}[], col, row): boolean`.
- **제독**: 화학병마다 `cleanse` 초 주기로 범위 안 가스 칸을 전부 0으로 만든다. 이벤트 `gas_clear`(지운 칸 수).
- **시너지 2명**: 가스가 생성되는 순간 `inChemReach`인 칸은 만들지 않는다(= 즉시 제독).
- **병장 버프**: 병장 화학병 범위 1 안 아군(자기 제외)의 **직접 공격 피해**(단발·저격) × `sgtBuff`. 화상·지뢰에는 곱하지 않는다(2026-10-22 기획 결정). 병장이 여럿이어도 한 번만 적용한다.
- 웨이브 사이(정산·준비)에는 가스가 모두 사라진다. 전투가 끝나 아군이 회복되는 시점과 같다.

### 강화 군견
- `ENEMY_KEYS`에 `'dogPlus'`를 더한다. `ENEMIES.dogPlus = { ...군견 값, name: '강화 군견', hp: 80, knock: 1.0, color: 더 진한 색 }`.
  - 열 옮기기(군견 능력)도 그대로 한다. `pickDogLane` 판정에 dogPlus를 포함한다.
- `WaveDef`에 `dogPlus: number`를 더한다. 웨이브 9는 dog 4 + dogPlus 4, 웨이브 10은 dog 5 + dogPlus 5다(GDD §5.6). 나머지는 0.
- 도형: 군견 도형 + 진한 색 + 흰 테두리 2px.

### 디버그·기록
- `?gas=1`은 그 판의 **모든 웨이브** `gas` 값에 1을 더한다(웨이브 10이면 3회). `debug.ts`는 B 파일이므로 **BattleScene에서 `new URLSearchParams(location.search).get('gas')`로 직접 읽는다**(`// ponytail: 게이트 때 debug.ts로 옮긴다`).
- 판 기록 이벤트: `gas_drop`(웨이브, col, row), `gas_clear`(n). `?scene=log`는 바꾸지 않아도 된다.
- 튜닝 봇(`.planning/phases/03-econ/tune-bot.mjs`)에 chem을 사는 규칙이 없어도 된다.
  - 게이트를 다시 돌려 결과를 `04-TUNING.md`에 적는다.
  - 초행자 중앙값이 5 미만이면 **멈추고 보고**한다. 수치를 임의로 조정하지 않는다.

## 테스트 (TDD, `tests/rules-chem.test.ts`)
- `gasPlan`: gas=0이면 빈 배열, 1이면 35% 지점 1개, 2이면 35%·70%. 같은 시드면 같은 결과. col·row가 범위 안이다.
- `inChemReach`: 거리 1·2, 계급별 범위, 쓰러진 화학병 제외(입력에서 빠진 것으로 표현).
- 가스 감속을 곱한 간격, 병장 버프가 중복되지 않음, 시너지 2명 즉시 제독 판정. 즉시 제독은 순수 함수 `gasCellsAfterDrop(cells, chems, synergyOn)` 같은 모양으로 만든다.
- `spawnPlan`이 dogPlus를 포함하고, 웨이브 9·10의 총 군견 수가 GDD와 같다.
- `nextUnlock`: cook → miner → chem → null.
- 카드 5종을 가정한 기존 테스트가 6종이 되며 깨지면, **기대값을 GDD에 맞게 고친다**(예: 상점 추첨 카드 목록).

## 화면 확인 (헤드리스, 기존 방식)
- `/?scene=battle&wave=7&unlock=all&deck=chem:2,rifle:4&supply=99&seed=42&gas=1`
  - 예고 → 가스 칸 → 화학병 근처 칸이 즉시 제독되는 장면(시너지 2명)을 찍는다.
  - 스크린샷: `docs/shots/M3-04.png`
- 캔버스는 1개여야 한다(Vite `?t=` 이중 Game 함정).
- 시간은 `game.scene.pause` + `scene.update(0,100)`로 진행한다.

## 계획 단위 제안
- **04-01**: 수치·순수 함수 TDD. CARD chem, GAS, ENEMIES.dogPlus, WaveDef.gas·dogPlus, gasPlan, inChemReach, 해금 순서.
- **04-02**: 전투 반영과 확인.
  - 가스 칸: 예고·생성·감속·피해·면역·제독·병장 버프·시너지·정리
  - 강화 군견 출현과 도형
  - `?gas=1`, 기록 이벤트, 스크린샷
- **04-03**: 튜닝 봇 재측정. 결과는 `04-TUNING.md`.
