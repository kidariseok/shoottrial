import { TintModes, type GameObjects, type Scene } from 'phaser'
import { ASSET_CONTRACTS } from '../assets'
import { ART, DOG, UI } from '../data'
import { artLoops, frameCount, clipFps, motionEnabled, walkFps } from '../rules'

// 실제 그림이 있는 키 모음. 없는 키는 도형이 그대로 쓰인다.
// ponytail: 모듈 하나를 판 사이에 공유한다(씬 재시작마다 setupArt가 다시 채운다), 씬이 둘 이상 그림을 쓰면 씬 필드로
export const art = new Set<string>()
export const hasArt = (key: string): boolean => art.has(key)

const spriteOf = (view: GameObjects.Container) => view.getData('sprite') as GameObjects.Sprite | undefined

// preload: 그림 목록을 글자로 받고(깨진 JSON이 로더 예외가 되지 않게 직접 해석), 끝나면 계약에 있는 키만 이미지로 이어서 받는다. 목록이 없거나 깨져도 조용히 빈 목록이다
// ponytail: ?art=0 은 게이트 때 debug.ts로
export function loadArt(scene: Scene): void {
  art.clear()
  if (new URLSearchParams(location.search).get('art') === '0') return
  scene.cache.text.remove(ART.indexKey) // 재시작해도 목록을 새로 받는다
  scene.load.text(ART.indexKey, ART.indexUrl)
  scene.load.once(`filecomplete-text-${ART.indexKey}`, () => {
    for (const key of indexOf(scene)) if (ASSET_CONTRACTS.some((c) => c.key === key)) scene.load.image(key, `${ART.dir}${key}.png`)
  })
}

function indexOf(scene: Scene): string[] {
  try {
    const list: unknown = JSON.parse(scene.cache.text.get(ART.indexKey) ?? '[]')
    return Array.isArray(list) ? list.filter((k): k is string => typeof k === 'string') : []
  } catch {
    return []
  }
}

// create: 텍스처가 실제로 로드되고 크기가 계약과 맞는 키만 art에 넣고, 프레임과 애니메이션을 만든다
export function setupArt(scene: Scene): void {
  art.clear()
  for (const key of indexOf(scene)) {
    const c = ASSET_CONTRACTS.find((k) => k.key === key)
    if (!c || !scene.textures.exists(key)) continue
    const tex = scene.textures.get(key)
    const img = tex.getSourceImage()
    const n = img.height === c.h ? frameCount(img.width, c.w) : 0
    if (n < c.frames || n > (c.maxFrames ?? c.frames)) continue
    for (let i = 0; i < n; i++) if (!tex.has(String(i))) tex.add(i, 0, i * c.w, 0, c.w, c.h)
    if (!scene.anims.exists(key)) {
      const loop = artLoops(key)
      scene.anims.create({ key, frames: Array.from({ length: n }, (_, i) => ({ key, frame: i })), frameRate: loop ? ART.fps.loop : ART.fps.once, repeat: loop ? -1 : 0 })
    }
    art.add(key)
  }
}

// 컨테이너에 스프라이트를 넣는다. foot이면 발끝 피벗 + 발밑 그림자(반투명 타원, 코드가 그린다), 아니면 중앙 피벗
export function addSprite(scene: Scene, view: GameObjects.Container, key: string, foot = true): GameObjects.Sprite {
  if (foot) {
    const shadow = scene.add.ellipse(0, ART.footY, ART.shadow.w, ART.shadow.h, ART.shadow.color, ART.shadow.alpha)
    view.add(shadow)
    view.setData('shadow', shadow)
  }
  const s = scene.add.sprite(0, foot ? ART.footY : 0, key, 0).setOrigin(0.5, foot ? ART.foot : 0.5)
  s.play(key)
  view.add(s)
  view.setData('sprite', s)
  view.setData('base', key)
  return s
}

// 공격 애니메이션 1회, 끝나면 원래 애니메이션으로. 스프라이트나 그 그림이 없으면 아무것도 하지 않는다
export function playAct(view: GameObjects.Container, actKey: string, interval = 1): void {
  if (motionOf(view)) {
    beginAct(view, 'attack', actKey, Math.max(ART.fps.minClipSec, interval * ART.fps.attackShare))
    return
  }
  const s = spriteOf(view)
  if (!s || !hasArt(actKey)) return
  s.play(actKey).chain(view.getData('base') as string)
}

