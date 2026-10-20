#!/usr/bin/env node
// H-102 에셋 정리 스크립트: 마젠타(#FF00FF) 제거 → 계약 캔버스 정렬(발끝 y=116 / 중앙) → 시트 병합 + index.json & LEDGER.json 갱신
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

export const BASELINE_Y = 116
export const DEFAULT_MAGENTA_TOLERANCE = 45

/**
 * docs/ART.md §4의 프레임 최대치 규칙을 반환한다.
 * 최소 프레임 수(frames)와 크기(w, h)는 src/assets.ts에서 파싱한다.
 */
function getMaxFrames(key, minFrames) {
  if (/^ally_.*_idle$/.test(key) || /^ally_.*_down$/.test(key) || key === 'boss_apc_hull') {
    return 2
  }
  if (/^ally_.*_attack$/.test(key) || /^enemy_(inf|rpg)_walk$/.test(key) || key === 'enemy_dog_run') {
    return 4
  }
  if (key === 'enemy_inf_attack' || key === 'enemy_rpg_fire' || /^enemy_.*_down$/.test(key)) {
    return 3
  }
  return minFrames
}

/**
 * 키 이름으로 피벗 기준을 판별한다 (docs/ART.md §2, §4).
 * 유닛(ally_*, enemy_*)은 발 중앙(y=116), 보스·이펙트·카드·아이콘·배경·타일·계급장은 정중앙.
 */
export function getPivotMode(key) {
  return /^(ally|enemy)_/.test(key) ? 'feet' : 'center'
}

/**
 * src/assets.ts를 읽어 에셋 계약 표를 파싱한다 (표를 두 군데에 복사하지 않는다).
 */
