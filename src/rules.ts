// 순수 계산. phaser·DOM·debug를 import하지 않는다(vitest가 node에서 돌린다). 수치는 data.ts에서만 읽는다.
import {
  ABILITY,
  ART,
  BATTLE,
  CARDS,
  CARD_KEYS,
  ECONOMY,
  ENEMIES,
  GAS,
  GRID,
  LAYOUT,
  LOG,
  MINES,
  RANKS,
  SYNERGY,
  SYN_FX,
  UNLOCK,
  type CardKey,
  type EnemyType,
} from './data'
import { STAGE1, WAVES } from './stages'

export type Unit = { card: CardKey; rank: number }
export type Cell = { x: number; y: number; free: boolean }
export type Outcome = 'move' | 'merge' | 'swap'

// 계급을 1..max로 고정한다
const clampRank = (rank: number) => Math.min(RANKS.max, Math.max(1, rank))

// 같은 카드·같은 계급·병장 미만이면 새 계급, 아니면 null
export function merge(a: Unit, b: Unit): number | null {
  return a.card === b.card && a.rank === b.rank && a.rank < RANKS.max ? a.rank + 1 : null
}

// 이등병 수치 x 1.5^(계급-1). 반올림하지 않는다
export function stats(card: CardKey, rank: number): { hp: number; atk: number } {
  const m = RANKS.mult ** (clampRank(rank) - 1)
  return { hp: CARDS[card].hp * m, atk: CARDS[card].atk * m }
}

// 켜진 시너지 단계 수
export function synergyTier(card: CardKey, count: number): number {
  return SYNERGY[card].filter((n) => count >= n).length
}

// 배치 구역 인원 수(계급 무관)로 보직별 시너지 집계. 1명 이상인 보직만
export function synergies(boardCards: CardKey[]): { card: CardKey; count: number; on: boolean }[] {
  return CARD_KEYS.map((card) => ({ card, count: boardCards.filter((c) => c === card).length }))
    .filter((s) => s.count > 0)
    .map((s) => ({ ...s, on: synergyTier(s.card, s.count) > 0 }))
}

// 준비 단계 수입
export function income({ supply, flag, early }: { supply: number; flag: boolean; early: boolean }): number {
  const interest = Math.min(ECONOMY.interestMax, Math.floor(supply / ECONOMY.interestStep))
  return ECONOMY.baseIncome + interest + (flag ? ECONOMY.flagBonus : 0) + (early ? ECONOMY.earlyBonus : 0)
}

export function waveHp(baseHp: number, wave: number): number {
  return baseHp * (1 + ECONOMY.waveHpGrowth * (wave - 1))
}

// rand를 칸 순서대로 한 번씩 부른다(시드 재현)
export function rollShop(unlocked: CardKey[], rand: () => number): CardKey[] {
  if (unlocked.length === 0) return []
  return Array.from({ length: ECONOMY.shopSize }, () => unlocked[Math.floor(rand() * unlocked.length)] as CardKey)
}

export function sellValue(card: CardKey, rank: number): number {
  return CARDS[card].cost * (RANKS.copies[clampRank(rank) - 1] ?? 1)
}

// 놓은 점에서 가장 가까운 빈 칸의 인덱스. 거리가 같으면 앞 인덱스
export function nearestEmpty(cells: Cell[], x: number, y: number): number | null {
  let best: number | null = null
  let bestD = Infinity
  cells.forEach((c, i) => {
    const d = (c.x - x) ** 2 + (c.y - y) ** 2
    if (c.free && d < bestD) {
      best = i
      bestD = d
    }
  })
  return best
}

export function dropOutcome(dragged: Unit, target: Unit | null): Outcome {
  if (!target) return 'move'
  return merge(dragged, target) !== null ? 'merge' : 'swap'
}

export type SpawnEvent = { t: number; col: number; type: EnemyType }

