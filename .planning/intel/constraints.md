# Constraints (from SPEC-class sources)

Sources: docs/TECH.md v1.0 (precedence 3), docs/ART.md v1.0 (precedence 4). Lane-boundary constraints also cite AGENTS.md (precedence 1, locked) and docs/ROADMAP.md (precedence 5). Types: api-contract | schema | nfr | protocol.

---

## Lane boundaries (read first for M2-core and later)

### CON-lane-a-ownership
- source: AGENTS.md (절대 규칙 7); docs/ROADMAP.md §3; docs/TECH.md §2
- type: protocol
- content:
  - Lane A (core battle) = Claude Code via GSD phases (starting with "M2-core").
  - Owned paths: `src/rules.ts`, `src/data.ts`, `src/stages.ts`, `src/battle/` (BattleScene.ts, board.ts, units.ts, enemies.ts, fx.ts), `tests/rules*`, `.planning/`.
  - Only Claude Code edits `src/battle/`, `src/rules.ts`, `src/data.ts`, `src/stages.ts` (locked, AGENTS).
  - Lane A owns the canvas: bench, deploy zone, mine tokens, drag, snapping, merge. Drags must finish in one coordinate system (TECH §8).
  - `src/battle/` never touches the DOM directly. It calls only the `src/ui/screens.ts` functions in CON-screens-signatures.
  - Lane A defines the `ui/screens.ts` signatures and lane B follows them. To change a signature, A edits the TECH §8 table FIRST (TECH §8; ROADMAP §3).
  - Model use: Opus 5.5 (high) for design and gate decisions, Sonnet 5.5 for repetitive implementation and number tuning (ROADMAP §4).
  - GSD config per ROADMAP §5: budget profile, research agents off. Flow is `gsd-plan-phase` → `gsd-execute-phase` → `gsd-verify-work`. Use ecc:tdd-guide for rules.ts (tests first), ecc:architect before a phase starts, and ponytail for all lane A code.

### CON-lane-b-ownership
- source: docs/ROADMAP.md §3; docs/TECH.md §2
- type: protocol
- content:
  - Lane B (platform/UI) = Antigravity Argon High, via `/start-ticket <ID>`.
  - Owned paths: `index.html`, `capacitor.config.ts`, `package.json`, `android/`, `src/main.ts`, `src/platform.ts`, `src/save.ts`, `src/audio.ts`, `src/ads.ts`, `src/assets.ts`, `src/debug.ts`, `src/ui/` (screens.ts, style.css), `scripts/` except harness, `tests/` except rules, `public/`.
  - Lane A must not edit these. Anything lane A needs from them (debug param exports, asset keys, screens functions) is a cross-lane dependency.

### CON-other-lanes
- source: docs/ROADMAP.md §3
- type: protocol
- content:
  - Lane C (research, Antigravity Flash) owns exactly one `docs/research/<주제>.md`.
  - Lane D (art, user + Gemini Argon image + Figma) owns `art/` and Figma. Assets flow D→B into `public/assets/`.
  - Planning/gate (Claude Code) owns `AGENTS.md`, `docs/*.md`, `docs/tickets/`, `docs/reviews/`, `docs/agents/`, `scripts/harness/`, `.agents/`.
  - Tickets that write the same path run one at a time. Different lanes run in parallel Orca worktrees.

