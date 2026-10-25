import { describe, it, expect, beforeAll } from 'vitest'
import { ASSET_CONTRACTS } from '../src/assets'
import {
  BASELINE_Y,
  FIXTURES_DIR,
  ROOT_DIR,
  UNIT_TARGET_HEIGHT,
  alignFrameToCanvas,
  checkAssets,
  createFiveChunkSheet,
  createIrregularThreeSoldierSheet,
  createMagentaBackgroundFixture,
  createSolidCustomPng,
  createTallFeetOverflowPng,
  createTwoSoldierIdleSheet,
  findBoundingBox,
  generateFixtures,
  getPixel,
  loadAssetContracts,
  mergeFramesToSheet,
  processAllAssets,
  processAssetKey,
  readFixturePng,
  readPngFile,
  removeMagenta,
  sliceSheetFrame,
  splitSheetByChunks,
  withTempWorkspace,
} from '../scripts/fixtures/pipeline-harness.mjs'

describe('H-102 에셋 파이프라인 및 계약 검사 (scripts/assets.mjs, scripts/assets-check.mjs)', () => {
  beforeAll(() => {
    generateFixtures(FIXTURES_DIR)
  })

  it('src/assets.ts에서 계약 표 101개 키를 중복·복사 없이 정확히 파싱한다', () => {
    const parsed = loadAssetContracts(ROOT_DIR)
    expect(parsed.length).toBe(ASSET_CONTRACTS.length)
    for (let i = 0; i < ASSET_CONTRACTS.length; i++) {
      const expected = ASSET_CONTRACTS[i]!
      const actual = parsed[i]!
      expect(actual.key).toBe(expected.key)
      expect(actual.w).toBe(expected.w)
      expect(actual.h).toBe(expected.h)
      expect(actual.frames).toBe(expected.frames)
      expect(actual.maxFrames).toBe(expected.maxFrames)
    }
  })

  it('마젠타(#FF00FF ± 허용 오차) 배경과 경계 1px 마젠타 번짐(분홍 테두리)을 투명하게 제거한다', () => {
    const raw = readFixturePng('source/ally_rifle_idle/01.png')
    expect(getPixel(raw, 0, 0).a).toBe(255)
    expect(getPixel(raw, 2, 2).a).toBe(255)
    expect(getPixel(raw, 9, 7).a).toBe(255)

    const cleaned = removeMagenta(raw)
    expect(getPixel(cleaned, 0, 0).a).toBe(0)
    expect(getPixel(cleaned, 2, 2).a).toBe(0)
    expect(getPixel(cleaned, 9, 7).a).toBe(0)
    expect(getPixel(cleaned, 10, 7).a).toBe(0)

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
    expect(bbox!.maxY).toBe(BASELINE_Y)
    expect(bbox!.minY).toBe(BASELINE_Y - 72 + 1)
    expect(bbox!.minX).toBe(46)
    expect(bbox!.maxX).toBe(46 + 36 - 1)
  })

  it('meta.json의 "fit": false일 때 내용이 계약 캔버스를 초과하면 축소하지 않고 실패한다', () => {
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

    const tallPng = createTallFeetOverflowPng()
    expect(() => alignFrameToCanvas(tallPng, sniperContract)).toThrow(/기준선\(y=116\)/)
  })

  it('전체 변환(processAllAssets) 후 index.json·LEDGER.json이 갱신되고 assets:check를 통과한다', () => {
    withTempWorkspace((ws) => {
      // 최소 프레임 계약에 맞춘 테스트 원본을 임시 작업 폴더에만 만든다.
      ws.writePng(ws.joinPath(ws.inboxDir, 'ally_rifle_idle.png'), createTwoSoldierIdleSheet())
      ws.writePng(ws.joinPath(ws.inboxDir, 'ally_rifle_attack.png'), createIrregularThreeSoldierSheet())
      ws.writePng(ws.joinPath(ws.inboxDir, 'fx_muzzle.png'), readFixturePng('source/fx_muzzle/sheet.png'))
      ws.writeJson(ws.joinPath(ws.inboxDir, 'fx_muzzle.json'), { split: 'even' })
      const results = processAllAssets({
        rootDir: ROOT_DIR, inboxDir: ws.inboxDir, sourceDir: ws.sourceDir,
        outAssetsDir: ws.outAssetsDir, ledgerPath: ws.ledgerPath, indexPath: ws.indexPath,
      })

      expect(results.length).toBe(3)

      const riflePng = readPngFile(ws.joinPath(ws.outAssetsDir, 'ally_rifle_idle.png'))
      expect(riflePng.width).toBe(256)
      expect(riflePng.height).toBe(128)

      const attackPng = readPngFile(ws.joinPath(ws.outAssetsDir, 'ally_rifle_attack.png'))
      expect(attackPng.width).toBe(384)
      expect(attackPng.height).toBe(128)

      const muzzlePng = readPngFile(ws.joinPath(ws.outAssetsDir, 'fx_muzzle.png'))
      expect(muzzlePng.width).toBe(64)
      expect(muzzlePng.height).toBe(32)

      const indexJson = ws.readJson(ws.indexPath)
      expect(indexJson).toContain('ally_rifle_idle')
      expect(indexJson).toContain('ally_rifle_attack')
      expect(indexJson).toContain('fx_muzzle')

      const ledgerJson = ws.readJson(ws.ledgerPath)
      expect(ledgerJson.entries.length).toBe(3)

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

describe('H-103 에셋 받은편지함: 자동 분리 및 자동 축소 5종 테스트', () => {
  it('1) 600×300 마젠타 위에 높이가 다른 사람 모양 3개, 사이 간격 불규칙, 작은 글자 조각 1개 → 3프레임으로 나뉘고 조각은 버려진다', () => {
    const contracts = loadAssetContracts(ROOT_DIR)
    const attackContract = contracts.find((c) => c.key === 'ally_sniper_attack')!
    const sheet = createIrregularThreeSoldierSheet([180, 240, 200])
    expect(sheet.width).toBe(600)
    expect(sheet.height).toBe(300)

    const cleaned = removeMagenta(sheet)
    const frames = splitSheetByChunks(cleaned, attackContract)
    expect(frames.length).toBe(3)

    const boxes = frames.map((f) => findBoundingBox(f)!)
    expect(boxes[0]!.height).toBe(180)
    expect(boxes[1]!.height).toBe(240)
    // 2번째 사람의 2px(<4px) 떨어진 총구 조각(폭 8)까지 하나로 합쳐져 폭이 80 + 2 + 8 = 90이어야 한다
    expect(boxes[1]!.width).toBe(90)
    expect(boxes[2]!.height).toBe(200)
  })

  it('2) 자동 축소 후 가장 큰 프레임의 내용 높이가 96±1이고 모든 프레임의 발끝이 y=116에 정렬된다', () => {
    withTempWorkspace((ws) => {
      const sheet = createIrregularThreeSoldierSheet([180, 240, 200])
      ws.writePng(ws.joinPath(ws.inboxDir, 'ally_sniper_attack.png'), sheet)

      const res = processAssetKey('ally_sniper_attack', {
        rootDir: ROOT_DIR,
        inboxDir: ws.inboxDir,
        sourceDir: ws.sourceDir,
        outAssetsDir: ws.outAssetsDir,
        ledgerPath: ws.ledgerPath,
        indexPath: ws.indexPath,
      })

      expect(res.frames).toBe(3)
      expect(res.width).toBe(384)
      expect(res.height).toBe(128)
      // art/inbox/ally_sniper_attack.png가 art/source/ally_sniper_attack/sheet.png로 옮겨졌는지 확인
      expect(ws.exists(ws.joinPath(ws.inboxDir, 'ally_sniper_attack.png'))).toBe(false)
      expect(ws.exists(ws.joinPath(ws.sourceDir, 'ally_sniper_attack', 'sheet.png'))).toBe(true)

      const outSheet = readPngFile(res.outPngPath)
      const frameHeights: number[] = []
      for (let i = 0; i < 3; i++) {
        const framePng = sliceSheetFrame(outSheet, i, 128)
        const bbox = findBoundingBox(framePng)
        expect(bbox).not.toBeNull()
        expect(bbox!.maxY).toBe(BASELINE_Y)
        frameHeights.push(bbox!.height)
      }

      const maxFrameH = Math.max(...frameHeights)
      expect(Math.abs(maxFrameH - UNIT_TARGET_HEIGHT)).toBeLessThanOrEqual(1)
    })
  })

  it('3) 같은 캐릭터의 _idle 배율을 _attack이 이어 쓰며 한 줄 요약에 기준 키가 표시된다', () => {
    withTempWorkspace((ws) => {
      // ally_cook_idle: 최대 높이 240px → 배율 = 96 / 240 = 0.4
      const idleSheet = createTwoSoldierIdleSheet([220, 240])
      // ally_cook_attack: 최대 높이 200px (단독이면 96/200=0.48이지만 _idle의 0.4 배율을 이어 써서 높이 80px이 되어야 함)
      const attackSheet = createIrregularThreeSoldierSheet([160, 200, 180])

      ws.writePng(ws.joinPath(ws.inboxDir, 'ally_cook_idle.png'), idleSheet)
      ws.writePng(ws.joinPath(ws.inboxDir, 'ally_cook_attack.png'), attackSheet)

      const results = processAllAssets({
        rootDir: ROOT_DIR,
        inboxDir: ws.inboxDir,
        sourceDir: ws.sourceDir,
        outAssetsDir: ws.outAssetsDir,
        ledgerPath: ws.ledgerPath,
        indexPath: ws.indexPath,
      })

      expect(results.length).toBe(2)
      const idleRes = results.find((r) => r.key === 'ally_cook_idle')!
      const attackRes = results.find((r) => r.key === 'ally_cook_attack')!

      expect(idleRes.scale).toBeCloseTo(96 / 240, 4)
      expect(idleRes.scaleRefKey).toBeNull()

      expect(attackRes.scale).toBeCloseTo(idleRes.scale, 4)
      expect(attackRes.scaleRefKey).toBe('ally_cook_idle')
      expect(attackRes.summary).toContain('✓ ally_cook_attack 3프레임, 배율 0.400(ally_cook_idle 기준), 384×128')

      // _attack의 가장 큰 프레임(원본 200px)이 0.4배로 축소되어 높이가 80±1px인지 확인
      const outAttack = readPngFile(attackRes.outPngPath)
      const middleFrame = sliceSheetFrame(outAttack, 1, 128)
      const bbox = findBoundingBox(middleFrame)!
      expect(Math.abs(bbox.height - 80)).toBeLessThanOrEqual(1)
      expect(bbox.maxY).toBe(BASELINE_Y)
    })
  })

  it('4) 덩어리 수가 허용 프레임 범위 밖이거나 계약에 없는 키이면 상세 정보와 함께 실패한다', () => {
    withTempWorkspace((ws) => {
      // 아군 피격은 1~3프레임만 허용하는데 5덩어리 시트를 넣음
      const fiveChunk = createFiveChunkSheet()
      ws.writePng(ws.joinPath(ws.inboxDir, 'ally_rifle_hit.png'), fiveChunk)

      expect(() =>
        processAllAssets({
          rootDir: ROOT_DIR,
          inboxDir: ws.inboxDir,
          sourceDir: ws.sourceDir,
          outAssetsDir: ws.outAssetsDir,
          ledgerPath: ws.ledgerPath,
          indexPath: ws.indexPath,
        })
      ).toThrow(/5덩어리.*1~3.*15\.\.74/)
    })

    withTempWorkspace((ws) => {
      // 계약에 없는 오타 키를 넣으면 가장 비슷한 키 3개를 보여 주며 실패
      const twoChunk = createTwoSoldierIdleSheet()
      ws.writePng(ws.joinPath(ws.inboxDir, 'ally_rifl_idle.png'), twoChunk)

      expect(() =>
        processAllAssets({
          rootDir: ROOT_DIR,
          inboxDir: ws.inboxDir,
          sourceDir: ws.sourceDir,
          outAssetsDir: ws.outAssetsDir,
          ledgerPath: ws.ledgerPath,
          indexPath: ws.indexPath,
        })
      ).toThrow(/ally_rifle_idle/)
    })
  })

  it('5) bg_ 키는 마젠타 제거를 하지 않고 720×1560 cover 크기로 자른다', () => {
    withTempWorkspace((ws) => {
      const bgRaw = createMagentaBackgroundFixture(1000, 2000)
      ws.writePng(ws.joinPath(ws.inboxDir, 'bg_gate.png'), bgRaw)

      const res = processAssetKey('bg_gate', {
        rootDir: ROOT_DIR,
        inboxDir: ws.inboxDir,
        sourceDir: ws.sourceDir,
        outAssetsDir: ws.outAssetsDir,
        ledgerPath: ws.ledgerPath,
        indexPath: ws.indexPath,
      })

      expect(res.width).toBe(720)
      expect(res.height).toBe(1560)
      expect(res.frames).toBe(1)

      const outBg = readPngFile(res.outPngPath)
      expect(outBg.width).toBe(720)
      expect(outBg.height).toBe(1560)

      // 정중앙 픽셀(360, 780)의 마젠타(#FF00FF)가 지워지지 않고 불투명(a=255)으로 남아 있어야 한다
      const centerPx = getPixel(outBg, 360, 780)
      expect(centerPx.r).toBe(255)
      expect(centerPx.g).toBe(0)
      expect(centerPx.b).toBe(255)
      expect(centerPx.a).toBe(255)

      // 가장자리 픽셀(10, 10)도 불투명 배경색으로 유지되어야 한다
      const cornerPx = getPixel(outBg, 10, 10)
      expect(cornerPx.a).toBe(255)
    })
  })
})


describe('T-111 모션 프레임 상한', () => {
  it('6프레임 대기 시트를 처리하고 결과 계약 검사도 통과한다', () => {
    withTempWorkspace((ws) => {
      const sheet = createTwoSoldierIdleSheet()
      // 두 프레임 시트 세 장을 가로로 이어 붙여 실제 처리 입력을 만든다.
      const six = createMagentaBackgroundFixture(sheet.width * 3, sheet.height)
      for (let y = 0; y < sheet.height; y++) {
        const row = sheet.data.subarray(y * sheet.width * 4, (y + 1) * sheet.width * 4)
        for (let i = 0; i < 3; i++) six.data.set(row, (y * six.width + i * sheet.width) * 4)
      }
      ws.writePng(ws.joinPath(ws.inboxDir, 'ally_rifle_idle.png'), six)
      const options = { rootDir: ROOT_DIR, inboxDir: ws.inboxDir, sourceDir: ws.sourceDir, outAssetsDir: ws.outAssetsDir, ledgerPath: ws.ledgerPath, indexPath: ws.indexPath }
      const res = processAssetKey('ally_rifle_idle', options)
      expect(res.frames).toBe(6)
      expect(checkAssets({ rootDir: ROOT_DIR, assetsDir: ws.outAssetsDir, ledgerPath: ws.ledgerPath, indexPath: ws.indexPath }).ok).toBe(true)
    })
  })
  it('대기 7프레임은 상한 초과로 거절한다', () => {
    const contract = loadAssetContracts(ROOT_DIR).find((c) => c.key === 'ally_rifle_idle')!
    const sheet = createMagentaBackgroundFixture(128, 128)
    // 처리 파이프라인의 최종 병합에서도 범위를 검사한다.
    expect(() => mergeFramesToSheet(Array(7).fill(sheet), contract)).toThrow('계약 범위(2~6)')
  })
})
