# Requirements (from PRD-class sources)

Primary source: docs/GDD.md v1.0 (precedence 2). GDD header: "모든 수치는 실험 가설이다". All numbers are experimental hypotheses. In code they live only in `src/data.ts` and `src/stages.ts`. Claude updates the GDD after G1. Milestone tags follow GDD/ROADMAP: M2 graybox core, M3 vertical slice, M4 launch, M5+ post-launch.

Lane hint: A = Claude Code core battle (`src/battle/`, `src/rules.ts`, `src/data.ts`, `src/stages.ts`, `tests/rules*`). B = Antigravity platform/UI. Per docs/ROADMAP.md §3 and docs/TECH.md §2.

Only one PRD is in the ingest set, so there are no competing acceptance variants.

---

## Core loop and win/lose

### REQ-run-loop
- source: docs/GDD.md §4
- milestone: M2 | lane: A (phase control in BattleScene), B (lobby/briefing/result screens)
- description: Run flow: lobby (생활관) → briefing (intro only on the first run) → [prep → fight → wave settle] × 10 → result (복귀 보고) → unlock → lobby. If guard-post HP hits 0: revive offer (ad), else result.
- acceptance:
  - Prep phase lasts 30 s on wave 1 and 20 s afterward. Pressing "출동!" starts the fight immediately and grants supply +1.
  - Prep actions: shop buy/reroll, drag between bench and deploy zone, merge, sell, plant mines.
  - The fight phase runs until all enemies die or reach the guard post. Allowed: drop a bench card onto an empty cell (merge included), 2x speed toggle, pause. Not allowed: shop, moving cards, selling.
  - Wave settle shows a 1.5 s presentation and applies supply income (§6) and the flag-wave bonus.
  - Phase is a single `phase` variable `'prep' | 'fight' | 'settle'` with `switch` (TECH §2.1).
  - Target run length is about 8 minutes (G1 gate accepts 6 to 10 minutes per run).

### REQ-wave-reset
- source: docs/GDD.md §4
- milestone: M2 | lane: A
- description: After each fight, all allies fully heal and downed allies stand back up in place (TFT-style reset).
- acceptance: The only permanent in-run losses are guard-post HP and spent last lines. An ally at HP 0 stays down for the rest of that wave only.

### REQ-defcon-phases
- source: docs/GDD.md §4.1, §12
- milestone: M2 rules / M3 presentation | lane: A
- description: Waves 1 to 6 are DEFCON 2 "화스트 페이스" (siren, one red border flash at wave start). Waves 7 to 10 are DEFCON 1 "칵트 피스톨" (radio "전 장병 실탄 지급", faster BGM).
- acceptance: DEFCON 1 applies ally attack interval ×0.8 and enemy spawn interval ×0.7. HUD `defcon: 2 | 1`.

### REQ-base-hp-and-last-line
- source: docs/GDD.md §4.2
- milestone: M2 | lane: A
- description: Guard post (위병소) HP is 20. Enemies reaching it deal per-enemy base damage (§5.6). Each column has one last line of defense: the first enemy to reach the post in that column triggers it, sweeping all enemies in that column with no HP loss. Spent columns are shown on screen. Clearing wave 10 is a win.
- acceptance: The last line is single-use per column. Spent state is visible. HP 0 triggers the revive offer (REQ-revive-ad) or the result screen.

### REQ-revive-ad
- source: docs/GDD.md §4.2, §10
- milestone: M4 (M2 modal without ad) | lane: B (ad, modal) + A (state restore)
- description: At HP 0, offer revive via rewarded ad, once per run.
- acceptance: Revive restores HP 10 and every column's last line. Reward only on full view (TECH §7). Uses `askRevive(onYes, onNo)` (TECH §8).

---

## Board and targeting

