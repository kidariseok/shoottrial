#!/usr/bin/env node
// 튜닝 봇·측정 스크립트 (TUNE-01). 저장소 밖 도구이며 계획 폴더에 보관한다. 새 의존성 없음(Node 내장 WebSocket·fetch).
// 사용: node tune-bot.mjs <vite포트> <모드> [시작시드] [개수]
//   모드: first(초행자 20시드) | god(god=1 5시드) | probe(카드 비교) | baseline(셋 다) | gate(first+god, 종료 코드) | live(실시간 종합 한 판)
// vite가 이미 떠 있으면 그대로 쓰고, 없으면 직접 띄우고 끝날 때 끈다. Chrome은 항상 직접 띄우고 끈다.
// 시드마다 격리된 브라우저 컨텍스트(저장소 분리)를 쓰므로 병렬로 돌려도 d2_playlog/d2_unlocked가 섞이지 않는다.
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// ---- 게이트 기준 (ROADMAP SC5, 03-06 계획) ----
const GATE_GOD_MID_MIN = [6, 10] // god=1 5시드 판 시간 추정 mid의 중앙값(분) 허용 범위
const GATE_FIRST_WAVE_MIN = 5 // 초행자 봇 20시드 도달 웨이브 중앙값 하한
// ---- 측정 설정 ----
const FIRST_SEEDS = 20
const GOD_SEEDS = 5
const PROBE_SEEDS = 8
const MAX_STEPS = 30000 // 판 하나의 걸음 상한(0.1초/걸음). 넘으면 timeout으로 기록
const STALL_SEC = 150 // 한 웨이브 전투가 이 시뮬레이션 초를 넘으면 교착(stall)으로 끊는다. 정상 전투는 35초 안쪽이다
const CONCURRENCY = 4
const PROBES = [
  ['rifle:5 (기준)', 'rifle:5'],
  ['저격수 rifle:2,sniper:1', 'rifle:2,sniper:1'],
  ['제설병 rifle:3,blower:1', 'rifle:3,blower:1'],
  ['취사병 rifle:3,cook:1', 'rifle:3,cook:1'],
  ['지뢰설치병 rifle:3,miner:1', 'rifle:3,miner:1'],
]

const REPO = fileURLToPath(new URL('../../../', import.meta.url))
const SHOTS = REPO + 'docs/shots/'
const PORT = Number(process.argv[2] ?? 5199)
const MODE = process.argv[3] ?? 'baseline'
const SEED0 = Number(process.argv[4] ?? 1)
const COUNT = process.argv[5] ? Number(process.argv[5]) : undefined
const SAFE = process.env.BOT_SAFE === '1' // 진단용: 제설병 단독 열 회피 봇(게이트 판정에는 쓰지 않는다)
const CHROME_PORT = 9337
const BASE = `http://localhost:${PORT}`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------------- 프로세스 ----------------
const procs = []
async function up(url) {
  try {
    return (await fetch(url)).ok
  } catch {
    return false
  }
}
async function startServers() {
  if (!(await up(BASE + '/'))) {
    procs.push(spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: REPO, stdio: 'ignore' }))
    for (let k = 0; k < 100 && !(await up(BASE + '/')); k++) await sleep(200)
    if (!(await up(BASE + '/'))) throw new Error('vite가 뜨지 않았다')
  }
  procs.push(
    spawn(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      ['--headless=old', `--remote-debugging-port=${CHROME_PORT}`, '--user-data-dir=/tmp/gsd0306/profile', '--no-first-run', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--window-size=720,1560', 'about:blank'],
      { stdio: 'ignore' },
    ),
  )
  for (let k = 0; k < 100 && !(await up(`http://localhost:${CHROME_PORT}/json/version`)); k++) await sleep(200)
}
function stopAll() {
  for (const p of procs) p.kill()
}
process.on('exit', stopAll)
process.on('SIGINT', () => process.exit(130))

// ---------------- CDP ----------------
function connect(url) {
  const ws = new WebSocket(url)
  const pend = new Map()
  const errors = []
  let id = 0
  const ready = new Promise((r) => (ws.onopen = r))
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data)
    if (d.id && pend.has(d.id)) {
      pend.get(d.id)(d)
      pend.delete(d.id)
    } else if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text)
    else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push('console.error: ' + d.params.args.map((a) => a.value ?? a.description).join(' '))
  }
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const i = ++id
      pend.set(i, (d) => (d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result)))
      ws.send(JSON.stringify({ id: i, method, params }))
    })
  return { ready, send, errors, close: () => ws.close() }
}

