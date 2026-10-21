# ART: 아트 바이블 + 에셋 계약 + 요청 목록 v1.0

> 작성: 2026-10-20, Claude(기획). 이전 판(픽셀 탑다운 슈터)은 `docs/_archive/qrf-ART.md`.
> 그림은 **사용자가 Gemini Argon 이미지와 Figma로** 만든다. 코드는 그림을 지어내지 않는다. §4 계약의 키·크기로 **플레이스홀더**를 쓰고, 진짜 그림이 오면 같은 이름으로 교체한다.
> 상태: 계약 구조(§2·§4)는 확정이다. **결은 Figma 기존 에셋에 맞춰 "치비 비율 픽셀풍 + 마젠타 원본"으로 확정**했다(2026-10-20, `docs/research/figma-inventory.md`). 해상도 720×1280은 A-101 목업으로 최종 확인한다.

---

## 0. 지난번에 그림이 게임에 제대로 안 들어간 이유와 대책

| 원인(추정) | 대책 |
|---|---|
| 그림마다 캔버스 크기와 캐릭터 크기가 달랐다 | 모든 유닛을 **같은 캔버스(128×128)**에, **발끝을 같은 기준선(y=116)**에 맞춘다(§2) |
| 프레임 수·순서가 정해져 있지 않았다 | 상태별 프레임 수를 계약 표로 고정한다(§4). 다르면 검사 스크립트가 실패한다 |
| 배경이 투명하지 않거나 테두리가 지저분했다 | 원본은 **마젠타 #FF00FF 단색 배경**으로 생성 → 스크립트가 투명 처리 |
| 코드가 그림을 임의로 늘리고 줄였다 | 코드는 계약 크기 그대로 그린다. 배율은 `data.ts`의 `SPRITE_SCALE` 하나 |
| "그림을 줬는데 안 쓰였다"를 확인할 방법이 없었다 | `?scene=gallery`에서 모든 키를 한눈에 확인하고, `npm run assets:check`가 계약·장부·파일을 대조한다 |
| Figma와 화면이 달랐다 | UI는 Figma가 정답이다. UI 티켓은 Figma 프레임 스크린샷과 나란히 비교한 사진을 결과 보고에 붙인다 |

## 1. 방향

**Figma "군대 디자인 에셋"의 결을 그대로 따른다: 치비 비율 픽셀풍 캐릭터 + 9:16 탑다운 픽셀 맵.** 진지한 가상 전쟁극의 긴장은 그림체가 아니라 연출(붉은 경보등, 사이렌 테두리, 무전)로 만든다. 아군은 디지털 위장복·정글모, 적은 회갈색 군복으로 색을 갈라 한눈에 구분되게 한다.

| 가져올 것 | 가져오지 않을 것 |
|---|---|
| 한국군 전투복(디지털 위장 느낌), 방탄헬멧, K2·K14 실루엣 | 실제 부대 마크·계급장 원본 이미지, 제조사 로고 |
| 위병소·연병장·철책·초소 같은 부대 풍경 | 실존 부대 정문의 글자·표지판 문구 |
| 북한군 보병의 실루엣(전투모, 보총) | 실존 지도자, 국기 훼손, 견장 원본, 우상화 그림 |
| 레퍼런스 게임의 읽기 쉬운 배치 화면 구성 | 특정 게임(클래시 로얄·PvZ 등)의 캐릭터·UI·이름 |
| 쓰러짐 + 페이드, 파편·연기 | 피, 시체, 고통 표현 |

## 2. 기술 규격

| 항목 | 규격 |
|---|---|
| 논리 해상도 | **720×1280 세로**. 배경은 720×1560까지. 픽셀풍이라 **최근접(nearest) 확대**를 쓴다(Phaser `pixelArt: true`) |
| 시점 | 3/4 탑다운. 아군은 **등이 보이게 위를 향하고**(적이 위에서 온다), 적은 **앞모습이 보이게 아래를 향한다** |
| 유닛 캔버스 | **128×128 고정**. 몸 높이 약 96px. **피벗 = 발 중앙(64, 116)** |
| 보스 | 256×256. 부품으로 나눌 수 있으면 나눈다(차체·포탑) |
| 카드 일러스트 | 256×320(얼굴이 보이는 상반신). 카드 틀은 UI가 따로 그린다 |
| 시트 | **가로 한 줄**, 프레임 사이 여백 0, 프레임 크기 = 캔버스 크기 |
| 배경 | 원본은 마젠타 #FF00FF 단색. 최종 PNG는 투명 |
| 그림자 | 발밑 그림자는 코드가 그린다(반투명 타원). 그림에 넣지 않는다 |
| 계급장 | 따로 그린다(§4 `rank_*`). 코드가 유닛 머리 위·카드 모서리에 얹는다 |
| 포맷 | PNG, sRGB. 한 장 512KB 이하 |
| 빛 | 왼쪽 위에서 온다. 외곽선은 짙은 남색(`#1b1d26`) 1~2px |

