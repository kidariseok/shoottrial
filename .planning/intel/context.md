# Context (from DOC-class sources)

Source: docs/ROADMAP.md v1.0 (precedence 5, written 2026-10-20 by Claude/planning). The previous Toss mini-app edition is archived at docs/_archive/qrf-ROADMAP.md. Notes are keyed by topic with source attribution. An "Open questions" section at the end collects ambiguities the synthesizer found in GDD/TECH/ART that are not cross-doc conflicts.

---

## Topic: milestones and gates
- source: docs/ROADMAP.md §1
- Each stage must pass its gate before the next stage's tickets open. Detailed tickets are written only for the next stage. Claude issues the next batch at gate review.
- Build in stages: no mass art before shapes prove fun (G1).
- Stages:
  - M0 cleanup (Claude): new planning docs, reference md, harness fixes, M1 tickets. DONE 2026-10-20.
  - M1 foundation (lanes B, C, D): on the user's Android phone, a portrait-locked blank screen, back → confirm modal, and persistent save. Debug URLs work in the browser. Gate G0.
  - M2 graybox core (lane A battle + lane B shop/HUD/result UI): one 10-wave run in shapes, with placement, shop, merge, synergy, 5 cards, 3 enemies + boss, mines, and 2x. Gate G1 (fun).
  - M3 vertical slice (A + B + D): real art/sound, 4-panel intro, DEFCON presentation, chemical wave + 화학병, fire-support button, unlock + save. Gate G2.
  - M4 launch (B + user): 4 rewarded-ad slots, analytics events, privacy policy, store listing, rating, closed test with 12 testers × 14 days, then production. Gate G3.
  - M5+ updates: artillery 3 roles (FDC, ammo carrier, gunner), tanks, drones + anti-air, unit insignia, 유공 permanent upgrades, stages 2 and 3, endless + leaderboard, iOS. Issued at G3.
- Gate conditions:
  - G0, on the real device:
    1. Portrait lock
    2. Fullscreen + Safe Area (`?safe=1` capture)
    3. Back → exit-confirm modal
    4. Save persists across restart
    5. Background stops sound and resumes it
    - On failure: fix tickets for the failed items only.
  - G1: user plays 10 runs, plus 1 non-military acquaintance plays 3 runs. "yes" to "the combination changed the outcome" and "one more run". 6 to 10 minutes per run. No card under 5% purchase rate. Claude reviews the diff.
    - On failure: NO art; number/rule tuning tickets only.
  - G2: one full run with real art. 3 external testers. Greyscale readability check. UI review against Figma passes.
  - G3: 14-day closed test complete (12 or more testers retained), launch checklist (R-101 output) at 100%, zero crashes.

## Topic: user admin track (parallel from M1)
- source: docs/ROADMAP.md §1
1. Create a Google Play PERSONAL developer account (U-101).
2. Start recruiting 12 testers DURING M2. The 14-day closed test is the longest bar on the schedule.
3. Game production/distribution registration and rating follow R-101.
4. Privacy-policy URL: R-101 checks whether GitHub Pages suffices.

## Topic: M1 tickets
- source: docs/ROADMAP.md §2
- Tickets (lane, model, prerequisite):
  - U-101: Play personal account + start a tester candidate list (user).
  - R-101: Google Play launch requirements, policy, rating, admin, and Capacitor plugin checklist (C, Flash High).
  - R-102: ROK military authenticity, slang, 짬 culture, counter-drone, CBRN, artillery → card data candidates (C, Flash Medium).
  - A-101: style target + 2 reference sheets + card mockup + Figma link (D/user, Gemini Argon image).
  - H-101: Vite + Phaser 4 scaffold, verify, debug params, asset placeholders/gallery, empty `ui/screens.ts` signatures (B, Argon High).
  - T-101: Capacitor Android portrait, Safe Area, back modal, save, background mute → real device (B, Argon High; after H-101 and R-101).
  - P-101: device check → G0 (user; after T-101).
- Concurrency: R-101, R-102, A-101, and H-101 have disjoint owned paths and run in parallel Orca worktrees. Tickets sharing a path run one at a time.

## Topic: M2 preview (confirmed at G0)
- source: docs/ROADMAP.md §2
- Claude lane A GSD phase `M2-core`: board, lanes, 5 cards, merge, synergy, 10 waves.
- Lane B T-102: shop, HUD, result, card-info UI.
- H-102: `assets-check` + magenta cleanup script.
- Relevance: this is the first phase the generated .planning roadmap serves. Its scope is provisional until G0 review.

## Topic: lanes
- source: docs/ROADMAP.md §3
- Orca worktree = branch = one owner. Full path lists are in constraints.md (CON-lane-a-ownership, CON-lane-b-ownership, CON-other-lanes).
- Lane A starts in Claude Code with "M2-core 진행해줘" → GSD. Lane B/C start with a new Antigravity conversation → `/start-ticket <ID>`. Planning/gates start with "G0 리뷰해줘".
- The A/B boundary is ONLY the TECH §8 `ui/screens.ts` signatures. A decides and B follows.
- Role cards: Antigravity reads docs/agents/antigravity-build.md (B) and docs/agents/antigravity-research.md (C).

## Topic: model selection
- source: docs/ROADMAP.md §4
- Planning/design/gate review and lane A design decisions: Claude Code Opus 5.5 (high).
- Lane A repetitive implementation and number tuning: Claude Code Sonnet 5.5.
- Lane B: Antigravity gemini-4-argon-high. Lane C research and trivial edits: Antigravity Flash (high/medium).
- Stuck twice (after `/stuck`): claude-sonnet-5-5-high inside Antigravity (does not use Claude Pro quota).
- A design decision needed mid-ticket: stop, write it in `## 질문`, and the user brings it to Claude Code.