let browserP
async function newContext() {
  browserP ??= (async () => {
    const v = await (await fetch(`http://localhost:${CHROME_PORT}/json/version`)).json()
    const b = connect(v.webSocketDebuggerUrl)
    await b.ready
    return b
  })()
  const browser = await browserP
  const { browserContextId } = await browser.send('Target.createBrowserContext')
  return {
    // 컨텍스트 하나 = 저장소 하나. 같은 컨텍스트의 두 번째 페이지는 첫 페이지의 localStorage를 본다
    async open(path) {
      const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank', browserContextId })
      const c = connect(`ws://localhost:${CHROME_PORT}/devtools/page/${targetId}`)
      await c.ready
      await c.send('Runtime.enable')
      await c.send('Page.enable')
      await c.send('Emulation.setDeviceMetricsOverride', { width: 720, height: 1560, deviceScaleFactor: 1, mobile: false })
      await c.send('Page.navigate', { url: BASE + path })
      const ev = async (expr) => {
        const r = await c.send('Runtime.evaluate', { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true })
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
        return r.result.value
      }
      let ok = false
      for (let k = 0; k < 200 && !ok; k++) {
        try {
          ok = await ev(`const m=await import('/src/main.ts');const s=m.game&&m.game.scene.getScene('battle');window.__S=s;return !!(s&&(s.board||s.logOnly)&&s.sys.isActive())`)
        } catch {}
        if (!ok) await sleep(100)
      }
      if (!ok) throw new Error('씬이 준비되지 않았다: ' + path)
      const n = await ev(`return document.querySelectorAll('canvas').length`)
      if (n !== 1) throw new Error(`캔버스 ${n}개 (1개여야 한다)`)
      return {
        ev,
        errors: c.errors,
        send: c.send,
        close: async () => {
          await browser.send('Target.closeTarget', { targetId }).catch(() => {})
          c.close()
        },
      }
    },
    dispose: () => browser.send('Target.disposeBrowserContext', { browserContextId }).catch(() => {}),
  }
}

// ---------------- 페이지 안에서 도는 봇 ----------------
// Function.toString()으로 통째 보내는 자기완결 함수다. 규칙은 03-CONTEXT "튜닝" 절 그대로.
async function kit(o) {
  const { CARDS, LAYOUT, RANKS } = await import('/src/data.ts')
  const s = window.__S
  const C = LAYOUT.cols
  const R = LAYOUT.deployRows
  const spot = (u) => ({ zone: u.zone, i: u.i })
  // 같은 카드·같은 계급(병장 미만) 두 장: 배치 구역 쪽을 남기고 scene.board.promote(남길 칸, 치울 칸)
  const merges = () => {
    for (;;) {
      const us = s.board.units()
      let did = false
      for (let a = 0; a < us.length && !did; a++)
        for (let b = a + 1; b < us.length && !did; b++) {
          const x = us[a]
          const y = us[b]
          if (x.unit.card !== y.unit.card || x.unit.rank !== y.unit.rank || x.unit.rank >= RANKS.max) continue
          const [keep, gone] = x.zone === 'deploy' || y.zone !== 'deploy' ? [x, y] : [y, x]
          s.board.promote(keep.zone, keep.i, spot(gone))
          did = true
        }
      if (!did) return
    }
  }
  // 대기석 -> 배치 구역 아래 행(row 2)부터 위로, 같은 행은 왼쪽 열부터 빈 칸에 scene.board.move
  // 진단용 o.safeBlower: 제설병(피해 0)은 같은 열에 소총수·저격수·지뢰설치병이 있을 때만 배치한다(제설병만 있는 열의 교착을 피한다)
  const dealer = (c) => s.board.units().some((u) => u.zone === 'deploy' && u.i % C === c && u.unit.card !== 'blower' && u.unit.card !== 'cook')
  const fill = (pickBlower) => {
    for (let r = R - 1; r >= 0; r--)
      for (let c = 0; c < C; c++) {
        const idx = r * C + c
        if (s.board.units().some((u) => u.zone === 'deploy' && u.i === idx)) continue
        const b = s.board.units().find((u) => u.zone === 'bench' && (!o.safeBlower || (u.unit.card === 'blower') === pickBlower) && (!pickBlower || dealer(c)))
        if (!b) continue
        s.board.move({ zone: 'bench', i: b.i }, { zone: 'deploy', i: idx })
      }
  }
  const place = () => {
    fill(false)
    if (o.safeBlower) fill(true)
  }
  // 살 수 있는 가장 싼 카드부터(동가는 왼쪽 칸) scene.buy. 리롤·판매 없음. 보급이 안 줄면(대기석 가득) 멈춘다
  const buyAll = () => {
    if (o.noBuy) return false
    let any = false
    for (;;) {
      let best = -1
      s.store.offers.forEach((c, i) => {
        if (c && CARDS[c].cost <= s.supply && (best < 0 || CARDS[c].cost < CARDS[s.store.offers[best]].cost)) best = i
      })
      if (best < 0) return any
      const before = s.supply
      s.buy(best)
      if (s.supply === before) return any
      any = true
    }
  }
  // 지뢰 토큰: 앞쪽(row 0)부터 왼쪽 열 순
  const bury = () => {
    for (let r = 0; r < LAYOUT.mineRows; r++) for (let c = 0; c < C; c++) if (s.board.tokens() > 0) s.board.bury(c, r)
  }
  return { s, merges, place, buyAll, bury }
}