// 웨이브 출현 계획. wave는 1부터. rand 호출 순서(섞기 -> 항목별 열)가 곧 시드 재현성이다
export function spawnPlan(wave: number, rand: () => number, defcon1: boolean): SpawnEvent[] {
  const def = WAVES[wave - 1]
  if (!def) return []
  // (1) 단발 목록: 보병, 군견, 강화 군견, RPG병 순으로 이어 붙인다
  const singles: EnemyType[] = [
    ...Array<EnemyType>(def.infantry).fill('infantry'),
    ...Array<EnemyType>(def.dog).fill('dog'),
    ...Array<EnemyType>(def.dogPlus).fill('dogPlus'),
    ...Array<EnemyType>(def.rpg).fill('rpg'),
  ]
  // (2) Fisher-Yates로 섞는다
  for (let i = singles.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = singles[i] as EnemyType
    singles[i] = singles[j] as EnemyType
    singles[j] = tmp
  }
  // (3) 종대·보스를 단발 사이에 끼운다(같은 자리에서는 종대가 먼저)
  const n = singles.length
  const slot = (total: number, k: number) => Math.floor((n * k) / (total + 1))
  const items: { type: EnemyType; convoy: boolean }[] = []
  for (let i = 0; i <= n; i++) {
    for (let k = 1; k <= def.convoys; k++) if (slot(def.convoys, k) === i) items.push({ type: 'infantry', convoy: true })
    for (let k = 1; k <= def.boss; k++) if (slot(def.boss, k) === i) items.push({ type: 'boss', convoy: false })
    if (i < n) items.push({ type: singles[i] as EnemyType, convoy: false })
  }
  // (4) 항목마다 열을 한 번 뽑고(종대는 전체가 한 열), (5) 시각을 gap 간격으로 놓는다
  const gap = STAGE1.spawnGap * (defcon1 ? BATTLE.defcon1SpawnGap : 1)
  const out: SpawnEvent[] = []
  let t = 0
  for (const it of items) {
    const col = Math.floor(rand() * LAYOUT.cols)
    if (it.convoy) {
      for (let m = 0; m < STAGE1.convoySize; m++) out.push({ t: t + m * STAGE1.convoyGap, col, type: it.type })
      t += (STAGE1.convoySize - 1) * STAGE1.convoyGap + gap
    } else {
      out.push({ t, col, type: it.type })
      t += gap
    }
  }
  return out
}

// board.ts(phaser)를 import할 수 없어 여기서 정의한다. board.ts의 Zone과 같은 모양이다
export type FlowPhase = 'prep' | 'fight' | 'settle'
export type ZoneName = 'deploy' | 'bench' | 'sell'

// 데프콘 1은 웨이브 defcon1From부터(GDD §4.1)
export function defconOf(wave: number): 1 | 2 {
  return wave >= BATTLE.defcon1From ? 1 : 2
}

// 드래그 시작 허용: 준비는 모두, 전투는 대기석만, 정산은 없음
export function canDrag(phase: FlowPhase, from: ZoneName): boolean {
  return phase === 'prep' || (phase === 'fight' && from === 'bench')
}

// 놓기 허용: 전투 중에는 대기석 -> 배치 구역의 빈 칸 투입(move)과 합성(merge)만
export function dropAllowed(phase: FlowPhase, from: ZoneName, to: ZoneName, outcome: Outcome): boolean {
  if (phase === 'prep') return true
  return phase === 'fight' && from === 'bench' && to === 'deploy' && outcome !== 'swap'
}

// 배치 행 중심 y(칸 단위)
export function allyY(row: number): number {
  return GRID.deployTop + row + 0.5
}

// 그 행 아군이 맨 앞일 때 적 중심이 멈추는 y(행 위쪽 경계 blockGap 앞)
export function blockY(row: number): number {
  return GRID.deployTop + row - BATTLE.blockGap
}

// 같은 열에서 살아 있는 가장 위(행 번호 가장 작은) 아군
export function frontAlly<T extends { col: number; row: number; alive: boolean }>(allies: T[], col: number): T | null {
  let best: T | null = null
  for (const a of allies) if (a.alive && a.col === col && (!best || a.row < best.row)) best = a
  return best
}

// 적이 아군과 같거나 위에 있고 거리가 사거리 이내(Infinity면 위쪽 전부)
export function inRange(allyY: number, enemyY: number, range: number): boolean {
  return enemyY <= allyY && allyY - enemyY <= range
}

// 열·행 차이 중 큰 쪽이 범위 이내(인접 8칸 = 1)
export function withinReach(dc: number, dr: number, reach: number): boolean {
  return Math.max(Math.abs(dc), Math.abs(dr)) <= reach
}

