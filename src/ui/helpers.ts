import type { Hud } from './screens'

const CARD_META: Record<string, { name: string; initial: string }> = {
  rifle: { name: '소총수', initial: '소' },
  sniper: { name: '저격수', initial: '저' },
  blower: { name: '제설병', initial: '제' },
  cook: { name: '취사병', initial: '취' },
  miner: { name: '지뢰설치병', initial: '지' },
  chem: { name: '화학병', initial: '화' },
}

const RANK_NAMES: Record<number, string> = {
  1: '이등병',
  2: '일병',
  3: '상병',
  4: '병장',
}

export function getCardName(card: string): string {
  return CARD_META[card]?.name ?? card
}

export function getCardInitial(card: string): string {
  return CARD_META[card]?.initial ?? (card.slice(0, 1).toUpperCase() || '?')
}

export function getRankName(rank?: number): string {
  if (rank === undefined) return '—'
  return RANK_NAMES[rank] ?? `${rank}계급`
}

export function getRankBars(rank?: number): number {
  if (rank === undefined || rank < 1) return 1
  return Math.min(4, Math.floor(rank))
}

export function sortSynergies(
  synergies: Hud['synergies']
): { card: string; count: number; on: boolean }[] {
  return [...synergies].sort((a, b) => {
    if (a.on !== b.on) return a.on ? -1 : 1
    if (b.count !== a.count) return b.count - a.count
    return a.card.localeCompare(b.card)
  })
}

export function isSameHud(prev: Hud | null, next: Hud): boolean {
  if (!prev) return false
  if (
    prev.wave !== next.wave ||
    prev.waves !== next.waves ||
    prev.defcon !== next.defcon ||
    prev.supply !== next.supply ||
    prev.baseHp !== next.baseHp ||
    prev.phase !== next.phase ||
    prev.prepLeft !== next.prepLeft ||
    prev.speed !== next.speed
  ) {
    return false
  }
  if (prev.synergies.length !== next.synergies.length) {
    return false
  }
  for (let i = 0; i < prev.synergies.length; i++) {
    const p = prev.synergies[i]
    const n = next.synergies[i]
    if (!p || !n || p.card !== n.card || p.count !== n.count || p.on !== n.on) {
      return false
    }
  }
  return true
}

export function cloneHud(h: Hud): Hud {
  return {
    ...h,
    synergies: h.synergies.map((s) => ({ ...s })),
  }
}
