# A-102 그림 만들기: 사용자 안내 + 프롬프트 묶음

상태: 대기 (0단계 목업 승인부터)
담당: 사용자(Gemini 앱 이미지 생성). 넣은 뒤 처리는 Claude/Antigravity가 한다.
대체: `docs/ART.md` §5 "M3 묶음" 체크리스트를 이 티켓이 대신한다. A-101(스타일 타깃)은 0단계 목업으로 마무리한다.

## 한눈에

- **할 일은 세 가지다.** 프롬프트를 복사해 Gemini에 붙여 넣는다 → 나온 그림을 정해진 이름으로 `art/inbox/`에 저장한다 → Claude에게 "그림 넣었어"라고 말한다.
- 배경 제거, 크기 줄이기, 프레임 나누기, 게임 반영, 확인은 전부 자동이다(H-103 도구). 명령어는 몰라도 된다.
- 다 합쳐 **약 42장**이다. 묶음 단위로 나눠서 며칠에 걸쳐 해도 된다. 위에서부터 순서대로 한다.
- 피격(하얗게 번쩍), 쓰러짐(기울며 사라짐), 아이콘(카드에서 자름), 계급장(가로 작대기), 바닥 타일은 **코드가 만든다.** 그리지 않는다.

## 0단계: 목업 확인 (5분, 먼저)

Figma에서 아래 목업을 연다. 기존 Figma 그림(위병소 배경, 소총수 뒷모습, UI 패널)만 잘라 붙인 시안이다. 적은 그림이 없어서 갈색 상자로 두었다.

- 목업: https://www.figma.com/design/6RrU20Hv8way6vlYjcTJU3/?node-id=37-2
- 판단할 것
  1. 이 결(치비 픽셀풍 + 야간 경보)로 전부 만들어도 되는가
  2. 아군이 등을 보이며 위로 쏘는 구도가 괜찮은가
  3. 배경의 가운데 길이 5열보다 좁다. 아래 G묶음에서 길을 넓힐지

괜찮으면 Claude에게 "목업 좋아"라고만 말한다. 바꾸고 싶은 점이 있으면 그대로 말한다.

## 1단계: 준비 (한 번만)

1. 브라우저에서 **https://gemini.google.com** 을 연다. 이미지를 만들 수 있는 모델을 고른다.
2. 참조 그림 폴더를 연다. 터미널에서 `open art/ref`를 실행하거나 Finder에서 저장소의 `art/ref` 폴더를 연다.
   - `00-style-mockup.png`: 위 목업
   - `01-soldier-motion.png`: 소총수 동작 시트
   - `02-nk-gear.png`: 북한군 물자
   - `03-weapons.png`: 총기
   - `04-vehicles.png`: 장갑차·전차 부품
   - `05-explosions.png`: 폭발 이펙트
   - `06-bg-gate.png`: 위병소 배경
   - `07-blower-suits.png`: 제설복·송풍기
   - `08-big-character.png`: 큰 캐릭터(카드 일러스트 참조)
   - 이 폴더는 공개 저장소에 올라가지 않는다. 지워졌으면 Claude에게 "참조 그림 다시 받아줘"라고 하면 된다.
3. 저장 폴더는 저장소의 **`art/inbox/`** 다. 없으면 만든다.

## 2단계: 매번 지키는 규칙

1. **묶음(A, B, C …)마다 새 채팅을 연다.** 한 묶음은 같은 채팅 안에서 이어서 만든다. 그래야 그림체가 맞는다.
2. 각 프롬프트 위에 적힌 **참조 그림을 먼저 첨부**한다(Gemini 입력창의 `+` → 파일 업로드).
3. 프롬프트 칸 오른쪽 위의 복사 버튼으로 **통째로 복사해 붙여 넣는다.** 공통 문구가 이미 들어 있다.
4. 결과를 아래 기준으로 본다. 어긋나면 그 채팅에서 고쳐 달라고 한 번 더 말한다(예: `remove all text`, `make the background pure magenta #FF00FF`, `exactly 3 frames in one row`).
   - 배경이 **마젠타(진분홍) 한 색**이다(그라데이션·바닥·그림자 없음)
   - **글자가 없다**
   - 프레임 수가 맞고, 프레임끼리 **겹치지 않는다**
   - 피·시체 표현이 없다
