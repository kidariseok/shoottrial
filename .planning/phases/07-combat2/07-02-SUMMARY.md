---
phase: 07-combat2
plan: 02
subsystem: battle-fx
tags: [fx, particles, hitstop, headless-check]
requires: [07-01, 07-03]
provides:
  - "data.ts: FX 객체(파티클 13종 설정, 고리·섬광·저격·취약·도발·가스 수치, maxParticles 400, lowScale 0.5, hitStopSec 0.05, 텍스처 크기), UI.text.combo"
  - "fx.ts: burst(종류별 이미터 재사용), aliveParticles, hitStop/stopping/resetStop, promoteFx, comboText, 강화된 muzzle·tracer·snipeLine·windWave·healText·explosion·fall"
  - "battle: 취약 적 머리 위 붉은 화살표(깜빡임), 제설병 발밑 금색 맥동 고리, 가스 칸 연기, 지뢰·화력 지원·보스 처치·진급 히트스톱"
affects: []
tech-stack:
  added: []
  patterns: ["이미터는 연출 종류마다 하나, 씬마다 WeakMap으로 보관하고 파괴되면 다시 만든다", "히트스톱은 fx.ts 모듈 상태 하나(stop.left)를 BattleScene.update가 읽는다"]
key-files:
  created: [docs/shots/M4-07-02-shot.png, docs/shots/M4-07-02-blow.png, docs/shots/M4-07-02-boom.png, docs/shots/M4-07-02-gas.png]
  modified: [src/data.ts, src/battle/fx.ts, src/battle/units.ts, src/battle/enemies.ts, src/battle/gas.ts, src/battle/BattleScene.ts, src/battle/board.ts]
key-decisions:
  - "파티클 텍스처는 4개(원·사각·부드러운 원·십자). 계획의 3개에 회복용 십자를 하나 더했다"
  - "색은 야간 작전 톤: 아군 탄·섬광·진급은 금색·흰색, 폭발·불씨는 주황~적색, 연기·파편은 회색, 분홍 없음"
requirements-completed: [FX-01]
metrics:
  tasks: 4
  files: 7
  tests: 266
  completed: 2026-10-23
---

# Phase 7 Plan 02: 이펙트 화려하게 Summary

GDD §9 화려함 기준에 맞춰 사격·저격·송풍·지뢰·처치·진급·회복·가스 연출에 Phaser 기본 파티클(가산 혼합)·충격파 고리·빛 번짐을 얹고, 큰 사건에 0.05초 히트스톱을 걸었다. 취약 표식은 적 머리 위 붉은 화살표로, 도발 표시는 제설병 발밑 금색 맥동 고리로 바꿨다. 새 의존성 없음.

기준 커밋(첫 커밋 직전 HEAD): `deeac39`. 코드 커밋: `3ec4b20`.

## 구현 요약

- `data.ts`의 `FX` 한 객체에 모든 수치가 있다(개수·속도·각도·수명·색·크기·고리·섬광·히트스톱·상한). `UI.text.combo`("연계!")만 문구라 `UI.text`에 뒀다. 쓰이지 않게 된 옛 값(`UI.colors.muzzle·explosion·vulnStroke·tauntRing`, `UI.fx.muzzleR·muzzleMs·snipeMs·explode*`, `UI.taunt`)은 삭제했다.
- `fx.ts`
  - 파티클 텍스처 `pfx_dot·pfx_square·pfx_glow·pfx_plus`를 `generateTexture`로 한 번 만든다(`fx_*` 그림 키와 겹치지 않게 접두사 `pfx_`).
  - 이미터는 종류(`spark fire debris smoke dust dustTail snow ember casing star plus gasSmoke`)마다 하나, `scene.add.particles(..., { emitting:false })` 후 `explode(n, x, y)`로 재사용한다(직접 풀 없음). 씬이 다시 시작돼 이미터가 파괴되면 다음 호출에서 새로 만든다(RESTART 확인: 이미터 12개, 중복 없음).
  - `burst(scene, kind, x, y, n?)`가 상한을 지킨다: 개수 = min(n x (?fx=low면 0.5), `maxParticles - 지금 살아 있는 수`).
  - 총구 섬광: 그림(`fx_muzzle`)이 있으면 그 위에 탄피만, 없으면 가산 부드러운 원. 탄 궤적: 가산 선 + 끝으로 날아가는 흰 빛 알갱이, 닿는 순간 불꽃 8개. 저격: 금빛 굵은 바깥 선 + 흰 심지(가산, 0.15초), 관통한 적마다 불꽃. 송풍: 부채꼴 눈보라(상병이면 주황 불씨), 밀린 적 아래로 먼지 꼬리. 폭발: 중심 번쩍임 + 충격파 고리 + 불꽃 + 파편 + 연기(그림 `fx_explosion`이 있으면 그 위에). 처치: 먼지. 진급: 금빛 계급 고리 + 별 파티클. 회복: 초록 십자. 가스: 가스가 있는 칸마다 0.4초에 2개씩 노랑·초록 연기.
  - 히트스톱: `hitStop()`이 0.05초(실제 시간)를 걸고 `BattleScene.update`가 `stopping(real)`이 true인 동안 dt를 0으로 쓴다(배속 무관). 호출 지점: 지뢰 폭발, 화력 지원 포격, 보스 처치(큰 폭발·흔들림 포함), 진급.