### CON-screens-signatures
- source: docs/TECH.md §8
- type: api-contract
- content (fixed A↔B boundary, verbatim):
  ```ts
  export type Phase = 'prep' | 'fight' | 'settle'
  export type Hud = { wave: number; waves: number; defcon: 2 | 1; supply: number; baseHp: number; phase: Phase; prepLeft: number; speed: 1 | 2; synergies: { card: string; count: number; on: boolean }[] }
  export type Offer = { card: string; cost: number } | null

  export function hud(h: Hud): void                                              // 매 프레임이 아니라 값이 바뀔 때만
  export function shop(open: boolean, offers: Offer[], supply: number, onBuy: (i: number) => void, onReroll: () => void, onGo: () => void): void
  export function cardInfo(card: string | null, rank?: number): void            // null이면 닫기
  export function banner(text: string, kind: 'flag' | 'defcon' | 'info'): void
  export function result(r: { win: boolean; wave: number; kills: number; unlocked?: string }, onAgain: () => void, onLobby: () => void): void
  export function askRevive(onYes: () => void, onNo: () => void): void
  ```
  - H-101 creates empty implementations and lane B fills them.
  - Shop tap → `onBuy(i)` → A deducts supply and puts the card on the bench.
  - `hud()` is called only when values change, never every frame.
  - See the INGEST-CONFLICTS warning: this surface has no UI→A callback for pause, the 2x toggle, or the ad-driven free reroll / emergency supply.

---

## Stack and structure (TECH)

### CON-stack
- source: docs/TECH.md §1
- type: nfr
- content:
  - TypeScript + Vite.
  - Phaser 4.2.1, version pinned. Most online examples are Phaser 3; check unfamiliar APIs in `node_modules/phaser/types`.
  - Capacitor, Android first (iOS M5+). The version is fixed at H-101.
  - AdMob plugin candidate `@capacitor-community/admob` (pending R-101).
  - `@capacitor/preferences` with a `localStorage` fallback (pending R-101).
  - `@capacitor/app` `backButton` / `appStateChange` (event names pending R-101).
  - Vitest only for pure functions (rules.ts), save, and the ad flow.
  - Menus are plain DOM + CSS (no React).
  - Font: Pretendard or an OFL font chosen at A-101.
  - Items marked ❓ must not be coded until R-101 (`docs/research/play-launch.md`) confirms them.

### CON-folder-structure
- source: docs/TECH.md §2
- type: protocol
- content:
  - Creating files outside this tree needs ticket permission.
  - Key A files: `data.ts` holds all number tables (cards, enemies, economy, synergy), 1:1 with GDD §5/§6. `stages.ts` holds the wave table (GDD §5.7). `rules.ts` holds pure functions (merge, synergy count, interest, damage, knockback, shop roll, wave scaling). `battle/BattleScene.ts` handles phase switching (prep/fight/settle), pause, and 2x. `board.ts` handles cell coordinates, drag/snap/merge, bench, and mine zone. `units.ts` is an ally per-card switch. `enemies.ts` is an enemy per-type switch plus boss. `fx.ts` handles flash, shake, particles, and popups.
  - Boot (B): `platform.init()` → `save.load()` → `ui.show('lobby')`.

### CON-deliberate-omissions
- source: docs/TECH.md §2.1, §11
- type: protocol
- content (rejected designs, with the condition to reconsider):
  - GameStateMachine class → `phase` variable + switch (reconsider if more than 5 phases).
  - ObjectPool<T> → Phaser `Group({ maxSize })` + `get()`.
  - ECS/component classes → data rows + per-type switch (reconsider if more than 20 cards AND a switch over 300 lines).
  - 2D collision → per-column 1D y comparison.
  - Pathfinding → straight descent. The dog's lane change is a one-step sideways tween.
  - AdManager/SaveService → module functions.
  - Event bus → direct calls (§8).
- Banned list (§11):
  - React/Vue/Svelte, state-management libraries, ECS
  - Manager/Service classes
  - Custom pools or state machines
  - Hard-coded numbers (use data.ts/stages.ts)
  - New npm packages unless the ticket allows them
  - `@capacitor/*` imports outside platform.ts
  - Per-frame plugin calls or per-frame `ui.hud()`
  - `eval`, `new Function`, remote scripts