## Topic: Claude Code tooling (ecc / gsd / ponytail)
- source: docs/ROADMAP.md §5
- GSD: each lane A phase is planned in `.planning/` via `gsd-plan-phase` → `gsd-execute-phase` → `gsd-verify-work`. Config: budget profile, research agents off (saves tokens). "docs/ROADMAP.md와 충돌하면 이 문서가 우선이다": docs/ROADMAP.md wins over generated .planning artifacts.
- ponytail: all lane A coding. ecc:tdd-guide: rules.ts, tests first. ecc:architect: before each phase, review the board/lane/merge structure. ecc:typescript-reviewer: lane B PR review at gates. ecc:browser-qa / e2e-runner: debug-URL screenshot checks at gates. gsd-ui-review: G2 Figma comparison. Firecrawl (Alexandria): only 1 or 2 times at the final research synthesis, to fill lane C gaps.

## Topic: user daily routine (Orca parallel)
- source: docs/ROADMAP.md §6
0. New computer or reinstall: docs/SETUP.md §1 to §3. Otherwise `git pull` in the main folder.
1. Pick tickets whose prerequisites are done. Several can run at once if lanes differ.
2. Create one Orca worktree per ticket (Orca names the branch).
3. Open the owning tool per worktree. Lanes B/C: Antigravity → new conversation → pick model → `/start-ticket <ID>`. Lane A: Claude Code → "M2-core 진행해줘".
4. When the agent writes its plan into the ticket, the user reads it and replies "진행".
5. `/finish-ticket` makes a PR. The user checks `docs/shots/<ID>.png` and the report, then merges on GitHub. Other worktrees run `git pull origin main`.
6. Problems: ask in the same conversation, or park them in `## 질문` for the next gate.
7. After a gate ticket (P-1xx), the user asks Claude Code "G0 리뷰해줘".

## Topic: project pivot history
- source: docs/ROADMAP.md header; docs/GDD.md header; docs/TECH.md header; docs/ART.md header
- v1.0 (2026-10-20) replaced the Toss mini-app top-down pixel shooter ("출동! 5분대기조", 360×640) with a Google Play Capacitor portrait card defense (720×1280). Archived predecessors are in docs/_archive/qrf-*.md and docs/_archive/tickets/. Treat anything citing Toss/앱인토스, `src/toss.ts`, `@apps-in-toss/web-framework`, or 360×640 as obsolete.

---

## Open questions (synthesizer-found ambiguities, not cross-doc conflicts)
These are single-source ambiguities. Precedence cannot resolve them because only one doc speaks to each. Each belongs in the relevant phase's discuss/plan step (lane A unless noted). Per AGENTS, an implementer hitting one writes it in `## 질문` and does not guess.

- OQ-1 "첫 판 시작 때" recruit placement (source: docs/GDD.md §5.2, §2.1): does the named rifleman start on the board at the start of EVERY run, or only the very first run ever?
- OQ-2 Rank-ability stacking (source: docs/GDD.md §5.2, §5.3): does 병장 keep the 상병 ability? Is 지뢰설치병 병장 tokens = 4 (§5.2) + 2 (§5.3) = 6, or 4 total?
- OQ-3 HP scaling for the boss (source: docs/GDD.md §5.6): does ×(1 + 0.12 × (wave − 1)) also apply to the armored-vehicle boss (1200 HP at W5 → 1776; at W10 → 2496)?
- OQ-4 Revive at HP 0 during M2 (source: docs/GDD.md §4.2, §8): M2 modals exclude ads. Does M2 go straight to the result screen, or show a stub revive?
- OQ-5 Bench band height (source: docs/GDD.md §3): bench band y=1040 to 1160 is 120 px, smaller than the 128 px unit canvas (ART §2). Confirm the bench scale or overlap.
- OQ-6 Purchase-rate measurement for G1 (source: docs/ROADMAP.md G1; docs/GDD.md §1.2, §11): G1 needs per-card purchase rates in M2, but analytics events are M4. M2-core needs a local tally (e.g. dev console log or debug overlay).
- OQ-7 Emergency-supply ad placement (source: docs/GDD.md §10, §8): the `supply` slot (+5, once per run) has no screen location in the §8 screen specs. M4, lane B + A.
- OQ-8 Phaser scale mode (source: docs/TECH.md §3): "Scale.FIT" letterboxes to a fixed aspect, while the same row asks for extra background up to 720×1560 on taller screens. That behaviour needs an expand-style mode or a resized game height. H-101/T-101 should verify against Phaser 4.2.1 types.
- OQ-9 Debug params owned by A but parsed in B's file (source: docs/TECH.md §9, §2): `?wave`, `?supply`, `?deck`, `?god`, `?speed` are lane A effects, but parsing lives in `src/debug.ts` (lane B). M2-core needs H-101 to expose them, or must request an addition through a lane B ticket.
- OQ-10 `SPRITE_SCALE` and `LAYOUT` in data.ts (source: docs/ART.md §0; docs/TECH.md §3): both constants live in lane A's `data.ts` but are consumed by lane B (`assets.ts`, gallery) and A. If H-101 needs them before M2-core exists, there is a cross-lane ordering dependency.
- OQ-11 Fire-support button (source: docs/GDD.md §12; docs/ROADMAP.md M3): its mechanics (cooldown, damage, target area) are unspecified. Design at M3.
