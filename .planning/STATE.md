# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-20)

**Core value:** 배치 조합이 결과를 바꾸고, 끝나면 "한 판 더"를 누르고 싶은 10웨이브 한 판(도형만으로).
**Current focus:** M2 그레이박스 코어 — Phase 1: 판·차선·배치

## Current Position

Phase: 1 of 3 (판·차선·배치)
Plan: 0 of TBD in current phase
Status: Ready to plan (실행은 H-101 머지 뒤)
Last activity: 2026-10-20 — 문서 인제스트로 PROJECT/REQUIREMENTS/ROADMAP/STATE 생성

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: 신병 소총수는 매 판 지급(GDD §5.2), 계급 능력은 누적(GDD §5.3), M2 측정은 `d2_playlog` + `?scene=log`(GDD §11).
- [Init]: 일시정지·2배속·포기·광고 리롤·긴급 보급은 DOM(B) → `bindBattle(ctl)` → A(TECH §8).
- [Init]: 720×1280은 잠긴 값(AGENTS.md).

### Pending Todos

None yet.

### Blockers/Concerns

- **H-101 미머지**: `package.json`, `src/debug.ts`, `src/ui/screens.ts`가 아직 없다(디스크에는 `src/battle/BattleScene.ts` 스텁만). Phase 1 실행 전 필수.
- **G0 게이트**: `docs/ROADMAP.md`상 M2 티켓은 G0 통과 뒤 열린다. 계획(plan-phase)은 먼저 해도 되지만 실행 시점은 사용자와 맞춘다.
- **T-102 미발행**: Phase 3 화면 확인과 G1 넘기기의 선행. TECH §8을 바꿔야 한다면 T-102 발행 **전에** 기획 역할로 고친다.
- **열린 질문(단계별 discuss에서 정함)**:
  - Phase 1: 판매 제스처 위치(상점 패널은 DOM), 대기석 띠 120px vs 카드 128px(OQ-5), `LAYOUT`·`SPRITE_SCALE` 소비 순서(OQ-10)
  - Phase 2: 보스 HP 스케일 적용 여부(OQ-3), 지뢰설치병 병장 토큰 6(4 + 2) 해석 확인
  - Phase 3: M2에서 HP 0 → `askRevive` 스텁 vs 바로 결과(OQ-4), 결과 화면 "기록" 표용 `result()` 필드 추가 여부, `?scene=log` 씬 등록(`main.ts`는 레인 B), 해금 저장 주체(`save.ts`는 레인 B)

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Milestone | M3 수직 슬라이스(CHEM-01, ENEMY-05, FIRE-01, FX-02) | Backlog | 2026-10-20 |
| Milestone | M4 출시(REVIVE-01, ADLIM-01, ANLY-01) | Backlog | 2026-10-20 |
| Milestone | M5+ 업데이트 | Backlog | 2026-10-20 |

## Session Continuity

Last session: 2026-10-20
Stopped at: 로드맵 초안 작성 완료, 사용자 승인 대기
Resume file: None

## 2026-10-20 시작 조건 변경

- Phase 1은 **H-101 병합 직후** 시작한다(G0 대기 없음, docs/ROADMAP.md §2).

## 2026-10-20 기획 결정 (Claude, 문서 반영 완료)

- 판매: 대기석 오른쪽 캔버스 **판매 칸**으로 드래그(GDD §3·§4, TECH §8)
- 결과 화면 "기록" 표는 두지 않는다. `?scene=log`만(GDD §11). `result()` 시그니처 그대로
- `?scene=log`: main.ts(B)가 battle 씬으로 시작, BattleScene(A)이 기록 화면을 그린다(H-101 반영)
- 해금 저장: A가 B의 `save.ts` load/save를 호출(TECH §8)
- 남은 것(phase discuss에서): OQ-5 대기석 띠 높이, OQ-10, OQ-3 보스 HP 스케일, 병장 지뢰 토큰 6, OQ-4 M2의 askRevive

## 2026-10-20 Phase 1 실행 완료 (사람 확인 대기)

- 계획 3/3 실행. `npm run verify` 통과(테스트 41). 레인 B 파일 변경 없음.
- 브랜치 `kidariseok/m2-core-phase1`. 스크린샷 docs/shots/M2-01-02.png, M2-01-03.png, M2-01-03-drag.png.
- 사람 확인(사용자): `/?scene=battle&deck=rifle:4,sniper:2&supply=99`에서 드래그·합성·판매·보정. 통과하면 Phase 2(전투).
- 확인 못 한 것: 실제 터치 기기, 높이 1280(dy=0) 화면, 진급 확대 애니메이션 자체.
