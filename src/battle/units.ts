import { BlendModes, type Scene, type GameObjects } from 'phaser'
import { ABILITY, CARDS, CARD_KEYS, FX, SPECIALTIES, LAYOUT, UI, type CardKey } from '../data'
import { attackRange, rifleDamage, sniperWidth, blowerTaunt, blowerVuln, cookHealing, allyDamageTaken, allyY, artKey, blowerCone, blowerRange, chemDamageMult, cookReach, dist, gasHits, interval, knockback, onRay, pickTarget, sniperDamage, stats, synergyTier, withinReach, type Chem } from '../rules'
import type { Board, Unit } from './board'
import { anticipateMotion, downMotion, hitSprite, playAct, restoreMotion } from './art'
import { hurtEnemy, type Enemy } from './enemies'
import { burst, dmgText, flame, healText, hitFlash, muzzle, shake, snipeLine, tracer, windWave } from './fx'

// 배치 카드의 전투 상태. Unit 객체가 키라 이동·교환은 상태가 따라간다
export type Combat = { hp: number; maxHp: number; alive: boolean; stun: number; cd: number }
// alive는 combat.alive의 사본(rules.engageTarget이 alive 필드를 읽는다). collectAllies가 매번 채운다
// taunt: 제설병은 살아 있는 동안 늘 도발 중이다(GDD §5.2)
export type Ally = { unit: Unit; combat: Combat; col: number; row: number; alive: boolean; y: number; taunt: boolean; tauntReach: number; view: GameObjects.Container }

const states = new WeakMap<Unit, Combat>()

function combatOf(unit: Unit): Combat {
  let c = states.get(unit)
  if (!c) {
    // ponytail: 전투 중 합성하면 새 카드는 전체 HP로 시작
    const hp = stats(unit.card, unit.rank, unit.spec).hp
    c = { hp, maxHp: hp, alive: true, stun: 0, cd: 0 }
    states.set(unit, c)
  }
  return c
}

