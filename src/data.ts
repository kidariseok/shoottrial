// 모든 게임 수치의 단일 출처. GDD §3·§5.2~§5.4·§6과 1:1이다. 코드 안에 숫자를 박지 않는다.

// 아트 배율. 원본 스프라이트 크기와 화면 크기의 비율이다.
export const SPRITE_SCALE = 1

// 좌표 구역(기준 해상도 720x1280, GDD §3). 판 전체는 화면이 길면 아래로 내려 그린다.
export const LAYOUT = {
  width: 720,
  baseHeight: 1280,
  cols: 5,
  cell: 128,
  marginX: 40,
  hudY: 0,
  hudH: 96,
  entryY: 96,
  entryRows: 2,
  mineY: 352,
  mineRows: 2,
  deployY: 608,
  deployRows: 3,
  lineY: 992,
  lineH: 48,
  benchY: 1040,
  benchH: 120,
  benchCell: 112, // 대기석 칸 한 변. 판매 칸은 5칸 오른쪽 6번째 칸이라 별도 값이 없다
  benchSlots: 5,
  benchMarginX: 24,
  shopY: 1160,
} as const

// 이 순서가 시너지 목록 정렬 순서다
export const CARD_KEYS = ['rifle', 'sniper', 'blower', 'cook', 'miner'] as const
export type CardKey = (typeof CARD_KEYS)[number]

// GDD §5.2. range 단위는 "칸"이다. color는 아트 전 임시색(ART §2: 붉은색 계열 금지)
export const CARDS: Record<
  CardKey,
  { name: string; initial: string; color: number; cost: number; hp: number; atk: number; interval: number; range: number }
> = {
  rifle: { name: '소총수', initial: '소', color: 0x4a7c3a, cost: 1, hp: 100, atk: 10, interval: 0.8, range: 4 },
  sniper: { name: '저격수', initial: '저', color: 0x2f5d8a, cost: 3, hp: 70, atk: 60, interval: 2.5, range: Infinity }, // 열 전체
  blower: { name: '제설병', initial: '제', color: 0x2a8c8c, cost: 2, hp: 120, atk: 0, interval: 1.5, range: 2 },
  cook: { name: '취사병', initial: '취', color: 0x8a8a3a, cost: 2, hp: 90, atk: 0, interval: 2.0, range: 1 }, // 인접 8칸의 반지름
  miner: { name: '지뢰설치병', initial: '지', color: 0x6a5a8a, cost: 2, hp: 80, atk: 6, interval: 1.0, range: 3 },
}

// GDD §5.3. copies는 계급별 이등병 환산 장수(판매 환급·합성 재료 수)
export const RANKS = {
  names: ['이등병', '일병', '상병', '병장'],
  max: 4,
  mult: 1.5,
  copies: [1, 2, 4, 8],
} as const

// GDD §5.4. 단계가 켜지는 인원 수(계급 무관). 목록에 없는 단계는 없다
export const SYNERGY: Record<CardKey, readonly number[]> = {
  rifle: [2, 4],
  sniper: [2],
  blower: [2, 4],
  cook: [2],
  miner: [2],
}

// GDD §6
export const ECONOMY = {
  startSupply: 6,
  baseIncome: 5,
  interestStep: 5,
  interestMax: 2,
  flagBonus: 3,
  earlyBonus: 1,
  rerollCost: 1,
  shopSize: 5,
  waveHpGrowth: 0.12,
} as const

// 매 판 시작 신병: 배치 구역 가운데 열 맨 아래 칸
// ponytail: 1단계는 기본 이름 고정, save.ts 연결은 3단계(META-01)
export const ROOKIE: { card: CardKey; name: string; col: number; row: number } = {
  card: 'rifle',
  name: '김신병',
  col: 2,
  row: 2,
}

