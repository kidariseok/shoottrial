# A-104 새 캐릭터 4종 그림 (의무병·박격포병·대전차병·통신병)

상태: 대기
담당: 사용자 (Gemini Argon 또는 GPT 이미지). 넣은 뒤 처리는 Claude/Codex가 한다.
전제: A-102와 같은 방식이다. 그림체는 `art/ref/`의 기존 시트와 맞춘다. 규칙·수치는 `docs/GDD.md` §5.2·§5.3.

## 한눈에

- 모두 **16장**이다: 기준 시트 4장 + 대기·공격 8장 + 카드 4장.
- 순서대로 하면 그림체가 맞는다. **캐릭터 하나씩 새 채팅**으로 하고, 한 캐릭터의 시트·대기·공격·카드는 **같은 채팅에서 연달아** 만든다.
- 게임 반영(배경 제거·크기·프레임 나누기)은 자동이다(`node scripts/assets.mjs`). 계약 키는 이미 `src/assets.ts`에 들어 있다(`ally_medic_idle` 등).
- 그림이 없어도 게임은 도형으로 돌아간다. 구현은 그림을 기다리지 않는다. 그림이 들어오면 바로 바뀐다.
- 피격·쓰러짐·아이콘·계급장·이펙트는 **코드가 만든다.** 그리지 않는다.

## 규칙(A-102와 같다)

1. 저장 위치: **기준 시트는 `art/ref/`**, 나머지는 **`art/inbox/`**(절대 경로 `/Users/jinseokoh/orca/workspaces/shoottrial/moonfish/art/inbox/`).
2. 결과를 이렇게 확인한다. 어긋나면 그 채팅에서 고쳐 달라고 한 번 더 말한다(예: `remove all text`, `make the background pure magenta #FF00FF`, `exactly 3 frames in one row`).
   - 배경이 **마젠타(진분홍) 한 색**이다(그라데이션·바닥·그림자 없음)
   - **글자가 없다**
   - 프레임 수가 맞고 프레임끼리 **겹치지 않는다**
   - 피·시체 표현이 없다. **붉은 십자도 쓰지 않는다**(적·경보에만 빨강을 쓴다는 규칙, ART §2)
3. 3번까지만 다시 시도하고 넘어간다. 그 칸은 도형으로 남고 나중에 다시 뽑으면 된다.
4. 다 넣으면 Claude에게 "A-104 넣었어"라고 말한다.

## 참조 그림(`art/ref/`에서 첨부)

- 항상: `01-soldier-motion.png`(소총수 동작 시트), `00-style-mockup.png`
- 장비 참고: `03-weapons.png`
- 그림체 맞추기용으로 기존 시트 하나: `12-miner-sheet.png`

---

## 캐릭터 1: 의무병 `medic` (인물 윤의무)

| 순서 | 파일 이름 | 저장 위치 | 프레임 |
|---|---|---|---|
| 1 | `14-medic-sheet.png` | `art/ref/` | 앞·뒤·옆 3면 |
| 2 | `ally_medic_idle.png` | `art/inbox/` | 2 |
| 3 | `ally_medic_attack.png` | `art/inbox/` | 3 |
| 4 | `card_medic.png` | `art/inbox/` | 1 |

1 기준 시트
```
Character reference sheet in exactly the same chibi pixel art style as the attached soldier sheet (same head-to-body ratio, outline thickness, palette and shading). A young South Korean army combat medic: digital camouflage uniform, ballistic helmet, a white armband with a plain GREEN cross (no red anywhere), a large olive medical bag on the shoulder, a roll of bandage and a small first-aid kit held in one hand, kind and calm expression. Show the same character three times in one horizontal row: front view, back view, right side view. Clean dark navy outline, light from top-left, no text, no letters, no logos, no red cross, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

2 대기
```
Same character as the attached reference sheet (South Korean combat medic, helmet, white armband with green cross, olive medical bag), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, standing alert and facing up toward the top of the image, first-aid kit held at the side. 2 frames of a subtle breathing idle in one horizontal row, all frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no red cross, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

