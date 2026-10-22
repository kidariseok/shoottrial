import { Scene, type GameObjects, type Input } from 'phaser'
import { BATTLE, CARD_KEYS, CARDS, ECONOMY, ENEMIES, GRID, LAYOUT, REWARD, ROOKIE, RUN, SUPPORT, UI, UNLOCK, type CardKey } from '../data'
import { createRng, debug } from '../debug'
import { colAt, defconOf, gasPlan, hasAntiTank, income, mineTokens, nextRun, nextUnlock, spawnPlan, synergies, type FlowPhase, type GasDrop, type LogEvent, type RunResult, type SpawnEvent } from '../rules'
import { WAVES } from '../stages'
import * as ui from '../ui/screens'
import { art, loadArt, setupArt } from './art'
import { armGas, clearGas, createGas, tickGas, type Gas } from './gas'
import { createBoard, deployIndex, type Board } from './board'
import { drawLog } from './log'
import { hurtEnemy, removeEnemy, spawnEnemy, tickEnemies, tickMines, type Enemy } from './enemies'
import { colBand, explosion, fall, laneFlash, shake } from './fx'
import { loadRuns, loadUnlocked, saveRun, saveUnlocked } from './persist'
import { buyCard, createShop, refill, toOffers, useAdReroll, useAdSupply, type Shop } from './shop'
import { collectAllies, endWave, startWave, tickAllies } from './units'

// ponytail: 같은 시드로 재시작해도 판마다 다른 시퀀스. 디버그에서 두 번째 판을 재현하려면 페이지를 새로 연다
let runsThisPage = 0

export class BattleScene extends Scene {
  // 헤드리스 검증이 읽으므로 모두 public
  public board!: Board
  public art = art // 실제 그림이 있는 키(없는 키는 도형). 헤드리스가 읽는다
  public phase: FlowPhase = 'prep'
  public wave = 1
  public baseHp = 0
  public supply = 0
  public speed: 1 | 2 = 1
  public kills = 0
  public result: 'win' | 'lose' | null = null
  public enemies: Enemy[] = []
  public plan: SpawnEvent[] = []
  public spawned: SpawnEvent[] = []
  public lineUsed: boolean[] = []
  public prepLeft = 0
  public settleLeft = 0
  public clock = 0
  public nextIdx = 0
  private spawnRand!: () => number
  private dogRand!: () => number
  private gasRand!: () => number
  public gas!: Gas
  public gasDrops: GasDrop[] = [] // 이번 웨이브 화학탄 일정(헤드리스가 읽는다)
  public gasExtra = 0 // ?gas=N: 웨이브마다 화학탄 N회 추가
  // 화력 지원(GDD §5.8): picking 남은 초(0이면 고르는 중 아님), strikes 예약된 포격
  public support = 0
  public picking = 0
  public strikes: { col: number; left: number; line: GameObjects.Rectangle }[] = []
  private pickBands: GameObjects.Rectangle[] = []
  public paused = false
  public hudCalls = 0 // ui.hud를 실제로 부른 횟수(헤드리스가 읽는다)
  private hudKey = ''
  public store!: Shop
  public unlocked: CardKey[] = []
  public pool: CardKey[] = [] // 이 준비 단계의 상점 풀(해금이 생겨도 현재 단계에는 반영하지 않는다)
  public newUnlock: CardKey | null = null
  public modal = false // 부활 제안이 떠 있는 동안 전투 정지
  public reviveUsed = false
  public gaveUp = false // 포기로 끝났는가(03-05 기록이 쓴다)
  private lineMarks: GameObjects.GameObject[] = [] // 최후 저지선 소진 표시(부활 때 지운다)
  private shopKey = ''
  // 판 기록(GDD §11). Phaser Scene.events를 덮지 않도록 runEvents로 짓는다
  public runEvents: LogEvent[] = []
  public logOnly = false // ?scene=log: 판 없이 기록 표만
  public wallSec = 0 // 일시정지·모달을 뺀 실제 경과 초(배속 무관)

  constructor() {
    super('battle')
  }

