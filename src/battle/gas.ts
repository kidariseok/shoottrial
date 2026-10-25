import type { Scene, GameObjects } from 'phaser'
import { FX, GAS, LAYOUT, UI } from '../data'
import { allyY, chemInterval, cleanseCells, emptyGas, gasCellsAfterDrop, gasHits, synergyTier, type Chem, type GasDrop, type LogEvent } from '../rules'
import type { Board, Unit } from './board'
import { hasArt } from './art'
import { burst, shake } from './fx'
import { chemsOf, damageAlly, synergyCounts, type Ally } from './units'

// 가스 상태. 클래스 없이 상태 객체 + 모듈 함수로 둔다(AGENTS 코드 원칙)
export type Gas = {
  cells: number[][] // 배치 구역 3행x5열, 칸마다 남은 초(0 = 없음)
  drops: GasDrop[] // 이번 웨이브 화학탄 일정
  next: number // 다음에 떨어질 인덱스
  warned: number // 다음에 예고할 인덱스
  warns: GameObjects.Rectangle[] // 떠 있는 예고(떨어지면 destroy)
  tiles: (GameObjects.Rectangle | GameObjects.Sprite)[][] // 칸 표시(미리 만들고 visible만 바꾼다)
  cd: Map<Unit, number> // 화학병별 제독 남은 초
  puff: number // 다음 연기 피어오름까지 남은 초
}

export function createGas(scene: Scene, board: Board): Gas {
  const tiles = emptyGas().map((rowCells, row) =>
    rowCells.map((_, col) => {
      const p = board.toScreen(col, allyY(row))
      // 가스 그림이 있으면 칸 크기로 맞춘 반복 애니메이션, 없으면 반투명 사각형
      if (hasArt('fx_gas')) return scene.add.sprite(p.x, p.y, 'fx_gas', 0).setDisplaySize(LAYOUT.cell, LAYOUT.cell).setDepth(UI.gas.depth).setVisible(false).play('fx_gas')
      return scene.add.rectangle(p.x, p.y, LAYOUT.cell, LAYOUT.cell, UI.colors.gas, UI.gas.alpha).setDepth(UI.gas.depth).setVisible(false)
    }),
  )
  return { cells: emptyGas(), drops: [], next: 0, warned: 0, warns: [], tiles, cd: new Map(), puff: 0 }
}

function dropWarns(g: Gas, scene: Scene): void {
  for (const w of g.warns) {
    scene.tweens.killTweensOf(w)
    w.destroy()
  }
  g.warns = []
}

// 웨이브 시작: 새 일정으로 바꾸고 남은 예고·제독 타이머를 비운다
export function armGas(g: Gas, drops: GasDrop[]): void {
  const scene = g.tiles[0]?.[0]?.scene
  if (scene) dropWarns(g, scene)
  g.drops = drops
  g.next = 0
  g.warned = 0
  g.cd.clear()
}

// 예고: 2x2 중심(왼쪽 위 칸과 오른쪽 아래 칸 중심의 가운데)에 붉은 반투명 사각이 점멸한다
function showWarn(g: Gas, scene: Scene, board: Board, d: GasDrop): void {
  const a = board.toScreen(d.col, allyY(d.row))
  const b = board.toScreen(d.col + GAS.size - 1, allyY(d.row + GAS.size - 1))
  const side = GAS.size * LAYOUT.cell
  const r = scene.add
    .rectangle((a.x + b.x) / 2, (a.y + b.y) / 2, side, side, UI.colors.gasWarn, UI.gas.warnAlpha)
    .setDepth(UI.fx.fxDepth)
  scene.tweens.add({ targets: r, alpha: 0, duration: UI.gas.blinkMs, yoyo: true, repeat: -1 })
  g.warns.push(r)
}

// 전투 한 틱: 예고 -> 떨어짐 -> 시간 -> 제독 -> 피해 -> 표시
export function tickGas(
  ctx: { scene: Scene; board: Board; gas: Gas; allies: Ally[]; wave: number; log: (ev: LogEvent) => void },
  clock: number,
  dt: number,
): void {
  const { scene, board, gas: g, allies } = ctx
  // 1. 예고
  for (let d = g.drops[g.warned]; d && d.t - GAS.warn <= clock; d = g.drops[g.warned]) {
    showWarn(g, scene, board, d)
    g.warned += 1
  }
  // 2. 떨어짐
  for (let d = g.drops[g.next]; d && d.t <= clock; d = g.drops[g.next]) {
    const w = g.warns.shift()
    if (w) {
      scene.tweens.killTweensOf(w)
      w.destroy()
    }
    const synergyOn = synergyTier('chem', synergyCounts(allies).chem) >= 1
    const r = gasCellsAfterDrop(g.cells, d, chemsOf(allies), synergyOn)
    g.cells = r.cells
    ctx.log({ e: 'gas_drop', wave: ctx.wave, col: d.col, row: d.row })
    if (r.cleared > 0) ctx.log({ e: 'gas_clear', n: r.cleared })
    shake(scene, 'light')
    g.next += 1
  }
  // 3. 시간
  g.cells = g.cells.map((row) => row.map((v) => Math.max(0, v - dt)))
  // 4. 제독: 화학병마다 주기로 범위 안 가스를 지운다
  // ponytail: 기절 중에도 제독 타이머는 흐른다, 어색하면 stun 동안 멈춘다
  const chems = chemsOf(allies)
  for (const a of allies) {
    if (a.unit.card !== 'chem' || !a.combat.alive) continue
    const left = (g.cd.get(a.unit) ?? chemInterval(a.unit.spec)) - dt
    if (left > 0) {
      g.cd.set(a.unit, left)
      continue
    }
    const chem: Chem = { col: a.col, row: a.row, rank: a.unit.rank, spec: a.unit.spec }
    const r = cleanseCells(g.cells, chem)
    g.cells = r.cells
    if (r.n > 0) ctx.log({ e: 'gas_clear', n: r.n })
    g.cd.set(a.unit, chemInterval(a.unit.spec))
  }
  // 5. 피해: 면역 아닌 가스 칸 위 아군은 조용히 피해를 받는다
  for (const a of allies) if (a.combat.alive && gasHits(g.cells, chems, a.col, a.row)) damageAlly(scene, a, GAS.dps * dt, true)
  // 6. 표시
  g.tiles.forEach((rowTiles, row) => rowTiles.forEach((t, col) => t.setVisible((g.cells[row]?.[col] ?? 0) > 0)))
  // 7. 연기: 가스 칸마다 일정 간격으로 노란·초록 연기가 피어오른다(칸 사각 위에 겹침)
  g.puff -= dt
  if (g.puff > 0) return
  g.puff = FX.gas.puffSec
  g.cells.forEach((rowCells, row) =>
    rowCells.forEach((v, col) => {
      if (v <= 0) return
      const p = board.toScreen(col, allyY(row))
      burst(scene, 'gasSmoke', p.x, p.y, FX.gas.n)
    }),
  )
}

// 정산·판 끝: 가스 칸과 예고를 모두 지운다
export function clearGas(g: Gas): void {
  const scene = g.tiles[0]?.[0]?.scene
  if (scene) dropWarns(g, scene)
  g.cells = emptyGas()
  g.drops = []
  g.next = 0
  g.warned = 0
  for (const rowTiles of g.tiles) for (const t of rowTiles) t.setVisible(false)
}
