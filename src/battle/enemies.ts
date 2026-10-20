import type { Scene, GameObjects } from 'phaser'
import { ABILITY, BATTLE, BOSS, DOG, ENEMIES, GRID, LAYOUT, MINES, UI, type EnemyType } from '../data'
import { blockY, frontAlly, inBlast, inRange, mineDamage, mineTriggered, pickDogLane, waveHp, type SpawnEvent } from '../rules'
import type { Board } from './board'
import { dmgText, explosion, hitFlash, laneFlash, shake } from './fx'
import { damageAlly, type Ally } from './units'

// 적 한 마리의 전투 상태. y는 칸 단위 중심 위치(0 = 적 진입 구역 맨 위)
export type Enemy = {
  type: EnemyType
  col: number
  y: number
  hp: number
  maxHp: number
  ready: number // 공격 준비 누적 초. 막혀서 멈춘 동안만 쌓이고, 걷거나 밀리면 0
  stun: number // 남은 기절 초
  burn: number // 남은 화상 초
  knockLeft: number // 남은 밀려남 칸(02-05가 채운다)
  dogMoved: boolean
  shocked: boolean
  gone: boolean // 저지선·방어선으로 제거됨(처치로 세지 않는다)
  view: GameObjects.Container
  bar: GameObjects.Graphics
}

type Ctx = { scene: Scene; board: Board; enemies: Enemy[]; allies: Ally[]; dogRand: () => number }

// 몸통 변. 체력바 위치도 이 값에서 나온다
const bodySize = (type: EnemyType) => ENEMIES[type].size * LAYOUT.cell

function drawBar(e: Enemy): void {
  const w = bodySize(e.type)
  const ratio = Math.max(0, e.hp / e.maxHp)
  e.bar.clear().setVisible(e.hp < e.maxHp)
  e.bar.fillStyle(UI.bar.bg).fillRect(-w / 2, -w / 2 - UI.enemyBar.gap - UI.enemyBar.h, w, UI.enemyBar.h)
  e.bar.fillStyle(ratio <= UI.bar.lowRatio ? UI.bar.low : UI.bar.ok).fillRect(-w / 2, -w / 2 - UI.enemyBar.gap - UI.enemyBar.h, w * ratio, UI.enemyBar.h)
}

// ponytail: 풀 없이 생성·파괴한다(적 최대 ~60), 프레임 저하가 보이면 Phaser Group maxSize로
export function spawnEnemy(scene: Scene, board: Board, ev: SpawnEvent, wave: number): Enemy {
  const hp = waveHp(ENEMIES[ev.type].hp, wave)
  const size = bodySize(ev.type)
  const pos = board.toScreen(ev.col, 0)
  const body = scene.add.rectangle(0, 0, size, size, ENEMIES[ev.type].color)
  const bar = scene.add.graphics()
  const view = scene.add.container(pos.x, pos.y, [body, bar]).setDepth(UI.fx.enemyDepth).setAlpha(0)
  scene.tweens.add({ targets: view, alpha: 1, duration: UI.fx.spawnFadeMs })
  return { type: ev.type, col: ev.col, y: 0, hp, maxHp: hp, ready: 0, stun: 0, burn: 0, knockLeft: 0, dogMoved: false, shocked: false, gone: false, view, bar }
}

// 제거 판정은 호출한 쪽이 hp <= 0으로 거른다
export function hurtEnemy(scene: Scene, e: Enemy, dmg: number): void {
  e.hp -= dmg
  hitFlash(scene, e.view.x, e.view.y, bodySize(e.type), bodySize(e.type))
  dmgText(scene, e.view.x, e.view.y, dmg)
  drawBar(e)
}

// 보스 충격파: 한 보스당 한 번, 같은 열 살아 있는 아군 전원 기절
function shockwave(ctx: Ctx, e: Enemy): void {
  if (e.shocked) return
  e.shocked = true
  for (const a of ctx.allies) if (a.col === e.col && a.combat.alive) a.combat.stun = Math.max(a.combat.stun, BOSS.shockStun)
  laneFlash(ctx.scene, ctx.board.toScreen(e.col, 0).x, ctx.board.toScreen(e.col, 0).y, ctx.board.worldY(LAYOUT.lineY))
  shake(ctx.scene, 'heavy')
}

