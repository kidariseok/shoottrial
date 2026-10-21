#!/usr/bin/env node
// H-102 에셋 계약·장부 검사 스크립트 (npm run assets:check)
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'
import { loadAssetContracts } from './assets.mjs'

const REQUIRED_LEDGER_FIELDS = ['id', 'file', 'source', 'tool', 'prompt', 'license', 'edited', 'checked']

/**
 * PNG 버퍼에서 IHDR colorType(오프셋 25)과 디코딩된 이미지 정보를 읽는다.
 * colorType 4(Grayscale+Alpha) 또는 6(RGBA)이면 알파 채널이 있는 것으로 판정한다.
 */
function inspectPngBuffer(buf) {
  // PNG 시그니처(8바이트) + IHDR 길이(4) + 'IHDR'(4) + width(4) + height(4) + bitDepth(1) + colorType(1) => index 25
  const colorType = buf.length > 25 ? buf[25] : -1
  const hasAlphaChannel = colorType === 4 || colorType === 6
  const png = PNG.sync.read(buf)
  return {
    width: png.width,
    height: png.height,
    colorType,
    hasAlphaChannel,
  }
}

/**
 * public/assets/index.json, public/assets/*.png, art/LEDGER.json, src/assets.ts를 대조 검사한다.
 */
export function checkAssets(options = {}) {
  const rootDir = options.rootDir ?? process.cwd()
  const assetsDir = options.assetsDir ?? join(rootDir, 'public', 'assets')
  const indexPath = options.indexPath ?? join(assetsDir, 'index.json')
  const ledgerPath = options.ledgerPath ?? join(rootDir, 'art', 'LEDGER.json')

  const errors = []
  const contracts = options.contracts ?? loadAssetContracts(rootDir)
  const contractMap = new Map(contracts.map((c) => [c.key, c]))

  // 1. index.json 읽기
  let indexKeys = []
  if (!existsSync(indexPath)) {
    errors.push(`index.json 파일이 없습니다: ${indexPath}`)
  } else {
    try {
      const parsed = JSON.parse(readFileSync(indexPath, 'utf8'))
      if (!Array.isArray(parsed)) {
        errors.push(`index.json은 배열이어야 합니다: ${indexPath}`)
      } else {
        indexKeys = parsed
      }
    } catch (e) {
      errors.push(`index.json JSON 파싱 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // 2. art/LEDGER.json 읽기
  let ledgerEntries = []
  if (!existsSync(ledgerPath)) {
    errors.push(`LEDGER.json 파일이 없습니다: ${ledgerPath}`)
  } else {
    try {
      const parsed = JSON.parse(readFileSync(ledgerPath, 'utf8'))
      if (!parsed || !Array.isArray(parsed.entries)) {
        errors.push(`LEDGER.json에 entries 배열이 없습니다: ${ledgerPath}`)
      } else {
        ledgerEntries = parsed.entries
      }
    } catch (e) {
      errors.push(`LEDGER.json JSON 파싱 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const ledgerMap = new Map()
  for (const entry of ledgerEntries) {
    if (!entry || typeof entry.id !== 'string') {
      errors.push('LEDGER.json에 id가 없는 항목이 있습니다.')
      continue
    }
    if (ledgerMap.has(entry.id)) {
      errors.push(`LEDGER.json에 중복된 id가 있습니다: ${entry.id}`)
    }
    ledgerMap.set(entry.id, entry)
  }

  const indexSet = new Set()
  for (const key of indexKeys) {
    if (indexSet.has(key)) {
      errors.push(`index.json에 중복된 키가 있습니다: ${key}`)
    }
    indexSet.add(key)

    const contract = contractMap.get(key)
    if (!contract) {
      errors.push(`[${key}] 계약 표(src/assets.ts)에 없는 키가 index.json에 있습니다.`)
      continue
    }

    const pngPath = join(assetsDir, `${key}.png`)
    if (!existsSync(pngPath)) {
      errors.push(`[${key}] index.json에 등록되어 있으나 PNG 파일이 없습니다: ${pngPath}`)
    } else {
      try {
        const buf = readFileSync(pngPath)
        const info = inspectPngBuffer(buf)

        if (info.height !== contract.h) {
          errors.push(`[${key}] 높이 불일치: 기대 ${contract.h}px, 실제 ${info.height}px`)
        }

        const minF = contract.minFrames ?? contract.frames
        const maxF = contract.maxFrames ?? contract.frames
        if (info.width % contract.w !== 0) {
          errors.push(`[${key}] 너비(${info.width}px)가 계약 캔버스 너비(${contract.w}px)의 배수가 아닙니다.`)
        } else {
          const frameCount = info.width / contract.w
          if (frameCount < minF || frameCount > maxF) {
            errors.push(
              `[${key}] 프레임 수(${frameCount})가 계약 범위(${minF}~${maxF}, 기대 너비 ${contract.w * minF}~${contract.w * maxF}px, 실제 ${info.width}px)를 벗어났습니다.`
            )
          }
        }

        if (!info.hasAlphaChannel) {
          errors.push(`[${key}] PNG 알파 채널이 없습니다 (colorType=${info.colorType}, RGBA/GA 필요).`)
        }
      } catch (e) {
        errors.push(`[${key}] PNG 읽기 실패: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    const ledgerEntry = ledgerMap.get(key)
    if (!ledgerEntry) {
      errors.push(`[${key}] index.json에 있으나 art/LEDGER.json 장부 항목이 없습니다.`)
    } else {
      for (const field of REQUIRED_LEDGER_FIELDS) {
        if (ledgerEntry[field] === undefined || ledgerEntry[field] === null || ledgerEntry[field] === '') {
          errors.push(`[${key}] art/LEDGER.json 항목에 필수 필드 '${field}'가 비어 있습니다.`)
        }
      }
    }
  }

  // 3. 장부에만 있고 파일 또는 index.json에 없는 항목 / 계약에 없는 키 검사
  for (const [id, entry] of ledgerMap.entries()) {
    if (!contractMap.has(id)) {
      errors.push(`[${id}] 계약 표(src/assets.ts)에 없는 키가 art/LEDGER.json에 있습니다.`)
    }
    const pngPath = join(assetsDir, `${id}.png`)
    if (!existsSync(pngPath)) {
      errors.push(`[${id}] art/LEDGER.json 장부에만 있고 PNG 파일이 없습니다: ${pngPath}`)
    }
    if (!indexSet.has(id)) {
      errors.push(`[${id}] art/LEDGER.json 장부에만 있고 index.json에 등록되지 않았습니다.`)
    }
    if (entry.file && entry.file !== `public/assets/${id}.png`) {
      errors.push(`[${id}] art/LEDGER.json의 file 경로(${entry.file})가 'public/assets/${id}.png'와 다릅니다.`)
    }
  }

  return {
    ok: errors.length === 0,
    checkedCount: indexKeys.length,
    errors,
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkAssets()
  if (!result.ok) {
    console.error(`✗ assets:check 실패 (${result.errors.length}건):`)
    for (const err of result.errors) {
      console.error(`  - ${err}`)
    }
    process.exit(1)
  }
  console.log(`✓ assets:check 통과 (검사한 에셋 키: ${result.checkedCount}개)`)
}
