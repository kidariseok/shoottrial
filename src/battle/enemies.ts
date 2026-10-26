import type { Scene, GameObjects } from 'phaser'
import { ABILITY, ART, SPECIALTIES, BATTLE, BATTLE_AUDIO, BOSS, COMBAT, DOG, ENEMIES, FX, GRID, LAYOUT, UI, type EnemyType } from '../data'
import { playSfx } from '../audio'
import { dotTick, motionPhase, artKey, damageTaken, engageTarget, inBlast, mineDamage, mineTriggered, pickDogLane, pushMult, waveHp, type LogEvent, type SpawnEvent } from '../rules'
import { debug } from '../debug'
import { addSprite, setupMotion, moveMotion, leanMotion, hasArt, hitSprite, playAct, anticipateMotion } from './art'
import type { Board } from './board'
import { comboText, dmgText, explosion, hitFlash, hitStop, laneFlash, shake } from './fx'
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
  poison: number // 남은 중독 초(화상과 독립)
  burn: number // 남은 화상 초
  vuln: number // 남은 취약 초(받는 피해 x COMBAT.vulnMult)
  pushedAt: number // 마지막으로 밀린 전투 시각(초). 안 밀렸으면 -Infinity. 지뢰 연계 판정용
  knockLeft: number // 남은 밀려남 칸(02-05가 채운다)
  knocked: boolean // 제설병에게 이미 밀렸다. 적마다 1회만 밀린다(제설병 단독 열 교착 방지, 03-06)
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
  const bar = scene.add.graphics()
  const view = scene.add.container(pos.x, pos.y).setDepth(UI.fx.enemyDepth).setAlpha(0)
  const key = ev.type === 'boss' ? artKey('boss', 'apc', 'hull') : artKey('enemy', ev.type, 'move')
  if (hasArt(key)) {
    // 그림이 있는 종류만 스프라이트. 보스는 몸체 위에 포탑(회전 없음)
    const s = addSprite(scene, view, key, ev.type !== 'boss')
    if (ev.type === 'boss' && hasArt(artKey('boss', 'apc', 'turret'))) view.add(scene.add.image(0, 0, artKey('boss', 'apc', 'turret')))
    if (ev.type === 'dogPlus') {
      s.setTint(ART.dogPlusTint)
      view.setData('tint', ART.dogPlusTint) // 피격 틴트가 끝나면 이 색으로 돌아간다
    }
  } else {
    const body = scene.add.rectangle(0, 0, size, size, ENEMIES[ev.type].color)
    if (ev.type === 'dogPlus') body.setStrokeStyle(UI.enemyStroke, UI.colors.dogPlusStroke) // 강화 군견: 흰 테두리
    view.add(body)
  }
  view.setData('base', key)
  const serial = (scene.data.get('motionSerial') as number | undefined) ?? 0
  scene.data.set('motionSerial', serial + 1)
  setupMotion(view, key, motionPhase(debug.seed, serial), 1)
  moveMotion(view, ENEMIES[ev.type].speed, true)
  // 취약 표식: 체력바 위 붉은 아래 화살표(코드 도형). 취약 시간 동안 깜빡인다
  const { w, h, color, gap } = FX.vuln
  const mark = scene.add
    .triangle(0, -size / 2 - UI.enemyBar.gap - UI.enemyBar.h - gap - h / 2, 0, 0, w, 0, w / 2, h, color)
    .setVisible(false)
  view.add(mark)
  view.setData('vulnMark', mark)
  view.add(bar)
  scene.tweens.add({ targets: view, alpha: 1, duration: UI.fx.spawnFadeMs })
  return { type: ev.type, col: ev.col, y: 0, hp, maxHp: hp, ready: 0, stun: 0, burn: 0, poison: 0, vuln: 0, pushedAt: -Infinity, knockLeft: 0, knocked: false, dogMoved: false, shocked: false, gone: false, view, bar }
}

// 제거 판정은 호출한 쪽이 hp <= 0으로 거른다
// 취약 중이면 피해가 커진다(damageTaken). 숫자도 늘어난 값을 보여 준다
export function hurtEnemy(scene: Scene, e: Enemy, base: number): void {
  if (base > 0 && e.hp > 0 && !e.gone) playSfx(BATTLE_AUDIO.hit)
  const dmg = damageTaken(base, e.vuln)
  e.hp -= dmg
  if (!hitSprite(e.view)) hitFlash(scene, e.view.x, e.view.y, bodySize(e.type), bodySize(e.type))
  dmgText(scene, e.view.x, e.view.y, dmg)
  drawBar(e)
}

// 보스 충격파: 한 보스당 한 번(교전에 들어서거나 배치 구역에 들어설 때), 같은 열 살아 있는 아군 전원 기절
function shockwave(ctx: Ctx, e: Enemy): void {
  if (e.shocked) return
  e.shocked = true
  for (const a of ctx.allies) if (a.col === e.col && a.combat.alive) a.combat.stun = Math.max(a.combat.stun, BOSS.shockStun)
  laneFlash(ctx.scene, ctx.board.toScreen(e.col, 0).x, ctx.board.toScreen(e.col, 0).y, ctx.board.worldY(LAYOUT.lineY))
  shake(ctx.scene, 'heavy')
}

