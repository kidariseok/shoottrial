import { BlendModes, type Scene, type GameObjects, type Types } from 'phaser'
import { ART, FX, NEW_CARD_FX, LAYOUT, UI } from '../data'
import { playFx } from './art'
import { scaledCount, textAllowed } from './budget'

// 도형·트윈·파티클만 쓰는 공통 연출. 피·시체 표현은 쓰지 않는다

// ---- 파티클 ----
// 연출 종류마다 이미터 하나를 만들어 두고 explode로 재사용한다(Phaser가 풀링한다)
type Kind = keyof typeof FX.kinds
type Emitters = Record<Kind, GameObjects.Particles.ParticleEmitter>
const KINDS = Object.keys(FX.kinds) as Kind[]
const emitters = new WeakMap<Scene, Emitters>()
// ponytail: ?fx=low 는 개수 절반만 줄인다(저사양 대비), 설정 화면 연결은 게이트 때 debug.ts로
let low = new URLSearchParams(location.search).get('fx') === FX.lowValue
// 저사양 모드: ?fx=low 이거나, 전투 중 프레임 속도가 오래 낮으면 BattleScene이 켠다(세션 동안 유지). 켜지면 파티클 절반, 데미지 숫자 생략
export const setLowFx = (on: boolean): void => {
  low = on
}
export const isLowFx = (): boolean => low
// 설정 화면의 "데미지 숫자" 토글(save.settings.dmgNumbers). BattleScene이 저장을 읽은 뒤 넣는다
const opts = { dmgNumbers: true }
export const setFxOptions = (o: { dmgNumbers: boolean }): void => {
  opts.dmgNumbers = o.dmgNumbers
}
// 떠 있는 숫자·글자 수. 트윈이 끝나기 전에 씬이 멈추면 어긋나므로 resetStop에서 0으로 되돌린다
let liveTexts = 0

// 파티클 텍스처 4개를 코드로 한 번 만든다(흰 원·작은 사각·부드러운 원·십자)
function makeTextures(scene: Scene): void {
  if (scene.textures.exists('pfx_dot')) return
  const { dot, square, glow, glowSteps, plus, plusThick } = FX.tex
  const g = scene.make.graphics({}, false)
  const bake = (key: string, size: number) => {
    g.generateTexture(key, size, size)
    g.clear()
  }
  g.fillStyle(FX.tex.color).fillCircle(dot, dot, dot)
  bake('pfx_dot', dot * 2)
  g.fillStyle(FX.tex.color).fillRect(0, 0, square * 2, square * 2)
  bake('pfx_square', square * 2)
  // 가운데가 가장 밝은 부드러운 원: 반지름을 줄이며 옅게 겹쳐 그린다
  for (let i = 0; i < glowSteps; i++) g.fillStyle(FX.tex.color, 1 / glowSteps).fillCircle(glow, glow, (glow * (glowSteps - i)) / glowSteps)
  bake('pfx_glow', glow * 2)
  g.fillStyle(FX.tex.color).fillRect(0, plus - plusThick / 2, plus * 2, plusThick).fillRect(plus - plusThick / 2, 0, plusThick, plus * 2)
  bake('pfx_plus', plus * 2)
  g.destroy()
}

// 씬마다 이미터 묶음. 씬이 다시 시작되면(이미터가 파괴됨) 새로 만든다
function setOf(scene: Scene): Emitters {
  const have = emitters.get(scene)
  if (have && have.spark.scene) return have
  makeTextures(scene)
  const made = {} as Emitters
  for (const k of KINDS) {
    const kind = FX.kinds[k]
    made[k] = scene.add
      .particles(0, 0, `pfx_${kind.tex}`, { ...(kind.cfg as Types.GameObjects.Particles.ParticleEmitterConfig), emitting: false })
      .setDepth(kind.over ? FX.depthOver : FX.depthUnder)
  }
  emitters.set(scene, made)
  return made
}

// 지금 살아 있는 파티클 수(상한 계산, 헤드리스 측정)
export function aliveParticles(scene: Scene): number {
  return KINDS.reduce((sum, k) => sum + setOf(scene)[k].getAliveParticleCount(), 0)
}

// 파티클 한 묶음. n을 안 주면 종류별 기본 개수. 상한을 넘으면 남은 자리만큼만 낸다
export function burst(scene: Scene, kind: Kind, x: number, y: number, n: number = FX.kinds[kind].n): void {
  const count = Math.min(Math.round(n * (low ? FX.lowScale : 1)), FX.maxParticles - aliveParticles(scene))
  if (count > 0) setOf(scene)[kind].explode(count, x, y)
}

