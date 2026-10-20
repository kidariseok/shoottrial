import type { Scene, GameObjects } from 'phaser'
import { ABILITY, CARDS, LAYOUT, UI } from '../data'
import { allyY, stats, withinReach } from '../rules'
import type { Board, Unit } from './board'
import { dmgText, hitFlash } from './fx'

// 배치 카드의 전투 상태. Unit 객체가 키라 이동·교환은 상태가 따라간다
export type Combat = { hp: number; maxHp: number; alive: boolean; stun: number; cd: number; revived: boolean }
// alive는 combat.alive의 사본(rules.frontAlly가 alive 필드를 읽는다). collectAllies가 매번 채운다
export type Ally = { unit: Unit; combat: Combat; col: number; row: number; alive: boolean; y: number; view: GameObjects.Container }

const states = new WeakMap<Unit, Combat>()

function combatOf(unit: Unit): Combat {
  let c = states.get(unit)
  if (!c) {
    // ponytail: 전투 중 합성하면 새 카드는 전체 HP로 시작
    const hp = stats(unit.card, unit.rank).hp
    c = { hp, maxHp: hp, alive: true, stun: 0, cd: 0, revived: false }
    states.set(unit, c)
  }
  return c
}

export function collectAllies(board: Board): Ally[] {
  return board.deployed().map((d) => {
    const combat = combatOf(d.unit)
    return { unit: d.unit, combat, col: d.col, row: d.row, alive: combat.alive, y: allyY(d.row), view: d.view }
  })
}

// 체력바: 카드 뷰마다 Graphics 하나를 재사용한다. 다친 카드만 보인다
function drawBar(ally: Ally): void {
  const { w, h, y, bg, ok, low, lowRatio } = UI.bar
  let bar = ally.view.getData('bar') as GameObjects.Graphics | undefined
  if (!bar) {
    bar = ally.view.scene.add.graphics()
    ally.view.add(bar)
    ally.view.setData('bar', bar)
  }
  const { hp, maxHp } = ally.combat
  bar.clear().setVisible(hp < maxHp)
  const ratio = hp / maxHp
  bar.fillStyle(bg).fillRect(-w / 2, y, w, h)
  bar.fillStyle(ratio <= lowRatio ? low : ok).fillRect(-w / 2, y, w * ratio, h)
}

// 쓰러졌으면 true
export function damageAlly(scene: Scene, ally: Ally, dmg: number): boolean {
  const c = ally.combat
  if (!c.alive) return false
  c.hp -= dmg
  hitFlash(scene, ally.view.x, ally.view.y, LAYOUT.cell - UI.card.inset * 2, LAYOUT.cell - UI.card.inset * 2)
  dmgText(scene, ally.view.x, ally.view.y, dmg)
  if (c.hp <= 0) {
    c.hp = 0
    c.alive = false
    ally.alive = false
    ally.view.setAlpha(UI.fx.fallenAlpha)
  }
  drawBar(ally)
  return !c.alive
}

// 웨이브 시작: 살아 있는 취사병마다 자기를 뺀 인접 아군의 최대 HP를 올린다
export function startWave(allies: Ally[]): void {
  for (const cook of allies) {
    if (cook.unit.card !== 'cook' || !cook.combat.alive) continue
    for (const a of allies) {
      if (a === cook || !withinReach(a.col - cook.col, a.row - cook.row, CARDS.cook.range)) continue
      // ponytail: 인접 취사병 중복은 효과 한 번(add가 아니라 set)
      a.combat.maxHp = Math.round(stats(a.unit.card, a.unit.rank).hp * (1 + ABILITY.cookBuff))
      a.combat.hp = a.combat.maxHp
      drawBar(a)
    }
  }
}

// 웨이브 끝: 모두 전체 HP로 일어난다(LOOP-03)
export function endWave(allies: Ally[]): void {
  for (const a of allies) {
    const c = a.combat
    c.maxHp = stats(a.unit.card, a.unit.rank).hp
    c.hp = c.maxHp
    c.alive = true
    a.alive = true
    c.stun = 0
    c.cd = 0
    c.revived = false
    a.view.setAlpha(1)
    drawBar(a)
  }
}
