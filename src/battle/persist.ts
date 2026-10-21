// ponytail: T-101의 save.ts가 생기면 save.unlocked로 옮긴다. 그때까지 M2는 A가 localStorage를 직접 읽고 쓴다(CONTEXT)
import { CARD_KEYS, LOG, type CardKey } from '../data'
import { parseUnlocked } from '../rules'

// 막힌 저장소(사생활 보호 모드 등)에서도 판은 시작해야 하므로 실패는 조용히 넘긴다
export function readKey(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeKey(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 저장 실패는 이번 판 진행에 영향 없음
  }
}

export function loadUnlocked(all: boolean): CardKey[] {
  return all ? [...CARD_KEYS] : parseUnlocked(readKey(LOG.unlockedKey))
}

export function saveUnlocked(list: readonly CardKey[]): void {
  writeKey(LOG.unlockedKey, JSON.stringify(list))
}
