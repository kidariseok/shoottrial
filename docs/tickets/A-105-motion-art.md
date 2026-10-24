# A-105 캐릭터 모션 확장 그림 (자연스러운 동작 + 동작 사이 연결)

상태: 대기
담당: 사용자 (ChatGPT 이미지 High 또는 Gemini Argon). 넣은 뒤 처리는 Claude/Codex가 한다.
짝 티켓: `T-111-motion-engine.md`(코드). 그림이 없어도 T-111은 도형·변형 모션으로 먼저 동작하고, 그림이 들어오면 그대로 바뀐다.

## 왜 하나

지금은 아군이 대기 2프레임·공격 3프레임, 적이 걷기 2프레임이라 **동작이 뚝뚝 끊겨 전환되는 느낌**이다. 프레임을 늘리는 것만으로는 부족하고, **동작과 동작이 이어지는 규칙**이 그림에 있어야 한다.

## 연결 규칙 (모든 시트에 공통, 프롬프트에 넣는다)

1. **첫 프레임 = 대기 자세.** 모든 동작 시트(공격·피격·진급)의 1번 프레임은 그 캐릭터의 대기 자세와 같다. 마지막 프레임도 대기 자세로 돌아온다. 그래야 대기 ↔ 동작이 끊김 없이 이어진다.
2. **대기와 걷기는 순환한다.** 마지막 프레임 다음에 1번 프레임이 이어져도 어색하지 않다(숨쉬기·걸음).
3. **예비 동작 → 본 동작 → 여운**: 공격은 "준비(살짝 움츠림) → 발동(가장 큰 동작) → 반동 → 복귀" 순이다. 본 동작이 몇 프레임 안에서 가장 크게 보이게 한다.
4. **발 기준선 고정.** 발 위치(밑선)는 모든 프레임에서 같다. 몸이 위아래로 움직여도 발이 미끄러지지 않는다.
5. 총구 섬광·연기·바람·피·시체는 **그리지 않는다**(코드 이펙트가 얹는다). 붉은 십자 금지.

## 규격