5. 다운로드한 파일 이름을 표에 적힌 **파일 이름**으로 바꿔 `art/inbox/`에 넣는다. 이름이 곧 게임 속 자리다.
6. 묶음 하나를 끝내면 Claude에게 "B묶음 넣었어"처럼 말한다. 자동 처리 결과(갤러리 스크린샷)를 보여 준다.

> 안 맞는 그림이 계속 나오면 3번까지만 다시 시도하고 넘어간다. 그 칸은 도형으로 남아 있고, 나중에 다시 뽑으면 된다.

---

## A묶음: 새 캐릭터 기준 시트 (7장, 가장 먼저)

이후 프레임을 만들 때 첨부할 "얼굴·옷 기준"이다. **`art/inbox/`가 아니라 `art/ref/`에 저장한다.**

| 순서 | 파일 이름(`art/ref/`) | 첨부할 참조 |
|---|---|---|
| A1 | `10-sniper-sheet.png` | `01-soldier-motion.png`, `03-weapons.png` |
| A2 | `11-cook-sheet.png` | `01-soldier-motion.png` |
| A3 | `12-miner-sheet.png` | `01-soldier-motion.png`, `03-weapons.png` |
| A4 | `13-chem-sheet.png` | `01-soldier-motion.png` |
| A5 | `20-nk-infantry-sheet.png` | `02-nk-gear.png`, `01-soldier-motion.png` |
| A6 | `21-nk-dog-sheet.png` | `01-soldier-motion.png` |
| A7 | `22-nk-rpg-sheet.png` | `20-nk-infantry-sheet.png`(A5 결과), `03-weapons.png` |

A1 저격수
```
Character reference sheet in exactly the same chibi pixel art style as the attached soldier sheet (same head-to-body ratio, outline thickness, palette and shading). A young South Korean army sniper: digital woodland camouflage uniform, olive boonie hat, face camouflage paint, holding a long K14 bolt-action sniper rifle with a scope. Show the same character three times in one horizontal row: front view, back view, right side view. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

A2 취사병
```
Character reference sheet in exactly the same chibi pixel art style as the attached soldier sheet (same head-to-body ratio, outline thickness, palette and shading). A young South Korean army cook: digital camouflage trousers, white cook apron over the uniform top, white sanitary cook cap, holding a big steel ladle and a steaming mess tin. Show the same character three times in one horizontal row: front view, back view, right side view. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

A3 지뢰설치병
```
Character reference sheet in exactly the same chibi pixel art style as the attached soldier sheet (same head-to-body ratio, outline thickness, palette and shading). A young South Korean army combat engineer: digital camouflage uniform, ballistic helmet, orange engineer armband, a compact carbine on a sling and a small round training mine held in one hand. Show the same character three times in one horizontal row: front view, back view, right side view. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

A4 화학병
```
Character reference sheet in exactly the same chibi pixel art style as the attached soldier sheet (same head-to-body ratio, outline thickness, palette and shading). A young South Korean army CBRN soldier: olive protective suit over the uniform, full-face gas mask with round eye lenses, ballistic helmet, a decontamination sprayer tank on the back with a hose, and a compact carbine. Show the same character three times in one horizontal row: front view, back view, right side view. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

A5 북한군 보병
```
Character reference sheet in exactly the same chibi pixel art style as the attached soldier sheet (same head-to-body ratio, outline thickness and shading), but a fictional enemy soldier: brown-olive uniform, soft cap with a plain star-less badge, plain brown shoulder boards with no markings, canvas ammo pouches, an old-style assault rifle. Grim serious face. Show the same character three times in one horizontal row: front view, back view, right side view. Clean dark navy outline, light from top-left, no text, no letters, no flags, no real insignia, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

A6 생체개조 군견
```
Character reference sheet in exactly the same chibi pixel art style as the attached soldier sheet (same outline thickness and shading). A fictional bio-modified military dog: lean dark grey-brown body, metal plates and mechanical implants on the back and legs, one glowing red cybernetic eye, a brown harness. Menacing but not gory. Show the same dog three times in one horizontal row: front view, back view, right side view. Clean dark navy outline, light from top-left, no text, no letters, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