// board.ts가 쓰는 화면 상수. 숫자 색은 Graphics·카메라 배경용, 글자 색은 CSS 문자열이다
export const UI = {
  colors: {
    bg: 0x141c26,
    entry: 0x2a3644,
    mine: 0x3a4036,
    deployCell: 0x2f4a3a,
    line: 0xffe066,
    bench: 0x232d3a,
    sell: 0x5a4a7a,
    rankBar: 0xf0f0d0,
    hlOk: 0x66ff99, // 놓을 수 있는 칸 윤곽
    hlMerge: 0xffe066, // 합성 가능 칸 윤곽
    hlHover: 0xffffff, // 손가락 아래 칸 윤곽
    hitFlash: 0xffffff, // 피격 번쩍임(붉은색 금지)
    laneFlash: 0xbfe6ff, // 최후 저지선 열 섬광(밝은 청백색)
    lineUsed: 0x5a5a4a, // 쓴 최후 저지선 표시(방어선 띠 위, 노란 띠보다 어두운 회황색)
    muzzle: 0xfff3b0, // 총구 섬광(노랑, 붉은색·주황 금지)
    tracer: 0xffe066, // 아군 탄 궤적
    snipe: 0xffffff, // 저격 흰 선
    wind: 0xbfe6ff, // 송풍 파동(청백색)
    revive: 0xd8ffd0, // 부활 번쩍임(흰색·연두)
    mineToken: 0x7fd1b9, // 지뢰 토큰 더미(아군 계열 청록, 붉은색·주황 금지)
    mineBuried: 0x9fe0c8, // 묻힌 일반 지뢰(반투명으로 그린다)
    mineAnti: 0xc79bff, // 대전차 토큰·지뢰(연보라, 일반과 구분)
    explosion: 0xe8f6ff, // 지뢰 폭발(밝은 청백색)
  },
  fx: {
    snapMs: 120,
    flashMs: 300,
    promoteScale: 1.6,
    promoteMs: 200,
    popupMs: 700,
    popupRise: 60,
    dragDepth: 100,
    hlAlpha: 0.9,
    hlWidth: 4, // 놓을 수 있는 칸 윤곽 굵기
    hlHoverWidth: 8, // 손 아래 칸 윤곽 굵기
    flashAlpha: 0.2, // 합성 대상 계급 표시 반짝임의 낮은 알파
    fxDepth: 50, // 카드(0)보다 위, 드래그 카드(dragDepth)보다 아래
    hitMs: 120, // 피격 흰 번쩍임 시간
    hitAlpha: 0.8,
    dmgRise: 40, // 데미지 숫자가 떠오르는 높이
    dmgMs: 600,
    fallMs: 300, // 적 쓰러짐 페이드
    fallSink: 12, // 쓰러지며 가라앉는 높이
    laneFlashMs: 200,
    laneFlashAlpha: 0.7,
    fallenAlpha: 0.35, // 쓰러진 아군 카드 알파
    enemyDepth: 10, // 카드(0)보다 위, fx(fxDepth)보다 아래
    spawnFadeMs: 300, // 적이 나타날 때 알파 0 -> 1
    resultPx: 96, // 승리·패배 글자 크기
    lineUsedPx: 22, // 소진 표시 글자 크기
    lineUsedInset: 8, // 소진 표시 사각형 좌우 여백(한쪽)
    msPerSec: 1000, // 초 -> 밀리초(연출 시차 변환)
    muzzleR: 10, // 총구 섬광 반지름
    muzzleDy: 56, // 총구 위치: 카드 중심에서 위로
    muzzleMs: 100,
    tracerW: 4, // 탄 궤적 굵기
    tracerMs: 120,
    snipeW: 10, // 저격 흰 선 굵기
    snipeMs: 250,
    windW: 96, // 송풍 파동 폭
    windH: 24, // 송풍 파동 두께
    windAlpha: 0.6,
    windMs: 400,
    healRise: 30, // 회복 숫자가 떠오르는 높이
    healMs: 600,
    reviveScale: 1.4, // 부활 번쩍임이 커지는 배율
    reviveAlpha: 0.9,
    reviveMs: 400,
    explodeAlpha: 0.8, // 폭발 사각형 시작 알파
    explodeMs: 350,
    explodeCoreR: 24, // 폭발 중심 원 시작 반지름
    explodeCoreScale: 3, // 중심 원이 커지는 배율
  },
  text: {
    promote: '진급!',
    sell: '판매',
    line: '위병소 방어선',
    fontPx: 26,
    fontFamily: 'sans-serif',
    color: '#ffffff',
    popupColor: '#ffe066',
    healColor: '#66ff99', // 회복 숫자(초록)
    labelColor: '#cfd8dc',
    lineLabelColor: '#2b2b2b', // 노란 방어선 띠 위 라벨(밝은 라벨색은 안 읽힌다)
    lineUsed: '저지선 소진',
    bannerPoor: '보급이 부족합니다',
    bannerBenchFull: '대기석이 가득 찼습니다',
    bannerIntro: '적 침투 — 병력을 배치하라',
    bannerFlag: '대규모 적 접근!',
    bannerDefcon: '데프콘 1 — 칵트 피스톨',
    win: '승리',
    lose: '패배',
  },
  // 카드 도형 치수. LAYOUT.cell 기준 좌표이며 카드 중심이 원점이다. rank는 계급 작대기 묶음
  card: { inset: 10, initialPx: 64, namePx: 22, nameY: 44, rankX: 40, rankY: -40, rankW: 28, rankH: 6, rankGap: 4 },
  // 카드 위 체력바. 카드 중심 기준 좌표, lowRatio 이하면 low 색
  bar: { w: 80, h: 10, y: -56, bg: 0x141c26, ok: 0x66ff99, low: 0xffe066, lowRatio: 0.4 },
  // 카메라 흔들림(ms, 세기)
  shake: { light: { ms: 80, intensity: 0.004 }, heavy: { ms: 200, intensity: 0.012 } },
  // 구역 격자선 굵기
  stroke: 2,
  // 카드 길게 누르기(정보 열기)까지 걸리는 시간(ms)
  hold: { ms: 400 },
  // 적 체력바: 몸통 위쪽에 놓는다. 색은 UI.bar를 쓴다
  enemyBar: { h: 8, gap: 6 },
  // 지뢰 토큰 더미: 적 진입 구역 아래쪽 왼쪽 열(논리 좌표, trayY는 칸 단위 y 중심). 준비 단계에는 적이 없어 비어 있다
  mine: { trayCol: 0, trayY: 1.5, tokenR: 36, buriedR: 40, alpha: 0.5, countPx: 36 },
} as const

