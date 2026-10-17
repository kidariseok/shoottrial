# ART: 아트 바이블 + AI 생성 파이프라인 + 에셋 계약 v0.2

> 작성: 2026-10-17, Claude(기획). 사용자 결정: **픽셀아트 + 생성형 AI 위주**.
> v0.2(2026-10-17): **세로 탑다운(3/4 시점)**으로 바꿨다. 옆모습·패럴랙스 규격은 없앴다.
> 상태: 규격(§2)과 에셋 계약(§4)은 확정이다. 팔레트(§2.2)와 스타일 타깃(§3.1)은 A-001에서 사용자가 승인하면 확정된다.
> Antigravity는 그림을 지어내지 않는다. §4 표의 키와 크기로 플레이스홀더를 쓰고, 진짜 그림이 오면 같은 이름으로 교체한다.

---

## 1. 한 줄 방향

**위에서 내려다본 밝은 낮의 한국 도시, 회색 기계 군단, 원색 아군.** 16비트 액션 게임처럼 위에서 비스듬히 본 시점(3/4 탑다운)이다. 작은 화면에서도 읽기 쉽고, 무섭지 않고 귀엽게 위험하다.

| 가져올 것 | 가져오지 않을 것 |
|---|---|
| 16비트 탑다운 액션의 읽기 쉬운 실루엣, 큼직한 폭발 | 특정 게임(탕탕특공대·Cat Gunner·메탈슬러그 등)의 캐릭터·UI·로고·이름 |
| 위에서 본 한국 거리 디테일(차선, 주차선, 차단기, 버스 지붕, 화단) | 실존 상호·로고·브랜드 색 조합(배달 앱 민트색 등) |
| 군복의 실루엣(전투모, 방탄조끼, 전투화) | 실제 육군 마크·부대 마크·계급장 원본 이미지 |

---

## 2. 기술 규격 (확정)

### 2.1 크기

| 항목 | 규격 |
|---|---|
| 내부 해상도 | **360×640 세로**. 화면이 더 길면 위아래로 배경을 보여준다(최대 360×800). 최근접 확대, 안티에일리어싱 없음 |
| 시점 | 3/4 탑다운. 바닥은 위에서, 캐릭터·로봇은 위에서 비스듬히 앞모습이 보이게 그린다 |
| 주인공 | 프레임 32×32, 실제 몸 약 24×28. **몸(3방향: 아래·위·옆) + 총(360도 회전용) 분리**. 옆은 오른쪽만 그리고 좌우 반전 |
| 잡졸 | 28×28 ~ 32×32. 방향이 중요한 부품(청소 로봇 브러시)은 따로 그려 코드가 회전시킨다 |
| 보스 | 96~128px, **부품 PNG 여러 장**(몸통·포탑·다리)으로 나눠 코드가 조립·회전·움직인다 |
| 배경 | 스테이지마다 **360×800 한 장**. 가운데 360×640이 아레나다. 아레나 안쪽은 바닥만 두고, 장식은 가장자리 약 12~60px에만 둔다 |
| 그림자 | 캐릭터·로봇 발밑 그림자는 코드로 그린다(반투명 타원). 그림에 넣지 않는다 |
| UI | 9-slice 프레임 16px 모서리, 아이콘 24×24, 폰트 Galmuri11 / Galmuri7 |
| 포맷 | PNG(가능하면 인덱스 컬러), 시트는 가로 한 줄, 프레임 사이 여백 0 |
| 금지 | 반투명 픽셀(그림자 제외), 비정수 축소, 그라데이션, 사진 질감 |

### 2.2 팔레트 (A-001에서 확정, 32색 이내)

| 묶음 | 색 | 용도 |
|---|---|---|
| 아군 | 시안 `#2ec5e8`, 녹색 `#3fbf6f`, 군복 올리브 3단계 | 플레이어, 아군 탄, 아군 UI |
| **적·위험** | 크림슨 `#e8344a`, 주황 `#ff8a2a`, 흰 심 `#fff4e0` | 적 눈, **모든 예고(띠·선·원)**, 적 탄 |
| 기계 | 회색 4단계(`#2b2d36` ~ `#c9cdd6`) | 로봇 몸체 |
| 도시 | 채도 낮은 아스팔트·콘크리트·차선 흰색·나무·물 8색 | 바닥과 가장자리 장식 |
| 빛 | 노랑 `#ffd23f`, 흰 `#ffffff` | 총구 섬광, 스파크, 건빵 |

