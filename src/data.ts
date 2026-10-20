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
  },
  text: {
    promote: '진급!',
    sell: '판매',
    line: '위병소 방어선',
    supplyLabel: '보급',
    fontPx: 26,
    fontFamily: 'sans-serif',
    color: '#ffffff',
    popupColor: '#ffe066',
    labelColor: '#cfd8dc',
    lineLabelColor: '#2b2b2b', // 노란 방어선 띠 위 라벨(밝은 라벨색은 안 읽힌다)
  },
  // 카드 도형 치수. LAYOUT.cell 기준 좌표이며 카드 중심이 원점이다. rank는 계급 작대기 묶음
  card: { inset: 10, initialPx: 64, namePx: 22, nameY: 44, rankX: 40, rankY: -40, rankW: 28, rankH: 6, rankGap: 4 },
  // 구역 격자선 굵기
  stroke: 2,
  // 1단계 보급 텍스트 위치. HUD 띠 안, 좌상단 일시정지 버튼 오른쪽(우상단 시스템 버튼 자리는 비운다)
  supply: { x: 168, y: 32 },
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
