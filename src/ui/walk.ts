// T-109 걸어 다니는 생활관: 조이스틱으로 걷다가 구역 앞에서 "열기"를 누르면 패널(lobby.ts)이 열린다.
// HUD·말풍선·버튼·조이스틱·비상 연출은 모두 Phaser로 그린다(DOM과 캔버스 겹침·Safe Area 문제를 피한다). 계산은 helpers.ts의 순수 함수.
import { BlendModes, Scene, type GameObjects, type Input, type Types } from 'phaser'
import { playSfx } from '../audio'
import { hasArt, loadArt, setupArt } from '../battle/art'
import { facingFor, turnToward, walkDirection } from './walk-motion'
import { deploy, getLobbySave, isPanelOpen, openPanel, type PanelKind } from './lobby'
import {
  getRankName,
  loadAlarmFx,
  moveStep,
  nearestZone,
  nextLine,
  pulseAlpha,
  sanitizeRookieName,
  stickVector,
  type Rect,
  type Vec,
  type Zone,
} from './helpers'

const W = 720
const MAP_H = 1280
const FONT = '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'

type Spot = {
  id: string
  x: number
  y: number
  r: number
  title: string
  desc: string
  kind: 'panel' | 'deploy' | 'npc'
  panel?: PanelKind
  art?: string
  marker?: Vec
  lines?: string[]
}
type Hot = Zone & { spot: Spot }
type Actor = { box: GameObjects.Container; sprite: GameObjects.Sprite | null; idle: string; facing: number; target: number; turnAt: number; home: number }

// ponytail: 승인한 생활관 그림의 가구/통로 좌표. 한 화면 좌표 표이며 배경이 바뀌면 ?zones=1로 다시 맞춘다.
// 지도는 한 화면(720×1280)이고 스크롤하지 않는다. 화면이 더 길면 위아래를 어두운 색으로 채운다.
const L = {
  start: { x: 0.5, y: 0.85 },
  speed: 230, // px/초, 생활관의 좁은 통로에 맞춘 보행 속도
  radius: 18,
  strideFps: 8,
  turnMs: 65,
  talkMs: 5000,
  bounds: { x: 0.075, y: 0.255, w: 0.85, h: 0.675 } as Rect,
  colliders: [
    { x: 0.035, y: 0.23, w: 0.36, h: 0.60 }, // 왼쪽 침상·관물대·통로 쪽 바구니
    { x: 0.625, y: 0.23, w: 0.34, h: 0.61 }, // 오른쪽 침상·PX 선반
    { x: 0.035, y: 0.855, w: 0.27, h: 0.105 }, // 출입구 왼쪽 보급 상자
    { x: 0.83, y: 0.84, w: 0.14, h: 0.12 }, // 출입구 오른쪽 청소 도구
  ] as Rect[],
  spots: [
    { id: 'board', x: 0.44, y: 0.255, r: 95, marker: { x: 0.24, y: 0.14 }, title: '게시판', desc: '최고 기록·브리핑', kind: 'panel', panel: 'board' },
    { id: 'admin', x: 0.59, y: 0.255, r: 95, marker: { x: 0.57, y: 0.19 }, title: '행정반', desc: '설정·크레딧', kind: 'panel', panel: 'admin' },
    { id: 'codex', x: 0.415, y: 0.36, r: 80, marker: { x: 0.15, y: 0.36 }, title: '관물대', desc: '병과 도감', kind: 'panel', panel: 'codex' },
    { id: 'px', x: 0.61, y: 0.81, r: 80, marker: { x: 0.87, y: 0.77 }, title: 'PX', desc: '광고 보고 병과 해금', kind: 'panel', panel: 'px' },
    { id: 'door', x: 0.5, y: 0.94, r: 90, title: '출입구', desc: '위병소 방면 · 전투 투입', kind: 'deploy' },
    {
      id: 'lee',
      x: 0.44,
      y: 0.48,
      r: 90,
      title: '이상병',
      desc: '',
      kind: 'npc',
      art: 'walk_lee_idle',
      lines: [
        '저격은 관통이다. 한 줄로 세워 놓고 쏴라.',
        '사거리 안이면 어느 방향이든 쏜다. 대각선도 된다.',
        '적이 가까워지면 쏘기 전에 먼저 물러서라.',
      ],
    },
    {
      id: 'park',
      x: 0.58,
      y: 0.70,
      r: 90,
      title: '박취사',
      desc: '',
      kind: 'npc',
      art: 'walk_park_idle',
      lines: [
        '밥 먹고 해야지. 취사병이 옆에 있으면 다들 버틴다.',
        '제설병 뒤에 취사병을 세워라. 맞는 사람이 있어야 치료도 있지.',
        '짬밥 안 되는 소리 그만하고, 보급부터 챙겨라.',
      ],
    },
  ] as Spot[],
}