- 가로 한 줄에 N프레임. 프레임 크기는 모두 같고 사이는 마젠타(#FF00FF)로 비운다. 배경은 마젠타 한 색, 글자·그림자 없음(A-102 규칙과 같다).
- 저장: **`art/inbox/`**(절대 경로 `/Users/jinseokoh/orca/workspaces/shoottrial/moonfish/art/inbox/`). 기존 대기·공격 파일은 **덮어쓴다**(같은 이름). 덮어쓰기 전 `public/assets/`의 이전 파일은 git에 남아 있다.
- 참조로 첨부: 그 캐릭터의 기준 시트(`art/ref/`의 `10~17-*-sheet.png`, 소총수는 `01-soldier-motion.png`), 지금 쓰는 대기·공격 스프라이트(`public/assets/`), 아래 프롬프트 틀.
- 프레임 수는 **정확히** 맞춘다. 어긋나면 `exactly N frames in one row`라고 다시 말한다. 3번까지만 다시 시도한다.

## 묶음 구성 (총 62장, 우선순위 순)

**1묶음(필수, 32장): 이것만으로 "전환 느낌"이 크게 줄어든다.**

| 대상 | 파일 | 프레임 | 개수 |
|---|---|---|---|
| 아군 10종 대기 | `ally_<카드>_idle.png` | 4 | 10 |
| 아군 10종 공격 | `ally_<카드>_attack.png` | 6 | 10 |
| 적 3종 걷기·달리기 | `enemy_inf_walk.png`, `enemy_rpg_walk.png`, `enemy_dog_run.png` | 6 | 3 |
| 적 3종 공격 | `enemy_inf_attack.png`(4), `enemy_dog_bite.png`(4), `enemy_rpg_fire.png`(5) | 4~5 | 3 |
| 적 3종 피격 | `enemy_inf_hit.png`, `enemy_dog_hit.png`, `enemy_rpg_hit.png` | 2 | 3 |
| 적 3종 쓰러짐 | `enemy_inf_down.png`, `enemy_dog_down.png`, `enemy_rpg_down.png` | 4 | 3 |

**2묶음(선택, 30장): 이입감 보강.**

| 대상 | 파일 | 프레임 | 개수 |
|---|---|---|---|
| 아군 10종 피격 | `ally_<카드>_hit.png` | 2 | 10 |
| 아군 10종 쓰러짐 | `ally_<카드>_down.png` | 4 | 10 |
| 아군 10종 진급(경례) | `ally_<카드>_promote.png` | 4 | 10 |

`<카드>` = `rifle`, `sniper`, `blower`, `cook`, `miner`, `chem`, `medic`, `mortar`, `antitank`, `signal`. 장수가 많으니 **캐릭터 하나씩 새 채팅**으로 한 묶음 안에서 대기→공격(→2묶음 피격·쓰러짐·진급) 순서로 이어서 만들면 그림체가 유지된다. 먼저 **소총수 1종(대기+공격)과 보병 1종(걷기)으로 시험**하고, 마음에 들면 나머지를 진행한다.

## 프레임별 동작 (프롬프트의 `{BEATS}`에 넣는다)

### 아군 대기 (4프레임, 순환)
공통: `1 neutral stance, 2 slow inhale (shoulders and chest rise slightly, gear lifts), 3 hold at the top with a tiny head tilt, 4 slow exhale (settle back). Frame 4 flows smoothly into frame 1.`
캐릭터별 곁다리 움직임: 저격수 모자 끝 흔들림, 취사병 국자 끝이 까딱, 통신병 안테나가 흔들림, 제설병 노즐이 살짝 위아래, 박격포병 포신 위 손가락이 톡톡, 대전차병 어깨 위 발사관이 숨 따라 오르내림, 의무병 구급 가방 끈 고쳐 메기, 화학병 호스가 살짝 흔들림, 지뢰설치병 둥근 지뢰를 손으로 가볍게 튕김, 소총수 총을 고쳐 잡음.

### 아군 공격 (6프레임)
`1 = idle pose, 2 anticipation (small wind-up or crouch), 3 build-up to the action, 4 peak action (biggest motion), 5 follow-through / recoil, 6 recover back to the idle pose.`

| 카드 | 2~5 프레임의 내용 |
|---|---|
| 소총수 | 2 총을 어깨로 끌어올림, 3 조준해 멈춤, 4 반동으로 몸이 뒤로 밀림, 5 반동에서 회복 |
| 저격수 | 2 볼을 개머리판에 붙임, 3 숨 멈추고 정지, 4 반동, 5 노리쇠를 당겨 장전 |
| 제설병 | 2 발을 단단히 딛고 버팀, 3 노즐을 들며 몸을 앞으로 기댐, 4 최대 분사(백팩 흔들림), 5 분사 유지 후 힘을 뺌 |
| 취사병 | 2 국자를 아래로 푹 뜸, 3 크게 휘둘러 올림, 4 식기와 국자를 높이 내밀어 배식, 5 국자를 앞으로 내밀어 건넴 |
| 지뢰설치병 | 2 둥근 지뢰를 들고 웅크림, 3 앞으로 팔을 뻗어 내려놓음, 4 지뢰를 눌러 설치, 5 일어서며 손을 털어냄 |
| 화학병 | 2 호스를 들어 올림, 3 호스 끝을 조준, 4 분사 자세(몸이 앞으로 기댐), 5 분사 후 호스를 늘어뜨림 |
| 의무병 | 2 무릎을 꿇음, 3 앞의 누군가를 향해 손을 뻗음, 4 응급처치(몸을 숙임), 5 상태를 확인하며 고개를 듦 |
| 박격포병 | 2 포탄을 들어 올림, 3 포신 위에 포탄을 멈춰 듦, 4 포탄을 떨어뜨리고 두 손으로 귀를 막음, 5 몸을 뒤로 젖혀 피함 |
| 대전차병 | 2 발사관을 어깨에 얹음, 3 조준해 정지, 4 발사(몸이 크게 뒤로 밀림), 5 발사관을 내리며 숨을 고름 |
| 통신병 | 2 송수화기를 입에 댐, 3 앞쪽을 가리키며 지시, 4 지시 유지하며 말함(안테나 흔들림), 5 송수화기를 내림 |

### 적
- **걷기·달리기 (6프레임, 순환)**: `1 right foot contact, 2 body dips (down pose), 3 passing pose, 4 left foot contact, 5 body dips, 6 passing pose. Arms swing opposite to the legs, body bobs slightly. Frame 6 flows into frame 1.` 군견은 `gallop cycle`로 바꾼다(앞다리 모음 → 뻗음 → 뒷다리 모음 → 뻗음, 등이 출렁임).
- **공격**: 보병 4프레임 `1 walking pose, 2 raise rifle, 3 fire recoil, 4 lower and recover`. 군견 4프레임 `1 running pose, 2 crouch, 3 lunge forward with mouth open (no gore), 4 land and recover`. RPG병 5프레임 `1 walking pose, 2 shoulder the tube, 3 aim steady, 4 fire (body rocks back, no flame or smoke), 5 lower`.
- **피격 (2프레임)**: `1 flinch (body leans back, head turns), 2 recover toward the walking pose`.
- **쓰러짐 (4프레임)**: `1 stagger back, 2 knees buckle, 3 fall to the ground, 4 lying flat on the ground`. 피·시체 표현 없이 **그냥 눕는** 자세다(게임이 페이드로 사라지게 한다).

### 아군 2묶음
- **피격 (2프레임)**: 위 적 피격과 같은 방식(뒤로 움찔 → 복귀).
- **쓰러짐 (4프레임)**: 위 적 쓰러짐과 같은 방식(휘청 → 무릎 → 쓰러짐 → 누움).
- **진급 (4프레임)**: `1 = idle pose, 2 stand straight and snap up a salute, 3 hold the salute, 4 lower the hand and return to the idle pose`. 뒷모습이라 경례는 팔의 각도로 보이게 한다.

## 프롬프트 틀

한 시트에 한 번씩 쓴다. `{CHAR}`는 기준 시트 설명, `{N}`은 프레임 수, `{NAME}`은 동작 이름, `{BEATS}`는 위 표의 프레임별 내용이다. 아군은 **뒷모습**, 적은 **앞모습**이다.

```
Same character as the attached reference sheet ({CHAR}), same chibi pixel art style, same outline thickness, palette and shading. Seen from {VIEW} at a three-quarter top-down angle. Animation sheet "{NAME}": exactly {N} frames in one horizontal row, all frames the same size, feet on the same baseline, clear magenta gaps between frames. Frame by frame: {BEATS}. The first frame matches the character's idle pose from the second attached image so the animation blends into it. Smooth, natural motion with a clear anticipation, a strong peak pose and a follow-through. Do not draw muzzle flash, smoke, wind, effects, blood or red crosses. Clean dark navy outline, light from top-left, no text, no letters, no logos. Solid flat magenta (#FF00FF) background, no gradient, no floor, no shadow.
```

- `{VIEW}`: 아군 `behind (facing up toward the top of the image)`, 적 `the front (facing down toward the bottom of the image)`.
- `{CHAR}`: 예) `South Korean army combat medic, helmet, white armband with a green cross, olive medical bag`. 기존 캐릭터 설명은 A-102·A-104 프롬프트의 첫 문장을 그대로 쓴다.
- 두 번째 첨부 이미지는 **지금 쓰는 대기 스프라이트**(`public/assets/ally_<카드>_idle.png`)다. 기준 시트와 함께 올린다.

