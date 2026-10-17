# ART: 아트 바이블 + AI 생성 파이프라인 + 에셋 계약 v0.1

> 작성: 2026-10-17, Claude(기획). 사용자 결정: **픽셀아트 + 생성형 AI 위주**.
> 상태: 규격(§2)과 에셋 계약(§4)은 확정이다. 팔레트(§2.2)와 스타일 타깃(§3.1)은 A-001에서 사용자가 승인하면 확정된다.
> Antigravity는 그림을 지어내지 않는다. §4 표에 있는 파일 이름과 크기로 플레이스홀더를 만들고, 진짜 그림이 오면 같은 이름으로 교체한다.

---

## 1. 한 줄 방향

**밝은 낮의 한국 도시, 회색 기계 군단, 원색 아군.** 메탈슬러그의 묵직한 손맛을 더 단순하고 읽기 쉬운 화면으로 만든다. 무섭지 않고 귀엽게 위험하다.

| 가져올 것 | 가져오지 않을 것 |
|---|---|
| 메탈슬러그식 상·하체 분리 캐릭터, 큼직한 폭발 | 메탈슬러그·Cat Gunner의 캐릭터·UI·로고·이름 |
| 한국 거리 디테일(차단기, 버스, 간판 형태, 아파트 실루엣) | 실존 상호·로고·브랜드 색 조합(배달 앱 민트색 등) |
| 군복의 실루엣(전투모, 방탄조끼, 전투화) | 실제 육군 마크·부대 마크·계급장 원본 이미지 |

---

## 2. 기술 규격 (확정)

### 2.1 크기

| 항목 | 규격 |
|---|---|
| 내부 해상도 | 640×360(가로는 기기 비율에 따라 최대 800까지 배경 확장), 최근접 확대, 안티에일리어싱 없음 |
| 주인공 | 프레임 48×48, 실제 몸 높이 약 40px. **하체 시트 + 상체 시트 + 총 팔(회전용) 분리** |
| 잡졸 | 32×32 ~ 48×48 |
| 보스 | 128~192px, **부품 PNG 여러 장**(몸통·포탑·바퀴/다리·눈)으로 나눠 코드가 조립·움직인다 |
| 배경 | 스테이지마다 3층 패럴랙스: 먼 배경 960×360, 중간 960×200, 바닥 타일 32×32 반복 |
| UI | 9-slice 프레임 16px 모서리, 아이콘 24×24, 폰트 Galmuri11 / Galmuri7 |
| 포맷 | PNG(가능하면 인덱스 컬러), 시트는 가로 한 줄, 프레임 사이 여백 0 |
| 금지 | 반투명 픽셀(그림자 레이어 제외), 비정수 축소, 그라데이션, 사진 질감 |

### 2.2 팔레트 (A-001에서 확정, 32색 이내)

| 묶음 | 색 | 용도 |
|---|---|---|
| 아군 | 시안 `#2ec5e8`, 녹색 `#3fbf6f`, 군복 올리브 3단계 | 플레이어, 아군 탄, 아군 UI |
| **적·위험** | 크림슨 `#e8344a`, 주황 `#ff8a2a`, 흰 심 `#fff4e0` | 적 눈, **모든 예고(띠·선·원)**, 적 탄 |
| 기계 | 회색 4단계(`#2b2d36` ~ `#c9cdd6`) | 로봇 몸체 |
| 도시 | 채도 낮은 하늘·콘크리트·아스팔트·나무 8색 | 배경 |
| 빛 | 노랑 `#ffd23f`, 흰 `#ffffff` | 총구 섬광, 스파크, 건빵 |

**가독성 규칙(필수)**
- 붉은색·주황은 **적의 공격과 예고에만** 쓴다. 배경에 넣지 않는다.
- 아군 탄은 시안, 적 탄은 크림슨에 흰 심을 넣는다.
- 화면을 흑백으로 바꿔도 플레이어·적 탄·예고가 배경과 구분되어야 한다(G2 검사).