### REQ-board-layout
- source: docs/GDD.md §3; docs/TECH.md §3
- milestone: M2 | lane: A (canvas board), B (DOM HUD/shop)
- description: Logical 720×1280 portrait. Taller screens extend the background up and down to a maximum of 720×1560. Cell 128×128, 5 columns, 40 px side margins (5 × 128 = 640). Final confirmation at A-101.
- acceptance (y bands):
  - 0 to 96: HUD inside Safe Area
  - 96 to 352: enemy entry zone, 2 rows
  - 352 to 608: mine zone 5×2 (planting only in prep)
  - 608 to 992: deploy zone 5 columns × 3 rows
  - 992: 위병소 defense line, with base HP and per-column last-line markers
  - 1040 to 1160: bench slots 1 to 5
  - 1160 to 1280: shop/reroll, "출동!", 2x
  - The pause button is top-left. All UI stays inside the Safe Area.
  - Board coordinates live in a single `LAYOUT` constant in `data.ts` (TECH §3).

### REQ-lane-targeting
- source: docs/GDD.md §5.1
- milestone: M2 | lane: A
- description: Plants-vs-Zombies-style lane isolation with 1D per-column resolution.
- acceptance:
  - Allies see only enemies in their own column, and enemies see only allies in theirs. Exceptions: the dog's lane change and the cook's heal area.
  - Enemies walk top to bottom and stop to attack the frontmost (topmost) ally in their column.
  - Allies target the nearest (lowest) enemy within range in cells.
  - Projectiles hit only in their own column. Sniper rounds pierce.
  - No 2D collision system and no pathfinding (TECH §2.1).

### REQ-drag-and-place
- source: docs/GDD.md §8
- milestone: M2 | lane: A (canvas drag, TECH §8 note)
- description: Drag cards between bench and deploy zone. Mine tokens are dragged onto the mine zone.
- acceptance: Valid drop cells are highlighted while dragging. An invalid drop snaps to the nearest empty cell, or returns to origin if none exists. Dragging over a mergeable card makes its rank insignia glint. Bench, deploy zone, and mine tokens are canvas (lane A).

---

## Cards

### REQ-card-roster-m2
- source: docs/GDD.md §5.2
- milestone: M2 | lane: A (data.ts rows + per-type switch in units.ts)
- description: Five ally cards with stats at 이등병 rank. Each has a role no other card can replace ("없으면 생기는 일").
- acceptance (cost / HP / ATK / interval s / range cells / mechanic):
  - 소총수 (K2): 1 / 100 / 10 / 0.8 / 4. Single shot, baseline DPS.
  - 저격수 (K14): 3 / 70 / 60 / 2.5 / whole column. Pierces every enemy in the column, with damage reduced by 20% for each enemy further back. Counter to columns of enemies (종대).
  - 제설병 (송풍기): 2 / 120 / 0 / 1.5 / 2. Pushes every enemy in range in its column back up 1 cell and cancels their attack wind-up (Battle Cats-style knockback). Dogs are pushed ×1.5, bosses ×0.25. Counter to fast dogs.
  - 취사병: 2 / 90 / 0 / 2.0 / adjacent 8 cells. Heals adjacent allies by 12. At wave start, adjacent allies get max HP +20% ("짬밥"). Counter to RPG.
  - 지뢰설치병: 2 / 80 / 6 / 1.0 / 3. Receives mine tokens each prep (이등병 1, 일병 2, 상병 3, 병장 4). See REQ-mines. Counter to the boss.

### REQ-card-chem-m3
- source: docs/GDD.md §5.2, §5.3, §5.4, §12
- milestone: M3 | lane: A
- description: 화학병: 2 / 90 / 6 / 1.0 / 3. Decontaminates gas cells within the adjacent 8 cells every 3 s. Adjacent allies are immune to gas damage (gas mask). Counter to chemical shelling waves.
- acceptance: 상병: decon range 2 cells. 병장: adjacent ally attack +15%. Synergy at 2: gas decontaminated instantly when spawned.