// 가산 혼합 부드러운 빛이 커지며 사라진다(총구 섬광·폭발 중심)
function glowFlash(scene: Scene, x: number, y: number, s: { color: number; from: number; to: number; ms: number; alpha: number }): void {
  setOf(scene) // 텍스처 보장
  const g = scene.add.image(x, y, 'pfx_glow').setTint(s.color).setBlendMode(BlendModes.ADD).setScale(s.from).setAlpha(s.alpha).setDepth(UI.fx.fxDepth)
  scene.tweens.add({ targets: g, scale: s.to, alpha: 0, duration: s.ms, onComplete: () => g.destroy() })
}

// 충격파 고리: 반지름이 커지며 사라진다(선 굵기는 그대로)
function ring(scene: Scene, x: number, y: number, s: { r: number; lineW: number; color: number; scale: number; ms: number; alpha: number }): void {
  const c = scene.add.circle(x, y, s.r).setStrokeStyle(s.lineW, s.color, s.alpha).setBlendMode(BlendModes.ADD).setDepth(UI.fx.fxDepth)
  scene.tweens.add({ targets: c, radius: s.r * s.scale, alpha: 0, duration: s.ms, onComplete: () => c.destroy() })
}

// ---- 히트스톱 ----
// 큰 사건 때 전투 dt를 잠깐 0으로 만든다. 실제 시간 기준이라 2배속이어도 같다
const stop = { left: 0 }
export const hitStop = (): void => {
  stop.left = FX.hitStopSec
}
export const resetStop = (): void => {
  stop.left = 0
  liveTexts = 0
}
// 정지 중이면 true(남은 시간을 real초만큼 줄인다). 호출한 쪽이 dt를 0으로 쓴다
export function stopping(real: number): boolean {
  if (stop.left <= 0) return false
  stop.left -= real
  return true
}

// 진급: 계급 고리 빛 + 별 파티클 + 히트스톱
export function promoteFx(scene: Scene, x: number, y: number): void {
  ring(scene, x, y, FX.ring.rank)
  burst(scene, 'star', x, y)
  hitStop()
}

// 지뢰 연계 팝업: 노란 글자가 위로 떠오르며 사라진다
// 떠오르는 글자 하나(상한 안에서만). 글자 하나가 캔버스 텍스처 하나라서 만들 때 비싸다.
// 같은 글자(같은 숫자·색)는 끝난 것을 숨겨 두었다가 다시 쓴다(setText를 부르지 않으니 캔버스를 다시 그리지 않는다)
// ponytail: 글자·색 조합마다 숨겨 두는 수는 FX.textPoolPerKey개까지, 비트맵 글꼴로 바꾸면 이 풀이 필요 없다
const textPool = new WeakMap<Scene, Map<string, GameObjects.Text[]>>()
function floatText(scene: Scene, x: number, y: number, str: string, color: string, depth: number, rise: number, ms: number): void {
  if (!textAllowed(liveTexts, FX.maxTexts, true)) return
  liveTexts++
  const key = `${color}|${str}`
  let pools = textPool.get(scene)
  if (!pools) textPool.set(scene, (pools = new Map()))
  let free = pools.get(key)
  if (!free) pools.set(key, (free = []))
  let t = free.pop()
  while (t && !t.scene) t = free.pop() // 씬이 다시 시작되며 파괴된 것은 버린다
  if (!t) t = scene.add.text(x, y, str, { fontFamily: UI.text.fontFamily, fontSize: `${UI.text.fontPx}px`, color }).setOrigin(0.5)
  t.setPosition(x, y).setAlpha(1).setVisible(true).setDepth(depth)
  const back = free
  scene.tweens.add({
    targets: t,
    y: y - rise,
    alpha: 0,
    duration: ms,
    onComplete: () => {
      liveTexts = Math.max(0, liveTexts - 1)
      if (back.length < FX.textPoolPerKey) back.push(t.setVisible(false))
      else t.destroy()
    },
  })
}

export function comboText(scene: Scene, x: number, y: number): void {
  floatText(scene, x, y, UI.text.combo, UI.text.popupColor, UI.fx.dragDepth, UI.fx.popupRise, UI.fx.popupMs)
}

// 피격 흰 번쩍임: 알파가 내려가며 사라진다
export function hitFlash(scene: Scene, x: number, y: number, w: number, h: number): void {
  const r = scene.add.rectangle(x, y, w, h, UI.colors.hitFlash, UI.fx.hitAlpha).setDepth(UI.fx.fxDepth)
  scene.tweens.add({ targets: r, alpha: 0, duration: UI.fx.hitMs, onComplete: () => r.destroy() })
}

