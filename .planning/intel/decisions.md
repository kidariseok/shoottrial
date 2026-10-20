# Decisions (from ADR-class sources)

Ingest set: 1 ADR-class doc. AGENTS.md is manifest precedence 1 and LOCKED. Every decision below is LOCKED: no lower-precedence source (GDD 2, TECH 3, ART 4, ROADMAP 5) may override it. Changing one requires the user (or Claude acting as planner) to edit AGENTS.md first.

Project: 《데프콘 2: 화스트 페이스》(가제), a Google Play (Capacitor Android) portrait card-defense game. Note: an older "출동! 5분대기조" Toss mini-app AGENTS.md is obsolete (archived pivot). Only the on-disk v1 file is authoritative.

---

## DEC-product-identity
- source: AGENTS.md (프로젝트 한 줄)
- status: locked
- scope: product definition
- decision: Portrait card defense for Google Play via Capacitor Android. On the first day at the unit, DEFCON 2 is declared and the guard post is breached. The player places role cards (소총수·저격수·제설병·취사병·지뢰설치병) on 5 lanes, merges identical cards to raise rank (짬), and defends against 10 waves. Serious fictional war drama with no blood.

## DEC-doc-hierarchy
- source: AGENTS.md (문서 위계)
- status: locked
- scope: conflict resolution between project docs
- decision: AGENTS.md > docs/GDD.md (what) > docs/TECH.md (how: structure, lane boundaries, bans, platform facts) > docs/ART.md (art spec, asset contract) > docs/tickets/<ID>.md > docs/references/ (background material, not rules). If docs conflict, or a ticket differs from GDD/TECH, do not pick. Write it in the ticket's `## 질문` and stop.

## DEC-ticket-worktree-flow
- source: AGENTS.md (공용 컴퓨터 + Orca 병렬 작업; 절대 규칙 1, 8, 10)
- status: locked
- scope: workflow
- decision: 1 ticket = 1 conversation = 1 Orca worktree (branch). Start with `/start-ticket <ID>` and end with `/finish-ticket`. Hooks autosave: they commit and push to the CURRENT branch at every turn end and every 5 minutes (`node scripts/harness/autosave.mjs` for a manual save). Work reaches main only through the PR that `/finish-ticket` creates. The ticket `## 진행 기록` is the only durable memory and records the branch name. Agents never run `git push`, `git reset --hard`, or `rm -rf` directly.

## DEC-owned-paths-only
- source: AGENTS.md (절대 규칙 2)
- status: locked
- scope: file modification
- decision: Modify only the ticket's `## 소유 경로`. The Stop hook blocks session end otherwise. If an out-of-path edit is truly needed, write the reason in `## 질문` and stop.

## DEC-read-only-docs
- source: AGENTS.md (절대 규칙 3)
- status: locked
- scope: file modification
- decision: Read-only for implementers: AGENTS.md, docs/GDD.md, docs/TECH.md, docs/ART.md, docs/ROADMAP.md, docs/SETUP.md, docs/references/, docs/agents/, docs/_archive/, .agents/, scripts/harness/. Only planning (Claude) and the user edit them.

## DEC-dependency-allowlist
- source: AGENTS.md (절대 규칙 4)
- status: locked
- scope: dependencies
- decision: No new dependencies. Install only packages listed in the ticket's `## 허용 의존성`. The Stop hook checks package.json dependency changes.

## DEC-platform-api-verification
- source: AGENTS.md (절대 규칙 5, 6)
- status: locked
- scope: platform code
- decision: Use platform APIs (Capacitor plugins, AdMob, Google Play requirements) only after verifying them in docs/research/play-launch.md (R-101) or official docs. Names remembered or copied from examples are hypotheses. Capacitor plugins (`@capacitor/*`, AdMob) are imported only in `src/platform.ts`.

## DEC-lane-a-protection
- source: AGENTS.md (절대 규칙 7)
- status: locked
- scope: lane boundary
- decision: Only Claude Code edits lane A files (`src/battle/`, `src/rules.ts`, `src/data.ts`, `src/stages.ts`). Lane B must not change the `ui/screens.ts` function signatures defined in docs/TECH.md §8.

