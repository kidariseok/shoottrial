// T-109 걸어 다니는 생활관: 조이스틱으로 걷다가 구역 앞에서 "열기"를 누르면 패널(lobby.ts)이 열린다.
// HUD·말풍선·버튼·조이스틱·비상 연출은 모두 Phaser로 그린다(DOM과 캔버스 겹침·Safe Area 문제를 피한다). 계산은 helpers.ts의 순수 함수.
import { BlendModes, Scene, type GameObjects, type Input, type Types } from 'phaser'
import { playSfx } from '../audio'
import { hasArt, loadArt, setupArt } from '../battle/art'
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
  lines?: string[]
}
type Hot = Zone & { spot: Spot }

// ponytail: 좌표는 이 표 하나에 비율(0~1)로 둔다. 배경 그림(A-103 bg_barracks)이 오면 ?zones=1로 선을 보면서 여기만 다시 맞춘다.
// 지도는 한 화면(720×1280)이고 스크롤하지 않는다. 화면이 더 길면 위아래를 어두운 색으로 채운다.
const L = {
  start: { x: 0.5, y: 0.82 },
  speed: 300, // px/초
  radius: 22, // 발 밑 충돌 반경
  bounds: { x: 0.07, y: 0.17, w: 0.86, h: 0.77 } as Rect, // 중심이 다닐 수 있는 범위
  colliders: [
    { x: 0.17, y: 0.23, w: 0.18, h: 0.4 }, // 왼쪽 2단 침상 줄
    { x: 0.65, y: 0.23, w: 0.18, h: 0.4 }, // 오른쪽 2단 침상 줄
  ] as Rect[],
  spots: [
    { id: 'board', x: 0.25, y: 0.14, r: 120, title: '게시판', desc: '최고 기록·브리핑', kind: 'panel', panel: 'board' },
    { id: 'admin', x: 0.75, y: 0.14, r: 120, title: '행정반', desc: '설정·크레딧', kind: 'panel', panel: 'admin' },
    { id: 'codex', x: 0.05, y: 0.42, r: 120, title: '관물대', desc: '병과 도감', kind: 'panel', panel: 'codex' },
    { id: 'px', x: 0.95, y: 0.6, r: 120, title: 'PX', desc: '광고 보고 병과 해금', kind: 'panel', panel: 'px' },
    { id: 'door', x: 0.5, y: 0.96, r: 130, title: '출입구', desc: '위병소 방면 · 전투 투입', kind: 'deploy' },
    {
      id: 'lee',
      x: 0.43,
      y: 0.42,
      r: 100,
      title: '이상병',
      desc: '',
      kind: 'npc',
      art: 'ally_sniper_idle',
      lines: [
        '저격은 관통이다. 한 줄로 세워 놓고 쏴라.',
        '사거리 안이면 어느 방향이든 쏜다. 대각선도 된다.',
        '적이 가까워지면 쏘기 전에 먼저 물러서라.',
      ],
    },
    {
      id: 'park',
      x: 0.58,
      y: 0.7,
      r: 100,
      title: '박취사',
      desc: '',
      kind: 'npc',
      art: 'ally_cook_idle',
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
  private sprite: GameObjects.Sprite | null = null
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
    this.offY = Math.max(0, (this.scale.height - MAP_H) / 2)
    const px = (nx: number): number => nx * W
    const py = (ny: number): number => ny * MAP_H + this.offY
    const rect = (r: Rect): Rect => ({ x: px(r.x), y: py(r.y), w: r.w * W, h: r.h * MAP_H })
    this.colliders = L.colliders.map(rect)
    this.bounds = rect(L.bounds)
    this.zones = L.spots.map((s) => ({ id: s.id, x: px(s.x), y: py(s.y), r: s.r, spot: s }))
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
    if (this.alarmOn) playSfx('sfx_siren')
  }

  update(time: number, delta: number): void {
    const open = isPanelOpen()
    const dir = open ? { x: 0, y: 0 } : this.readDir()
    const moving = dir.x !== 0 || dir.y !== 0
    this.pos = moveStep(this.pos, dir, L.speed, delta, this.colliders, this.bounds, L.radius)
    this.player.setPosition(this.pos.x, this.pos.y).setDepth(this.pos.y)
    const s = this.sprite
    if (s && moving) {
      if (dir.x !== 0) s.setFlipX(dir.x < 0)
      if (!s.anims.isPlaying) s.play(s.texture.key)
    } else if (s?.anims.isPlaying) {
      s.stop()
      s.setFrame(0)
    }
    this.drawStick()
    this.updateNearest()
    if (this.alarmOn) this.updateAlarm(time, open)
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
      return
    }
    // 그림이 오기 전 임시 바닥: 바닥색 + 침상·벽·구역 표지를 도형으로
    this.add.rectangle(0, this.offY, W, MAP_H, 0x2a2f26).setOrigin(0, 0).setDepth(-10)
    this.add.rectangle(0, this.offY, W, 0.16 * MAP_H, 0x1d221b).setOrigin(0, 0).setDepth(-9)
    for (const c of this.colliders) this.add.rectangle(c.x, c.y, c.w, c.h, 0x4b5320).setOrigin(0, 0).setDepth(-9).setStrokeStyle(3, 0x6f7a36)
    for (const z of this.zones) {
      if (z.spot.kind === 'npc') continue
      this.add.circle(z.x, z.y, 34, 0x3a4048, 0.9).setDepth(-8).setStrokeStyle(3, 0xc9a24a)
      this.add.text(z.x, z.y, z.spot.title, { fontFamily: FONT, fontSize: '20px', color: '#e8c35a' }).setOrigin(0.5).setDepth(-7)
    }
  }

  // 그림이 있으면 2프레임 스프라이트, 없으면 머리글자 동그라미
  private actor(artKey: string, color: number, label: string): { box: GameObjects.Container; sprite: GameObjects.Sprite | null } {
    const box = this.add.container(0, 0)
    box.add(this.add.ellipse(0, 0, 60, 18, 0x000000, 0.35))
    if (hasArt(artKey)) {
      const s = this.add.sprite(0, 6, artKey, 0).setOrigin(0.5, 1).setScale(0.8)
      box.add(s)
      return { box, sprite: s }
    }
    box.add(this.add.circle(0, -30, 24, color).setStrokeStyle(3, 0xe8c35a))
    box.add(this.add.text(0, -30, label, { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5))
    return { box, sprite: null }
  }

  private makePlayer(): void {
    const a = this.actor('ally_rifle_idle', 0x4b5320, '신')
    this.player = a.box
    this.sprite = a.sprite
    this.player.add(
      this.add
        .text(0, -118, sanitizeRookieName(getLobbySave().name), { fontFamily: FONT, fontSize: '22px', color: '#ffffff', stroke: '#000000', strokeThickness: 4 })
        .setOrigin(0.5)
    )
  }

  private makeNpc(z: Hot): void {
    const a = this.actor(z.spot.art ?? '', 0x606b29, z.spot.title.slice(0, 1))
    a.box.setPosition(z.x, z.y).setDepth(z.y)
    a.sprite?.play(z.spot.art ?? '')
    a.box.add(
      this.add.text(0, -118, z.spot.title, { fontFamily: FONT, fontSize: '20px', color: '#b9b3a3', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5)
    )
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
    const bg = this.add.rectangle(0, 0, 360, 96, 0x141a20, 0.94).setStrokeStyle(3, 0xe8c35a)
    this.bubbleTitle = this.add.text(0, -22, '', { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#e8c35a' }).setOrigin(0.5)
    this.bubbleDesc = this.add
      .text(0, 14, '', { fontFamily: FONT, fontSize: '19px', color: '#ece6d3', align: 'center', wordWrap: { width: 330 } })
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
    this.bubble.setPosition(Math.min(W - 190, Math.max(190, near.x)), below ? near.y + 90 : near.y - 150).setVisible(true)
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