// 데미지 숫자: 위로 떠오르며 사라진다
export function dmgText(scene: Scene, x: number, y: number, amount: number): void {
  if (!opts.dmgNumbers || low) return
  floatText(scene, x, y, String(Math.round(amount)), UI.text.color, UI.fx.fxDepth, UI.fx.dmgRise, UI.fx.dmgMs)
}

// 적 쓰러짐: 가라앉으며 페이드 후 destroy
// 스프라이트면 ART.fallAngle만큼 기울어지며 쓰러진다
export function fall(scene: Scene, view: GameObjects.Container): void {
  const angle = view.getData('sprite') ? ART.fallAngle : view.angle
  burst(scene, 'dust', view.x, view.y)
  scene.tweens.add({ targets: view, alpha: 0, angle, y: view.y + UI.fx.fallSink, duration: UI.fx.fallMs, onComplete: () => view.destroy() })
}

// 한 열 폭의 밝은 띠가 번쩍인다(최후 저지선). x = 열 중심
export function laneFlash(scene: Scene, x: number, topY: number, bottomY: number): void {
  const r = scene.add
    .rectangle(x, (topY + bottomY) / 2, LAYOUT.cell, bottomY - topY, UI.colors.laneFlash, UI.fx.laneFlashAlpha)
    .setDepth(UI.fx.fxDepth)
  scene.tweens.add({ targets: r, alpha: 0, duration: UI.fx.laneFlashMs, onComplete: () => r.destroy() })
}

export function shake(scene: Scene, kind: 'light' | 'heavy'): void {
  const { ms, intensity } = UI.shake[kind]
  scene.cameras.main.shake(ms, intensity)
}

// 총구 섬광: 가산 빛이 번쩍이고 탄피가 튄다. 그림 이펙트가 있으면 그 위에 탄피만 얹는다
export function muzzle(scene: Scene, x: number, y: number): void {
  if (!playFx(scene, 'fx_muzzle', x, y)) glowFlash(scene, x, y, FX.muzzle)
  burst(scene, 'casing', x, y)
}

// 탄 궤적: 금색 가산 선 + 끝으로 날아가는 빛 알갱이. delaySec 뒤 나타나 짧게 사라지고, 닿는 자리에 불꽃이 튄다
export function tracer(scene: Scene, x0: number, y0: number, x1: number, y1: number, delaySec: number): void {
  setOf(scene) // 텍스처 보장
  const l = scene.add.line(0, 0, x0, y0, x1, y1, UI.colors.tracer).setOrigin(0, 0).setLineWidth(UI.fx.tracerW).setBlendMode(BlendModes.ADD).setDepth(UI.fx.fxDepth).setVisible(false)
  const head = scene.add.image(x0, y0, 'pfx_glow').setTint(FX.tracer.headColor).setBlendMode(BlendModes.ADD).setScale(FX.tracer.headScale).setDepth(UI.fx.fxDepth).setVisible(false)
  const delay = delaySec * UI.fx.msPerSec
  scene.tweens.add({ targets: l, alpha: 0, delay, duration: UI.fx.tracerMs, onStart: () => l.setVisible(true), onComplete: () => l.destroy() })
  scene.tweens.add({
    targets: head,
    x: x1,
    y: y1,
    delay,
    duration: UI.fx.tracerMs,
    onStart: () => head.setVisible(true),
    onComplete: () => {
      head.destroy()
      burst(scene, 'spark', x1, y1)
    },
  })
}

// 저격 빛줄기: 금빛 굵은 바깥 선 + 흰 심지(둘 다 가산). 저격수에서 마지막 관통 대상까지(대각선 가능)
export function snipeLine(scene: Scene, x0: number, y0: number, x1: number, y1: number): void {
  const outer = scene.add.line(0, 0, x0, y0, x1, y1, FX.snipe.outerColor, FX.snipe.outerAlpha).setOrigin(0, 0).setLineWidth(FX.snipe.outerW)
  const core = scene.add.line(0, 0, x0, y0, x1, y1, UI.colors.snipe).setOrigin(0, 0).setLineWidth(UI.fx.snipeW)
  for (const l of [outer, core]) {
    l.setBlendMode(BlendModes.ADD).setDepth(UI.fx.fxDepth)
    scene.tweens.add({ targets: l, alpha: 0, duration: FX.snipe.ms, onComplete: () => l.destroy() })
  }
}

