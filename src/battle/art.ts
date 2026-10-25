import { Math as PMath, TintModes, type GameObjects, type Scene } from 'phaser'
import { ASSET_CONTRACTS } from '../assets'
import { ART, DOG, UI, LAYOUT, CHARACTERS, RANK_VISUAL, type CardKey } from '../data'
import { artLoops, frameCount, clipFps, motionEnabled, walkFps } from '../rules'

// 실제 그림이 있는 키 모음. 없는 키는 도형이 그대로 쓰인다.
// ponytail: 모듈 하나를 판 사이에 공유한다(씬 재시작마다 setupArt가 다시 채운다), 씬이 둘 이상 그림을 쓰면 씬 필드로
export const art = new Set<string>()
export const hasArt = (key: string): boolean => art.has(key)

const spriteOf = (view: GameObjects.Container) => view.data?.get('sprite') as GameObjects.Sprite | undefined

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

// 발사 때 공격 클립과 반동을 시작한다. 예비 동작은 남은 쿨다운에서 따로 준비한다.
export function playAct(view: GameObjects.Container, actKey: string, interval: number): void {
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
  const prev = (view.data?.get('hit') as number | undefined) ?? 0
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
  act: 'idle' | 'anticipate' | 'attack' | 'hit' | 'down' | 'promote'; elapsed: number; seconds: number;
  facing: number; speed: number; moving: boolean; walkTime: number; stillFrame: number; lane: number; keep: boolean;
}
const motionOf = (view: GameObjects.Container) => view.data?.get('motion') as Motion | undefined
const enabled = () => motionEnabled(new URLSearchParams(location.search).get('motion'))

export function setupMotion(view: GameObjects.Container, key: string, phase: number, facing = -1): void {
  if (!enabled() || motionOf(view)) return
  const sprite = spriteOf(view)
  let shadow = view.getData('shadow') as GameObjects.Ellipse | undefined
  // 계급·이름·체력바는 움직이지 않고 몸만 발끝을 중심으로 변형한다.
  const pieces = sprite ? (key.startsWith('boss_') ? [...view.list] : [sprite]) : view.list.slice(0, facing < 0 ? 2 : 1) as GameObjects.GameObject[]
  const body = view.scene.add.container(0, ART.footY)
  for (const child of pieces) {
    view.remove(child)
    const part = child as GameObjects.Sprite
    part.y -= ART.footY
    body.add(child)
  }
  if (!shadow && !key.startsWith('boss_')) {
    shadow = view.scene.add.ellipse(0, ART.footY, ART.shadow.w, ART.shadow.h, ART.shadow.color, ART.shadow.alpha)
    view.addAt(shadow, 0)
    view.setData('shadow', shadow)
  }
  view.addAt(body, shadow ? 1 : 0)
  sprite?.stop()
  view.setData('motion', { body, key, phase, age: 0, entered: 0, act: 'idle', elapsed: 0, seconds: 0, facing, speed: 0, moving: false, walkTime: 0, stillFrame: 0, lane: 0, keep: false } satisfies Motion)
}

function beginAct(view: GameObjects.Container, act: Motion['act'], key: string, seconds: number): void {
  const m = motionOf(view)
  if (!m || m.act === 'down') return
  m.act = act
  m.key = key
  m.elapsed = 0
  m.seconds = seconds
}

// 다음 발사를 기다리는 마지막 순간에 눌린다. 피해 판정·쿨다운은 바꾸지 않는다.
// ponytail: 첫 공격은 즉시 판정한다, 선딜레이 규칙 도입 때 첫 예비 동작도 연결한다.
export function anticipateMotion(view: GameObjects.Container, remaining: number, interval: number): void {
  const m = motionOf(view)
  const seconds = Math.min(ART.motion.anticipateSec, interval * ART.fps.attackShare * ART.motion.recoilShare)
  if (m?.act === 'idle' && remaining > 0 && remaining <= seconds) {
    beginAct(view, 'anticipate', view.getData('base') as string, seconds)
  }
}