**가독성 규칙**
- **붉은색·주황은 적의 공격·경보·예고에만** 쓴다. 아군 탄은 노랑·흰색.
- 바닥은 어둡고 채도를 낮게, 유닛은 밝고 외곽선을 뚜렷하게 한다.
- 화면을 흑백으로 바꿔도 아군·적·탄·지뢰 표식이 바닥과 구분되어야 한다(G2 검사).

## 3. 제작 파이프라인

```
① 스타일 타깃 1장(A-101) ─ 사용자 승인. 이 그림이 이후 모든 생성의 참조 이미지다
② 캐릭터 기준 시트(앞·뒤·옆) ─ ①을 첨부해 생성
③ 상태별 프레임 시트 ─ ②를 첨부해 한 상태씩 생성
④ 정리: 마젠타 제거·128 캔버스 정렬·발 기준선 맞춤 (H-102 스크립트 또는 수작업)
⑤ 장부 기록: art/LEDGER.json
⑥ public/assets/<키>.png로 넣기 → npm run assets:check → ?scene=gallery 확인
```

| 단계 | 담당 | 도구 |
|---|---|---|
| ①②③ | 사용자 | Gemini Argon 이미지, Figma(UI·카드 틀) |
| ④ | Antigravity(H-102) + 사용자 손질 | Node 스크립트 |
| ⑤⑥ | Antigravity(에셋 연결 티켓) | `assets:check`, 갤러리 |

### 3.1 일관성 요령

1. 항상 **기준 시트를 참조 이미지로 첨부**하고, 프롬프트 맨 앞에 "same character"를 둔다.
2. 한 묶음(예: 아군 5종의 대기 프레임)은 같은 날, 같은 대화, 같은 프롬프트 골격으로 만든다.
3. 프레임이 계속 어긋나면 **프레임 수를 줄이고 코드 트윈**(들썩임·반동)으로 메운다. 계약 표의 "최소" 열이 그 하한이다.
4. 무기 섬광·바람·화염은 이펙트 시트로 따로 그린다. 몸 그림에 넣지 않는다.

### 3.2 프롬프트 골격 (영어가 더 안정적)

공통 접미사
```
chibi pixel art 2D mobile game sprite (same style as the attached reference), top-down three-quarter view, clean dark outline,
light from top-left, no text, no logos, no blood, plain flat magenta (#FF00FF) background,
character centered with feet on the same baseline
```

| 대상 | 본문 예 |
|---|---|
| 스타일 타깃(A-101) | `vertical 9:16 mobile defense game screenshot at night, Korean army base front gate under red alarm lights, five vertical lanes on a dark parade ground, Korean soldiers in digital camouflage seen from behind at the bottom holding the line, North Korean infantry in brown uniforms advancing from the top, one sniper tracer line, small explosion, serious tone` |
| 아군 기준 시트 | `character reference sheet, young Korean army private, digital camouflage uniform, ballistic helmet, K2 rifle, front view, back view, right side view` |
| 아군 상태 | (기준 시트 첨부) `same character, seen from behind at three-quarter top-down angle, firing the rifle upward, 4 frames in one horizontal row` |
| 적 기준 시트 | `character reference sheet, North Korean infantry soldier, brown-olive uniform, soft cap, rifle, front view, back view, right side view` |
| 생체개조 군견 | `military dog with mechanical implants and one glowing red eye, running toward the camera, top-down three-quarter view, 4 frames in one horizontal row` |

## 4. 에셋 계약 (코드가 쓰는 이름·크기)