// 비상 방송(사용자 확정 문구). 6초마다 다음 줄
const BROADCAST = [
  '전 장병은 전투 투입하라. 위병소 방면 북방연합군 침투.',
  '비상 소집. 전 장병은 즉시 방어 위치로.',
  '현 시간부로 데프콘 2 발령. 위병소를 사수하라.',
] as const
const BROADCAST_MS = 6000
const PULSE_MS = 2400 // 붉은 비상등 한 주기(광과민: 번쩍이지 않고 천천히)
const PULSE_MAX = 0.16
const HUD_H = 84

export class WalkScene extends Scene {
  private offY = 0
  private pos: Vec = { x: 0, y: 0 }
  private player!: GameObjects.Container
  private rookie!: Actor
  private npcs = new Map<string, Actor>()
  private stride = 's'
  private talking: string | null = null
  private talkUntil = 0
  private colliders: Rect[] = []
  private bounds: Rect = { x: 0, y: 0, w: 0, h: 0 }
  private zones: Hot[] = []
  private current: Hot | null = null
  private lineIdx: Record<string, number> = {}
  private bubble!: GameObjects.Container
  private bubbleTitle!: GameObjects.Text
  private bubbleDesc!: GameObjects.Text
  private actBtn!: GameObjects.Container
  private actLabel!: GameObjects.Text
  private stickGfx!: GameObjects.Graphics
  private stickOrigin: Vec | null = null
  private stickDir: Vec = { x: 0, y: 0 }
  private keys: Types.Input.Keyboard.CursorKeys | null = null
  private wasd: Record<string, Input.Keyboard.Key> | null = null
  private alarmOn = true
  private tint!: GameObjects.Rectangle
  private lamps: GameObjects.Arc[] = []
  private bcastText!: GameObjects.Text
  private bcastIdx = 0
  private bcastAt = 0

  constructor() {
    super('walk')
  }

  preload(): void {
    loadArt(this)
  }