// GDD §5.2·§5.3·§5.4·§4.1·§5.6. 공격 간격 = 기본 x (소총수만 병장·시너지) x 데프콘 1 x (가스 위면 slow). 곱으로 겹친다
export function interval(card: CardKey, rank: number, synergyCount: number, defcon1: boolean, gassed = false): number {
  let v = CARDS[card].interval
  if (card === 'rifle') {
    if (rank >= ABILITY.sergeant) v *= ABILITY.sergeantRifleInterval
    v *= SYN_FX.rifleInterval[synergyTier(card, synergyCount)] ?? 1
  }
  if (defcon1) v *= BATTLE.defcon1AllyInterval
  return gassed ? v * GAS.slow : v
}

// GDD §5.3·§5.4. atk = stats().atk. k는 관통 순서(0부터). 상병 이상은 감소 없음, 시너지 단계로 배율
export function sniperDamage(atk: number, k: number, rank: number, tier = 0): number {
  const fall = rank >= ABILITY.corporal ? 1 : Math.max(0, 1 - ABILITY.sniperFalloff * k)
  return atk * fall * (SYN_FX.sniperDamage[tier] ?? 1)
}

// GDD §5.3·§5.4·§5.6. 밀어내기 칸 수 = (병장이면 큰 값) x 적 배율 x 시너지 배율
export function knockback(enemy: EnemyType, rank: number, blowerCount: number): number {
  const base = rank >= ABILITY.sergeant ? ABILITY.knockSergeant : ABILITY.knockBase
  return base * ENEMIES[enemy].knock * (SYN_FX.blowerKnock[synergyTier('blower', blowerCount)] ?? 1)
}

// GDD §5.4. 제설병 사거리(칸) = 기본 + 시너지 가산
export function blowerRange(blowerCount: number): number {
  return CARDS.blower.range + (SYN_FX.blowerRange[synergyTier('blower', blowerCount)] ?? 0)
}

// GDD §5.3·§5.4. 취사병 회복 범위. 시너지면 배치 구역 전원(Infinity)
export function cookReach(rank: number, cookCount: number): number {
  if (synergyTier('cook', cookCount) >= 1) return Infinity
  return rank >= ABILITY.sergeant ? ABILITY.cookReachSergeant : CARDS.cook.range
}

// GDD §5.3·§5.4·§5.5. 지뢰 토큰 합 = Σ(계급 수 + 병장 보너스) + 시너지 보너스(전체에 한 번)
export function mineTokens(miners: { rank: number }[]): number {
  const sum = miners.reduce(
    (s, m) => s + (MINES.tokensByRank[clampRank(m.rank) - 1] ?? 0) + (m.rank >= ABILITY.sergeant ? MINES.sergeantBonus : 0),
    0,
  )
  return sum + (synergyTier('miner', miners.length) >= 1 ? MINES.synergyBonus : 0)
}

// GDD §5.3. 상병 이상 지뢰설치병이 한 명이라도 있으면 그 준비 단계의 지뢰는 전부 대전차
export function hasAntiTank(miners: { rank: number }[]): boolean {
  return miners.some((m) => m.rank >= ABILITY.corporal)
}

// GDD §5.6. 군견 열 변경: 양옆 열 중 아군이 적은 열. 같을 때만 rand를 정확히 한 번 부른다(시드 재현)
// 후보가 하나뿐이거나 아군 수가 다르면 rand를 부르지 않는다. 후보가 없으면 자기 열
export function pickDogLane(col: number, alliesPerCol: number[], rand: () => number): number {
  const cands = [col - 1, col + 1].filter((c) => c >= 0 && c < alliesPerCol.length)
  const [a, b] = cands
  if (a === undefined) return col
  if (b === undefined) return a
  const na = alliesPerCol[a] as number
  const nb = alliesPerCol[b] as number
  if (na !== nb) return na < nb ? a : b
  return rand() < 0.5 ? a : b
}

// GDD §5.5. 적 중심이 지뢰 칸 윗변에 닿으면 터진다(mineRow는 지뢰 구역 안 행)
export function mineTriggered(enemyY: number, mineRow: number): boolean {
  return enemyY >= GRID.mineTop + mineRow
}

// GDD §5.5. 폭발 범위 = 그 칸 + 위아래 blast칸(같은 열)
export function inBlast(enemyY: number, mineRow: number): boolean {
  const top = GRID.mineTop + mineRow
  return enemyY >= top - MINES.blast && enemyY < top + 1 + MINES.blast
}