## 끝나면

- `art/inbox/`에 넣고 Claude/Codex에게 "A-105 1묶음 넣었어"처럼 말한다. 묶음 단위로 나눠 며칠에 걸쳐 해도 된다.
- 처리(`node scripts/assets.mjs`)는 **T-111이 프레임 상한을 늘린 뒤에** 된다(지금 도구는 아군 대기 2·공격 4·적 걷기 4까지만 받는다). 먼저 만든 그림은 `art/inbox/`에 쌓아 두면 된다.
- `?scene=gallery`와 `?scene=battle`로 움직임을 확인하고, 어색한 시트만 다시 뽑는다.

## 진행 기록

- 2026-10-25 (브랜치 `kidariseok/m6-chars`, Claude Code가 ChatGPT High로 대신 제작)
  - [x] **시험 제작 3장**: 소총수 `ally_rifle_idle`(4프레임)·`ally_rifle_attack`(6프레임), 보병 `enemy_inf_walk`(6프레임). `art/inbox/`에 같은 이름으로 넣어 둠(원본 1672×941).
  - 품질 판단: 프레임 수 정확, 발 기준선 일정, 화풍 유지, 공격은 준비→발동(반동)→복귀 흐름이 보이고 1·6프레임이 대기 자세와 같음. 시험 합격으로 보고 1묶음 진행 가능.
  - 방식: **ChatGPT 대화 하나**를 계속 쓰고 시트마다 기준 시트+현재 스프라이트를 첨부(`docs/agents/art-browser-workflow.md`). 티켓의 "캐릭터마다 새 채팅"은 사용자 요청으로 바꿈.
  - 처리(`node scripts/assets.mjs`)는 아직 안 돌림: T-111이 프레임 상한(아군 대기 2·공격 4·적 걷기 4)을 늘린 뒤에 한다. 지금 돌리면 새 시트가 잘리거나 기존 파일을 덮는다.
  - 다음: 사용자 확인 후 1묶음 나머지 진행(아군 9종 대기·공격, 적 걷기·공격·피격·쓰러짐).
