// tests/assets-pipeline.test.ts를 위한 테스트 헬퍼 (Node fs/tmp 및 pngjs 래퍼)
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'
import {
  BASELINE_Y,
  UNIT_TARGET_HEIGHT,
  alignFrameToCanvas,
  findBoundingBox,
  ingestInbox,
  loadAssetContracts,
  mergeFramesToSheet,
  processAllAssets,
  processAssetKey,
  removeMagenta,
  splitSheetByChunks,
  suggestSimilarKeys,
} from '../assets.mjs'
import { checkAssets } from '../assets-check.mjs'
import {
  createFiveChunkSheet,
  createIrregularThreeSoldierSheet,
  createMagentaBackgroundFixture,
  createTwoSoldierIdleSheet,
  generateFixtures,
} from './generate-fixtures.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const ROOT_DIR = resolve(__dirname, '..', '..')
export const FIXTURES_DIR = __dirname

export {
  BASELINE_Y,
  UNIT_TARGET_HEIGHT,
  alignFrameToCanvas,
  checkAssets,
  createFiveChunkSheet,
  createIrregularThreeSoldierSheet,
  createMagentaBackgroundFixture,
  createTwoSoldierIdleSheet,
  findBoundingBox,
  generateFixtures,
  ingestInbox,
  loadAssetContracts,
  mergeFramesToSheet,
  processAllAssets,
  processAssetKey,
  removeMagenta,
  splitSheetByChunks,
  suggestSimilarKeys,
}

export function readFixturePng(relPath) {
  return PNG.sync.read(readFileSync(join(FIXTURES_DIR, relPath)))
}

export function readPngFile(absPath) {
  return PNG.sync.read(readFileSync(absPath))
}

export function writePngFile(absPath, png) {
  mkdirSync(dirname(absPath), { recursive: true })
  writeFileSync(absPath, PNG.sync.write(png, { colorType: 6 }))
}

export function sliceSheetFrame(sheetPng, frameIndex, frameW) {
  const frameH = sheetPng.height
  const startX = frameIndex * frameW
  const out = new PNG({ width: frameW, height: frameH, colorType: 6 })
  for (let y = 0; y < frameH; y++) {
    for (let x = 0; x < frameW; x++) {
      const srcIdx = (y * sheetPng.width + (startX + x)) * 4
      const dstIdx = (y * frameW + x) * 4
      out.data[dstIdx] = sheetPng.data[srcIdx]
      out.data[dstIdx + 1] = sheetPng.data[srcIdx + 1]
      out.data[dstIdx + 2] = sheetPng.data[srcIdx + 2]
      out.data[dstIdx + 3] = sheetPng.data[srcIdx + 3]
    }
  }
  return out
}

export function getPixel(png, x, y) {
  const idx = (y * png.width + x) * 4
  return {
    r: png.data[idx],
    g: png.data[idx + 1],
    b: png.data[idx + 2],
    a: png.data[idx + 3],
  }
}

export function createSolidCustomPng(width, height, colorType = 6) {
  const png = new PNG({ width, height, colorType })
  for (let i = 0; i < width * height * 4; i += 4) {
    png.data[i] = 50
    png.data[i + 1] = 100
    png.data[i + 2] = 50
    png.data[i + 3] = 255
  }
  return PNG.sync.write(png, { colorType })
}

export function createTallFeetOverflowPng() {
  // 캔버스 128×128 안에는 들어가지만(높이 122px) 발끝 기준선 y=116에 맞추면 위쪽(116 - 122 + 1 = -5 < 0)으로 삐져나가는 이미지
  const png = new PNG({ width: 128, height: 128, colorType: 6 })
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const idx = (y * 128 + x) * 4
      if (x >= 40 && x < 80 && y >= 2 && y < 124) {
        png.data[idx] = 75
        png.data[idx + 1] = 83
        png.data[idx + 2] = 32
        png.data[idx + 3] = 255
      } else {
        png.data[idx] = 0
        png.data[idx + 1] = 0
        png.data[idx + 2] = 0
        png.data[idx + 3] = 0
      }
    }
  }
  return png
}

export function withTempWorkspace(fn) {
  const tempDir = mkdtempSync(join(tmpdir(), 'taimen-h103-'))
  try {
    const inboxDir = join(tempDir, 'art', 'inbox')
    const sourceDir = join(tempDir, 'art', 'source')
    const outAssetsDir = join(tempDir, 'public', 'assets')
    const ledgerPath = join(tempDir, 'art', 'LEDGER.json')
    const indexPath = join(outAssetsDir, 'index.json')
    mkdirSync(inboxDir, { recursive: true })
    mkdirSync(sourceDir, { recursive: true })
    mkdirSync(outAssetsDir, { recursive: true })
    writeFileSync(indexPath, '[]\n', 'utf8')
    writeFileSync(ledgerPath, '{"entries":[]}\n', 'utf8')

    return fn({
      tempDir,
      inboxDir,
      sourceDir,
      outAssetsDir,
      ledgerPath,
      indexPath,
      exists: (path) => existsSync(path),
      writeJson: (path, data) => writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8'),
      readJson: (path) => JSON.parse(readFileSync(path, 'utf8')),
      writeRawFile: (path, buf) => writeFileSync(path, buf),
      writePng: (path, png) => writePngFile(path, png),
      removeFile: (path) => rmSync(path, { force: true }),
      joinPath: (...parts) => join(...parts),
    })
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}
