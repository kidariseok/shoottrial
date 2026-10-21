import { CARDS, ECONOMY, REWARD, type CardKey } from '../data'
import { createRng } from '../debug'
import { buyOutcome, rollShop, type BuyOutcome } from '../rules'
import type { Offer } from '../ui/screens'
import type { Board } from './board'

// 상점 상태. 난수는 호출한 쪽이 넘긴 시드의 별도 스트림(출현 재현성 유지)
export type Shop = { offers: (CardKey | null)[]; rand: () => number; rerollsLeft: number; supplyAdsLeft: number }

export function createShop(seed: number): Shop {
  return {
    offers: Array<CardKey | null>(ECONOMY.shopSize).fill(null),
    rand: createRng(seed),
    rerollsLeft: REWARD.adRerollMax,
    supplyAdsLeft: REWARD.adSupplyMax,
  }
}

// 5칸을 다시 채운다(구매로 빈 칸도 포함). 비용은 호출한 쪽이 낸다
export function refill(shop: Shop, unlocked: CardKey[]): void {
  shop.offers = rollShop(unlocked, shop.rand)
}

export function toOffers(shop: Shop): Offer[] {
  return shop.offers.map((card) => (card ? { card, cost: CARDS[card].cost } : null))
}

export type BuyResult = { kind: BuyOutcome['kind'] | 'none'; cost: number; card: CardKey | null }

// 성공(bench·merge)일 때만 board를 바꾸고 칸을 비운다. 보급 차감은 호출한 쪽이 cost로 한다
export function buyCard(shop: Shop, board: Pick<Board, 'benchFree' | 'units' | 'place' | 'promote'>, i: number, supply: number): BuyResult {
  const card = shop.offers[i] ?? null
  if (!card) return { kind: 'none', cost: 0, card: null }
  const free = board.benchFree()
  const out = buyOutcome(card, supply, free !== null, board.units())
  if (out.kind === 'poor' || out.kind === 'full') return { kind: out.kind, cost: 0, card }
  if (out.kind === 'bench') board.place('bench', free as number, { card, rank: 1 })
  else for (const step of out.steps) board.promote(step.promote.zone, step.promote.i, step.remove)
  shop.offers[i] = null
  return { kind: out.kind, cost: CARDS[card].cost, card }
}

// 무료 리롤·긴급 보급 남은 횟수. 광고 자체는 M4
export function useAdReroll(shop: Shop): boolean {
  if (shop.rerollsLeft <= 0) return false
  shop.rerollsLeft -= 1
  return true
}

export function useAdSupply(shop: Shop): boolean {
  if (shop.supplyAdsLeft <= 0) return false
  shop.supplyAdsLeft -= 1
  return true
}