  // 클래스 필드 초기값은 생성자에서 한 번만 돈다. 씬 재시작은 create만 다시 부르므로 판 상태는 여기서 전부 되돌린다
  private resetRun() {
    this.phase = 'prep'
    this.wave = Math.min(WAVES.length, Math.max(1, debug.wave ?? 1))
    this.baseHp = BATTLE.baseHp
    this.supply = debug.supply ?? ECONOMY.startSupply
    this.kills = 0
    this.result = null
    this.enemies = []
    this.plan = []
    this.spawned = []
    this.gasDrops = []
    this.picking = 0
    this.strikes = []
    this.pickBands = []
    // ponytail: 게이트 때 debug.ts로 옮긴다
    const sup = new URLSearchParams(location.search).get('support')
    this.support = sup === null ? SUPPORT.charges : Number(sup) || 0
    this.lineUsed = Array<boolean>(LAYOUT.cols).fill(false)
    this.prepLeft = 0
    this.settleLeft = 0
    this.clock = 0
    this.nextIdx = 0
    this.paused = false
    this.modal = false
    this.reviveUsed = false
    this.gaveUp = false
    this.newUnlock = null
    this.lineMarks = []
    this.shopKey = ''
    this.runEvents = []
    this.wallSec = 0
    this.hudKey = ''
    this.hudCalls = 0
    this.tweens.resumeAll()
  }

  private log(ev: LogEvent) {
    this.runEvents.push(ev)
  }

  // 웨이브 클리어 기록. 정산 수입을 더하기 전 값이다
  private clearWave() {
    this.log({ e: 'wave_clear', wave: this.wave, base_hp: Math.max(0, this.baseHp), supply: this.supply })
  }

  preload() {
    loadArt(this)
  }

  create() {
    if (debug.scene === 'log') {
      this.logOnly = true
      this.cameras.main.setBackgroundColor(UI.colors.bg)
      drawLog(this, loadRuns())
      return
    }
    this.logOnly = false
    setupArt(this)
    this.resetRun()
    this.log({ e: 'run_start', run: nextRun(loadRuns()) })
    // 화면이 길면 판 전체를 아래로 내린다. 값만 넘기고 좌표 계산은 board.ts가 한다
    const dy = this.scale.height - LAYOUT.baseHeight
    this.cameras.main.setBackgroundColor(UI.colors.bg)
    const base = debug.seed + runsThisPage * RUN.reseedStep
    runsThisPage += 1
    this.spawnRand = createRng(base)
    this.dogRand = createRng(base + 1)
    this.gasRand = createRng(base + RUN.gasSeed)
    // ponytail: 게이트 때 debug.ts로 옮긴다
    this.gasExtra = Number(new URLSearchParams(location.search).get('gas') ?? 0) || 0
    this.unlocked = loadUnlocked(debug.unlock === 'all')
    this.store = createShop(base + 2)

    this.board = createBoard(this, {
      dy,
      onSell: (refund) => {
        this.supply += refund
      },
      onMerge: (card, rank) => this.log({ e: 'merge', card, rank }),
      onHold: (u) => {
        if (u) ui.cardInfo(u.card, u.rank)
        else ui.cardInfo(null)
      },
    })
    // 신병을 먼저 놓아야 디버그 덱이 같은 칸을 차지하지 않는다
    this.board.place('deploy', deployIndex(ROOKIE.col, ROOKIE.row), { card: ROOKIE.card, rank: 1, name: ROOKIE.name })
    this.gas = createGas(this, this.board)
    this.board.dealDeck(debug.deck ?? [])

    this.setSpeed(debug.speed ?? 1)
    ui.bindBattle({
      pause: () => this.pause(),
      resume: () => this.resume(),
      setSpeed: (s) => this.setSpeed(s),
      quit: () => this.quit(),
      adReroll: () => this.adReroll(),
      adSupply: () => this.adSupply(),
      fireSupport: () => this.fireSupport(),
    })
    this.input.on('pointerdown', (p: Input.Pointer) => {
      if (this.picking > 0) this.pickColumn(colAt(p.worldX))
    })
    this.events.once('shutdown', () => {
      ui.bindBattle(null)
      ui.cardInfo(null)
    })
    this.startPrep()
    this.syncHud()
  }

  pause() {
    if (this.result) return
    this.paused = true
    this.tweens.pauseAll()
  }

  resume() {
    this.paused = false
    this.tweens.resumeAll()
  }

  // 포기
  quit() {
    this.resume() // 트윈이 멈춘 채 결과로 가지 않게
    this.gaveUp = true
    this.finish(false)
  }

  // 광고 자체는 M4에서 B가 연결, 여기서는 보상만 적용
  adReroll() {
    if (this.phase !== 'prep' || this.result || !useAdReroll(this.store)) return
    refill(this.store, this.pool)
    this.syncShop()
  }

  adSupply() {
    if (this.result || !useAdSupply(this.store)) return
    this.supply += REWARD.adSupplyAmount
  }

  setSpeed(s: 1 | 2) {
    this.speed = s
    this.tweens.timeScale = s
  }

