import type { Scene, GameObjects } from 'phaser'
import { ART, LAYOUT, UI } from '../data'
import { playFx } from './art'

// 도형·트윈만 쓰는 공통 연출. 피·시체 표현은 쓰지 않는다

// 피격 흰 번쩍임: 알파가 내려가며 사라진다
export function hitFlash(scene: Scene, x: number, y: number, w: number, h: number): void {
  const r = scene.add.rectangle(x, y, w, h, UI.colors.hitFlash, UI.fx.hitAlpha).setDepth(UI.fx.fxDepth)
  scene.tweens.add({ targets: r, alpha: 0, duration: UI.fx.hitMs, onComplete: () => r.destroy() })
}

// 데미지 숫자: 위로 떠오르며 사라진다
export function dmgText(scene: Scene, x: number, y: number, amount: number): void {
  const t = scene.add
    .text(x, y, String(Math.round(amount)), { fontFamily: UI.text.fontFamily, fontSize: `${UI.text.fontPx}px`, color: UI.text.color })
    .setOrigin(0.5)
    .setDepth(UI.fx.fxDepth)
  scene.tweens.add({ targets: t, y: y - UI.fx.dmgRise, alpha: 0, duration: UI.fx.dmgMs, onComplete: () => t.destroy() })
}

// 적 쓰러짐: 가라앉으며 페이드 후 destroy
// 스프라이트면 ART.fallAngle만큼 기울어지며 쓰러진다
export function fall(scene: Scene, view: GameObjects.Container): void {
  const angle = view.getData('sprite') ? ART.fallAngle : view.angle
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

// 총구 섬광: 노란 작은 원이 번쩍였다 사라진다
export function muzzle(scene: Scene, x: number, y: number): void {
  if (playFx(scene, 'fx_muzzle', x, y)) return
  const c = scene.add.circle(x, y, UI.fx.muzzleR, UI.colors.muzzle).setDepth(UI.fx.fxDepth)
  scene.tweens.add({ targets: c, alpha: 0, duration: UI.fx.muzzleMs, onComplete: () => c.destroy() })
}

// 탄 궤적: 노랑 가는 선이 delaySec 뒤 나타나 짧게 사라진다
export function tracer(scene: Scene, x0: number, y0: number, x1: number, y1: number, delaySec: number): void {
  const l = scene.add.line(0, 0, x0, y0, x1, y1, UI.colors.tracer).setOrigin(0, 0).setLineWidth(UI.fx.tracerW).setDepth(UI.fx.fxDepth).setVisible(false)
  scene.tweens.add({
    targets: l,
    alpha: 0,
    delay: delaySec * UI.fx.msPerSec,
    duration: UI.fx.tracerMs,
    onStart: () => l.setVisible(true),
    onComplete: () => l.destroy(),
  })
}

// 저격 흰 선: 저격수에서 열 맨 위까지 굵은 세로 선
export function snipeLine(scene: Scene, x: number, y0: number, y1: number): void {
  const r = scene.add.rectangle(x, (y0 + y1) / 2, UI.fx.snipeW, Math.abs(y0 - y1), UI.colors.snipe).setDepth(UI.fx.fxDepth)
  scene.tweens.add({ targets: r, alpha: 0, duration: UI.fx.snipeMs, onComplete: () => r.destroy() })
}

// 송풍 파동: 청백색 띠가 제설병에서 위로 번지며 사라진다
export function windWave(scene: Scene, x: number, y0: number, y1: number): void {
  if (playFx(scene, 'fx_wind', x, (y0 + y1) / 2)) return
  const r = scene.add.rectangle(x, y0, UI.fx.windW, UI.fx.windH, UI.colors.wind, UI.fx.windAlpha).setDepth(UI.fx.fxDepth)
  scene.tweens.add({ targets: r, y: y1, alpha: 0, duration: UI.fx.windMs, onComplete: () => r.destroy() })
}

// 회복 숫자: 초록 "+n"이 위로 떠오르며 사라진다
export function healText(scene: Scene, x: number, y: number, amount: number): void {
  playFx(scene, 'fx_heal', x, y) // 숫자는 그대로 둔다
  const t = scene.add
    .text(x, y, `+${Math.round(amount)}`, { fontFamily: UI.text.fontFamily, fontSize: `${UI.text.fontPx}px`, color: UI.text.healColor })
    .setOrigin(0.5)
    .setDepth(UI.fx.fxDepth)
  scene.tweens.add({ targets: t, y: y - UI.fx.healRise, alpha: 0, duration: UI.fx.healMs, onComplete: () => t.destroy() })
}

// 부활 번쩍임: 흰색·연두 사각형이 커지며 사라진다
export function reviveFlash(scene: Scene, x: number, y: number, w: number, h: number): void {
  const r = scene.add.rectangle(x, y, w, h, UI.colors.revive, UI.fx.reviveAlpha).setDepth(UI.fx.fxDepth)
  scene.tweens.add({ targets: r, scale: UI.fx.reviveScale, alpha: 0, duration: UI.fx.reviveMs, onComplete: () => r.destroy() })
}

// 지뢰 폭발: 열 폭 × h 청백색 사각형이 번쩍이고 가운데 원이 커지며 사라진다. 피·불꽃 표현 없음
export function explosion(scene: Scene, x: number, y: number, h: number): void {
  if (playFx(scene, 'fx_explosion', x, y)) return
  const r = scene.add.rectangle(x, y, LAYOUT.cell, h, UI.colors.explosion, UI.fx.explodeAlpha).setDepth(UI.fx.fxDepth)
  scene.tweens.add({ targets: r, alpha: 0, duration: UI.fx.explodeMs, onComplete: () => r.destroy() })
  const c = scene.add.circle(x, y, UI.fx.explodeCoreR, UI.colors.explosion).setDepth(UI.fx.fxDepth)
  scene.tweens.add({ targets: c, scale: UI.fx.explodeCoreScale, alpha: 0, duration: UI.fx.explodeMs, onComplete: () => c.destroy() })
}

// 열 세로 띠(화력 지원 강조·예고선). 지우려면 호출한 쪽이 destroy한다. x = 열 중심, 폭·색·알파는 호출한 쪽이 정한다
export function colBand(scene: Scene, x: number, y0: number, y1: number, w: number, color: number, alpha: number): GameObjects.Rectangle {
  return scene.add.rectangle(x, (y0 + y1) / 2, w, y1 - y0, color, alpha).setDepth(UI.fx.fxDepth)
}

// 화상 불꽃: 그림이 있을 때만 그린다(도형 대체 없음)
export function flame(scene: Scene, x: number, y: number): void {
  playFx(scene, 'fx_flame', x, y)
}
