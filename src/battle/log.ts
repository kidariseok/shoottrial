import type { GameObjects, Scene } from 'phaser'
import { CARDS, UI } from '../data'
import { summarizeLog, type PlayRun, type RunResult } from '../rules'

const T = UI.text
const L = UI.log
const WORD: Record<RunResult, string> = { win: T.logWin, lose: T.logLose, quit: T.logQuit }

// 초 -> '분 초' 문구
const mmss = (sec: number) => {
  const s = Math.round(sec)
  return `${Math.floor(s / L.secPerMin)}${T.logMin} ${s % L.secPerMin}${T.logSec}`
}
const pct = (r: number) => `${(r * L.pct).toFixed(L.rateDigits)}${T.logPct}`

// ?scene=log: 판을 만들지 않고 기록 표만 캔버스에 그린다. 숫자 상수는 UI.log, 문구는 UI.text
export function drawLog(scene: Scene, runs: PlayRun[]): void {
  let y = L.y
  const text = (x: number, s: string, color: string, px: number = L.px): GameObjects.Text =>
    scene.add.text(x, y, s, { fontFamily: T.fontFamily, fontSize: `${px}px`, color }).setOrigin(0, 0)
  const line = (cells: [number, string][], color: string) => {
    for (const [x, s] of cells) text(x, s, color)
    y += L.lineH
  }

  text(L.x, T.logTitle, T.color, L.titlePx)
  y += L.lineH
  if (runs.length === 0) {
    text(L.x, T.logEmpty, T.labelColor)
    return
  }
  const sum = summarizeLog(runs)
  line([[L.x, T.logRuns], [L.colBuys, String(sum.runs)]], T.color)
  line([[L.x, T.logWinRate], [L.colBuys, pct(sum.winRate)]], T.color)
  line([[L.x, T.logAvgTime], [L.colBuys, mmss(sum.avgSec)]], T.color)
  line([[L.x, T.logAvgWave], [L.colBuys, sum.avgWave.toFixed(L.waveDigits)]], T.color)
  line([[L.x, T.logSupport], [L.colBuys, `${sum.supportAvg.toFixed(L.waveDigits)}${T.logTimes}`]], T.color)
  y += L.blockGap

  line([[L.x, T.logCardHead], [L.colBuys, T.logBuys], [L.colRate, T.logRate]], T.labelColor)
  for (const c of sum.cards) {
    // 낮은 구매율은 노랑 + 문구(색만으로 구별하지 않는다, 붉은색 금지)
    const name = CARDS[c.card].name + (c.low ? T.logLow : '')
    line([[L.x, name], [L.colBuys, String(c.buys)], [L.colRate, pct(c.rate)]], c.low ? L.lowColor : T.color)
  }
  y += L.blockGap

  line([[L.x, T.logRecent]], T.labelColor)
  for (const r of sum.recent) line([[L.x, `${WORD[r.result]}${T.logSep}${T.logWave} ${r.wave}${T.logSep}${mmss(r.sec)}`]], T.color)
}
