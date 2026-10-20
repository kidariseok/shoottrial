import { Scene, GameObjects } from 'phaser'
import { CARDS, CARD_KEYS, LAYOUT, SPRITE_SCALE, UI, type CardKey } from '../data'
import type { DeckItem } from '../debug'

// rules.Unit 확장. name은 신병 카드만 가진다
export type Unit = { card: CardKey; rank: number; name?: string }
export type Zone = 'deploy' | 'bench' | 'sell'
// x, y = 월드 좌표의 칸 중심(dy 반영)
export type Slot = { zone: Zone; i: number; x: number; y: number; size: number; unit: Unit | null; view: GameObjects.Container | null }
export type Board = {
  place(zone: 'deploy' | 'bench', i: number, unit: Unit): boolean
  dealDeck(deck: DeckItem[]): void
}

// 배치 칸 번호
export function deployIndex(col: number, row: number): number {
  return row * LAYOUT.cols + col
}

// 계급 작대기 rank개를 묶음 중심 기준으로 다시 그린다
export function drawRank(gfx: GameObjects.Graphics, rank: number): void {
  const { rankW, rankH, rankGap } = UI.card
  const total = rank * rankH + (rank - 1) * rankGap
  gfx.clear()
  gfx.fillStyle(UI.colors.rankBar)
  for (let k = 0; k < rank; k++) gfx.fillRect(-rankW / 2, -total / 2 + k * (rankH + rankGap), rankW, rankH)
}

const labelStyle = { fontFamily: UI.text.fontFamily, fontSize: `${UI.text.fontPx}px`, color: UI.text.labelColor }