**가독성 규칙(필수)**
- 붉은색·주황은 **적의 공격과 예고에만** 쓴다. 배경에 넣지 않는다(데이터센터의 경고등도 가장자리에 작게만).
- 아군 탄은 시안, 적 탄은 크림슨에 흰 심을 넣는다.
- 바닥은 어둡고 채도를 낮게, 캐릭터·로봇은 밝고 외곽선을 뚜렷하게 한다.
- 화면을 흑백으로 바꿔도 플레이어·적 탄·예고가 바닥과 구분되어야 한다(G2 검사).

### 2.3 빛·외곽선

- 빛은 왼쪽 위에서 온다.
- 외곽선은 1px 바깥선만 쓴다. 색은 순검정 대신 `#1b1d26`.
- 적의 '눈'(GRAY 표식)은 모두 같은 크림슨 원 + 흰 점이다. 같은 적 편이라는 신호다.

---

## 3. AI 생성 파이프라인

```
① 스타일 타깃 1장(A-001) ─ 사용자 승인
② 기준 시트(캐릭터·로봇별 앞/뒤/옆) ─ ①을 참조 이미지로 생성
③ 방향·프레임 ─ ②를 참조 이미지로 넣고 한 줄씩 생성
④ 정리: scripts/pixelize ─ 축소(최근접) + 팔레트 강제 + 배경 제거 + 외곽선
⑤ 사람 손질: Aseprite / Pixelorama(무료) ─ 깨진 픽셀, 프레임 정렬
⑥ 장부 기록: art/LEDGER.json ─ 생성 도구, 프롬프트 파일, 원본 경로, 손질 여부
⑦ public/assets/ 같은 이름으로 교체 → npm run assets:check
```

| 단계 | 담당 | 도구 |
|---|---|---|
| ①②③ | 사용자 | Gemini 앱(Pro) 이미지 생성. 걷기 프레임이 계속 깨지면 R-003에서 픽셀 특화 AI 도구 평가 |
| ④ | Antigravity(H-002에서 스크립트 이식) | Node 스크립트 |
| ⑤ | 사용자 | Aseprite 또는 Pixelorama |
| ⑥⑦ | Antigravity(A 티켓 연결 작업) | `assets:check` |

### 3.1 스타일 타깃 (A-001)

전투 화면 한 장을 **세로 9:16**으로 만든다. 구성은 다음과 같다.

| 위치 | 구성 |
|---|---|
| 바닥 | 위병소 연병장: 어두운 아스팔트, 흰 주차선 |
| 위쪽 가장자리 | 부대 정문 차단기, 초소, 입간판 |
| 좌우 가장자리 | 화단, 철책 |
| 가운데 | 플레이어(위에서 본 군인)가 소총으로 위쪽 적을 쏘는 중 |
| 주변 | 배달 로봇 3기(사방에서 접근) + 방범 드론 1기(플레이어 쪽으로 붉은 조준선) |
| 한쪽 | 유탄 폭발 1개 |
| 맨 위 | 좌상단 HUD만 대충 표시(우상단은 비움) |
| 맨 아래 | 오른쪽 아래에 둥근 버튼 2개 자리(구르기·특수화기) |

이 한 장이 이후 모든 생성의 **참조 이미지**가 된다. 승인 전에는 다른 에셋을 생성하지 않는다.

### 3.2 프롬프트 팩 (Gemini 이미지용 시작점, 영어가 더 안정적)

공통 접미사(모든 프롬프트 끝에 붙인다)
```
16-bit pixel art, top-down three-quarter view like classic 16-bit action games, clean 1px dark outline (#1b1d26),
flat shading with 3 tones, light from top-left, limited palette, no anti-aliasing, no gradients, no text, no logos,
plain flat magenta (#ff00ff) background
```
- 배경(바닥) 프롬프트에서는 마지막 줄의 magenta background를 뺀다.