  create(): void {
    setupArt(this)
    for (const dir of ['n', 'e', 's', 'w']) {
      const key = `walk_rook_walk_${dir}`
      if (hasArt(key) && !this.anims.exists(`lobby_${dir}`)) this.anims.create({ key: `lobby_${dir}`, frames: Array.from({ length: 6 }, (_, frame) => ({ key, frame })), frameRate: L.strideFps, repeat: -1 })
    }
    this.npcs = new Map()
    this.talking = null
    this.stride = 's'
    this.offY = Math.max(0, (this.scale.height - MAP_H) / 2)
    const px = (nx: number): number => nx * W
    const py = (ny: number): number => ny * MAP_H + this.offY
    const rect = (r: Rect): Rect => ({ x: px(r.x), y: py(r.y), w: r.w * W, h: r.h * MAP_H })
    this.colliders = L.colliders.map(rect)
    this.bounds = rect(L.bounds)
    this.zones = L.spots.map((s) => ({ id: s.id, x: px(s.x), y: py(s.y), r: s.r, spot: s }))
    // 동료는 발 주변만 막는다. 중앙 통로는 남겨 두고 몸을 겹쳐 지나가지 않게 한다.
    for (const z of this.zones) if (z.spot.kind === 'npc') this.colliders.push({ x: z.x - 20, y: z.y - 16, w: 40, h: 32 })
    this.pos = { x: px(L.start.x), y: py(L.start.y) }
    this.current = null
    this.lineIdx = {}
    this.stickOrigin = null
    this.stickDir = { x: 0, y: 0 }
    this.alarmOn = loadAlarmFx()
    this.lamps = []

    this.drawMap()
    for (const z of this.zones) if (z.spot.kind === 'npc') this.makeNpc(z)
    this.makePlayer()
    this.makeHud()
    this.makeBubble()
    this.makeButtons()
    this.stickGfx = this.add.graphics().setDepth(940)
    if (this.alarmOn) this.makeAlarm()
    if (new URLSearchParams(location.search).get('zones') === '1') this.drawZoneDebug()

    this.keys = this.input.keyboard?.createCursorKeys() ?? null
    this.wasd = (this.input.keyboard?.addKeys('W,A,S,D') as Record<string, Input.Keyboard.Key> | undefined) ?? null
    this.input.on('pointerdown', (p: Input.Pointer, over: unknown[]) => {
      if (isPanelOpen() || over.length > 0 || p.y < HUD_H) return
      this.stickOrigin = { x: p.x, y: p.y }
    })
    this.input.on('pointermove', (p: Input.Pointer) => {
      if (this.stickOrigin && p.isDown) this.stickDir = stickVector(this.stickOrigin, p, 70)
    })
    const release = (): void => {
      this.stickOrigin = null
      this.stickDir = { x: 0, y: 0 }
    }
    this.input.on('pointerup', release)
    this.input.on('pointerupoutside', release)
    this.game.events.on('blur', release)
    this.events.once('shutdown', () => this.game.events.off('blur', release))
    if (this.alarmOn) playSfx('sfx_siren')
  }

  update(time: number, delta: number): void {
    const open = isPanelOpen()
    const dir = open ? { x: 0, y: 0 } : this.readDir()
    if (this.talking && (open || dir.x !== 0 || dir.y !== 0 || time >= this.talkUntil)) this.talking = null
    const before = this.pos
    this.pos = moveStep(this.pos, dir, L.speed, Math.min(delta, 50), this.colliders, this.bounds, L.radius)
    const moving = Math.hypot(this.pos.x - before.x, this.pos.y - before.y) > 0.1
    this.player.setPosition(this.pos.x, this.pos.y).setDepth(this.pos.y)
    const partner = this.talking ? this.zones.find((z) => z.id === this.talking) : null
    this.rookie.target = partner
      ? facingFor({ x: partner.x - this.pos.x, y: partner.y - this.pos.y }, this.rookie.facing)
      : facingFor(dir, this.rookie.target)
    this.turnActor(this.rookie, time, moving)
    const sprite = this.rookie.sprite
    if (sprite && moving && this.rookie.facing === this.rookie.target) {
      this.stride = walkDirection(dir, this.stride)
      const anim = `lobby_${this.stride}`
      if (this.anims.exists(anim)) sprite.play(anim, true)
    }
    for (const [id, npc] of this.npcs) {
      const z = this.zones.find((zone) => zone.id === id)!
      npc.target = this.talking === id
        ? facingFor({ x: this.pos.x - z.x, y: this.pos.y - z.y }, npc.facing)
        : npc.home
      this.turnActor(npc, time)
    }
    this.drawStick()
    this.updateNearest()
    if (this.alarmOn) this.updateAlarm(time, open)
  }

  private turnActor(actor: Actor, time: number, moving = false): void {
    if (actor.facing !== actor.target && time >= actor.turnAt) {
      actor.facing = turnToward(actor.facing, actor.target)
      actor.turnAt = time + L.turnMs
    }
    actor.box.setData('facing', actor.facing)
    const s = actor.sprite
    if (!s) return
    // 이동 중에는 아래 update에서 보행을 다시 재생한다. 대화/정지 때는 같은 방향의 정지 자세로 돌아온다.
    if (moving && actor.facing === actor.target && s.anims.isPlaying) return
    s.stop().setFlipX(false).setTexture(actor.idle, hasArt(actor.idle) && actor.idle.startsWith('walk_') ? actor.facing : 0)
  }