export function createBoard(scene: Scene, opts: { dy: number; onSell: (refund: number) => void }): Board {
  const { dy } = opts
  const { cell, cols, marginX } = LAYOUT
  // 판 전체를 dy만큼 내린다. HUD 띠(0~hudH)는 이 컨테이너 밖이라 움직이지 않는다
  const layer = scene.add.container(0, dy)
  const gfx = scene.add.graphics()
  layer.add(gfx)

  const grid = (x: number, y: number, w: number, h: number, color: number, fill: boolean) => {
    if (fill) gfx.fillStyle(color).fillRect(x, y, w, h)
    gfx.lineStyle(UI.stroke, UI.colors.bg).strokeRect(x, y, w, h)
  }
  const label = (text: string, cx: number, cy: number) => {
    layer.add(scene.add.text(cx, cy, text, labelStyle).setOrigin(0.5))
  }

  // 적 진입: 위 끝을 HUD 바로 아래까지 늘려, 화면이 길면 남는 위쪽이 진입로 배경이 된다
  const entryTop = LAYOUT.hudH - dy
  const entryBottom = LAYOUT.entryY + LAYOUT.entryRows * cell
  gfx.fillStyle(UI.colors.entry).fillRect(0, entryTop, LAYOUT.width, entryBottom - entryTop)
  for (let y = entryBottom - cell; y > entryTop; y -= cell) gfx.lineStyle(UI.stroke, UI.colors.bg).lineBetween(0, y, LAYOUT.width, y)

  // 지뢰 구역(1단계는 놓을 수 없는 곳)
  for (let r = 0; r < LAYOUT.mineRows; r++)
    for (let c = 0; c < cols; c++) grid(marginX + c * cell, LAYOUT.mineY + r * cell, cell, cell, UI.colors.mine, true)
  // 배치 구역
  for (let r = 0; r < LAYOUT.deployRows; r++)
    for (let c = 0; c < cols; c++) grid(marginX + c * cell, LAYOUT.deployY + r * cell, cell, cell, UI.colors.deployCell, true)
  // 방어선
  gfx.fillStyle(UI.colors.line).fillRect(0, LAYOUT.lineY, LAYOUT.width, LAYOUT.lineH)
  label(UI.text.line, LAYOUT.width / 2, LAYOUT.lineY + LAYOUT.lineH / 2)
  // 대기석 띠 + 칸 + 판매 칸
  gfx.fillStyle(UI.colors.bench).fillRect(0, LAYOUT.benchY, LAYOUT.width, LAYOUT.benchH)
  const benchTop = LAYOUT.benchY + (LAYOUT.benchH - LAYOUT.benchCell) / 2
  for (let i = 0; i <= LAYOUT.benchSlots; i++)
    grid(LAYOUT.benchMarginX + i * LAYOUT.benchCell, benchTop, LAYOUT.benchCell, LAYOUT.benchCell, i === LAYOUT.benchSlots ? UI.colors.sell : UI.colors.bench, true)
  label(UI.text.sell, LAYOUT.benchMarginX + (LAYOUT.benchSlots + 0.5) * LAYOUT.benchCell, benchTop + LAYOUT.benchCell / 2)

  // 칸 목록: 배치 15 + 대기석 5 + 판매 1. 중심 월드 좌표에 dy를 한 번 더한다(카드 뷰는 layer 밖)
  const slots: Slot[] = []
  for (let r = 0; r < LAYOUT.deployRows; r++)
    for (let c = 0; c < cols; c++)
      slots.push({ zone: 'deploy', i: deployIndex(c, r), x: marginX + (c + 0.5) * cell, y: LAYOUT.deployY + (r + 0.5) * cell + dy, size: cell, unit: null, view: null })
  for (let i = 0; i <= LAYOUT.benchSlots; i++)
    slots.push({
      zone: i === LAYOUT.benchSlots ? 'sell' : 'bench',
      i,
      x: LAYOUT.benchMarginX + (i + 0.5) * LAYOUT.benchCell,
      y: benchTop + LAYOUT.benchCell / 2 + dy,
      size: LAYOUT.benchCell,
      unit: null,
      view: null,
    })
  const slotOf = (zone: Zone, i: number) => slots.find((s) => s.zone === zone && s.i === i)

  // 카드 도형: 중심 기준 자식 + 크기에 맞춘 배율
  const makeView = (unit: Unit, s: Slot) => {
    const { inset, initialPx, namePx, nameY, rankX, rankY } = UI.card
    const view = scene.add.container(s.x, s.y)
    const body = scene.add.rectangle(0, 0, cell - inset * 2, cell - inset * 2, CARDS[unit.card].color)
    const text = scene.add.text(0, 0, CARDS[unit.card].initial, { fontFamily: UI.text.fontFamily, fontSize: `${initialPx}px`, color: UI.text.color }).setOrigin(0.5)
    const rank = scene.add.graphics().setPosition(rankX, rankY)
    drawRank(rank, unit.rank)
    view.add([body, text, rank])
    if (unit.name) view.add(scene.add.text(0, nameY, unit.name, { fontFamily: UI.text.fontFamily, fontSize: `${namePx}px`, color: UI.text.color }).setOrigin(0.5))
    view.setSize(cell, cell)
    view.setScale(SPRITE_SCALE * (s.size / cell))
    view.setData('rank', rank)
    return view
  }

  const place = (zone: 'deploy' | 'bench', i: number, unit: Unit) => {
    const s = slotOf(zone, i)
    if (!s || s.unit) return false
    s.unit = unit
    s.view = makeView(unit, s)
    return true
  }

  // 대기석 앞칸 -> 배치 구역 아래 행부터(같은 행은 왼쪽 열부터)
  const dealOrder = [
    ...slots.filter((s) => s.zone === 'bench'),
    ...Array.from({ length: LAYOUT.deployRows }, (_, k) => LAYOUT.deployRows - 1 - k).flatMap((r) => slots.filter((s) => s.zone === 'deploy' && Math.floor(s.i / cols) === r)),
  ]
  const dealDeck = (deck: DeckItem[]) => {
    // ponytail: 5칸을 넘는 덱은 배치 구역으로 넘치고 나머지는 버린다, 디버그 전용이라 경고 없음
    for (const item of deck) {
      if (!CARD_KEYS.includes(item.card as CardKey)) continue
      for (let k = 0; k < item.n; k++) {
        const s = dealOrder.find((d) => !d.unit)
        if (s) place(s.zone as 'deploy' | 'bench', s.i, { card: item.card as CardKey, rank: 1 })
      }
    }
  }

  return { place, dealDeck }
}
