---
phase: 06-art
plan: 01
subsystem: battle
tags: [art, sprites, auto-swap, headless-check]
requires: [05-fire]
provides:
  - "data.ts: ART(목록 경로, fps, 발끝 피벗·그림자, 피격 시간, 쓰러짐 각도, 강화 군견 틴트, 배경 알파, 적 그림 이름 표)"
  - "rules.ts: frameCount, artKey, artLoops"
  - "src/battle/art.ts: loadArt/setupArt/addSprite/playAct/hitSprite/tickHit/playFx, art(실제 키 집합)"
  - "BattleScene.art, 아군 카드·적·보스·지뢰·가스·이펙트·배경의 키 단위 자동 교체, ?art=0"
affects: []
tech-stack:
  added: []
  patterns: ["함수 모듈 + 컨테이너 data(sprite/base/hit/tint), 클래스 없음", "피격 틴트는 update dt로만 줄임(타이머 없음)"]
key-files:
  created: [src/battle/art.ts, tests/rules-art.test.ts, docs/shots/M3-06.png, docs/shots/M3-06-shapes.png, docs/shots/M3-06-fight.png]
  modified: [src/data.ts, src/rules.ts, src/battle/BattleScene.ts, src/battle/board.ts, src/battle/enemies.ts, src/battle/fx.ts, src/battle/gas.ts, src/battle/units.ts]
key-decisions:
  - "그림 목록은 load.json 대신 load.text로 받아 직접 JSON.parse한다(깨진 JSON이 Phaser 로더 예외가 되어 페이지 오류가 나는 것을 막는다)"
  - "그림 있음 판정은 텍스처 존재가 아니라 art 집합(목록에 있고 크기·프레임이 계약과 맞는 키)으로 한다. 갤러리의 플레이스홀더 텍스처와 섞이지 않는다"
  - "피격 틴트·공격 후 복귀는 시간(dt)이 아니라 애니메이션 체인과 tickHit(dt)으로 처리해 일시정지·배속을 따른다"
requirements-completed: [SPR-01, SPR-02]
metrics:
  tasks: 3
  files: 11
  tests: 225
  completed: 2026-10-22
---

# Phase 6 Plan 01: 실제 그림이 있으면 스프라이트, 없으면 도형 Summary

`public/assets/index.json`에 있는 키만 스프라이트로 그리고 나머지는 지금 도형 그대로 둔다. 지금은 `ally_rifle_idle`(2프레임)·`ally_rifle_attack`(3프레임)만 있어서 소총수(신병 포함)만 그림이고 저격수·제설병·취사병은 도형이다. 앞으로 그림이 하나씩 들어오면 코드 변경 없이 그 키부터 바뀐다. 계급 작대기·HP 바·발밑 그림자·피격 틴트·쓰러짐은 코드가 그린다. `?art=0`이면 그림이 있어도 도형으로 그린다.

## 커밋

| 단계 | 커밋 | 내용 |
|---|---|---|
| Task 1 RED | b7b43c6 | `test(06-01)`: frameCount·artKey 표·artLoops·ART 수치 실패 테스트 |
| Task 1 GREEN | 3c0ba60 | `feat(06-01)`: ART 수치, frameCount·artKey·artLoops |
| Task 2 | c003146 | `feat(06-01)`: art.ts, 아군·적·보스·지뢰·가스·이펙트·배경 연결, ?art=0 |
| Task 3 | 7e38e9d | 스크린샷 3장, SUMMARY |

## 구현 요약

