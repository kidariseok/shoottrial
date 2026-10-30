import { beforeEach, describe, expect, it, vi } from 'vitest'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { BATTLE_AUDIO, ENEMIES } from '../src/data'
import type { Ally } from '../src/battle/units'

vi.mock('../src/audio', () => ({ playSfx: vi.fn() }))
vi.mock('../src/debug', () => ({ debug: { seed: 7 } }))
vi.mock('../src/battle/units', () => ({ damageAlly: vi.fn() }))
vi.mock('../src/battle/art', () => ({
  hasArt: () => false, setupMotion: vi.fn(), moveMotion: vi.fn(), leanMotion: vi.fn(),
  addSprite: vi.fn(), hitSprite: () => false, playAct: vi.fn(), anticipateMotion: vi.fn(),
}))
vi.mock('../src/battle/fx', () => ({
  comboText: vi.fn(), dmgText: vi.fn(), explosion: vi.fn(), hitFlash: vi.fn(), hitStop: vi.fn(),
  laneFlash: vi.fn(), shake: vi.fn(), tracer: vi.fn(), muzzle: vi.fn(), snipeLine: vi.fn(),
}))
import { playSfx } from '../src/audio'
import { spawnEnemy, tickEnemies } from '../src/battle/enemies'

// 화면 대신 오디오 요청만 검사한다. 실제 사격·출현 함수와 실제 데이터/규칙은 그대로 쓴다.
function sceneStub() {
  function shape(x = 0, y = 0) {
    const data = new Map<string, unknown>()
    return {
      x, y, setData(k: string, v: unknown) { data.set(k, v); return this }, getData(k: string) { return data.get(k) },
      add() { return this }, setOrigin() { return this }, setDepth() { return this }, setAlpha() { return this }, setVisible() { return this },
      setStrokeStyle() { return this }, clear() { return this }, fillStyle() { return this }, fillRect() { return this },
    }
  }
  const data = new Map<string, unknown>()
  return {
    add: { graphics: () => shape(), container: (x: number, y: number) => shape(x, y), rectangle: () => shape(), triangle: () => shape(), text: () => shape() },
    data: { get: (k: string) => data.get(k), set: (k: string, v: unknown) => data.set(k, v) },
    tweens: { add: vi.fn() },
  } as unknown as Parameters<typeof spawnEnemy>[0]
}
const board = {
  toScreen: (col: number, y: number) => ({ x: col * 128, y: y * 128 }), worldY: (y: number) => y,
} as Parameters<typeof spawnEnemy>[1]

beforeEach(() => vi.clearAllMocks())

describe('T-122 게임 동작과 효과음', () => {
  it('장갑차 한 번 출현에 엔진·궤도음을 한 번 요청하고 이동 틱에서는 반복하지 않는다', () => {
    const scene = sceneStub()
    const boss = spawnEnemy(scene, board, { t: 0, col: 2, type: 'boss' }, 5)
    expect(playSfx).toHaveBeenCalledExactlyOnceWith(BATTLE_AUDIO.armoredArrival)
    tickEnemies({ scene, board, enemies: [boss], allies: [], dogRand: () => 0 }, 0.1)
    tickEnemies({ scene, board, enemies: [boss], allies: [], dogRand: () => 0 }, 0.1)
    expect(playSfx).toHaveBeenCalledTimes(1)
  })
  it('보병 출현에는 차량 등장음을 재생하지 않는다', () => {
    spawnEnemy(sceneStub(), board, { t: 0, col: 2, type: 'infantry' }, 1)
    expect(playSfx).not.toHaveBeenCalled()
  })
  it.each(['infantry', 'marksman', 'boss'] as const)('%s 조준 중에는 무음, 실제 공격에만 해당 사격음을 한 번 요청한다', (type) => {
    const scene = sceneStub()
    const enemy = spawnEnemy(scene, board, { t: 0, col: 2, type }, 5)
    enemy.y = 4
    const ally = { col: 2, row: 0, y: 4.5, alive: true, taunt: false, unit: {}, combat: { alive: true, stun: 0 }, view: { x: 256, y: 576 } } as Ally
    vi.mocked(playSfx).mockClear()
    const ctx = { scene, board, enemies: [enemy], allies: [ally], dogRand: () => 0 }
    tickEnemies(ctx, ENEMIES[type].firstShot / 2)
    expect(playSfx).not.toHaveBeenCalled()
    tickEnemies(ctx, ENEMIES[type].firstShot / 2)
    expect(playSfx).toHaveBeenCalledExactlyOnceWith(BATTLE_AUDIO.enemy[type])
    tickEnemies(ctx, ENEMIES[type].interval / 2)
    expect(playSfx).toHaveBeenCalledTimes(1)
  })
  it('대전차병과 장갑차 사격은 포음, 일반 사격은 기존 총성 키를 사용한다', () => {
    expect(BATTLE_AUDIO.attack.antitank).toBe('sfx_cannon_shot')
    expect(BATTLE_AUDIO.enemy.boss).toBe('sfx_cannon_shot')
    expect(BATTLE_AUDIO.attack.rifle).toBe('sfx_rifle')
    expect(BATTLE_AUDIO.attack.sniper).toBe('sfx_sniper')
  })
})

describe('T-122 배포 효과음 파일', () => {
  const credits = JSON.parse(readFileSync(new URL('../public/assets/audio-credits.json', import.meta.url), 'utf8'))
  it.each(['sfx_rifle', 'sfx_sniper', 'sfx_cannon_shot', 'sfx_armored_arrival'])('%s가 실제 파일·출처·재생성 소스를 갖고30KB 이하다', (key) => {
    const path = fileURLToPath(new URL(`../public/assets/${key}.m4a`, import.meta.url))
    expect(statSync(path).size).toBeGreaterThan(0)
    expect(statSync(path).size).toBeLessThanOrEqual(30_000)
    expect(credits[key].source).toBeTruthy()
    expect(existsSync(fileURLToPath(new URL(`../${credits[key].recipe}`, import.meta.url)))).toBe(true)
  })
})