### CON-screen-coordinates
- source: docs/TECH.md §3; docs/ART.md §2; AGENTS.md (화면 원칙)
- type: nfr
- content:
  - Portrait lock via `screenOrientation="portrait"`.
  - Logical resolution 720×1280. Taller screens show background up to 720×1560. Phaser `Scale.FIT`. Re-checked after A-101.
  - Cell 128×128. Board zone coordinates live in one `LAYOUT` constant in `data.ts`.
  - Safe Area via CSS `env(safe-area-inset-*)` → `--sa-*` variables. The canvas HUD stays inside `platform.safeRect()`. Whether Android 15+ edge-to-edge reports values is measured in T-101.
  - `?safe=1` draws a green Safe Area outline and must appear in screen-ticket screenshots.

### CON-platform-facts
- source: docs/TECH.md §4
- type: protocol
- content: Every item is ❓, pending R-101, and must not be coded before confirmation:
  - Personal-account closed test (12 testers × 14 days)
  - Target API level
  - AAB + Play App Signing
  - IARC replacing the Korean rating
  - Game production/distribution business registration
  - Data safety form, privacy-policy URL, contains-ads flag
  - War/real-country content policy
  - AdMob rewarded event names and test IDs
  - Back-button and background/resume event names

### CON-save-schema
- source: docs/TECH.md §5
- type: schema
- content:
  ```ts
  type Save = { v: 1; name: string; unlocked: string[]; bestWave: number; runs: number; firstRun: boolean; settings: { bgm: boolean; sfx: boolean; haptic: boolean; dmgNumbers: boolean } }
  ```
  - Single key `d2_save_v1`, value is `JSON.stringify`.
  - Save only at run end, unlock, settings change, and name entry. Never save mid-battle.
  - On parse failure: defaults + `log('save_corrupt')`, with no crash.
  - When `v` changes, add one `migrate(old)`.

### CON-audio
- source: docs/TECH.md §6
- type: protocol
- content:
  - Mute = OR of user settings (`bgm`, `sfx`) and system flags (`hidden`, `ad`).
  - Mute triggers: app background (`platform.onPause`) and just before an ad shows.
  - Resume only when the app returns and the ad ends, then call `sound.context.resume()` once more on the first `pointerdown`.
  - At most 8 simultaneous SFX.

### CON-rewarded-ad-flow
- source: docs/TECH.md §7
- type: protocol
- content:
  - `preload()` → loaded=true.
  - `show(slot)`: if not loaded, return false immediately (the button is disabled anyway). Otherwise `audio.mute('ad')`, then show. The reward event sets earned=true but grants nothing yet. The close/fail event calls `audio.unmute('ad')`, grants the reward once if earned, then preloads again.
  - Closing alone never rewards. A duplicate guard ensures a single reward.
  - Test ad IDs in dev/test builds. Production IDs only in release builds, via `VITE_ADMOB_*`.
  - Slots: `revive`, `reroll`, `supply`, `unlock`.

### CON-debug-urls
- source: docs/TECH.md §9
- type: api-contract
- content (param, effect, owner):
  - `?scene=battle`: skip lobby (B, H-101)
  - `?scene=gallery`: all asset keys in a grid (B, H-101)
  - `?wave=5`: start at wave (A)
  - `?unlock=all`: unlock all cards (B)
  - `?supply=99`: starting supply (A)
  - `?deck=rifle:4,sniper:2`: cards on the bench at start (A)
  - `?god=1`: guard post invincible (A)
  - `?seed=42`: fixed RNG (B, H-101 exposes `debug.seed`)
  - `?speed=2`: start at 2x (A)
  - `?fps=1`: FPS / active object count (B)
  - `?safe=1`: Safe Area overlay (B)
  - Parsing lives in `src/debug.ts` (B). "A"-owned params mean A implements the effect. New params go in the ticket. Claude moves them into this table at gate time.

### CON-verify
- source: docs/TECH.md §10
- type: protocol
- content:
  - `npm run typecheck` (`tsc --noEmit`), `npm run test` (`vitest run`), `npm run build` (`vite build`), `npm run assets:check` (after H-102).
  - `npm run verify` runs them in order. The Stop hook runs it automatically before session end.
  - Device run: `npx cap sync android && npx cap run android` (after T-101; not part of verify).

