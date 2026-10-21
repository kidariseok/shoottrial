import { Scene, GameObjects, type Time } from 'phaser'
import { CARDS, CARD_KEYS, GRID, LAYOUT, RANKS, SPRITE_SCALE, UI, type CardKey } from '../data'
import type { DeckItem } from '../debug'
import { canDrag, dropAllowed, dropOutcome, merge, nearestEmpty, sellValue, type FlowPhase, type Spot } from '../rules'

// rules.Unit 확장. name은 신병 카드만 가진다
export type Unit = { card: CardKey; rank: number; name?: string }
export type Zone = 'deploy' | 'bench' | 'sell'
export type BoardUnit = Spot & { unit: Unit }
// x, y = 월드 좌표의 칸 중심(dy 반영)
export type Slot = { zone: Zone; i: number; x: number; y: number; size: number; unit: Unit | null; view: GameObjects.Container | null }
export type Board = {
  place(zone: 'deploy' | 'bench', i: number, unit: Unit): boolean
  // 칸이 찬 카드. 대기석 번호 순, 그다음 배치 구역 번호 순
  units(): BoardUnit[]
  // 첫 빈 대기석 번호. 가득 차면 null
  benchFree(): number | null
  // 그 칸 카드를 한 계급 올린다(병장이면 무시). 이름은 자기 것 ?? absorb 칸 것, absorb 칸은 치워진다(환급 없음)
  promote(zone: 'bench' | 'deploy', i: number, absorb?: Spot): void
  // 프로그램용 이동(빈 칸으로만)
  move(from: Spot, to: Spot): boolean
  dealDeck(deck: DeckItem[]): void
  // 논리 좌표(열, 칸 단위 y: 적 진입 구역 맨 위 = 0) -> 월드 좌표(화면 내림 포함)
  toScreen(col: number, y: number): { x: number; y: number }
  // LAYOUT 기준 y -> 월드 y(화면 내림 포함)
  worldY(baseY: number): number
  // 배치 구역에 놓인 카드(대기석 제외)
  deployed(): { unit: Unit; col: number; row: number; view: GameObjects.Container }[]
  setPhase(phase: FlowPhase): void
  // 지뢰 토큰 n개(0이면 더미 숨김). anti = 이 단계 토큰이 대전차인지(더미 색)
  setTokens(n: number, anti: boolean): void
  tokens(): number
  // 토큰 1개를 지뢰 구역 (col, row 0|1) 빈 칸에 묻는다. 토큰이 없거나 칸이 차 있으면 false
  bury(col: number, row: number): boolean
  // 묻힌 지뢰 (row 0 = 지뢰 구역 위 행)
  mines(): { col: number; row: number; anti: boolean }[]
  // 묻힌 지뢰 제거(연출은 호출한 쪽)
  detonate(col: number, row: number): void
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

const labelStyle = (color: string) => ({ fontFamily: UI.text.fontFamily, fontSize: `${UI.text.fontPx}px`, color })

export function createBoard(scene: Scene, opts: { dy: number; onSell: (refund: number) => void; onMerge?: (card: CardKey, rank: number) => void; onHold?: (unit: Unit | null) => void }): Board {
  const { dy } = opts
  const { cell, cols, marginX } = LAYOUT
  // 판 전체를 dy만큼 내린다. HUD 띠(0~hudH)는 이 컨테이너 밖이라 움직이지 않는다
  const layer = scene.add.container(0, dy)
  const gfx = scene.add.graphics()
  layer.add(gfx)
  // 칸 강조용. 카드 뷰보다 먼저 만들어 아래에 깔린다. 월드 좌표(슬롯 좌표)로 그린다
  const hl = scene.add.graphics()

  const grid = (x: number, y: number, w: number, h: number, color: number, fill: boolean) => {
    if (fill) gfx.fillStyle(color).fillRect(x, y, w, h)
    gfx.lineStyle(UI.stroke, UI.colors.bg).strokeRect(x, y, w, h)
  }
  const label = (text: string, cx: number, cy: number, color: string = UI.text.labelColor) => {
    layer.add(scene.add.text(cx, cy, text, labelStyle(color)).setOrigin(0.5))
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
  label(UI.text.line, LAYOUT.width / 2, LAYOUT.lineY + LAYOUT.lineH / 2, UI.text.lineLabelColor)
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

  // 화면 dy는 이 두 함수와 위 슬롯 좌표에서만 더한다
  const toScreen = (col: number, y: number) => ({ x: marginX + (col + 0.5) * cell, y: LAYOUT.entryY + y * cell + dy })
  const worldY = (baseY: number) => baseY + dy
  const deployed = () =>
    slots
      .filter((s) => s.zone === 'deploy' && s.unit)
      .map((s) => ({ unit: s.unit as Unit, col: s.i % cols, row: Math.floor(s.i / cols), view: s.view as GameObjects.Container }))

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

  // 칸에 카드를 둔다: 뷰 생성 + 드래그 설정 + 뷰가 자기 칸을 안다
  const put = (s: Slot, unit: Unit) => {
    const view = makeView(unit, s)
    view.setData('slot', s)
    view.setInteractive({ draggable: true }) // 크기는 setSize(cell, cell), 히트 영역은 컨테이너 표시 원점(중심) 기준
    s.unit = unit
    s.view = view
    return view
  }

  const place = (zone: 'deploy' | 'bench', i: number, unit: Unit) => {
    const s = slotOf(zone, i)
    if (!s || s.unit) return false
    put(s, unit)
    return true
  }

  // 점이 들어 있는 칸. 판 밖·지뢰 구역·방어선 띠는 칸이 아니라 null
  const slotAt = (x: number, y: number) => slots.find((s) => Math.abs(x - s.x) <= s.size / 2 && Math.abs(y - s.y) <= s.size / 2) ?? null

  const snap = (view: GameObjects.Container, x: number, y: number) => {
    scene.tweens.add({ targets: view, x, y, duration: UI.fx.snapMs, onComplete: () => view.setDepth(0) })
  }

  // view·unit을 to 칸으로 옮긴다(from 비우기는 호출한 쪽 몫)
  const relocate = (view: GameObjects.Container, unit: Unit, to: Slot) => {
    to.unit = unit
    to.view = view
    view.setData('slot', to)
    view.setScale(SPRITE_SCALE * (to.size / cell))
    snap(view, to.x, to.y)
  }
  const moveTo = (from: Slot, to: Slot) => {
    relocate(from.view as GameObjects.Container, from.unit as Unit, to)
    from.unit = null
    from.view = null
  }

  // 대상 칸 카드를 새 계급으로 다시 만든다: 진급 연출(계급 작대기 확대 후 복귀 + 진급! 팝업, 도형·텍스트만) + onMerge
  const promoteTo = (target: Slot, rank: number, name: string | undefined) => {
    const card = (target.unit as Unit).card
    scene.tweens.killTweensOf(target.view as GameObjects.Container) // 방금 옮겨져 스냅 중일 수 있다
    target.view?.destroy()
    const view = put(target, { card, rank, name })
    scene.tweens.add({ targets: view.getData('rank'), scale: UI.fx.promoteScale, duration: UI.fx.promoteMs, yoyo: true })
    const popup = scene.add
      .text(target.x, target.y, UI.text.promote, { fontFamily: UI.text.fontFamily, fontSize: `${UI.text.fontPx}px`, color: UI.text.popupColor })
      .setOrigin(0.5)
      .setDepth(UI.fx.dragDepth)
    scene.tweens.add({ targets: popup, y: target.y - UI.fx.popupRise, alpha: 0, duration: UI.fx.popupMs, onComplete: () => popup.destroy() })
    opts.onMerge?.(card, rank)
  }

  // 합성: 드래그한 카드는 사라지고 대상 칸 카드가 진급한다. 이름은 재료 중 신병 것을 물려받는다
  const mergeInto = (from: Slot, target: Slot) => {
    const a = from.unit as Unit
    const b = target.unit as Unit
    const rank = merge(a, b)
    if (rank === null) return snap(from.view as GameObjects.Container, from.x, from.y)
    from.view?.destroy()
    from.unit = null
    from.view = null
    promoteTo(target, rank, b.name ?? a.name)
  }

  // 판매: 환급은 sellValue(이등병 비용 x 재료 장수). 확인 창·되돌리기 없음
  // 판매·이동 허용은 rules.dropAllowed(단계별)
  const sellFrom = (from: Slot) => {
    const refund = sellValue((from.unit as Unit).card, (from.unit as Unit).rank)
    from.view?.destroy()
    from.unit = null
    from.view = null
    opts.onSell(refund)
  }

  // 칸 강조: 출발 칸을 뺀 모든 칸에 윤곽선. 합성 가능은 다른 색, 손 아래 칸은 더 굵게
  const drawHl = (from: Slot, hover: Slot | null) => {
    hl.clear()
    for (const s of slots) {
      if (s === from) continue
      const outcome = dropOutcome(from.unit as Unit, s.unit)
      if (!dropAllowed(phase, from.zone, s.zone, outcome)) continue
      const color = s.unit && outcome === 'merge' ? UI.colors.hlMerge : UI.colors.hlOk
      if (s === hover) hl.lineStyle(UI.fx.hlHoverWidth, UI.colors.hlHover, UI.fx.hlAlpha)
      else hl.lineStyle(UI.fx.hlWidth, color, UI.fx.hlAlpha)
      hl.strokeRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size)
    }
  }

  // 합성 대상 계급 표시 반짝임
  let flashing: GameObjects.Graphics | null = null
  const stopFlash = () => {
    if (!flashing) return
    scene.tweens.killTweensOf(flashing)
    flashing.setAlpha(1)
    flashing = null
  }
  let hover: Slot | null = null
  // 흐름 단계와 지금 끌고 있는 카드(잠긴 드래그는 null)
  let phase: FlowPhase = 'prep'
  let active: GameObjects.Container | null = null

  // 길게 누르기: 정해진 시간(data.ts) 동안 움직이지 않으면 onHold(unit), 손을 떼면 onHold(null). 드래그가 시작되면 열지 않는다
  // ponytail: 터치 실기기에서 손가락 오프셋·멀티터치는 확인 못 함, 실기기 확인 때 임계값 조정
  let holdTimer: Time.TimerEvent | null = null
  let holding = false
  const cancelHold = () => {
    holdTimer?.remove(false)
    holdTimer = null
  }
  scene.input.on('pointerdown', (_p: unknown, over: GameObjects.GameObject[]) => {
    cancelHold()
    const unit = over.map((o) => (o.getData('slot') as Slot | undefined)?.unit).find((u) => u)
    if (!unit) return // 지뢰 토큰 더미·빈 곳은 무시
    holdTimer = scene.time.delayedCall(UI.hold.ms, () => {
      holdTimer = null
      holding = true
      opts.onHold?.(unit)
    })
  })
  const release = () => {
    cancelHold()
    if (!holding) return
    holding = false
    opts.onHold?.(null)
  }
  scene.input.on('pointerup', release)
  scene.input.on('pointerupoutside', release)

  // 드래그: 직접 포인터 추적 없이 Phaser 이벤트만 쓴다
  // ponytail: 드래그 중 카드 중심 좌표로 칸을 판정한다(손가락 오프셋 없음), 터치 실기기에서 손가락에 가려지면 카드를 손가락 위로 띄운다
  scene.input.on('dragstart', (_p: unknown, obj: GameObjects.GameObject) => {
    const view = obj as GameObjects.Container
    const from = view.getData('slot') as Slot | undefined
    if (!from) return
    if (holding) {
      active = null // 정보가 열려 있는 동안은 카드를 끌지 않는다
      return
    }
    cancelHold() // 움직이면 열지 않는다(Phaser는 드래그 임계값 0이라 조금만 움직여도 dragstart가 난다)
    if (!canDrag(phase, from.zone)) {
      active = null
      return
    }
    active = view
    scene.tweens.killTweensOf(view)
    view.setDepth(UI.fx.dragDepth)
    hover = null
    drawHl(from, null)
  })
  scene.input.on('drag', (_p: unknown, obj: GameObjects.GameObject, dragX: number, dragY: number) => {
    const view = obj as GameObjects.Container
    const from = view.getData('slot') as Slot | undefined
    if (!from || view !== active) return
    view.x = dragX
    view.y = dragY
    const s = slotAt(dragX, dragY)
    const now = s === from ? null : s
    if (now === hover) return // 칸이 바뀔 때만 다시 그린다
    hover = now
    drawHl(from, hover)
    stopFlash()
    if (hover?.unit && dropOutcome(from.unit as Unit, hover.unit) === 'merge' && dropAllowed(phase, from.zone, hover.zone, 'merge')) {
      flashing = hover.view?.getData('rank') as GameObjects.Graphics
      scene.tweens.add({ targets: flashing, alpha: UI.fx.flashAlpha, duration: UI.fx.flashMs, yoyo: true, repeat: -1 })
    }
  })
  scene.input.on('dragend', (_p: unknown, obj: GameObjects.GameObject) => {
    const view = obj as GameObjects.Container
    const from = view.getData('slot') as Slot | undefined
    if (!from || view !== active) return
    active = null
    stopFlash() // 대상 view가 destroy되기 전에 해제한다
    hl.clear()
    hover = null
    const target = slotAt(view.x, view.y)
    if (target === from) return snap(view, from.x, from.y)
    if (!target) {
      // 판 밖·지뢰 구역·방어선 띠: 놓은 지점에서 가장 가까운 빈 배치 칸으로. 들어 올린 출발 칸도 빈 칸으로 본다
      const deploy = slots.filter((s) => s.zone === 'deploy')
      const i = nearestEmpty(deploy.map((s) => ({ x: s.x, y: s.y, free: s === from || !s.unit })), view.x, view.y)
      const dest = i === null ? from : (deploy[i] as Slot)
      return dest === from || !dropAllowed(phase, from.zone, 'deploy', 'move') ? snap(view, from.x, from.y) : moveTo(from, dest)
    }
    if (target.zone === 'sell') return dropAllowed(phase, from.zone, 'sell', 'move') ? sellFrom(from) : snap(view, from.x, from.y)
    const outcome = dropOutcome(from.unit as Unit, target.unit)
    if (!dropAllowed(phase, from.zone, target.zone, outcome)) return snap(view, from.x, from.y)
    if (outcome === 'move') return moveTo(from, target)
    if (outcome === 'merge') return mergeInto(from, target)
    // 자리 바꿈(병장끼리·계급 불일치 포함): 상대를 먼저 보관한 뒤 서로 옮긴다
    const other = { unit: target.unit as Unit, view: target.view as GameObjects.Container }
    moveTo(from, target)
    relocate(other.view, other.unit, from)
  })

  const units = (): BoardUnit[] =>
    [...slots.filter((s) => s.zone === 'bench'), ...slots.filter((s) => s.zone === 'deploy')]
      .filter((s) => s.unit)
      .map((s) => ({ zone: s.zone as 'bench' | 'deploy', i: s.i, unit: s.unit as Unit }))
  const benchFree = () => slots.find((s) => s.zone === 'bench' && !s.unit)?.i ?? null
  const promote = (zone: 'bench' | 'deploy', i: number, absorb?: Spot) => {
    const s = slotOf(zone, i)
    if (!s?.unit || s.unit.rank >= RANKS.max) return
    const a = absorb ? slotOf(absorb.zone, absorb.i) : undefined
    const name = s.unit.name ?? a?.unit?.name
    if (a?.unit) {
      a.view?.destroy()
      a.unit = null
      a.view = null
    }
    promoteTo(s, s.unit.rank + 1, name)
  }
  // ponytail: 프로그램용(튜닝 봇·디버그), 단계 잠금을 보지 않는다
  const move = (from: Spot, to: Spot) => {
    const f = slotOf(from.zone, from.i)
    const t = slotOf(to.zone, to.i)
    if (!f?.unit || !t || t.unit || f === t) return false
    moveTo(f, t)
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

  // ---- 지뢰 토큰 더미와 매설 ----
  let tokenCount = 0
  let trayAnti = false
  const buried: { col: number; row: number; anti: boolean; view: GameObjects.Arc }[] = []
  const home = toScreen(UI.mine.trayCol, UI.mine.trayY)
  const disc = scene.add.circle(0, 0, UI.mine.tokenR, UI.colors.mineToken)
  const count = scene.add.text(0, 0, '', { fontFamily: UI.text.fontFamily, fontSize: `${UI.mine.countPx}px`, color: UI.text.color }).setOrigin(0.5)
  const tray = scene.add.container(home.x, home.y, [disc, count]).setSize(cell, cell).setVisible(false)
  tray.setInteractive({ draggable: true })
  const mineCenter = (col: number, row: number) => toScreen(col, GRID.mineTop + row + 0.5)
  const hasMine = (col: number, row: number) => buried.some((m) => m.col === col && m.row === row)
  // 점이 들어 있는 지뢰 구역 칸. 구역 밖이면 null
  const mineCellAt = (x: number, y: number) => {
    for (let r = 0; r < LAYOUT.mineRows; r++)
      for (let c = 0; c < cols; c++) {
        const p = mineCenter(c, r)
        if (Math.abs(x - p.x) <= cell / 2 && Math.abs(y - p.y) <= cell / 2) return { col: c, row: r }
      }
    return null
  }
  const bury = (col: number, row: number) => {
    if (tokenCount <= 0 || hasMine(col, row)) return false
    tokenCount -= 1
    count.setText(String(tokenCount))
    tray.setVisible(tokenCount > 0)
    const p = mineCenter(col, row)
    const view = scene.add.circle(p.x, p.y, UI.mine.buriedR, trayAnti ? UI.colors.mineAnti : UI.colors.mineBuried, UI.mine.alpha)
    buried.push({ col, row, anti: trayAnti, view })
    return true
  }
  const goHome = () => scene.tweens.add({ targets: tray, x: home.x, y: home.y, duration: UI.fx.snapMs })
  // ponytail: 한 번 묻은 지뢰는 다시 옮기지 못한다, 실수 되돌리기가 필요하면 지뢰를 더미로 끌어오는 기능을 추가
  let trayDragging = false
  tray.on('dragstart', () => {
    trayDragging = phase === 'prep' && tokenCount > 0
    if (!trayDragging) return
    scene.tweens.killTweensOf(tray)
    tray.setDepth(UI.fx.dragDepth)
    hl.clear().lineStyle(UI.fx.hlWidth, UI.colors.hlOk, UI.fx.hlAlpha)
    for (let r = 0; r < LAYOUT.mineRows; r++)
      for (let c = 0; c < cols; c++) {
        if (hasMine(c, r)) continue
        const p = mineCenter(c, r)
        hl.strokeRect(p.x - cell / 2, p.y - cell / 2, cell, cell)
      }
  })
  tray.on('drag', (_p: unknown, dragX: number, dragY: number) => {
    if (!trayDragging) return
    tray.x = dragX
    tray.y = dragY
  })
  tray.on('dragend', () => {
    if (!trayDragging) return
    trayDragging = false
    hl.clear()
    const cellAt = mineCellAt(tray.x, tray.y)
    if (cellAt) bury(cellAt.col, cellAt.row)
    tray.setDepth(0)
    goHome()
  })

  const setTokens = (n: number, anti: boolean) => {
    tokenCount = n
    trayAnti = anti
    disc.setFillStyle(anti ? UI.colors.mineAnti : UI.colors.mineToken)
    count.setText(String(n))
    trayDragging = false
    scene.tweens.killTweensOf(tray)
    tray.setPosition(home.x, home.y).setDepth(0).setVisible(n > 0)
  }
  const detonate = (col: number, row: number) => {
    const i = buried.findIndex((m) => m.col === col && m.row === row)
    if (i < 0) return
    buried[i]?.view.destroy()
    buried.splice(i, 1)
  }

  return {
    place,
    units,
    benchFree,
    promote,
    move,
    dealDeck,
    toScreen,
    worldY,
    deployed,
    setPhase: (p) => (phase = p),
    setTokens,
    tokens: () => tokenCount,
    bury,
    mines: () => buried.map(({ col, row, anti }) => ({ col, row, anti })),
    detonate,
  }
}
