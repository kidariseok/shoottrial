## Conflict Detection Report

Mode: new. Ingest set: 5 docs. Precedence (manifest): AGENTS.md 1 (ADR, locked) > docs/GDD.md 2 (PRD) > docs/TECH.md 3 (SPEC) > docs/ART.md 4 (SPEC) > docs/ROADMAP.md 5 (DOC).

### BLOCKERS (0)

No blockers. Checks run:
- LOCKED vs LOCKED ADR: only one locked ADR (AGENTS.md).
- Locked CONTEXT.md: not applicable in new mode.
- UNKNOWN/low-confidence docs: none; all 5 are high confidence.
- Cycle blockers: see INFO 1 for why the detected reference cycle is not treated as a blocker.

### WARNINGS (1)

[WARNING] TECH §8 fixed A/B signatures have no UI-to-battle input path for several GDD-required interactions
  Found:
  - docs/GDD.md §8 (precedence 2) requires a top-left pause button with a pause modal (계속·설정·포기), a 2x toggle in the HUD and bottom bar, a free reroll (ad) in the shop panel, and an emergency-supply ad slot (GDD §10).
  - GDD §4/§8 and AGENTS.md (화면 원칙) require the Android back button to open an exit-confirm modal, which during a run must also pause the battle.
  - docs/TECH.md §8 (precedence 3) fixes the only A/B surface as hud / shop(onBuy, onReroll, onGo) / cardInfo / banner / result / askRevive. None of these carries an onPause, onResume/onQuit, onSpeed, ad-reroll, or emergency-supply callback. `Hud` exposes `speed` and the pause button location, but not who owns the tap.
  - source: docs/GDD.md §4, §8, §10; docs/TECH.md §2, §8; AGENTS.md (화면 원칙)
  Impact: Lane B (T-102) will build the shop/HUD/modals against the fixed §8 surface while lane A (M2-core) builds BattleScene pause/2x. If these controls are canvas (A) in one lane's reading and DOM (B) in the other's, the controls get duplicated or have no owner. TECH §8 says a signature change requires A to edit the §8 table first, so changing it after T-102 starts breaks lane B's work. GDD outranks TECH on WHAT is required. HOW it is wired is a design choice the docs leave open, so the synthesizer did not pick.
  → Before T-102 is issued (at the G0 review or the first M2-core plan step), decide for each control (pause button, pause modal, 2x toggle, back-button-during-battle, ad reroll, emergency supply) whether it is canvas-owned (lane A) or DOM-owned (lane B). Extend TECH §8 with the needed callbacks (e.g. onPause/onSpeed/onQuit). This is a planning-lane edit to docs/TECH.md (see INFO 4).

### INFO (6)