## DEC-verification-honesty
- source: AGENTS.md (절대 규칙 9, 11)
- status: locked
- scope: reporting
- decision: Never claim verification that was not run. Attach the `npm run verify` result and screenshot paths to the result report. If the same error occurs after 2 attempts, run `/stuck` and stop. Do not try the same method a third time.

## DEC-ponytail-code
- source: AGENTS.md (코드 원칙)
- status: locked
- scope: all code
- decision: Write the shortest working code. Before writing, check: (1) does it already exist in the repo, (2) do Phaser, the browser, or Capacitor provide it, (3) can it be one line. Banned: React, Vue, and state-management libraries; ECS and component class hierarchies; `*Manager`/`*Service` classes; custom object pools (use Phaser Group); custom state machine classes (use a `phase` variable plus `switch`); interfaces with only one implementation; config or abstractions "for later". All numbers (attack, cooldown, cost, wave composition) live only in `src/data.ts` and `src/stages.ts`. Pure calculations live in `src/rules.ts` and are tested in `tests/`. Screens and physics are not unit-tested; they are proven with debug URLs and screenshots. Intentional simplifications get `// ponytail: <한계>, <확장 조건>`. Comments and UI text are in Korean.

## DEC-content-policy
- source: AGENTS.md (콘텐츠 원칙)
- status: locked
- scope: content and art
- decision: Tone is a serious fictional war drama. Military-life details (짬, 화스트 페이스, 짬밥) are seasoning only. No mockery of the military, no hazing, and no verbal abuse played for laughs. No blood, corpses, or depictions of pain: units fall and fade, with only debris and smoke. Real ROK equipment designations (K2, K14, etc.) are used. Manufacturer logos and trademarks, and real unit insignia, are not used (units are fictional). The enemy is explicitly the North Korean army, but with no real political leaders, no flag desecration or mockery, no idolization imagery, and no real shoulder-insignia originals (GDD §2.3). Military information stays at public-source level: operation plans, maneuver routes, fire-direction procedures, coordinates, and frequencies are neither researched nor reproduced. Do not copy art, names, or UI from reference games (Clash Royale, Plants vs Zombies, TFT/롤토체스, Battle Cats/냥코, Clash of Clans); borrow mechanics only. Show a "this game is fiction" notice and a generative-AI notice on screen.

## DEC-screen-rules
- source: AGENTS.md (화면 원칙)
- status: locked
- scope: presentation and platform
- decision: Portrait-locked, logical 720×1280 (TECH §3). The status bar/notch and the bottom navigation bar are outside the Safe Area. All UI stays inside the Safe Area. The pause button is top-left. The Android back button opens a confirmation modal and never exits immediately. Sound mutes immediately when the app is backgrounded or an ad plays, and resumes on return. Ads are rewarded only: no interstitials, no banners.

## DEC-debug-urls
- source: AGENTS.md (디버그 URL)
- status: locked
- scope: dev tooling
- decision: The dev server (`npm run dev`) supports scenario URLs. The full list is in TECH §9. Common ones: `?scene=battle`, `?scene=gallery`, `?wave=5&unlock=all&supply=99`, `?seed=42`, `?safe=1`. Every new feature adds a debug parameter and records it in the ticket.

## DEC-roles
- source: AGENTS.md (역할)
- status: locked
- scope: who does what
- decision: (GSD phases) lane A core battle = Claude Code (Opus 5.5 design / Sonnet 5.5 implementation). H harness/tools/scaffold = Antigravity (Gemini 4 Argon High). T lane B platform/UI = Antigravity Argon High (Flash for simple work; Sonnet 5.5 after 2 failures). R research = Antigravity Flash, writing exactly one file `docs/research/<주제>.md` (role card docs/agents/antigravity-research.md). A art/audio originals = user + Gemini Argon image + Figma. C dialogue/copy = ChatGPT draft, then Claude cleanup. U admin = user. P playtest = user. G gate review and next-ticket issuance = Claude Code.
