#!/usr/bin/env node
// H-102 / H-103 에셋 정리 스크립트: 받은편지함(art/inbox) 이관 → 마젠타 제거 → 프레임 자동 분리 → 자동 축소 → 캔버스 정렬 + index.json & LEDGER.json 갱신
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

export const BASELINE_Y = 116
export const UNIT_TARGET_HEIGHT = 96
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
  const templateRows = []
  const staticRows = []
  const rowRegex = /\{\s*key:\s*(`[^`]+`|'[^']+')\s*,\s*w:\s*(\d+)\s*,\s*h:\s*(\d+)\s*,\s*frames:\s*(\d+)/g

  for (const match of content.matchAll(rowRegex)) {
    const rawKey = match[1].slice(1, -1)
    const w = Number(match[2])
    const h = Number(match[3])
    const minFrames = Number(match[4])

    if (rawKey.includes('${c}')) {
      templateRows.push({ rawKey, w, h, minFrames })
    } else {
      staticRows.push({ key: rawKey, w, h, minFrames })
    }
  }

  for (const c of cards) {
    for (const tpl of templateRows) {
      const key = tpl.rawKey.replace('${c}', c)
      contracts.push({
        key,
        w: tpl.w,
        h: tpl.h,
        frames: tpl.minFrames,
        minFrames: tpl.minFrames,
        maxFrames: getMaxFrames(key, tpl.minFrames),
        pivot: getPivotMode(key),
      })
    }
  }

  for (const item of staticRows) {
    contracts.push({
      key: item.key,
      w: item.w,
      h: item.h,
      frames: item.minFrames,
      minFrames: item.minFrames,
      maxFrames: getMaxFrames(item.key, item.minFrames),
      pivot: getPivotMode(item.key),
    })
  }

  return contracts
}

/**
 * 두 문자열 사이의 레벤슈타인 편집 거리를 구한다.
 */
function levenshteinDistance(a, b) {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

/**
 * 계약에 없는 키일 때 가장 비슷한 계약 키 3개를 반환한다.
 */
export function suggestSimilarKeys(unknownKey, contracts, count = 3) {
  const target = unknownKey.toLowerCase()
  return contracts
    .map((c) => {
      const k = c.key.toLowerCase()
      let dist = levenshteinDistance(target, k)
      if (k.includes(target) || target.includes(k)) {
        dist -= 2
      }
      return { key: c.key, dist }
    })
    .sort((a, b) => a.dist - b.dist || a.key.localeCompare(b.key))
    .slice(0, count)
    .map((item) => item.key)
}

/**
 * art/inbox/*.png 파일을 스캔해 계약 키를 확인하고 art/source/<키>/sheet.png로 옮긴다.
 * 기존 sheet.png가 있으면 sheet.prev.png로 백업한다.
 */
export function ingestInbox(options = {}) {
  const rootDir = options.rootDir ?? process.cwd()
  const inboxDir = options.inboxDir ?? join(rootDir, 'art', 'inbox')
  const sourceBaseDir = options.sourceDir ?? join(rootDir, 'art', 'source')
  if (!existsSync(inboxDir)) {
    return []
  }

  const contracts = options.contracts ?? loadAssetContracts(rootDir)
  const contractMap = new Map(contracts.map((c) => [c.key, c]))

  const pngFiles = readdirSync(inboxDir)
    .filter((f) => /\.png$/i.test(f))
    .sort()

  if (pngFiles.length === 0) {
    return []
  }

  // 옮기기 전에 모든 파일 이름이 유효한 계약 키인지 먼저 검증한다.
  for (const file of pngFiles) {
    const key = file.replace(/\.png$/i, '')
    if (options.onlyKey && key !== options.onlyKey) continue
    if (!contractMap.has(key)) {
      const suggestions = suggestSimilarKeys(key, contracts, 3)
      throw new Error(
        `계약 표(src/assets.ts)에 없는 에셋 키입니다: ${key} (가장 비슷한 키: ${suggestions.join(', ')})`
      )
    }
  }

  const movedKeys = []
  for (const file of pngFiles) {
    const key = file.replace(/\.png$/i, '')
    if (options.onlyKey && key !== options.onlyKey) continue

    const srcFile = join(inboxDir, file)
    const keyDir = join(sourceBaseDir, key)
    mkdirSync(keyDir, { recursive: true })

    const destSheet = join(keyDir, 'sheet.png')
    const prevSheet = join(keyDir, 'sheet.prev.png')
    if (existsSync(destSheet)) {
      copyFileSync(destSheet, prevSheet)
    }
    renameSync(srcFile, destSheet)
    movedKeys.push(key)
  }

  return movedKeys
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
 * 투명 배경과 맞닿은 경계 1px의 마젠타 번짐(분홍 테두리)을 제자리에서 정리한다.
 */
export function cleanMagentaFringe1px(png, removedMask = null) {
  const { width, height } = png
  const fringeIndices = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const idx = i * 4
      if (png.data[idx + 3] === 0) continue
      if (removedMask && removedMask[i]) continue

      const r = png.data[idx]
      const g = png.data[idx + 1]
      const b = png.data[idx + 2]
      if (!isMagentaFringePixel(r, g, b)) continue

      let touchesBackground = false
      for (let dy = -1; dy <= 1 && !touchesBackground; dy++) {
        for (let dx = -1; dx <= 1 && !touchesBackground; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
            touchesBackground = true
          } else {
            const ni = ny * width + nx
            if ((removedMask && removedMask[ni]) || png.data[ni * 4 + 3] === 0) {
              touchesBackground = true
            }
          }
        }
      }

      if (touchesBackground) {
        fringeIndices.push(idx)
      }
    }
  }

  for (const idx of fringeIndices) {
    png.data[idx] = 0
    png.data[idx + 1] = 0
    png.data[idx + 2] = 0
    png.data[idx + 3] = 0
  }

  return png
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

  return cleanMagentaFringe1px(out, removedMask)
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
 * PNG에서指定된 경계 상자 영역만 잘라 새 PNG로 반환한다.
 */
function cropPngToBox(png, box) {
  const out = new PNG({ width: box.width, height: box.height, colorType: 6 })
  out.data.fill(0)
  for (let y = 0; y < box.height; y++) {
    for (let x = 0; x < box.width; x++) {
      const srcIdx = ((box.minY + y) * png.width + (box.minX + x)) * 4
      const dstIdx = (y * box.width + x) * 4
      out.data[dstIdx] = png.data[srcIdx]
      out.data[dstIdx + 1] = png.data[srcIdx + 1]
      out.data[dstIdx + 2] = png.data[srcIdx + 2]
      out.data[dstIdx + 3] = png.data[srcIdx + 3]
    }
  }
  return out
}

/**
 * 픽셀풍 유지를 위한 칸 평균(box filter) 축소 함수.
 * - 색: 칸 평균(불투명 픽셀 가중 평균)
 * - 알파: binaryAlpha === true이면 칸 평균이 0.5 이상일 때 255, 아니면 0
 * - cleanFringe === true이면 축소 후 1px 분홍 번짐 정리를 1회 수행
 */
export function scalePngBox(srcPng, dstW, dstH, options = {}) {
  const binaryAlpha = options.binaryAlpha ?? true
  const cleanFringe = options.cleanFringe ?? true
  const forceOpaque = options.forceOpaque ?? false

  const srcW = srcPng.width
  const srcH = srcPng.height
  if (dstW === srcW && dstH === srcH) {
    const copy = new PNG({ width: srcW, height: srcH, colorType: 6 })
    srcPng.data.copy(copy.data)
    return cleanFringe ? cleanMagentaFringe1px(copy) : copy
  }

  const out = new PNG({ width: dstW, height: dstH, colorType: 6 })
  out.data.fill(0)

  for (let dy = 0; dy < dstH; dy++) {
    const sy0 = (dy * srcH) / dstH
    const sy1 = ((dy + 1) * srcH) / dstH
    const iyStart = Math.floor(sy0)
    const iyEnd = Math.min(srcH - 1, Math.ceil(sy1) - 1)

    for (let dx = 0; dx < dstW; dx++) {
      const sx0 = (dx * srcW) / dstW
      const sx1 = ((dx + 1) * srcW) / dstW
      const ixStart = Math.floor(sx0)
      const ixEnd = Math.min(srcW - 1, Math.ceil(sx1) - 1)

      let totalWeight = 0
      let alphaWeightSum = 0
      let rSum = 0
      let gSum = 0
      let bSum = 0
      let colorWeightSum = 0

      for (let iy = iyStart; iy <= iyEnd; iy++) {
        const wy = Math.min(iy + 1, sy1) - Math.max(iy, sy0)
        if (wy <= 0) continue
        const rowOffset = iy * srcW

        for (let ix = ixStart; ix <= ixEnd; ix++) {
          const wx = Math.min(ix + 1, sx1) - Math.max(ix, sx0)
          if (wx <= 0) continue
          const w = wx * wy
          totalWeight += w

          const idx = (rowOffset + ix) * 4
          const r = srcPng.data[idx]
          const g = srcPng.data[idx + 1]
          const b = srcPng.data[idx + 2]
          const a = forceOpaque ? 255 : srcPng.data[idx + 3]

          if (forceOpaque) {
            alphaWeightSum += w
            rSum += r * w
            gSum += g * w
            bSum += b * w
            colorWeightSum += w
          } else {
            const normA = a / 255
            alphaWeightSum += normA * w
            if (a > 0) {
              const cw = normA * w
              rSum += r * cw
              gSum += g * cw
              bSum += b * cw
              colorWeightSum += cw
            }
          }
        }
      }

      const dstIdx = (dy * dstW + dx) * 4
      if (totalWeight <= 0) continue

      const meanAlpha = alphaWeightSum / totalWeight
      if (forceOpaque) {
        out.data[dstIdx] = Math.round(rSum / colorWeightSum)
        out.data[dstIdx + 1] = Math.round(gSum / colorWeightSum)
        out.data[dstIdx + 2] = Math.round(bSum / colorWeightSum)
        out.data[dstIdx + 3] = 255
      } else if (binaryAlpha) {
        if (meanAlpha >= 0.5 && colorWeightSum > 0) {
          out.data[dstIdx] = Math.round(rSum / colorWeightSum)
          out.data[dstIdx + 1] = Math.round(gSum / colorWeightSum)
          out.data[dstIdx + 2] = Math.round(bSum / colorWeightSum)
          out.data[dstIdx + 3] = 255
        }
      } else if (colorWeightSum > 0) {
        out.data[dstIdx] = Math.round(rSum / colorWeightSum)
        out.data[dstIdx + 1] = Math.round(gSum / colorWeightSum)
        out.data[dstIdx + 2] = Math.round(bSum / colorWeightSum)
        out.data[dstIdx + 3] = Math.round(meanAlpha * 255)
      }
    }
  }

  return cleanFringe ? cleanMagentaFringe1px(out) : out
}

/**
 * 배경(bg_*) 전용: 마젠타를 지우지 않고 계약 크기(720×1560)를 꽉 채우도록(cover) 축소한 뒤 가운데 기준으로 자른다.
 */
export function coverResizeBackground(srcPng, contract) {
  const targetW = contract.w
  const targetH = contract.h
  const scale = Math.min(1, Math.max(targetW / srcPng.width, targetH / srcPng.height))

  // 원본이 이미 목표보다 작거나 같으면 cover 비율로 중앙 크롭 후 계약 크기에 맞춘다.
  const effectiveScale = Math.max(targetW / srcPng.width, targetH / srcPng.height)
  const scaledW = Math.max(targetW, Math.round(srcPng.width * effectiveScale))
  const scaledH = Math.max(targetH, Math.round(srcPng.height * effectiveScale))

  const scaledPng = scalePngBox(srcPng, scaledW, scaledH, {
    binaryAlpha: false,
    cleanFringe: false,
    forceOpaque: true,
  })

  const cropX = Math.floor((scaledW - targetW) / 2)
  const cropY = Math.floor((scaledH - targetH) / 2)
  const cropped = cropPngToBox(scaledPng, {
    minX: cropX,
    minY: cropY,
    width: targetW,
    height: targetH,
  })

  return {
    sheetPng: cropped,
    scale: effectiveScale <= 1 ? effectiveScale : scale,
    scaleRefKey: null,
  }
}

/**
 * 마젠타가 제거된 시트 PNG에서 세로 투명 열 및 덩어리 기준으로 프레임을 자동 분리한다 (H-103 §2).
 * - 간격이 4px 미만인 덩어리는 하나로 합친다 (총구와 몸이 떨어진 경우 등)
 * - 가장 큰 덩어리 면적의 3% 미만인 조각은 버린다 (남은 글자, 반짝이)
 * - 덩어리 수가 계약 허용 프레임 범위 밖이면 찾은 수와 각 덩어리의 x 범위를 출력하고 실패한다.
 */
export function splitSheetByChunks(cleanedPng, contract) {
  const { width: w, height: h } = cleanedPng
  const visited = new Uint8Array(w * h)
  const components = []

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (visited[i] || cleanedPng.data[i * 4 + 3] === 0) continue

      const queue = [i]
      visited[i] = 1
      let minX = x
      let maxX = x
      let minY = y
      let maxY = y
      const pixels = []

      while (queue.length > 0) {
        const cur = queue.pop()
        pixels.push(cur)
        const cx = cur % w
        const cy = Math.floor(cur / w)
        if (cx < minX) minX = cx
        if (cx > maxX) maxX = cx
        if (cy < minY) minY = cy
        if (cy > maxY) maxY = cy

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const nx = cx + dx
            const ny = cy + dy
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const ni = ny * w + nx
              if (!visited[ni] && cleanedPng.data[ni * 4 + 3] > 0) {
                visited[ni] = 1
                queue.push(ni)
              }
            }
          }
        }
      }

      components.push({
        startX: minX,
        endX: maxX,
        minY,
        maxY,
        area: pixels.length,
        pixels,
      })
    }
  }

  components.sort((a, b) => a.startX - b.startX || a.endX - b.endX)
  const maxCompArea = Math.max(0, ...components.map((c) => c.area))

  // 가로 간격 4px 미만 덩어리 병합 (단, 이미 온전한 두 캐릭터 몸통이 나란히 놓인 경우는 합치지 않는다)
  const merged = []
  for (const comp of components) {
    if (merged.length > 0) {
      const prev = merged[merged.length - 1]
      const gapX = comp.startX - prev.endX - 1
      const gapY = Math.max(0, Math.max(prev.minY, comp.minY) - Math.min(prev.maxY, comp.maxY) - 1)
      const prevW = prev.endX - prev.startX + 1
      const compW = comp.endX - comp.startX + 1
      const overlapX = Math.max(0, Math.min(prev.endX, comp.endX) - Math.max(prev.startX, comp.startX) + 1)

      const isTinyDetachedNoise = Math.min(prev.area, comp.area) < maxCompArea * 0.03 && gapY >= 4
      const areTwoFullBodies =
        prev.area >= maxCompArea * 0.45 &&
        comp.area >= maxCompArea * 0.45 &&
        prevW >= 40 &&
        compW >= 40 &&
        overlapX < Math.min(prevW, compW) * 0.25

      if (gapX < 4 && !isTinyDetachedNoise && !areTwoFullBodies) {
        prev.startX = Math.min(prev.startX, comp.startX)
        prev.endX = Math.max(prev.endX, comp.endX)
        prev.minY = Math.min(prev.minY, comp.minY)
        prev.maxY = Math.max(prev.maxY, comp.maxY)
        prev.area += comp.area
        for (const p of comp.pixels) {
          prev.pixels.push(p)
        }
        continue
      }
    }
    merged.push({
      startX: comp.startX,
      endX: comp.endX,
      minY: comp.minY,
      maxY: comp.maxY,
      area: comp.area,
      pixels: [...comp.pixels],
    })
  }

  // 가장 큰 덩어리 면적의 3% 미만인 조각 제거
  const maxChunkArea = Math.max(0, ...merged.map((c) => c.area))
  const validChunks = merged.filter((c) => c.area >= maxChunkArea * 0.03)

  const minF = contract.minFrames ?? contract.frames
  const maxF = contract.maxFrames ?? contract.frames

  if (validChunks.length < minF || validChunks.length > maxF) {
    const rangesStr = validChunks.map((c) => `${c.startX}..${c.endX}`).join(', ')
    throw new Error(
      `[${contract.key}] 찾은 덩어리 수(${validChunks.length}덩어리)가 허용 프레임 범위(${minF}~${maxF})를 벗어났습니다. 각 덩어리 x 범위: [${rangesStr}]`
    )
  }

  // 각 덩어리를 독립된 프레임 PNG로 추출
  return validChunks.map((chunk) => {
    const sliceW = chunk.endX - chunk.startX + 1
    const slice = new PNG({ width: sliceW, height: h, colorType: 6 })
    slice.data.fill(0)
    for (const p of chunk.pixels) {
      const sx = p % w
      const sy = Math.floor(p / w)
      const dx = sx - chunk.startX
      const srcIdx = p * 4
      const dstIdx = (sy * sliceW + dx) * 4
      slice.data[dstIdx] = cleanedPng.data[srcIdx]
      slice.data[dstIdx + 1] = cleanedPng.data[srcIdx + 1]
      slice.data[dstIdx + 2] = cleanedPng.data[srcIdx + 2]
      slice.data[dstIdx + 3] = cleanedPng.data[srcIdx + 3]
    }
    return slice
  })
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
 * 유닛 키(ally_*, enemy_*)의 캐릭터 접두사와 기준 키 여부를 반환한다.
 */
function getUnitScaleInfo(key, ledgerEntries) {
  const isUnit = /^(ally|enemy)_/.test(key)
  if (!isUnit) {
    return { isUnit: false, isBaseKey: false, prefix: null, refEntry: null }
  }
  const isBaseKey = /_(idle|walk|run)$/.test(key)
  const prefix = key.replace(/_[^_]+$/, '')
  if (isBaseKey) {
    return { isUnit: true, isBaseKey: true, prefix, refEntry: null }
  }
  const refCandidates = [`${prefix}_idle`, `${prefix}_walk`, `${prefix}_run`]
  const refEntry =
    ledgerEntries.find((e) => refCandidates.includes(e.id) && typeof e.scale === 'number' && e.scale > 0) ?? null
  return { isUnit: true, isBaseKey: false, prefix, refEntry }
}

/**
 * 키 종류에 따라 모든 프레임을 한 배율로 자동 축소한다 (H-103 §3).
 * 확대는 하지 않는다 (scale <= 1).
 */
export function fitFramesToContract(cleanedFrames, contract, ledgerEntries = []) {
  const croppedFrames = cleanedFrames.map((frame) => {
    const bbox = findBoundingBox(frame)
    if (!bbox) {
      throw new Error(`[${contract.key}] 프레임에 불투명 픽셀이 없습니다.`)
    }
    return cropPngToBox(frame, bbox)
  })

  const maxW = Math.max(...croppedFrames.map((f) => f.width))
  const maxH = Math.max(...croppedFrames.map((f) => f.height))

  let scale = 1
  let scaleRefKey = null

  const unitInfo = getUnitScaleInfo(contract.key, ledgerEntries)
  if (unitInfo.isUnit) {
    if (unitInfo.refEntry) {
      scale = unitInfo.refEntry.scale
      scaleRefKey = unitInfo.refEntry.id
    } else {
      scale = Math.min(1, UNIT_TARGET_HEIGHT / maxH)
    }
    // 가로 폭이나 발끝 기준선 높이를 넘지 않도록 안전 상한 적용
    const maxAllowedH = BASELINE_Y + 1
    if (Math.round(maxW * scale) > contract.w) {
      scale = Math.min(scale, contract.w / maxW)
    }
    if (Math.round(maxH * scale) > maxAllowedH) {
      scale = Math.min(scale, maxAllowedH / maxH)
    }
  } else if (/^card_/.test(contract.key)) {
    scale = Math.min(1, 240 / maxW, 300 / maxH)
  } else if (/^(boss_|fx_|mine)/.test(contract.key)) {
    scale = Math.min(1, (contract.w * 0.9) / maxW, (contract.h * 0.9) / maxH)
  } else {
    scale = Math.min(1, contract.w / maxW, contract.h / maxH)
  }

  if (scale > 1) {
    scale = 1
  }

  const fittedFrames = croppedFrames.map((cropped) => {
    if (scale >= 1) {
      return cropped
    }
    const dstW = Math.max(1, Math.round(cropped.width * scale))
    const dstH = Math.max(1, Math.round(cropped.height * scale))
    return scalePngBox(cropped, dstW, dstH, { binaryAlpha: true, cleanFringe: true })
  })

  return {
    frames: fittedFrames,
    scale,
    scaleRefKey,
  }
}

/**
 * 가로 한 줄 시트(sheet.png)를 균등 분할한다 (meta.json "split": "even" 전용).
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
 * 결과 출력용 한 줄 요약을 만든다.
 * 예: ✓ ally_rifle_attack 3프레임, 배율 0.142(ally_rifle_idle 기준), 384×128
 */
export function formatAssetResultLine(res) {
  const scaleStr = res.scale === 1 ? '1' : res.scale.toFixed(3)
  const refStr = res.scaleRefKey ? `(${res.scaleRefKey} 기준)` : ''
  return `✓ ${res.key} ${res.frames}프레임, 배율 ${scaleStr}${refStr}, ${res.width}×${res.height}`
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

  // 받은편지함(art/inbox/<key>.png)에 해당 파일이 있으면 먼저 옮긴다.
  if (!options.skipInbox) {
    ingestInbox({ ...options, contracts, onlyKey: key })
  }

  const contract = contracts.find((c) => c.key === key)
  if (!contract) {
    const suggestions = suggestSimilarKeys(key, contracts, 3)
    throw new Error(
      `계약 표(src/assets.ts)에 없는 에셋 키입니다: ${key} (가장 비슷한 키: ${suggestions.join(', ')})`
    )
  }

  const keyDir = join(sourceBaseDir, key)
  if (!existsSync(keyDir)) {
    throw new Error(`원본 폴더가 없습니다: ${keyDir}`)
  }

  // meta.json 읽기 (선택)
  let meta = {}
  const metaPath = join(keyDir, 'meta.json')
  if (existsSync(metaPath)) {
    try {
      meta = JSON.parse(readFileSync(metaPath, 'utf8'))
    } catch {}
  }

  // 기존 LEDGER.json 읽기 (배율 공유 참조용)
  let ledgerData = { entries: [] }
  if (existsSync(ledgerPath)) {
    try {
      const parsed = JSON.parse(readFileSync(ledgerPath, 'utf8'))
      if (parsed && Array.isArray(parsed.entries)) {
        ledgerData = parsed
      }
    } catch {}
  }

  const files = readdirSync(keyDir)
  const numberedPngs = files
    .filter((f) => /^\d+\.png$/i.test(f))
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))

  const tolerance = options.tolerance ?? DEFAULT_MAGENTA_TOLERANCE
  const isBackground = /^bg_/.test(key)

  let sheetPng
  let frameCount = 1
  let scale = 1
  let scaleRefKey = null

  if (isBackground) {
    let rawBgPng
    if (files.includes('sheet.png')) {
      rawBgPng = PNG.sync.read(readFileSync(join(keyDir, 'sheet.png')))
    } else if (numberedPngs.length > 0) {
      rawBgPng = PNG.sync.read(readFileSync(join(keyDir, numberedPngs[0])))
    } else {
      throw new Error(`[${key}] 원본 폴더(${keyDir})에 sheet.png 또는 01.png가 없습니다.`)
    }
    const bgRes = coverResizeBackground(rawBgPng, contract)
    sheetPng = bgRes.sheetPng
    scale = bgRes.scale
    scaleRefKey = bgRes.scaleRefKey
    frameCount = 1
  } else {
    let cleanedFrames = []
    if (files.includes('sheet.png')) {
      const rawSheet = PNG.sync.read(readFileSync(join(keyDir, 'sheet.png')))
      if (meta.split === 'even') {
        const slices = splitHorizontalSheet(rawSheet, contract)
        cleanedFrames = slices.map((s) => removeMagenta(s, tolerance))
      } else {
        const cleanedSheet = removeMagenta(rawSheet, tolerance)
        cleanedFrames = splitSheetByChunks(cleanedSheet, contract)
      }
    } else if (numberedPngs.length > 0) {
      const rawFrames = numberedPngs.map((f) => PNG.sync.read(readFileSync(join(keyDir, f))))
      cleanedFrames = rawFrames.map((raw) => removeMagenta(raw, tolerance))
    } else {
      throw new Error(`[${key}] 원본 폴더(${keyDir})에 01.png… 또는 sheet.png가 없습니다.`)
    }

    let framesToAlign = cleanedFrames
    if (meta.fit !== false) {
      const fitted = fitFramesToContract(cleanedFrames, contract, ledgerData.entries)
      framesToAlign = fitted.frames
      scale = fitted.scale
      scaleRefKey = fitted.scaleRefKey
    }

    const alignedFrames = framesToAlign.map((frame) => alignFrameToCanvas(frame, contract))
    sheetPng = mergeFramesToSheet(alignedFrames, contract)
    frameCount = alignedFrames.length
  }

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
    scale: Number(scale.toFixed(6)),
  }

  const existingIdx = ledgerData.entries.findIndex((e) => e.id === key)
  if (existingIdx >= 0) {
    ledgerData.entries[existingIdx] = ledgerEntry
  } else {
    ledgerData.entries.push(ledgerEntry)
  }
  mkdirSync(resolve(ledgerPath, '..'), { recursive: true })
  writeFileSync(ledgerPath, `${JSON.stringify(ledgerData, null, 2)}\n`, 'utf8')

  const result = {
    key,
    outPngPath,
    width: sheetPng.width,
    height: sheetPng.height,
    frames: frameCount,
    scale,
    scaleRefKey,
    ledgerEntry,
  }
  result.summary = formatAssetResultLine(result)
  return result
}

/**
 * 키를 생략했을 때 art/inbox/*.png를 먼저 옮기고 art/source/ 아래의 모든 유효한 키 폴더를 처리한다.
 * 기준 키(_idle, _walk, _run)가 먼저 처리되도록 계약 순서대로 정렬한다.
 */
export function processAllAssets(options = {}) {
  const rootDir = options.rootDir ?? process.cwd()
  const sourceBaseDir = options.sourceDir ?? join(rootDir, 'art', 'source')
  const contracts = options.contracts ?? loadAssetContracts(rootDir)

  ingestInbox({ ...options, contracts })

  if (!existsSync(sourceBaseDir)) {
    return []
  }

  const contractOrder = new Map(contracts.map((c, idx) => [c.key, idx]))
  const entries = readdirSync(sourceBaseDir).sort((a, b) => {
    const ia = contractOrder.get(a) ?? 9999
    const ib = contractOrder.get(b) ?? 9999
    return ia - ib || a.localeCompare(b)
  })

  const results = []
  for (const name of entries) {
    const fullPath = join(sourceBaseDir, name)
    if (!statSync(fullPath).isDirectory()) continue
    const files = readdirSync(fullPath)
    const hasInput = files.some((f) => /^\d+\.png$/i.test(f) || f === 'sheet.png')
    if (!hasInput) continue

    results.push(processAssetKey(name, { ...options, contracts, skipInbox: true }))
  }

  return results
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const targetKey = process.argv[2]
  try {
    if (targetKey) {
      const res = processAssetKey(targetKey)
      console.log(res.summary)
    } else {
      const results = processAllAssets()
      if (results.length === 0) {
        console.log('처리할 에셋 원본이 art/inbox/ 또는 art/source/에 없습니다.')
      } else {
        for (const res of results) {
          console.log(res.summary)
        }
      }
    }
  } catch (err) {
    console.error(`✗ 에셋 정리 실패: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }
}