  private readDir(): Vec {
    let x = this.stickDir.x
    let y = this.stickDir.y
    const k = this.keys
    const w = this.wasd
    if (k?.left.isDown || w?.A?.isDown) x -= 1
    if (k?.right.isDown || w?.D?.isDown) x += 1
    if (k?.up.isDown || w?.W?.isDown) y -= 1
    if (k?.down.isDown || w?.S?.isDown) y += 1
    const len = Math.hypot(x, y)
    return len > 1 ? { x: x / len, y: y / len } : { x, y }
  }

  // ---- 그리기 ----

  private drawMap(): void {
    this.add.rectangle(0, 0, W, this.scale.height, 0x0b0d12).setOrigin(0, 0).setDepth(-20)
    if (hasArt('bg_barracks')) {
      this.add.image(0, this.offY, 'bg_barracks').setOrigin(0, 0).setDepth(-10)
    } else {
      // 그림 누락 시에도 같은 충돌·상호작용 위치를 보여 준다.
      this.add.rectangle(0, this.offY, W, MAP_H, 0x2a2f26).setOrigin(0, 0).setDepth(-10)
      for (const c of this.colliders) this.add.rectangle(c.x, c.y, c.w, c.h, 0x4b5320).setOrigin(0, 0).setDepth(-9).setStrokeStyle(3, 0x6f7a36)
    }
    for (const z of this.zones) {
      if (z.spot.kind === 'npc') continue
      const marker = z.spot.marker
      const x = marker ? marker.x * W : z.x
      const y = marker ? marker.y * MAP_H + this.offY : z.y
      this.add.text(x, y, z.spot.title, { fontFamily: FONT, fontSize: '20px', color: '#f5dda0', backgroundColor: '#12191eee', padding: { x: 10, y: 5 } }).setOrigin(0.5).setDepth(20)
    }
  }