### CON-performance-budget
- source: docs/TECH.md §10
- type: nfr
- content (measured at M4):
  - AAB 40 MB or less.
  - First screen within 3 s.
  - Average 55 fps or better on a low-end Android with 40 enemies + 15 allies.
  - JS heap growth 5 MB or less after 5 consecutive runs.

### CON-autosave-branching
- source: docs/TECH.md §12; AGENTS.md
- type: protocol
- content:
  - `stop-gate.mjs` → `autosave.mjs` at every turn end. `post-tool.mjs` → `autosave.mjs` every 5 minutes. Both commit everything and push to `origin HEAD:<branch>`.
  - `/finish-ticket` makes the completion commit + push + PR to main. Merges are done by the user (or Claude at gates).
  - No push on detached HEAD; the reason goes to `.harness/push-failed`.
  - The branch name goes on the ticket's `브랜치:` line.
  - Secrets (`.env*`, keystore) are gitignored. The repo is PUBLIC.

---

## Art and asset contract (ART)

### CON-art-direction
- source: docs/ART.md §1, §2 (가독성 규칙)
- type: nfr
- content:
  - Serious fictional war drama: a dark night guard post, red alarm lights, olive allies, grey-brown enemies. 3/4 top-down portrait view.
  - Take: ROK digital-camo uniforms, helmets, K2/K14 silhouettes, base scenery, NK infantry silhouettes, readable layouts.
  - Never: real unit insignia or rank originals, manufacturer logos, real gate signage, real leaders, flag desecration, idolization, reference-game characters/UI/names, blood, corpses, pain.
  - Red/orange only for enemy attacks, alarms, and telegraphs. Ally rounds are yellow/white.
  - Dark, desaturated floor. Bright units with clear outlines. A greyscale check must still separate ally, enemy, bullet, and mine marker (G2).

### CON-sprite-spec
- source: docs/ART.md §2
- type: nfr
- content:
  - Logical 720×1280 portrait (finalized at A-101), background up to 720×1560.
  - Allies face up (back visible), enemies face down.
  - Unit canvas fixed at 128×128, body about 96 px, pivot at the foot center (64, 116).
  - Boss 256×256, split into parts if possible (hull/turret). Card art 256×320 (upper body); the card frame is drawn by UI.
  - Sheets are one horizontal row with 0 gap, and frame size = canvas size.
  - Source art on magenta #FF00FF; final PNG transparent.
  - Code draws shadows (translucent ellipse). Rank insignia are separate `rank_*` overlays.
  - PNG sRGB, 512 KB or less each. Light from the top-left. Outline `#1b1d26`, 1 to 2 px.
  - Code draws sprites at contract size, with one global scale `SPRITE_SCALE` in `data.ts` (ART §0). Code also draws the sniper trail, damage numbers, siren border, and shadows (ART §4.3).

### CON-asset-pipeline
- source: docs/ART.md §3
- type: protocol
- content:
  1. Style target (A-101, user-approved, the reference for everything after)
  2. Character reference sheet (front/back/side)
  3. Per-state frame sheets
  4. Cleanup: magenta removal, 128 canvas alignment, foot baseline (H-102 script or by hand)
  5. Record in `art/LEDGER.json`
  6. `public/assets/<키>.png` → `npm run assets:check` → `?scene=gallery`
  - Steps 1 to 3: user (Gemini Argon image, Figma). Step 4: Antigravity H-102 + user touch-up. Steps 5 to 6: Antigravity asset-hookup ticket.
  - If frames keep drifting, reduce frame count and fill in with code tweens (the contract minimum is the floor).
  - Effects are drawn on separate sheets.
  - Prompt skeleton in ART §3.2 (English).