  startPrep() {
    this.phase = 'prep'
    this.board.setPhase('prep')
    // 지뢰설치병 수·계급·시너지로 이번 준비 단계 토큰이 정해진다(MINE-01)
    const miners = this.board.deployed().filter((d) => d.unit.card === 'miner').map((d) => ({ rank: d.unit.rank }))
    const anti = hasAntiTank(miners)
    this.board.setTokens(mineTokens(miners), anti)
    this.prepLeft = this.wave === 1 ? BATTLE.prepFirst : BATTLE.prepNext
    if (this.wave === 1) ui.banner(UI.text.bannerIntro, 'info')
    this.pool = this.unlocked
    refill(this.store, this.pool) // 준비 단계마다 무료로 새로 채운다
    if (this.wave === UNLOCK.atWave) this.unlockNext() // 새 카드는 다음 준비 단계 풀부터
    this.syncShop()
  }

  // 웨이브 5 도달 해금. unlocked를 새 배열로 바꾸므로 pool(이번 단계 스냅샷)은 그대로다
  private unlockNext() {
    const next = nextUnlock(this.unlocked)
    if (!next) return
    this.unlocked = CARD_KEYS.filter((k) => this.unlocked.includes(k) || k === next)
    saveUnlocked(this.unlocked)
    this.newUnlock = next
    this.log({ e: 'unlock', card: next, via: 'wave5' })
    ui.banner(`${UI.text.bannerUnlock}: ${CARDS[next].name}`, 'info')
  }

  startFight() {
    this.phase = 'fight'
    this.board.setPhase('fight')
    this.board.setTokens(0, false) // 쓰지 않은 토큰은 사라지고 묻힌 지뢰는 남는다
    startWave(collectAllies(this.board))
    this.plan = spawnPlan(this.wave, this.spawnRand, defconOf(this.wave) === 1)
    this.gasDrops = gasPlan(this.wave, this.plan, this.gasRand, this.gasExtra)
    armGas(this.gas, this.gasDrops)
    this.spawned = []
    this.clock = 0
    this.nextIdx = 0
    if (WAVES[this.wave - 1]?.flag) ui.banner(UI.text.bannerFlag, 'flag')
    else if (this.wave === BATTLE.defcon1From) {
      ui.banner(UI.text.bannerDefcon, 'defcon')
      shake(this, 'heavy')
    }
    this.syncShop()
  }

  // 상점 패널. 값이 바뀔 때만 ui.shop을 부른다(부를 때마다 5칸을 새로 그린다)
  syncShop() {
    const open = this.phase === 'prep' && !this.result
    const key = `${open}|${this.supply}|${this.store.offers.join(',')}`
    if (key === this.shopKey) return
    this.shopKey = key
    ui.shop(open, toOffers(this.store), this.supply, (i) => this.buy(i), () => this.reroll(), () => this.go())
  }

  buy(i: number) {
    if (this.phase !== 'prep' || this.result) return
    const r = buyCard(this.store, this.board, i, this.supply)
    if (r.kind === 'poor') ui.banner(UI.text.bannerPoor, 'info')
    else if (r.kind === 'full') ui.banner(UI.text.bannerBenchFull, 'info')
    else if ((r.kind === 'bench' || r.kind === 'merge') && r.card) {
      this.supply -= r.cost
      this.log({ e: 'card_buy', card: r.card, rank: 1 })
    }
    this.syncShop()
  }

  reroll() {
    if (this.phase !== 'prep' || this.result) return
    if (this.supply < ECONOMY.rerollCost) return ui.banner(UI.text.bannerPoor, 'info')
    this.supply -= ECONOMY.rerollCost
    refill(this.store, this.pool)
    this.syncShop()
  }

  // 출동!: 준비 시간이 남은 채 누르면 조기 출동 보너스
  go() {
    if (this.phase !== 'prep' || this.result) return
    this.supply += ECONOMY.earlyBonus
    this.startFight()
  }

  // 화력 지원 열 고르기(전투 단계, 남은 횟수가 있을 때). 5열 강조 + 카드 입력 잠금
  fireSupport() {
    if (this.phase !== 'fight' || this.result || this.support <= 0 || this.picking > 0) return
    this.picking = SUPPORT.pickSec
    const y0 = this.board.worldY(LAYOUT.entryY)
    const y1 = this.board.worldY(LAYOUT.lineY)
    for (let c = 0; c < LAYOUT.cols; c++) this.pickBands.push(colBand(this, this.board.toScreen(c, 0).x, y0, y1, LAYOUT.cell, UI.colors.supportPick, UI.fx.supportPickAlpha))
    this.board.lock(true)
  }

