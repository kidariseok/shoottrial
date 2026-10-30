// 순수 계산. phaser·DOM·debug를 import하지 않는다(vitest가 node에서 돌린다). 수치는 data.ts에서만 읽는다.
import {
  ABILITY,
  ART,
  BATTLE,
  CARDS,
  CARD_KEYS,
  COMBAT,
  ECONOMY,
  ENEMIES,
  ENEMY_COMBAT,
  GAS,
  GRID,
  LAYOUT,
  LOG,
  MINES,
  NEW_CARDS,
  SUPPORT,
  RANKS,
  SYNERGY,
  SPECIALTIES,
  SPECIALTY_RULES,
  type Specialty,
  SYN_FX,
  UNLOCK,
  UI,
  type CardKey,
  type EnemyType,
} from './data'
import { STAGE1, WAVES } from './stages'

export type Unit = { card: CardKey; rank: number; spec?: Specialty }
export type Cell = { x: number; y: number; free: boolean }
export type Outcome = 'move' | 'merge' | 'swap'

// 계급을 1..max로 고정한다
const clampRank = (rank: number) => Math.min(RANKS.max, Math.max(1, rank))

// 같은 카드·같은 계급·병장 미만이면 새 계급, 아니면 null
export function merge(a: Unit, b: Unit): number | null {
  return a.card === b.card && a.rank === b.rank && a.rank < RANKS.max ? a.rank + 1 : null
}