### REQ-starting-recruit
- source: docs/GDD.md §2.1, §5.2
- milestone: M2 | lane: A (board), B (name input/save)
- description: At run start, one 소총수 named after the recruit (신병 {이름}) sits in the bottom cell of the center column of the deploy zone. Starting supply is 6.
- acceptance: The name is entered on first launch (default "김신병") and attached to the first rifleman card. See OPEN-Q in context.md about "첫 판" scope.

### REQ-rank-merge
- source: docs/GDD.md §5.3
- milestone: M2 | lane: A (rules.ts merge)
- description: Two cards of the same type and the same rank merge into one card of the next rank (이등병 → 일병 → 상병 → 병장). Merges happen by drag-overlap on the bench or the board.
- acceptance:
  - Each rank multiplies HP and attack by ×1.5 (one multiplier for all cards; ponytail note: split per card only if G1 shows imbalance). The rank insignia changes.
  - Cards needed: 일병 2, 상병 4, 병장 8.
  - Buying a card that immediately merges is allowed even when the bench is full (TFT exception).

### REQ-rank-abilities
- source: docs/GDD.md §5.3
- milestone: M2 (M3 for 화학병) | lane: A
- description: Unique abilities unlock from 상병.
- acceptance (상병 / 병장):
  - 소총수: 2-round burst / "말년" attack interval −20%
  - 저격수: no damage falloff on pierce / 1 s stun on first hit target
  - 제설병: 화염 송풍, pushed enemies burn for 8/s for 3 s / push 2 cells
  - 취사병: once per wave, raises 1 adjacent downed ally at 50% HP / heal range 2 cells
  - 지뢰설치병: mines become anti-tank (boss/armor damage ×3) / mine tokens +2
  - 화학병 (M3): decon range 2 cells / adjacent ally attack +15%

### REQ-role-synergy
- source: docs/GDD.md §1.1, §5.4
- milestone: M2 | lane: A (rules.ts synergy count), B (HUD icons)
- description: Synergy counts HEADCOUNT of a role on the deploy zone, regardless of rank. Merging makes a card stronger but lowers headcount, which can switch a synergy off. This "spread or merge" tension is the core prep decision.
- acceptance (2 / 4 headcount):
  - 소총수: rifleman attack interval −20% / −40%
  - 저격수: sniper damage +30% / none
  - 제설병: push distance +50% / range 3 cells
  - 취사병: heal targets expand to the whole deploy zone / none
  - 지뢰설치병: mine tokens +1 / none
  - 화학병 (M3): instant decon / none
  - Active synergies show on the HUD left as icon + headcount (`Hud.synergies` in TECH §8).

### REQ-mines
- source: docs/GDD.md §5.5
- milestone: M2 | lane: A
- description: Mines are placed before the wave.
- acceptance:
  - At prep start, mine tokens appear next to the bench, based on miner count and rank.
  - Drag tokens onto the mine zone (5×2), one mine per cell.
  - Planted mines are invisible to enemies and shown translucent to the player.
  - An enemy entering the cell detonates it: 150 damage to all enemies in that cell and 1 cell above and below.
  - Planted mines persist until triggered. Unused tokens vanish when the fight starts.

---

## Enemies and waves

### REQ-enemies-m2
- source: docs/GDD.md §5.6
- milestone: M2 | lane: A (enemies.ts per-type switch)
- acceptance (HP / speed cells/s / attack / guard-post damage / trait):
  - 보병 (88식 보총): 60 / 0.35 / 10 per 1 s / 1 / baseline
  - 군견 (생체개조): 40 / 0.9 / 6 per 0.5 s / 1 / on entering the deploy zone, shifts once to the adjacent column with the fewest allies (one sideways tween, TECH §2.1)
  - RPG병: 50 / 0.3 / 35 per 3 s to the same-column ally within 3 cells (area damage on that cell) / 2 / stops to fire once an ally is in range
  - 보스 장갑차: 1200 / 0.15 / 40 per 1 s to the blocking ally / 5 / on spawn, stuns same-column allies for 1.5 s (shockwave); knockback ×0.25
  - Enemy HP scales ×(1 + 0.12 × (wave − 1)).
  - On defeat, units fall and fade with equipment debris only.