### CON-asset-contract
- source: docs/ART.md §4
- type: api-contract
- content:
  - H-101 ports this table to `src/assets.ts` (B). A missing key becomes a runtime solid-color placeholder with the same size and frame count. Dropping `public/assets/<키>.png` replaces it.
  - Frame count is derived from image width (ART §4 says "너비 ÷ 128"; see INGEST-CONFLICTS INFO for non-128 canvases).
  - Allies, `<카드>` ∈ {rifle, sniper, blower, cook, miner, chem (M3)}:
    - `ally_<카드>_idle`: 128², 1 to 2 frames, M2, placeholder olive square + initial
    - `_attack`: 2 to 4 frames, M3
    - `_hit`: 1 frame, M3
    - `_down`: 1 to 2 frames, M3
    - `card_<카드>`: 256×320, M3
    - `icon_<카드>`: 64², M3
    - `blower` attack = blowing, with flame overlaid via `fx_flame`. `ally_miner_plant` (2 to 3 frames) is added in M3.
  - Enemies (M3; placeholders in M2), 128², pivot at foot center:
    - `enemy_inf_walk/_attack/_down`
    - `enemy_dog_run/_bite/_down`
    - `enemy_rpg_walk/_fire/_down`
    - `boss_apc_hull` 256² and `boss_apc_turret` 128² (turret pivot decided after A-101)
  - FX/board/UI (M3):
    - `fx_muzzle` 32² ×2, `fx_wind` 128×256 ×4, `fx_flame` 128×256 ×4, `fx_explosion` 256² ×6, `fx_heal` 128² ×4, `fx_gas` 256² ×4 loop
    - `mine` / `mine_at` 64², `rank_1` to `rank_4` 48² (fictional design)
    - `bg_gate` 720×1560, `tile_deploy/_mine/_hover` 128², `ui_*` per Figma frame
  - Audio: `public/assets/sfx_*.m4a` 30 KB or less (sfx_rifle, sniper, wind, boom, heal, merge, siren, radio, hit, click, buy); `bgm_*.m4a` 500 KB or less, looped (bgm_lobby, bgm_defcon2, bgm_defcon1). Source and license go in the ledger.

### CON-asset-ledger
- source: docs/ART.md §4.5
- type: schema
- content:
  - `art/LEDGER.json` fields: `id`, `file`, `source` (path or Figma node URL), `tool` (`gemini-argon` | `figma` | `hand` ...), `prompt` (file path), `license`, `edited` (bool), `checked` (date).
  - Placeholders are not listed. Every M2/M3 key must exist before launch.
  - UI truth is Figma. UI tickets attach a side-by-side screenshot against the Figma frame (ART §0).

### CON-art-gating
- source: docs/ART.md §5; docs/ROADMAP.md (header, G1)
- type: protocol
- content:
  - The only M1 art need is A-101: style target 9:16, reference sheets for rifleman + NK infantry, one card mockup in Figma, and Figma OAuth for Claude Code.
  - M2 is graybox shapes. Mass art production happens only after G1 passes (M3 batch list in ART §5).

### CON-ai-disclosure
- source: docs/ART.md §6
- type: nfr
- content:
  - Basis: AI기본법 §31 (in force 2026-01-22), requiring generative-AI output labelling. Sub-regulations and fines are re-checked in R-101.
  - Implementation: one first-launch line "일부 그래픽은 생성형 AI로 제작되었습니다", Settings > Credits, and the ledger `tool` field.

---

## Platform launch requirements (G0 / M1, lane B)

### CON-g0-device-behaviour
- source: docs/ROADMAP.md §1 (G0); AGENTS.md (화면 원칙); docs/TECH.md §3, §6
- type: nfr
- content: On the user's real Android phone:
  1. Portrait lock
  2. Fullscreen + Safe Area (`?safe=1` capture)
  3. Back → exit-confirm modal
  4. Saved values persist across app restart
  5. Sound stops when backgrounded and resumes on return
