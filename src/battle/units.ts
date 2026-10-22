import type { Scene, GameObjects } from 'phaser'
import { ABILITY, CARDS, CARD_KEYS, LAYOUT, UI, type CardKey } from '../data'
import { allyY, artKey, blowerRange, chemDamageMult, cookReach, gasHits, inRange, interval, knockback, sniperDamage, stats, synergyTier, withinReach, type Chem } from '../rules'
import type { Board, Unit } from './board'
import { hitSprite, playAct, tickHit } from './art'
import { hurtEnemy, type Enemy } from './enemies'
import { dmgText, flame, healText, hitFlash, muzzle, reviveFlash, shake, snipeLine, tracer, windWave } from './fx'

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

// 살아 있는 화학병만(쓰러진 화학병은 면역·제독·버프에서 빠진다)
export function chemsOf(allies: Ally[]): Chem[] {
  return allies.filter((a) => a.unit.card === 'chem' && a.combat.alive).map((a) => ({ col: a.col, row: a.row, rank: a.unit.rank }))
}

// 쓰러졌으면 true. quiet이면 번쩍임·숫자를 건너뛴다(매 틱 가스 피해용)
export function damageAlly(scene: Scene, ally: Ally, dmg: number, quiet = false): boolean {
  const c = ally.combat
  if (!c.alive) return false
  c.hp -= dmg
  if (!quiet) {
    if (!hitSprite(ally.view)) hitFlash(scene, ally.view.x, ally.view.y, LAYOUT.cell - UI.card.inset * 2, LAYOUT.cell - UI.card.inset * 2)
    dmgText(scene, ally.view.x, ally.view.y, dmg)
  }
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

// 배치 구역 인원(쓰러졌든 아니든, 계급 무관). 시너지 기준(GDD §5.4)
export function synergyCounts(allies: Ally[]): Record<CardKey, number> {
  const counts = Object.fromEntries(CARD_KEYS.map((k) => [k, 0])) as Record<CardKey, number>
  for (const a of allies) counts[a.unit.card] += 1
  return counts
}

// 같은 열에서 사거리 안의 살아 있는 적, 가까운(y가 큰) 순. 다른 열은 보지 않는다(LANE-01)
function ahead(enemies: Enemy[], a: Ally, range: number): Enemy[] {
  return enemies.filter((e) => e.hp > 0 && !e.gone && e.col === a.col && inRange(a.y, e.y, range)).sort((p, q) => q.y - p.y)
}

// 아군 한 틱. allies는 이번 틱에 한 번 모은 배열(ally.alive는 사본이라 combat.alive를 읽는다)
export function tickAllies(ctx: { scene: Scene; board: Board; enemies: Enemy[]; allies: Ally[]; defcon1: boolean; gas: number[][] }, dt: number): void {
  const { scene, enemies, allies } = ctx
  const counts = synergyCounts(allies)
  const chems = chemsOf(allies)
  for (const a of allies) {
    const c = a.combat
    tickHit(a.view, dt)
    if (!c.alive) continue
    if (c.stun > 0) {
      c.stun -= dt
      continue
    }
    c.cd = Math.max(0, c.cd - dt)
    if (c.cd > 0) continue
    const { card, rank } = a.unit
    const iv = interval(card, rank, counts[card], ctx.defcon1, gasHits(ctx.gas, chems, a.col, a.row))
    const mx = a.view.x
    const my = a.view.y - UI.fx.muzzleDy
    const act = () => playAct(a.view, artKey('ally', card, 'attack')) // 공격하는 순간 1회 재생
    switch (a.unit.card) {
      case 'rifle':
      case 'miner':
      case 'chem': {
        const target = ahead(enemies, a, CARDS[card].range)[0]
        if (!target) break
        const atk = stats(card, rank).atk * chemDamageMult(chems, a.col, a.row)
        const shots = card === 'rifle' && rank >= ABILITY.corporal ? ABILITY.burstCount : 1
        muzzle(scene, mx, my)
        act()
        // ponytail: 점사 피해를 한 틱에 적용, 연출만 시차
        for (let i = 0; i < shots; i++) {
          if (target.hp <= 0) break
          hurtEnemy(scene, target, atk)
          tracer(scene, mx, my, target.view.x, target.view.y, i * ABILITY.burstGap)
        }
        c.cd = iv
        break
      }
      case 'sniper': {
        const targets = ahead(enemies, a, CARDS.sniper.range)
        if (targets.length === 0) break
        const tier = synergyTier('sniper', counts.sniper)
        const atk = stats('sniper', rank).atk * chemDamageMult(chems, a.col, a.row)
        targets.forEach((e, k) => {
          const dmg = sniperDamage(atk, k, rank, tier)
          if (dmg > 0) hurtEnemy(scene, e, dmg)
        })
        act()
        const first = targets[0]
        if (first && rank >= ABILITY.sergeant) first.stun = Math.max(first.stun, ABILITY.sniperStun)
        snipeLine(scene, a.view.x, my, ctx.board.toScreen(a.col, 0).y)
        shake(scene, 'light')
        c.cd = iv
        break
      }
      case 'blower': {
        const targets = ahead(enemies, a, blowerRange(counts.blower)).filter((e) => !e.knocked)
        if (targets.length === 0) break
        for (const e of targets) {
          e.knocked = true
          e.knockLeft += knockback(e.type, rank, counts.blower)
          e.ready = 0
          // 화상은 중첩 없이 갱신(대입)
          if (rank >= ABILITY.corporal) {
            e.burn = ABILITY.burnSec
            flame(scene, e.view.x, e.view.y)
          }
        }
        act()
        windWave(scene, a.view.x, my, ctx.board.toScreen(a.col, 0).y)
        c.cd = iv
        break
      }
      case 'cook': {
        const reach = cookReach(rank, counts.cook)
        let acted = false
        for (const b of allies) {
          if (b === a || !b.combat.alive || b.combat.hp >= b.combat.maxHp) continue
          if (!withinReach(b.col - a.col, b.row - a.row, reach)) continue
          b.combat.hp = Math.min(b.combat.maxHp, b.combat.hp + ABILITY.cookHeal)
          drawBar(b)
          healText(scene, b.view.x, b.view.y, ABILITY.cookHeal)
          acted = true
        }
        // 상병 이상: 웨이브마다 쓰러진 인접 아군 1명을 일으킨다(행 -> 열 순)
        if (rank >= ABILITY.corporal && !c.revived) {
          const fallen = allies
            .filter((b) => !b.combat.alive && withinReach(b.col - a.col, b.row - a.row, CARDS.cook.range))
            .sort((p, q) => p.row - q.row || p.col - q.col)[0]
          if (fallen) {
            fallen.combat.alive = true
            fallen.alive = true
            fallen.combat.hp = fallen.combat.maxHp * ABILITY.cookRevive
            fallen.combat.stun = 0
            fallen.view.setAlpha(1)
            drawBar(fallen)
            reviveFlash(scene, fallen.view.x, fallen.view.y, LAYOUT.cell - UI.card.inset * 2, LAYOUT.cell - UI.card.inset * 2)
            c.revived = true
            acted = true
          }
        }
        if (acted) {
          act()
          c.cd = iv
        }
        break
      }
      default:
        break
    }
  }
}