| 대상 | 프롬프트 본문 |
|---|---|
| 스타일 타깃 | `vertical 9:16 mobile game screenshot, top-down arcade shooter, a young Korean army private in olive uniform and helmet in the middle firing a rifle upward, three box-shaped six-wheeled delivery robots and a police quadcopter drone with a red laser sight closing in from all sides, dark asphalt parade ground with white parking lines, military base front gate with a boom barrier and guard post along the top edge, flower beds and fence on the left and right edges, bright daytime, cute but dangerous robots with one red glowing eye, small grenade explosion` |
| 주인공 기준 시트 | `character reference sheet for a 4-direction top-down sprite, young Korean army private, olive combat uniform, helmet with cover, bulletproof vest, cheerful determined face, chibi-ish proportions, front view, back view and right side view, no weapon` |
| 주인공 걷기(아래) | (기준 시트를 참조 이미지로 첨부) `same soldier, walking toward the camera (facing down), 4 frames in one horizontal row, no weapon` |
| 주인공 걷기(위) | (첨부) `same soldier, walking away from the camera (facing up), 4 frames in one horizontal row, no weapon` |
| 주인공 걷기(옆) | (첨부) `same soldier, walking to the right, 4 frames in one horizontal row, no weapon` |
| 구르기 | (첨부) `same soldier, combat roll seen from above, curled up, 4 frames horizontal row` |
| 총 | `compact assault rifle seen from above, isolated, pointing right, tiny, game item sprite` |
| 배달 로봇 | `cute boxy six-wheeled sidewalk delivery robot seen from above at an angle, lid with one red glowing eye, small flag antenna, hacked and angry, 2 frames wheels moving` |
| 방범 드론 | `small police security quadcopter drone seen from above, blue and white with a red warning light, one red glowing eye, 2 frames propeller blur` |
| 청소 로봇 몸통 | `cylindrical street cleaning robot seen from above at an angle, one red eye, without the brush` |
| 청소 로봇 브러시 | `wide rotating street cleaning brush seen from above, isolated, facing right` |
| 보스1 부품 | `unmanned armored patrol vehicle seen from above, one big red eye, separate parts on one sheet: hull, rotating turret` |
| 위병소 바닥 | `top-down view of a Korean military base parade ground at the front gate, dark asphalt, white parking lines, boom barrier and guard post along the top edge, flower beds and fence on the left and right edges, empty center, no characters, vertical 360x800` |
| 한강 다리 바닥 | `top-down view of a four-lane road on a Seoul river bridge, lane markings, railings on both sides with river water beyond, stopped buses and taxis at the top and bottom edges, empty center, no characters, no logos, vertical 360x800` |
| 데이터센터 바닥 | `top-down view of a data center floor, dark grid floor tiles, cable covers, rows of server racks along the left and right edges, cooling pipes along the top edge, small warning lights, empty center, no characters, vertical 360x800` |
| UI 프레임 | `pixel art UI panel frame, military olive and khaki, 9-slice friendly, rounded corners, no text` |

- 배경을 마젠타 단색으로 생성하면 ④에서 배경 제거가 쉽다.
- 결과물 안의 글자·로고는 생성되더라도 ⑤에서 지운다.

### 3.3 일관성 요령

1. 항상 **기준 시트를 참조 이미지로 첨부**하고, "same character"를 문장 맨 앞에 둔다.
2. 방향은 3개(아래·위·옆)만 그린다. 옆은 좌우 반전으로 왼쪽을 만든다.
3. 걷기 4프레임이 맞지 않으면 **2프레임 + 몸 들썩임 트윈**으로 줄인다. 작은 탑다운 캐릭터는 2프레임으로도 충분히 읽힌다.
4. 총은 따로 그려서 코드가 돌린다. 그래서 몸 그림에는 무기를 넣지 않는다.
5. 로봇은 프레임 애니메이션 대신 **부품을 트윈으로** 움직인다. 바퀴 2프레임, 몸통 위아래 1px, 눈 깜빡임 정도면 된다.
6. 같은 날, 같은 대화, 같은 프롬프트 골격으로 한 묶음(예: 잡졸 3종)을 한 번에 만든다.
7. ④의 팔레트 강제가 마지막 안전장치다. 팔레트 밖 색은 자동으로 가장 가까운 팔레트 색으로 바뀐다.

### 3.4 AI 표시 의무

| 항목 | 내용 |
|---|---|
| 근거 | AI기본법 §31(2026-01-22 시행). 생성형 AI 결과물 표시와 사전 고지. 과태료는 유예 중이고 하위 법령은 확정되지 않았다 |
| 대응 | 타이틀 하단 한 줄("일부 그래픽은 생성형 AI로 제작되었습니다") + 설정 > 크레딧 + `art/LEDGER.json`의 `tool` 필드 |
| 확인 | 출시 전 R-002 결과와 법률 확인(사용자) |

