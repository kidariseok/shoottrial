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
export const CARD_KEYS = ['rifle', 'sniper', 'blower', 'cook', 'miner', 'chem'] as const
export type CardKey = (typeof CARD_KEYS)[number]

// GDD §5.2. range 단위는 "칸"이다. color는 아트 전 임시색(ART §2: 붉은색 계열 금지)
export const CARDS: Record<
  CardKey,
  { name: string; initial: string; color: number; cost: number; hp: number; atk: number; interval: number; range: number }
> = {
  rifle: { name: '소총수', initial: '소', color: 0x4a7c3a, cost: 1, hp: 100, atk: 10, interval: 0.8, range: 3.5 },
  sniper: { name: '저격수', initial: '저', color: 0x2f5d8a, cost: 3, hp: 70, atk: 60, interval: 2.5, range: 12 }, // 판 전체(대각선 약 8.6칸보다 크다)
  blower: { name: '제설병', initial: '제', color: 0x2a8c8c, cost: 2, hp: 180, atk: 4, interval: 1.5, range: 2 },
  cook: { name: '취사병', initial: '취', color: 0x8a8a3a, cost: 2, hp: 90, atk: 0, interval: 2.0, range: 1 }, // 인접 8칸의 반지름
  miner: { name: '지뢰설치병', initial: '지', color: 0x6a5a8a, cost: 2, hp: 80, atk: 6, interval: 1.0, range: 3 },
  chem: { name: '화학병', initial: '화', color: 0xb0b420, cost: 2, hp: 90, atk: 6, interval: 1.0, range: 3 }, // §5.2 지뢰설치병과 같은 단발 사격. 노랑 계열(r > g 금지)
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
  chem: [2], // 4명 단계 없음
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
  waveHpGrowth: 0.5,
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
    tracer: 0xffe066, // 아군 탄 궤적
    snipe: 0xffffff, // 저격 흰 선
    wind: 0xbfe6ff, // 송풍 파동(청백색)
    revive: 0xd8ffd0, // 부활 번쩍임(흰색·연두)
    mineToken: 0x7fd1b9, // 지뢰 토큰 더미(아군 계열 청록, 붉은색·주황 금지)
    mineBuried: 0x9fe0c8, // 묻힌 일반 지뢰(반투명으로 그린다)
    mineAnti: 0xc79bff, // 대전차 토큰·지뢰(연보라, 일반과 구분)
    gas: 0xb8c84a, // 가스 칸(탁한 황록)
    gasWarn: 0xd23c3c, // 화학탄 예고(적의 예고라 붉은색 허용, ART §2)
    dogPlusStroke: 0xffffff, // 강화 군견 테두리
    supportPick: 0xffe066, // 화력 지원 열 고르기 강조(노랑)
    supportWarn: 0xd23c3c, // 화력 지원 예고선(경보라 붉은색 허용, ART §2)
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
    lineUsedPx: 22, // 소진 표시 글자 크기
    lineUsedInset: 8, // 소진 표시 사각형 좌우 여백(한쪽)
    msPerSec: 1000, // 초 -> 밀리초(연출 시차 변환)
    muzzleDy: 56, // 총구 위치: 카드 중심에서 위로
    tracerW: 4, // 탄 궤적 굵기
    tracerMs: 120,
    snipeW: 10, // 저격 흰 선 굵기
    windW: 96, // 송풍 파동 폭
    windH: 24, // 송풍 파동 두께
    windAlpha: 0.6,
    windMs: 400,
    healRise: 30, // 회복 숫자가 떠오르는 높이
    healMs: 600,
    reviveScale: 1.4, // 부활 번쩍임이 커지는 배율
    reviveAlpha: 0.9,
    reviveMs: 400,
    supportPickAlpha: 0.25, // 열 고르기 강조 알파
    supportLineW: 10, // 화력 지원 예고선 굵기
    supportLineAlpha: 0.85,
  },
  text: {
    promote: '진급!',
    combo: '연계!', // 밀어 넣기 지뢰 보너스 팝업
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
    bannerUnlock: '새 보직 해금',
    bannerRevive: '위병소 부활 — 최후 저지선 복구',
    // ?scene=log 기록 화면(GDD §11). 열마다 쓰는 짧은 말은 별도 키로 둔다
    logTitle: '판 기록',
    logRuns: '판 수',
    logWinRate: '승률',
    logAvgTime: '평균 판 시간',
    logAvgWave: '평균 도달 웨이브',
    logCardHead: '보직',
    logBuys: '구매',
    logRate: '구매율',
    logRecent: '최근 판',
    logWave: '웨이브',
    logWin: '승리',
    logLose: '패배',
    logQuit: '포기',
    logEmpty: '기록이 없습니다',
    logMin: '분',
    logSec: '초',
    logLow: ' (낮음)',
    logSep: ' · ',
    logPct: '%',
    logSupport: '화력 지원 평균',
    logTimes: '회',
  },
  // 카드 도형 치수. LAYOUT.cell 기준 좌표이며 카드 중심이 원점이다. rank는 계급 작대기 묶음
  card: { inset: 10, initialPx: 64, namePx: 22, nameY: 44, rankX: 40, rankY: -40, rankW: 28, rankH: 6, rankGap: 4 },
  // 카드 위 체력바. 카드 중심 기준 좌표, lowRatio 이하면 low 색
  bar: { w: 80, h: 10, y: -56, bg: 0x141c26, ok: 0x66ff99, low: 0xffe066, lowRatio: 0.4 },
  // 카메라 흔들림(ms, 세기)
  shake: { light: { ms: 80, intensity: 0.004 }, heavy: { ms: 200, intensity: 0.012 } },
  // 구역 격자선 굵기
  stroke: 2,
  // 카드 길게 누르기(정보 열기)까지 걸리는 시간(ms)과 이 거리(px) 넘게 움직이면 취소하는 여유
  hold: { ms: 400, slop: 12 },
  // 적 체력바: 몸통 위쪽에 놓는다. 색은 UI.bar를 쓴다
  enemyBar: { h: 8, gap: 6 },
  enemyStroke: 2, // 강화 군견 흰 테두리 px
  gas: { alpha: 0.45, warnAlpha: 0.55, blinkMs: 150, depth: 5 }, // 가스 칸 depth는 카드(0)와 적(enemyDepth) 사이, 예고는 fxDepth
  // 지뢰 토큰 더미: 적 진입 구역 아래쪽 왼쪽 열(논리 좌표, trayY는 칸 단위 y 중심). 준비 단계에는 적이 없어 비어 있다
  mine: { trayCol: 0, trayY: 1.5, tokenR: 36, buriedR: 40, alpha: 0.5, countPx: 36 },
  // ?scene=log 배치. 23줄 안팎(카드 6종): 제목 1 + 요약 4 + 카드 머리·5 + 최근 머리·10 + 블록 사이 간격 2
  // 시작 y는 HUD 띠(LAYOUT.hudH) 아래. lineH 44 x 24줄 + blockGap 44 x 2 = 1144 -> y 112 + 1144 = 1256 < 1280
  // colBuys·colRate는 보직 이름(최대 약 280px) 오른쪽 열, 구매율 열은 '100.0%'가 720 안에 들어오는 위치
  log: { x: 40, y: 112, titlePx: 40, px: 28, lineH: 44, blockGap: 44, colBuys: 380, colRate: 520, lowColor: '#ffe066', secPerMin: 60, pct: 100, rateDigits: 1, waveDigits: 1 },
} as const

