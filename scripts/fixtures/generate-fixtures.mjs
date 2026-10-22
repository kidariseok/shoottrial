// H-102 / H-103 테스트용 마젠타 배경 fixture 이미지 생성기
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

function setPixel(png, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= png.width || y < 0 || y >= png.height) return
  const idx = (y * png.width + x) * 4
  png.data[idx] = r
  png.data[idx + 1] = g
  png.data[idx + 2] = b
  png.data[idx + 3] = a
}

function fillRect(png, x0, y0, w, h, r, g, b, a = 255) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      setPixel(png, x, y, r, g, b, a)
    }
  }
}

/**
 * 사람 모양(머리·몸통·다리)을 지정된 위치(bx, by)와 크기(bw, bh)로 그린다.
 */
function drawHumanoid(png, bx, by, bw, bh, options = {}) {
  const headH = Math.max(8, Math.floor(bh * 0.28))
  const torsoH = Math.max(10, Math.floor(bh * 0.47))
  const legH = bh - headH - torsoH
  const headInset = Math.max(2, Math.floor(bw * 0.12))
  const legW = Math.max(4, Math.floor(bw * 0.32))

  if (options.withFringe) {
    // 각 부위 바깥 1px에만 분홍 번짐(#F050F0) 테두리를 그린다
    fillRect(png, bx + headInset - 1, by - 1, bw - headInset * 2 + 2, headH + 2, 240, 80, 240, 255)
    fillRect(png, bx - 1, by + headH - 1, bw + 2, torsoH + 2, 240, 80, 240, 255)
    fillRect(png, bx + 2 - 1, by + headH + torsoH - 1, legW + 2, legH + 2, 240, 80, 240, 255)
    fillRect(png, bx + bw - 2 - legW - 1, by + headH + torsoH - 1, legW + 2, legH + 2, 240, 80, 240, 255)
  }

  // 남색 외곽선 바운딩을 위해 머리·몸통·전투화를 꽉 차게 그림
  fillRect(png, bx + headInset, by, bw - headInset * 2, headH, 27, 29, 38, 255)
  fillRect(png, bx + headInset + 2, by + 2, bw - (headInset + 2) * 2, headH - 4, 96, 115, 58, 255)

  fillRect(png, bx, by + headH, bw, torsoH, 27, 29, 38, 255)
  fillRect(png, bx + 2, by + headH + 2, bw - 4, torsoH - 4, 75, 92, 42, 255)

  fillRect(png, bx + 2, by + headH + torsoH, legW, legH, 48, 52, 58, 255)
  fillRect(png, bx + bw - 2 - legW, by + headH + torsoH, legW, legH, 48, 52, 58, 255)

  // 총구가 몸통에서 2px(<4px) 떨어진 경우 시뮬레이션
  if (options.detachedGunGap) {
    const gap = options.detachedGunGap
    const gunY = by + headH + Math.floor(torsoH * 0.3)
    fillRect(png, bx + bw + gap, gunY, 8, 6, 55, 62, 72, 255)
  }
}

/**
 * 1) ally_rifle_idle (128×128, 1~2프레임, 발끝 y=116 정렬 테스트용)
 */
function createSoldierFrame(offsetY = 0) {
  const png = new PNG({ width: 96, height: 110, colorType: 6 })
  fillRect(png, 0, 0, 96, 110, 255, 0, 255, 255)

  setPixel(png, 2, 2, 250, 5, 250, 255)
  setPixel(png, 90, 100, 252, 8, 248, 255)

  const bx = 10
  const by = 8 + offsetY
  const bw = 36
  const bh = 72

  fillRect(png, bx - 1, by - 1, bw + 2, bh + 2, 240, 80, 240, 255)
  fillRect(png, bx, by, bw, bh, 27, 29, 38, 255)
  fillRect(png, bx + 4, by + 2, bw - 8, 22, 96, 115, 58, 255)
  fillRect(png, bx + 6, by + 6, bw - 12, 8, 132, 156, 84, 255)
  fillRect(png, bx + 2, by + 24, bw - 4, 36, 75, 92, 42, 255)
  fillRect(png, bx + 8, by + 28, bw - 16, 22, 108, 128, 64, 255)
  fillRect(png, bx + bw - 6, by + 10, 4, 24, 55, 62, 72, 255)
  fillRect(png, bx + 6, by + 60, 10, 11, 48, 52, 58, 255)
  fillRect(png, bx + bw - 16, by + 60, 10, 11, 48, 52, 58, 255)

  return png
}

/**
 * 2) fx_muzzle (32×32, 2프레임 고정, 중앙 정렬 테스트용 가로 시트)
 */
function createMuzzleSheet() {
  const png = new PNG({ width: 64, height: 32, colorType: 6 })
  fillRect(png, 0, 0, 64, 32, 255, 0, 255, 255)
  fillRect(png, 2, 4, 12, 12, 255, 215, 0, 255)
  fillRect(png, 36, 8, 16, 16, 255, 180, 0, 255)
  return png
}

/**
 * 3) 크기 초과 테스트용 (meta.json "fit": false일 때 140×136 실패 확인용)
 */
function createOversizeFrame() {
  const png = new PNG({ width: 150, height: 150, colorType: 6 })
  fillRect(png, 0, 0, 150, 150, 255, 0, 255, 255)
  fillRect(png, 5, 5, 140, 136, 75, 83, 32, 255)
  return png
}