- H-101이 이 표를 `src/assets.ts`로 옮긴다. 파일이 없는 키는 **런타임에 같은 크기·같은 프레임 수의 단색 플레이스홀더**로 만든다.
- 진짜 그림은 `public/assets/<키>.png`로 넣으면 바로 교체된다.
- 프레임 수가 "최소~권장"이면 그 범위 안 아무 수나 된다. 코드는 프레임 수를 이미지 너비로 계산한다(**이미지 너비 ÷ 그 키의 캔버스 너비**).

### 4.1 아군 (카드 하나에 아래 6개 키)

`<카드>`는 `rifle`, `sniper`, `blower`, `cook`, `miner`, `chem`(M3)이다.

| 키 | 캔버스 | 프레임(최소~권장) | 피벗 | 플레이스홀더 | 단계 |
|---|---|---|---|---|---|
| `ally_<카드>_idle` | 128×128 | 1~2 | 발 중앙(64,116) | 올리브 사각형 + 카드 머리글자 | M2 |
| `ally_<카드>_attack` | 128×128 | 2~4 | 발 중앙 | 올리브 밝게 | M3 |
| `ally_<카드>_hit` | 128×128 | 1 | 발 중앙 | 흰색 | M3 |
| `ally_<카드>_down` | 128×128 | 1~2 | 발 중앙 | 회색 | M3 |
| `card_<카드>` | 256×320 | 1 | 중앙 | 카드 색 + 이름 | M3 |
| `icon_<카드>` | 64×64 | 1 | 중앙 | 카드 색 원 | M3 |

- 제설병은 `blower`의 `attack`을 **송풍**으로 그린다. 상병 이상의 화염은 이펙트(`fx_flame`)로 덧입힌다.
- 지뢰설치병의 `attack`은 소총 사격이다. 매설 동작은 M3에서 `ally_miner_plant`(2~3프레임)를 추가한다.

### 4.2 적

| 키 | 캔버스 | 프레임 | 피벗 | 단계 |
|---|---|---|---|---|
| `enemy_inf_walk` / `_attack` / `_down` | 128×128 | 2~4 / 2~3 / 1~3 | 발 중앙 | M3(M2는 플레이스홀더) |
| `enemy_dog_run` / `_bite` / `_down` | 128×128 | 2~4 / 2 / 1~3 | 발 중앙 | M3 |
| `enemy_rpg_walk` / `_fire` / `_down` | 128×128 | 2~4 / 2~3 / 1~3 | 발 중앙 | M3 |
| `boss_apc_hull` / `boss_apc_turret` | 256×256 / 128×128 | 1~2 / 1 | 중앙 / 회전축은 A-101 뒤 정함 | M3 |

### 4.3 이펙트·판·UI

| 키 | 캔버스 | 프레임 | 단계 |
|---|---|---|---|
| `fx_muzzle` | 32×32 | 2 | M3 |
| `fx_wind` | 128×256 | 4 | M3 |
| `fx_flame` | 128×256 | 4 | M3 |
| `fx_explosion` | 256×256 | 6 | M3 |
| `fx_heal` | 128×128 | 4 | M3 |
| `fx_gas` | 256×256 | 4(반복) | M3 |
| `mine` / `mine_at` | 64×64 | 1 | M3 |
| `rank_1` ~ `rank_4` | 48×48 | 1(이등병 작대기 1 ~ 병장 4, 가상 디자인) | M3 |
| `bg_gate` | 720×1560 | 1 | M3 |
| `tile_deploy` / `tile_mine` / `tile_hover` | 128×128 | 1 | M3 |
| `ui_*` | Figma 프레임 기준 | — | M3 |

- 저격 궤적, 데미지 숫자, 사이렌 테두리, 그림자는 코드가 그린다.

### 4.4 오디오 (`public/assets/sfx_*.m4a` 30KB 이하, `bgm_*.m4a` 500KB 이하 루프)

- 효과음: `sfx_rifle`, `sfx_sniper`, `sfx_wind`, `sfx_boom`, `sfx_heal`, `sfx_merge`, `sfx_siren`, `sfx_radio`, `sfx_hit`, `sfx_click`, `sfx_buy`
- BGM: `bgm_lobby`, `bgm_defcon2`, `bgm_defcon1`
- 출처와 라이선스를 장부에 적는다.