- 불러오기(`BattleScene.preload`): 목록 `/assets/index.json`을 글자로 받고, 끝나면 `ASSET_CONTRACTS`에 있는 키만 `load.image`로 이어서 받는다. 목록 없음·깨짐·네트워크 실패는 조용히 빈 목록. `?art=0`이면 목록을 받지 않는다.
- `setupArt`(create): 텍스처가 실제로 로드되고 높이가 계약과 같고 너비가 계약 너비의 배수인 키만 `scene.art`에 넣고, 프레임 `texture.add(i, …)`와 애니메이션을 만든다. 대기·걷기·달리기·`fx_gas`는 반복, 나머지는 1회. 키가 이미 있으면 다시 만들지 않는다(씬 재시작 안전).
- 아군 카드(`board.makeView`): `ally_<card>_idle`이 있으면 몸통·머리글자 대신 발끝 피벗(116/128) 스프라이트 + 반투명 타원 그림자. 계급 작대기·이름은 그대로. 공격하는 순간(`units.ts`의 소총·저격·제설·취사 분기) `ally_<card>_attack`을 1회 재생하고 대기로 돌아간다.
- 적(`spawnEnemy`): 걷기(달리기) 키가 있으면 스프라이트, 막혀서 때리는 순간 공격 키 1회. 강화 군견은 군견 그림 + `ART.dogPlusTint`(그림이 없으면 기존 흰 테두리). 보스는 `boss_apc_hull` + `boss_apc_turret`(회전 없음).
- 피격: 스프라이트면 `ART.hitMs` 동안 흰 단색 틴트(Phaser 4: `setTint` + `TintModes.FILL`), 도형이면 기존 `hitFlash`. 쓰러짐은 스프라이트일 때만 `ART.fallAngle` 기울기를 더한다.
- 이펙트(`fx.ts`): `fx_muzzle`·`fx_explosion`·`fx_wind`는 그림이 있으면 대체, `fx_heal`은 숫자 위에 추가, `fx_gas`는 가스 칸 15개를 칸 크기 반복 스프라이트로, `mine`·`mine_at`은 묻힌 지뢰 원 대신 이미지, `bg_gate`는 판 뒤 720x화면높이로 깔고 판 칸 색은 `ART.gridAlpha` 반투명.
- `fx_flame`은 대체할 기존 도형 연출이 없어서 `flame()`(그림이 있을 때만 그림)을 새로 만들어 제설병 화상이 걸리는 순간에 연결했다.

## 헤드리스 확인 (A1~A5)

방식: 이 task 안에서만 띄운 vite(5199) + Chrome headless(9338), 시나리오마다 새 브라우저 컨텍스트·새 페이지, `game.scene.pause('battle')` 후 `scene.update(0, 100)`으로 진행. 스크립트는 `/tmp/gsd06/check.mjs`(저장소 밖). **모든 페이지에서 캔버스 1개, 페이지 오류 0건, console.error 0건.** 끝난 뒤 5199·9338 포트 비어 있음(`lsof`). 애니메이션은 씬이 멈춰 있어 흐르지 않으므로 `sprite.preUpdate(0, 100)`을 직접 불러 진행했다.

| 시나리오 | 확인 | 읽은 값 | 판정 |
|---|---|---|---|
| A1 `deck=rifle:2,sniper:1` | `scene.art` | `ally_rifle_idle`, `ally_rifle_attack` | 통과 |
| A1 | 신병 컨테이너 | 자식 `Ellipse(그림자), Sprite, Graphics(계급), Text(이름)`, 애니메이션 키 `ally_rifle_idle` | 통과 |
| A1 | 다른 소총수 | `Ellipse, Sprite, Graphics`, 키 `ally_rifle_idle` | 통과 |
| A1 | 저격수 | `Rectangle, Text, Graphics`(도형), 스프라이트 없음 | 통과 |
| A2 | 시작 전 → 한 틱(적이 사거리 안) | `ally_rifle_idle` → `ally_rifle_attack`, 적 hp 60 → 50 | 통과 |
| A2 | 애니메이션 진행 | `attack:0 → 1 → 2 → idle` (3프레임 후 대기 복귀), 최종 키 `ally_rifle_idle` | 통과 |
| A3 | 피해 20 직후 | `isTinted` true, 모드 FILL(1), 남은 시간 0.12초(= `ART.hitMs` 120) | 통과 |
| A3 | 한 틱(0.1초) 뒤 | 아직 켜짐(남은 0.02) | 통과 |
| A3 | 두 틱(0.2초) 뒤 | `isTinted` false, 모드 MULTIPLY(0) | 통과 |
| A4 `?art=0` | `scene.art.size`, 신병 | 0, `Rectangle, Text, Graphics, Text`(도형) | 통과 |
| A5a 목록 `[]` 응답 | art, 신병, 오류 | size 0, 도형, 오류 0 | 통과 |
| A5b 목록 `{not json` 응답 | 같음 | size 0, 도형, 오류 0(처음 `load.json`으로 짰을 때 Phaser 로더가 SyntaxError를 던져 페이지 오류 1건이 나서 `load.text` + 직접 파싱으로 바꿨다) | 통과 |
| A5c 목록 요청 실패 | 같음 | size 0, 도형, 오류 0 | 통과 |

