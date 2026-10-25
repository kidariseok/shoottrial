import { CARDS, CARD_KEYS, CHARACTERS, RANK_VISUAL, ROOKIE, type CardKey } from '../data'
import { unitInfoRows } from '../rules'
import type { Hud, Phase } from './screens'

const RANK_NAMES: Record<number, string> = {
  1: '이등병',
  2: '일병',
  3: '상병',
  4: '병장',
}

export function getCardName(card: string): string {
  return CARDS[card as CardKey]?.name ?? card
}

export function getCardInitial(card: string): string {
  return CARDS[card as CardKey]?.initial ?? (card.slice(0, 1).toUpperCase() || '?')
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

export function canFireSupport(phase: Phase, support?: number): boolean {
  return phase === 'fight' && (support ?? 0) > 0
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
    prev.speed !== next.speed ||
    prev.support !== next.support
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

export const ALL_CARDS = CARD_KEYS

// 도감은 시너지 없는 이등병 기준. 전투 정보창은 배치 상태로 계산한 행을 받는다.
export const getCodexRows = (card: CardKey): [string, string][] => unitInfoRows({ card, rank: 1 })

export function sanitizeRookieName(raw: string, fallback = '김신병'): string {
  const trimmed = raw.trim().slice(0, 6)
  return trimmed.length > 0 ? trimmed : fallback
}

export function mergeUnlockedCards(
  saveUnlocked: readonly string[],
  rawLocalUnlocked: string | null
): string[] {
  const set = new Set<string>(saveUnlocked)
  if (rawLocalUnlocked) {
    try {
      const parsed: unknown = JSON.parse(rawLocalUnlocked)
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === 'string' && item.trim().length > 0) {
            set.add(item)
          }
        }
      }
    } catch {
      // 잘못된 JSON 무시
    }
  }
  return [...set]
}

export function formatBriefingText(template: string, name: string): string {
  const cleanName = sanitizeRookieName(name)
  return template.replace(/\{이름\}/g, cleanName)
}

// ---- T-109 걸어 다니는 생활관 순수 헬퍼(화면·입력 없이 계산만, tests/ui.test.ts) ----

export interface Vec {
  x: number
  y: number
}
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}
export interface Zone {
  id: string
  x: number
  y: number
  r: number
}

// 스틱 시작점에서 현재 손가락까지의 벡터. 길이는 0~1(maxRadius에서 잘림)
export function stickVector(origin: Vec, point: Vec, maxRadius: number): Vec {
  const dx = point.x - origin.x
  const dy = point.y - origin.y
  const len = Math.hypot(dx, dy)
  if (len === 0 || maxRadius <= 0) return { x: 0, y: 0 }
  const k = Math.min(len, maxRadius) / maxRadius / len
  return { x: dx * k, y: dy * k }
}

const overlaps = (p: Vec, radius: number, c: Rect): boolean =>
  p.x + radius > c.x && p.x - radius < c.x + c.w && p.y + radius > c.y && p.y - radius < c.y + c.h

// 한 프레임 이동. 축마다 따로 밀어내서 벽에 비비며 미끄러진다. bounds는 중심이 다닐 수 있는 범위
export function moveStep(
  pos: Vec,
  dir: Vec,
  speed: number,
  dtMs: number,
  colliders: readonly Rect[],
  bounds: Rect,
  radius: number
): Vec {
  const d = (speed * dtMs) / 1000
  const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))
  const blocked = (p: Vec): boolean => colliders.some((c) => overlaps(p, radius, c))
  let next: Vec = { x: clamp(pos.x + dir.x * d, bounds.x, bounds.x + bounds.w), y: pos.y }
  if (blocked(next)) next = { x: pos.x, y: pos.y }
  const ny = clamp(pos.y + dir.y * d, bounds.y, bounds.y + bounds.h)
  if (!blocked({ x: next.x, y: ny })) next = { x: next.x, y: ny }
  return next
}

// 반경 안에 든 구역 중 가장 가까운 것(없으면 null)
export function nearestZone(pos: Vec, zones: readonly Zone[]): Zone | null {
  let best: Zone | null = null
  let bestD = Infinity
  for (const z of zones) {
    const d = Math.hypot(z.x - pos.x, z.y - pos.y)
    if (d <= z.r && d < bestD) {
      best = z
      bestD = d
    }
  }
  return best
}

// 비상등 맥동: 0~max를 주기마다 부드럽게 오간다. 광과민 가드: 주기가 1/3초보다 짧으면 1/3초로 올린다(초당 3회 이상 깜박이지 않는다)
export const MIN_PULSE_MS = 333
export function pulseAlpha(tMs: number, periodMs: number, max: number): number {
  const p = Math.max(MIN_PULSE_MS, periodMs)
  return ((1 - Math.cos((2 * Math.PI * tMs) / p)) / 2) * max
}

// 줄 순환(대사·방송 자막)
export function nextLine(index: number, lines: readonly string[]): number {
  return lines.length === 0 ? 0 : (index + 1) % lines.length
}

// 비상 연출 켜짐 여부. 저장값이 "0"일 때만 끈다(없으면 켬). 기기별 설정이라 세이브 형식과 따로 localStorage에 둔다
export const ALARM_FX_KEY = 'd2_alarm_fx'
export const readAlarmFx = (raw: string | null): boolean => raw !== '0'
export function loadAlarmFx(): boolean {
  try {
    return readAlarmFx(localStorage.getItem(ALARM_FX_KEY))
  } catch {
    return true
  }
}
export function saveAlarmFx(on: boolean): void {
  try {
    localStorage.setItem(ALARM_FX_KEY, on ? '1' : '0')
  } catch {
    // 저장 못 해도 이번 실행에는 영향 없음
  }
}

export function getCharacterName(card: string, rank?: number, name?: string): string {
  const person = CHARACTERS[card as CardKey]
  const base = name || (card === 'rifle' ? ROOKIE.name : person?.name) || getCardName(card)
  return rank === 4 ? `${RANK_VISUAL.veteran} ${base}` : base
}

export function getCharacterIntro(card: string): string {
  return CHARACTERS[card as CardKey]?.intro ?? '—'
}
