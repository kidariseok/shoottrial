# Ingest Synthesis: 《데프콘 2: 화스트 페이스》(가제)

Entry point for gsd-roadmapper. Mode: new. Synthesized 2026-10-20 from 5 source docs.

Project: a Google Play (Capacitor Android) portrait card-defense game. Place military-role cards on 5 lanes, merge duplicates to raise rank (짬), and defend a guard post over 10 waves. Stack: Phaser 4.2.1 + TypeScript + Vite, with DOM/CSS menus. Treat any pre-pivot Toss mini-app ("출동! 5분대기조", 360×640) material as obsolete.

## Doc counts by type
- ADR: 1. AGENTS.md (precedence 1, LOCKED)
- PRD: 1. docs/GDD.md (precedence 2)
- SPEC: 2. docs/TECH.md (precedence 3), docs/ART.md (precedence 4)
- DOC: 1. docs/ROADMAP.md (precedence 5)
- UNKNOWN: 0

## Decisions locked: 14 (all from AGENTS.md)
- File: .planning/intel/decisions.md
- DEC-product-identity, DEC-doc-hierarchy, DEC-ticket-worktree-flow, DEC-owned-paths-only, DEC-read-only-docs, DEC-dependency-allowlist, DEC-platform-api-verification, DEC-lane-a-protection, DEC-verification-honesty, DEC-ponytail-code, DEC-content-policy, DEC-screen-rules, DEC-debug-urls, DEC-roles

## Requirements extracted: 27 (from docs/GDD.md, cross-cited to ROADMAP/TECH where relevant)
- File: .planning/intel/requirements.md
- M2 core (lane A heavy): REQ-run-loop, REQ-wave-reset, REQ-defcon-phases (rules M2 / presentation M3), REQ-base-hp-and-last-line, REQ-board-layout, REQ-lane-targeting, REQ-drag-and-place, REQ-card-roster-m2, REQ-starting-recruit, REQ-rank-merge, REQ-rank-abilities, REQ-role-synergy, REQ-mines, REQ-enemies-m2, REQ-wave-table-stage1, REQ-economy, REQ-meta-unlocks (wave-5 unlock), REQ-juice
- M2 UI (lane B, via the TECH §8 surface): REQ-screens, REQ-intro-and-notices
- M2 exit gate: REQ-g1-fun-validation
- M3: REQ-card-chem-m3, REQ-enemies-m3, REQ-fire-support-m3 (plus M3 rows inside REQ-defcon-phases, REQ-screens, REQ-juice)
- M4: REQ-revive-ad, REQ-rewarded-ads, REQ-analytics-m4 (plus the ad unlock in REQ-meta-unlocks)
- M5+ backlog and explicitly dropped items are listed at the end of requirements.md.

## Constraints: 24 (TECH + ART, with lane boundaries cross-cited to AGENTS/ROADMAP)
- File: .planning/intel/constraints.md
- api-contract (3): CON-screens-signatures (TECH §8, verbatim), CON-debug-urls, CON-asset-contract
- schema (2): CON-save-schema (`d2_save_v1`), CON-asset-ledger
- nfr (7): CON-stack, CON-screen-coordinates, CON-performance-budget, CON-art-direction, CON-sprite-spec, CON-ai-disclosure, CON-g0-device-behaviour
- protocol (12): CON-lane-a-ownership, CON-lane-b-ownership, CON-other-lanes, CON-folder-structure, CON-deliberate-omissions, CON-platform-facts, CON-audio, CON-rewarded-ad-flow, CON-verify, CON-autosave-branching, CON-asset-pipeline, CON-art-gating

## Lane A briefing (consumer of this .planning)
- Lane A = Claude Code via GSD, starting at phase `M2-core` after G0. Scope (ROADMAP §2 preview, confirmed at G0): board, lanes, 5 cards, merge, synergy, 10 waves.
- Lane A owns `src/battle/`, `src/rules.ts`, `src/data.ts`, `src/stages.ts`, `tests/rules*`, and `.planning/`. Nobody else edits the first four (locked).
- Lane A must not edit lane B paths (`src/ui/`, `src/debug.ts`, `src/assets.ts`, `src/platform.ts`, `src/save.ts`, `src/audio.ts`, `src/ads.ts`, `src/main.ts`, `index.html`, `package.json`, `android/`, `public/`, `scripts/`, non-rules `tests/`).
- The only A↔B interface is TECH §8 `ui/screens.ts`. A owns its definition and must amend TECH §8 (as a planning edit) before B depends on a change.
- All numbers go in data.ts/stages.ts. Pure logic goes in rules.ts, tests first (ecc:tdd-guide). ponytail bans apply (no Manager/Service, no state-machine class, no custom pool, no ECS).
- On disk now: `src/battle/BattleScene.ts` stub (scene key `'battle'`; the comment says H-101 only registers it and M2-core fills it and moves constants to `data.ts` LAYOUT). `art/LEDGER.json` is `{"entries":[]}`. `docs/research/play-launch.md` (R-101) does not exist yet.
- Single-source ambiguities to settle during M2-core discuss/plan: context.md "Open questions" OQ-1 to OQ-6, OQ-9, OQ-10.

## Context topics: 9, plus 11 open questions
- File: .planning/intel/context.md
- Topics: milestones and gates (M0 to M5+, G0 to G3), user admin track, M1 tickets, M2 preview, lanes, model selection, Claude Code tooling (GSD budget profile, research agents off), user daily routine, project pivot history.
- Roadmapper note: docs/ROADMAP.md §5 says docs/ROADMAP.md wins over generated .planning files. Mirror its stages and gates. Do not invent or reorder them.

## Conflicts: 0 blockers, 1 warning, 6 info (0 auto-resolved precedence overrides of substance; 1 LOCKED-wins resolution on 720×1280)
- Full report: .planning/INGEST-CONFLICTS.md
- WARNING: the TECH §8 A/B signatures lack callbacks for pause, the pause modal, the 2x toggle, back-during-battle, the ad reroll, and emergency supply that the GDD requires. Decide ownership and extend §8 before T-102.
- INFO highlights: the cross-ref cycle was synthesized anyway (judgment call, see report); 720×1280 is treated as locked; the ROADMAP-over-.planning rule; TECH §8 edits are planning-role edits; the ART frame-count formula; the R-101 research doc is missing.

## Classification inputs
- .planning/intel/classifications/AGENTS-0907fca2.json
- .planning/intel/classifications/GDD-13c86b3e.json
- .planning/intel/classifications/TECH-5d288ebf.json
- .planning/intel/classifications/ART-a3144658.json
- .planning/intel/classifications/ROADMAP-e2451a2b.json