  // 열 확정. 판 밖(-1)이면 취소하고 횟수는 그대로
  pickColumn(col: number) {
    if (this.picking <= 0) return
    this.endPick()
    if (col < 0) return
    this.support -= 1
    const line = colBand(this, this.board.toScreen(col, 0).x, this.board.worldY(LAYOUT.entryY), this.board.worldY(LAYOUT.lineY), UI.fx.supportLineW, UI.colors.supportWarn, UI.fx.supportLineAlpha)
    this.strikes.push({ col, left: SUPPORT.delay, line })
  }

  private endPick() {
    this.picking = 0
    for (const b of this.pickBands) b.destroy()
    this.pickBands = []
    this.board.lock(false)
  }

  // 전투가 끝나면 고르기·남은 포격을 버린다(줄어든 횟수는 돌려주지 않는다)
  private endSupport() {
    this.endPick()
    for (const s of this.strikes) s.line.destroy()
    this.strikes = []
  }

  // dt는 배속·일시정지가 반영된 값. 고르기 제한과 포격 지연을 줄이고, 때가 되면 포격한다
  private tickSupport(dt: number) {
    if (this.picking > 0) {
      this.picking -= dt
      if (this.picking <= 0) this.endPick()
    }
    for (const s of this.strikes) s.left -= dt
    for (const s of this.strikes.filter((s) => s.left <= 0)) this.strike(s.col, s.line)
    this.strikes = this.strikes.filter((s) => s.left > 0)
  }

  // 그 열의 살아 있는 적 전부에게 피해. 처치 수는 기존 정리 단계가 센다
  private strike(col: number, line: GameObjects.Rectangle) {
    line.destroy()
    let kills = 0
    for (const e of this.enemies) {
      if (e.col !== col || e.gone || e.hp <= 0) continue
      hurtEnemy(this, e, SUPPORT.damage)
      if (e.hp <= 0) kills += 1
    }
    for (let r = 0; r < GRID.lineY; r++) explosion(this, this.board.toScreen(col, r + 0.5).x, this.board.toScreen(col, r + 0.5).y, LAYOUT.cell)
    shake(this, 'heavy')
    this.log({ e: 'fire_support', wave: this.wave, col, kills })
  }

  startSettle() {
    this.clearWave()
    this.endSupport()
    clearGas(this.gas)
    endWave(collectAllies(this.board))
    this.phase = 'settle'
    this.board.setPhase('settle')
    this.settleLeft = BATTLE.settleSec
    // 이자는 정산 시점 보급 기준. 마지막 웨이브 승리는 이 함수를 거치지 않는다
    this.supply += income({ supply: this.supply, flag: WAVES[this.wave - 1]?.flag ?? false, early: false })
    this.syncShop()
  }

  update(_time: number, delta: number) {
    if (this.logOnly || this.result || this.paused || this.modal) return
    const real = Math.min(delta / 1000, BATTLE.maxDt)
    this.wallSec += real
    const dt = real * this.speed
    switch (this.phase) {
      case 'prep':
        this.prepLeft -= dt
        if (this.prepLeft <= 0) this.startFight()
        break
      case 'fight':
        this.fightTick(dt)
        break
      case 'settle':
        this.settleLeft -= dt
        if (this.settleLeft <= 0) {
          this.wave += 1
          this.startPrep()
        }
        break
    }
    this.syncHud()
    this.syncShop()
  }

  private fightTick(dt: number) {
    // 1. 출현
    this.clock += dt
    for (let ev = this.plan[this.nextIdx]; ev && ev.t <= this.clock; ev = this.plan[this.nextIdx]) {
      this.enemies.push(spawnEnemy(this, this.board, ev, this.wave))
      this.spawned.push(ev)
      this.nextIdx += 1
    }
    // 2. 아군 수집(매 틱 새로)
    const allies = collectAllies(this.board)
    // 3. 적 행동, 방어선 도달 처리
    const reached = tickEnemies({ scene: this, board: this.board, enemies: this.enemies, allies, dogRand: this.dogRand }, dt)
    for (const e of reached) this.reachLine(e)
    tickGas({ scene: this, board: this.board, gas: this.gas, allies, wave: this.wave, log: (ev) => this.log(ev) }, this.clock, dt)
    tickAllies({ scene: this, board: this.board, enemies: this.enemies, allies, defcon1: defconOf(this.wave) === 1, gas: this.gas.cells }, dt)
    // 지뢰: 아군 사격 뒤, 정리 전(터진 지뢰의 사망도 같은 틱 정리가 센다)
    tickMines({ scene: this, board: this.board, enemies: this.enemies })
    this.tickSupport(dt)
    // 4. 정리
    this.enemies = this.enemies.filter((e) => {
      if (e.gone) {
        removeEnemy(e)
        return false
      }
      if (e.hp <= 0) {
        this.kills += 1
        this.tweens.killTweensOf(e.view)
        fall(this, e.view)
        return false
      }
      return true
    })
    // 5. 종료 판정
    if (this.baseHp <= 0) this.onBaseDown()
    else if (this.nextIdx >= this.plan.length && this.enemies.length === 0) {
      if (this.wave === WAVES.length) {
        this.clearWave()
        this.finish(true)
      } else this.startSettle()
    }
  }

