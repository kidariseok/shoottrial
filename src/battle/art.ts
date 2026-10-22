import { TintModes, type GameObjects, type Scene } from 'phaser'
import { ASSET_CONTRACTS } from '../assets'
import { ART, UI } from '../data'
import { artLoops, frameCount } from '../rules'

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
    if (n === 0) continue
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
  if (foot) view.add(scene.add.ellipse(0, ART.footY, ART.shadow.w, ART.shadow.h, ART.shadow.color, ART.shadow.alpha))
  const s = scene.add.sprite(0, foot ? ART.footY : 0, key, 0).setOrigin(0.5, foot ? ART.foot : 0.5)
  s.play(key)
  view.add(s)
  view.setData('sprite', s)
  view.setData('base', key)
  return s
}

// 공격 애니메이션 1회, 끝나면 원래 애니메이션으로. 스프라이트나 그 그림이 없으면 아무것도 하지 않는다
export function playAct(view: GameObjects.Container, actKey: string): void {
  const s = spriteOf(view)
  if (!s || !hasArt(actKey)) return
  s.play(actKey).chain(view.getData('base') as string)
}

// 피격: 스프라이트면 ART.hitMs 동안 흰색으로 채우고 true. 끝내는 건 tickHit(시간은 update dt로만 줄인다)
export function hitSprite(view: GameObjects.Container): boolean {
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