### 2.3 빛·외곽선

- 빛은 왼쪽 위에서 온다.
- 외곽선은 1px 바깥선만 쓴다. 색은 순검정 대신 `#1b1d26`.
- 적의 '눈'(GRAY 표식)은 모두 같은 크림슨 원 + 흰 점이다. 같은 적 편이라는 신호다.

---

## 3. AI 생성 파이프라인

```
① 스타일 타깃 1장(A-001) ─ 사용자 승인
② 기준 시트(캐릭터·로봇별 정면/측면) ─ ①을 참조 이미지로 생성
③ 포즈·프레임 ─ ②를 참조 이미지로 넣고 1장씩 생성
④ 정리: scripts/pixelize ─ 축소(최근접) + 팔레트 강제 + 배경 제거 + 외곽선
⑤ 사람 손질: Aseprite / Pixelorama(무료) ─ 깨진 픽셀, 프레임 정렬
⑥ 장부 기록: art/LEDGER.json ─ 생성 도구, 프롬프트 파일, 원본 경로, 손질 여부
⑦ public/assets/ 같은 이름으로 교체 → npm run assets:check
```

| 단계 | 담당 | 도구 |
|---|---|---|
| ①②③ | 사용자 | Gemini 앱(Pro) 이미지 생성. 걷기 사이클이 계속 깨지면 R-003에서 픽셀 특화 AI 도구 평가 |
| ④ | Antigravity(H-002에서 스크립트 이식) | Node 스크립트 |
| ⑤ | 사용자 | Aseprite 또는 Pixelorama |
| ⑥⑦ | Antigravity(A 티켓 연결 작업) | `assets:check` |

### 3.1 스타일 타깃 (A-001)

전투 화면 한 장을 실제 해상도 비율(16:9)로 만든다. 구성은 다음과 같다.

| 위치 | 구성 |
|---|---|
| 배경 | 위병소: 차단기, 초소, 연병장, 멀리 산과 아파트 |
| 화면 왼쪽 | 플레이어가 소총을 쏘는 중 |
| 화면 오른쪽 | 배달 로봇 2기 + 방범 드론 1기(조준선 표시) |
| 화면 중앙 | 유탄 폭발 1개 |
| 화면 위 | 좌상단 HUD만 대충 표시(우상단은 비움) |

이 한 장이 이후 모든 생성의 **참조 이미지**가 된다. 승인 전에는 다른 에셋을 생성하지 않는다.

### 3.2 프롬프트 팩 (Gemini 이미지용 시작점, 영어가 더 안정적)

공통 접미사(모든 프롬프트 끝에 붙인다)
```
16-bit pixel art, clean 1px dark outline (#1b1d26), flat shading with 3 tones, light from top-left,
limited palette, no anti-aliasing, no gradients, no text, no logos, side view, plain flat magenta (#ff00ff) background
```