export function loadAssetContracts(rootDir = process.cwd()) {
  const assetsTsPath = join(rootDir, 'src', 'assets.ts')
  const content = readFileSync(assetsTsPath, 'utf8')

  const cardsMatch = content.match(/export\s+const\s+CARDS\s*=\s*\[([^\]]+)\]/)
  const cards = cardsMatch
    ? [...cardsMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
    : ['rifle', 'sniper', 'blower', 'cook', 'miner', 'chem']

  const contracts = []
  const rowRegex = /\{\s*key:\s*(`[^`]+`|'[^']+')\s*,\s*w:\s*(\d+)\s*,\s*h:\s*(\d+)\s*,\s*frames:\s*(\d+)/g

  for (const match of content.matchAll(rowRegex)) {
    const rawKey = match[1].slice(1, -1)
    const w = Number(match[2])
    const h = Number(match[3])
    const minFrames = Number(match[4])

    if (rawKey.includes('${c}')) {
      for (const c of cards) {
        const key = rawKey.replace('${c}', c)
        contracts.push({
          key,
          w,
          h,
          frames: minFrames,
          minFrames,
          maxFrames: getMaxFrames(key, minFrames),
          pivot: getPivotMode(key),
        })
      }
    } else {
      contracts.push({
        key: rawKey,
        w,
        h,
        frames: minFrames,
        minFrames,
        maxFrames: getMaxFrames(rawKey, minFrames),
        pivot: getPivotMode(rawKey),
      })
    }
  }

  return contracts
}

/**
 * 픽셀이 마젠타(#FF00FF ± tolerance)인지 판별한다.
 */
export function isMagentaPixel(r, g, b, tolerance = DEFAULT_MAGENTA_TOLERANCE) {
  return 255 - r <= tolerance && g <= tolerance && 255 - b <= tolerance
}

/**
 * 경계 1px의 마젠타 번짐(분홍/자홍 테두리)인지 판별한다.
 */
function isMagentaFringePixel(r, g, b) {
  return r >= 120 && b >= 120 && r - g >= 35 && b - g >= 35 && Math.abs(r - b) <= 65
}

/**
 * 마젠타(#FF00FF ± 허용 오차)를 투명하게 만들고,
 * 제거된 배경과 맞닿은 경계 1px의 마젠타 번짐(분홍 테두리)을 정리한다.
 */
export function removeMagenta(srcPng, tolerance = DEFAULT_MAGENTA_TOLERANCE) {
  const { width, height } = srcPng
  const out = new PNG({ width, height, colorType: 6 })
  srcPng.data.copy(out.data)

  const removedMask = new Uint8Array(width * height)

  // 1차 패스: 마젠타 배경 픽셀 투명화
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const idx = i * 4
      const r = out.data[idx]
      const g = out.data[idx + 1]
      const b = out.data[idx + 2]
      const a = out.data[idx + 3]

      if (a === 0) {
        removedMask[i] = 1
        continue
      }

      if (isMagentaPixel(r, g, b, tolerance)) {
        out.data[idx] = 0
        out.data[idx + 1] = 0
        out.data[idx + 2] = 0
        out.data[idx + 3] = 0
        removedMask[i] = 1
      }
    }
  }

  // 2차 패스: 투명/마젠타 배경과 1px 인접한 경계의 분홍 테두리(마젠타 번짐) 1px 정리
  const fringeIndices = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      if (removedMask[i]) continue

      const idx = i * 4
      const r = out.data[idx]
      const g = out.data[idx + 1]
      const b = out.data[idx + 2]
      if (!isMagentaFringePixel(r, g, b)) continue

      let touchesBackground = false
      for (let dy = -1; dy <= 1 && !touchesBackground; dy++) {
        for (let dx = -1; dx <= 1 && !touchesBackground; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
            touchesBackground = true
          } else if (removedMask[ny * width + nx]) {
            touchesBackground = true
          }
        }
      }

      if (touchesBackground) {
        fringeIndices.push(idx)
      }
    }
  }

  for (const idx of fringeIndices) {
    out.data[idx] = 0
    out.data[idx + 1] = 0
    out.data[idx + 2] = 0
    out.data[idx + 3] = 0
  }

  return out
}

/**
 * PNG에서 불투명 픽셀(alpha > 0)의 경계 상자(Bounding Box)를 구한다.
 */
export function findBoundingBox(png) {
  let minX = png.width
  let minY = png.height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const a = png.data[(y * png.width + x) * 4 + 3]
      if (a > 0) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return null
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

/**
 * 단일 프레임을 내용 경계로 잘라 계약 캔버스에 정렬한다.
 * - pivot === 'feet': 가로 중앙, 발끝(가장 아래 불투명 픽셀)을 y = 116에 정렬
 * - pivot === 'center': 가로·세로 정중앙 정렬
 * - 내용이 캔버스보다 크면 축소하지 않고 에러를 던진다.
 */
export function alignFrameToCanvas(cleanedPng, contract, baselineY = BASELINE_Y) {
  const bbox = findBoundingBox(cleanedPng)
  if (!bbox) {
    throw new Error(`[${contract.key}] 프레임에 불투명 픽셀이 없습니다.`)
  }

  const { width: contentW, height: contentH, minX, minY } = bbox
  const { w: canvasW, h: canvasH } = contract
  const pivot = contract.pivot ?? getPivotMode(contract.key)

  if (contentW > canvasW || contentH > canvasH) {
    throw new Error(
      `[${contract.key}] 내용 크기(${contentW}×${contentH})가 계약 캔버스(${canvasW}×${canvasH})를 초과합니다. 최근접 축소를 하지 않으므로 원본 크기를 줄여 주세요.`
    )
  }

  const destX = Math.floor((canvasW - contentW) / 2)
  let destY
  if (pivot === 'feet') {
    // 가장 아래 불투명 픽셀의 y좌표가 정확히 baselineY(116)가 되도록 배치
    destY = baselineY - contentH + 1
    if (destY < 0 || destY + contentH > canvasH) {
      throw new Error(
        `[${contract.key}] 내용 높이(${contentW}×${contentH})가 발끝 기준선(y=${baselineY}) 배치 허용 높이(${baselineY + 1}px, 캔버스 ${canvasW}×${canvasH})를 초과합니다.`
      )
    }
  } else {
    destY = Math.floor((canvasH - contentH) / 2)
  }

  const canvasPng = new PNG({ width: canvasW, height: canvasH, colorType: 6 })
  canvasPng.data.fill(0)

  for (let cy = 0; cy < contentH; cy++) {
    for (let cx = 0; cx < contentW; cx++) {
      const srcIdx = ((minY + cy) * cleanedPng.width + (minX + cx)) * 4
      const dstIdx = ((destY + cy) * canvasW + (destX + cx)) * 4
      canvasPng.data[dstIdx] = cleanedPng.data[srcIdx]
      canvasPng.data[dstIdx + 1] = cleanedPng.data[srcIdx + 1]
      canvasPng.data[dstIdx + 2] = cleanedPng.data[srcIdx + 2]
      canvasPng.data[dstIdx + 3] = cleanedPng.data[srcIdx + 3]
    }
  }

  return canvasPng
}

/**
 * 가로 한 줄 시트(sheet.png)를 프레임 단위로 분할한다.
 */
export function splitHorizontalSheet(sheetPng, contract) {
  const minF = contract.minFrames ?? contract.frames
  const maxF = contract.maxFrames ?? contract.frames

  let frameCount = contract.frames
  if (sheetPng.width % contract.w === 0) {
    const candidate = sheetPng.width / contract.w
    if (candidate >= minF && candidate <= maxF) {
      frameCount = candidate
    }
  } else {
    for (let f = maxF; f >= minF; f--) {
      if (sheetPng.width % f === 0) {
        frameCount = f
        break
      }
    }
  }

  const sliceW = Math.floor(sheetPng.width / frameCount)
  const sliceH = sheetPng.height
  const slices = []

  for (let f = 0; f < frameCount; f++) {
    const startX = f * sliceW
    const curW = f === frameCount - 1 ? sheetPng.width - startX : sliceW
    const slice = new PNG({ width: curW, height: sliceH, colorType: 6 })
    for (let y = 0; y < sliceH; y++) {
      for (let x = 0; x < curW; x++) {
        const srcIdx = (y * sheetPng.width + (startX + x)) * 4
        const dstIdx = (y * curW + x) * 4
        slice.data[dstIdx] = sheetPng.data[srcIdx]
        slice.data[dstIdx + 1] = sheetPng.data[srcIdx + 1]
        slice.data[dstIdx + 2] = sheetPng.data[srcIdx + 2]
        slice.data[dstIdx + 3] = sheetPng.data[srcIdx + 3]
      }
    }
    slices.push(slice)
  }

  return slices
}

/**
 * 정렬된 프레임들을 가로 한 줄 시트 PNG로 합친다.
 */
export function mergeFramesToSheet(alignedFrames, contract) {
  const count = alignedFrames.length
  const minF = contract.minFrames ?? contract.frames
  const maxF = contract.maxFrames ?? contract.frames

  if (count < minF || count > maxF) {
    throw new Error(
      `[${contract.key}] 프레임 수(${count})가 계약 범위(${minF}~${maxF})를 벗어났습니다.`
    )
  }

  const totalW = contract.w * count
  const sheet = new PNG({ width: totalW, height: contract.h, colorType: 6 })
  sheet.data.fill(0)

  for (let f = 0; f < count; f++) {
    const frame = alignedFrames[f]
    const offsetX = f * contract.w
    for (let y = 0; y < contract.h; y++) {
      for (let x = 0; x < contract.w; x++) {
        const srcIdx = (y * contract.w + x) * 4
        const dstIdx = (y * totalW + (offsetX + x)) * 4
        sheet.data[dstIdx] = frame.data[srcIdx]
        sheet.data[dstIdx + 1] = frame.data[srcIdx + 1]
        sheet.data[dstIdx + 2] = frame.data[srcIdx + 2]
        sheet.data[dstIdx + 3] = frame.data[srcIdx + 3]
      }
    }
  }

  return sheet
}

/**
 * art/source/<키>/ 폴더를 읽어 처리하고 public/assets/<키>.png, index.json, art/LEDGER.json을 갱신한다.
 */
export function processAssetKey(key, options = {}) {
  const rootDir = options.rootDir ?? process.cwd()
  const sourceBaseDir = options.sourceDir ?? join(rootDir, 'art', 'source')
  const outAssetsDir = options.outAssetsDir ?? join(rootDir, 'public', 'assets')
  const ledgerPath = options.ledgerPath ?? join(rootDir, 'art', 'LEDGER.json')
  const indexPath = options.indexPath ?? join(outAssetsDir, 'index.json')

  const contracts = options.contracts ?? loadAssetContracts(rootDir)
  const contract = contracts.find((c) => c.key === key)
  if (!contract) {
    throw new Error(`계약 표(src/assets.ts)에 없는 에셋 키입니다: ${key}`)
  }

  const keyDir = join(sourceBaseDir, key)
  if (!existsSync(keyDir)) {
    throw new Error(`원본 폴더가 없습니다: ${keyDir}`)
  }

  const files = readdirSync(keyDir)
  const numberedPngs = files
    .filter((f) => /^\d+\.png$/i.test(f))
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))

  let rawFrames = []
  if (numberedPngs.length > 0) {
    rawFrames = numberedPngs.map((f) => PNG.sync.read(readFileSync(join(keyDir, f))))
  } else if (files.includes('sheet.png')) {
    const sheetPng = PNG.sync.read(readFileSync(join(keyDir, 'sheet.png')))
    rawFrames = splitHorizontalSheet(sheetPng, contract)
  } else {
    throw new Error(`[${key}] 원본 폴더(${keyDir})에 01.png… 또는 sheet.png가 없습니다.`)
  }

  const alignedFrames = rawFrames.map((raw) => {
    const cleaned = removeMagenta(raw, options.tolerance ?? DEFAULT_MAGENTA_TOLERANCE)
    return alignFrameToCanvas(cleaned, contract)
  })

  const sheetPng = mergeFramesToSheet(alignedFrames, contract)

  mkdirSync(outAssetsDir, { recursive: true })
  const outPngPath = join(outAssetsDir, `${key}.png`)
  const buffer = PNG.sync.write(sheetPng, { colorType: 6 })
  writeFileSync(outPngPath, buffer)

  // public/assets/index.json 갱신
  let indexList = []
  if (existsSync(indexPath)) {
    try {
      const parsed = JSON.parse(readFileSync(indexPath, 'utf8'))
      if (Array.isArray(parsed)) indexList = parsed
    } catch {}
  }
  if (!indexList.includes(key)) {
    indexList.push(key)
  }
  writeFileSync(indexPath, `${JSON.stringify(indexList, null, 2)}\n`, 'utf8')

  // meta.json 읽기 (선택)
  let meta = {}
  const metaPath = join(keyDir, 'meta.json')
  if (existsSync(metaPath)) {
    try {
      meta = JSON.parse(readFileSync(metaPath, 'utf8'))
    } catch {}
  }

  const defaultPromptPath = `art/source/${key}/prompt.txt`
  const hasPromptTxt = existsSync(join(keyDir, 'prompt.txt'))
  const today = new Date().toISOString().slice(0, 10)

  const ledgerEntry = {
    id: key,
    file: `public/assets/${key}.png`,
    source: meta.source ?? `art/source/${key}`,
    tool: meta.tool ?? 'gemini-argon',
    prompt: meta.prompt ?? (hasPromptTxt ? defaultPromptPath : 'docs/ART.md#3.2'),
    license: meta.license ?? 'proprietary',
    edited: typeof meta.edited === 'boolean' ? meta.edited : true,
    checked: meta.checked ?? today,
  }

  // art/LEDGER.json 갱신
  let ledgerData = { entries: [] }
  if (existsSync(ledgerPath)) {
    try {
      const parsed = JSON.parse(readFileSync(ledgerPath, 'utf8'))
      if (parsed && Array.isArray(parsed.entries)) {
        ledgerData = parsed
      }
    } catch {}
  }
  const existingIdx = ledgerData.entries.findIndex((e) => e.id === key)
  if (existingIdx >= 0) {
    ledgerData.entries[existingIdx] = ledgerEntry
  } else {
    ledgerData.entries.push(ledgerEntry)
  }
  mkdirSync(resolve(ledgerPath, '..'), { recursive: true })
  writeFileSync(ledgerPath, `${JSON.stringify(ledgerData, null, 2)}\n`, 'utf8')

  return {
    key,
    outPngPath,
    width: sheetPng.width,
    height: sheetPng.height,
    frames: alignedFrames.length,
    ledgerEntry,
  }
}

/**
 * 키를 생략했을 때 art/source/ 아래의 모든 유효한 키 폴더를 처리한다.
 */
export function processAllAssets(options = {}) {
  const rootDir = options.rootDir ?? process.cwd()
  const sourceBaseDir = options.sourceDir ?? join(rootDir, 'art', 'source')
  if (!existsSync(sourceBaseDir)) {
    return []
  }

  const contracts = loadAssetContracts(rootDir)
  const entries = readdirSync(sourceBaseDir)
  const results = []

  for (const name of entries) {
    const fullPath = join(sourceBaseDir, name)
    if (!statSync(fullPath).isDirectory()) continue
    const files = readdirSync(fullPath)
    const hasInput = files.some((f) => /^\d+\.png$/i.test(f) || f === 'sheet.png')
    if (!hasInput) continue

    results.push(processAssetKey(name, { ...options, contracts }))
  }

  return results
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const targetKey = process.argv[2]
  try {
    if (targetKey) {
      const res = processAssetKey(targetKey)
      console.log(`✓ [${res.key}] 변환 완료: ${res.width}×${res.height} (${res.frames}프레임) → ${res.outPngPath}`)
    } else {
      const results = processAllAssets()
      if (results.length === 0) {
        console.log('처리할 에셋 원본이 art/source/에 없습니다.')
      } else {
        for (const res of results) {
          console.log(`✓ [${res.key}] 변환 완료: ${res.width}×${res.height} (${res.frames}프레임) → ${res.outPngPath}`)
        }
      }
    }
  } catch (err) {
    console.error(`✗ 에셋 정리 실패: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }
}