export function collectAllies(board: Board): Ally[] {
  return board.deployed().map((d) => {
    const combat = combatOf(d.unit)
    return { unit: d.unit, combat, col: d.col, row: d.row, alive: combat.alive, y: allyY(d.row), taunt: d.unit.card === 'blower', tauntReach: blowerTaunt(d.unit.spec), view: d.view }
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

// 도발 고리: 제설병 카드 발밑 금색 가산 고리가 천천히 맥동한다. 전투 중에만 있고 endWave가 지운다
function ensureRing(ally: Ally): void {
  if (ally.view.getData('ring')) return
  const { y, w, h, lineW, color, alpha, scale, ms } = FX.taunt
  const ring = ally.view.scene.add.ellipse(0, y, w, h).setStrokeStyle(lineW, color, alpha).setBlendMode(BlendModes.ADD)
  ally.view.add(ring)
  ally.view.setData('ring', ring)
  ally.view.scene.tweens.add({ targets: ring, scale, alpha: 0, duration: ms, yoyo: true, repeat: -1 })
}

// 살아 있는 화학병만(쓰러진 화학병은 면역·제독·버프에서 빠진다)
export function chemsOf(allies: Ally[]): Chem[] {
  return allies.filter((a) => a.unit.card === 'chem' && a.combat.alive).map((a) => ({ col: a.col, row: a.row, rank: a.unit.rank, spec: a.unit.spec }))
}

// 쓰러졌으면 true. quiet이면 번쩍임·숫자를 건너뛴다(매 틱 가스 피해용)
export function damageAlly(scene: Scene, ally: Ally, base: number, quiet = false): boolean {
  const c = ally.combat
  if (!c.alive) return false
  const dmg = allyDamageTaken(base, ally.unit.card, ally.unit.spec) // 제설병은 덜 아프다
  c.hp -= dmg
  if (!quiet) {
    if (!hitSprite(ally.view)) hitFlash(scene, ally.view.x, ally.view.y, LAYOUT.cell - UI.card.inset * 2, LAYOUT.cell - UI.card.inset * 2)
    dmgText(scene, ally.view.x, ally.view.y, dmg)
  }
  if (c.hp <= 0) {
    c.hp = 0
    c.alive = false
    ally.alive = false
    if (!downMotion(ally.view, true)) ally.view.setAlpha(UI.fx.fallenAlpha)
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
      a.combat.maxHp = stats(a.unit.card, a.unit.rank, a.unit.spec).hp * (1 + ABILITY.cookBuff)
      a.combat.hp = a.combat.maxHp
      drawBar(a)
    }
  }
}

// 웨이브 끝: 모두 전체 HP로 일어난다(LOOP-03)
export function endWave(allies: Ally[]): void {
  for (const a of allies) {
    const c = a.combat
    c.maxHp = stats(a.unit.card, a.unit.rank, a.unit.spec).hp
    c.hp = c.maxHp
    c.alive = true
    a.alive = true
    c.stun = 0
    c.cd = 0
    restoreMotion(a.view)
    a.view.setAlpha(1)
    const ring = a.view.getData('ring') as GameObjects.Ellipse | undefined
    if (ring) a.view.scene.tweens.killTweensOf(ring) // 맥동 트윈을 끊고 지운다
    ring?.destroy()
    a.view.setData('ring', undefined)
    drawBar(a)
  }
}

// 배치 구역 인원(쓰러졌든 아니든, 계급 무관). 시너지 기준(GDD §5.4)
export function synergyCounts(allies: Ally[]): Record<CardKey, number> {
  const counts = Object.fromEntries(CARD_KEYS.map((k) => [k, 0])) as Record<CardKey, number>
  for (const a of allies) counts[a.unit.card] += 1
  return counts
}

// 아군 한 틱. allies는 이번 틱에 한 번 모은 배열(ally.alive는 사본이라 combat.alive를 읽는다)
export function tickAllies(ctx: { scene: Scene; board: Board; enemies: Enemy[]; allies: Ally[]; defcon1: boolean; gas: number[][]; clock: number }, dt: number): void {
  const { scene, enemies, allies } = ctx
  const counts = synergyCounts(allies)
  const chems = chemsOf(allies)
  for (const a of allies) {
    const c = a.combat
    if (a.taunt && c.alive) ensureRing(a)
    if (!c.alive) continue
    if (c.stun > 0) {
      c.stun -= dt
      continue
    }
    c.cd = Math.max(0, c.cd - dt)
    const { card, rank, spec } = a.unit
    const iv = interval(card, rank, counts[card], ctx.defcon1, gasHits(ctx.gas, chems, a.col, a.row), spec)
    anticipateMotion(a.view, c.cd, iv)
    if (c.cd > 0) continue
    const mx = a.view.x
    const my = a.view.y - UI.fx.muzzleDy
    const act = () => playAct(a.view, artKey('ally', card, 'attack'), iv) // 공격하는 순간 1회 재생
    switch (a.unit.card) {
      case 'rifle':
      case 'miner':
      case 'chem': {
        const target = pickTarget(a, enemies, attackRange(card, spec))
        if (!target) break
        const atk = stats(card, rank, spec).atk * chemDamageMult(chems, a.col, a.row)
        const shots = card === 'rifle' && rank >= ABILITY.corporal ? ABILITY.burstCount : 1
        muzzle(scene, mx, my)
        act()
        // ponytail: 점사 피해를 한 틱에 적용, 연출만 시차
        for (let i = 0; i < shots; i++) {
          if (target.hp <= 0) break
          hurtEnemy(scene, target, card === 'rifle' ? rifleDamage(atk, dist(a, target), spec) : atk)
          if (card === 'chem' && spec === 'B' && target.hp > 0) target.poison = SPECIALTIES.chem.B.poisonSec
          tracer(scene, mx, my, target.view.x, target.view.y, i * ABILITY.burstGap)
        }
        c.cd = iv
        break
      }
      case 'sniper': {
        // 가장 가까운 적을 향해 쏘고, 그 사선(폭 pierceWidth) 위 뒤쪽 적을 가까운 순으로 관통한다
        const first = pickTarget(a, enemies, CARDS.sniper.range)
        if (!first) break
        const behind = enemies
          .filter((e) => e !== first && e.hp > 0 && !e.gone && onRay(a, first, e, sniperWidth(spec)))
          .sort((p, q) => dist(a, p) - dist(a, q))
        const targets = [first, ...behind]
        const tier = synergyTier('sniper', counts.sniper)
        const atk = stats('sniper', rank).atk * chemDamageMult(chems, a.col, a.row)
        targets.forEach((e, k) => {
          const dmg = sniperDamage(atk, k, rank, tier, spec)
          if (dmg <= 0) return
          hurtEnemy(scene, e, dmg)
          burst(scene, 'spark', e.view.x, e.view.y) // 관통한 적마다 불꽃
        })
        act()
        if (rank >= ABILITY.sergeant) first.stun = Math.max(first.stun, ABILITY.sniperStun)
        const last = targets[targets.length - 1] as Enemy
        snipeLine(scene, a.view.x, my, last.view.x, last.view.y)
        shake(scene, 'light')
        c.cd = iv
        break
      }
      case 'blower': {
        // 부채꼴: 안의 적 전부 피해 + 취약. 아직 안 밀린 적만 민다(적마다 1회)
        const targets = blowerCone(a, enemies, blowerRange(counts.blower))
        if (targets.length === 0) break
        const atk = stats('blower', rank, spec).atk
        for (const e of targets) {
          if (!e.knocked) {
            e.knocked = true
            e.knockLeft += knockback(e.type, rank, counts.blower, spec)
            e.ready = 0
            e.pushedAt = ctx.clock
            burst(scene, 'dustTail', e.view.x, e.view.y) // 밀린 적 뒤로 먼지 꼬리
            // 화상은 중첩 없이 갱신(대입)
            if (rank >= ABILITY.corporal) {
              e.burn = ABILITY.burnSec
              flame(scene, e.view.x, e.view.y)
            }
          }
          hurtEnemy(scene, e, atk) // 취약은 이 피해 뒤에 건다(첫 타는 부풀리지 않는다)
          e.vuln = blowerVuln(spec)
        }
        act()
        windWave(scene, a.view.x, my, ctx.board.toScreen(a.col, 0).y, rank >= ABILITY.corporal)
        c.cd = iv
        break
      }
      case 'cook': {
        const reach = cookReach(rank, counts.cook)
        let acted = false
        // HP 비율 순으로 기본 1명, 상병 2명, 취사병 시너지면 전원을 치료한다.
        const hurt = allies
          .filter((b) => b !== a && b.combat.alive && b.combat.hp < b.combat.maxHp && withinReach(b.col - a.col, b.row - a.row, reach))
          .map((b) => ({ b, hp: b.combat.hp, maxHp: b.combat.maxHp, taunt: b.taunt, alive: b.combat.alive }))
        for (const { target: { b }, amount } of cookHealing(hurt, rank, counts.cook, spec)) {
          b.combat.hp = Math.min(b.combat.maxHp, b.combat.hp + amount)
          drawBar(b)
          healText(scene, b.view.x, b.view.y, amount)
          acted = true
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