| 대상 | 프롬프트 본문 |
|---|---|
| 스타일 타깃 | `side-scrolling arcade shooter screenshot, a young Korean army private in olive uniform and helmet firing a rifle, two box-shaped six-wheeled delivery robots and a police quadcopter drone with a red laser sight attacking, Korean military base front gate with a boom barrier and guard post, apartment silhouettes far away, bright daytime, cute but dangerous robots with one red glowing eye, small grenade explosion in the middle` |
| 주인공 기준 시트 | `character reference sheet, young Korean army private, olive combat uniform, helmet with cover, bulletproof vest, cheerful determined face, chibi-ish 3-head proportions, front and side view` |
| 주인공 하체 달리기 | (기준 시트를 참조 이미지로 첨부) `same soldier, legs only, running cycle, 6 frames in one horizontal row, side view facing right` |
| 주인공 상체 | (첨부) `same soldier, upper body only without arms holding weapon, idle breathing 2 frames, side view facing right` |
| 총 팔 | (첨부) `same soldier's arm holding a compact assault rifle, isolated, pointing right, pivot at the shoulder` |
| 구르기 | (첨부) `same soldier, combat roll, 4 frames horizontal row` |
| 배달 로봇 | `cute boxy six-wheeled sidewalk delivery robot, lid with one red glowing eye, small flag antenna, hacked and angry, side view` |
| 방범 드론 | `small police security quadcopter drone, blue and white with a red warning light, one red glowing eye, side view, 2 frames propeller blur` |
| 청소 로봇 | `cylindrical street cleaning robot with a big rotating front brush like a shield, one red eye, side view` |
| 보스1 부품 | `unmanned military patrol vehicle, armored, small turret on top, one big red eye, separate parts: body, turret, wheels` |
| 위병소 배경 | `Korean military base front gate, boom barrier, guard post, parade ground, mountains and apartment blocks far away, daytime, wide panorama, no characters` |
| 한강 다리 배경 | `Seoul river bridge during morning traffic jam, stopped buses and taxis, railings, apartment skyline across the river, no characters, no logos` |
| 데이터센터 배경 | `server room corridor, rows of server racks, cooling pipes, red warning lights, no characters` |
| UI 프레임 | `pixel art UI panel frame, military olive and khaki, 9-slice friendly, rounded corners, no text` |

- 배경을 마젠타 단색으로 생성하면 ④에서 배경 제거가 쉽다.
- 결과물 안의 글자·로고는 생성되더라도 ⑤에서 지운다.

### 3.3 일관성 요령

1. 항상 **기준 시트를 참조 이미지로 첨부**하고, "same character"를 문장 맨 앞에 둔다.
2. 프레임이 맞지 않으면 걷기 사이클을 포기하고 **하체 2프레임 + 몸 들썩임 트윈**으로 줄인다(메탈슬러그도 상체는 고정에 가깝다).
3. 로봇은 프레임 애니메이션 대신 **부품을 트윈으로** 움직인다. 바퀴 회전, 몸통 위아래 1px, 눈 깜빡임 정도면 된다.
4. 같은 날, 같은 대화, 같은 프롬프트 골격으로 한 묶음(예: 잡졸 3종)을 한 번에 만든다.
5. ④의 팔레트 강제가 마지막 안전장치다. 팔레트 밖 색은 자동으로 가장 가까운 팔레트 색으로 바뀐다.

### 3.4 AI 표시 의무

| 항목 | 내용 |
|---|---|
| 근거 | AI기본법 §31(2026-01-22 시행). 생성형 AI 결과물 표시와 사전 고지. 과태료는 유예 중이고 하위 법령은 확정되지 않았다 |
| 대응 | 타이틀 하단 한 줄("일부 그래픽은 생성형 AI로 제작되었습니다") + 설정 > 크레딧 + `art/LEDGER.json`의 `tool` 필드 |
| 확인 | 출시 전 R-002 결과와 법률 확인(사용자) |

---

## 4. 에셋 계약 (코드가 쓰는 이름·크기)

H-001이 이 표를 `src/assets.ts`로 옮기고, 파일이 없는 키는 **런타임에 단색 플레이스홀더**(같은 크기, 같은 프레임 수)로 만든다. 실제 그림은 `public/assets/<키>.png`로 넣고 `public/assets/index.json`에 키를 추가하면 바로 교체된다. 새 단계의 키는 그 단계 첫 티켓이 `src/assets.ts`에 추가한다. `/?scene=gallery`에서 모든 키를 한눈에 확인한다.

