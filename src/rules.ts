// 순수 계산. phaser·DOM·debug를 import하지 않는다(vitest가 node에서 돌린다). 수치는 data.ts에서만 읽는다.
import { CARDS, CARD_KEYS, ECONOMY, RANKS, SYNERGY, type CardKey } from './data'

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