A7 RPG병 (A5 결과를 첨부)
```
Character reference sheet of the same enemy soldier as the attached sheet (same uniform, cap and art style), now carrying an RPG-style rocket launcher tube on the shoulder and a backpack with spare rockets. Show the same character three times in one horizontal row: front view, back view, right side view. Clean dark navy outline, light from top-left, no text, no letters, no flags, no real insignia, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

---

## B묶음: 아군 대기·공격 (12장)

아군은 화면 아래에서 **등을 보이고 위쪽(적)을 향한다.** 한 캐릭터가 대기·공격 두 장이다. 같은 캐릭터 두 장은 같은 채팅에서 연달아 만든다.

| 파일 이름(`art/inbox/`) | 프레임 | 첨부할 참조 |
|---|---|---|
| `ally_rifle_idle.png` | 2 | `01-soldier-motion.png`, `00-style-mockup.png` |
| `ally_rifle_attack.png` | 3 | `01-soldier-motion.png` |
| `ally_sniper_idle.png` | 2 | `10-sniper-sheet.png` |
| `ally_sniper_attack.png` | 3 | `10-sniper-sheet.png` |
| `ally_blower_idle.png` | 2 | `07-blower-suits.png`, `01-soldier-motion.png` |
| `ally_blower_attack.png` | 3 | `07-blower-suits.png` |
| `ally_cook_idle.png` | 2 | `11-cook-sheet.png` |
| `ally_cook_attack.png` | 3 | `11-cook-sheet.png` |
| `ally_miner_idle.png` | 2 | `12-miner-sheet.png` |
| `ally_miner_attack.png` | 3 | `12-miner-sheet.png` |
| `ally_chem_idle.png` | 2 | `13-chem-sheet.png` |
| `ally_chem_attack.png` | 3 | `13-chem-sheet.png` |

`ally_rifle_idle.png`
```
Same character as the attached soldier (South Korean rifleman, boonie hat, digital camouflage, K2 rifle), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, standing guard and facing up toward the top of the image, rifle held at the ready. 2 frames of a subtle breathing idle in one horizontal row, all frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

`ally_rifle_attack.png`
```
Same character as the attached soldier (South Korean rifleman, boonie hat, digital camouflage, K2 rifle), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, aiming and firing the rifle straight up toward the top of the image. 3 frames in one horizontal row: aim, recoil, recover. Do not draw muzzle flash or bullets. All frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

`ally_sniper_idle.png`
```
Same character as the attached reference sheet (South Korean sniper, boonie hat, K14 scoped rifle), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, kneeling on one knee and facing up toward the top of the image, rifle resting. 2 frames of a subtle breathing idle in one horizontal row, all frames the same size, on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

`ally_sniper_attack.png`
```
Same character as the attached reference sheet (South Korean sniper, boonie hat, K14 scoped rifle), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, kneeling and firing the scoped rifle straight up toward the top of the image. 3 frames in one horizontal row: aim through scope, recoil, work the bolt. Do not draw muzzle flash or bullets. All frames the same size, on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

`ally_blower_idle.png`
```
Same art style as the attached sheets. A South Korean soldier in a padded olive winter jacket and boonie hat with a backpack leaf blower, the blower nozzle held in both hands. Seen from behind at a three-quarter top-down angle, facing up toward the top of the image. 2 frames of a subtle breathing idle in one horizontal row, all frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

`ally_blower_attack.png`
```
Same character as the previous image (soldier in padded olive winter jacket with a backpack leaf blower), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, pointing the blower nozzle straight up toward the top of the image and blasting. 3 frames in one horizontal row: brace, blast with body leaning forward, recover. Do not draw the wind itself. All frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

`ally_cook_idle.png`
```
Same character as the attached reference sheet (South Korean army cook, white apron, white cook cap, big ladle, mess tin), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, facing up toward the top of the image, holding the ladle. 2 frames of a subtle breathing idle in one horizontal row, all frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

