// 순수 계산. phaser·DOM·debug를 import하지 않는다(vitest가 node에서 돌린다). 수치는 data.ts에서만 읽는다.
import { BATTLE, CARDS, CARD_KEYS, ECONOMY, LAYOUT, RANKS, SYNERGY, type CardKey, type EnemyType } from './data'
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
  // (1) 단발 목록: 보병, 군견, RPG병 순으로 이어 붙인다
  const singles: EnemyType[] = [
    ...Array<EnemyType>(def.infantry).fill('infantry'),
    ...Array<EnemyType>(def.dog).fill('dog'),
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