### REQ-enemies-m3
- source: docs/GDD.md §5.6, §12
- milestone: M3 | lane: A
- acceptance: 화학탄 포격 creates a 2×2 gas area at a random spot in the deploy zone during the wave. Allies in gas get attack interval ×2 and take 5 damage/s. Gas lasts 20 s or until a 화학병 decontaminates it. 강화 군견: HP 80, knockback ×1.0.

### REQ-wave-table-stage1
- source: docs/GDD.md §5.7
- milestone: M2 | lane: A (stages.ts)
- acceptance:
  - W1: 보병 6 (tutorial dialogue)
  - W2: 보병 8, 군견 2
  - W3: 보병 8, RPG 2
  - W4: 보병 10, 군견 4
  - W5: 보병 10, 군견 3, RPG 2, 보스 1 (FLAG wave; warning "대규모 적 접근!")
  - W6: 보병 12, 군견 6, RPG 3, 종대 1 (5 infantry in one column at 0.5 s intervals; the sniper test)
  - W7: 보병 14, 군견 6, RPG 4 (DEFCON 1 starts)
  - W8: 보병 16, 군견 8, RPG 4
  - W9: 보병 18, 군견 8, RPG 6, 종대 2
  - W10: 보병 20, 군견 10, RPG 6, 보스 2 (FLAG wave)
  - Base spawn interval is 1.2 s. Columns are chosen by seeded RNG (`?seed=`).

---

## Economy

### REQ-economy
- source: docs/GDD.md §6
- milestone: M2 | lane: A (rules.ts interest/shop roll), B (shop UI)
- acceptance:
  - Starting supply 6. Base income per wave 5.
  - Interest at settle: +1 per 5 supply held, max +2.
  - Early start +1. Flag-wave clear +3.
  - Shop: 5 slots, reroll costs 1, uniform probability over unlocked cards, refreshed free at each prep start. ponytail: no cost-tier probability table until there are more than 10 cards.
  - Sell refunds the full invested cost (a merged card refunds the sum of its material costs).

---

## Meta progression and save

### REQ-meta-unlocks
- source: docs/GDD.md §7
- milestone: M2 (wave unlock) / M4 (ad unlock) | lane: A (unlock trigger), B (save, lobby)
- acceptance:
  - Unlock order: first run has 소총수, 제설병, 저격수; then 취사병, then 지뢰설치병, then 화학병 (M3).
  - Reaching wave 5 in a run unlocks the next card. Watching a 30 s ad also unlocks it immediately (user requirement: "유료 해금 = 광고 시청").
  - Local save holds unlocked list, best wave, run count, name, and settings (schema in TECH §5).

---

## Screens and feedback

### REQ-screens
- source: docs/GDD.md §8
- milestone: per row | lane: B (DOM), A (calls via TECH §8)
- acceptance:
  - First launch (M2, text): name input, fiction notice, generative-AI notice.
  - Lobby/생활관 (M2 minimal / M3 art): "출동" button, roster codex (locked/unlocked, ad-unlock button), best record, settings (BGM, SFX, haptics), credits.
  - Briefing (M3): 4-panel intro (text + siren + radio static). Skippable from the second run.
  - Battle HUD (M2): top-left pause, wave n/10, DEFCON indicator, supply, guard-post HP, active synergies, 2x, per-column last-line markers.
  - Shop panel (M2): rises from the bottom only during prep. 5 cards (name, cost, role icon), reroll, free reroll (ad), "출동!".
  - Card info (M2): long-press shows rank, stats, unique ability, synergy.
  - Result/복귀 보고 (M2): wave reached, kills, newly unlocked card, "다시 출동", "생활관".
  - Modals (M2 without ads / M4): pause (continue, settings, give up), exit confirm (Android back), revive offer (ad), ad-failure notice.

