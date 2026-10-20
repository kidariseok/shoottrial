import { describe, it, expect, beforeAll } from 'vitest'
import { ASSET_CONTRACTS } from '../src/assets'
import {
  BASELINE_Y,
  FIXTURES_DIR,
  ROOT_DIR,
  alignFrameToCanvas,
  checkAssets,
  createSolidCustomPng,
  createTallFeetOverflowPng,
  findBoundingBox,
  generateFixtures,
  getPixel,
  loadAssetContracts,
  processAllAssets,
  processAssetKey,
  readFixturePng,
  readPngFile,
  removeMagenta,
  withTempWorkspace,
} from '../scripts/fixtures/pipeline-harness.mjs'

describe('H-102 에셋 파이프라인 및 계약 검사 (scripts/assets.mjs, scripts/assets-check.mjs)', () => {
  beforeAll(() => {
    generateFixtures(FIXTURES_DIR)
  })

  it('src/assets.ts에서 계약 표 63개 키를 중복·복사 없이 정확히 파싱한다', () => {
    const parsed = loadAssetContracts(ROOT_DIR)
    expect(parsed.length).toBe(ASSET_CONTRACTS.length)
    for (let i = 0; i < ASSET_CONTRACTS.length; i++) {
      const expected = ASSET_CONTRACTS[i]!
      const actual = parsed[i]!
      expect(actual.key).toBe(expected.key)
      expect(actual.w).toBe(expected.w)
      expect(actual.h).toBe(expected.h)
      expect(actual.frames).toBe(expected.frames)
    }
  })

  it('마젠타(#FF00FF ± 허용 오차) 배경과 경계 1px 마젠타 번짐(분홍 테두리)을 투명하게 제거한다', () => {
    const raw = readFixturePng('source/ally_rifle_idle/01.png')
    // 원본에서 (0, 0)은 #FF00FF, (2, 2)는 오차 범위 마젠타 #FA05FA, (9, 7)은 1px 분홍 테두리 #F050F0
    expect(getPixel(raw, 0, 0).a).toBe(255)
    expect(getPixel(raw, 2, 2).a).toBe(255)
    expect(getPixel(raw, 9, 7).a).toBe(255)

    const cleaned = removeMagenta(raw)
    expect(getPixel(cleaned, 0, 0).a).toBe(0)
    expect(getPixel(cleaned, 2, 2).a).toBe(0)
    // 경계 1px 분홍 번짐(#F050F0)도 제거되어야 한다
    expect(getPixel(cleaned, 9, 7).a).toBe(0)
    expect(getPixel(cleaned, 10, 7).a).toBe(0)

    // 캐릭터 본체(x=10..45, y=8..79, 크기 36×72)는 불투명으로 유지되어야 한다
    const bbox = findBoundingBox(cleaned)
    expect(bbox).not.toBeNull()
    expect(bbox!.minX).toBe(10)
    expect(bbox!.minY).toBe(8)
    expect(bbox!.width).toBe(36)
    expect(bbox!.height).toBe(72)
  })

  it('유닛 프레임을 128×128 캔버스에 넣을 때 발끝을 y=116 기준선에, 가로는 중앙에 맞춘다', () => {
    const contracts = loadAssetContracts(ROOT_DIR)
    const rifleContract = contracts.find((c) => c.key === 'ally_rifle_idle')!
    const raw = readFixturePng('source/ally_rifle_idle/01.png')
    const cleaned = removeMagenta(raw)
    const aligned = alignFrameToCanvas(cleaned, rifleContract)

    expect(aligned.width).toBe(128)
    expect(aligned.height).toBe(128)

    const bbox = findBoundingBox(aligned)
    expect(bbox).not.toBeNull()
    // 발끝(가장 아래 불투명 픽셀 maxY)이 정확히 y=116이어야 한다
    expect(bbox!.maxY).toBe(BASELINE_Y)
    expect(bbox!.minY).toBe(BASELINE_Y - 72 + 1)
    // 가로는 (128 - 36) / 2 = 46에서 시작해야 한다
    expect(bbox!.minX).toBe(46)
    expect(bbox!.maxX).toBe(46 + 36 - 1)
  })

  it('내용이 계약 캔버스(또는 발끝 기준선 허용 높이)보다 크면 최근접 축소를 하지 않고 실패한다', () => {
    const contracts = loadAssetContracts(ROOT_DIR)
    const sniperContract = contracts.find((c) => c.key === 'ally_sniper_idle')!

    withTempWorkspace((ws) => {
      expect(() =>
        processAssetKey('ally_sniper_idle', {
          rootDir: ROOT_DIR,
          sourceDir: `${FIXTURES_DIR}/oversize`,
          outAssetsDir: ws.outAssetsDir,
          ledgerPath: ws.ledgerPath,
          indexPath: ws.indexPath,
        })
      ).toThrow(/140×136.*128×128/)
    })

    // 캔버스 높이(128) 이하지만 발끝 기준선(y=116)에 놓으면 위쪽이 잘리는 높이(122px)도 실패해야 한다
    const tallPng = createTallFeetOverflowPng()
    expect(() => alignFrameToCanvas(tallPng, sniperContract)).toThrow(/기준선\(y=116\)/)
  })

  it('전체 변환(processAllAssets) 후 index.json·LEDGER.json이 갱신되고 assets:check를 통과한다', () => {
    withTempWorkspace((ws) => {
      const results = processAllAssets({
        rootDir: ROOT_DIR,
        sourceDir: `${FIXTURES_DIR}/source`,
        outAssetsDir: ws.outAssetsDir,
        ledgerPath: ws.ledgerPath,
        indexPath: ws.indexPath,
      })

      expect(results.length).toBe(2)

      // ally_rifle_idle: 2프레임 → 256×128
      const riflePng = readPngFile(ws.joinPath(ws.outAssetsDir, 'ally_rifle_idle.png'))
      expect(riflePng.width).toBe(256)
      expect(riflePng.height).toBe(128)

      // fx_muzzle: 2프레임(sheet.png 입력, 중앙 피벗) → 64×32
      const muzzlePng = readPngFile(ws.joinPath(ws.outAssetsDir, 'fx_muzzle.png'))
      expect(muzzlePng.width).toBe(64)
      expect(muzzlePng.height).toBe(32)

      const indexJson = ws.readJson(ws.indexPath)
      expect(indexJson).toContain('ally_rifle_idle')
      expect(indexJson).toContain('fx_muzzle')

      const ledgerJson = ws.readJson(ws.ledgerPath)
      expect(ledgerJson.entries.length).toBe(2)

      const checkRes = checkAssets({
        rootDir: ROOT_DIR,
        assetsDir: ws.outAssetsDir,
        indexPath: ws.indexPath,
        ledgerPath: ws.ledgerPath,
      })
      expect(checkRes.ok).toBe(true)
      expect(checkRes.errors).toEqual([])
    })
  })

  it('assets:check가 크기 불일치·알파 채널 누락·장부 누락·계약 외 키를 모두 잡아낸다', () => {
    withTempWorkspace((ws) => {
      // 1) 계약에 없는 키 및 장부에만 있고 파일이 없는 항목
      ws.writeJson(ws.indexPath, ['unknown_key_xyz', 'ally_rifle_idle'])
      ws.writeJson(ws.ledgerPath, {
        entries: [
          {
            id: 'ally_cook_idle',
            file: 'public/assets/ally_cook_idle.png',
            source: 'art/source/ally_cook_idle',
            tool: 'gemini-argon',
            prompt: 'docs/ART.md',
            license: 'proprietary',
            edited: true,
            checked: '2026-10-21',
          },
        ],
      })

      // ally_rifle_idle에 잘못된 크기(100×100) + 알파 채널 없는(colorType=2 RGB) PNG 기록
      ws.writeRawFile(
        ws.joinPath(ws.outAssetsDir, 'ally_rifle_idle.png'),
        createSolidCustomPng(100, 100, 2)
      )

      const res = checkAssets({
        rootDir: ROOT_DIR,
        assetsDir: ws.outAssetsDir,
        indexPath: ws.indexPath,
        ledgerPath: ws.ledgerPath,
      })

      expect(res.ok).toBe(false)
      const joined = res.errors.join('\n')
      expect(joined).toContain('unknown_key_xyz')
      expect(joined).toContain('높이 불일치')
      expect(joined).toContain('배수가 아닙니다')
      expect(joined).toContain('알파 채널이 없습니다')
      expect(joined).toContain('장부 항목이 없습니다')
      expect(joined).toContain('ally_cook_idle')
    })
  })
})