### 4.5 장부(`art/LEDGER.json`)

- 필드: `id`, `file`, `source`(원본 경로 또는 Figma 노드 URL), `tool`(`gemini-argon`, `figma`, `hand` 등), `prompt`(파일 경로), `license`, `edited`(true/false), `checked`(날짜)
- 플레이스홀더는 장부에 적지 않는다. 출시 전에는 §4의 모든 M2·M3 키가 있어야 한다.

## 5. 사용자에게 드리는 에셋 요청 (체크리스트)

**지금(M1) 필요한 것: A-101 하나뿐이다.** M2는 도형(그레이박스)으로 재미를 먼저 확인한다. 그림은 G1 통과 뒤에 대량 생산한다. 그래야 기획이 바뀌어도 그림을 버리지 않는다.

이미 있는 것(Figma, `docs/research/figma-inventory.md`): 위병소 배경, 소총수 동작 시트, 제설병(송풍기) 시트, 말년병장, UI 패널·버튼·카드 틀, 폭발 이펙트, 보급 드론, 총기·차량 아이템. **아래는 없는 것만 요청한다.**

### A-101 스타일 타깃 (지금)
- [x] Figma 연결(2026-10-20 완료, 인벤토리 작성)
- [ ] **전투 화면 목업 1장**(Figma, 세로 9:16): 위병소 배경(`6:36`) 위에 5열×3행 배치 칸, 기존 소총수 2명, 상점 패널·HUD(기존 UI 패널 조합). 새로 그리지 말고 있는 그림을 배치만 한다
- [ ] **북한군 보병 기준 시트**(앞·뒤·옆, 마젠타 배경): 북한군 물자 시트(`7:53`)를 참조 이미지로, 견장은 변형
- [ ] **소총수 뒷모습 사격** 2~4프레임(위쪽을 향해 쏘는 자세): 전투 모션 시트(`5:18`)를 참조 이미지로
- [ ] 계급장 4종을 **한국군 가로 작대기** 1~4개로(기존 V자 대체)

### M3 묶음 → **`docs/tickets/A-102-art-pack.md`로 대체**(2026-10-21)

프롬프트·파일 이름·순서는 A-102가 정답이다. 피격·쓰러짐·아이콘·계급장·타일은 코드가 만든다(그리지 않는다). 아래는 기록용 원래 목록이다.
- [ ] **적 3종**(보병·RPG병·생체개조 군견) × (걷기 4, 공격 3, 쓰러짐 3) = 30프레임 ← 가장 먼저(지금 하나도 없다)
- [ ] **새 아군 3종 기준 시트 + 프레임**: 저격수(K14, `7:59` 참조), 취사병, 지뢰설치병. 각 (뒷모습 대기 2, 공격 4, 피격 1, 쓰러짐 2)
- [ ] 기존 소총수·제설병을 뒷모습 기준으로 보충: 대기·공격·피격·쓰러짐(제설병은 송풍 연속 2~4프레임)
- [ ] 카드 일러스트 5장(기존 큰 캐릭터 `6:21` 결로) + 아이콘 5
- [ ] 화학병 1종(같은 구성, 방독면 착용) — M3 후반
- [ ] 보스 장갑차 탑다운 차체·포탑 분리(`6:42`·`8:70` 참조)
- [ ] 이펙트 보충: 바람·화염·회복·가스(폭발·섬광은 `6:39`에 있다)
- [ ] `bg_gate`: `6:36`을 720×1560 비율로 위아래 확장(정문 위 숲, 아래 연병장)
- [ ] UI(Figma): 세로 HUD, 상점 패널, 카드 틀(계급별 테두리 색), 결과 화면, 모달, 로비 — 기존 패널(`6:33`) 결로
- [ ] 도입 4컷 일러스트(선택): 생활관 → 경보 → 폭격 → 위병소

## 6. AI 표시

| 항목 | 내용 |
|---|---|
| 근거 | AI기본법 §31(2026-01-22 시행). 생성형 AI 결과물 표시. 하위 법령과 과태료는 R-101에서 다시 확인한다 |
| 대응 | 첫 실행 화면 한 줄("일부 그래픽은 생성형 AI로 제작되었습니다") + 설정 > 크레딧 + 장부의 `tool` 필드 |