// 피격: 스프라이트면 ART.hitMs 동안 흰색으로 채우고 true. 끝내는 건 tickHit(시간은 update dt로만 줄인다)
export function hitSprite(view: GameObjects.Container): boolean {
  const base = view.getData('base') as string | undefined
  if (base) {
    const key = base.replace(/_(idle|walk|run|hull)$/, '_hit')
    beginAct(view, 'hit', key, hasArt(key) ? (view.scene.anims.get(key)?.frames.length ?? 1) / ART.fps.once : ART.motion.hitSec)
  }
  const s = spriteOf(view)
  if (!s) return false
  s.setTint(ART.hitTint).setTintMode(TintModes.FILL)
  view.setData('hit', ART.hitMs / UI.fx.msPerSec)
  return true
}

export function tickHit(view: GameObjects.Container, dt: number): void {
  const prev = (view.getData('hit') as number | undefined) ?? 0
  if (prev <= 0) return
  const left = prev - dt
  view.setData('hit', Math.max(0, left))
  const s = spriteOf(view)
  if (left > 0 || !s) return
  s.setTintMode(TintModes.MULTIPLY)
  const base = view.getData('tint') as number | undefined
  if (base === undefined) s.clearTint()
  else s.setTint(base)
}

// 이펙트 그림 1회(반복 키면 계속) 재생. 그림이 없으면 false를 돌려 도형 경로가 이어지게 한다
export function playFx(scene: Scene, key: string, x: number, y: number): boolean {
  if (!hasArt(key)) return false
  const s = scene.add.sprite(x, y, key, 0).setDepth(UI.fx.fxDepth)
  s.play(key)
  if (!artLoops(key)) s.once('animationcomplete', () => s.destroy())
  return true
}

// ponytail: 시각 동작 시간은 전투 update의 dt로만 흐른다. 위치·피해 판정은 기존 전투 코드가 맡는다.
type Motion = {
  body: GameObjects.Container; key: string; phase: number; age: number; entered: number;
  act: 'idle' | 'attack' | 'hit' | 'down' | 'promote'; elapsed: number; seconds: number;
  facing: number; speed: number; moving: boolean; lane: number; keep: boolean;
}
const motionOf = (view: GameObjects.Container) => view.getData('motion') as Motion | undefined
const enabled = () => motionEnabled(new URLSearchParams(location.search).get('motion'))

export function setupMotion(view: GameObjects.Container, key: string, phase: number, facing = -1): void {
  if (!enabled() || motionOf(view)) return
  const sprite = spriteOf(view)
  const shadow = view.getData('shadow') as GameObjects.Ellipse | undefined
  // 계급·이름·체력바는 움직이지 않고 몸만 발끝을 중심으로 변형한다.
  const pieces = sprite ? [sprite] : view.list.slice(0, facing < 0 ? 2 : 1) as GameObjects.GameObject[]
  const body = view.scene.add.container(0, ART.footY)
  for (const child of pieces) {
    view.remove(child)
    const part = child as GameObjects.Sprite
    part.y -= ART.footY
    body.add(child)
  }
  view.addAt(body, shadow ? 1 : 0)
  sprite?.stop()
  view.setData('motion', { body, key, phase, age: 0, entered: 0, act: 'idle', elapsed: 0, seconds: 0, facing, speed: 0, moving: false, lane: 0, keep: false } satisfies Motion)
}

function beginAct(view: GameObjects.Container, act: Motion['act'], key: string, seconds: number): void {
  const m = motionOf(view)
  if (!m || m.act === 'down') return
  m.act = act
  m.key = key
  m.elapsed = 0
  m.seconds = seconds
}

export function moveMotion(view: GameObjects.Container, speed: number, moving: boolean): void {
  const m = motionOf(view)
  if (m) { m.speed = speed; m.moving = moving }
}

export function leanMotion(view: GameObjects.Container, direction: number): void {
  const m = motionOf(view)
  if (m) m.lane = Math.sign(direction)
}

// 다음 계급 티켓에서 링·후광·오라를 붙일 연결 지점. 이 티켓에서는 선택적 경례 클립만 연다.
export function promoteMotion(view: GameObjects.Container, rank: number): void {
  const base = view.getData('base') as string | undefined
  if (rank > 1 && base) beginAct(view, 'promote', base.replace(/_idle$/, '_promote'), ART.motion.promoteSec)
}