// ---- 07-02 이펙트 수치 (GDD §9 화려함 기준) ----
// 색은 "야간 작전" 톤: 아군 탄·섬광은 금색·흰색, 폭발·화염·불꽃은 주황~적색, 연기는 어두운 회색(분홍 없음)
// cfg는 Phaser 파티클 설정 그대로(속도·각도(도)·수명(ms)·크기·알파·색·중력). n은 한 번에 내는 개수
export const FX = {
  maxParticles: 400, // 동시 파티클 상한. 넘으면 새 연출은 남은 자리만큼만 낸다
  lowScale: 0.5, // ?fx=low 일 때 개수 배율
  lowValue: 'low',
  hitStopSec: 0.05, // 큰 사건 때 전투가 멈추는 실제 시간
  depthOver: 51, // 파티클 깊이(그림 이펙트 fxDepth 위)
  depthUnder: 49, // 연기·가스 깊이(fxDepth 아래, 적 위)
  // 코드로 만드는 파티클 텍스처: 흰색 원·사각·부드러운 원·십자
  tex: { color: 0xffffff, dot: 8, square: 6, glow: 32, glowSteps: 8, plus: 14, plusThick: 5 },
  // 총구 섬광(그림 이펙트가 없을 때): 부드러운 원이 커지며 사라진다
  muzzle: { from: 0.3, to: 0.9, ms: 110, color: 0xfff3b0, alpha: 1 },
  // 탄 궤적: 가산 선 + 끝으로 날아가는 빛 알갱이 + 맞은 자리 불꽃
  tracer: { headScale: 0.35, headColor: 0xffffff },
  // 저격 빛줄기: 굵은 금빛 바깥 선 + 흰 심지
  snipe: { outerW: 28, outerAlpha: 0.45, outerColor: 0xffe066, ms: 150 },
  // 충격파 고리(지뢰·화력 지원·RPG): 커지며 사라진다
  ring: {
    blast: { r: 24, lineW: 8, color: 0xffb347, scale: 5, ms: 420, alpha: 0.9 },
    rank: { r: 40, lineW: 6, color: 0xffe066, scale: 2.4, ms: 420, alpha: 0.9 },
    flash: { color: 0xffe9b0, from: 1.5, to: 4, ms: 200, alpha: 0.9 }, // 폭발 중심 번쩍임(부드러운 원)
  },
  // 취약 표식: 적 머리 위 붉은 아래 화살표. 남은 취약 시간이 blinkHz 단위로 켜졌다 꺼진다
  vuln: { w: 24, h: 20, color: 0xd23c3c, blinkHz: 6, gap: 6 },
  // 도발 고리: 제설병 발밑 금색 고리가 천천히 맥동한다(카드 중심 기준 좌표)
  taunt: { y: 52, w: 96, h: 24, lineW: 4, color: 0xffe066, alpha: 0.9, scale: 1.25, ms: 700 },
  // 가스 칸 연기: 가스가 있는 칸마다 puffSec 초에 한 번 피어오른다
  gas: { puffSec: 0.4, n: 2 },
  // 파티클 종류. tex는 위 텍스처 이름, depth는 over/under, blend는 가산 여부
  kinds: {
    spark: {
      tex: 'dot', n: 8, over: true,
      cfg: { speed: { min: 140, max: 380 }, angle: { min: 0, max: 360 }, lifespan: { min: 180, max: 380 }, scale: { start: 0.6, end: 0 }, alpha: { start: 1, end: 0 }, tint: [0xffffff, 0xfff3b0, 0xffe066], blendMode: 'ADD', gravityY: 400 },
    },
    fire: {
      tex: 'glow', n: 14, over: true,
      cfg: { speed: { min: 80, max: 320 }, angle: { min: 0, max: 360 }, lifespan: { min: 300, max: 600 }, scale: { start: 0.9, end: 0.2 }, alpha: { start: 0.9, end: 0 }, color: [0xfff3b0, 0xff9a2e, 0xd23c1c], blendMode: 'ADD' },
    },
    debris: {
      tex: 'square', n: 8, over: true,
      cfg: { speed: { min: 160, max: 420 }, angle: { min: 0, max: 360 }, lifespan: { min: 500, max: 900 }, scale: { start: 1, end: 0.5 }, alpha: { start: 1, end: 0 }, tint: [0x8a8f94, 0x6c7075, 0x555a5e], gravityY: 700, rotate: { start: 0, end: 360 } },
    },
    smoke: {
      tex: 'glow', n: 6, over: false,
      cfg: { speed: { min: 20, max: 70 }, angle: { min: -110, max: -70 }, lifespan: { min: 900, max: 1500 }, scale: { start: 0.6, end: 1.6 }, alpha: { start: 0.5, end: 0 }, tint: [0x3a3d42, 0x4a4d52, 0x2c2f33], gravityY: -30 },
    },
    dust: {
      tex: 'glow', n: 5, over: false,
      cfg: { speed: { min: 30, max: 90 }, angle: { min: 0, max: 360 }, lifespan: { min: 350, max: 600 }, scale: { start: 0.4, end: 0.9 }, alpha: { start: 0.45, end: 0 }, tint: [0x8c8272, 0x6f6759] },
    },
    dustTail: {
      tex: 'glow', n: 5, over: false,
      cfg: { speed: { min: 40, max: 120 }, angle: { min: 70, max: 110 }, lifespan: { min: 400, max: 700 }, scale: { start: 0.3, end: 0.7 }, alpha: { start: 0.5, end: 0 }, tint: [0xd8d2c4, 0xb8b2a4] },
    },
    snow: {
      tex: 'dot', n: 28, over: true,
      cfg: { speed: { min: 260, max: 520 }, angle: { min: -125, max: -55 }, lifespan: { min: 450, max: 750 }, scale: { start: 1, end: 0.3 }, alpha: { start: 1, end: 0 }, tint: [0xffffff, 0xbfe6ff, 0xdff3ff], blendMode: 'ADD' },
    },
    ember: {
      tex: 'dot', n: 5, over: true,
      cfg: { speed: { min: 120, max: 300 }, angle: { min: -125, max: -55 }, lifespan: { min: 400, max: 700 }, scale: { start: 0.5, end: 0 }, alpha: { start: 1, end: 0 }, color: [0xffd27a, 0xff7a1c], blendMode: 'ADD', gravityY: -60 },
    },
    casing: {
      tex: 'square', n: 1, over: true,
      cfg: { speed: { min: 140, max: 240 }, angle: { min: -60, max: -20 }, lifespan: { min: 450, max: 600 }, scale: { start: 0.6, end: 0.6 }, alpha: { start: 1, end: 0 }, tint: [0xd9b04a], gravityY: 1000, rotate: { start: 0, end: 540 } },
    },
    star: {
      tex: 'square', n: 12, over: true,
      cfg: { speed: { min: 120, max: 300 }, angle: { min: 0, max: 360 }, lifespan: { min: 500, max: 800 }, scale: { start: 1, end: 0 }, alpha: { start: 1, end: 0 }, tint: [0xffffff, 0xffe066, 0xd9b04a], blendMode: 'ADD', rotate: { start: 0, end: 360 }, gravityY: -80 },
    },
    plus: {
      tex: 'plus', n: 4, over: true,
      cfg: { speed: { min: 50, max: 110 }, angle: { min: -110, max: -70 }, lifespan: { min: 600, max: 900 }, scale: { start: 1, end: 0.6 }, alpha: { start: 1, end: 0 }, tint: [0x66ff99, 0xd8ffd0], blendMode: 'ADD' },
    },
    gasSmoke: {
      tex: 'glow', n: 1, over: false,
      cfg: { x: { min: -48, max: 48 }, y: { min: -32, max: 48 }, speed: { min: 30, max: 60 }, angle: { min: -115, max: -65 }, lifespan: { min: 1600, max: 2400 }, scale: { start: 0.7, end: 1.8 }, alpha: { start: 0.9, end: 0 }, tint: [0xe8ec60, 0x9fe05a, 0xc8d84a], blendMode: 'ADD' },
    },
  },
}