`ally_cook_attack.png`
```
Same character as the attached reference sheet (South Korean army cook, white apron, white cook cap, big ladle, mess tin), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, cheerfully raising the ladle and a steaming mess tin to serve food to comrades. 3 frames in one horizontal row: lift, raise high, lower. Do not draw sparkles or steam effects. All frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

`ally_miner_idle.png`
```
Same character as the attached reference sheet (South Korean combat engineer, helmet, orange armband, compact carbine), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, facing up toward the top of the image, carbine held low. 2 frames of a subtle breathing idle in one horizontal row, all frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

`ally_miner_attack.png`
```
Same character as the attached reference sheet (South Korean combat engineer, helmet, orange armband, compact carbine), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, firing the carbine straight up toward the top of the image. 3 frames in one horizontal row: aim, recoil, recover. Do not draw muzzle flash or bullets. All frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

`ally_chem_idle.png`
```
Same character as the attached reference sheet (South Korean CBRN soldier, gas mask, protective suit, sprayer tank on the back), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, facing up toward the top of the image, sprayer hose in hand. 2 frames of a subtle breathing idle in one horizontal row, all frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

`ally_chem_attack.png`
```
Same character as the attached reference sheet (South Korean CBRN soldier, gas mask, protective suit, sprayer tank on the back), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, firing a compact carbine straight up toward the top of the image. 3 frames in one horizontal row: aim, recoil, recover. Do not draw muzzle flash, bullets or spray. All frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

---

## C묶음: 적 걷기·공격 (6장)

적은 화면 위에서 **앞모습으로 아래(아군)를 향해** 내려온다.

| 파일 이름(`art/inbox/`) | 프레임 | 첨부할 참조 |
|---|---|---|
| `enemy_inf_walk.png` | 4 | `20-nk-infantry-sheet.png` |
| `enemy_inf_attack.png` | 3 | `20-nk-infantry-sheet.png` |
| `enemy_dog_run.png` | 4 | `21-nk-dog-sheet.png` |
| `enemy_dog_bite.png` | 2 | `21-nk-dog-sheet.png` |
| `enemy_rpg_walk.png` | 4 | `22-nk-rpg-sheet.png` |
| `enemy_rpg_fire.png` | 3 | `22-nk-rpg-sheet.png` |

`enemy_inf_walk.png`
```
Same enemy soldier as the attached reference sheet, same chibi pixel art style. Front view at a three-quarter top-down angle, marching down toward the bottom of the image (toward the camera) with the rifle held across the chest. 4-frame walk cycle in one horizontal row, all frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no flags, no real insignia, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

`enemy_inf_attack.png`
```
Same enemy soldier as the attached reference sheet, same chibi pixel art style. Front view at a three-quarter top-down angle, facing down toward the bottom of the image and thrusting the rifle butt forward in a melee strike. 3 frames in one horizontal row: wind up, strike, recover. All frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no flags, no real insignia, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

`enemy_dog_run.png`
```
Same bio-modified military dog as the attached reference sheet, same chibi pixel art style. Front three-quarter top-down view, running fast down toward the bottom of the image (toward the camera), red cybernetic eye glowing. 4-frame run cycle in one horizontal row, all frames the same size, paws on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

`enemy_dog_bite.png`
```
Same bio-modified military dog as the attached reference sheet, same chibi pixel art style. Front three-quarter top-down view facing down toward the bottom of the image, lunging forward to bite with mechanical jaws. 2 frames in one horizontal row: crouch, lunge. All frames the same size, paws on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

`enemy_rpg_walk.png`
```
Same enemy RPG soldier as the attached reference sheet, same chibi pixel art style. Front view at a three-quarter top-down angle, walking down toward the bottom of the image with the rocket launcher on the shoulder. 4-frame walk cycle in one horizontal row, all frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no flags, no real insignia, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