// 이 적이 맨 앞 아군에게 막혔는가(RPG병은 사거리 안에서 멈춘다)
function blocked(e: Enemy, front: Ally | null): boolean {
  if (!front) return false
  switch (e.type) {
    case 'rpg':
      return inRange(front.y, e.y, ENEMIES.rpg.range)
    default:
      return e.y >= blockY(front.row)
  }
}

// 방어선(y >= GRID.lineY)에 닿은 적들을 돌려준다. 방어선 처리는 호출한 쪽 몫
export function tickEnemies(ctx: Ctx, dt: number): Enemy[] {
  const reached: Enemy[] = []
  for (const e of ctx.enemies) {
    if (e.hp <= 0 || e.gone) continue
    const place = () => {
      const p = ctx.board.toScreen(e.col, e.y)
      e.view.y = p.y
    }
    // 1. 화상
    if (e.burn > 0) {
      e.hp -= ABILITY.burnDps * dt
      e.burn -= dt
      drawBar(e)
      if (e.hp <= 0) continue
    }
    // 2. 밀려남(히트백): 미끄러지는 동안 걷지도 때리지도 않는다
    if (e.knockLeft > 0) {
      const step = Math.min(e.knockLeft, BATTLE.slideSpeed * dt)
      e.y = Math.max(0, e.y - step)
      e.knockLeft -= step
      e.ready = 0
      place()
      continue
    }
    // 3. 기절
    if (e.stun > 0) {
      e.stun -= dt
      place()
      continue
    }
    // 5. 군견: 배치 구역 앞에서 한 번 열 변경
    if (e.type === 'dog' && !e.dogMoved && e.y >= GRID.deployTop - DOG.triggerGap) {
      e.dogMoved = true
      const counts = Array<number>(LAYOUT.cols).fill(0)
      for (const a of ctx.allies) if (a.alive) counts[a.col] = (counts[a.col] ?? 0) + 1
      e.col = pickDogLane(e.col, counts, ctx.dogRand)
      ctx.scene.tweens.add({ targets: e.view, x: ctx.board.toScreen(e.col, e.y).x, duration: DOG.laneMs })
    }
    // 6. 막힘 판정
    const front = frontAlly(ctx.allies, e.col)
    if (blocked(e, front) && front) {
      // 7. 막혔으면 충격파(보스) 후 공격 준비
      if (e.type === 'boss') shockwave(ctx, e)
      e.ready += dt
      if (e.ready >= ENEMIES[e.type].interval) {
        e.ready -= ENEMIES[e.type].interval
        damageAlly(ctx.scene, front, ENEMIES[e.type].dmg)
      }
    } else {
      e.ready = 0
      e.y += ENEMIES[e.type].speed * dt
    }
    // 4(뒤로 옮김). 보스: 걸어서 배치 구역에 들어선 그 틱에 충격파(밀려나거나 기절 중에는 걷지 않으므로 여기서만 판정해도 같다)
    if (e.type === 'boss' && e.y >= BOSS.shockY) shockwave(ctx, e)
    // 8. 뷰 갱신, 방어선 도달
    place()
    if (e.y >= GRID.lineY) reached.push(e)
  }
  return reached
}

// 묻힌 지뢰: 같은 열 적 중심이 지뢰 칸 윗변에 닿으면 터져 그 칸과 위아래 blast칸의 같은 열 적 전부에게 피해
// 사망 처리는 호출한 쪽 정리 단계가 한다
export function tickMines(ctx: { scene: Scene; board: Board; enemies: Enemy[] }): void {
  for (const m of ctx.board.mines()) {
    const live = ctx.enemies.filter((e) => e.col === m.col && e.hp > 0 && !e.gone)
    if (!live.some((e) => mineTriggered(e.y, m.row))) continue
    for (const e of live) {
      if (!inBlast(e.y, m.row)) continue
      hurtEnemy(ctx.scene, e, mineDamage(e.type, m.anti))
    }
    ctx.board.detonate(m.col, m.row)
    const p = ctx.board.toScreen(m.col, GRID.mineTop + m.row + 0.5)
    explosion(ctx.scene, p.x, p.y, (1 + 2 * MINES.blast) * LAYOUT.cell)
    shake(ctx.scene, 'heavy')
  }
}

// 트윈을 끊고 뷰를 없앤다. 두 번 불러도 안전하다
export function removeEnemy(e: Enemy): void {
  if (!e.view.scene) return
  e.view.scene.tweens.killTweensOf(e.view)
  e.view.destroy()
}