---

## 4. 에셋 계약 (코드가 쓰는 이름·크기)

**교체 방식**
- H-001이 이 표를 `src/assets.ts`로 옮기고, 파일이 없는 키는 **런타임에 단색 플레이스홀더**(같은 크기, 같은 프레임 수)로 만든다.
- 실제 그림은 `public/assets/<키>.png`로 넣고 `public/assets/index.json`에 키를 추가하면 바로 교체된다.
- 새 단계의 키는 그 단계 첫 티켓이 `src/assets.ts`에 추가한다.
- `/?scene=gallery`에서 모든 키를 한눈에 확인한다.

| 키(`public/assets/…png`) | 크기(프레임) | 프레임 | 앵커 | 플레이스홀더 색 | 단계 |
|---|---|---|---|---|---|
| `player_walk_down` | 32×32 | 4 | 발 중앙(16,28) | 올리브 | P2 |
| `player_walk_up` | 32×32 | 4 | 발 중앙(16,28) | 올리브 어둡게 | P2 |
| `player_walk_side` | 32×32 | 4(오른쪽 보기) | 발 중앙(16,28) | 올리브 밝게 | P2 |
| `player_roll` | 32×32 | 4 | 중앙 | 올리브 | P2 |
| `player_gun_rifle` | 24×8 | 1(오른쪽 보기) | 손잡이(6,4) | 시안 | P2 |
| `player_gun_grenade` | 24×10 | 1(오른쪽 보기) | 손잡이(6,5) | 시안 | P2 |
| `player_gun_jammer` | 24×10 | 1 | 손잡이(6,5) | 시안 | P4 |
| `enemy_rusher` | 32×32 | 2 | 중앙 | 회색 + 붉은 점 | P2 |
| `enemy_shooter` | 28×28 | 2 | 중앙 | 회색 + 붉은 점 | P2 |
| `enemy_shield` | 32×32 | 2 | 중앙 | 진회색 + 붉은 점 | P3 |
| `enemy_shield_brush` | 32×12 | 2(회전) | 왼쪽 중앙(0,6) | 진회색 | P3 |
| `boss1_hull` / `boss1_turret` | 96×96 / 48×32 | 1 / 1 | 중앙 / 회전축(14,16) | 회색 | P3 |
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
| `bg1` | 360×800 | 1 | 중앙 | 어두운 아스팔트 + 가장자리 회색 띠 | P3 |
| `bg2`, `bg3` | 360×800 | 1 | 중앙 | | P4 |
| `ui_frame` | 48×48(9-slice, 모서리 16) | 1 | — | 카키 | P3 |
| `ui_icons` | 24×24 | 16(카드 12 + PX 3 + 훈장) | 중앙 | 단색 | P4 |
| `portrait_kim` / `portrait_park` | 48×48 | 2(보통·놀람) | — | 단색 | P4 |
| `rank_insignia` | 16×16 | 5 | 중앙 | 단색 | P4 |

- P2 키는 17개다(H-001 갤러리 확인 대상).

**오디오** (`public/assets/sfx_*.m4a`, 30KB 이하. BGM은 `bgm_*.m4a`, 500KB 이하 루프)
- 효과음: `sfx_rifle`, `sfx_hit`, `sfx_break`, `sfx_boom`, `sfx_kalgak`, `sfx_hurt`, `sfx_siren`, `sfx_pickup`, `sfx_click`, `sfx_rankup`
- BGM: `bgm_lobby`, `bgm_battle`, `bgm_boss`
- 효과음은 jsfxr로 만든다(결과물은 자유 이용). BGM은 무료 라이선스 칩튠 또는 AI 음악을 쓰고 장부에 기록한다.

**장부(`art/LEDGER.json`) 항목**
- 필드: `id`, `file`, `source`(원본 경로 또는 URL), `tool`(예: `gemini-image`, `jsfxr`, `hand`), `prompt`(파일 경로), `license`, `edited`(true/false), `checked`(날짜)
- 런타임 플레이스홀더는 장부에 적지 않는다. 출시 전 `index.json`에 §4의 모든 키가 있어야 한다(P5 release-check가 검사).