// 방어선(y >= GRID.lineY)에 닿은 적들을 돌려준다. 방어선 처리는 호출한 쪽 몫
export function tickEnemies(ctx: Ctx, dt: number): Enemy[] {
  const reached: Enemy[] = []
  for (const e of ctx.enemies) {
    if (e.hp <= 0 || e.gone) continue
    moveMotion(e.view, ENEMIES[e.type].speed, false)
    const place = () => {
      const p = ctx.board.toScreen(e.col, e.y)
      e.view.y = p.y
    }
    // 지속 피해는 기절·밀림 중에도 흐른다. 만료를 넘는 dt와 취약 만료를 나눠 계산한다.
    const burn = dotTick(e.burn, dt, ABILITY.burnDps, e.vuln)
    const poison = dotTick(e.poison, dt, SPECIALTIES.chem.B.poisonDps, e.vuln)
    e.burn = burn.remaining
    e.poison = poison.remaining
    e.hp -= burn.damage + poison.damage
    if (burn.damage + poison.damage > 0) drawBar(e)
    e.vuln = Math.max(0, e.vuln - dt)
    ;(e.view.getData('vulnMark') as GameObjects.Triangle).setVisible(e.vuln > 0 && Math.floor(e.vuln * FX.vuln.blinkHz) % 2 === 0)
    if (e.hp <= 0) continue
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
    if ((e.type === 'dog' || e.type === 'dogPlus') && !e.dogMoved && e.y >= GRID.deployTop - DOG.triggerGap) {
      e.dogMoved = true
      const counts = Array<number>(LAYOUT.cols).fill(0)
      for (const a of ctx.allies) if (a.alive) counts[a.col] = (counts[a.col] ?? 0) + 1
      const oldCol = e.col
      e.col = pickDogLane(e.col, counts, ctx.dogRand)
      leanMotion(e.view, e.col - oldCol)
      ctx.scene.tweens.add({ targets: e.view, x: ctx.board.toScreen(e.col, e.y).x, duration: DOG.laneMs })
    }
    // 6. 교전 판정: 근접 거리(RPG병은 사거리) 안 아군 중 도발 우선, 가까운 순. 없으면 계속 걷는다
    const foe = engageTarget(e, ctx.allies, e.type === 'rpg' ? ENEMIES.rpg.range : COMBAT.meleeReach)
    if (foe) {
      // 7. 교전 중이면 충격파(보스) 후 공격 준비
      if (e.type === 'boss') shockwave(ctx, e)
      e.ready += dt
      anticipateMotion(e.view, ENEMIES[e.type].interval - e.ready, ENEMIES[e.type].interval)
      if (e.ready >= ENEMIES[e.type].interval) {
        e.ready -= ENEMIES[e.type].interval
        if (e.type === 'rpg') playSfx(BATTLE_AUDIO.explosion)
        damageAlly(ctx.scene, foe, ENEMIES[e.type].dmg)
        if (e.type === 'rpg') explosion(ctx.scene, foe.view.x, foe.view.y) // RPG 폭발
        if (e.type !== 'boss') playAct(e.view, artKey('enemy', e.type, 'act'), ENEMIES[e.type].interval) // 때리는 순간 1회. 보스는 공격 그림이 없어 건너뛴다(없는 키로 artKey가 던지는 것을 막는다)
      }
    } else {
      e.ready = 0
      moveMotion(e.view, ENEMIES[e.type].speed, true)
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
// 제설병에게 밀린 지 minePushSec 안인 적은 피해가 커진다(연계, combo_mine 기록). clock은 전투 시각(초)
// 사망 처리는 호출한 쪽 정리 단계가 한다
export function tickMines(ctx: { scene: Scene; board: Board; enemies: Enemy[]; clock: number; wave: number; log: (ev: LogEvent) => void }): void {
  for (const m of ctx.board.mines()) {
    const live = ctx.enemies.filter((e) => e.col === m.col && e.hp > 0 && !e.gone)
    if (!live.some((e) => mineTriggered(e.y, m.row))) continue
    playSfx(BATTLE_AUDIO.explosion)
    for (const e of live) {
      if (!inBlast(e.y, m.row)) continue
      const combo = pushMult(e.pushedAt, ctx.clock)
      if (combo > 1) {
        ctx.log({ e: 'combo_mine', wave: ctx.wave })
        comboText(ctx.scene, e.view.x, e.view.y - LAYOUT.cell / 2)
      }
      hurtEnemy(ctx.scene, e, mineDamage(e.type, m.anti) * combo)
      if (m.stun) e.stun = Math.max(e.stun, SPECIALTIES.miner.B.stun)
    }
    ctx.board.detonate(m.col, m.row)
    const p = ctx.board.toScreen(m.col, GRID.mineTop + m.row + 0.5)
    explosion(ctx.scene, p.x, p.y)
    shake(ctx.scene, 'heavy')
    hitStop()
  }
}

// 트윈을 끊고 뷰를 없앤다. 두 번 불러도 안전하다
export function removeEnemy(e: Enemy): void {
  if (!e.view.scene) return
  e.view.scene.tweens.killTweensOf(e.view)
  e.view.destroy()
}
