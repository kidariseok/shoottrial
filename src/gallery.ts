import { Scene } from 'phaser'
import { ASSET_CONTRACTS, loadOrGenerateAssets, invalidTextures } from './assets'

export class GalleryScene extends Scene {
  private container!: Phaser.GameObjects.Container
  private isDragging = false
  private startY = 0
  private containerStartY = 0
  private minY = 0
  private maxY = 80

  constructor() {
    super('gallery')
  }

  async create() {
    await loadOrGenerateAssets(this)

    const { width, height } = this.scale

    // 고정 상단 헤더
    const headerBg = this.add.rectangle(0, 0, width, 70, 0x141822).setOrigin(0, 0).setDepth(100)
    const title = this.add.text(
      width / 2,
      35,
      `에셋 갤러리 (${ASSET_CONTRACTS.length}개 키)`,
      { color: '#00ff66', fontSize: '24px', fontStyle: 'bold' }
    ).setOrigin(0.5).setDepth(101)
    void headerBg
    void title

    this.container = this.add.container(0, this.maxY)

    // 2열 격자 배치
    const cols = 2
    const colWidth = (width - 40) / cols
    const startX = 20
    const rowHeight = 220
    let currentY = 10

    for (let i = 0; i < ASSET_CONTRACTS.length; i++) {
      const contract = ASSET_CONTRACTS[i]!
      const col = i % cols
      const x = startX + col * colWidth + colWidth / 2
      const y = currentY + rowHeight / 2

      // 카드 배경
      const isInvalid = invalidTextures.has(contract.key)
      const strokeColor = isInvalid ? 0xff3333 : 0x334155
      const cardBg = this.add.rectangle(0, 0, colWidth - 12, rowHeight - 12, 0x1e293b)
      cardBg.setStrokeStyle(isInvalid ? 3 : 1, strokeColor)

      // 스프라이트 또는 이미지 미리보기 (최대 110x110 박스에 맞춤)
      const maxBox = 100
      const scale = Math.min(maxBox / contract.w, maxBox / contract.h, 1)
      const preview = this.add.sprite(0, -25, contract.key, 0)
      preview.setScale(scale)

      // 라벨 정보 텍스트
      const labelText = this.add.text(
        0,
        45,
        `${contract.key}\n${contract.w}×${contract.h} | frames: ${contract.frames}`,
        {
          color: isInvalid ? '#ff6666' : '#cbd5e1',
          fontSize: '13px',
          align: 'center',
          lineSpacing: 4,
          wordWrap: { width: colWidth - 24 },
        }
      ).setOrigin(0.5, 0)

      const card = this.add.container(x, y, [cardBg, preview, labelText])
      this.container.add(card)

      if (col === cols - 1 || i === ASSET_CONTRACTS.length - 1) {
        currentY += rowHeight
      }
    }

    const totalHeight = currentY + 40
    this.minY = Math.min(this.maxY, height - totalHeight)

    // 세로 드래그 스크롤
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true
      this.startY = pointer.y
      this.containerStartY = this.container.y
    })

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return
      const diffY = pointer.y - this.startY
      const targetY = this.containerStartY + diffY
      this.container.y = Phaser.Math.Clamp(targetY, this.minY, this.maxY)
    })

    this.input.on('pointerup', () => {
      this.isDragging = false
    })

    // 마우스 휠 스크롤
    this.input.on('wheel', (_pointer: unknown, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      const targetY = this.container.y - deltaY * 0.5
      this.container.y = Phaser.Math.Clamp(targetY, this.minY, this.maxY)
    })
  }
}