// GDD §5.5. 폭발 피해. 대전차는 보스에게 bossMult배
export function mineDamage(enemy: EnemyType, anti: boolean): number {
  return MINES.damage * (anti && enemy === 'boss' ? MINES.bossMult : 1)
}

// ---- 4단계: 화학전 ----

export type GasDrop = { t: number; col: number; row: number } // col·row는 2x2 왼쪽 위 칸(배치 구역 기준)
export type Chem = { col: number; row: number; rank: number } // 살아 있는 화학병만 넣는다(쓰러진 화학병 = 입력에서 빠짐)

// 배치 구역 크기의 가스 남은 시간 표(행 x 열). 0이면 가스 없음
export function emptyGas(): number[][] {
  return Array.from({ length: LAYOUT.deployRows }, () => Array<number>(LAYOUT.cols).fill(0))
}

// GDD §5.6. 화학탄 일정. 마지막 출현 시각 T의 GAS.at 지점(횟수가 많으면 순환)에 떨어진다
// rand는 화학탄마다 col -> row 순으로 정확히 두 번 부른다. extra는 ?gas=1 디버그용 추가 횟수
export function gasPlan(wave: number, plan: SpawnEvent[], rand: () => number, extra = 0): GasDrop[] {
  const def = WAVES[wave - 1]
  if (!def) return []
  const last = plan.reduce((m, e) => Math.max(m, e.t), 0)
  return Array.from({ length: def.gas + extra }, (_, i) => ({
    t: last * (GAS.at[i % GAS.at.length] as number),
    col: Math.floor(rand() * (LAYOUT.cols - GAS.size + 1)),
    row: Math.floor(rand() * (LAYOUT.deployRows - GAS.size + 1)),
  })).sort((a, b) => a.t - b.t)
}

// GDD §5.3. 화학병 범위(칸): 상병 이상은 넓다
export function chemReach(rank: number): number {
  return GAS.reach[rank >= ABILITY.corporal ? 1 : 0] as number
}

// 어느 화학병이든 범위 안(자기 칸 포함)이면 가스 면역
export function inChemReach(chems: Chem[], col: number, row: number): boolean {
  return chems.some((c) => withinReach(col - c.col, row - c.row, chemReach(c.rank)))
}

// 가스 피해·감속을 받는 칸인가: 가스가 있고 면역이 아니다
export function gasHits(cells: number[][], chems: Chem[], col: number, row: number): boolean {
  return (cells[row]?.[col] ?? 0) > 0 && !inChemReach(chems, col, row)
}

// GDD §5.4. 화학탄이 떨어진 결과. 겹치면 더하지 않고 life로 갱신, 시너지 2명이면 범위 안 칸은 즉시 제독(cleared)
export function gasCellsAfterDrop(
  cells: number[][],
  drop: { col: number; row: number },
  chems: Chem[],
  synergyOn: boolean,
): { cells: number[][]; cleared: number } {
  const out = cells.map((r) => [...r])
  let cleared = 0
  for (let r = drop.row; r < drop.row + GAS.size; r++) {
    for (let c = drop.col; c < drop.col + GAS.size; c++) {
      const row = out[r]
      if (!row || row[c] === undefined) continue
      if (synergyOn && inChemReach(chems, c, r)) cleared++
      else row[c] = GAS.life
    }
  }
  return { cells: out, cleared }
}

// 화학병 한 명의 주기 제독. 범위 안 칸을 0으로, n은 지운 가스 칸 수
export function cleanseCells(cells: number[][], chem: Chem): { cells: number[][]; n: number } {
  let n = 0
  const out = cells.map((row, r) =>
    row.map((v, c) => {
      if (!withinReach(c - chem.col, r - chem.row, chemReach(chem.rank))) return v
      if (v > 0) n++
      return 0
    }),
  )
  return { cells: out, n }
}

// GDD §5.3. 병장 화학병 인접(GAS.reach[0], 자기 제외) 아군의 직접 공격 피해 배율. 병장이 여럿이어도 한 번만
export function chemDamageMult(chems: Chem[], col: number, row: number): number {
  const near = chems.some(
    (c) => c.rank >= ABILITY.sergeant && !(c.col === col && c.row === row) && withinReach(col - c.col, row - c.row, GAS.reach[0] as number),
  )
  return near ? GAS.sgtBuff : 1
}

// ---- 3단계: 구매 판정·해금 ----