// ---- 2단계 전투 수치 (추가분) ----

// GDD §5.6. 웨이브 HP 스케일(rules.waveHp)은 보스에도 적용한다(OQ-3: W5 1776, W10 2496)
// color는 아트 전 임시색(ART §2: 적은 회갈색 계열, 붉은색·주황은 적의 공격·경보에만), size는 칸 대비 비율
// speed 칸/초, interval 초, baseDmg 위병소 피해, knock 밀어내기 배율, range 칸(0이면 막힌 뒤 근접)
export const ENEMY_KEYS = ['infantry', 'dog', 'rpg', 'boss', 'dogPlus'] as const
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
  infantry: { name: '보병', hp: 120, speed: 0.35, dmg: 10, interval: 1, baseDmg: 1, knock: 1, range: 0, color: 0x80786a, size: 0.55 },
  dog: { name: '군견', hp: 80, speed: 0.9, dmg: 6, interval: 0.5, baseDmg: 1, knock: 1.5, range: 0, color: 0x6a5f50, size: 0.45 },
  rpg: { name: 'RPG병', hp: 100, speed: 0.3, dmg: 35, interval: 3, baseDmg: 2, knock: 1, range: 3, color: 0x5f6b73, size: 0.55 },
  boss: { name: '장갑차', hp: 2400, speed: 0.15, dmg: 40, interval: 1, baseDmg: 5, knock: 0.25, range: 0, color: 0x4a5560, size: 0.9 },
  dogPlus: { name: '강화 군견', hp: 160, speed: 0.9, dmg: 6, interval: 0.5, baseDmg: 1, knock: 1.0, range: 0, color: 0x4a4238, size: 0.45 }, // §5.6 군견보다 단단하고 덜 밀린다
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