### REQ-intro-and-notices
- source: docs/GDD.md §2.1; AGENTS.md (콘텐츠 원칙); docs/ART.md §6
- milestone: M2 (one text line) / M3 (staged intro) | lane: B
- acceptance: Intro script per GDD §2.1. Bottom of the start screen: "이 게임은 허구이며 실제 인물·부대·사건과 관계없습니다." First launch: "일부 그래픽은 생성형 AI로 제작되었습니다", also listed under Settings > Credits.

### REQ-juice
- source: docs/GDD.md §9
- milestone: M2 shapes unless noted | lane: A (fx.ts), B (HUD glow, banners)
- acceptance:
  - Ally fire: muzzle flash and tracer.
  - Sniper: white line across the column plus a short shake.
  - Blower: wind wave, with enemies sliding upward.
  - Mine: explosion plus shake.
  - Merge: rank insignia zoom, "진급!" popup, and SFX.
  - Synergy on: HUD icon glows.
  - Flag wave: red warning banner plus siren.
  - DEFCON 1 entry (M3): border flash plus radio "칵트 피스톨".
  - Last line: full-column flash plus shake.
  - Hit: white flash, plus damage numbers (toggle in settings).

### REQ-fire-support-m3
- source: docs/GDD.md §12; docs/ROADMAP.md §1 (M3)
- milestone: M3 | lane: A + B
- description: A single "화력 지원" (fire support) button, based on K9A2/K10/K77. Three-role artillery chaining is M5+.
- acceptance: Not specified beyond existence. Needs design at M3.

---

## Monetization and analytics

### REQ-rewarded-ads
- source: docs/GDD.md §10; docs/TECH.md §7; AGENTS.md (화면 원칙)
- milestone: M4 | lane: B (ads.ts, platform.ts) + A (reward effects)
- acceptance:
  - Slots: `revive` (HP 10 + all last lines, once per run), `reroll` (one free shop reroll, 3 per run), `supply` (supply +5, once per run), `unlock` (unlock the next locked card, from the lobby).
  - Reward only on full view, and only once. Sound is muted during the ad.
  - No interstitials or banners. IAP (e.g., remove-ads) is considered after M5.

### REQ-analytics-m4
- source: docs/GDD.md §11
- milestone: M4 | lane: B
- acceptance (minimum event set):
  - `run_start` {run}
  - `wave_clear` {wave, base_hp, supply}
  - `run_end` {result win/lose/quit, wave, sec}
  - `card_buy` / `merge` {card, rank}
  - `ad_offer` / `ad_done` {slot}
  - `unlock` {card, via wave5/ad}

---

## Validation hypotheses (gate inputs)

### REQ-g1-fun-validation
- source: docs/GDD.md §1.2, §11; docs/ROADMAP.md §1 (G1)
- milestone: M2 exit (G1) | lane: A + user (P)
- acceptance: User plays 10 runs, plus 1 acquaintance with no military experience plays 3 runs. Answers "yes" to "the combination changed the outcome" and "one more run". Runs take 6 to 10 minutes. No card has a purchase rate under 5%. The non-military player reaches wave 5 in their first run. Claude reviews the diff. If G1 fails, no art goes in; only number/rule tuning tickets.
- note: The monthly ₩100k revenue figure is explicitly a hypothesis with no guarantee, estimated in the M4 closed test as ad views × eCPM.

---

## Out of scope for M2 to M4 (M5+ backlog, from GDD §5.6, §7, §12; ROADMAP §1)
- source: docs/GDD.md §5.6, §7, §12; docs/ROADMAP.md §1
- Artillery three roles (FDC, ammo carrier, gunner); tanks / M2020 boss; drones + anti-air (K30 비호, 천호); 특작부대; mortars
- Fictional unit-insignia codex (crit/range bonus); 유공 permanent upgrade currency and tree
- Stages 2 and 3 (철원 혹한, 장마); endless mode + leaderboard; iOS; IAP
- From the original requirements, explicitly dropped: shared pool, PvP, and items from the TFT reference (GDD §12)