/**
 * 4) H-103 §5.1 & §5.2 테스트용:
 * 600×300 마젠타 위에 높이가 다른 사람 모양 3개(180px, 240px, 200px),
 * 사이 간격 불규칙, 2번째 사람은 총구 조각이 2px(<4px) 떨어져 있고,
 * 오른쪽 위에 작은 글자 조각 1개(6×5 = 30px, 최대 덩어리 면적의 3% 미만) 포함.
 */
export function createIrregularThreeSoldierSheet(heights = [180, 240, 200]) {
  const png = new PNG({ width: 600, height: 300, colorType: 6 })
  fillRect(png, 0, 0, 600, 300, 255, 0, 255, 255)

  // 사람 1: x=24..103 (폭 80), 높이 heights[0]
  drawHumanoid(png, 24, 280 - heights[0], 80, heights[0], { withFringe: true })

  // 사람 2: x=155..234 (폭 80, 간격 51px) + 2px 떨어진 총구 조각(x=237..244), 높이 heights[1]
  drawHumanoid(png, 155, 280 - heights[1], 80, heights[1], {
    withFringe: true,
    detachedGunGap: 2,
  })

  // 사람 3: x=370..449 (폭 80, 간격 125px), 높이 heights[2]
  drawHumanoid(png, 370, 280 - heights[2], 80, heights[2], { withFringe: true })

  // 작은 글자/반짝이 조각 1개: x=540..545, y=20..24 (6×5 = 30px, 3% 미만)
  fillRect(png, 540, 20, 6, 5, 30, 30, 30, 255)

  return png
}

/**
 * 5) H-103 §5.3 배율 공유 테스트용 2프레임(_idle) 시트 (600×300, 최대 높이 240px → 배율 96/240 = 0.4)
 */
export function createTwoSoldierIdleSheet(heights = [220, 240]) {
  const png = new PNG({ width: 600, height: 300, colorType: 6 })
  fillRect(png, 0, 0, 600, 300, 255, 0, 255, 255)

  drawHumanoid(png, 60, 280 - heights[0], 80, heights[0])
  drawHumanoid(png, 260, 280 - heights[1], 80, heights[1])

  return png
}

/**
 * 6) H-103 §5.4 허용 프레임 범위 초과 테스트용 (5덩어리)
 */
export function createFiveChunkSheet() {
  const png = new PNG({ width: 600, height: 200, colorType: 6 })
  fillRect(png, 0, 0, 600, 200, 255, 0, 255, 255)
  const xs = [15, 125, 240, 360, 480]
  for (const x of xs) {
    drawHumanoid(png, x, 40, 60, 120)
  }
  return png
}

/**
 * 7) H-103 §5.5 배경(bg_*) cover 축소 및 마젠타 보존 테스트용 (1000×2000)
 */
export function createMagentaBackgroundFixture(width = 1000, height = 2000) {
  const png = new PNG({ width, height, colorType: 6 })
  // 전체를 어두운 남색 배경으로 채우고, 정중앙 영역에 마젠타(#FF00FF)를 칠한다.
  fillRect(png, 0, 0, width, height, 30, 37, 43, 255)
  fillRect(png, Math.floor(width * 0.25), Math.floor(height * 0.25), Math.floor(width * 0.5), Math.floor(height * 0.5), 255, 0, 255, 255)
  return png
}

export function generateFixtures(baseDir = __dirname) {
  const rifleDir = join(baseDir, 'source', 'ally_rifle_idle')
  mkdirSync(rifleDir, { recursive: true })
  writeFileSync(join(rifleDir, '01.png'), PNG.sync.write(createSoldierFrame(0), { colorType: 6 }))
  writeFileSync(
    join(rifleDir, 'meta.json'),
    JSON.stringify(
      {
        tool: 'gemini-argon',
        prompt: 'docs/ART.md#3.2',
        source: 'https://www.figma.com/design/6RrU20Hv8way6vlYjcTJU3/?node-id=5-18',
        license: 'proprietary',
        edited: true,
        checked: '2026-10-21',
      },
      null,
      2
    ) + '\n',
    'utf8'
  )

  const attackDir = join(baseDir, 'source', 'ally_rifle_attack')
  mkdirSync(attackDir, { recursive: true })
  writeFileSync(join(attackDir, '01.png'), PNG.sync.write(createSoldierFrame(0), { colorType: 6 }))
  writeFileSync(join(attackDir, '02.png'), PNG.sync.write(createSoldierFrame(2), { colorType: 6 }))
  writeFileSync(
    join(attackDir, 'meta.json'),
    JSON.stringify(
      {
        tool: 'gemini-argon',
        prompt: 'docs/ART.md#3.2',
        source: 'https://www.figma.com/design/6RrU20Hv8way6vlYjcTJU3/?node-id=5-18',
        license: 'proprietary',
        edited: true,
        checked: '2026-10-21',
      },
      null,
      2
    ) + '\n',
    'utf8'
  )

  const muzzleDir = join(baseDir, 'source', 'fx_muzzle')
  mkdirSync(muzzleDir, { recursive: true })
  writeFileSync(join(muzzleDir, 'sheet.png'), PNG.sync.write(createMuzzleSheet(), { colorType: 6 }))

  const oversizeDir = join(baseDir, 'oversize', 'ally_sniper_idle')
  mkdirSync(oversizeDir, { recursive: true })
  writeFileSync(join(oversizeDir, '01.png'), PNG.sync.write(createOversizeFrame(), { colorType: 6 }))
  writeFileSync(join(oversizeDir, 'meta.json'), JSON.stringify({ fit: false }, null, 2) + '\n', 'utf8')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateFixtures()
  console.log('✓ 테스트 fixtures 생성 완료: scripts/fixtures/')
}