export function moveMotion(view: GameObjects.Container, speed: number, moving: boolean): void {
  const m = motionOf(view)
  if (m) { m.speed = speed; m.moving = moving }
}

export function leanMotion(view: GameObjects.Container, direction: number): void {
  const m = motionOf(view)
  if (m) m.lane = Math.sign(direction)
}

// 진급 경례와 대사. 초기 배치에는 applyRankArt만 호출해 대사가 나오지 않는다.
export function promoteMotion(view: GameObjects.Container, rank: number): void {
  const card = view.getData('rankCard') as CardKey | undefined
  const quote = card ? CHARACTERS[card]?.quotes[rank - 2] : undefined
  if (quote) {
    ;(view.getData('rankBubble') as GameObjects.Text | undefined)?.destroy()
    const p = RANK_VISUAL.bubble
    const bubble = view.scene.add.text(0, p.y, `${RANK_VISUAL.promoteText}\n${quote}`, {
      fontFamily: UI.text.fontFamily, fontSize: `${p.fontPx}px`, color: p.color,
      backgroundColor: p.background, padding: { x: p.padding, y: p.padding }, align: 'center',
    }).setOrigin(0.5, 1)
    const half = bubble.width * view.scaleX / 2
    bubble.x = (PMath.Clamp(view.x, half, LAYOUT.width - half) - view.x) / view.scaleX
    view.add(bubble)
    view.setData('rankBubble', bubble).setData('quoteLeft', RANK_VISUAL.quoteMs / UI.fx.msPerSec)
  }
  const base = view.getData('base') as string | undefined
  if (rank > 1 && base && hasArt(base.replace(/_idle$/, '_promote'))) beginAct(view, 'promote', base.replace(/_idle$/, '_promote'), ART.motion.promoteSec)
}

export function downMotion(view: GameObjects.Container, keep = false): boolean {
  const m = motionOf(view)
  if (!m) return false
  m.act = 'down'
  m.stillFrame = Number(spriteOf(view)?.frame.name) || 0
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
  m.body.setPosition(0, ART.footY).setScale((view.getData('rankScale') as number | undefined) ?? 1).setAngle(0)
  tickHit(view, Infinity)
  view.setAlpha(1)
}