## 스크린샷 (Read로 직접 확인)

- `docs/shots/M3-06.png`(720x1560): 준비 단계. 배치 구역 아래 행에 제설병(도형 청록)·계급 3 소총수(그림)·신병 김신병(그림)·계급 2 소총수(그림)·취사병(도형 올리브)이 한 줄로 서 있고, 윗 행에 저격수(도형 파랑)가 있다. 소총수 3명은 위장복·부니햇·소총을 든 도트 그림이고 발밑에 반투명 타원 그림자가 있다. 발끝은 칸 아래쪽 안(칸 아랫변 위 약 10px)에 있고 모두 칸 안에 들어온다. 계급 작대기는 칸 오른쪽 위에, 이름 김신병은 발치에 그대로 보인다. 그림과 도형이 같은 판에서 어색하지 않게 섞인다(그림이 128 가득이라 도형 108보다 약간 크다).
- `docs/shots/M3-06-shapes.png`: 같은 배치를 `?art=0`으로. 소총수 3명이 초록 사각형 + 머리글자 "소" + 계급 작대기이고 나머지는 위와 같다. 위치·계급·이름이 그림 버전과 일치한다.
- `docs/shots/M3-06-fight.png`(추가 1장): 전투 중. 소총수들이 공격 프레임(총을 든 자세)이고, 신병·계급 3 소총수 위에 초록 HP 바가 보인다. 바가 머리보다 위에 있고 계급 작대기는 총구 쪽에 있어 서로 가리지 않는다(바 오른쪽 끝이 맨 위 작대기와 약간 겹치는 정도는 도형일 때도 같다). 적 3마리는 아직 도형이다. 피격 번쩍임·데미지 숫자·저격 선은 보기 좋게 하려고 스크린샷 전에 지웠다.

## 게이트 확인

- `npm run verify`: 이 작업 폴더에서는 `tests/assets-pipeline.test.ts` 2건이 실패한다. 원인은 이 변경이 아니라 폴더에 **내가 만들지 않은 추적 안 된 파일**이 생겨서다(`scripts/fixtures/source/ally_blower_attack|ally_blower_idle|ally_cook_idle|ally_sniper_attack/sheet.png`, `scripts/fixtures/oversize/ally_sniper_idle/sheet.png`, 약 4MB씩, 17:50~17:53 생성; 다른 세션의 그림 작업물로 보인다). 파이프라인 테스트가 그 폴더를 전부 읽어 "계약 63개 변환 7 != 3"으로 어긋난다. 같은 HEAD를 `git archive`로 깨끗한 임시 폴더(`/tmp/gsd06/clean2`)에 풀어 돌리면 **typecheck, 15개 파일 225개 테스트(rules-art 10개 추가), assets:check, build 모두 통과**한다. 그 파일들은 건드리지 않았고 이 plan의 커밋에도 넣지 않았다.
- 숫자 리터럴 게이트(`src/battle/*.ts`) 합 0, 한글 코드 게이트 합 0(04-02와 같은 명령).
- 레인 B: `git diff origin/main --stat -- src/ui src/main.ts src/debug.ts src/assets.ts src/save.ts package.json public` 비어 있음. 새 의존성 없음.
- 헤드리스 뒤 정리: vite(5199)·Chrome(9338) 종료, 두 포트 비어 있음.