export function downMotion(view: GameObjects.Container, keep = false): boolean {
  const m = motionOf(view)
  if (!m) return false
  m.act = 'down'
  m.key = (view.getData('base') as string).replace(/_(idle|walk|run|hull)$/, '_down')
  m.elapsed = 0
  m.seconds = hasArt(m.key) ? (view.scene.anims.get(m.key)?.frames.length ?? 1) / ART.fps.once : UI.fx.fallMs / UI.fx.msPerSec
  m.keep = keep
  return true
}

export function restoreMotion(view: GameObjects.Container): void {
  const m = motionOf(view)
  if (!m) return
  m.act = 'idle'
  m.elapsed = 0
  m.key = view.getData('base') as string
  m.body.setPosition(0, ART.footY).setScale(1).setAngle(0)
  view.setAlpha(1)
}

export function tickMotion(view: GameObjects.Container, dt: number): void {
  const m = motionOf(view)
  if (!m) return
  const p = ART.motion
  m.age += dt
  m.entered += dt
  m.elapsed += dt
  const base = view.getData('base') as string
  const anticipation = m.act === 'attack' ? Math.min(p.anticipateSec, m.seconds * p.recoilShare) : 0
  if (m.act !== 'idle' && m.act !== 'down' && m.elapsed >= m.seconds + anticipation) {
    m.act = 'idle'
    m.key = base
    m.elapsed = 0
  }
  const breath = Math.sin((m.age / p.idleSec + m.phase) * Math.PI * 2)
  const enter = Math.min(1, m.entered / p.enterSec)
  const pop = 1 + ART.motion.backCubic * (enter - 1) ** 3 + ART.motion.backSquare * (enter - 1) ** 2 // Phaser Back.Out와 같은 곡선
  const scale = p.enterScale + (1 - p.enterScale) * pop
  let y = 0
  let sy = m.facing < 0 ? 1 + breath * p.idleScale : 1
  let angle = m.lane * p.laneAngle
  m.lane *= Math.max(0, 1 - dt / (DOG.laneMs / UI.fx.msPerSec))
  if (m.act === 'attack') {
    if (m.elapsed < anticipation) sy *= 1 - p.anticipate * Math.sin(m.elapsed / anticipation * Math.PI / 2)
    else {
      const t = Math.min(1, (m.elapsed - anticipation) / m.seconds)
      // 발동 직후 반동이 가장 크고 Back.Out으로 원위치에 돌아온다.
      const back = 1 + ART.motion.backCubic * (t - 1) ** 3 + ART.motion.backSquare * (t - 1) ** 2
      y = -m.facing * p.recoilPx * (1 - back)
    }
  } else if (m.act === 'hit') {
    y = -m.facing * p.hitPx * Math.sin(Math.min(1, m.elapsed / p.hitSec) * Math.PI)
  } else if (m.act === 'down') {
    const t = Math.min(1, m.elapsed / m.seconds)
    if (!hasArt(m.key)) angle = ART.fallAngle * t
    if (m.keep) view.setAlpha(1 - (1 - UI.fx.fallenAlpha) * t)
    else {
      const fade = Math.max(0, (m.elapsed - m.seconds) / (UI.fx.fallMs / UI.fx.msPerSec))
      view.setAlpha(Math.max(0, 1 - fade))
      if (fade >= 1) { view.destroy(); return }
    }
  } else if (m.facing > 0 && m.moving && !hasArt(base)) {
    sy += Math.sin((m.age * Math.max(ART.fps.minWalk, m.speed * ART.fps.walkPerSpeed) / ART.fps.loop + m.phase) * Math.PI * 2) * p.walkBob
  }
  m.body.setPosition(0, ART.footY + y).setScale(scale, scale * sy).setAngle(angle)
  const shadow = view.getData('shadow') as GameObjects.Ellipse | undefined
  shadow?.setScale(1 - breath * p.shadowScale, 1)
  const s = spriteOf(view)
  if (!s) return
  let key = hasArt(m.key) ? m.key : base
  if (m.act === 'attack' && m.elapsed < anticipation) key = base
  if (!hasArt(key)) return
  const n = (view.scene.anims.get(key)?.frames.length ?? 1)
  let frame: number
  if (key === base) {
    const fps = m.facing > 0 ? (m.moving ? walkFps(m.speed) : 0) : ART.fps.loop
    frame = Math.floor(m.age * fps + m.phase * n) % n
  } else {
    frame = Math.min(n - 1, Math.floor(Math.max(0, m.elapsed - anticipation) * clipFps(n, m.seconds)))
  }
  if (s.texture.key !== key || s.frame.name !== String(frame)) s.setTexture(key, frame)
}
