// docs/TECH.md §5 세이브
import { ROOKIE } from './data'
import { prefsGet, prefsSet } from './platform'

export type Save = {
  v: 1
  name: string                 // 신병 이름
  unlocked: string[]           // 해금된 카드 id
  bestWave: number
  runs: number
  firstRun: boolean
  settings: { bgm: boolean; sfx: boolean; haptic: boolean; dmgNumbers: boolean }
}

export const SAVE_KEY = 'd2_save_v1'
const INITIAL_UNLOCKED = ['rifle', 'blower', 'sniper'] as const

export function defaultSave(): Save {
  return {
    v: 1,
    name: ROOKIE.name,
    unlocked: [...INITIAL_UNLOCKED],
    bestWave: 0,
    runs: 0,
    firstRun: true,
    settings: {
      bgm: true,
      sfx: true,
      haptic: true,
      dmgNumbers: true,
    },
  }
}

function log(event: string): void {
  console.warn(event)
}

function isValidSave(obj: unknown): obj is Save {
  if (!obj || typeof obj !== 'object') return false
  const s = obj as Record<string, unknown>
  if (s.v !== 1) return false
  if (typeof s.name !== 'string') return false
  if (!Array.isArray(s.unlocked) || !s.unlocked.every((x) => typeof x === 'string')) return false
  if (typeof s.bestWave !== 'number' || !Number.isFinite(s.bestWave)) return false
  if (typeof s.runs !== 'number' || !Number.isFinite(s.runs)) return false
  if (typeof s.firstRun !== 'boolean') return false
  if (!s.settings || typeof s.settings !== 'object') return false
  const st = s.settings as Record<string, unknown>
  return (
    typeof st.bgm === 'boolean' &&
    typeof st.sfx === 'boolean' &&
    typeof st.haptic === 'boolean' &&
    typeof st.dmgNumbers === 'boolean'
  )
}

export function parseSave(raw: string): Save {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isValidSave(parsed)) {
      log('save_corrupt')
      return defaultSave()
    }
    return {
      v: 1,
      name: parsed.name,
      unlocked: [...parsed.unlocked],
      bestWave: parsed.bestWave,
      runs: parsed.runs,
      firstRun: parsed.firstRun,
      settings: { ...parsed.settings },
    }
  } catch {
    log('save_corrupt')
    return defaultSave()
  }
}

export async function load(): Promise<Save> {
  const raw = await prefsGet(SAVE_KEY)
  if (raw === null || raw === '') {
    return defaultSave()
  }
  return parseSave(raw)
}

export async function save(data: Save): Promise<void> {
  await prefsSet(SAVE_KEY, JSON.stringify(data))
}