// 이등병 수치 x 1.5^(계급-1). 반올림하지 않는다
export function stats(card: CardKey, rank: number, spec?: Specialty): { hp: number; atk: number } {
  const m = RANKS.mult ** (clampRank(rank) - 1)
  return { hp: CARDS[card].hp * m * (card === 'blower' && spec === 'A' ? SPECIALTIES.blower.A.hp : 1), atk: CARDS[card].atk * m }
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
    ...Array<EnemyType>(def.assault).fill('assault'),
    ...Array<EnemyType>(def.shield).fill('shield'),
    ...Array<EnemyType>(def.marksman).fill('marksman'),
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

// ---- 7단계: 전투 2.0 (사거리 안 모든 방향) ----

// 칸 좌표. col은 열, y는 칸 단위 중심(아군은 allyY(row), 적은 e.y)
export type Pos = { col: number; y: number }
type Foe = Pos & { hp: number; gone?: boolean }
type Friend = Pos & { alive: boolean; taunt?: boolean; tauntReach?: number }

// GDD §5.1. 유닛 중심 사이 거리(칸)
export function dist(a: Pos, b: Pos): number {
  return Math.hypot(a.col - b.col, a.y - b.y)
}

// 같은 거리인가(부동소수 오차 허용)
const sameDist = (a: number, b: number) => Math.abs(a - b) <= COMBAT.tieEps

// GDD §5.1. 사거리 안 살아 있는 적 중 가장 가까운 적. 같은 거리면 y가 큰(아래쪽) 적. 없으면 null
export function pickTarget<T extends Foe>(from: Pos, enemies: T[], range: number): T | null {
  let best: T | null = null
  let bd = Infinity
  for (const e of enemies) {
    if (e.hp <= 0 || e.gone) continue
    const d = dist(from, e)
    if (d > range) continue
    if (!best || d < bd - COMBAT.tieEps || (sameDist(d, bd) && e.y > best.y)) {
      best = e
      bd = d
    }
  }
  return best
}

// GDD §5.1. origin에서 target으로 가는 반직선 위(수직 거리 <= width), target 이상으로 먼 점인가. target 자신도 포함
export function onRay(origin: Pos, target: Pos, p: Pos, width: number): boolean {
  const dx = target.col - origin.col
  const dy = target.y - origin.y
  const len = Math.hypot(dx, dy)
  if (len === 0) return dist(origin, p) <= width
  const px = p.col - origin.col
  const py = p.y - origin.y
  const along = (px * dx + py * dy) / len // 사선 방향 투영 거리
  const side = Math.abs(px * dy - py * dx) / len // 사선과의 수직 거리
  return along >= len - COMBAT.tieEps && side <= width + COMBAT.tieEps
}

// GDD §5.1·§5.2. 적이 때릴 아군. reach 안 산 아군 중 도발이 있으면 도발끼리, 가장 가까운 것(같으면 위쪽, 왼쪽 열). 없으면 null
export function engageTarget<T extends Friend>(enemy: Pos, allies: T[], reach: number = COMBAT.meleeReach): T | null {
  const near = allies.filter((a) => a.alive && dist(enemy, a) <= reach + COMBAT.tieEps)
  const taunting = allies.filter((a) => a.alive && a.taunt && dist(enemy, a) <= (a.tauntReach ?? reach) + COMBAT.tieEps)
  const pool = taunting.length > 0 ? taunting : near
  let best: T | null = null
  let bd = Infinity
  for (const a of pool) {
    const d = dist(enemy, a)
    if (!best || d < bd - COMBAT.tieEps || (sameDist(d, bd) && (a.y < best.y || (a.y === best.y && a.col < best.col)))) {
      best = a
      bd = d
    }
  }
  return best
}

// 첫 교전에는 짧게 조준하고, 연속 공격은 정상 간격을 지킨다. 대상이 바뀌면 다시 조준한다.
export function enemyAttackStep(type: EnemyType, ready: number, dt: number, acquiring: boolean): { ready: number; fire: boolean } {
  const def = ENEMIES[type]
  const next = (acquiring ? def.interval - def.firstShot : ready) + dt
  const fire = next >= def.interval - COMBAT.tieEps
  return { ready: fire ? Math.max(0, next - def.interval) : next, fire }
}

export function enemyAttackDamage(type: EnemyType, wave: number): number {
  return ENEMIES[type].dmg * (1 + ENEMY_COMBAT.damageGrowth * Math.max(0, wave - 1))
}

export function armoredEnemy(type: EnemyType): boolean {
  return type === 'boss' || type === 'dogPlus' || ENEMIES[type].armor < 1
}

// 방패는 직접 피격만 줄인다. 독/화상은 기존 지속 피해로 우회한다.
export function enemyDirectDamage(type: EnemyType, base: number, vuln: number): number {
  return damageTaken(base, vuln) * ENEMIES[type].armor
}

export function enemyAttackTargets<T extends Friend>(type: EnemyType, target: T, allies: T[]): T[] {
  if (!target.alive) return []
  const radius = ENEMIES[type].splash
  return radius > 0 ? allies.filter((a) => a.alive && dist(target, a) <= radius + COMBAT.tieEps) : [target]
}

// GDD §5.2. 제설병 부채꼴: 자기 열과 양옆 열, 앞쪽(y가 작은) range칸 안의 산 적 전부
export function blowerCone<T extends Foe>(ally: Pos, enemies: T[], range: number): T[] {
  return enemies.filter((e) => e.hp > 0 && !e.gone && Math.abs(e.col - ally.col) <= 1 && inRange(ally.y, e.y, range))
}

// GDD §5.2. 적이 받는 피해 = 기본 x 다른 곱(화학병 버프 등) x (취약 중이면 vulnMult)
export function damageTaken(base: number, vuln: number, buff = 1): number {
  return base * buff * (vuln > 0 ? COMBAT.vulnMult : 1)
}

// GDD §5.2. 아군이 받는 피해: 제설병은 x blowerArmor
export function allyDamageTaken(dmg: number, card: CardKey, spec?: Specialty, hygieneMult = 1, protectionMult = 1): number {
  return dmg * (card === 'blower' ? (spec === 'A' ? SPECIALTIES.blower.A.armor : COMBAT.blowerArmor) : 1) * hygieneMult * protectionMult
}

// GDD §5.2. 밀린(pushedAt) 뒤 minePushSec 안에 터진 지뢰의 피해 배율. 밀린 적이 아니면 -Infinity를 넣는다
export function pushMult(pushedAt: number, now: number): number {
  return now - pushedAt <= COMBAT.minePushSec + COMBAT.tieEps ? COMBAT.minePushMult : 1
}

// GDD §5.2. 취사병 회복 순서: HP 비율이 낮은 순, 같으면 도발 중인 제설병 먼저. 새 배열
export function healOrder<T extends { hp: number; maxHp: number; taunt?: boolean }>(allies: T[]): T[] {
  return [...allies].sort((p, q) => p.hp / p.maxHp - q.hp / q.maxHp || Number(!!q.taunt) - Number(!!p.taunt))
}

// 적이 아군과 같거나 위에 있고 거리가 사거리 이내
export function inRange(allyY: number, enemyY: number, range: number): boolean {
  return enemyY <= allyY && allyY - enemyY <= range
}

// 열·행 차이 중 큰 쪽이 범위 이내(인접 8칸 = 1)
export function withinReach(dc: number, dr: number, reach: number): boolean {
  return Math.max(Math.abs(dc), Math.abs(dr)) <= reach
}

// GDD §5.2·§5.3·§5.4·§4.1·§5.6. 공격 간격 = 기본 x (소총수만 병장·시너지) x 데프콘 1 x (가스 위면 slow). 곱으로 겹친다
export function interval(card: CardKey, rank: number, synergyCount: number, defcon1: boolean, gassed = false, spec?: Specialty, signalMult = 1): number {
  let v = CARDS[card].interval
  if (card === 'rifle') {
    if (rank >= ABILITY.sergeant) v *= ABILITY.sergeantRifleInterval
    v *= SYN_FX.rifleInterval[synergyTier(card, synergyCount)] ?? 1
  }
  if (card === 'rifle' && spec) v *= SPECIALTIES.rifle[spec].interval
  if (card === 'blower' && spec === 'B') v *= SPECIALTIES.blower.B.interval
  if (card === 'mortar') v *= SYN_FX.mortarInterval[synergyTier(card, synergyCount)] ?? 1
  if (card === 'antitank' && spec === 'B') v *= SPECIALTIES.antitank.B.interval
  if (defcon1) v *= BATTLE.defcon1AllyInterval
  v *= signalMult
  return gassed ? v * GAS.slow : v
}

// GDD §5.3·§5.4. atk = stats().atk. k는 관통 순서(0부터). 상병 이상은 감소 없음, 시너지 단계로 배율
export function sniperDamage(atk: number, k: number, rank: number, tier = 0, spec?: Specialty): number {
  const fall = rank >= ABILITY.corporal ? 1 : Math.max(0, 1 - (spec === 'B' ? SPECIALTIES.sniper.B.falloff : ABILITY.sniperFalloff) * k)
  return atk * fall * (SYN_FX.sniperDamage[tier] ?? 1) * (spec === 'A' && k === 0 ? SPECIALTIES.sniper.A.damage : 1)
}

// GDD §5.3·§5.4·§5.6. 밀어내기 칸 수 = (병장이면 큰 값) x 적 배율 x 시너지 배율
export function knockback(enemy: EnemyType, rank: number, blowerCount: number, spec?: Specialty): number {
  const base = rank >= ABILITY.sergeant ? ABILITY.knockSergeant : ABILITY.knockBase
  return base * (spec === 'B' ? SPECIALTIES.blower.B.knock : 1) * ENEMIES[enemy].knock * (SYN_FX.blowerKnock[synergyTier('blower', blowerCount)] ?? 1)
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
export type MineToken = { anti: boolean; stun: boolean }
export function mineTokenPlan(miners: { rank: number; spec?: Specialty }[]): MineToken[] {
  const tokens = miners.flatMap((m) => Array.from({ length: (MINES.tokensByRank[clampRank(m.rank) - 1] ?? 0) + (m.rank >= ABILITY.sergeant ? MINES.sergeantBonus : 0) + (m.spec === 'A' ? SPECIALTIES.miner.A.tokens : 0) }, () => ({ anti: m.rank >= ABILITY.corporal, stun: m.spec === 'B' })))
  if (synergyTier('miner', miners.length) >= 1) for (let i = 0; i < MINES.synergyBonus; i++) tokens.push({ anti: false, stun: false })
  return tokens
}
export function mineTokens(miners: { rank: number; spec?: Specialty }[]): number {
  return mineTokenPlan(miners).length
}

// 기존 호출 호환용 집계. 실제 지뢰 속성은 mineTokenPlan의 생산자 스냅샷을 쓴다.
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
  return MINES.damage * (anti && armoredEnemy(enemy) ? MINES.bossMult : 1)
}

// ---- 4단계: 화학전 ----

export type GasDrop = { t: number; col: number; row: number } // col·row는 2x2 왼쪽 위 칸(배치 구역 기준)
export type Chem = { col: number; row: number; rank: number; spec?: Specialty } // 살아 있는 화학병만 넣는다(쓰러진 화학병 = 입력에서 빠짐)

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
export function chemReach(rank: number, spec?: Specialty): number {
  return (GAS.reach[rank >= ABILITY.corporal ? 1 : 0] as number) + (spec === 'A' ? SPECIALTIES.chem.A.reach : 0)
}

// 어느 화학병이든 범위 안(자기 칸 포함)이면 가스 면역
export function inChemReach(chems: Chem[], col: number, row: number): boolean {
  return chems.some((c) => withinReach(col - c.col, row - c.row, chemReach(c.rank, c.spec)))
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
      if (synergyOn && inChemReach(chems, c, r)) { row[c] = 0; cleared++ }
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
      if (!withinReach(c - chem.col, r - chem.row, chemReach(chem.rank, chem.spec))) return v
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
  | { e: 'combo_mine'; wave: number } // 밀린 적이 지뢰에 맞음(적 1마리당 1건)
  | { e: 'vuln_kill'; wave: number; n: number } // 그 웨이브에 취약 상태로 죽은 적 수
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
    return `enemy_${e.id}_${state === 'act' ? e.act : state === 'move' ? e.move : state}`
  }
  return `${kind}_${who}_${state}`
}