// 한 판을 걸음으로 끝까지 돌린다(게임을 pause한 상태에서 update(0, 100) 반복)
async function botRun(o) {
  const { BATTLE } = await import('/src/data.ts')
  const { s, merges, place, buyAll, bury } = await kit(o)
  const prep = () => {
    // 사고 -> 합성 -> 배치 -> 합성. 배치로 대기석이 비어 더 살 수 있으면 되풀이한다
    for (let k = 0; k < 20; k++) {
      const bought = buyAll()
      merges()
      place()
      merges()
      if (!bought) break
    }
    bury()
    s.go() // 바로 출동(조기 출동 +1 포함)
  }
  let steps = 0
  let guard = 0
  let stalled = false
  while (!s.result && steps < o.maxSteps) {
    if (s.modal) {
      // 부활 제안은 거절(두 번째 버튼 '포기'): 봇은 순수 전투력을 잰다
      const b = document.querySelectorAll('.ui-modal-backdrop:not(.hidden) .modal-actions button')[1]
      if (!b || ++guard > 50) throw new Error('부활 모달 버튼을 못 찾았다')
      b.click()
      continue
    }
    if (s.phase === 'prep') {
      prep()
      continue
    }
    s.update(0, 100)
    steps++
    if (s.phase === 'fight' && s.clock > o.stallSec) {
      stalled = true // 제설병만 있는 열의 적 한 마리가 밀려나기만 하는 식의 교착: 사람도 포기 말고는 방법이 없다
      break
    }
  }
  const buys = {}
  for (const e of s.runEvents) if (e.e === 'card_buy') buys[e.card] = (buys[e.card] ?? 0) + 1
  return { result: stalled ? 'stall' : s.result, wave: s.wave, wallSec: s.wallSec, kills: s.kills, baseHp: s.baseHp, steps, buys, timedOut: !s.result && !stalled, left: s.enemies.length, prepFirst: BATTLE.prepFirst, prepNext: BATTLE.prepNext }
}

async function runSeed(path, opts = {}) {
  const ctx = await newContext()
  const p = await ctx.open(path)
  try {
    await p.ev(`window.__S.game.scene.pause('battle')`)
    const r = await p.ev(`const kit = ${kit.toString()}; return await (${botRun.toString()})(${JSON.stringify({ noBuy: false, maxSteps: MAX_STEPS, stallSec: STALL_SEC, safeBlower: SAFE, ...opts })})`)
    if (p.errors.length) r.errors = p.errors.slice()
    return r
  } finally {
    await p.close()
    await ctx.dispose()
  }
}

