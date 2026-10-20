import { Scene, GameObjects } from 'phaser'
import { BATTLE, ECONOMY, ENEMIES, LAYOUT, ROOKIE, UI } from '../data'
import { createRng, debug } from '../debug'
import { defconOf, spawnPlan, type FlowPhase, type SpawnEvent } from '../rules'
import { WAVES } from '../stages'
import { createBoard, deployIndex, type Board } from './board'
import { removeEnemy, spawnEnemy, tickEnemies, type Enemy } from './enemies'
import { fall, laneFlash, shake } from './fx'
import { collectAllies, endWave, startWave } from './units'

export class BattleScene extends Scene {
  // 헤드리스 검증이 읽으므로 모두 public
  public board!: Board
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
  private hud!: GameObjects.Text
  private hudShown = ''
  private goBtn: (GameObjects.Rectangle | GameObjects.Text)[] = []

  constructor() {
    super('battle')
  }

  create() {
    // 화면이 길면 판 전체를 아래로 내린다. 값만 넘기고 좌표 계산은 board.ts가 한다
    const dy = this.scale.height - LAYOUT.baseHeight
    this.cameras.main.setBackgroundColor(UI.colors.bg)
    this.supply = debug.supply ?? ECONOMY.startSupply
    this.wave = Math.min(WAVES.length, Math.max(1, debug.wave ?? 1))
    this.baseHp = BATTLE.baseHp
    this.lineUsed = Array<boolean>(LAYOUT.cols).fill(false)
    this.spawnRand = createRng(debug.seed)
    this.dogRand = createRng(debug.seed + 1)

    // ponytail: 3단계에서 ui.hud()로 대체
    this.hud = this.add.text(UI.supply.x, UI.hud.y, '', {
      fontFamily: UI.text.fontFamily,
      fontSize: `${UI.hud.px}px`,
      color: UI.text.color,
      lineSpacing: UI.hud.gap,
      wordWrap: { width: UI.hud.rightLimit - UI.supply.x },
    })

    this.board = createBoard(this, {
      dy,
      onSell: (refund) => {
        this.supply += refund
      },
    })
    // 신병을 먼저 놓아야 디버그 덱이 같은 칸을 차지하지 않는다
    this.board.place('deploy', deployIndex(ROOKIE.col, ROOKIE.row), { card: ROOKIE.card, rank: 1, name: ROOKIE.name })
    this.board.dealDeck(debug.deck ?? [])

    // ponytail: 3단계에서 ui.shop의 onGo로 대체
    const goX = LAYOUT.width / 2
    const goY = this.board.worldY(LAYOUT.shopY) + UI.go.yOff
    const rect = this.add.rectangle(goX, goY, UI.go.w, UI.go.h, UI.colors.go).setInteractive()
    const label = this.add.text(goX, goY, UI.text.go, { fontFamily: UI.text.fontFamily, fontSize: `${UI.go.px}px`, color: UI.text.color }).setOrigin(0.5)
    this.goBtn = [rect, label]
    rect.on('pointerdown', () => {
      if (this.phase === 'prep' && !this.result) this.startFight()
    })

    this.setSpeed(debug.speed ?? 1)
    this.startPrep()
    this.showHud()
  }

  setSpeed(s: 1 | 2) {
    this.speed = s
    this.tweens.timeScale = s
  }

  startPrep() {
    this.phase = 'prep'
    this.board.setPhase('prep')
    this.prepLeft = this.wave === 1 ? BATTLE.prepFirst : BATTLE.prepNext
    for (const o of this.goBtn) o.setVisible(true)
  }

  startFight() {
    for (const o of this.goBtn) o.setVisible(false)
    this.phase = 'fight'
    this.board.setPhase('fight')
    startWave(collectAllies(this.board))
    this.plan = spawnPlan(this.wave, this.spawnRand, defconOf(this.wave) === 1)
    this.spawned = []
    this.clock = 0
    this.nextIdx = 0
  }

  startSettle() {
    endWave(collectAllies(this.board))
    this.phase = 'settle'
    this.board.setPhase('settle')
    this.settleLeft = BATTLE.settleSec
  }

  update(_time: number, delta: number) {
    if (this.result) return
    const dt = Math.min(delta / 1000, BATTLE.maxDt) * this.speed
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
    this.showHud()
  }

  // 02-05·02-06이 3과 4 사이에 아군 행동·지뢰 호출을 끼운다
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
    if (this.baseHp <= 0) this.finish(false)
    else if (this.nextIdx >= this.plan.length && this.enemies.length === 0) {
      if (this.wave === WAVES.length) this.finish(true)
      else this.startSettle()
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
      this.add.rectangle(top.x, cy, LAYOUT.cell - UI.fx.lineUsedInset * 2, LAYOUT.lineH, UI.colors.lineUsed)
      this.add.text(top.x, cy, UI.text.lineUsed, { fontFamily: UI.text.fontFamily, fontSize: `${UI.fx.lineUsedPx}px`, color: UI.text.color }).setOrigin(0.5)
      return
    }
    if (!debug.god) this.baseHp -= ENEMIES[e.type].baseDmg
    e.gone = true
    removeEnemy(e)
    shake(this, 'light')
  }

  private finish(win: boolean) {
    this.result = win ? 'win' : 'lose'
    this.board.setPhase('settle')
    for (const o of this.goBtn) o.setVisible(false)
    // ponytail: 3단계에서 ui.result()/askRevive로 대체
    this.add
      .text(LAYOUT.width / 2, this.scale.height / 2, win ? UI.text.win : UI.text.lose, {
        fontFamily: UI.text.fontFamily,
        fontSize: `${UI.fx.resultPx}px`,
        color: UI.text.popupColor,
      })
      .setOrigin(0.5)
      .setDepth(UI.fx.dragDepth)
    this.showHud()
  }

  // 문자열이 바뀔 때만 setText
  private showHud() {
    const t = UI.text
    const stage =
      this.phase === 'prep' ? `${t.hudPrep} ${Math.ceil(Math.max(0, this.prepLeft))}${t.hudSec}` : this.phase === 'fight' ? t.hudFight : t.hudSettle
    const line1 = `${t.hudWave} ${this.wave}/${WAVES.length}${t.hudSep}${t.hudDefcon} ${defconOf(this.wave)}`
    const line2 = `${stage}${t.hudSep}${t.hudBase} ${this.baseHp}${t.hudSep}${t.supplyLabel} ${this.supply}`
    const s = `${line1}\n${line2}`
    if (s === this.hudShown) return
    this.hudShown = s
    this.hud.setText(s)
  }
}