// ---- 2단계 전투 수치 (추가분) ----

// GDD §5.6. 웨이브 HP 스케일(rules.waveHp)은 보스에도 적용한다(OQ-3: W5 1776, W10 2496)
// color는 아트 전 임시색(ART §2: 적은 회갈색 계열, 붉은색·주황은 적의 공격·경보에만), size는 칸 대비 비율
// speed 칸/초, interval 초, baseDmg 위병소 피해, knock 밀어내기 배율, range 칸(0이면 막힌 뒤 근접)
export const ENEMY_KEYS = ['infantry', 'dog', 'rpg', 'boss'] as const
export type EnemyType = (typeof ENEMY_KEYS)[number]
export const ENEMIES: Record<
  EnemyType,
  {
    name: string
    hp: number
    speed: number
    dmg: number
    interval: number
    baseDmg: number
    knock: number
    range: number
    color: number
    size: number
  }
> = {
  infantry: { name: '보병', hp: 60, speed: 0.35, dmg: 10, interval: 1, baseDmg: 1, knock: 1, range: 0, color: 0x80786a, size: 0.55 },
  dog: { name: '군견', hp: 40, speed: 0.9, dmg: 6, interval: 0.5, baseDmg: 1, knock: 1.5, range: 0, color: 0x6a5f50, size: 0.45 },
  rpg: { name: 'RPG병', hp: 50, speed: 0.3, dmg: 35, interval: 3, baseDmg: 2, knock: 1, range: 3, color: 0x5f6b73, size: 0.55 },
  boss: { name: '장갑차', hp: 1200, speed: 0.15, dmg: 40, interval: 1, baseDmg: 5, knock: 0.25, range: 0, color: 0x4a5560, size: 0.9 },
}