// 시간 추정(CONTEXT): 봇은 항상 바로 출동하므로 wallSec이 하한(fast). 준비 시간 상한 합 = prepFirst + prepNext x (도달 웨이브 - 1)
function est(r) {
  const prep = r.prepFirst + r.prepNext * (r.wave - 1)
  return { fast: r.wallSec, mid: r.wallSec + prep / 2, slow: r.wallSec + prep }
}
const median = (a) => {
  const s = [...a].sort((x, y) => x - y)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const mm = (sec) => (sec / 60).toFixed(2)
const buysText = (b) => Object.entries(b).map(([k, v]) => `${k}${v}`).join(' ') || '-'

async function pool(jobs, n = CONCURRENCY) {
  const out = new Array(jobs.length)
  let next = 0
  await Promise.all(
    Array.from({ length: n }, async () => {
      for (let i = next++; i < jobs.length; i = next++) out[i] = await jobs[i]()
    }),
  )
  return out
}

// ---------------- 측정 ----------------
async function first(count = COUNT ?? FIRST_SEEDS, s0 = SEED0) {
  const seeds = Array.from({ length: count }, (_, k) => s0 + k)
  const rs = await pool(seeds.map((s) => () => runSeed(`/?scene=battle&seed=${s}`)))
  console.log('\n### 초행자 봇 (저장소 비움, 기본 해금)\n')
  console.log('| 시드 | 결과 | 도달 웨이브 | wallSec(fast) | 처치 | 위병소 HP | mid(분) | slow(분) | 걸음 | 구매 |')
  console.log('|---|---|---|---|---|---|---|---|---|---|')
  rs.forEach((r, k) => {
    const e = est(r)
    console.log(`| ${seeds[k]} | ${r.timedOut ? 'timeout' : r.result} | ${r.wave} | ${r.wallSec.toFixed(1)} | ${r.kills} | ${Math.max(0, r.baseHp)} | ${mm(e.mid)} | ${mm(e.slow)} | ${r.steps} | ${buysText(r.buys)} |`)
  })
  const waves = rs.map((r) => r.wave)
  const sum = {}
  for (const r of rs) for (const [k, v] of Object.entries(r.buys)) sum[k] = (sum[k] ?? 0) + v
  const dist = {}
  for (const w of waves) dist[w] = (dist[w] ?? 0) + 1
  console.log(`\n도달 웨이브 중앙값 ${median(waves)}, 분포 ${JSON.stringify(dist)}, 승리 ${rs.filter((r) => r.result === 'win').length}/${rs.length}, timeout ${rs.filter((r) => r.timedOut).length}`)
  console.log(`wallSec 중앙값 ${median(rs.map((r) => r.wallSec)).toFixed(1)}, fast ${mm(median(rs.map((r) => est(r).fast)))}분, mid ${mm(median(rs.map((r) => est(r).mid)))}분, slow ${mm(median(rs.map((r) => est(r).slow)))}분`)
  console.log(`카드별 구매 합(참고용): ${buysText(sum)}`)
  const errs = rs.flatMap((r) => r.errors ?? [])
  if (errs.length) console.log('페이지 오류', errs.slice(0, 3))
  return { waves, rs, medianWave: median(waves) }
}

async function god(count = GOD_SEEDS, s0 = 1) {
  const seeds = Array.from({ length: count }, (_, k) => s0 + k)
  const rs = await pool(seeds.map((s) => () => runSeed(`/?scene=battle&seed=${s}&god=1`)))
  console.log('\n### god=1 봇 (끝까지 가는 판)\n')
  console.log('| 시드 | 결과 | 도달 웨이브 | wallSec(fast) | fast(분) | mid(분) | slow(분) | 걸음 | 구매 |')
  console.log('|---|---|---|---|---|---|---|---|---|')
  rs.forEach((r, k) => {
    const e = est(r)
    console.log(`| ${seeds[k]} | ${r.timedOut ? 'timeout' : r.result} | ${r.wave} | ${r.wallSec.toFixed(1)} | ${mm(e.fast)} | ${mm(e.mid)} | ${mm(e.slow)} | ${r.steps} | ${buysText(r.buys)} |`)
  })
  const mids = rs.map((r) => est(r).mid / 60)
  console.log(`\nfast 중앙값 ${mm(median(rs.map((r) => est(r).fast)))}분, mid 중앙값 ${median(mids).toFixed(2)}분, slow 중앙값 ${mm(median(rs.map((r) => est(r).slow)))}분, 모두 승리 ${rs.every((r) => r.result === 'win')}`)
  const errs = rs.flatMap((r) => r.errors ?? [])
  if (errs.length) console.log('페이지 오류', errs.slice(0, 3))
  return { rs, midMedianMin: median(mids) }
}

async function probe() {
  console.log('\n### 카드 비교 (supply=0, 구매 없음, 시드 1..8 중앙값. 참고용: 시너지·조합 가치와 구매율은 G1 사람 확인)\n')
  console.log('| 덱 | 도달 웨이브 중앙값 | 시드별 도달 웨이브 |')
  console.log('|---|---|---|')
  for (const [label, deck] of PROBES) {
    const seeds = Array.from({ length: PROBE_SEEDS }, (_, k) => k + 1)
    const rs = await pool(seeds.map((s) => () => runSeed(`/?scene=battle&seed=${s}&supply=0&deck=${deck}`, { noBuy: true })))
    const w = rs.map((r) => r.wave)
    console.log(`| ${label} | ${median(w)} | ${w.join(', ')} |`)
  }
}

async function main() {
  await startServers()
  if (MODE === 'first') await first()
  else if (MODE === 'god') await god()
  else if (MODE === 'probe') await probe()
  else if (MODE === 'baseline') {
    await first()
    await god()
    await probe()
  } else if (MODE === 'gate') {
    const f = await first()
    const g = await god()
    const pass = f.medianWave >= GATE_FIRST_WAVE_MIN && g.midMedianMin >= GATE_GOD_MID_MIN[0] && g.midMedianMin <= GATE_GOD_MID_MIN[1]
    console.log(`GATE firstTimerMedianWave=${f.medianWave} godMidMedianMin=${g.midMedianMin.toFixed(2)} pass=${pass}`)
    process.exitCode = pass ? 0 : 1
  } else if (MODE === 'live') await live()
  else throw new Error('모드를 모르겠다: ' + MODE)
}

// live 모드는 실시간 종합 한 판(성공 기준 1~4)이다. Task 2에서 채운다.
async function live() {
  throw new Error('live 모드는 아직 없다')
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 2
  })
  .finally(() => {
    stopAll()
    setTimeout(() => process.exit(), 300)
  })
