import { Scene, GameObjects } from 'phaser'
import { ECONOMY, LAYOUT, ROOKIE, UI } from '../data'
import { debug } from '../debug'
import { createBoard, deployIndex } from './board'

export class BattleScene extends Scene {
  private supply = 0
  private supplyText!: GameObjects.Text

  constructor() {
    super('battle')
  }

  create() {
    // 화면이 길면 판 전체를 아래로 내린다. 값만 넘기고 좌표 계산은 board.ts가 한다
    const dy = this.scale.height - LAYOUT.baseHeight
    this.cameras.main.setBackgroundColor(UI.colors.bg)
    this.supply = debug.supply ?? ECONOMY.startSupply

    // ponytail: 1단계는 텍스트만, 3단계에서 ui.hud()로 대체
    this.supplyText = this.add.text(UI.supply.x, UI.supply.y, '', { fontFamily: UI.text.fontFamily, fontSize: `${UI.text.fontPx}px`, color: UI.text.color })
    this.showSupply()

    const board = createBoard(this, {
      dy,
      onSell: (refund) => {
        this.supply += refund
        this.showSupply()
      },
    })
    // 신병을 먼저 놓아야 디버그 덱이 같은 칸을 차지하지 않는다
    board.place('deploy', deployIndex(ROOKIE.col, ROOKIE.row), { card: ROOKIE.card, rank: 1, name: ROOKIE.name })
    board.dealDeck(debug.deck ?? [])
  }

  private showSupply() {
    this.supplyText.setText(`${UI.text.supplyLabel} ${this.supply}`)
  }
}
