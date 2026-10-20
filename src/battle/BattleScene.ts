import { Scene } from 'phaser'

// 레인 A(Claude Code)가 M2-core에서 채운다. H-101(레인 B)은 이 씬을 main.ts에 등록만 하고 이 파일은 고치지 않는다.
// ponytail: 지금은 화면 가운데 안내 문구만 그린다. 좌표·크기 상수는 M2-core에서 data.ts의 LAYOUT으로 옮긴다.
export class BattleScene extends Scene {
  constructor() {
    super('battle')
  }

  create() {
    const { width, height } = this.scale
    this.add.text(width / 2, height / 2, '전투 화면\n(M2-core에서 구현)', { color: '#ffffff', fontSize: '32px', align: 'center' }).setOrigin(0.5)
  }
}
