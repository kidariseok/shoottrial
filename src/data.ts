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