- `enemies.ts`: 취약 표식을 몸통 테두리에서 체력바 위 붉은 아래 화살표(삼각형)로 바꾸고 `vuln` 남은 시간으로 깜빡이게 했다. 지뢰 연계면 적 머리 위에 "연계!" 팝업. RPG병이 때릴 때 폭발.
- `units.ts`: 도발 고리를 금색 가산 고리 + 위아래 맥동 트윈으로(웨이브 끝에 트윈도 함께 끊는다), 저격 관통 불꽃, 송풍 불씨·먼지 꼬리.
- `gas.ts`: `Gas.puff` 타이머로 칸 연기. `board.ts`: `promoteTo`에 `promoteFx` 한 줄.

## 헤드리스 확인과 스크린샷

방식은 07-01과 같다(이 task에서 띄운 vite 5199 + Chrome headless 9338, 새 브라우저 컨텍스트, `game.scene.pause('battle')`, `scene.update(0, 100)`으로 진행). 멈춘 씬에서는 트윈·이미터가 안 흐르므로 하네스가 트윈은 `tween.update(ms)`, 이미터는 `preUpdate(0, ms)`로 직접 흘려 연출이 터진 뒤 원하는 시점에서 찍었다(스크립트 `/tmp/gsd07/fx.mjs`, 저장소 밖). **모든 페이지에서 캔버스 1개, 페이지 오류 0건.** 720x1560, 전부 Read로 직접 확인했다.

| 파일 | 시점 | 눈으로 본 것 |
|---|---|---|
| `docs/shots/M4-07-02-shot.png` | 사격 50ms 뒤 | 소총수 셋이 위 보병 쪽으로 쏜다. 금색 탄 궤적 3줄 위를 흰 빛 알갱이(번진 빛)가 날아가는 중, 총구에는 주황 섬광(그림 `fx_muzzle`)과 금색 탄피가 튄다. 맨 왼쪽 위 저격은 흰 심지 + 금빛 바깥 선의 굵은 빛줄기. 적은 피격 흰 번쩍임. 소총수 옆 흰 막대는 계급 작대기. |
| `docs/shots/M4-07-02-blow.png` | 송풍 300ms 뒤 | 가운데 제설병(이등병)이 쏜 눈보라가 흰·하늘색 알갱이로 부채꼴로 퍼지고 적 발치에는 회색 먼지 꼬리 두 개. 적 3마리(앞 3열) 머리 위 체력바 위에 붉은 아래 화살표(취약). 제설병 둘 발밑에 금색 도발 고리(맥동 중). 중앙 위 하늘색 결정은 기존 그림 이펙트 `fx_wind`. |
| `docs/shots/M4-07-02-boom.png` | 지뢰 폭발 220ms 뒤 | 제설병이 민 보병이 지뢰에 터짐. 주황 충격파 고리가 퍼지고 안쪽에 주황~흰 불꽃, 회색 파편 조각, 옅은 연기. 그 위에 노란 "연계!"가 떠오른다. 양옆 적은 피격 번쩍임. |
| `docs/shots/M4-07-02-gas.png` | 가스 3초 지속 | 가스 칸 6개(그림 `fx_gas` 노랑 소용돌이) 위로 황록 빛 연기가 위로 번져 올라간다. 그림 위라 대비는 약하다(아래 사람 확인 항목). |

진급·회복·처치 먼지·보스 처치 폭발·RPG 폭발은 스크린샷 없이 같은 하네스로 오류 없이 도는 것만 확인했다(EXTRA: 진급 직후 12개 파티클, 처치·회복 포함 54개, 보스 사망 처리, 페이지 오류 0).

## 파티클 수 측정 (상한 `FX.maxParticles` = 400)

| 시나리오 | 동시 활성 파티클 최댓값 | 판정 |
|---|---|---|
| 평소 전투 30걸음(웨이브 3, 소총수 3·제설병·저격수, 실제 출현 계획, 걸음당 0.1초) | **8** | 30걸음 중 사격이 있던 걸음에만 잠깐 8, 대부분 0 |
| 웨이브 5 한 판 전체(소총수 4·제설병 2·저격수·취사병, 555걸음 = 약 55초) | **114**(평균 23.5, 활성 걸음 384) | 상한 이내 |
| 최악: 지뢰 3개 동시 폭발 + 화력 지원 8줄 폭발(20걸음) | **280** | 400 이내(상한이 막기 전 값) |
| 가스 칸 6개 3초 | 47 | 이내 |
| 지뢰 1개 폭발 직후 일반 / `?fx=low` | 28 / 14 | 절반 확인 |