  private actor(artKey: string, fallback: string, label: string, home: number): Actor {
    const box = this.add.container(0, 0)
    box.add(this.add.ellipse(0, 0, 52, 14, 0x000000, 0.30))
    const key = hasArt(artKey) ? artKey : fallback
    let sprite: GameObjects.Sprite | null = null
    if (hasArt(key)) {
      sprite = this.add.sprite(0, 0, key, key === artKey ? home : 0).setOrigin(0.5, 116 / 128).setScale(0.85)
      box.add(sprite)
    } else {
      box.add(this.add.circle(0, -30, 24, 0x4b5320).setStrokeStyle(3, 0xe8c35a))
      box.add(this.add.text(0, -30, label, { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5))
    }
    return { box, sprite, idle: key, facing: home, target: home, home, turnAt: 0 }
  }

  private makePlayer(): void {
    this.rookie = this.actor('walk_rook_idle', 'ally_rifle_idle', '신', 4)
    this.player = this.rookie.box
    this.player.setName('rookie')
    this.player.add(this.add.text(0, -103, sanitizeRookieName(getLobbySave().name), { fontFamily: FONT, fontSize: '21px', color: '#ffffff', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5))
  }

  private makeNpc(z: Hot): void {
    const a = this.actor(z.spot.art ?? '', z.id === 'lee' ? 'ally_sniper_idle' : 'ally_cook_idle', z.spot.title.slice(0, 1), z.id === 'lee' ? 6 : 2)
    a.box.setPosition(z.x, z.y).setDepth(z.y).setName(z.id)
    a.box.add(this.add.text(0, -103, z.spot.title, { fontFamily: FONT, fontSize: '20px', color: '#d9d2be', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5))
    this.npcs.set(z.id, a)
  }

  private makeHud(): void {
    const save = getLobbySave()
    this.add.rectangle(0, 0, W, HUD_H, 0x0b0e12, 0.92).setOrigin(0, 0).setDepth(900)
    this.add.rectangle(0, HUD_H - 3, W, 3, 0xc9a24a).setOrigin(0, 0).setDepth(901)
    this.add
      .text(24, 12, `${getRankName(1)} ${sanitizeRookieName(save.name)}`, { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#ece6d3' })
      .setDepth(902)
    this.add
      .text(24, 50, `제77보병사단 · 생활관 · 최고 웨이브 ${save.bestWave}`, { fontFamily: FONT, fontSize: '18px', color: '#9a9484' })
      .setDepth(902)
    const gear = this.add.container(W - 52, HUD_H / 2 - 2).setDepth(903)
    gear.add(this.add.circle(0, 0, 28, 0x1b2229).setStrokeStyle(3, 0xc9a24a))
    gear.add(this.add.text(0, 0, '설정', { fontFamily: FONT, fontSize: '18px', color: '#e8c35a' }).setOrigin(0.5))
    gear.setSize(60, 60).setInteractive({ useHandCursor: true }).on('pointerup', () => !isPanelOpen() && openPanel('admin'))
  }

  private makeBubble(): void {
    this.bubble = this.add.container(0, 0).setDepth(950).setVisible(false)
    const bg = this.add.rectangle(0, 0, 400, 132, 0x141a20, 0.94).setStrokeStyle(3, 0xe8c35a)
    this.bubbleTitle = this.add.text(0, -38, '', { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#e8c35a' }).setOrigin(0.5)
    this.bubbleDesc = this.add
      .text(0, 14, '', { fontFamily: FONT, fontSize: '19px', color: '#ece6d3', align: 'center', wordWrap: { width: 365 } })
      .setOrigin(0.5)
    this.bubble.add([bg, this.bubbleTitle, this.bubbleDesc])
    bg.setInteractive({ useHandCursor: true }).on('pointerup', () => this.activate())
  }

  // 오른쪽 아래: "열기" 원 버튼(구역 앞에서만) + "전투 투입" 큰 버튼(어디서나)
  private makeButtons(): void {
    const H = this.scale.height
    this.actBtn = this.add.container(W - 70, H - 200).setDepth(960).setVisible(false)
    this.actBtn.add(this.add.circle(0, 0, 46, 0xc9a24a).setStrokeStyle(4, 0x0b0e12))
    this.actLabel = this.add.text(0, 0, '열기', { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#1a1608' }).setOrigin(0.5)
    this.actBtn.add(this.actLabel)
    this.actBtn.setSize(92, 92).setInteractive({ useHandCursor: true }).on('pointerup', () => this.activate())

    const go = this.add.container(W - 110, H - 70).setDepth(960)
    go.add(this.add.rectangle(0, 0, 190, 84, 0x4a5a22).setStrokeStyle(4, 0xc9a24a))
    go.add(this.add.text(0, -12, '전투 투입', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5))
    go.add(this.add.text(0, 22, '위병소 방어선으로', { fontFamily: FONT, fontSize: '16px', color: '#e2e6c4' }).setOrigin(0.5))
    go.setSize(190, 84).setInteractive({ useHandCursor: true }).on('pointerup', () => !isPanelOpen() && deploy())
  }

  private drawStick(): void {
    const g = this.stickGfx
    g.clear()
    const o = this.stickOrigin
    if (!o) return
    g.fillStyle(0x1b2229, 0.55).fillCircle(o.x, o.y, 70)
    g.lineStyle(3, 0xc9a24a, 0.9).strokeCircle(o.x, o.y, 70)
    g.fillStyle(0xe8c35a, 0.9).fillCircle(o.x + this.stickDir.x * 70, o.y + this.stickDir.y * 70, 28)
  }

  // ---- 구역 상호작용 ----

  private updateNearest(): void {
    const near = isPanelOpen() ? null : ((nearestZone(this.pos, this.zones) as Hot | null) ?? null)
    if (near?.id === this.current?.id) return
    this.current = near
    if (!near) {
      this.bubble.setVisible(false)
      this.actBtn.setVisible(false)
      return
    }
    const s = near.spot
    this.bubbleTitle.setText(s.title)
    this.bubbleDesc.setText(s.kind === 'npc' ? this.line(s) : s.desc)
    const below = near.y < this.offY + 300
    this.bubble.setPosition(Math.min(W - 210, Math.max(210, near.x)), below ? near.y + 90 : near.y - 230).setVisible(true)
    this.actLabel.setText(s.kind === 'deploy' ? '투입' : s.kind === 'npc' ? '대화' : '열기')
    this.actBtn.setVisible(true)
  }

  private line(s: Spot): string {
    return s.lines?.[this.lineIdx[s.id] ?? 0] ?? ''
  }

  private activate(): void {
    const z = this.current
    if (!z || isPanelOpen()) return
    const s = z.spot
    if (s.kind === 'panel' && s.panel) openPanel(s.panel)
    else if (s.kind === 'deploy') deploy()
    else if (s.kind === 'npc') {
      this.talking = s.id
      this.talkUntil = this.time.now + L.talkMs
      this.stickDir = { x: 0, y: 0 }
      this.stickOrigin = null
      playSfx('sfx_click')
      this.lineIdx[s.id] = nextLine(this.lineIdx[s.id] ?? 0, s.lines ?? [])
      this.bubbleDesc.setText(this.line(s))
    }
  }

  // ---- 비상 연출(붉은 비상등 + 방송 자막) ----

  private makeAlarm(): void {
    this.tint = this.add.rectangle(0, 0, W, this.scale.height, 0xff1e1e, 0).setOrigin(0, 0).setDepth(800)
    for (const x of [34, W - 34]) {
      this.lamps.push(this.add.circle(x, HUD_H + 70, 62, 0xff2a1a, 0).setDepth(801).setBlendMode(BlendModes.ADD))
      this.add.circle(x, HUD_H + 70, 12, 0xff3b2a).setDepth(802).setStrokeStyle(3, 0x3a1410)
    }
    const bar = this.add.container(0, HUD_H + 8).setDepth(920)
    bar.add(this.add.rectangle(0, 0, W, 48, 0x10151a, 0.88).setOrigin(0, 0))
    bar.add(this.add.rectangle(0, 0, 6, 48, 0xe0412f).setOrigin(0, 0))
    this.bcastText = this.add.text(20, 24, BROADCAST[0], { fontFamily: FONT, fontSize: '22px', color: '#ffb3a6' }).setOrigin(0, 0.5)
    bar.add(this.bcastText)
    this.bcastIdx = 0
    this.bcastAt = 0
  }

  private updateAlarm(time: number, panelOpen: boolean): void {
    this.tint.setFillStyle(0xff1e1e, pulseAlpha(time, PULSE_MS, PULSE_MAX) * (panelOpen ? 0.5 : 1))
    // 두 램프는 서로 반대 위상(반주기 차이)으로 켜진다
    this.lamps.forEach((g, i) => g.setAlpha((pulseAlpha(time + (i ? PULSE_MS / 2 : 0), PULSE_MS, PULSE_MAX) / PULSE_MAX) * 0.9))
    if (this.bcastAt === 0) this.bcastAt = time
    if (time - this.bcastAt < BROADCAST_MS) return
    this.bcastAt = time
    this.bcastIdx = nextLine(this.bcastIdx, BROADCAST)
    this.tweens.add({
      targets: this.bcastText,
      alpha: 0,
      duration: 200,
      yoyo: true,
      onYoyo: () => this.bcastText.setText(BROADCAST[this.bcastIdx] ?? ''),
    })
    playSfx('sfx_radio')
  }

  // ---- ?zones=1: 구역 반경·충돌 사각형·이동 범위를 선으로 ----

  private drawZoneDebug(): void {
    const g = this.add.graphics().setDepth(990)
    g.lineStyle(3, 0x00ff66, 0.9).strokeRect(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h)
    g.lineStyle(3, 0xff3333, 0.9)
    for (const c of this.colliders) g.strokeRect(c.x, c.y, c.w, c.h)
    g.lineStyle(3, 0xffdd00, 0.9)
    for (const z of this.zones) g.strokeCircle(z.x, z.y, z.r)
  }
}