| 키(`public/assets/…png`) | 크기(프레임) | 프레임 | 앵커 | 플레이스홀더 색 | 단계 |
|---|---|---|---|---|---|
| `player_legs` | 48×48 | 6(달리기) + 1(정지) = 7 | 발바닥 중앙 | 올리브 | P2 |
| `player_body` | 48×48 | 2 | 허리 | 올리브 밝게 | P2 |
| `player_arm_rifle` | 32×16 | 1 | 어깨(4,8) | 시안 | P2 |
| `player_arm_grenade` | 32×16 | 1 | 어깨(4,8) | 시안 | P2 |
| `player_arm_jammer` | 32×16 | 1 | 어깨(4,8) | 시안 | P4 |
| `player_roll` | 48×48 | 4 | 중앙 | 올리브 | P2 |
| `enemy_rusher` | 40×32 | 2 | 바닥 중앙 | 회색 + 붉은 점 | P2 |
| `enemy_shooter` | 32×32 | 2 | 중앙 | 회색 + 붉은 점 | P2 |
| `enemy_shield` | 40×40 | 2 | 바닥 중앙 | 진회색 + 붉은 점 | P3 |
| `boss1_body` / `boss1_turret` / `boss1_wheel` | 160×96 / 64×32 / 32×32 | 1 | 부품마다 | 회색 | P3 |
| `boss2_*`, `boss3_*` | P4에서 확정 | | | | P4 |
| `bullet_ally` | 8×4 | 1 | 중앙 | 시안 | P2 |
| `bullet_enemy` | 8×8 | 1 | 중앙 | 크림슨 + 흰 심 | P2 |
| `grenade` | 8×8 | 1 | 중앙 | 시안 | P2 |
| `fx_spark` | 16×16 | 4 | 중앙 | 노랑 | P2 |
| `fx_bolt` | 6×6 | 3(나사·너트·톱니) | 중앙 | 회색 | P2 |
| `fx_explosion` | 48×48 | 6 | 중앙 | 주황→노랑 | P2 |
| `fx_muzzle` | 12×12 | 2 | 왼쪽 중앙 | 노랑 | P2 |
| `pickup_bread` | 12×12 | 1 | 중앙 | 노랑 | P2 |
| `pickup_chicken` | 16×16 | 1 | 중앙 | 갈색 | P3 |
| `bg1_far` / `bg1_mid` / `bg1_tile` | 960×360 / 960×200 / 32×32 | 1 | 좌상 | 하늘·회색·아스팔트 | P3 |
| `bg2_*`, `bg3_*` | 같은 규격 | | | | P4 |
| `ui_frame` | 48×48(9-slice, 모서리 16) | 1 | — | 카키 | P3 |
| `ui_icons` | 24×24 | 16(카드 12 + PX 3 + 훈장) | 중앙 | 단색 | P4 |
| `portrait_kim` / `portrait_park` | 48×48 | 2(보통·놀람) | — | 단색 | P4 |
| `rank_insignia` | 16×16 | 5 | 중앙 | 단색 | P4 |

**오디오** (`public/assets/sfx_*.m4a`, 30KB 이하. BGM은 `bgm_*.m4a`, 500KB 이하 루프)
- 효과음: `sfx_rifle`, `sfx_hit`, `sfx_break`, `sfx_boom`, `sfx_kalgak`, `sfx_hurt`, `sfx_siren`, `sfx_pickup`, `sfx_click`, `sfx_rankup`
- BGM: `bgm_lobby`, `bgm_battle`, `bgm_boss`
- 효과음은 jsfxr로 만든다(결과물은 자유 이용). BGM은 무료 라이선스 칩튠 또는 AI 음악을 쓰고 장부에 기록한다.

**장부(`art/LEDGER.json`) 항목**
- 필드: `id`, `file`, `source`(원본 경로 또는 URL), `tool`(예: `gemini-image`, `jsfxr`, `hand`), `prompt`(파일 경로), `license`, `edited`(true/false), `checked`(날짜)
- 런타임 플레이스홀더는 장부에 적지 않는다. 출시 전 `index.json`에 §4의 모든 키가 있어야 한다(P5 release-check가 검사).