히트스톱 STOP: 2배속에서 지뢰 폭발 뒤 16ms 프레임 4번 동안 `clock`이 0.000, 5번째부터 다시 흘렀다(약 0.05초 실제 시간).

## 게이트 (04-02와 같은 명령)

- `npm run verify` 통과: typecheck, 17개 파일 266개 테스트, assets:check, build. (로그 `/tmp/gsd07/verify-02.log`)
- 숫자 리터럴 게이트(`src/battle/*.ts`) 합 0, 한글 코드 게이트 합 0.
- 레인 B diff(`src/ui src/main.ts src/debug.ts src/assets.ts src/save.ts src/audio.ts package.json public`) vs origin/main: 비어 있음. 새 의존성 없음.
- 정리: vite 5199, Chrome 9338 종료, 포트 비어 있음(`lsof`, `pgrep`). 5173·에뮬레이터는 건드리지 않았다.

## 계획과 달라진 점

1. **board.ts 수정**: 계획의 `files_modified`에 없지만 진급 연출은 `board.ts`의 `promoteTo`에서만 걸 수 있어 한 줄(`promoteFx`)과 import 한 줄을 추가했다(레인 A 파일).
2. **파티클 텍스처 4개**: 계획은 3개(원·사각·부드러운 원)였고 회복의 "+ 기호"를 위해 십자를 하나 더 만들었다. 별 파티클은 회전하는 금색 가산 사각(다이아몬드)으로 그렸다.
3. **`explosion` 시그니처**: 높이 인자(`h`)가 쓰이지 않게 돼 `(scene, x, y)`로 줄였다. 호출처(지뢰·화력 지원) 둘을 고쳤다. 옛 열 높이 청백색 사각형은 없앴다.
4. **`windWave` 인자 추가**: `burning`(상병 이상) 불린을 마지막에 추가해 주황 불씨를 섞는다.
5. **RPG 폭발**: 계획 목록에 있어 RPG병이 아군을 때리는 순간 폭발 연출을 넣었다(히트스톱·흔들림은 없음).
6. 하네스 문제를 두 번 고쳤다(제품 코드 아님): 이미터를 `constructor.name`으로 찾다 놓쳐 파티클이 늙지 않았고, Phaser 4의 `tweens.update`는 인자를 무시하고 벽시계를 써서 트윈이 안 흘렀다. 둘 다 `type === 'ParticleEmitter'`, `tween.update(ms)`로 바꾼 뒤에 낸 수치와 스크린샷만 이 문서에 쓴다.

## 알려진 한계

- ponytail: `?fx=low`는 `fx.ts`에서 `URLSearchParams`를 직접 읽는다. 설정 화면 연결은 게이트 때 `debug.ts`로.
- ponytail: 히트스톱은 트윈·파티클을 멈추지 않는다(전투 dt만 0). 준비 단계에서 진급하면 준비 타이머도 0.05초 멈춘다.
- 취약 화살표는 깜빡임 주기가 남은 취약 시간 기준이라 적마다 위상이 다르다. 스크린샷은 켜진 순간이다.
- 그림 이펙트(`fx_flame`·`fx_wind`·`fx_gas`)가 크게 덮는 장면은 파티클이 상대적으로 약하게 보인다(블로·가스 스크린샷).

## 사람 확인 대기

<human-check> 손맛·프레임은 실기기에서 사람이 본다. 기다리지 않고 기록만 한다.

- URL: `npm run dev` 후 `/?scene=battle&wave=5&unlock=all&supply=99&seed=42`에 소총수·제설병·저격수·지뢰설치병을 배치하고 "출동!". 저사양 비교는 같은 주소 + `&fx=low`.
- 기대: (1) 실기기에서 프레임이 떨어지지 않는다(웨이브 5 최대 파티클 약 114, 최악 280). (2) 지뢰·화력 지원 때 0.05초 멈칫이 "손맛"으로 느껴지고 거슬리지 않는다. (3) 너무 요란하지 않은지, 반대로 가스 연기·눈보라가 그림 이펙트에 묻혀 약하지 않은지. (4) 취약 화살표 깜빡임 속도(`FX.vuln.blinkHz`)와 도발 고리 맥동(`FX.taunt.ms`)이 적당한지.

## Known Stubs

없음.

## Threat Flags

없음(새 네트워크·권한·저장 경계 없음).

## Self-Check: PASSED

- 파일 존재: `docs/shots/M4-07-02-shot.png`, `-blow.png`, `-boom.png`, `-gas.png`, 이 SUMMARY.
- 커밋 `3ec4b20` 존재 확인(`git log`).
