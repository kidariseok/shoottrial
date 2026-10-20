// H-102 테스트용 마젠타 배경 fixture 이미지 생성기
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
 * 1) ally_rifle_idle (128×128, 1~2프레임, 발끝 y=116 정렬 테스트용)
 * - 원본 크기 96×110 마젠타(#FF00FF) 배경
 * - 의도적으로 왼쪽 위(x=10, y=8)에 치우쳐 배치된 36×72 픽셀 캐릭터
 * - 캐릭터 바깥 1px에 분홍 번짐(#F050F0) 테두리 포함
 */
function createSoldierFrame(offsetY = 0) {
  const png = new PNG({ width: 96, height: 110, colorType: 6 })
  // 마젠타(#FF00FF) 배경 채우기
  fillRect(png, 0, 0, 96, 110, 255, 0, 255, 255)

  // 오차 범위 내 마젠타 노이즈 픽셀 몇 개 추가 (#FA05FA)
  setPixel(png, 2, 2, 250, 5, 250, 255)
  setPixel(png, 90, 100, 252, 8, 248, 255)

  const bx = 10
  const by = 8 + offsetY
  const bw = 36
  const bh = 72

  // 캐릭터 주변 1px 마젠타 번짐(분홍 테두리 #F050F0)
  fillRect(png, bx - 1, by - 1, bw + 2, bh + 2, 240, 80, 240, 255)

  // 캐릭터 본체(36×72): 남색 외곽선(#1b1d26) + 방탄헬멧/군복(#4b5320, #606b29) + 전투화(#2a2a2a)
  fillRect(png, bx, by, bw, bh, 27, 29, 38, 255) // 외곽선
  fillRect(png, bx + 4, by + 2, bw - 8, 22, 62, 72, 38, 255) // 헬멧
  fillRect(png, bx + 2, by + 24, bw - 4, 36, 75, 83, 32, 255) // 디지털 위장 군복 몸통
  fillRect(png, bx + 6, by + 60, 10, 11, 42, 42, 42, 255) // 왼발 전투화
  fillRect(png, bx + bw - 16, by + 60, 10, 11, 42, 42, 42, 255) // 오른발 전투화

  return png
}

/**
 * 2) fx_muzzle (32×32, 2프레임 고정, 중앙 정렬 테스트용 가로 시트)
 */
function createMuzzleSheet() {
  const png = new PNG({ width: 64, height: 32, colorType: 6 })
  fillRect(png, 0, 0, 64, 32, 255, 0, 255, 255)

  // 1프레임: (x=2..13, y=4..15)에 12×12 노란 섬광
  fillRect(png, 2, 4, 12, 12, 255, 215, 0, 255)
  // 2프레임: (x=36..51, y=8..23)에 16×16 주황/노란 섬광
  fillRect(png, 36, 8, 16, 16, 255, 180, 0, 255)

  return png
}

/**
 * 3) 크기 초과 테스트용 (128×128 캔버스에 140×136 불투명 객체)
 */
function createOversizeFrame() {
  const png = new PNG({ width: 150, height: 150, colorType: 6 })
  fillRect(png, 0, 0, 150, 150, 255, 0, 255, 255)
  // 140×136 불투명 올리브 사각형
  fillRect(png, 5, 5, 140, 136, 75, 83, 32, 255)
  return png
}

export function generateFixtures(baseDir = __dirname) {
  const rifleDir = join(baseDir, 'source', 'ally_rifle_idle')
  mkdirSync(rifleDir, { recursive: true })
  writeFileSync(join(rifleDir, '01.png'), PNG.sync.write(createSoldierFrame(0), { colorType: 6 }))
  writeFileSync(join(rifleDir, '02.png'), PNG.sync.write(createSoldierFrame(2), { colorType: 6 }))
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

  const muzzleDir = join(baseDir, 'source', 'fx_muzzle')
  mkdirSync(muzzleDir, { recursive: true })
  writeFileSync(join(muzzleDir, 'sheet.png'), PNG.sync.write(createMuzzleSheet(), { colorType: 6 }))

  const oversizeDir = join(baseDir, 'oversize', 'ally_sniper_idle')
  mkdirSync(oversizeDir, { recursive: true })
  writeFileSync(join(oversizeDir, '01.png'), PNG.sync.write(createOversizeFrame(), { colorType: 6 }))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateFixtures()
  console.log('✓ 테스트 fixtures 생성 완료: scripts/fixtures/')
}