export type Spot = { zone: 'bench' | 'deploy'; i: number }
export type Placed = Spot & { unit: Unit }
// remove가 있으면 promote 칸이 살아남아 계급이 오르고 remove 칸은 치워진다
export type BuyStep = { promote: Spot; remove?: Spot }
export type BuyOutcome = { kind: 'poor' } | { kind: 'bench' } | { kind: 'merge'; steps: BuyStep[] } | { kind: 'full' }

const spotOf = ({ zone, i }: Placed): Spot => ({ zone, i })

// 구매 판정. units는 대기석 먼저 번호 순, 그다음 배치 구역 번호 순. 입력은 바꾸지 않는다
export function buyOutcome(card: CardKey, supply: number, benchOpen: boolean, units: Placed[]): BuyOutcome {
  if (supply < CARDS[card].cost) return { kind: 'poor' }
  if (benchOpen) return { kind: 'bench' }
  // 시뮬레이션용 복사본. 새로 산 카드는 합성 재료로만 쓰이고 칸을 차지하지 않는다
  const work = units.map((p) => ({ ...p, unit: { ...p.unit } }))
  let cur = work.find((p) => p.unit.card === card && p.unit.rank === 1)
  if (!cur) return { kind: 'full' }
  cur.unit.rank = 2
  const steps: BuyStep[] = [{ promote: spotOf(cur) }]
  // 연쇄: 새 계급과 같은 계급의 같은 카드가 또 있으면 합쳐 한 계급 더 오른다(병장에서 멈춤)
  while (cur.unit.rank < RANKS.max) {
    const c: Placed = cur
    const other = work.find((p) => p !== c && p.unit.card === card && p.unit.rank === c.unit.rank)
    if (!other) break
    // 살아남는 칸 = 배치 구역 우선, 같은 구역이면 번호가 작은 쪽
    const keep = c.zone !== other.zone ? (c.zone === 'deploy' ? c : other) : c.i < other.i ? c : other
    const drop = keep === c ? other : c
    work.splice(work.indexOf(drop), 1)
    keep.unit.rank += 1
    steps.push({ promote: spotOf(keep), remove: spotOf(drop) })
    cur = keep
  }
  return { kind: 'merge', steps }
}

// 해금 순서의 다음 잠긴 카드
export function nextUnlock(unlocked: readonly CardKey[]): CardKey | null {
  return UNLOCK.order.find((c) => !unlocked.includes(c)) ?? null
}

// 저장 문자열 -> 해금 목록. 깨져 있으면 기본만. 결과는 항상 CARD_KEYS 순서
export function parseUnlocked(raw: string | null): CardKey[] {
  let saved: unknown = []
  try {
    saved = JSON.parse(raw ?? '[]')
  } catch {
    // 깨진 저장값은 기본 해금으로
  }
  const list = Array.isArray(saved) ? saved : []
  return CARD_KEYS.filter((c) => UNLOCK.base.includes(c) || list.includes(c))
}

// save.unlocked + 예전 d2_unlocked(처음 한 번 옮길 값) -> 해금 목록. 기본 포함, 모르는 id는 버리고 CARD_KEYS 순서
export function mergeUnlocked(saveList: readonly string[], legacyRaw: string | null): CardKey[] {
  const legacy = parseUnlocked(legacyRaw)
  return CARD_KEYS.filter((c) => legacy.includes(c) || saveList.includes(c))
}

// 판이 끝난 뒤의 최고 웨이브·판 수
export function afterRun(prev: { bestWave: number; runs: number }, wave: number): { bestWave: number; runs: number } {
  return { bestWave: Math.max(prev.bestWave, wave), runs: prev.runs + 1 }
}

// ---- 5단계: 화력 지원 ----

// x(월드·논리 좌표) -> 열 0~4. 판 밖(왼쪽 여백·오른쪽 끝 너머)은 -1. 열 경계 x는 오른쪽 열
export function colAt(x: number): number {
  const c = Math.floor((x - LAYOUT.marginX) / LAYOUT.cell)
  return c >= 0 && c < LAYOUT.cols ? c : -1
}

// ---- 3단계: 판 기록 ----

export type RunResult = 'win' | 'lose' | 'quit'
export type LogEvent =
  | { e: 'run_start'; run: number }
  | { e: 'wave_clear'; wave: number; base_hp: number; supply: number }
  | { e: 'run_end'; result: RunResult; wave: number; sec: number }
  | { e: 'card_buy'; card: CardKey; rank: number }
  | { e: 'merge'; card: CardKey; rank: number }
  | { e: 'unlock'; card: CardKey; via: 'wave5' | 'ad' }
  | { e: 'gas_drop'; wave: number; col: number; row: number }
  | { e: 'gas_clear'; n: number }
  | { e: 'fire_support'; wave: number; col: number; kills: number }