// 송풍 파동: 청백색 띠가 위로 번지고, 부채꼴 눈보라가 퍼진다. burning이면(상병 화염) 주황 불티가 섞인다
export function windWave(scene: Scene, x: number, y0: number, y1: number, burning: boolean): void {
  if (!playFx(scene, 'fx_wind', x, (y0 + y1) / 2)) {
    const r = scene.add.rectangle(x, y0, UI.fx.windW, UI.fx.windH, UI.colors.wind, UI.fx.windAlpha).setBlendMode(BlendModes.ADD).setDepth(UI.fx.fxDepth)
    scene.tweens.add({ targets: r, y: y1, alpha: 0, duration: UI.fx.windMs, onComplete: () => r.destroy() })
  }
  burst(scene, 'snow', x, y0)
  if (burning) burst(scene, 'ember', x, y0)
}

// 회복 숫자: 초록 "+n"이 위로 떠오르며 사라진다
export function healText(scene: Scene, x: number, y: number, amount: number): void {
  playFx(scene, 'fx_heal', x, y) // 숫자는 그대로 둔다
  burst(scene, 'plus', x, y)
  floatText(scene, x, y, `+${Math.round(amount)}`, UI.text.healColor, UI.fx.fxDepth, UI.fx.healRise, UI.fx.healMs)
}

// 부활 번쩍임: 흰색·연두 사각형이 커지며 사라진다
export function reviveFlash(scene: Scene, x: number, y: number, w: number, h: number): void {
  const r = scene.add.rectangle(x, y, w, h, UI.colors.revive, UI.fx.reviveAlpha).setDepth(UI.fx.fxDepth)
  scene.tweens.add({ targets: r, scale: UI.fx.reviveScale, alpha: 0, duration: UI.fx.reviveMs, onComplete: () => r.destroy() })
}

// 폭발(지뢰·화력 지원·RPG): 중심 번쩍임 + 충격파 고리 + 불꽃·파편·연기. 그림 이펙트가 있으면 그 위에 얹는다. 피 표현 없음
// scale: 파티클 배율(한꺼번에 여러 곳이 터질 때 줄인다). art: 그림 폭발을 얹을지(여럿이 터질 땐 일부만)
export function explosion(scene: Scene, x: number, y: number, scale = 1, art = true): void {
  if (art) playFx(scene, 'fx_explosion', x, y)
  glowFlash(scene, x, y, FX.ring.flash)
  ring(scene, x, y, FX.ring.blast)
  for (const k of ['fire', 'debris', 'smoke'] as const) burst(scene, k, x, y, scale < 1 ? scaledCount(FX.kinds[k].n, scale, false, 1) : undefined)
}

// 열 세로 띠(화력 지원 강조·예고선). 지우려면 호출한 쪽이 destroy한다. x = 열 중심, 폭·색·알파는 호출한 쪽이 정한다
export function colBand(scene: Scene, x: number, y0: number, y1: number, w: number, color: number, alpha: number): GameObjects.Rectangle {
  return scene.add.rectangle(x, (y0 + y1) / 2, w, y1 - y0, color, alpha).setDepth(UI.fx.fxDepth)
}

// 화상 불꽃: 그림이 있을 때만 그린다(도형 대체 없음)
export function flame(scene: Scene, x: number, y: number): void {
  playFx(scene, 'fx_flame', x, y)
}

// 아군 박격포의 고정 탄착점. 게임 dt 예약이 지우므로 트윈·실시간 타이머를 쓰지 않는다.
export function mortarWarning(scene: Scene, x: number, y: number, radius: number): GameObjects.Ellipse {
  return scene.add.ellipse(x, y, radius * LAYOUT.cell * 2, radius * LAYOUT.cell * 2, NEW_CARD_FX.mortar.color, NEW_CARD_FX.mortar.alpha)
    .setStrokeStyle(NEW_CARD_FX.mortar.lineW, NEW_CARD_FX.mortar.color, NEW_CARD_FX.mortar.alpha).setDepth(UI.fx.fxDepth)
}

// 소생 처치가 지속되는 동안의 연두 연결선. 취소·완료 때 호출자가 없앤다.
export function medicChannel(scene: Scene, x0: number, y0: number, x1: number, y1: number): GameObjects.Line {
  return scene.add.line(0, 0, x0, y0, x1, y1, NEW_CARD_FX.medic.color, NEW_CARD_FX.medic.alpha)
    .setOrigin(0, 0).setLineWidth(NEW_CARD_FX.medic.lineW).setBlendMode(BlendModes.ADD).setDepth(UI.fx.fxDepth)
}