// 칸 단위 y. 적 진입 구역 맨 위가 0이다(LAYOUT.entryY 기준). 02-CONTEXT 좌표계
export const GRID = {
  mineTop: (LAYOUT.mineY - LAYOUT.entryY) / LAYOUT.cell,
  deployTop: (LAYOUT.deployY - LAYOUT.entryY) / LAYOUT.cell,
  lineY: (LAYOUT.lineY - LAYOUT.entryY) / LAYOUT.cell,
}

// GDD §5.6 보스 충격파
// 충격파: 보스 y가 이 값 이상이 되거나 맨 앞 아군에게 막히는 순간 중 먼저, 한 번(확정). 등장 순간(0)이 아니다
export const BOSS = { shockStun: 1.5, shockY: GRID.deployTop }

// GDD §5.6 군견. triggerGap은 배치 구역 윗변 앞 칸 수, laneMs는 열 옮김 트윈 시간(연출 보정값)
export const DOG = { triggerGap: 0.5, laneMs: 250 }

// GDD §4·§4.1·§4.2. 준비/정산 초, 위병소 HP, 데프콘 1(웨이브 7~) 규칙
// blockGap은 맨 앞 아군 위쪽 경계 앞 칸 수, maxDt·slideSpeed는 연출·판정 보정값
export const BATTLE = {
  prepFirst: 30,
  prepNext: 20,
  settleSec: 1.5,
  baseHp: 20,
  defcon1From: 7,
  defcon1AllyInterval: 0.8,
  defcon1SpawnGap: 0.7,
  blockGap: 0.5,
  maxDt: 0.1,
  slideSpeed: 8,
}

// GDD §5.3 능력. corporal·sergeant는 능력이 켜지는 계급(상병 3, 병장 4)
export const ABILITY = {
  corporal: 3,
  sergeant: 4,
  burstCount: 2,
  burstGap: 0.12, // 2점사 두 번째 발까지 간격(연출 보정값)
  sergeantRifleInterval: 0.8,
  sniperFalloff: 0.2,
  sniperStun: 1,
  knockBase: 1,
  knockSergeant: 2,
  burnSec: 3,
  burnDps: 8,
  cookHeal: 12,
  cookBuff: 0.2,
  cookRevive: 0.5,
  cookReachSergeant: 2,
}

// GDD §5.4 시너지 효과. 인덱스 = 켜진 시너지 단계 수(SYNERGY 길이 + 1)
export const SYN_FX: {
  rifleInterval: readonly number[]
  sniperDamage: readonly number[]
  blowerKnock: readonly number[]
  blowerRange: readonly number[]
} = {
  rifleInterval: [1, 0.8, 0.6],
  sniperDamage: [1, 1.3],
  blowerKnock: [1, 1.5, 1.5],
  blowerRange: [0, 0, 1],
}

// GDD §5.3·§5.5. 토큰은 계급 수(1~4) + 병장 +2, 시너지 +1(02-CONTEXT). 피해는 폭발 칸과 위아래 blast칸
export const MINES = {
  tokensByRank: [1, 2, 3, 4] as readonly number[],
  sergeantBonus: 2,
  synergyBonus: 1,
  damage: 150,
  bossMult: 3,
  blast: 1,
}

// GDD §7. base = 첫 판 해금, order = 웨이브 atWave 도달 때마다 하나씩 여는 순서
export const UNLOCK: { base: readonly CardKey[]; order: readonly CardKey[]; atWave: number } = {
  base: ['rifle', 'blower', 'sniper'],
  order: ['cook', 'miner'],
  atWave: 5,
}

// GDD §10 보상형 광고 슬롯 횟수·양, §4.2 부활 HP
export const REWARD = {
  adRerollMax: 3,
  adSupplyMax: 1,
  adSupplyAmount: 5,
  reviveHp: 10,
}

// GDD §11. 키는 localStorage 키, maxRuns 최근 판 수, recent 목록 길이, lowRate 구매율 경고선
export const LOG = {
  runsKey: 'd2_playlog',
  unlockedKey: 'd2_unlocked',
  maxRuns: 50,
  recent: 10,
  lowRate: 0.05,
}