export function tickMotion(view: GameObjects.Container, dt: number): void {
  tickHit(view, dt)
  const quoteLeft = (view.getData('quoteLeft') as number | undefined) ?? 0
  if (quoteLeft > 0) {
    view.setData('quoteLeft', Math.max(0, quoteLeft - dt))
    if (quoteLeft <= dt) {
      ;(view.getData('rankBubble') as GameObjects.Text | undefined)?.destroy()
      view.setData('rankBubble', undefined)
    }
  }
  const m = motionOf(view)
  if (!m) return
  const p = ART.motion
  m.age += dt
  if (m.moving) m.walkTime += dt * walkFps(m.speed)
  m.entered += dt
  m.elapsed += dt
  const base = view.getData('base') as string
  if (m.act !== 'idle' && m.act !== 'down' && m.elapsed >= m.seconds) {
    m.act = 'idle'
    m.key = base
    m.elapsed = 0
  }
  const breath = Math.sin((m.age / p.idleSec + m.phase) * Math.PI * 2)
  const enter = Math.min(1, m.entered / p.enterSec)
  const pop = PMath.Easing.Back.Out(enter)
  const scale = p.enterScale + (1 - p.enterScale) * pop
  let y = 0
  let sy = m.facing < 0 ? 1 + breath * p.idleScale : 1
  let angle = m.lane * p.laneAngle
  m.lane *= Math.max(0, 1 - dt / (DOG.laneMs / UI.fx.msPerSec))
  if (m.act === 'anticipate') {
    sy *= 1 - p.anticipate * Math.sin(Math.min(1, m.elapsed / m.seconds) * Math.PI / 2)
  } else if (m.act === 'attack') {
    const t = Math.min(1, m.elapsed / m.seconds)
    y = -m.facing * p.recoilPx * (1 - PMath.Easing.Back.Out(t))
  } else if (m.act === 'hit') {
    y = -m.facing * p.hitPx * Math.sin(Math.min(1, m.elapsed / p.hitSec) * Math.PI)
  } else if (m.act === 'down') {
    sy = 1
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
  const growth = (view.getData('rankScale') as number | undefined) ?? 1
  m.body.setPosition(0, ART.footY + y).setScale(scale * growth, scale * sy * growth).setAngle(angle)
  const shadow = view.getData('shadow') as GameObjects.Ellipse | undefined
  shadow?.setScale(1 - breath * p.shadowScale, 1)
  const s = spriteOf(view)
  if (!s) return
  const key = hasArt(m.key) ? m.key : base
  if (!hasArt(key)) return
  const n = (view.scene.anims.get(key)?.frames.length ?? 1)
  let frame: number
  if (key === base) {
    const progress = m.facing > 0 ? m.walkTime : m.age * ART.fps.loop
    frame = m.act === 'down' ? Math.min(n - 1, m.stillFrame) : Math.floor(progress + m.phase * n) % n
  } else {
    frame = Math.min(n - 1, Math.floor(m.elapsed * clipFps(n, m.seconds)))
  }
  if (s.texture.key !== key || s.frame.name !== String(frame)) s.setTexture(key, frame)
}

// 몸만 발끝 기준으로 키운다. 바깥 컨테이너 크기와 드래그 영역은 그대로다.
export function applyRankArt(view: GameObjects.Container, card: string, rank: number, name?: string): void {
  const p = RANK_VISUAL
  view.setData('rankCard', card).setData('rankName', name)
  const growth = p.scale[rank - 1] ?? 1
  view.setData('rankScale', growth)
  let body = motionOf(view)?.body ?? view.getData('rankBody') as GameObjects.Container | undefined
  if (!body) {
    // motion=0도 같은 발 피벗을 쓴다. 장식을 넣기 전에 기존 몸 두 조각만 옮긴다.
    const sprite = spriteOf(view)
    const pieces = sprite ? [sprite] : view.list.slice(0, 2)
    body = view.scene.add.container(0, ART.footY)
    for (const child of pieces) {
      view.remove(child)
      ;(child as GameObjects.Sprite).y -= ART.footY
      body.add(child)
    }
    view.addAt(body, sprite ? 1 : 0)
    view.setData('rankBody', body)
  }
  body.setScale(growth)
  ;(view.getData('rankDecoration') as GameObjects.Container | undefined)?.destroy()
  const decoration = view.scene.add.container(0, 0)
  view.addAt(decoration, 0)
  view.setData('rankDecoration', decoration)
  if (rank >= 2) {
    const r = p.ringShape
    decoration.add(view.scene.add.ellipse(0, ART.footY, r.w, r.h).setStrokeStyle(r.lineW, p.ring, r.alpha))
  }
  if (rank >= 3) {
    const h = p.halo
    decoration.add(view.scene.add.ellipse(0, h.y, h.w, h.h, p.aura, h.alpha))
  }
  ;(view.getData('rankTitle') as GameObjects.Text | undefined)?.destroy()
  view.setData('rankTitle', undefined)
  if (rank >= 4) {
    const a = p.star
    decoration.add(view.scene.add.star(0, a.y, a.points, a.innerRadius, a.outerRadius, p.aura, a.alpha))
    const title = view.scene.add.text(0, p.title.y, p.veteran, {
      fontFamily: UI.text.fontFamily, fontSize: `${p.title.fontPx}px`, color: UI.text.popupColor,
    }).setOrigin(0.5)
    view.add(title)
    view.setData('rankTitle', title)
  }
}