// 반복 재생하는 애니메이션 키(대기·걷기·달리기·가스). 나머지는 1회
export function artLoops(key: string): boolean {
  return ART.loopKeys.includes(key) || ART.loopSuffix.some((s) => key.endsWith(s))
}

// 동작 프레임을 정해진 초 안에 끝내며, 빠른 공격도 다음 쿨다운 전에 대기로 돌아간다.
export function clipFps(frames: number, seconds: number): number {
  return Math.max(1, frames) / Math.max(ART.fps.minClipSec, seconds)
}

export function walkFps(speed: number): number {
  return Math.max(ART.fps.minWalk, Math.max(0, speed) * ART.fps.walkPerSpeed)
}

export function motionEnabled(value: string | null): boolean {
  return value !== '0'
}

// 전투 난수 스트림을 소비하지 않는 시드 기반 위상. 동일 카드끼리도 숨쉬기가 어긋난다.
export function motionPhase(seed: number, index: number): number {
  const phase = (seed + ART.motion.seedSalt) * ART.motion.phaseStep + index * ART.motion.phaseStep
  return phase - Math.floor(phase)
}

// 합성 뒤 undefined면 즉시 선택을 받아야 한다. 입력을 바꾸지 않는다.
export function mergeSpecialty(a: Unit, b: Unit): Specialty | undefined {
  return merge(a, b) !== null && a.rank > 1 && a.spec === b.spec ? a.spec : undefined
}
export function attackRange(card: CardKey, spec?: Specialty): number {
  return CARDS[card].range + (card === 'rifle' && spec ? SPECIALTIES.rifle[spec].range : 0)
}
export function rifleDamage(atk: number, distance: number, spec?: Specialty): number {
  return atk * (spec === 'B' && distance <= SPECIALTIES.rifle.B.reach + COMBAT.tieEps ? SPECIALTIES.rifle.B.damage : 1)
}
export function sniperWidth(spec?: Specialty): number { return spec === 'B' ? SPECIALTIES.sniper.B.width : COMBAT.pierceWidth }
export function blowerTaunt(spec?: Specialty): number { return spec === 'A' ? SPECIALTIES.blower.A.taunt : COMBAT.meleeReach }
export function blowerVuln(spec?: Specialty): number { return spec === 'B' ? SPECIALTIES.blower.B.vuln : COMBAT.vulnSec }
export function cookHeal(spec?: Specialty): number { return spec === 'A' ? SPECIALTIES.cook.A.heal : ABILITY.cookHeal }
export function cookTargets(rank: number, count: number): number { return synergyTier('cook', count) > 0 ? Infinity : rank >= ABILITY.corporal ? SPECIALTY_RULES.cookTargets : 1 }
export function cookSupplyBonus(units: Unit[]): number { return units.filter((u) => u.card === 'cook' && u.spec === 'B').length * SPECIALTIES.cook.B.supply }
export function chemInterval(spec?: Specialty): number { return spec === 'A' ? SPECIALTIES.chem.A.interval : GAS.cleanse }
// 남은 지속 시간만 피해를 준다. 화상과 중독은 각각 호출해 서로 독립적으로 흐른다.
export function dotTick(remaining: number, dt: number, dps: number, vuln = 0): { remaining: number; damage: number } {
  const elapsed = Math.min(Math.max(0, remaining), Math.max(0, dt))
  const vulnerable = Math.min(elapsed, Math.max(0, vuln))
  return { remaining: Math.max(0, remaining - elapsed), damage: dps * (elapsed + vulnerable * (COMBAT.vulnMult - 1)) }
}