  // 방어선에 닿은 적: 열마다 처음 한 번은 최후 저지선, 이후에는 위병소 피해
  private reachLine(e: Enemy) {
    if (e.gone) return
    if (!this.lineUsed[e.col]) {
      this.lineUsed[e.col] = true
      for (const o of this.enemies) {
        if (o.col !== e.col || o.gone || o.hp <= 0) continue
        o.gone = true
        removeEnemy(o)
      }
      e.gone = true
      removeEnemy(e)
      const top = this.board.toScreen(e.col, 0)
      const lineY = this.board.worldY(LAYOUT.lineY)
      laneFlash(this, top.x, top.y, lineY)
      shake(this, 'heavy')
      // 방어선 띠 위 그 열 칸에 소진 표시
      const cy = lineY + LAYOUT.lineH / 2
      const box = this.add.rectangle(top.x, cy, LAYOUT.cell - UI.fx.lineUsedInset * 2, LAYOUT.lineH, UI.colors.lineUsed)
      const label = this.add.text(top.x, cy, UI.text.lineUsed, { fontFamily: UI.text.fontFamily, fontSize: `${UI.fx.lineUsedPx}px`, color: UI.text.color }).setOrigin(0.5)
      this.lineMarks.push(box, label)
      return
    }
    if (!debug.god) this.baseHp -= ENEMIES[e.type].baseDmg
    e.gone = true
    removeEnemy(e)
    shake(this, 'light')
  }

  // 위병소 HP 0: 판당 한 번 부활을 묻는다. 묻는 동안 전투와 트윈이 멈춘다
  private onBaseDown() {
    if (this.reviveUsed) return this.finish(false)
    this.reviveUsed = true
    this.modal = true
    this.tweens.pauseAll()
    // 광고는 M4에서 B가 연결. 지금은 예 = 바로 부활
    ui.askRevive(
      () => this.revive(),
      () => {
        this.modal = false
        this.tweens.resumeAll()
        this.finish(false)
      },
    )
  }

  private revive() {
    this.baseHp = REWARD.reviveHp
    this.lineUsed = this.lineUsed.map(() => false)
    for (const o of this.lineMarks) o.destroy()
    this.lineMarks = []
    this.modal = false
    this.tweens.resumeAll()
    ui.banner(UI.text.bannerRevive, 'info')
  }

  private finish(win: boolean) {
    if (this.result) return
    this.result = win ? 'win' : 'lose'
    this.endSupport()
    clearGas(this.gas)
    const kind: RunResult = this.gaveUp ? 'quit' : win ? 'win' : 'lose'
    const sec = Math.round(this.wallSec)
    this.log({ e: 'run_end', result: kind, wave: this.wave, sec })
    saveRun({ t: Date.now(), result: kind, wave: this.wave, sec, events: this.runEvents })
    this.board.setPhase('settle')
    this.syncShop()
    this.syncHud()
    ui.bindBattle(null)
    // ponytail: M3 로비가 생기면 onLobby를 로비 씬으로
    ui.result(
      { win, wave: this.wave, kills: this.kills, unlocked: this.newUnlock ?? undefined },
      () => this.scene.restart(),
      () => this.scene.restart(),
    )
  }

  // HUD. 값이 바뀔 때만 ui.hud를 부른다(준비 초는 올림 정수라 소수 초가 값 변화로 잡히지 않는다)
  private syncHud() {
    const h: ui.Hud = {
      wave: this.wave,
      waves: WAVES.length,
      defcon: defconOf(this.wave),
      supply: this.supply,
      baseHp: Math.max(0, this.baseHp),
      phase: this.phase,
      prepLeft: this.phase === 'prep' ? Math.ceil(Math.max(0, this.prepLeft)) : 0,
      speed: this.speed,
      synergies: synergies(this.board.deployed().map((d) => d.unit.card)),
      support: this.support,
    }
    const key = JSON.stringify(h)
    if (key === this.hudKey) return
    this.hudKey = key
    this.hudCalls += 1
    ui.hud(h)
  }
}
