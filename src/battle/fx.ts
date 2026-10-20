import type { Scene, GameObjects } from 'phaser'
import { LAYOUT, UI } from '../data'

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
export function fall(scene: Scene, view: GameObjects.Container): void {
  scene.tweens.add({ targets: view, alpha: 0, y: view.y + UI.fx.fallSink, duration: UI.fx.fallMs, onComplete: () => view.destroy() })
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