## 계획과 달라진 점

- [Rule 1 - 버그] 처음 목록을 `load.json`으로 받았더니 깨진 JSON에서 Phaser 로더가 예외를 던져 A5b가 페이지 오류 1건이었다. `load.text` + `JSON.parse` try/catch로 바꿔 0건으로 만들었다(must_have "깨져도 오류 없이 시작").
- 계획에 없는 추가: `fx.flame()`(그림이 있을 때만 그리는 화상 불꽃). `fx_flame`을 쓸 기존 연출 함수가 없었다. 나머지 `fx_*`는 계획대로 기존 함수에 붙였다.
- 스크린샷 1장 추가(`M3-06-fight.png`): HP 바·공격 프레임 확인용. `docs/shots/M3-06*.png` 범위 안이다.
- 점검 중 발견: 쓰러진 적의 흰 단색 틴트는 `fall` 페이드가 끝날 때까지 남는다(의도적으로 단순하게 둠). 웨이브가 끝날 때 아직 피격 틴트가 남은 아군은 다음 전투 틱까지 흰색일 수 있다(`tickHit`은 전투 틱에서만 돈다, 시간이 매우 짧아 실제로는 거의 안 보임).

## 사람 확인 대기

<human-check> 헤드리스로 판정할 수 없는 크기감·손맛은 사람이 본다. 기다리지 않고 기록만 한다.

- URL: `npm run dev` 후 `/?scene=battle&seed=42&deck=rifle:3,sniper:1&supply=99`(그림 소총수) 와 같은 주소 + `&art=0`(도형 비교). 출동 후 `/?scene=battle&wave=2&seed=42&god=1&deck=rifle:4&supply=99`.
- 기대: (1) 그림 소총수의 크기가 칸에 비해 적당한지(128 가득이라 도형보다 약간 큼). (2) 발밑 그림자(너비 84·높이 24·알파 0.35)가 자연스러운지. (3) 소총수가 쏠 때 공격 애니메이션 3프레임이 1회 재생되고 곧 대기로 돌아오는 손맛(0.8초 간격 사격에서 어색하지 않은지). (4) 피격 시 흰 틴트 0.12초가 눈에 보이되 거슬리지 않는지. (5) 신병 이름 "김신병"이 발치 그림자와 겹쳐 읽기 불편하지 않은지(필요하면 `UI.card.nameY`). (6) 계급 작대기·HP 바가 그림을 가리지 않는지.
- 아직 없는 것: 저격수·제설병·취사병·적·보스·이펙트·배경 그림은 아직 없어 도형 경로만 확인했다(스프라이트 경로는 소총수로만 확인). 그림이 들어오면 `public/assets/index.json`에 키를 올리는 것만으로 바뀌어야 하며, 그때 해당 키(적 걷기·보스·`fx_*`·`bg_gate`)의 스프라이트 경로는 처음 실제로 돈다.

## Known Stubs

없음.

## Threat Flags

없음(새 네트워크·권한·저장 경계 없음. `?art=0`은 URL 파라미터 비교값이고, 목록 JSON은 키가 `ASSET_CONTRACTS`에 있는 것만 이미지로 받는다).

## Self-Check: PASSED

- `src/battle/art.ts`, `tests/rules-art.test.ts`, `docs/shots/M3-06.png`, `M3-06-shapes.png`, `M3-06-fight.png` 존재 확인.
- 커밋 b7b43c6, 3c0ba60, c003146 존재 확인.