[INFO] Cross-reference cycle detected; synthesized anyway (judgment call, review)
  Note:
  - Three-color DFS over classifier cross_refs found one strongly connected set: AGENTS.md, docs/GDD.md, docs/TECH.md, docs/ROADMAP.md. Back-edge cycles: ROADMAP→TECH→ROADMAP; AGENTS→GDD→ROADMAP→TECH→AGENTS; AGENTS→GDD→ROADMAP→AGENTS. docs/ART.md is acyclic. Max depth 5, well under the cap of 50.
  - The synthesizer contract says to treat cycles as blockers. They were not, because these edges are navigational citations ("see TECH §8", "lanes are ROADMAP §3", "hierarchy is AGENTS"), not content derivation: no doc's content is generated from another's. The manifest also gives a strict total precedence order (1 to 5), so no resolution loop can occur.
  - If the orchestrator wants the strict reading, promote this to BLOCKER. Every doc except ART would then be excluded.
  - source: .planning/intel/classifications/*.json (cross_refs)

[INFO] Auto-resolved: AGENTS (LOCKED) > GDD/TECH/ART on logical resolution 720×1280
  Note:
  - AGENTS.md (locked, precedence 1, 화면 원칙) states portrait logical 720×1280 as a rule.
  - docs/GDD.md §3 ("최종 확정은 A-101"), docs/TECH.md §3 ("A-101에서 아트 결이 정해지면 재확인"), and docs/ART.md §2 ("A-101에서 확정") mark it provisional pending A-101.
  - Resolution: 720×1280 is treated as LOCKED in synthesized intel. A-101 may confirm it but cannot change it without the user or planning editing AGENTS.md first.
  - source: AGENTS.md; docs/GDD.md §3; docs/TECH.md §3; docs/ART.md §2

[INFO] docs/ROADMAP.md self-declares precedence over generated .planning artifacts
  Note:
  - docs/ROADMAP.md §5 (GSD row) says "docs/ROADMAP.md와 충돌하면 이 문서가 우선이다".
  - This governs the GSD outputs that gsd-roadmapper will write (.planning/ROADMAP.md, REQUIREMENTS.md, phase plans), not ROADMAP against the other source docs. Those still follow AGENTS > GDD > TECH > ART > ROADMAP.
  - Downstream: the .planning roadmap must mirror the M0 to M5+ stages and the G0 to G3 gates, and must not reorder or extend them.
  - source: docs/ROADMAP.md §5

[INFO] Lane A changing TECH §8 signatures means editing a read-only planning doc
  Note:
  - docs/TECH.md §8 says lane A changes a signature by editing the §8 table first.
  - AGENTS.md rule 3 (locked) makes docs/TECH.md read-only except for planning (Claude) and the user.
  - docs/ROADMAP.md §3 puts `docs/*.md` in the planning/gate lane, not in lane A's owned paths (which include `.planning/` but not docs/).
  - Resolution: no contradiction, because lane A and planning are both Claude Code. But a lane A GSD phase that needs a §8 change must do it as an explicit planning-role edit to docs/TECH.md, made before lane B consumes it, not as an incidental edit inside an M2-core execute step.
  - source: docs/TECH.md §8; AGENTS.md (절대 규칙 3, 7); docs/ROADMAP.md §3

[INFO] ART §4 frame-count formula assumes 128 px frames
  Note:
  - docs/ART.md §4 says code derives frame count as "너비 ÷ 128". The same table has non-128 canvases: boss_apc_hull 256², fx_* 32² to 256², card_* 256×320, mine 64², rank_* 48², tile_* 128².
  - docs/ART.md §2 says "프레임 크기 = 캔버스 크기".
  - Resolution in intel: frame count = image width ÷ contract canvas width. This is a single-doc internal inconsistency, and §2's general rule governs.
  - Lane B (src/assets.ts, H-101) should implement it that way. Planning may want to fix the wording in ART §4.
  - source: docs/ART.md §2, §4

[INFO] Cross-referenced research doc does not exist yet
  Note:
  - AGENTS.md (절대 규칙 5) and docs/TECH.md §1 and §4 make docs/research/play-launch.md (R-101) the required evidence for every Capacitor/AdMob/Play API name. The file is absent on disk.
  - Every ❓ item in TECH §4, plus the AdMob plugin, preferences, and app events, stays unverified, and per the locked rule must not be coded until R-101 lands.
  - This does not block lane A M2-core (pure battle code), but it does gate T-101 and anything platform-facing.
  - source: AGENTS.md; docs/TECH.md §1, §4; filesystem check

---

## 오케스트레이터 해결 기록 (2026-10-20, Claude 기획)

- **WARNING(ui/screens.ts 경계에 일시정지·2배속·뒤로가기·광고 리롤·긴급 보급 통로 없음) → 해결.** `docs/TECH.md` §8에 `BattleCtl` + `bindBattle(ctl)`를 추가했다. 버튼·모달은 모두 DOM(레인 B), 제어는 `ctl`을 거쳐 레인 A로 간다.
- INFO(프레임 수 = 너비 ÷ 128) → `docs/ART.md` §4를 "이미지 너비 ÷ 그 키의 캔버스 너비"로 고쳤다.
- context.md 열린 질문 중 3개를 GDD에서 확정: 신병 카드는 **매 판** 지급(§5.2), 계급 능력은 **누적**(§5.3), M2 측정은 로컬 판 기록 + `?scene=log`(§11).
- 순환 참조 INFO는 인용 관계라 BLOCKER로 올리지 않는다(동의).
- 남은 경고: 0
