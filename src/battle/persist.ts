// 해금·최고 기록·이름은 src/save.ts(save.unlocked 등). 여기에는 판 기록 d2_playlog(측정용, TECH §5)와 예전 d2_unlocked 정리만 남는다
import { LOG } from '../data'
import { parsePlayLog, pushRun, type PlayRun } from '../rules'

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

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // 지우지 못해도 다음 실행에 다시 합칠 뿐이다
  }
}

// 판 기록 d2_playlog. 깨진 저장값은 빈 기록으로 읽고, 쓰기 실패는 조용히 넘긴다
export function loadRuns(): PlayRun[] {
  return parsePlayLog(readKey(LOG.runsKey))
}

export function saveRun(run: PlayRun): void {
  writeKey(LOG.runsKey, JSON.stringify(pushRun(loadRuns(), run)))
}