3 공격(소생 동작)
```
Same character as the attached reference sheet (South Korean combat medic, helmet, white armband with green cross, olive medical bag), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, kneeling and reaching forward with both hands to give first aid to someone in front of him. 3 frames in one horizontal row: kneel down, treat, stand up. Do not draw the patient, sparkles or healing effects. All frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no red cross, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

4 카드
```
Portrait card illustration in exactly the same pixel art style as the attached large character image: bust shot (head and upper body) of the character from the attached sheet, facing the viewer, confident serious expression, holding the signature equipment. Vertical 4:5 composition, the character centered and filling the frame. Clean dark navy outline, light from top-left, no text, no letters, no logos, no card border, no red cross, no blood. Solid flat magenta (#FF00FF) background, no gradient. (Character: South Korean combat medic with helmet, white armband with a green cross and an olive medical bag)
```

---

## 캐릭터 2: 박격포병 `mortar` (인물 고박격)

| 순서 | 파일 이름 | 저장 위치 | 프레임 |
|---|---|---|---|
| 1 | `15-mortar-sheet.png` | `art/ref/` | 앞·뒤·옆 3면 |
| 2 | `ally_mortar_idle.png` | `art/inbox/` | 2 |
| 3 | `ally_mortar_attack.png` | `art/inbox/` | 3 |
| 4 | `card_mortar.png` | `art/inbox/` | 1 |

1 기준 시트
```
Character reference sheet in exactly the same chibi pixel art style as the attached soldier sheet (same head-to-body ratio, outline thickness, palette and shading). A young South Korean army mortar gunner: digital camouflage uniform, ballistic helmet with ear protection, a short 81mm-style mortar tube on a small bipod standing next to him, one mortar shell held in his hands, a fire-direction notebook on his belt, focused expression. Show the same character three times in one horizontal row: front view, back view, right side view. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

2 대기
```
Same character as the attached reference sheet (South Korean mortar gunner, helmet, short mortar tube on a bipod), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, crouching beside the mortar tube and facing up toward the top of the image, one hand resting on the tube. 2 frames of a subtle breathing idle in one horizontal row, all frames the same size, on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

3 공격
```
Same character as the attached reference sheet (South Korean mortar gunner, helmet, short mortar tube on a bipod), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, loading a mortar shell into the tube pointing up toward the top of the image, then covering his ears. 3 frames in one horizontal row: lift the shell, drop it in the tube, lean away. Do not draw muzzle flash, smoke or the flying shell. All frames the same size, on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

4 카드
```
Portrait card illustration in exactly the same pixel art style as the attached large character image: bust shot (head and upper body) of the character from the attached sheet, facing the viewer, confident serious expression, holding the signature equipment. Vertical 4:5 composition, the character centered and filling the frame. Clean dark navy outline, light from top-left, no text, no letters, no logos, no card border, no blood. Solid flat magenta (#FF00FF) background, no gradient. (Character: South Korean mortar gunner with helmet, holding a mortar shell, the top of a short mortar tube visible beside him)
```

---

## 캐릭터 3: 대전차병 `antitank` (인물 남전차)

| 순서 | 파일 이름 | 저장 위치 | 프레임 |
|---|---|---|---|
| 1 | `16-antitank-sheet.png` | `art/ref/` | 앞·뒤·옆 3면 |
| 2 | `ally_antitank_idle.png` | `art/inbox/` | 2 |
| 3 | `ally_antitank_attack.png` | `art/inbox/` | 3 |
| 4 | `card_antitank.png` | `art/inbox/` | 1 |

1 기준 시트
```
Character reference sheet in exactly the same chibi pixel art style as the attached soldier sheet (same head-to-body ratio, outline thickness, palette and shading). A young South Korean army anti-tank soldier: digital camouflage uniform, ballistic helmet, a generic shoulder-fired anti-tank rocket launcher tube (plain olive tube, no brand, no markings) carried on the shoulder, a backpack with two spare rockets, steady determined expression. Show the same character three times in one horizontal row: front view, back view, right side view. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

2 대기
```
Same character as the attached reference sheet (South Korean anti-tank soldier, helmet, shoulder-fired rocket launcher tube, backpack with spare rockets), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, standing and facing up toward the top of the image with the launcher tube resting on his shoulder. 2 frames of a subtle breathing idle in one horizontal row, all frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

3 공격
```
Same character as the attached reference sheet (South Korean anti-tank soldier, helmet, shoulder-fired rocket launcher tube, backpack with spare rockets), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, aiming the launcher tube straight up toward the top of the image and firing. 3 frames in one horizontal row: raise and aim, fire with the body braced, lower the tube. Do not draw the rocket, back-blast, flame or smoke. All frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

4 카드
```
Portrait card illustration in exactly the same pixel art style as the attached large character image: bust shot (head and upper body) of the character from the attached sheet, facing the viewer, confident serious expression, holding the signature equipment. Vertical 4:5 composition, the character centered and filling the frame. Clean dark navy outline, light from top-left, no text, no letters, no logos, no card border, no blood. Solid flat magenta (#FF00FF) background, no gradient. (Character: South Korean anti-tank soldier with helmet and a shoulder-fired rocket launcher tube, spare rockets on his back)
```

---

## 캐릭터 4: 통신병 `signal` (인물 송통신)

| 순서 | 파일 이름 | 저장 위치 | 프레임 |
|---|---|---|---|
| 1 | `17-signal-sheet.png` | `art/ref/` | 앞·뒤·옆 3면 |
| 2 | `ally_signal_idle.png` | `art/inbox/` | 2 |
| 3 | `ally_signal_attack.png` | `art/inbox/` | 3 |
| 4 | `card_signal.png` | `art/inbox/` | 1 |

1 기준 시트
```
Character reference sheet in exactly the same chibi pixel art style as the attached soldier sheet (same head-to-body ratio, outline thickness, palette and shading). A young South Korean army radio operator: digital camouflage uniform, ballistic helmet with a headset and microphone, a large olive field radio backpack with a tall whip antenna, a radio handset held to one ear, alert expression. Show the same character three times in one horizontal row: front view, back view, right side view. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

2 대기
```
Same character as the attached reference sheet (South Korean radio operator, helmet with headset, field radio backpack with whip antenna), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, standing and facing up toward the top of the image, one hand on the handset. 2 frames of a subtle breathing idle in one horizontal row (the antenna sways slightly), all frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

3 공격(지휘 동작)
```
Same character as the attached reference sheet (South Korean radio operator, helmet with headset, field radio backpack with whip antenna), same chibi pixel art style. Seen from behind at a three-quarter top-down angle, speaking into the handset and pointing forward with the other arm to direct comrades toward the top of the image. 3 frames in one horizontal row: raise the handset, point forward, lower. Do not draw radio waves or effects. All frames the same size, feet on the same baseline, clear magenta gaps between frames. Clean dark navy outline, light from top-left, no text, no letters, no logos, no blood. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

4 카드
```
Portrait card illustration in exactly the same pixel art style as the attached large character image: bust shot (head and upper body) of the character from the attached sheet, facing the viewer, confident serious expression, holding the signature equipment. Vertical 4:5 composition, the character centered and filling the frame. Clean dark navy outline, light from top-left, no text, no letters, no logos, no card border, no blood. Solid flat magenta (#FF00FF) background, no gradient. (Character: South Korean radio operator with helmet headset, a radio handset at his ear and a field radio backpack with whip antenna)
```

---

## 끝나면

- `art/ref/`에 시트 4장, `art/inbox/`에 12장이 있는지 확인하고 Claude에게 "A-104 넣었어"라고 말한다.
- 처리(`node scripts/assets.mjs`)는 Claude/Codex가 하고 `?scene=gallery`로 결과를 보여 준다. 마음에 안 드는 장만 다시 뽑는다.

## 진행 기록

- (아직 없음)