// 정산 호출자는 배치 유닛만 넘기고 클리어 때 한 번 가산한다(쓰러진 유닛 포함).
export const cookWaveBonus = cookSupplyBonus
export function unitInfoRows(unit: Unit, synergyCount = 1, defcon1 = false, signalMult = 1): [string, string][] {
  const { card, rank, spec } = unit
  const value = stats(card, rank, spec)
  const num = (n: number) => Number(n.toFixed(3)).toString()
  const rows: [string, string][] = [['최대 HP', num(value.hp)], ['직접 공격', num(value.atk)], ['공격 간격', card === 'signal' ? '직접 공격 없음' : `${num(interval(card, rank, synergyCount, defcon1, false, spec, signalMult))}초`]]
  if (spec) rows.push(['특기', `${SPECIALTIES[card][spec].name} · ${SPECIALTIES[card][spec].description}`])
  if (card === 'cook') {
    const reach = cookReach(rank, synergyCount)
    rows.push(['회복', `${cookHeal(spec)} · ${cookTargets(rank, synergyCount) === Infinity ? '전원' : cookTargets(rank, synergyCount) + '명'}`], ['회복 범위', reach === Infinity ? '배치 구역 전원' : `${reach}칸`])
  } else if (card === 'medic') {
    rows.push(['소생 처치', `${num(medicTreatment(synergyCount, spec))}초`], ['소생 HP', `${num(medicReviveHp(UI.log.pct, spec))}%`], ['소생 횟수', `웨이브 ${medicUses(rank)}회`], ['처치 범위', `${CARDS.medic.range}칸`])
    if (spec === 'B') rows.push(['위생 보호', '인접 아군 받는 피해 −10%'])
  } else if (card === 'signal') {
    rows.push(['지휘 범위', `${signalReach(rank)}칸`], ['아군 공격 간격', `×${num(spec === 'A' ? SPECIALTIES.signal.A.intervalMult : NEW_CARDS.signal.intervalMult)}`], ['지원 보너스', spec === 'B' ? '+2회 · 판당 출처별 1회' : '+1회 · 판당 출처별 1회'])
    if (synergyTier('signal', synergyCount) > 0) rows.push(['2명 시너지', '화력 지원 +1회 · 판당 출처별 1회'])
  } else if (card === 'mortar') {
    rows.push(['사거리', `${NEW_CARDS.mortar.minRange}~${CARDS.mortar.range}칸`], ['폭발 반지름', `${num(mortarRadius(rank, spec))}칸`], ['낙하 지연', `${mortarDelay(rank)}초`])
  } else if (card === 'antitank') {
    rows.push(['사거리', `${attackRange(card, spec)}칸`], ['장갑 배율', `×${num(antitankDamage(1, 'boss', synergyCount, spec))}`])
  } else if (card === 'blower') rows.push(['사거리', `${blowerRange(synergyCount)}칸`], ['도발', `${blowerTaunt(spec)}칸`], ['취약', `${blowerVuln(spec)}초`])
  else rows.push(['사거리', `${attackRange(card, spec)}칸`])
  if (card === 'chem') rows.push(['제독·보호', `${chemReach(rank, spec)}칸`], ['제독 주기', `${chemInterval(spec)}초`])
  if (card === 'miner') rows.push(['개인 지뢰 토큰', `${mineTokenPlan([{ rank, spec }]).length}개`], ['지뢰', rank >= ABILITY.corporal ? '대전차' : '일반'])
  if (rank >= ABILITY.corporal) rows.push(['상병 능력', { rifle: '2점사', sniper: '관통 감쇠 없음', blower: '밀어낸 적 3초 화상 · 초당 8', cook: '2명 동시 회복', miner: '장갑 지뢰 피해 ×3', chem: '제독 기본 범위 2칸', medic: '소생 후 3초 받는 피해 −50%', mortar: '0.5초 뒤 같은 위치에 두 번째 발사', antitank: '명중 대상 1초 기절', signal: '버프 범위 2칸' }[card]])
  if (rank >= ABILITY.sergeant) rows.push(['병장 능력', { rifle: '공격 간격 −20%', sniper: '첫 대상 1초 기절', blower: '기본 밀기 2칸', cook: '회복 범위 2칸', miner: '지뢰 토큰 +2', chem: '인접 아군 직접 공격 +15%', medic: '웨이브당 소생 2회', mortar: '폭발 반지름 +0.5칸 · 낙하 지연 0.5초', antitank: '사선 뒤 적에게 50% 관통 피해', signal: '화력 지원 피해 300' }[card]])
  return rows
}