export type PlayRun = { t: number; result: RunResult; wave: number; sec: number; events: LogEvent[] }
export type LogSummary = {
  runs: number
  winRate: number
  avgSec: number
  avgWave: number
  supportAvg: number // 판당 평균 화력 지원 횟수
  buys: number
  cards: { card: CardKey; buys: number; rate: number; low: boolean }[] // CARD_KEYS 순서, 구매 0인 카드도 포함
  recent: PlayRun[] // 최신이 앞, 최대 LOG.recent판
}

// runs는 오래된 판이 앞. 평균은 반올림하지 않는다(표시 단계에서 포맷)
export function summarizeLog(runs: PlayRun[]): LogSummary {
  const n = runs.length
  const avg = (f: (r: PlayRun) => number) => (n === 0 ? 0 : runs.reduce((a, r) => a + f(r), 0) / n)
  const counts = new Map<CardKey, number>()
  for (const r of runs) for (const ev of r.events) if (ev.e === 'card_buy') counts.set(ev.card, (counts.get(ev.card) ?? 0) + 1)
  const buys = [...counts.values()].reduce((a, c) => a + c, 0)
  return {
    runs: n,
    winRate: avg((r) => (r.result === 'win' ? 1 : 0)),
    avgSec: avg((r) => r.sec),
    avgWave: avg((r) => r.wave),
    supportAvg: avg((r) => r.events.filter((ev) => ev.e === 'fire_support').length),
    buys,
    cards: CARD_KEYS.map((card) => {
      const b = counts.get(card) ?? 0
      const rate = buys === 0 ? 0 : b / buys
      return { card, buys: b, rate, low: buys > 0 && rate < LOG.lowRate }
    }),
    recent: runs.slice(-LOG.recent).reverse(),
  }
}

// 새 배열을 돌려준다. 최근 LOG.maxRuns판만 남긴다
export function pushRun(runs: PlayRun[], run: PlayRun): PlayRun[] {
  return [...runs, run].slice(-LOG.maxRuns)
}

const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v)
const isRun = (v: any): v is PlayRun =>
  !!v && ['win', 'lose', 'quit'].includes(v.result) && isNum(v.wave) && isNum(v.sec) && isNum(v.t) && Array.isArray(v.events)

// 저장 문자열 -> 판 기록. 깨진 항목은 버리고 나머지는 살린다. throw하지 않는다
export function parsePlayLog(raw: string | null): PlayRun[] {
  let saved: unknown = []
  try {
    saved = JSON.parse(raw ?? '[]')
  } catch {
    // 깨진 저장값은 빈 기록으로
  }
  return (Array.isArray(saved) ? saved.filter(isRun) : []).slice(-LOG.maxRuns)
}

// 다음 판 번호. 마지막 판의 run_start + 1, 없으면 판 수 + 1
export function nextRun(runs: PlayRun[]): number {
  const start = runs.at(-1)?.events.find((ev) => ev.e === 'run_start')
  return start?.e === 'run_start' ? start.run + 1 : runs.length + 1
}

// 그림 이미지 너비 / 계약 프레임 너비. 배수가 아니거나 0 이하면 0
export function frameCount(imgW: number, contractW: number): number {
  return imgW > 0 && contractW > 0 && imgW % contractW === 0 ? imgW / contractW : 0
}

// 그림 키 이름. 적은 state가 'move'(걷기·달리기) 또는 'act'(공격·물기·발사), 아군은 idle·attack, 보스는 hull·turret
export function artKey(kind: 'ally' | 'enemy' | 'boss', who: string, state: string): string {
  if (kind === 'enemy') {
    const e = ART.enemy[who as keyof typeof ART.enemy]
    return `enemy_${e.id}_${state === 'act' ? e.act : e.move}`
  }
  return `${kind}_${who}_${state}`
}

// 반복 재생하는 애니메이션 키(대기·걷기·달리기·가스). 나머지는 1회
export function artLoops(key: string): boolean {
  return ART.loopKeys.includes(key) || ART.loopSuffix.some((s) => key.endsWith(s))
}