`enemy_rpg_fire.png`
```
Same enemy RPG soldier as the attached reference sheet, same chibi pixel art style. Front view at a three-quarter top-down angle, kneeling and aiming the rocket launcher down toward the bottom of the image, then firing. 3 frames in one horizontal row: kneel and aim, fire with a small puff of grey back-blast smoke behind, recover. Do not draw the rocket or explosion. All frames the same size, on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no flags, no real insignia, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

---

## D묶음: 보스 장갑차 (2장)

| 파일 이름(`art/inbox/`) | 첨부할 참조 |
|---|---|
| `boss_apc_hull.png` | `04-vehicles.png` |
| `boss_apc_turret.png` | `boss_apc_hull.png`(방금 만든 결과), `04-vehicles.png` |

`boss_apc_hull.png`
```
Top-down view of a fictional eight-wheeled armored personnel carrier hull, in exactly the same pixel art style as the attached vehicle sheet. The vehicle points straight down toward the bottom of the image. Drab brown-olive paint, mud stains, NO turret (the turret ring is an empty round hatch in the middle), no markings. Single image, the vehicle centered and filling about 80% of a square canvas. Clean dark navy outline, light from top-left, no text, no letters, no flags, no numbers, no logos. Solid flat magenta (#FF00FF) background, no gradient, no ground, no shadow.
```

`boss_apc_turret.png`
```
Top-down view of only the small gun turret that fits the round hatch of the attached armored vehicle hull, same pixel art style and paint. The gun barrel points straight down toward the bottom of the image. Single image, the turret ring centered on a square canvas. Clean dark navy outline, light from top-left, no text, no letters, no markings. Solid flat magenta (#FF00FF) background, no gradient, no ground, no shadow.
```

---

## E묶음: 카드 일러스트 (6장)

상점·대기석 카드에 들어가는 상반신 그림이다. 카드 틀은 코드가 그린다.

| 파일 이름(`art/inbox/`) | 첨부할 참조 |
|---|---|
| `card_rifle.png` | `08-big-character.png`, `01-soldier-motion.png` |
| `card_sniper.png` | `08-big-character.png`, `10-sniper-sheet.png` |
| `card_blower.png` | `08-big-character.png`, `07-blower-suits.png` |
| `card_cook.png` | `08-big-character.png`, `11-cook-sheet.png` |
| `card_miner.png` | `08-big-character.png`, `12-miner-sheet.png` |
| `card_chem.png` | `08-big-character.png`, `13-chem-sheet.png` |

아래 한 프롬프트를 쓰되, 끝의 괄호 안만 카드에 맞게 바꾼다.

```
Portrait card illustration in exactly the same pixel art style as the attached large character image: bust shot (head and upper body) of the character from the second attached sheet, facing the viewer, confident serious expression, holding the signature equipment. Vertical 4:5 composition, the character centered and filling the frame. Clean dark navy outline, light from top-left, no text, no letters, no logos, no card border, no blood. Solid flat magenta (#FF00FF) background, no gradient. (Character: South Korean rifleman with K2 rifle)
```

괄호 안에 넣을 문구
- `card_rifle`: `South Korean rifleman with K2 rifle`
- `card_sniper`: `South Korean sniper with K14 scoped rifle`
- `card_blower`: `South Korean soldier in padded winter jacket with a backpack leaf blower`
- `card_cook`: `South Korean army cook with white cap, apron and big ladle`
- `card_miner`: `South Korean combat engineer with helmet, orange armband and a round training mine`
- `card_chem`: `South Korean CBRN soldier in gas mask and protective suit with a sprayer`

---

## F묶음: 이펙트·지뢰 (8장)

| 파일 이름(`art/inbox/`) | 프레임 | 첨부할 참조 |
|---|---|---|
| `fx_explosion.png` | 6 | `05-explosions.png` |
| `fx_muzzle.png` | 2 | `05-explosions.png` |
| `fx_wind.png` | 4 | `05-explosions.png` |
| `fx_flame.png` | 4 | `05-explosions.png` |
| `fx_heal.png` | 4 | `05-explosions.png` |
| `fx_gas.png` | 4 | `05-explosions.png` |
| `mine.png` | 1 | `03-weapons.png` |
| `mine_at.png` | 1 | `03-weapons.png` |

`fx_explosion.png`
```
Pixel art explosion animation in exactly the same style as the attached effects sheet: 6 frames in one horizontal row, from a small bright flash to a large fireball, then grey smoke and debris fading out. All frames the same square size, centered, clear magenta gaps between frames. No text, no letters, no blood. Solid flat magenta (#FF00FF) background, no gradient.
```

`fx_muzzle.png`
```
Tiny pixel art muzzle flash pointing straight up, same style as the attached effects sheet: 2 frames in one horizontal row (bright yellow-white star burst, smaller fading burst). All frames the same small square size, centered, clear magenta gaps between frames. No text, no letters. Solid flat magenta (#FF00FF) background, no gradient.
```

`fx_wind.png`
```
Pixel art gust of wind blowing straight up, same style as the attached effects sheet: tall vertical streaks of pale blue-white air with a few snowflakes and leaves. 4-frame loop in one horizontal row, each frame a tall rectangle (1:2 width to height), clear magenta gaps between frames. No text, no letters. Solid flat magenta (#FF00FF) background, no gradient.
```

`fx_flame.png`
```
Pixel art jet of flame blowing straight up, same style as the attached effects sheet: a tall column of orange and yellow fire with dark smoke at the tip. 4-frame loop in one horizontal row, each frame a tall rectangle (1:2 width to height), clear magenta gaps between frames. No text, no letters, no blood. Solid flat magenta (#FF00FF) background, no gradient.
```

`fx_heal.png`
```
Pixel art healing effect, same style as the attached effects sheet: soft green plus signs and warm steam rising in a small circle. 4-frame loop in one horizontal row, all frames the same square size, centered, clear magenta gaps between frames. No text, no letters. Solid flat magenta (#FF00FF) background, no gradient.
```

`fx_gas.png`
```
Pixel art toxic gas cloud seen from top-down, same style as the attached effects sheet: a low rolling sickly yellow-green cloud that fills a square area. 4-frame seamless loop in one horizontal row, all frames the same square size, centered, clear magenta gaps between frames. No text, no letters, no skulls. Solid flat magenta (#FF00FF) background, no gradient.
```

`mine.png`
```
Top-down pixel art of a small round olive anti-personnel landmine with a pressure plate, half-buried, in the same style as the attached weapons sheet. Single image centered on a square canvas. Clean dark navy outline, light from top-left, no text, no letters, no markings. Solid flat magenta (#FF00FF) background, no gradient, no ground.
```

`mine_at.png`
```
Top-down pixel art of a large round dark green anti-tank landmine with a center fuze, in the same style as the attached weapons sheet. Single image centered on a square canvas. Clean dark navy outline, light from top-left, no text, no letters, no markings. Solid flat magenta (#FF00FF) background, no gradient, no ground.
```

---

## G묶음: 배경 (1장)

| 파일 이름(`art/inbox/`) | 첨부할 참조 |
|---|---|
| `bg_gate.png` | `06-bg-gate.png` |

이 한 장은 마젠타 배경이 **아니다.** 그대로 배경으로 쓴다.

```
Extend the attached top-down pixel art map vertically to a 9:19.5 portrait ratio while keeping the exact same art style and every existing element: add more dark pine forest above the front gate and a dirt parade ground with sandbags below. Widen the central dirt road so it covers about three quarters of the image width, keeping the barbed-wire fences and guard posts at both edges. Night time with a slight red alarm glow from the gate lights. No text, no letters, no signs with writing, no characters, no vehicles.
```

---

## 끝나면

- `art/inbox/`에 넣고 Claude에게 "<묶음>묶음 넣었어"라고 말한다.
- Claude/Antigravity가 처리한 뒤 `?scene=gallery` 스크린샷으로 보여 준다. 마음에 안 드는 장만 다시 뽑는다.

## 진행 기록

- [x] 2026-10-21 Claude: 목업(Figma `37:2`), 참조 그림(`art/ref/`, gitignore), 프롬프트 묶음 작성
- [ ] 0단계 목업 승인
- [ ] A묶음 7장
- [ ] B묶음 12장
- [ ] C묶음 6장
- [ ] D묶음 2장
- [ ] E묶음 6장
- [ ] F묶음 8장
- [ ] G묶음 1장