// 살아 있는 다친 대상만 고른다. 자기 자신·거리 필터는 호출자가 먼저 적용한다.
export function cookHealing<T extends { hp: number; maxHp: number; taunt?: boolean; alive: boolean }>(patients: T[], rank: number, count: number, spec?: Specialty): { target: T; amount: number }[] {
  return healOrder(patients.filter((p) => p.alive && p.hp > 0 && p.hp < p.maxHp)).slice(0, cookTargets(rank, count)).map((target) => ({ target, amount: Math.min(cookHeal(spec), target.maxHp - target.hp) }))
}

// 새4종의 상태는 호출자가 보관한다. 오라 입력은 배치 구역만, alive=false는 제공하지 않는다.
export type AuraUnit = { col: number; row: number; rank: number; spec?: Specialty; alive?: boolean }
const auraNear = (u: AuraUnit, col: number, row: number, reach: number) => u.alive !== false && !(u.col === col && u.row === row) && withinReach(col - u.col, row - u.row, reach)

export function medicTreatment(count = 1, spec?: Specialty): number {
  return NEW_CARDS.medic.treatmentSec - (spec === 'A' ? SPECIALTIES.medic.A.treatmentReduction : 0) - (SYN_FX.medicTreatment[synergyTier('medic', count)] ?? 0)
}
export function medicReviveHp(maxHp: number, spec?: Specialty): number {
  return maxHp * (spec === 'A' ? SPECIALTIES.medic.A.reviveRatio : NEW_CARDS.medic.reviveRatio)
}
export function medicUses(rank: number): number { return rank >= ABILITY.sergeant ? NEW_CARDS.medic.sergeantUses : NEW_CARDS.medic.uses }
export function medicProtection(rank: number): { sec: number; mult: number } {
  return rank >= ABILITY.corporal ? { sec: NEW_CARDS.medic.protectionSec, mult: NEW_CARDS.medic.protectionMult } : { sec: 0, mult: 1 }
}
export function medicDamageMult(medics: AuraUnit[], col: number, row: number): number {
  return medics.some((u) => u.spec === 'B' && auraNear(u, col, row, CARDS.medic.range)) ? SPECIALTIES.medic.B.damageMult : 1
}