// GDD §5.8 화력 지원. delay(예고선 뒤 포격)·pickSec(열 고르기 제한)은 초
export const SUPPORT = { charges: 2, damage: 200, delay: 1.0, pickSec: 5 }

// GDD §5.6 군견. triggerGap은 배치 구역 윗변 앞 칸 수, laneMs는 열 옮김 트윈 시간(연출 보정값)
export const DOG = { triggerGap: 0.5, laneMs: 250 }

// GDD §4·§4.1·§4.2. 준비/정산 초, 위병소 HP, 데프콘 1(웨이브 7~) 규칙
// maxDt·slideSpeed는 연출·판정 보정값
export const BATTLE = {
  prepFirst: 30,
  prepNext: 20,
  settleSec: 1.5,
  baseHp: 20,
  defcon1From: 7,
  defcon1AllyInterval: 0.8,
  defcon1SpawnGap: 0.7,
  maxDt: 0.1,
  slideSpeed: 8,
}

// GDD §5.1·§5.2 전투 2.0. 거리는 칸 단위 유클리드. 제설병 취약·도발·지뢰 연계
// tieEps는 거리 비교 오차(같은 거리 판정), pierceWidth는 저격 사선 폭, minePush*는 밀린 뒤 지뢰에 닿는 허용 초와 배율
export const COMBAT = {
  meleeReach: 1.5,
  pierceWidth: 0.4,
  tieEps: 1e-9,
  blowerArmor: 0.9,
  vulnSec: 2,
  vulnMult: 1.2,
  minePushSec: 1,
  minePushMult: 1.5,
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

// GDD §5.2·§5.3·§5.4·§5.6 화학전. 가스 칸은 배치 구역 5x3 칸 단위, 시간은 초
export const GAS = {
  warn: 1.5, // 예고 초
  life: 20, // 지속 초(겹쳐 떨어지면 더하지 않고 이 값으로 갱신)
  slow: 2, // 가스 위 아군 공격 간격 배율
  dps: 5, // 가스 위 아군 초당 피해
  cleanse: 3, // 화학병 제독 주기 초
  reach: [1, 2] as readonly number[], // [이등병·일병, 상병 이상] 체비셰프 거리
  sgtBuff: 1.15, // 병장 범위 reach[0] 안 아군(자기 제외) 직접 공격 피해 배율
  at: [0.35, 0.7] as readonly number[], // 그 웨이브 마지막 출현 시각 대비 떨어지는 시점
  size: 2, // 화학탄 한 발의 한 변 칸 수(2x2)
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
  order: ['cook', 'miner', 'chem'],
  atWave: 5,
}

// 같은 페이지에서 "다시 투입"할 때마다 난수 시드에 더하는 간격(판마다 다른 출현 순서)
export const RUN = { reseedStep: 7919, gasSeed: 3 } // gasSeed: 화학탄 난수 스트림 = 시드 + 3

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

// docs/ART.md §2·§4 그림 반영. 실제 그림이 목록(indexUrl)에 있는 키만 스프라이트로 그리고 나머지는 도형이다
// foot은 발끝 피벗 비율(116/128), footY는 카드·적 중심에서 발끝까지 px, fps는 반복(loop)·1회(once) 애니메이션 초당 프레임
export const ART = {
  indexKey: 'art_index',
  indexUrl: '/assets/index.json',
  dir: '/assets/',
  fps: { loop: 6, once: 12 },
  loopSuffix: ['_idle', '_walk', '_run'] as readonly string[],
  loopKeys: ['fx_gas'] as readonly string[],
  foot: 116 / 128,
  footY: 52,
  shadow: { w: 84, h: 24, alpha: 0.35, color: 0x000000 },
  hitMs: 120, // 피격 틴트 시간
  hitTint: 0xffffff,
  fallAngle: 80, // 쓰러질 때 기울기(도)
  dogPlusTint: 0x8a7468, // 강화 군견: 같은 그림에 진한 틴트
  gridAlpha: 0.35, // bg_gate가 있을 때 판 칸 색의 알파
  // 적 종류 -> 그림 이름과 걷기(달리기)·공격 상태 이름. 강화 군견은 군견 그림을 쓴다
  enemy: {
    infantry: { id: 'inf', move: 'walk', act: 'attack' },
    dog: { id: 'dog', move: 'run', act: 'bite' },
    dogPlus: { id: 'dog', move: 'run', act: 'bite' },
    rpg: { id: 'rpg', move: 'walk', act: 'fire' },
  },
} as const