export function mortarRadius(rank: number, spec?: Specialty): number {
  return NEW_CARDS.mortar.radius + (spec === 'A' ? SPECIALTIES.mortar.A.radius : 0) + (rank >= ABILITY.sergeant ? NEW_CARDS.mortar.sergeantRadius : 0)
}
export function mortarDelay(rank: number): number { return rank >= ABILITY.sergeant ? NEW_CARDS.mortar.sergeantDelay : NEW_CARDS.mortar.delay }
// 발사 시점의 동일 위치를 예약하며 두 번째 발사도 게임 dt로 기다린다.
export function mortarShotOffsets(rank: number): number[] { return rank >= ABILITY.corporal ? [0, NEW_CARDS.mortar.secondShotDelay] : [0] }
export function mortarTarget<T extends Foe>(from: Pos, enemies: T[]): T | null {
  return pickTarget(from, enemies.filter((e) => dist(from, e) >= NEW_CARDS.mortar.minRange - COMBAT.tieEps), CARDS.mortar.range)
}
export function mortarHits<T extends Foe>(point: Pos, enemies: T[], radius: number): T[] {
  return enemies.filter((e) => e.hp > 0 && !e.gone && dist(point, e) <= radius + COMBAT.tieEps)
}
export function antitankDamage(atk: number, type: EnemyType, count = 1, spec?: Specialty, secondary = false): number {
  const armored = armoredEnemy(type)
  const armor = (spec === 'A' ? SPECIALTIES.antitank.A.armorMult : NEW_CARDS.antitank.armorMult) + (SYN_FX.antitankArmor[synergyTier('antitank', count)] ?? 0)
  return atk * (armored ? armor : 1) * (secondary ? NEW_CARDS.antitank.pierceMult : 1)
}
export function antitankStun(rank: number): number { return rank >= ABILITY.corporal ? NEW_CARDS.antitank.stunSec : 0 }
export function signalReach(rank: number): number { return rank >= ABILITY.corporal ? NEW_CARDS.signal.corporalReach : NEW_CARDS.signal.reach }
export function signalIntervalMult(signals: AuraUnit[], col: number, row: number): number {
  return signals.reduce((mult, u) => auraNear(u, col, row, signalReach(u.rank)) ? Math.min(mult, u.spec === 'A' ? SPECIALTIES.signal.A.intervalMult : NEW_CARDS.signal.intervalMult) : mult, 1)
}

// 출처는 판 동안 유지한다. 소비한 충전과 별개여서 판매/합성/웨이브 전환으로 다시 주지 않는다.
export type SupportSource = 'deployed' | 'synergy' | 'specialty'
export function supportSources(signals: AuraUnit[]): SupportSource[] {
  const live = signals.filter((u) => u.alive !== false)
  const sources: SupportSource[] = []
  if (live.length > 0) sources.push('deployed')
  if (synergyTier('signal', live.length) > 0) sources.push('synergy')
  if (live.some((u) => u.spec === 'B')) sources.push('specialty')
  return sources
}
export function supportGrant(previousSources: readonly SupportSource[], signals: AuraUnit[]): { sources: SupportSource[]; bonus: number } {
  const sources = [...new Set([...previousSources, ...supportSources(signals)])].slice(0, NEW_CARDS.signal.maxBonus)
  return { sources, bonus: Math.max(0, sources.length - new Set(previousSources).size) }
}
export function supportDamage(signals: AuraUnit[]): number {
  return signals.some((u) => u.alive !== false && u.rank >= ABILITY.sergeant) ? NEW_CARDS.signal.sergeantDamage : SUPPORT.damage
}
